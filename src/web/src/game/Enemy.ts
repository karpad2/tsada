import * as THREE from 'three'
import { GameManager }             from './GameManager.ts'
import { hasLOS, ENEMY_TYPES }     from './enemy/EnemyTypes.ts'
import { buildMesh }               from './enemy/EnemyMesh.ts'

// ── Stealth-phase AI ────────────────────────────────────────
import {
  handlePatrolDetection, handleEscortExit, handleCuffExit,
  doPatrol, doEscort, doCuff, doSearch,
} from './enemy/stealth.ts'

// ── Loud-phase AI ───────────────────────────────────────────
import {
  handleCombatTracking, handleSearchRedetect,
  doCombat, doRetreat,
} from './enemy/loud.ts'

// Shared scratch objects — avoids allocations in hot paths (called every frame)
const _tmp1 = new THREE.Vector3()
const _tmpBox = new THREE.Box3()

// Module-level list of all active enemy positions — updated by Engine before tick
// Used for enemy-enemy separation so guards don't overlap
let _allEnemyPositions: THREE.Vector3[] = []
export function setEnemyPositions(positions: THREE.Vector3[]) { _allEnemyPositions = positions }

export { hasLOS }

export { ENEMY_TYPES } from './enemy/EnemyTypes.ts'

export class Enemy {
  constructor(scene, position, type = 'guard') {
    if (type === true)  type = 'cop_pistol'   // backward compat
    if (type === false) type = 'guard'

    this.scene    = scene
    this.type     = type
    this._cfg     = ENEMY_TYPES[type] ?? ENEMY_TYPES.cop_pistol
    this.isPolice = this._cfg.tier !== 'guard'

    this.netId     = -1       // assigned by host for co-op sync
    this.state     = 'PATROL'
    this.maxHealth = this._cfg.hp
    this.health    = this.maxHealth
    this.damage    = this._cfg.dmg
    this.speed     = this._cfg.spd
    this.shootInterval  = this._cfg.interval
    this._shootTimer    = 0
    this.detectionRange = 18

    // Shield
    this._shieldHp    = this._cfg.shieldHp ?? 0
    this._shieldMesh  = null   // set by buildMesh if hasShield

    // Taser
    this.onTaserHit   = null   // (stunDuration) => void — set by Engine

    // Sniper laser & warning shot
    this._warningShot    = false   // true after first (warning) shot fired
    this._laserLine      = null    // THREE.Line for laser sight
    this._laserMat       = null
    this._sniperElevated = false

    // Keycard (attached after construction by attachKeycard())
    this._hasKeycard     = false
    this._keycardId      = null     // keycard ID string
    this._keycardStolen  = false    // true = player pickpocketed it
    this._keycardMesh    = null
    this._keycardLanyard = null

    this.combatRange    = this._cfg.range
    this.patrolPoints   = []
    this._patrolIdx     = 0
    this._retreatTarget = null
    this._walkTime      = Math.random() * Math.PI * 2

    // Escort / cuff state
    this._escortTimer       = 0
    this._escortNoticeTimer = 0
    this._escortAnchor      = null
    this._cuffDone          = false

    // Callbacks set by Engine
    this.onHitPlayer    = null
    this.onLayMine      = null
    this.onDeploySentry = null
    this.onDeployDroneTurret  = null
    this.onThrowMolotov       = null
    this.onThrowFlashbang     = null
    this.onCallReinforcements = null
    this.onCuffPlayer   = null
    this.onEscortFire   = null
    this.onDropLoot     = null   // (pos, tier) → called on death; Engine spawns pickups

    // Chase / search
    this._lastKnownPos = null
    this._losLostTimer = 0
    this._searchTimer  = 0
    this._searchTarget = null

    // Status effects
    this._slowTimer    = 0
    this._slowMult     = 1.0
    this._wanderTarget = null
    this._aimTarget    = null

    // Special ability state
    this._mineTimer         = Math.random() * 5
    this._spinupTimer       = 0
    this._sentryDeployTimer = 0
    this._sentryDeployed    = false
    this._stunTimer         = 0
    this._flashbangTimer    = Math.random() * 4   // stagger so not all throw at once
    this._commandTimer      = Math.random() * 10
    this._smokeSuppressed   = false   // set by Engine each frame if smoke cloud in LOS
    this._stuckTime         = 0
    this._pathOffset        = (Math.random() - 0.5) * 2
    this._pathOffsetTimer   = 0

    // Waterfall navigation
    this._navTarget         = null   // current intermediate waypoint
    this._navTimer          = 0      // how long trying to reach current waypoint
    this._navFinalTarget    = null   // the ultimate goal position
    this._navLastPos        = null   // position last frame (to detect stuck)
    this._navExploreDir     = 0      // rotating explore scan angle when fully stuck

    // Destructibles ref (set by Engine for cover system)
    this._destructibles     = null

    // Cover system
    this._coverTarget       = null   // THREE.Vector3 — position behind cover
    this._coverPeekPos      = null   // THREE.Vector3 — position to peek from
    this._inCover           = false  // currently sheltering
    this._coverTimer        = 0      // time in current cover phase
    this._coverPeekDur      = 0      // how long to peek before hiding
    this._coverHideDur      = 0      // how long to hide before peeking
    this._coverSearchTimer  = 0      // cooldown before searching for new cover
    this._coverProp         = null   // ref to destructible being used as cover

    // Combat delay: can't shoot for 1s after first entering combat
    this._combatDelay       = 0

    // Co-op: client-side lerp targets (set by host snapshots)
    this._netTarget         = null   // THREE.Vector3 target position
    this._netTargetRY       = 0      // target rotation Y

    this.group = new THREE.Group()
    this.group.position.set(position.x, 0, position.z)
    buildMesh(this.group, this._cfg, this)
    scene.add(this.group)
  }

