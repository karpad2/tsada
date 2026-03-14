// ─────────────────────────────────────────────────────────────
// Stealth-phase enemy AI: patrol detection, escort, cuff, search
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three'
import { GameManager } from '../GameManager.ts'
import { state }       from '../state.ts'

/**
 * PATROL → COMBAT / ESCORT / CUFF transitions.
 * Called each frame while enemy is in PATROL and phase is not loud.
 */
export function handlePatrolDetection(e, delta, hasVision, inFOV, dist, playerFloorPos) {
  if (GameManager.isLoudPhase()) {
    e.state = 'COMBAT'
    e._lastKnownPos = playerFloorPos.clone()
    e._losLostTimer = 0
    return
  }

  // Disguise: enemy uniform confuses guards (not in secure zone, mask off only)
  if (state.wearingDisguise && !GameManager.isMaskOn() && !state.playerInSecureZone) {
    e._escortNoticeTimer = 0
    GameManager.decayDetection(8, delta)
    return
  }

  if (hasVision && inFOV && dist < e.detectionRange) {
    if (GameManager.isMaskOn()) {
      // Masked: build detection normally (40/s)
      const concealPenalty = Math.max(0, 10 - state.concealment) * 2
      GameManager.addEnemyDetection(40 + concealPenalty, delta)
      state.detectionRate = GameManager.getDetectionRate()
      if (GameManager.getDetectionRate() >= 100) {
        e.state = 'COMBAT'
        e._lastKnownPos = playerFloorPos.clone()
        e._losLostTimer = 0
        e._combatDelay = 5.0
      }
    } else if (state.playerInSecureZone) {
      // Unmasked in SECURE zone: rush to cuff immediately
      e.state = 'CUFF'
      e._cuffDone = false
    } else if (state.currentZone?.type === 'private') {
      // Unmasked in PRIVATE zone: build notice timer, then enter ESCORT
      e._escortNoticeTimer += delta
      GameManager.addEnemyDetection(60, delta)
      state.detectionRate = GameManager.getDetectionRate()
      if (e._escortNoticeTimer >= 0.8) {
        e._escortNoticeTimer = 0
        e.state         = 'ESCORT'
        e._escortTimer  = 0
        e._escortAnchor = null
        e._cuffDone     = false
      }
    } else {
      // Public zone or no zone: reset notice timer
      e._escortNoticeTimer = 0
      // Public zone with weapon visible: minor detection
      const concealPenalty = Math.max(0, 10 - state.concealment) * 2
      if (concealPenalty > 0) {
        GameManager.addEnemyDetection(concealPenalty, delta)
        state.detectionRate = GameManager.getDetectionRate()
        if (GameManager.getDetectionRate() >= 100) {
          e.state = 'COMBAT'
          e._lastKnownPos = playerFloorPos.clone()
          e._losLostTimer = 0
          e._radioTimer = 3.0
          e._combatDelay = 5.0
        }
      }
    }
  } else if (!GameManager.isLoudPhase()) {
    e._escortNoticeTimer = 0
    GameManager.decayDetection(8, delta)
  }
}

/** ESCORT exit conditions: loud/mask → COMBAT, secure zone → CUFF, public → PATROL */
export function handleEscortExit(e, playerFloorPos) {
  if (GameManager.isLoudPhase() || GameManager.isMaskOn()) {
    e.state = 'COMBAT'
    e._lastKnownPos = playerFloorPos.clone()
    e._losLostTimer = 0
  } else if (state.playerInSecureZone) {
    e.state = 'CUFF'; e._cuffDone = false
  } else if (!state.currentZone || state.currentZone.type === 'public') {
    e.state = 'PATROL'
  }
}

/** CUFF exit on loud/mask */
export function handleCuffExit(e, playerFloorPos) {
  if (GameManager.isLoudPhase() || GameManager.isMaskOn()) {
    e.state = 'COMBAT'
    e._lastKnownPos = playerFloorPos.clone()
    e._losLostTimer = 0
  }
}

// ── Behavior methods ────────────────────────────────────────

export function doPatrol(e, delta, wallBoxes) {
  if (!e.patrolPoints.length) return
  const target = e.patrolPoints[e._patrolIdx]
  e._moveTo(target, 2.2, delta, wallBoxes)
  if (e.group.position.distanceTo(target) < 0.9)
    e._patrolIdx = (e._patrolIdx + 1) % e.patrolPoints.length
}

export function doEscort(e, delta, playerFloorPos, wallBoxes) {
  const flat = new THREE.Vector3(playerFloorPos.x, e.group.position.y, playerFloorPos.z)
  const dist = flat.distanceTo(e.group.position)

  if (!e._escortAnchor) {
    if (dist > 3.0) {
      e._moveTo(playerFloorPos, e.speed * 0.8, delta, wallBoxes)
      e.group.lookAt(flat)
      return
    }
    e._escortAnchor = e.group.position.clone()
  }

  e.group.lookAt(flat)
  e._escortTimer += delta
  state.escortEscalated = e._escortTimer > 5

  if (e._escortTimer > 8) {
    state.escortEscalated = false
    if (e.onEscortFire) e.onEscortFire()
    e.state = 'COMBAT'
    e._lastKnownPos = playerFloorPos.clone()
    e._losLostTimer = 0
    e._combatDelay = 5.0
  }
}

export function doCuff(e, delta, playerFloorPos, dist, wallBoxes) {
  if (dist > 1.5) {
    e._moveTo(playerFloorPos, e.speed * 1.2, delta, wallBoxes)
  } else if (!e._cuffDone) {
    e._cuffDone = true
    if (e.onCuffPlayer) e.onCuffPlayer()
    e.state = 'PATROL'
    return
  }
  const flat = new THREE.Vector3(playerFloorPos.x, e.group.position.y, playerFloorPos.z)
  if (flat.distanceTo(e.group.position) > 0.1) e.group.lookAt(flat)
}

export function doSearch(e, delta, wallBoxes) {
  e._searchTimer -= delta
  if (e._searchTimer <= 0) { e.state = 'PATROL'; return }
  if (!e._searchTarget) return

  if (e.group.position.distanceTo(e._searchTarget) > 1.5) {
    e._moveTo(e._searchTarget, e.speed * 1.1, delta, wallBoxes)
  } else {
    if (!e._wanderTarget || e.group.position.distanceTo(e._wanderTarget) < 0.8) {
      const angle = Math.random() * Math.PI * 2
      e._wanderTarget = new THREE.Vector3(
        e._searchTarget.x + Math.sin(angle) * (1.5 + Math.random() * 2.5),
        0,
        e._searchTarget.z + Math.cos(angle) * (1.5 + Math.random() * 2.5),
      )
    }
    e._moveTo(e._wanderTarget, e.speed * 0.55, delta, wallBoxes)
  }
}
