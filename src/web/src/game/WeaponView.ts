import * as THREE from 'three'
import { state } from './state.ts'
import { buildWeaponModel } from './weapons/WeaponModels.ts'

// ── FPS weapon view rendered in a separate scene (clearDepth trick) ──────────
export class WeaponView {
  constructor(aspect) {
    this._scene  = new THREE.Scene()
    this._camera = new THREE.PerspectiveCamera(52, aspect, 0.01, 10)

    this._scene.add(new THREE.HemisphereLight(0xfff4e6, 0x444422, 0.6))
    const key = new THREE.DirectionalLight(0xfffaea, 1.4)
    key.position.set(1, 2, 1)
    this._scene.add(key)
    const rim = new THREE.DirectionalLight(0x8899cc, 0.4)
    rim.position.set(-1, 0.5, 1)
    this._scene.add(rim)

    // Animation state
    this._bobTime     = 0
    this._swayTargetX = 0
    this._swayTargetY = 0
    this._swayX       = 0
    this._swayY       = 0
    this._recoilZ     = 0
    this._recoilRot   = 0
    this._reloading   = false
    this._reloadT     = 0

    this._group      = null
    this._basePos    = new THREE.Vector3(0.20, -0.22, -0.40)
    this._adsPos     = new THREE.Vector3(0.0,  -0.18, -0.36)
    this._currentPos = new THREE.Vector3(0.20, -0.22, -0.40)  // lerp state (no sway mixed in)

    this._buildPistol()
  }

