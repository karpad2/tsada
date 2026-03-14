// ─────────────────────────────────────────────────────────────
// Loud-phase enemy AI: combat, shooting, retreat, special abilities
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three'
import { hasLOS }  from './EnemyTypes.ts'

// ── Cover system helpers ─────────────────────────────────────
const _coverTmp = new THREE.Vector3()
const _coverCenter = new THREE.Vector3()

/**
 * Find a cover position behind a nearby destructible/prop relative to the player.
 * Returns { target, peekPos, prop } or null.
 */
function _findCover(ePos, playerFloor, destructibles, wallBoxes) {
  if (!destructibles?.length) return null
  let bestScore = Infinity
  let bestResult = null

  for (const d of destructibles) {
    if (d.shattered) continue
    d.box3.getCenter(_coverCenter)
    const propDist = ePos.distanceTo(_coverCenter)
    // Only consider props within 12m of enemy
    if (propDist > 12) continue
    // Prop should be roughly between enemy and player (or at least not behind enemy)
    const propToPlayer = _coverCenter.distanceTo(playerFloor)
    // The cover side: opposite from player
    const dx = _coverCenter.x - playerFloor.x
    const dz = _coverCenter.z - playerFloor.z
    const dl = Math.sqrt(dx * dx + dz * dz) || 1
    const nx = dx / dl, nz = dz / dl
    // Cover position: 1.2m past the prop center away from player
    const coverX = _coverCenter.x + nx * 1.2
    const coverZ = _coverCenter.z + nz * 1.2
    // Peek position: 1.5m to the side of cover (perpendicular)
    const peekX = _coverCenter.x + nz * 1.5
    const peekZ = _coverCenter.z - nx * 1.5
    // Score: prefer props that are close to enemy AND between enemy and player
    const score = propDist + Math.abs(propToPlayer - ePos.distanceTo(playerFloor)) * 0.5
    if (score < bestScore) {
      bestScore = score
      bestResult = {
        target: new THREE.Vector3(coverX, 0, coverZ),
        peekPos: new THREE.Vector3(peekX, 0, peekZ),
        prop: d,
      }
    }
  }
  return bestResult
}

/** COMBAT: track LOS — police enter SEARCH if LOS lost >1.8s */
export function handleCombatTracking(e, delta, hasVision, playerFloorPos) {
  if (hasVision) {
    e._lastKnownPos = playerFloorPos.clone()
    e._losLostTimer = 0
  } else {
    e._losLostTimer += delta
    if (e.isPolice && e._losLostTimer > 1.8) {
      e.state         = 'SEARCH'
      e._searchTarget = e._lastKnownPos ? e._lastKnownPos.clone() : e.group.position.clone()
      e._wanderTarget = null
      e._searchTimer  = 9.0
      e._losLostTimer = 0
    }
  }
}

/** SEARCH → COMBAT if enemy re-spots player */
export function handleSearchRedetect(e, hasVision, playerFloorPos) {
  if (hasVision) {
    e.state = 'COMBAT'
    e._lastKnownPos = playerFloorPos.clone()
    e._losLostTimer = 0
  }
}

