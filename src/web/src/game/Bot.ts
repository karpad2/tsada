// ─────────────────────────────────────────────────────────────
// Bot — AI companion teammate (DALLAS / WOLF / CHAINS)
// Behaviours: FOLLOW → COMBAT → REVIVING → DOWN → DEAD
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three'
import { hasLOS }      from './Enemy.ts'
import { GameManager } from './GameManager.ts'

export const BOT_NAMES   = ['DALLAS', 'WOLF', 'CHAINS']
const BOT_COLORS          = [0x4466ff, 0xff6622, 0x22cc66]

// Formation slots so bots don't pile up on the player
const BOT_OFFSETS = [
  { x: -1.8, z:  0.8 },
  { x:  1.8, z:  0.8 },
  { x:  0.0, z:  2.0 },
]

const SIGHT_RANGE   = 14    // m — how far bots see enemies
const COMBAT_RANGE  = 8     // m — preferred engagement distance
const REVIVE_TIME   = 3.0   // s — time to revive the player
const FIRE_RATE_MIN = 0.20
const FIRE_RATE_MAX = 0.40
const ENEMY_SUPPRESSION_INTERVAL = [0.5, 1.2]  // min/max seconds between enemy shots at bot
const BOT_DMG_MIN   = 8
const BOT_DMG_MAX   = 18
const HP_REGEN_DELAY = 10   // s — no-damage delay before HP regen kicks in
const HP_REGEN_RATE  = 12   // hp/s — regen speed
const BOT_REVIVE_HP  = 50   // HP restored when revived

export class Bot {
  group:    THREE.Group
  pos:      THREE.Vector3
  hp        = 100
  maxHp     = 100
  name:     string
  colorHex: number

  // ── aiState with change-callback ─────────────────────────────
  private _aiState = 'FOLLOW'
  get aiState()          { return this._aiState }
  set aiState(v: string) { if (v !== this._aiState) { this._aiState = v; this.onStateChange?.(v) } }

  /** Fires whenever aiState transitions (FOLLOW → COMBAT etc.). */
  onStateChange:  ((st: string) => void) | null = null
  /** Called when bot finishes reviving the player. */
  onRevivePlayer: (() => void) | null = null

  private _fireCd       = Math.random()     // stagger initial fire so bots don't burst together
  private _supDmgCd     = Math.random() * 1.5  // enemy suppression fire cooldown
  private _reviveT      = 0
  private _targetEnemy  = null
  private _offsetX:     number
  private _offsetZ:     number
  spawnPos:             THREE.Vector3 | null = null   // set by Engine after placement
  private _hpFill:      THREE.Mesh | null = null
  private _statusLight: THREE.PointLight | null = null
  private _noDmgTimer   = 0     // seconds since last damage taken

  constructor(scene: THREE.Scene, index: number) {
    this.name     = BOT_NAMES[index]
    this.colorHex = BOT_COLORS[index]
    this._offsetX = BOT_OFFSETS[index].x
    this._offsetZ = BOT_OFFSETS[index].z
    this.pos      = new THREE.Vector3()
    this.group    = this._buildMesh(scene)
  }