  stun(duration) {
    this._stunTimer = Math.max(this._stunTimer, duration)
  }

  // ── Per-frame update: delegates to stealth.ts / loud.ts ──────
  update(delta, playerFloorPos, playerEyePos, wallBoxes, moveBoxes) {
    if (this.state === 'DEAD' || this.state === 'SURRENDERED' || this.state === 'TIED') return
    const _moveBoxes = moveBoxes ?? wallBoxes

    // Flashbang stun
    if (this._stunTimer > 0) { this._stunTimer -= delta; return }

    this._shootTimer -= delta

    // Minigun barrel spin
    if (this._minigunBarrels && this.state === 'COMBAT') {
      const spinRate = this._cfg.spinup ? Math.min(1, this._spinupTimer / this._cfg.spinup) : 1
      this._minigunBarrels.rotation.z += delta * spinRate * 18
    }

    const enemyEye  = this.group.position.clone(); enemyEye.y = 1.55
    const dist      = this.group.position.distanceTo(playerFloorPos)
    const hasVision = !this._smokeSuppressed && dist < this.combatRange && hasLOS(enemyEye, playerEyePos, wallBoxes)

    // FOV check — 120° cone or very close
    const _fwd = new THREE.Vector3(); this.group.getWorldDirection(_fwd); _fwd.y = 0
    const _toP = new THREE.Vector3(playerFloorPos.x - this.group.position.x, 0, playerFloorPos.z - this.group.position.z)
    if (_fwd.lengthSq() > 0.001) _fwd.normalize()
    if (_toP.lengthSq() > 0.001) _toP.normalize()
    const inFOV = _fwd.dot(_toP) > 0.5 || dist < 2.0

    // ── State transitions (stealth.ts / loud.ts) ────────────────
    if (this.state === 'PATROL')  handlePatrolDetection(this, delta, hasVision, inFOV, dist, playerFloorPos)
    if (this.state === 'COMBAT')  handleCombatTracking(this, delta, hasVision, playerFloorPos)
    if (this.state === 'SEARCH')  handleSearchRedetect(this, hasVision, playerFloorPos)
    if (this.state === 'ESCORT')  handleEscortExit(this, playerFloorPos)
    if (this.state === 'CUFF')    handleCuffExit(this, playerFloorPos)

    // ── Behavior dispatch ───────────────────────────────────────
    switch (this.state) {
      case 'PATROL':  doPatrol(this, delta, _moveBoxes);  break
      case 'COMBAT':  doCombat(this, delta, playerFloorPos, playerEyePos, dist, hasVision, _moveBoxes, wallBoxes, this._destructibles); break
      case 'SEARCH':  doSearch(this, delta, _moveBoxes);  break
      case 'RETREAT': doRetreat(this, delta, _moveBoxes); break
      case 'ESCORT':  doEscort(this, delta, playerFloorPos, _moveBoxes); break
      case 'CUFF':    doCuff(this, delta, playerFloorPos, dist, _moveBoxes); break
    }

    // ── Walk animation ──────────────────────────────────────────
    const isActive = ['COMBAT', 'RETREAT', 'SEARCH', 'ESCORT', 'CUFF'].includes(this.state)
    this._walkTime += delta * (isActive ? 8 : 5)
    const sw = Math.sin(this._walkTime) * 0.40

    if (this._legL) this._legL.rotation.x =  sw
    if (this._legR) this._legR.rotation.x = -sw

    if (this.state === 'COMBAT' || this.state === 'SEARCH') {
      let aimRot = Math.PI * 0.50
      if (this._aimTarget) {
        const dx    = this._aimTarget.x - this.group.position.x
        const dz    = this._aimTarget.z - this.group.position.z
        const hDist = Math.max(Math.sqrt(dx * dx + dz * dz), 0.5)
        const pitch = Math.atan2(this._aimTarget.y - 1.22, hDist)
        aimRot      = Math.PI * 0.5 - pitch
      }
      if (this._armR) this._armR.rotation.x = aimRot
      if (this._armL) this._armL.rotation.x = aimRot - 0.18
    } else {
      if (this._armL) this._armL.rotation.x = -sw * 0.6
      if (this._armR) this._armR.rotation.x =  sw * 0.6
    }
  }