/** Full combat behavior: movement, shooting, special abilities */
export function doCombat(e, delta, playerFloor, playerEye, dist, hasVision, wallBoxes, losBoxes, destructibles?) {
  const cfg = e._cfg

  // ── Combat delay: can't shoot for 1s after first entering combat
  if (e._combatDelay > 0) e._combatDelay -= delta

  // ── Baton: pure melee, charge the player (LOS required — no hitting through walls)
  if (cfg.melee) {
    if (dist > 1.0) e._moveTo(playerFloor, e.speed, delta, wallBoxes)
    const flat = new THREE.Vector3(playerFloor.x, e.group.position.y, playerFloor.z)
    if (flat.distanceTo(e.group.position) > 0.1) e.group.lookAt(flat)
    e._aimTarget = playerEye.clone()
    if (e._shootTimer <= 0 && dist <= cfg.range) {
      const eye = e.group.position.clone(); eye.y = 1.55
      if (hasLOS(eye, playerEye, losBoxes ?? wallBoxes)) {
        e._shootTimer = e.shootInterval
        if (e.onHitPlayer) e.onHitPlayer(e.damage)
      }
    }
    return
  }

  // ── Sentry deployer: advance until visible, then stop and deploy
  if (cfg.deploysSentry && !e._sentryDeployed) {
    if (hasVision) {
      e._sentryDeployTimer += delta
      if (e._sentryDeployTimer >= 2.0) {
        e._sentryDeployed = true
        if (e.onDeploySentry) e.onDeploySentry(e.group.position.clone())
        e._removeSelf(true)
        return
      }
    } else {
      if (dist > 5) e._moveTo(playerFloor, e.speed, delta, wallBoxes)
    }
    const flat = new THREE.Vector3(playerFloor.x, e.group.position.y, playerFloor.z)
    if (flat.distanceTo(e.group.position) > 0.1) e.group.lookAt(flat)
    e._aimTarget = playerEye.clone()
    return
  }

  // ── Drone turret deployer: same pattern, deploys hovering drone turret
  if (cfg.deploysDroneTurret && !e._sentryDeployed) {
    if (hasVision) {
      e._sentryDeployTimer += delta
      if (e._sentryDeployTimer >= 1.5) {
        e._sentryDeployed = true
        if (e.onDeployDroneTurret) e.onDeployDroneTurret(e.group.position.clone())
        e._removeSelf(true)
        return
      }
    } else {
      if (dist > 5) e._moveTo(playerFloor, e.speed, delta, wallBoxes)
    }
    const flat = new THREE.Vector3(playerFloor.x, e.group.position.y, playerFloor.z)
    if (flat.distanceTo(e.group.position) > 0.1) e.group.lookAt(flat)
    e._aimTarget = playerEye.clone()
    return
  }

  // ── Medic: prioritize moving toward wounded allies over chasing player
  let _medicMovedToAlly = false
  if (cfg.isMedic && e._nearbyAllies) {
    let woundedAlly = null, wDist = Infinity
    for (const ally of e._nearbyAllies) {
      if (ally === e || ally.state === 'DEAD') continue
      if (ally.health >= ally.maxHealth * 0.7) continue
      const d = e.group.position.distanceTo(ally.group.position)
      if (d < 12 && d < wDist) { wDist = d; woundedAlly = ally }
    }
    if (woundedAlly && wDist > (cfg.healRange ?? 3.5)) {
      e._moveTo(woundedAlly.group.position, e.speed, delta, wallBoxes)
      _medicMovedToAlly = true
    }
  }

  // ── Sniper: maintain standoff distance
  if (_medicMovedToAlly) {
    // Medic already moved toward wounded ally; skip normal movement
  } else if (cfg.keepDist) {
    const kd = cfg.keepDist
    if (dist < kd - 2) {
      const away = e.group.position.clone().sub(playerFloor).normalize()
      const np = e.group.position.clone().addScaledVector(away, e.speed * delta)
      np.y = 0; e._tryMove(np, wallBoxes)
    } else if (dist > kd + 6) {
      e._moveTo(playerFloor, e.speed * 0.7, delta, wallBoxes)
    }
  } else {
    // ── Cover-based combat movement ──────────────────────────
    e._coverSearchTimer = (e._coverSearchTimer ?? 0) - delta

    // If current cover prop got destroyed, clear it
    if (e._coverProp?.shattered) {
      e._coverTarget = null; e._coverPeekPos = null; e._coverProp = null
      e._inCover = false; e._coverSearchTimer = 1.0 // short delay before new search
    }

    // Find cover if we don't have any and cooldown expired
    if (!e._coverTarget && e._coverSearchTimer <= 0 && destructibles?.length) {
      const cover = _findCover(e.group.position, playerFloor, destructibles, wallBoxes)
      if (cover) {
        e._coverTarget   = cover.target
        e._coverPeekPos  = cover.peekPos
        e._coverProp     = cover.prop
        e._inCover       = false
        e._coverTimer    = 0
        e._coverHideDur  = 1.5 + Math.random() * 2   // hide 1.5-3.5s
        e._coverPeekDur  = 1.0 + Math.random() * 1.5  // peek 1-2.5s
      } else {
        e._coverSearchTimer = 3.0 // wait before searching again
      }
    }

    if (e._coverTarget) {
      // Have cover — use it
      const coverDist = e.group.position.distanceTo(e._coverTarget)
      if (coverDist > 1.5 && !e._inCover) {
        // Move to cover
        e._moveTo(e._coverTarget, e.speed, delta, wallBoxes)
      } else {
        // In cover area — alternate between hiding and peeking
        e._coverTimer += delta
        if (e._inCover) {
          // Hiding behind cover
          if (e._coverTimer >= e._coverHideDur) {
            e._inCover = false
            e._coverTimer = 0
            e._coverPeekDur = 1.0 + Math.random() * 1.5
          }
          // Stay at cover position
          if (coverDist > 0.5) e._moveTo(e._coverTarget, e.speed * 0.8, delta, wallBoxes)
        } else {
          // Peeking out to shoot
          if (e._coverTimer >= e._coverPeekDur) {
            e._inCover = true
            e._coverTimer = 0
            e._coverHideDur = 1.5 + Math.random() * 2
          }
          // Move toward peek position
          if (e._coverPeekPos) {
            const peekDist = e.group.position.distanceTo(e._coverPeekPos)
            if (peekDist > 0.5) e._moveTo(e._coverPeekPos, e.speed * 0.7, delta, wallBoxes)
          }
        }
      }
    } else {
      // No cover available — fallback to original rush/retreat behavior
      if (dist > 5) {
        e._moveTo(playerFloor, e.speed, delta, wallBoxes)
      } else if (dist < 3) {
        const away = e.group.position.clone().sub(playerFloor).normalize()
        const np = e.group.position.clone().addScaledVector(away, e.speed * 0.5 * delta)
        np.y = 0; e._tryMove(np, wallBoxes)
      }
    }
  }

  const flat = new THREE.Vector3(playerFloor.x, e.group.position.y, playerFloor.z)
  if (flat.distanceTo(e.group.position) > 0.1) e.group.lookAt(flat)
  e._aimTarget = playerEye.clone()

  // ── Flashbang throw (requires LOS + within range)
  if (cfg.flashbangInterval && hasVision && dist < 18) {
    e._flashbangTimer += delta
    if (e._flashbangTimer >= cfg.flashbangInterval) {
      e._flashbangTimer = 0
      if (e.onThrowFlashbang) e.onThrowFlashbang(e.group.position.clone(), playerFloor.clone())
    }
  }

  // ── Commander: call reinforcements on timer (LOS not required)
  if (cfg.commandInterval) {
    e._commandTimer += delta
    if (e._commandTimer >= cfg.commandInterval) {
      e._commandTimer = 0
      if (e.onCallReinforcements) e.onCallReinforcements(e.group.position.clone())
    }
  }

  // ── Mine drop
  if (cfg.mineInterval) {
    e._mineTimer += delta
    if (e._mineTimer >= cfg.mineInterval) {
      e._mineTimer = 0
      if (e.onLayMine) e.onLayMine(e.group.position.clone())
    }
  }

  // ── Minigun spinup gate
  if (cfg.spinup) {
    if (e._spinupTimer < cfg.spinup) { e._spinupTimer += delta; return }
  }

  // ── Sniper laser sight (visible when aiming in combat)
  if (cfg.keepDist && cfg.weapon === 'sniper' && hasVision) {
    const laserFrom = e.group.position.clone(); laserFrom.y = 1.55
    if (!e._laserLine) {
      e._laserMat = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4 })
      const geo = new THREE.BufferGeometry().setFromPoints([laserFrom, playerEye])
      e._laserLine = new THREE.Line(geo, e._laserMat)
      e.scene.add(e._laserLine)
    }
    const positions = e._laserLine.geometry.attributes.position
    positions.setXYZ(0, laserFrom.x, laserFrom.y, laserFrom.z)
    positions.setXYZ(1, playerEye.x, playerEye.y, playerEye.z)
    positions.needsUpdate = true
    e._laserLine.visible = true
    // Pulse opacity
    e._laserMat.opacity = 0.25 + Math.sin(Date.now() * 0.008) * 0.15
  } else if (e._laserLine) {
    e._laserLine.visible = false
  }

  // ── Shoot (blocked during combat delay)
  if (e._combatDelay > 0) return
  const eye      = e.group.position.clone(); eye.y = 1.55
  const canShoot = e._shootTimer <= 0 && dist <= e.combatRange && hasLOS(eye, playerEye, losBoxes ?? wallBoxes)
  if (!canShoot) return

  e._shootTimer = e.shootInterval

  // Sniper warning shot: first shot misses on purpose
  if (cfg.weapon === 'sniper' && !e._warningShot) {
    e._warningShot = true
    e._spawnMuzzleFlash()
    // Don't hit player — warning shot
    return
  }

  if (cfg.isTaser) {
    if (e.onTaserHit) e.onTaserHit(cfg.taserStunDuration ?? 1.5)
    if (e.onHitPlayer) e.onHitPlayer(e.damage)
    e._spawnMuzzleFlash()
  } else if (cfg.molotov) {
    if (e.onThrowMolotov) e.onThrowMolotov(e.group.position.clone(), playerFloor.clone())
  } else if (cfg.shotgun) {
    const PELLETS   = 5
    const hitChance = Math.max(0.10, 1 - dist / (e.combatRange * 2.0))
    for (let p = 0; p < PELLETS; p++) {
      if (Math.random() < hitChance && e.onHitPlayer)
        e.onHitPlayer(Math.ceil(e.damage / PELLETS))
    }
    e._spawnMuzzleFlash()
  } else {
    if (e.onHitPlayer) e.onHitPlayer(e.damage)
    if (cfg.weapon !== 'suppressed') e._spawnMuzzleFlash()
  }
}

export function doRetreat(e, delta, wallBoxes) {
  if (!e._retreatTarget) return
  e._moveTo(e._retreatTarget, e.speed * 1.3, delta, wallBoxes)
  if (e.group.position.distanceTo(e._retreatTarget) < 2) e._removeSelf(true)
}
