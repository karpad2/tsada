import * as THREE from 'three'
import { Enemy }                   from './Enemy.ts'
import { hasLOS, ENEMY_TYPES }     from './enemy/EnemyTypes.ts'
import { buildDroneMesh }          from './enemy/DroneMesh.ts'
import { GameManager }             from './GameManager.ts'
import { state }                   from './state.ts'
import { sfx }                     from './SoundManager.ts'

/**
 * DroneEnemy — flying quadcopter enemy that ignores wall pathfinding.
 * Extends Enemy to reuse state machine, hitboxes, damage, netId, and callbacks.
 * Overrides: mesh (drone), movement (direct flight), death (sparks+fall).
 */
export class DroneEnemy extends Enemy {
  constructor(scene, position, type = 'drone_scout') {
    super(scene, position, type)

    // Remove the humanoid mesh that Enemy constructor added
    scene.remove(this.group)
    // Remove humanoid hitboxes from scene
    if (this.hitboxes) {
      for (const hb of this.hitboxes) scene.remove(hb)
    }

    this._flyHeight = this._cfg.flyHeight ?? 5
    this._bobPhase  = Math.random() * Math.PI * 2
    this._bombTimer = 0
    this._deathAnimId = 0

    // Build drone mesh
    buildDroneMesh(scene, position, this._cfg, this)
    this.group.position.y = this._flyHeight
  }

  // Override: direct flight toward target, no wall collision
  _moveTo(target, spd, delta) {
    if (this._slowTimer > 0) { this._slowTimer -= delta; spd *= this._slowMult }
    const myPos = this.group.position
    const dx = target.x - myPos.x
    const dz = target.z - myPos.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < 0.5) return

    const step = spd * delta
    myPos.x += (dx / dist) * step
    myPos.z += (dz / dist) * step