  // ── Switch weapon type (called once before heist starts) ──────────────────
  setWeapon(type, attachments = {}) {
    if (this._group) {
      this._scene.remove(this._group)
      this._group.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose() } })
    }
    this._weaponType = type
    this._dualSide = 0
    switch (type) {
      case 'smg':         this._buildSMG();         break
      case 'shotgun':     this._buildShotgun();     break
      case 'rifle':       this._buildRifle();       break
      case 'sniper':      this._buildSniper();      break
      case 'lmg':         this._buildLMG();         break
      case 'dualPistols': this._buildDualPistols(); break
      case 'taser':       this._buildTaser();       break
      case 'crossbow':    this._buildCrossbow();    break
      default:            this._buildPistol();      break
    }
    this._addAttachments(attachments)
  }

  // ── Shared box helper ─────────────────────────────────────────────────────
  _bx(w, h, d, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    return m
  }

  _initGroup() {
    this._group = new THREE.Group()
    this._group.position.copy(this._basePos)
    this._scene.add(this._group)
  }

  // ── Weapon model builders (use shared WeaponModels) ───────────────────────
  _buildPistol() {
    this._initGroup()
    this._basePos.set(0.20, -0.22, -0.40)
    this._adsPos.set(0.0, -0.17, -0.36)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('pistol')!)
  }

  _buildSMG() {
    this._initGroup()
    this._basePos.set(0.20, -0.20, -0.38)
    this._adsPos.set(0.0, -0.16, -0.35)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('smg')!)
  }

  _buildShotgun() {
    this._initGroup()
    this._basePos.set(0.22, -0.18, -0.42)
    this._adsPos.set(0.0, -0.14, -0.38)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('shotgun')!)
  }

  _buildRifle() {
    this._initGroup()
    this._basePos.set(0.21, -0.19, -0.44)
    this._adsPos.set(0.0, -0.14, -0.40)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('rifle')!)
  }

  _buildSniper() {
    this._initGroup()
    this._basePos.set(0.21, -0.17, -0.45)
    this._adsPos.set(0.0, -0.12, -0.42)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('sniper')!)
  }

  _buildLMG() {
    this._initGroup()
    this._basePos.set(0.22, -0.20, -0.46)
    this._adsPos.set(0.0, -0.15, -0.42)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('lmg')!)
  }

  _buildDualPistols() {
    this._initGroup()
    this._basePos.set(0.0, -0.22, -0.40)
    this._adsPos.set(0.0, -0.22, -0.40)   // same (no ADS)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('dualPistols')!)
  }

  _buildTaser() {
    this._initGroup()
    this._basePos.set(0.20, -0.22, -0.38)
    this._adsPos.set(0.0, -0.18, -0.36)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('taser')!)
  }

  _buildCrossbow() {
    this._initGroup()
    this._basePos.set(0.21, -0.20, -0.44)
    this._adsPos.set(0.0, -0.14, -0.40)
    this._currentPos.copy(this._basePos)
    this._group.add(buildWeaponModel('crossbow')!)
  }

  // ── Attachment visuals ───────────────────────────────────────────────────
  _addAttachments(attachments) {
    if (!this._group || !attachments) return
    const bx = this._bx.bind(this)
    const t = this._weaponType

    // Per-weapon mount points: { muzzleZ, railY, railZ, gripZ }
    const mounts = {
      pistol:  { muzzleZ: -0.245, railY: 0.088, railZ: -0.100, gripZ: -0.120 },
      smg:     { muzzleZ: -0.290, railY: 0.090, railZ: -0.100, gripZ: -0.140 },
      shotgun: { muzzleZ: -0.400, railY: 0.058, railZ: -0.200, gripZ: -0.200 },
      rifle:   { muzzleZ: -0.406, railY: 0.088, railZ: -0.120, gripZ: -0.160 },
      sniper:  { muzzleZ: -0.485, railY: 0.078, railZ: -0.120, gripZ: -0.200 },
      lmg:     { muzzleZ: -0.460, railY: 0.090, railZ: -0.100, gripZ: -0.160 },
    }
    const m = mounts[t] ?? mounts.pistol

    const black   = new THREE.MeshLambertMaterial({ color: 0x1a1a1e})
    const darkGray = new THREE.MeshLambertMaterial({ color: 0x222228})

    // ── Suppressor ──
    if (attachments.suppressor === 'suppressor') {
      const len = t === 'pistol' ? 0.12 : 0.16
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.026, len, 8),
        darkGray,
      )
      cyl.rotation.x = Math.PI / 2
      cyl.position.set(0, 0.048, m.muzzleZ - len / 2)
      this._group.add(cyl)
    }

    // ── Sights ──
    if (attachments.sight === 'redDot') {
      // Small red dot housing on rail
      this._group.add(bx(0.032, 0.032, 0.048, darkGray, 0, m.railY + 0.016, m.railZ))
      // Red dot lens
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.004, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      )
      lens.rotation.x = Math.PI / 2
      lens.position.set(0, m.railY + 0.016, m.railZ - 0.020)
      this._group.add(lens)
    } else if (attachments.sight === 'holographic') {
      // Wider housing
      this._group.add(bx(0.040, 0.038, 0.056, darkGray, 0, m.railY + 0.019, m.railZ))
      // Glass window (front)
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.030, 0.028),
        new THREE.MeshBasicMaterial({ color: 0x00ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
      )
      glass.position.set(0, m.railY + 0.019, m.railZ - 0.025)
      this._group.add(glass)
    } else if (attachments.sight === 'scope') {
      // Scope tube (only add if weapon doesn't have a built-in scope)
      if (t !== 'sniper') {
        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.14, 8),
          darkGray,
        )
        tube.rotation.x = Math.PI / 2
        tube.position.set(0, m.railY + 0.022, m.railZ)
        this._group.add(tube)
        // Objective bell
        const bell = new THREE.Mesh(
          new THREE.CylinderGeometry(0.030, 0.022, 0.025, 8),
          darkGray,
        )
        bell.rotation.x = Math.PI / 2
        bell.position.set(0, m.railY + 0.022, m.railZ - 0.075)
        this._group.add(bell)
      }
    }

    // ── Grips ──
    if (attachments.grip === 'verticalGrip') {
      this._group.add(bx(0.024, 0.065, 0.024, black, 0, -0.065, m.gripZ))
    } else if (attachments.grip === 'angledGrip') {
      const grip = bx(0.026, 0.055, 0.026, black, 0, -0.055, m.gripZ)
      grip.rotation.x = -0.4
      this._group.add(grip)
    }

    // ── Extended / Drum magazine ──
    if (attachments.magazine === 'extended') {
      // Slightly larger mag body — just add a strip below the existing magazine
      this._group.add(bx(0.058, 0.035, 0.048, darkGray, 0, -0.195, 0.050))
    } else if (attachments.magazine === 'drum') {
      // Drum cylinder below receiver
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.040, 12),
        darkGray,
      )
      drum.position.set(0, -0.170, 0.040)
      this._group.add(drum)
    }
  }

  // ── Called from mouse handler in Engine ───────────────────────────────────
  addSway(dx, dy) {
    this._swayTargetX += dx * 0.038
    this._swayTargetY += dy * 0.038
    this._swayTargetX = Math.max(-0.14, Math.min(0.14, this._swayTargetX))
    this._swayTargetY = Math.max(-0.10, Math.min(0.10, this._swayTargetY))
  }

  // ── Per-frame update ──────────────────────────────────────────────────────
  update(delta, isMoving, reloadTime = 1.8) {
    if (!this._group) return

    const isADS = state.isADS
    // Walk bob (suppressed during ADS)
    if (isMoving && !isADS) this._bobTime += delta * 9
    const bobSwing = (isMoving && !isADS) ? Math.sin(this._bobTime) : 0
    const bobY     = Math.abs(bobSwing) * 0.007
    const bobX     = bobSwing * 0.004

    // Sway
    const lerpT = Math.min(1, delta * 9)
    this._swayX += (this._swayTargetX - this._swayX) * lerpT
    this._swayY += (this._swayTargetY - this._swayY) * lerpT
    this._swayTargetX *= Math.pow(0.12, delta)
    this._swayTargetY *= Math.pow(0.12, delta)

    // Recoil springs back
    const recoilDecay = Math.pow(0.008, delta)
    this._recoilZ   *= recoilDecay
    this._recoilRot *= recoilDecay

    // Reload dip
    let reloadDip = 0; let reloadRotDip = 0
    if (this._reloading) {
      this._reloadT += delta / reloadTime
      if (this._reloadT >= 1.0) { this._reloadT = 0; this._reloading = false }
      const t = this._reloadT
      const dip = t < 0.5 ? t * 2 : 2 - t * 2
      reloadDip    = dip * 0.18
      reloadRotDip = dip * 0.4
    }

    // ADS lerp — advance _currentPos toward target (no sway/bob mixed in)
    const targetPos = isADS ? this._adsPos : this._basePos
    const lerpSpeed = Math.min(1, delta * 18)
    this._currentPos.x += (targetPos.x - this._currentPos.x) * lerpSpeed
    this._currentPos.y += (targetPos.y - this._currentPos.y) * lerpSpeed
    this._currentPos.z += (targetPos.z - this._currentPos.z) * lerpSpeed

    // Final position = clean lerped base + additive overlays
    this._group.position.x = this._currentPos.x + (isADS ? 0 : this._swayX * 0.5 + bobX)
    this._group.position.y = this._currentPos.y + (isADS ? 0 : -bobY - reloadDip + this._swayY * 0.5)
    this._group.position.z = this._currentPos.z + this._recoilZ

    this._group.rotation.x = this._recoilRot + reloadRotDip
    this._group.rotation.z = isADS ? 0 : -this._swayX * 0.3
  }

  triggerRecoil() {
    if (this._weaponType === 'dualPistols') {
      this._dualSide = this._dualSide === 0 ? 1 : 0
      this._recoilZ   = 0.06
      this._recoilRot = -0.15
      this._swayTargetX += this._dualSide === 0 ? -0.03 : 0.03
    } else {
      this._recoilZ   = 0.072
      this._recoilRot = -0.20
    }
  }

  triggerReload() {
    if (this._reloading) return
    this._reloading = true
    this._reloadT   = 0
  }

  setAspect(aspect) {
    this._camera.aspect = aspect
    this._camera.updateProjectionMatrix()
  }

  render(renderer) {
    renderer.clearDepth()
    renderer.render(this._scene, this._camera)
  }

  dispose() {
    this._scene.traverse(obj => {
      if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose() }
    })
  }
}