  // ── Shared movement / collision ───────────────────────────────

  _spawnMuzzleFlash() {
    const pos = this.group.position.clone(); pos.y += 1.22
    const fwd = new THREE.Vector3(0, 0, -1.1)
    fwd.applyEuler(new THREE.Euler(0, this.group.rotation.y, 0, 'YXZ'))
    pos.add(fwd)
    const light = new THREE.PointLight(0xff7700, 6, 8)
    light.position.copy(pos)
    this.scene.add(light)
    setTimeout(() => this.scene.remove(light), 85)
  }

  _moveTo(target, speed, delta, wallBoxes) {
    if (this._slowTimer > 0) { this._slowTimer -= delta; speed *= this._slowMult }
    const myPos = this.group.position
    const distFinal = myPos.distanceTo(target)
    if (distFinal < 0.2) return

    // ── Direction from flow field (primary) or direct-to-target (fallback) ──
    let dirX: number, dirZ: number
    const flowDir = this._navGrid?.getDir(myPos)
    if (flowDir && distFinal > 1.5) {
      dirX = flowDir.x
      dirZ = flowDir.z
    } else {
      // Close enough or no flow field — go direct
      dirX = target.x - myPos.x
      dirZ = target.z - myPos.z
      const dl = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
      dirX /= dl; dirZ /= dl
    }

    // Subtle lateral offset so enemies don't all walk the exact same line
    this._pathOffsetTimer = (this._pathOffsetTimer ?? 0) + delta
    if (this._pathOffsetTimer > 3.0 || this._pathOffset == null) {
      this._pathOffset = (Math.random() - 0.5) * 1.5
      this._pathOffsetTimer = 0
    }
    const lateralFade = Math.min(1, distFinal / 6) * 0.3
    dirX += (-dirZ) * this._pathOffset * lateralFade
    dirZ += ( dirX) * this._pathOffset * lateralFade

    // Enemy-enemy separation
    let sepX = 0, sepZ = 0
    for (const op of _allEnemyPositions) {
      if (op === myPos) continue
      const dx = myPos.x - op.x, dz = myPos.z - op.z
      const d2 = dx * dx + dz * dz
      if (d2 < 4.0 && d2 > 0.001) {
        const d = Math.sqrt(d2)
        const str = Math.min(4.0, 1.0 / d2) * 0.8
        sepX += (dx / d) * str
        sepZ += (dz / d) * str
      }
    }

    // Combine and move
    const moveX = dirX + sepX
    const moveZ = dirZ + sepZ
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ) || 1
    const step = speed * delta
    const np = myPos.clone()
    np.x += (moveX / len) * step
    np.z += (moveZ / len) * step
    np.y = this._sniperElevated ? (this._cfg?.elevate ?? 0) : 0

    const moved = this._tryMove(np, wallBoxes)
    if (moved) {
      _tmp1.set(dirX, 0, dirZ)
      this.group.lookAt(myPos.clone().add(_tmp1))
      // Deposit pheromone on successful movement (ant trail)
      this._navGrid?.deposit(myPos)
    }

    // Stuck detection — if barely moved for 5s, teleport toward target
    if (this._navLastPos) {
      const m = Math.abs(myPos.x - this._navLastPos.x) + Math.abs(myPos.z - this._navLastPos.z)
      if (m < speed * delta * 0.1) {
        this._stuckTime = (this._stuckTime ?? 0) + delta
      } else {
        this._stuckTime = 0
      }
    }
    this._navLastPos = myPos.clone()