    // Face target (horizontal)
    this.group.lookAt(new THREE.Vector3(target.x, myPos.y, target.z))
  }

  // Override update: drone-specific behavior
  update(delta, playerFloorPos, playerEyePos, wallBoxes) {
    if (this.state === 'DEAD') return

    // Stunned
    if (this._stunTimer > 0) { this._stunTimer -= delta; return }

    this._shootTimer -= delta

    // Rotor spin
    for (const r of (this._rotors ?? [])) r.rotation.y += delta * 30

    // Bob up/down
    this._bobPhase += delta * 2
    this.group.position.y = this._flyHeight + Math.sin(this._bobPhase) * 0.3

    // Sync hitbox
    if (this._hitboxMesh) this._hitboxMesh.position.copy(this.group.position)

    const droneEye = this.group.position.clone()
    const dist = this.group.position.distanceTo(playerFloorPos)
    // Drones see from height — use wallBoxes for LOS but 360-degree FOV
    const hasVision = dist < this.combatRange && hasLOS(droneEye, playerEyePos, wallBoxes)

    // State transitions
    if (this.state === 'PATROL') {
      if (GameManager.isLoudPhase()) {
        this.state = 'COMBAT'
        this._lastKnownPos = playerFloorPos.clone()
        this._combatDelay = 1.5
      } else if (hasVision && dist < this.detectionRange) {
        if (GameManager.isMaskOn() || state.playerInSecureZone) {
          this.state = 'COMBAT'
          this._lastKnownPos = playerFloorPos.clone()
          this._combatDelay = 2.0
          GameManager.triggerAlarm()
        }
      }
    } else if (this.state === 'COMBAT') {
      // Drones fly over walls — always update last known pos (use playerFloorPos directly
      // when no LOS since we want them to pursue through/over obstacles, not circle outside)
      this._lastKnownPos = playerFloorPos.clone()
    }

    // Behavior
    switch (this.state) {
      case 'PATROL':
        if (this.patrolPoints.length) {
          const pt = this.patrolPoints[this._patrolIdx]
          const tgt = new THREE.Vector3(pt.x, 0, pt.z)
          this._moveTo(tgt, this.speed, delta)
          const pdx = this.group.position.x - pt.x
          const pdz = this.group.position.z - pt.z
          if (Math.sqrt(pdx * pdx + pdz * pdz) < 2)
            this._patrolIdx = (this._patrolIdx + 1) % this.patrolPoints.length
        }
        break

      case 'COMBAT': {
        if (this._combatDelay > 0) { this._combatDelay -= delta; break }
        const keepDist = this._cfg.keepDist ?? 6
        if (dist > keepDist + 3) {
          this._moveTo(playerFloorPos, this.speed, delta)
        } else if (dist < keepDist - 2) {
          const away = this.group.position.clone().sub(playerFloorPos).normalize()
          this.group.position.x += away.x * this.speed * 0.5 * delta
          this.group.position.z += away.z * this.speed * 0.5 * delta
        }
        // Face player
        this.group.lookAt(new THREE.Vector3(playerFloorPos.x, this.group.position.y, playerFloorPos.z))

        // Shoot / bomb
        if (this._shootTimer <= 0 && dist <= this.combatRange && hasVision) {
          this._shootTimer = this.shootInterval
          if (this._cfg.bombInterval) {
            // Bomber: drop bomb
            this._bombTimer += this.shootInterval
            if (this._bombTimer >= this._cfg.bombInterval) {
              this._bombTimer = 0
              if (this.onDropBomb) this.onDropBomb(this.group.position.clone(), playerFloorPos.clone())
            }
          } else {
            // Scout: direct fire
            if (this.onHitPlayer) this.onHitPlayer(this.damage)
          }
        }
        break
      }

      case 'SEARCH': {
        // Circle last known position
        if (this._searchTarget) {
          const angle = Date.now() * 0.001 * 1.5
          const circlePos = new THREE.Vector3(
            this._searchTarget.x + Math.sin(angle) * 5,
            0,
            this._searchTarget.z + Math.cos(angle) * 5,
          )
          this._moveTo(circlePos, this.speed * 0.5, delta)
        }
        this._searchTimer -= delta
        if (this._searchTimer <= 0) {
          this.state = 'PATROL'
          this._patrolIdx = 0
        }
        // Re-detect
        if (hasVision && dist < this.combatRange) {
          this.state = 'COMBAT'
          this._lastKnownPos = playerFloorPos.clone()
          this._combatDelay = 0.5
        }
        break
      }

      case 'RETREAT': {
        if (this._retreatTarget) {
          this._moveTo(this._retreatTarget, this.speed * 1.2, delta)
          const rd = this.group.position.distanceTo(this._retreatTarget)
          if (rd < 3) this._removeSelf(true)
        }
        break
      }
    }
  }

  // Override death: sparks + spin fall
  _removeSelf(silent) {
    if (this.state === 'DEAD') return
    this.state = 'DEAD'
    if (!silent) GameManager.onEnemyKilled()
    sfx.droneDeath()

    // Spark flash
    const sparkLight = new THREE.PointLight(0xffaa00, 6, 5)
    sparkLight.position.copy(this.group.position)
    this.scene.add(sparkLight)
    setTimeout(() => this.scene.remove(sparkLight), 300)

    // Fall + spin animation
    const startY = this.group.position.y
    let elapsed = 0
    const tick = () => {
      elapsed += 0.016
      this.group.position.y = Math.max(0.2, startY - elapsed * 8)
      this.group.rotation.z += 0.1
      this.group.rotation.x += 0.05
      // Sync hitbox during fall
      if (this._hitboxMesh) this._hitboxMesh.position.copy(this.group.position)
      if (this.group.position.y > 0.2) {
        this._deathAnimId = requestAnimationFrame(tick)
      }
    }
    this._deathAnimId = requestAnimationFrame(tick)

    // Cleanup after 5s
    setTimeout(() => {
      cancelAnimationFrame(this._deathAnimId)
      this.scene.remove(this.group)
      if (this._hitboxMesh) this.scene.remove(this._hitboxMesh)
    }, 5000)
  }

  // Override: retreat support
  beginRetreat(target) {
    if (this.state === 'DEAD') return
    this.state = 'RETREAT'
    this._retreatTarget = target.clone()
  }
}