  // ── Mesh ────────────────────────────────────────────────────
  private _buildMesh(scene: THREE.Scene) {
    const suit = new THREE.MeshLambertMaterial({ color: this.colorHex})
    const blk  = new THREE.MeshLambertMaterial({ color: 0x111111})
    const msk  = new THREE.MeshLambertMaterial({ color: 0xdddddd})
    const gun  = new THREE.MeshLambertMaterial({ color: 0x1a1a1e})

    function bx(w, h, d, mat, x = 0, y = 0, z = 0) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      m.position.set(x, y, z); m.castShadow = true; return m
    }
    function arm(px) {
      const pivot = new THREE.Group(); pivot.position.set(px, SH, 0)
      const mesh  = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.58, 0.22), suit)
      mesh.position.y = -0.29; mesh.castShadow = true; pivot.add(mesh)
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), blk)
      hand.position.y = -0.58; pivot.add(hand)
      return pivot
    }

    const HIP = 0.62, SH = 1.22, HY = 1.60, EZ = 0.24

    const g = new THREE.Group()
    g.add(
      // Legs
      bx(0.24, HIP, 0.26, suit, -0.14, HIP / 2, 0),
      bx(0.24, HIP, 0.26, suit,  0.14, HIP / 2, 0),
      // Shoes
      bx(0.24, 0.12, 0.30, blk, -0.14, 0.08, 0.04),
      bx(0.24, 0.12, 0.30, blk,  0.14, 0.08, 0.04),
      // Torso
      bx(0.54, 0.64, 0.32, suit, 0, HIP + 0.32, 0),
      // Arms
      arm(-0.38), arm(0.38),
      // Gun in right hand
      bx(0.06, 0.10, 0.22, gun, 0.49, SH - 0.34, -0.14),
      // Head (balaclava in team colour)
      bx(0.46, 0.52, 0.46, suit, 0, HY, 0),
      // Hockey mask
      bx(0.40, 0.40, 0.05, msk,  0, HY + 0.02, EZ + 0.01),
      bx(0.09, 0.09, 0.07, blk, -0.11, HY + 0.07, EZ + 0.03),
      bx(0.09, 0.09, 0.07, blk,  0.11, HY + 0.07, EZ + 0.03),
      bx(0.22, 0.03, 0.07, blk,  0, HY - 0.10, EZ + 0.03),
    )

    // ── HP bar (plane above head) ─────────────────────────────
    const barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.07),
      new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide, depthWrite: false }),
    )
    barBg.position.set(0, HY + 0.58, 0)
    g.add(barBg)

    const fillMat = new THREE.MeshBasicMaterial({ color: this.colorHex, side: THREE.DoubleSide, depthWrite: false })
    const hpFill  = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.07), fillMat)
    hpFill.position.set(0, HY + 0.581, 0)
    g.add(hpFill)
    this._hpFill = hpFill

    // ── Tiny status light (colour = alive, dim when dead) ──────
    const light = new THREE.PointLight(this.colorHex, 0.4, 2.5)
    light.position.set(0, HY + 0.2, 0)
    g.add(light)
    this._statusLight = light

    scene.add(g)
    return g
  }

  private _syncHpBar() {
    if (!this._hpFill) return
    const pct = Math.max(0, this.hp / this.maxHp)
    this._hpFill.scale.x = pct
    this._hpFill.position.x = (pct - 1) * 0.26   // left-align
  }

  // ── Damage ──────────────────────────────────────────────────
  takeDamage(amount: number) {
    if (this.aiState === 'DEAD' || this.aiState === 'DOWN') return
    this._noDmgTimer = 0
    this.hp = Math.max(0, this.hp - amount)
    this._syncHpBar()
    if (this.hp <= 0) {
      this.aiState = 'DEAD'
      if (this._statusLight) this._statusLight.intensity = 0
      // Remove from scene immediately
      this.group.parent?.remove(this.group)
    }
  }

  // ── Revive bot (called by player) ─────────────────────────
  reviveBot() {
    if (this.aiState !== 'DOWN') return
    this.hp = BOT_REVIVE_HP
    this.aiState = 'FOLLOW'
    this._noDmgTimer = 0
    // Stand back up
    this.group.rotation.z = 0
    this.group.position.y = 0
    if (this._statusLight) { this._statusLight.intensity = 0.4; this._statusLight.color.set(this.colorHex) }
    this._syncHpBar()
  }

  // ── Per-frame update ─────────────────────────────────────────
  update(
    delta: number,
    playerPos: THREE.Vector3,
    enemies: any[],
    wallBoxes: THREE.Box3[],
    isPlayerDown: boolean,
  ) {
    if (this.aiState === 'DEAD' || this.aiState === 'DOWN') return

    this._fireCd   = Math.max(0, this._fireCd   - delta)
    this._supDmgCd = Math.max(0, this._supDmgCd - delta)

    // ── HP regen after 10s without taking damage ─────────────
    this._noDmgTimer += delta
    if (this._noDmgTimer >= HP_REGEN_DELAY && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + HP_REGEN_RATE * delta)
      this._syncHpBar()
    }

    // ── Billboard: rotate HP bar to always face +Z (approx) ───
    this._hpFill?.parent?.children
      .filter(c => c instanceof THREE.Mesh && (c.geometry as THREE.PlaneGeometry)?.type === 'PlaneGeometry')
      .forEach(c => { c.rotation.y = -this.group.rotation.y })

    // ── Reviving light pulse ───────────────────────────────────
    if (this.aiState === 'REVIVING' && this._statusLight) {
      this._statusLight.intensity = 0.6 + Math.sin(Date.now() * 0.008) * 0.35
      this._statusLight.color.set(0xffffff)
    } else if (this._statusLight) {
      this._statusLight.intensity = 0.4
      this._statusLight.color.set(this.colorHex)
    }

    // ── Player down → switch to REVIVING ──────────────────────
    if (isPlayerDown && this.aiState !== 'REVIVING') {
      this.aiState = 'REVIVING'; this._reviveT = 0
    }
    if (!isPlayerDown && this.aiState === 'REVIVING') {
      this.aiState = 'FOLLOW'; this._reviveT = 0
    }

    if (this.aiState === 'REVIVING') {
      this._doRevive(delta, playerPos, wallBoxes)
      return
    }

    // ── Suppression fire from enemies ──────────────────────────
    if (this._supDmgCd <= 0) {
      for (const e of enemies) {
        if (e.state !== 'COMBAT') continue
        const d = this.group.position.distanceTo(e.group.position)
        if (d < 10 && hasLOS(this.group.position, e.group.position, wallBoxes)) {
          this._supDmgCd = ENEMY_SUPPRESSION_INTERVAL[0]
            + Math.random() * (ENEMY_SUPPRESSION_INTERVAL[1] - ENEMY_SUPPRESSION_INTERVAL[0])
          this.takeDamage(BOT_DMG_MIN + Math.random() * (BOT_DMG_MAX - BOT_DMG_MIN))
          break
        }
      }
    }

    const isLoud = GameManager.isLoudPhase()

    // ── Find nearest enemy in LOS (only when loud) ─────────────
    let nearestEnemy = null, nearestDist = SIGHT_RANGE
    if (isLoud) {
      for (const e of enemies) {
        if (e.state === 'DEAD') continue
        const d = this.group.position.distanceTo(e.group.position)
        if (d < nearestDist && hasLOS(this.group.position, e.group.position, wallBoxes)) {
          nearestDist = d; nearestEnemy = e
        }
      }
    }

    if (nearestEnemy) {
      this.aiState = 'COMBAT'; this._targetEnemy = nearestEnemy
    } else if (this.aiState === 'COMBAT') {
      this.aiState = 'FOLLOW'; this._targetEnemy = null
    }

    // ── Combat ────────────────────────────────────────────────
    if (this.aiState === 'COMBAT' && this._targetEnemy?.state !== 'DEAD') {
      const toE = new THREE.Vector3().subVectors(this._targetEnemy.group.position, this.group.position)
      this.group.rotation.y = Math.atan2(toE.x, toE.z)

      // Advance toward enemy if too far, back away if too close
      if (nearestDist > COMBAT_RANGE) {
        this._moveXZ(this._targetEnemy.group.position, delta, 3.6, wallBoxes)
      } else if (nearestDist < 3.5) {
        const away = this.group.position.clone().sub(this._targetEnemy.group.position).normalize()
        this._tryMove(this.pos.x + away.x * 2.5 * delta, this.pos.z + away.z * 2.5 * delta, wallBoxes)
      }

      // Fire
      if (this._fireCd <= 0) {
        this._fireCd = FIRE_RATE_MIN + Math.random() * (FIRE_RATE_MAX - FIRE_RATE_MIN)
        this._targetEnemy.takeDamage(15 + Math.random() * 12)
      }

    // ── Follow / hold spawn ────────────────────────────────────
    } else {
      // In stealth: stay at spawn point; in loud: follow player
      const basePos = (!isLoud && this.spawnPos) ? this.spawnPos : playerPos
      const goal = new THREE.Vector3(
        basePos.x + (isLoud ? this._offsetX : 0), 0, basePos.z + (isLoud ? this._offsetZ : 0),
      )
      const dist = this.group.position.distanceTo(goal)
      if (dist > 1.4) {
        this._moveXZ(goal, delta, 4.2, wallBoxes)
      } else {
        const toP = playerPos.clone().sub(this.group.position)
        if (toP.length() > 0.2) this.group.rotation.y = Math.atan2(toP.x, toP.z)
      }
    }
  }

  // ── Revive player routine ────────────────────────────────────
  private _doRevive(delta: number, playerPos: THREE.Vector3, wallBoxes: THREE.Box3[]) {
    const dist = this.group.position.distanceTo(playerPos)
    if (dist > 1.8) {
      this._moveXZ(playerPos, delta, 4.5, wallBoxes)
      this._reviveT = 0
    } else {
      // Kneel toward player
      const toP = new THREE.Vector3().subVectors(playerPos, this.group.position)
      if (toP.length() > 0.1) this.group.rotation.y = Math.atan2(toP.x, toP.z)

      this._reviveT += delta
      if (this._reviveT >= REVIVE_TIME && this.onRevivePlayer) {
        this.onRevivePlayer()
        this._reviveT = 0
        this.aiState  = 'FOLLOW'
      }
    }
  }

  // ── Movement helpers ─────────────────────────────────────────
  private _moveXZ(target: THREE.Vector3, delta: number, speed: number, wallBoxes: THREE.Box3[]) {
    const dx  = target.x - this.pos.x
    const dz  = target.z - this.pos.z
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len < 0.01) return
    this.group.rotation.y = Math.atan2(dx, dz)
    this._tryMove(this.pos.x + (dx / len) * speed * delta, this.pos.z + (dz / len) * speed * delta, wallBoxes)
  }

  private _testPos(x: number, z: number, wallBoxes: THREE.Box3[]): boolean {
    const R = 0.48
    const box = new THREE.Box3(
      new THREE.Vector3(x - R, 0, z - R),
      new THREE.Vector3(x + R, 1.8, z + R),
    )
    return !wallBoxes.some(b => b.intersectsBox(box))
  }

  private _tryMove(nx: number, nz: number, wallBoxes: THREE.Box3[]) {
    const px = this.pos.x, pz = this.pos.z
    // Full move
    if (this._testPos(nx, nz, wallBoxes)) {
      this.pos.x = nx; this.pos.z = nz
    // Wall-slide: X only
    } else if (Math.abs(nx - px) > 0.001 && this._testPos(nx, pz, wallBoxes)) {
      this.pos.x = nx
    // Wall-slide: Z only
    } else if (Math.abs(nz - pz) > 0.001 && this._testPos(px, nz, wallBoxes)) {
      this.pos.z = nz
    // Perpendicular dodge
    } else {
      const dx = nx - px, dz = nz - pz
      const step = Math.sqrt(dx * dx + dz * dz) || 0.05
      const perpX = -dz / step * step, perpZ = dx / step * step
      if (this._testPos(px + perpX, pz + perpZ, wallBoxes)) {
        this.pos.x = px + perpX; this.pos.z = pz + perpZ
      } else if (this._testPos(px - perpX, pz - perpZ, wallBoxes)) {
        this.pos.x = px - perpX; this.pos.z = pz - perpZ
      }
    }
    this.group.position.set(this.pos.x, 0, this.pos.z)
  }

  /** 0-1 — how far into the revive routine the bot is. */
  get reviveProgress() {
    return this.aiState === 'REVIVING' ? Math.min(1, this._reviveT / REVIVE_TIME) : 0
  }
}