    if ((this._stuckTime ?? 0) > 5 && distFinal > 5) {
      // Find a walkable position near target
      for (let r = 2; r <= 10; r += 2) {
        let found = false
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2
          const tx = target.x + Math.sin(ang) * r
          const tz = target.z + Math.cos(ang) * r
          if (this._testPos(tx, tz, wallBoxes)) {
            myPos.set(tx, 0, tz)
            this._stuckTime = 0
            found = true
            break
          }
        }
        if (found) break
      }
    }
  }

  _testPos(x, z, wallBoxes) {
    if (this._sniperElevated) return true   // elevated snipers move freely above walls
    _tmpBox.min.set(x - 0.32, 0, z - 0.32)
    _tmpBox.max.set(x + 0.32, 2.0, z + 0.32)
    return !wallBoxes.some(b => b.intersectsBox(_tmpBox))
  }

  _tryMove(np, wallBoxes) {
    const px = this.group.position.x, pz = this.group.position.z

    if (this._testPos(np.x, np.z, wallBoxes)) {
      this.group.position.copy(np); return true
    }
    if (Math.abs(np.x - px) > 0.001 && this._testPos(np.x, pz, wallBoxes)) {
      this.group.position.x = np.x; return true
    }
    if (Math.abs(np.z - pz) > 0.001 && this._testPos(px, np.z, wallBoxes)) {
      this.group.position.z = np.z; return true
    }
    const dx = np.x - px, dz = np.z - pz
    const step = Math.sqrt(dx * dx + dz * dz) || 0.05
    const perpX = -dz / step * step, perpZ = dx / step * step
    if (this._testPos(px + perpX, pz + perpZ, wallBoxes)) {
      this.group.position.x = px + perpX
      this.group.position.z = pz + perpZ
      return true
    }
    if (this._testPos(px - perpX, pz - perpZ, wallBoxes)) {
      this.group.position.x = px - perpX
      this.group.position.z = pz - perpZ
      return true
    }
    return false
  }

  /** Attach a visible keycard to this guard's belt. Call after construction. */
  attachKeycard(keycardId) {
    this._hasKeycard = true
    this._keycardId  = keycardId
    const HIP = 0.62
    const kcMat  = new THREE.MeshLambertMaterial({ color: 0xdddddd })
    const kcCard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.02), kcMat)
    kcCard.position.set(0.42, HIP + 0.04, 0.08)
    kcCard.castShadow = true
    this.group.add(kcCard)
    // Lanyard clip
    const lanyardMat = new THREE.MeshLambertMaterial({ color: 0x2255cc })
    const lanyard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.02), lanyardMat)
    lanyard.position.set(0.42, HIP + 0.18, 0.08)
    this.group.add(lanyard)
    // Blue stripe on card
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, 0.005), new THREE.MeshLambertMaterial({ color: 0x2255cc }))
    stripe.position.set(0, 0.04, 0.012)
    kcCard.add(stripe)
    this._keycardMesh    = kcCard
    this._keycardLanyard = lanyard
  }

  /** Remove keycard visuals (after pickpocket). */
  removeKeycard() {
    this._keycardStolen = true
    if (this._keycardMesh)    { this.group.remove(this._keycardMesh);    this._keycardMesh = null }
    if (this._keycardLanyard) { this.group.remove(this._keycardLanyard); this._keycardLanyard = null }
  }

  /** Dominate: player shouts at guard → surrenders.
   *  Works on PATROL/SEARCH/ESCORT/CUFF anytime, COMBAT only during delay. */
  dominate() {
    if (this.state === 'DEAD' || this.state === 'SURRENDERED' || this.state === 'TIED') return false
    if (this.state === 'COMBAT' && this._combatDelay <= 0 && this._stunTimer <= 0) return false   // already shooting (stunned enemies can be dominated)
    this.state = 'SURRENDERED'
    this._combatDelay = 0
    // Kneel pose
    this.group.position.y = -0.36
    this.group.rotation.x = 0.12
    // Cancel any radio in progress
    this._radioStarted = true   // prevent new radio
    return true
  }

  /** Tie up a surrendered guard. */
  tieUp() {
    if (this.state !== 'SURRENDERED') return false
    this.state = 'TIED'
    this.group.position.y = -0.44
    // Orange zip-tie
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0xff6600 })
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), ropeMat)
    rope.position.set(0, 0.92, -0.18)
    this.group.add(rope)
    return true
  }

  takeDamage(amount, source?: string) {
    if (this.state === 'DEAD') return
    this.health -= amount
    // Shotgun / explosive can sever limbs
    if ((source === 'shotgun' || source === 'explosive') && Math.random() < 0.2) this._severLimb()
    if (this.health <= 0) this._removeSelf(false)
  }

  /** Detach a random remaining limb — it flies off with ragdoll physics */
  _severLimb() {
    const limbs = [this._legL, this._legR, this._armL, this._armR].filter(l => l && l.parent)
    if (limbs.length === 0) return
    const limb = limbs[Math.floor(Math.random() * limbs.length)]

    // Compute world transform before detaching
    this.group.updateMatrixWorld(true)
    const wp = new THREE.Vector3(); limb.getWorldPosition(wp)
    const wq = new THREE.Quaternion(); limb.getWorldQuaternion(wq)
    limb.removeFromParent()

    // Create a standalone group for the severed limb's meshes
    const detached = new THREE.Group()
    detached.position.copy(wp)
    detached.quaternion.copy(wq)
    // Move children from limb pivot into detached group (preserving local offsets)
    while (limb.children.length > 0) {
      const child = limb.children[0]
      child.removeFromParent()
      detached.add(child)
    }
    this.scene.add(detached)

    // Ragdoll the severed part
    const vel = new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 2, (Math.random() - 0.5) * 4)
    const angVel = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 10)
    let settled = false
    const tick = () => {
      if (settled) return
      vel.y -= 9.8 * 0.016
      detached.position.addScaledVector(vel, 0.016)
      detached.rotation.x += angVel.x * 0.016
      detached.rotation.z += angVel.z * 0.016
      if (detached.position.y <= 0.05) {
        detached.position.y = 0.05
        if (vel.y < -1) { vel.y *= -0.2; vel.x *= 0.3; vel.z *= 0.3; angVel.multiplyScalar(0.2) }
        else settled = true
      }
      if (!settled) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    setTimeout(() => this.scene.remove(detached), 10000)
  }

  beginRetreat(target) {
    if (this.state === 'DEAD') return
    this.state = 'RETREAT'; this._retreatTarget = target.clone()
  }

  _removeSelf(silent) {
    this.state = 'DEAD'
    // Clean up sniper laser
    if (this._laserLine) {
      this.scene.remove(this._laserLine)
      this._laserLine.geometry.dispose()
      this._laserMat?.dispose()
      this._laserLine = null
    }
    if (!silent) {
      GameManager.onEnemyKilled()
      if (this.onDropLoot) this.onDropLoot(this.group.position.clone(), this._cfg?.tier ?? 'light')
    }

    // ── Ragdoll: body stays together, slumps with limp limbs ──
    // Make limbs go limp (random rotations)
    if (this._armL && this._armL.parent) this._armL.rotation.x = 0.2 + Math.random() * 0.5
    if (this._armR && this._armR.parent) this._armR.rotation.x = 0.2 + Math.random() * 0.5
    if (this._legL) this._legL.rotation.x = -(0.1 + Math.random() * 0.3)
    if (this._legR) this._legR.rotation.x =  (0.1 + Math.random() * 0.3)

    // Physics: the whole group gets a small push + falls
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      0.3 + Math.random() * 0.5,
      (Math.random() - 0.5) * 1.5,
    )
    // Tilt direction — fall sideways or backwards
    const tiltDir = (Math.random() < 0.5 ? 1 : -1)
    const tiltAxis = Math.random() < 0.5 ? 'z' : 'x'   // fall sideways or forward/backward
    const tiltSpeed = tiltDir * (3 + Math.random() * 2)
    let settled = false

    const tick = () => {
      if (settled) { return }
      vel.y -= 9.8 * 0.016
      this.group.position.addScaledVector(vel, 0.016)
      // Tilt the body over
      if (tiltAxis === 'z') {
        this.group.rotation.z += tiltSpeed * 0.016
      } else {
        this.group.rotation.x += tiltSpeed * 0.016
      }
      // Ground collision
      if (this.group.position.y <= -0.5) {
        this.group.position.y = -0.5
        if (vel.y < -0.5) {
          vel.y *= -0.15; vel.x *= 0.2; vel.z *= 0.2
        } else {
          settled = true
        }
      }
      if (!settled) this._animId = requestAnimationFrame(tick)
    }
    this._animId = requestAnimationFrame(tick)

    // Loud phase: auto-cleanup after 8s; stealth: body persists for bagging
    if (GameManager.isLoudPhase()) {
      setTimeout(() => { cancelAnimationFrame(this._animId); this.scene.remove(this.group) }, 8000)
    }
  }
}
