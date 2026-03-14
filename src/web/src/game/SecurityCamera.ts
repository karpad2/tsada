import * as THREE   from 'three'
import { GameManager } from './GameManager.ts'
import { state }        from './state.ts'
import { hasLOS }       from './Enemy.ts'

// ── Shared materials ─────────────────────────────────────────
const _matBody  = new THREE.MeshLambertMaterial({ color: 0x2a2a2a})
const _matLens  = new THREE.MeshLambertMaterial({ color: 0x111111})
const _matMount = new THREE.MeshLambertMaterial({ color: 0x1a1a1a})

const SUS_RATE = 25   // detection % per second while in cone

export class SecurityCamera {
  _scene: THREE.Scene
  pos: THREE.Vector3
  baseAngle: number
  panRange: number
  panSpeed: number
  range: number
  fovHalf: number
  _panTime: number
  currentAngle: number
  alive: boolean

  group: THREE.Group
  hitbox: THREE.Mesh
  _pivot: THREE.Group
  _led: THREE.Mesh

  /**
   * @param scene
   * @param cfg  { x, y, z, angle, panRange?, panSpeed?, range? }
   */
  constructor(scene: THREE.Scene, cfg: any) {
    this._scene     = scene
    this.pos        = new THREE.Vector3(cfg.x, cfg.y ?? 2.6, cfg.z)
    this.baseAngle  = cfg.angle   ?? 0
    this.panRange   = cfg.panRange ?? Math.PI * 0.5
    this.panSpeed   = cfg.panSpeed ?? 0.5
    this.range      = cfg.range    ?? 9
    this.fovHalf    = Math.PI * 0.3   // ≈ 54° each side → ~108° total FOV

    this._panTime     = Math.random() * Math.PI * 2   // random phase start
    this.currentAngle = this.baseAngle
    this.alive        = true

    this._buildMesh(scene)
  }

  // ── 3-D model ────────────────────────────────────────────────
  _buildMesh(scene: THREE.Scene) {
    this.group = new THREE.Group()

    // Wall mount bracket
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), _matMount)
    mount.position.set(0, 0.18, 0)
    this.group.add(mount)

    // Pivot group — rotates while panning
    this._pivot = new THREE.Group()
    this.group.add(this._pivot)

    // Camera body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.28), _matBody)
    this._pivot.add(body)

    // Lens
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.14, 8), _matLens)
    lens.rotation.x = Math.PI / 2
    lens.position.z = -0.2
    this._pivot.add(lens)

    // Indicator LED
    this._led = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x00ff44 }),
    )
    this._led.position.set(0.08, 0.08, 0.06)
    this._pivot.add(this._led)

    // Hitbox (for shooting)
    const hbGeo = new THREE.BoxGeometry(0.22, 0.14, 0.28)
    this.hitbox  = new THREE.Mesh(hbGeo, new THREE.MeshBasicMaterial({ visible: false }))
    this.hitbox.userData.securityCamera = this
    this._pivot.add(this.hitbox)

    this.group.position.copy(this.pos)
    this.group.rotation.y = this.baseAngle + Math.PI   // lens faces -Z locally → correct world direction
    scene.add(this.group)
  }

  // ── Per-frame update ─────────────────────────────────────────
  update(delta: number, playerPos: THREE.Vector3, wallBoxes: THREE.Box3[]) {
    if (!this.alive) return

    // Pan
    this._panTime    += delta * this.panSpeed
    this.currentAngle = this.baseAngle + Math.sin(this._panTime) * this.panRange
    this._pivot.rotation.y = Math.sin(this._panTime) * this.panRange

    // In loud phase camera just flashes red — no extra detection
    if (GameManager.isLoudPhase()) {
      this._led.material.color.setHex(0xff2200)
      return
    }

    // ── Detection ─────────────────────────────────────────────
    const dx   = playerPos.x - this.pos.x
    const dz   = playerPos.z - this.pos.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist > this.range) {
      this._led.material.color.setHex(0x00ff44)
      return
    }

    // Dot product: camera faces (sin, cos) in XZ
    const facingX = Math.sin(this.currentAngle)
    const facingZ = Math.cos(this.currentAngle)
    const dot     = (dx * facingX + dz * facingZ) / dist

    if (dot < Math.cos(this.fovHalf)) {
      this._led.material.color.setHex(0x00ff44)
      return
    }

    // LOS check
    const camEye    = this.pos.clone()
    const playerEye = new THREE.Vector3(playerPos.x, 1.6, playerPos.z)
    if (!hasLOS(camEye, playerEye, wallBoxes)) {
      this._led.material.color.setHex(0x00ff44)
      return
    }

    // Player spotted
    this._led.material.color.setHex(0xff8800)
    GameManager.addEnemyDetection(SUS_RATE, delta)
    state.detectionRate = GameManager.getDetectionRate()
  }

  // ── Shot out ─────────────────────────────────────────────────
  destroy() {
    this.alive = false
    this._pivot.rotation.z = Math.PI * 0.3
    this._led.material.color.setHex(0x111111)
  }

  remove() {
    this._scene.remove(this.group)
  }
}
