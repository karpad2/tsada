import * as THREE from 'three'

// ── Geometry helpers (same as Civilian) ──────────────────────
function _bx(w, h, d, mat, px = 0, py = 0, pz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(px, py, pz); m.castShadow = true; return m
}
function _sp(r, mat, px = 0, py = 0, pz = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat)
  m.position.set(px, py, pz); m.castShadow = true; return m
}

export class Hostage {
  group: THREE.Group
  security: number       // 100 = fully secured, 0 = freed by HRT
  maxSecurity: number
  isFreed: boolean       // true = HRT successfully rescued the hostage
  onFreed: (() => void) | null

  private _scene: THREE.Scene
  private _hitMesh: THREE.Mesh
  private _barBg: THREE.Mesh
  private _barFill: THREE.Mesh

  constructor(scene: THREE.Scene, x: number, z: number) {
    this._scene      = scene
    this.security    = 100
    this.maxSecurity = 100
    this.isFreed     = false
    this.onFreed     = null

    // ── Proportions (kneeling, lowered) ──────────────────────
    const HIP    = 0.62
    const SH     = HIP + 0.60
    const HEAD_Y = SH  + 0.38
    const EZ     = 0.24

    const skinMat    = new THREE.MeshLambertMaterial({ color: 0xd4a077 })
    const blackMat   = new THREE.MeshLambertMaterial({ color: 0x111111 })
    const jumpsuit   = new THREE.MeshLambertMaterial({ color: 0xff6600 })
    const shoeMat    = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const ropeMat    = new THREE.MeshLambertMaterial({ color: 0xcccccc })

    this.group = new THREE.Group()
    this.group.position.set(x, 0, z)

    // Kneeling pose
    this.group.position.y = -0.36
    this.group.rotation.x = 0.12

    this.group.add(
      // Legs
      _bx(0.24, HIP,  0.26, jumpsuit, -0.14, HIP / 2, 0),
      _bx(0.24, HIP,  0.26, jumpsuit,  0.14, HIP / 2, 0),
      // Shoes
      _bx(0.24, 0.12, 0.30, shoeMat, -0.14, 0.08, 0.04),
      _bx(0.24, 0.12, 0.30, shoeMat,  0.14, 0.08, 0.04),
      // Torso
      _bx(0.54, 0.64, 0.32, jumpsuit, 0, HIP + 0.32, 0),
      // Arms (behind back)
      _bx(0.18, 0.58, 0.22, jumpsuit, -0.38, SH - 0.08, -0.10),
      _bx(0.18, 0.58, 0.22, jumpsuit,  0.38, SH - 0.08, -0.10),
      // Hands (behind back)
      _sp(0.10, skinMat, -0.20, SH - 0.38, -0.18),
      _sp(0.10, skinMat,  0.20, SH - 0.38, -0.18),
      // Head
      _bx(0.46, 0.52, 0.46, skinMat, 0, HEAD_Y, 0),
      // Eyes
      _bx(0.10, 0.08, 0.04, blackMat, -0.12, HEAD_Y + 0.06, EZ),
      _bx(0.10, 0.08, 0.04, blackMat,  0.12, HEAD_Y + 0.06, EZ),
      // Mouth
      _bx(0.18, 0.04, 0.04, blackMat, 0, HEAD_Y - 0.12, EZ),
      // Zip-tie behind back
      _bx(0.32, 0.06, 0.08, ropeMat, 0, 0.92, -0.18),
    )

    // Hair
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshLambertMaterial({ color: 0x3a2010 }),
    )
    hair.position.set(0, HEAD_Y + 0.08, 0); hair.castShadow = true
    this.group.add(hair)

    scene.add(this.group)

    // ── Hitbox ───────────────────────────────────────────────
    this._hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 1.80, 0.38),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    this._hitMesh.position.set(x, 0.9, z)
    this._hitMesh.userData.hostage = this
    scene.add(this._hitMesh)

    // ── Floating security bar ────────────────────────────────
    const barW = 1.0, barH = 0.08
    const bgGeo  = new THREE.PlaneGeometry(barW, barH)
    const bgMat  = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthTest: false })
    this._barBg = new THREE.Mesh(bgGeo, bgMat)
    this._barBg.position.set(x, 2.2, z)
    this._barBg.renderOrder = 999
    scene.add(this._barBg)

    const fillGeo = new THREE.PlaneGeometry(barW, barH)
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false })
    this._barFill = new THREE.Mesh(fillGeo, fillMat)
    this._barFill.position.set(x, 2.2, z)
    this._barFill.renderOrder = 1000
    scene.add(this._barFill)
  }

  get hitbox() { return this._hitMesh }

  /** Get floor-level position of hostage for pathfinding. */
  getFloorPos(): THREE.Vector3 {
    return new THREE.Vector3(this.group.position.x, 0, this.group.position.z)
  }

  /**
   * Called each frame by Engine when HRT enemies are near.
   * @param drainPerSec — rate per second (10 = one enemy = 10s to free)
   * @param delta — frame delta time
   */
  drainSecurity(drainPerSec: number, delta: number) {
    if (this.isFreed) return
    this.security = Math.max(0, this.security - drainPerSec * delta)
    this._updateBar()
    if (this.security <= 0) this._free()
  }

  /** Slowly recover security when no HRT near. */
  recoverSecurity(ratePerSec: number, delta: number) {
    if (this.isFreed) return
    this.security = Math.min(this.maxSecurity, this.security + ratePerSec * delta)
    this._updateBar()
  }

  private _updateBar() {
    const pct = Math.max(0, this.security / this.maxSecurity)
    this._barFill.scale.x = pct
    const barW = 1.0
    this._barFill.position.x = this.group.position.x - (1 - pct) * barW * 0.5

    // Color: green → yellow → red
    const mat = this._barFill.material as THREE.MeshBasicMaterial
    if (pct > 0.5) mat.color.setHex(0x44ff44)
    else if (pct > 0.25) mat.color.setHex(0xffaa00)
    else mat.color.setHex(0xff2222)
  }

  /** Make bar face the camera each frame. */
  updateBarFacing(camera: THREE.Camera) {
    if (this.isFreed) return
    this._barBg.lookAt(camera.position)
    this._barFill.lookAt(camera.position)
  }

  private _free() {
    if (this.isFreed) return
    this.isFreed = true
    // Stand up and walk away animation
    this.group.position.y = 0
    this.group.rotation.x = 0
    // Hide bar
    this._barBg.visible   = false
    this._barFill.visible = false
    this.onFreed?.()
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.group)
    scene.remove(this._hitMesh)
    scene.remove(this._barBg)
    scene.remove(this._barFill)
    this._hitMesh.geometry.dispose()
    ;(this._hitMesh.material as THREE.Material).dispose()
    this._barBg.geometry.dispose()
    ;(this._barBg.material as THREE.Material).dispose()
    this._barFill.geometry.dispose()
    ;(this._barFill.material as THREE.Material).dispose()
  }
}
