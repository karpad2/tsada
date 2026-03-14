import * as THREE from 'three'

const FLEE_SPEED  = 4.5
const DIR_CHANGE  = 2.0   // steer-correction interval
const ARRIVE_DIST = 3.0   // despawn when this close to exfil zone

// ── Appearance palettes ─────────────────────────────────────────
const SKIN_TONES   = [0xd4a077, 0xc8855a, 0x8b5c3a, 0xf0c79c, 0xe8b090]
const SHIRT_COLORS = [0x3366cc, 0x228833, 0xcc4422, 0x8833aa, 0x116688, 0xbb6600, 0xccaa22, 0xcc3366]
const PANT_COLORS  = [0x222244, 0x333344, 0x1a1a2a, 0x2a2030, 0x223322, 0x443322]
const TIE_COLORS   = [0xaa0000, 0x0022aa, 0x006633, 0x441188, 0x663300]
const EMP_SHIRTS   = [0xf4f4f0, 0xd0e0f0, 0xe8e8e0, 0xf0eedd]
const EMP_PANTS    = [0x222233, 0x111122, 0x1a1a1a, 0x2a2020]
const SCRUB_COLORS = [0x4488cc, 0x338855, 0x6644aa, 0x44aaaa, 0x226688]
const VEST_COLORS  = [0xff8800, 0xffaa00, 0xff6600]

// ── Theme → [publicVariant, privateVariant] ─────────────────────
export const THEME_VARIANTS = {
  default:   ['civ',     'employee'],
  bank:      ['civ',     'employee'],
  office:    ['civ',     'employee'],
  casino:    ['casino',  'employee'],
  hospital:  ['patient', 'doctor'  ],
  warehouse: ['worker',  'worker'  ],
  dockyard:  ['worker',  'worker'  ],
  military:  ['worker',  'employee'],
  museum:    ['civ',     'employee'],
  prison:    ['civ',     'employee'],
}

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// Private geometry helpers ─────────────────────────────────────
function _bx(w, h, d, mat, px = 0, py = 0, pz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(px, py, pz); m.castShadow = true; return m
}
function _sp(r, mat, px = 0, py = 0, pz = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat)
  m.position.set(px, py, pz); m.castShadow = true; return m
}

export class Civilian {
  /**
   * @param {THREE.Scene} scene
   * @param {number} x
   * @param {number} z
   * @param {'civ'|'employee'|'casino'|'doctor'|'nurse'|'patient'|'worker'} variant
   */
  constructor(scene, x, z, variant = 'civ') {
    this._scene         = scene
    this.isDead         = false
    this._fleeing       = false
    this.isSurrendering = false   // kneeling with hands behind back after shout
    this.isTied         = false   // zip-tied on the ground
    this.spotTimer      = 0       // 0→1 while spotting an armed player; triggers alarm at 1
    this._fleeDir       = new THREE.Vector3()
    this._dirTimer      = 0
    this._target        = null   // nearest exfil zone {x,z}
    this.health         = 30
    this.variant        = variant

    // ── Proportions match the guard model ───────────────────────
    const HIP    = 0.62
    const SH     = HIP + 0.60   // 1.22 — shoulder pivot
    const HEAD_Y = SH  + 0.38   // 1.60 — head centre
    const EZ     = 0.24         // front-of-head z offset

    const skinMat  = new THREE.MeshLambertMaterial({ color: rnd(SKIN_TONES)})
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111})
    const extra    = []
    let shirtMat, pantMat, shoeMat

    switch (variant) {
      case 'employee': {
        shirtMat = new THREE.MeshLambertMaterial({ color: rnd(EMP_SHIRTS)})
        pantMat  = new THREE.MeshLambertMaterial({ color: rnd(EMP_PANTS)})
        shoeMat  = new THREE.MeshLambertMaterial({ color: 0x111111})
        // tie hanging from collar
        extra.push(_bx(0.07, 0.52, 0.04, new THREE.MeshLambertMaterial({ color: rnd(TIE_COLORS)}), 0, 1.02, 0.17))
        break
      }
      case 'doctor': {
        shirtMat = new THREE.MeshLambertMaterial({ color: 0xeeeee8})
        pantMat  = new THREE.MeshLambertMaterial({ color: rnd(EMP_PANTS)})
        shoeMat  = new THREE.MeshLambertMaterial({ color: 0x333333})
        // white lab coat overlay
        extra.push(_bx(0.58, 0.92, 0.10, new THREE.MeshLambertMaterial({ color: 0xf8f8f4}), 0, 0.98, 0.12))
        // thin glasses frame
        extra.push(_bx(0.30, 0.06, 0.06, new THREE.MeshLambertMaterial({ color: 0x222222}), 0, HEAD_Y + 0.06, EZ))
        break
      }
      case 'nurse': {
        const sc = rnd(SCRUB_COLORS)
        shirtMat = new THREE.MeshLambertMaterial({ color: sc})
        pantMat  = new THREE.MeshLambertMaterial({ color: sc})
        shoeMat  = new THREE.MeshLambertMaterial({ color: 0x444444})
        // nurse cap on top of head
        extra.push(_bx(0.42, 0.10, 0.30, new THREE.MeshLambertMaterial({ color: 0xffffff}), 0, HEAD_Y + 0.30, 0))
        break
      }
      case 'patient': {
        const gc = Math.random() < 0.5 ? 0xc0d8f0 : 0xe8e8f0
        shirtMat = new THREE.MeshLambertMaterial({ color: gc})
        pantMat  = shirtMat
        shoeMat  = new THREE.MeshLambertMaterial({ color: 0xcccccc})
        // IV line stub on wrist
        extra.push(_bx(0.06, 0.12, 0.04, new THREE.MeshLambertMaterial({ color: 0xdddddd, transparent: true, opacity: 0.8}), -0.38, SH - 0.38, 0.12))
        break
      }
      case 'worker': {
        shirtMat = new THREE.MeshLambertMaterial({ color: 0x223322})
        pantMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a14})
        shoeMat  = new THREE.MeshLambertMaterial({ color: 0x2a1a0a})
        // hi-vis safety vest
        extra.push(_bx(0.58, 0.62, 0.12, new THREE.MeshLambertMaterial({ color: rnd(VEST_COLORS)}), 0, 1.00, 0.10))
        // hard hat
        const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.14, 10), new THREE.MeshLambertMaterial({ color: rnd(VEST_COLORS)}))
        hat.position.set(0, HEAD_Y + 0.30, 0); hat.castShadow = true
        extra.push(hat)
        break
      }
      case 'casino': {
        const formal = Math.random() < 0.5
        const dressC = rnd([0xcc2266, 0x228844, 0x2244aa])
        shirtMat = new THREE.MeshLambertMaterial({ color: formal ? 0x111122 : dressC})
        pantMat  = shirtMat
        shoeMat  = new THREE.MeshLambertMaterial({ color: 0x111111})
        if (formal) {
          // white shirt front
          extra.push(_bx(0.24, 0.50, 0.06, new THREE.MeshLambertMaterial({ color: 0xf0f0f0}), 0, 1.02, 0.14))
          // bow tie at neck
          extra.push(_bx(0.16, 0.06, 0.05, new THREE.MeshLambertMaterial({ color: 0xcc0000}), 0, 1.30, 0.17))
        }
        break
      }
      default: {
        // 'civ' — casual street clothes
        shirtMat = new THREE.MeshLambertMaterial({ color: rnd(SHIRT_COLORS)})
        pantMat  = new THREE.MeshLambertMaterial({ color: rnd(PANT_COLORS)})
        shoeMat  = new THREE.MeshLambertMaterial({ color: 0x222211})
        // optional jacket layer
        if (Math.random() < 0.4)
          extra.push(_bx(0.56, 0.60, 0.10, new THREE.MeshLambertMaterial({ color: rnd(PANT_COLORS)}), 0, 1.00, 0.12))
      }
    }

    this.group = new THREE.Group()
    this.group.position.set(x, 0, z)
    this.group.rotation.y = Math.random() * Math.PI * 2

    this.group.add(
      // ── Legs ────────────────────────────────────────────────
      _bx(0.24, HIP,  0.26, pantMat,  -0.14, HIP / 2, 0),
      _bx(0.24, HIP,  0.26, pantMat,   0.14, HIP / 2, 0),
      // ── Shoes ───────────────────────────────────────────────
      _bx(0.24, 0.12, 0.30, shoeMat,  -0.14, 0.08, 0.04),
      _bx(0.24, 0.12, 0.30, shoeMat,   0.14, 0.08, 0.04),
      // ── Torso ───────────────────────────────────────────────
      _bx(0.54, 0.64, 0.32, shirtMat,  0,    HIP + 0.32, 0),
      // ── Arms ────────────────────────────────────────────────
      _bx(0.18, 0.58, 0.22, shirtMat, -0.38, SH - 0.08, 0),
      _bx(0.18, 0.58, 0.22, shirtMat,  0.38, SH - 0.08, 0),
      // ── Hands ───────────────────────────────────────────────
      _sp(0.10, skinMat, -0.38, SH - 0.38, 0),
      _sp(0.10, skinMat,  0.38, SH - 0.38, 0),
      // ── Head (box, matching guard scale) ────────────────────
      _bx(0.46, 0.52, 0.46, skinMat, 0, HEAD_Y, 0),
      // ── Eyes ────────────────────────────────────────────────
      _bx(0.10, 0.08, 0.04, blackMat, -0.12, HEAD_Y + 0.06, EZ),
      _bx(0.10, 0.08, 0.04, blackMat,  0.12, HEAD_Y + 0.06, EZ),
      // ── Mouth ───────────────────────────────────────────────
      _bx(0.18, 0.04, 0.04, blackMat,  0,    HEAD_Y - 0.12, EZ),
      ...extra,
    )

    scene.add(this.group)

    this._hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 1.80, 0.38),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    this._hitMesh.position.set(x, 0.9, z)
    this._hitMesh.userData.civilian = this
    scene.add(this._hitMesh)
  }

  get hitbox() { return this._hitMesh }

  // ── Surrender mechanic ───────────────────────────────────────
  /** Called when player shouts at this civilian (F key). Returns true if newly surrendered. */
  shoutAt() {
    if (this.isDead || this.isTied || this.isSurrendering) return false
    this._fleeing       = false
    this.isSurrendering = true
    this.spotTimer      = 0       // abort any police call in progress
    // Kneel pose: lower the group + slight forward tilt
    this.group.position.y = -0.36
    this.group.rotation.x = 0.12
    // Face a random direction (surprised stop)
    return true
  }

  /** Called after hold-F completes near a surrendering civ. Zip-ties them. */
  tie() {
    if (!this.isSurrendering || this.isTied || this.isDead) return
    this.isTied         = true
    this.isSurrendering = false
    // Sit slightly lower
    this.group.position.y = -0.44
    // Orange zip-tie behind back (waist level)
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0xff6600})
    const rope    = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), ropeMat)
    rope.position.set(0, 0.92, -0.18)
    this.group.add(rope)
  }

  startFleeing(exfilZones = []) {
    if (this.isDead || this._fleeing || this.isTied) return
    this._fleeing = true
    // pick nearest exfil zone as flee target
    if (exfilZones.length > 0) {
      const px = this.group.position.x, pz = this.group.position.z
      let best = null, bestD = Infinity
      for (const ez of exfilZones) {
        const d = Math.hypot(ez.x - px, ez.z - pz)
        if (d < bestD) { bestD = d; best = ez }
      }
      this._target = best
    }
    this._pickDir(); this._dirTimer = DIR_CHANGE
  }

  _pickDir() {
    if (this._target) {
      // steer toward target with small random spread to avoid wall-hugging
      const dx = this._target.x - this.group.position.x
      const dz = this._target.z - this.group.position.z
      const base = Math.atan2(dx, dz)
      const a    = base + (Math.random() - 0.5) * 0.5
      this._fleeDir.set(Math.sin(a), 0, Math.cos(a))
    } else {
      const a = Math.random() * Math.PI * 2
      this._fleeDir.set(Math.sin(a), 0, Math.cos(a))
    }
  }

  takeDamage(amount) {
    if (this.isDead) return
    this.health -= amount
    if (this.health <= 0) this._die()
  }

  _die() {
    if (this.isDead) return
    this.isDead = true
    this.group.rotation.z = Math.PI / 2
    this.group.position.y = -0.55
    this._scene.remove(this._hitMesh)
    this._hitMesh.geometry.dispose()
    this._hitMesh.material.dispose()
  }

  update(delta, wallBoxes) {
    if (this.isDead || this.isSurrendering || this.isTied || !this._fleeing) return

    // despawn when close enough to exfil zone
    if (this._target) {
      const d = Math.hypot(this._target.x - this.group.position.x, this._target.z - this.group.position.z)
      if (d < ARRIVE_DIST) { this._despawn(); return }
    }

    this._dirTimer -= delta
    if (this._dirTimer <= 0) { this._pickDir(); this._dirTimer = DIR_CHANGE }

    const spd = FLEE_SPEED * delta
    const nx  = this.group.position.x + this._fleeDir.x * spd
    const nz  = this.group.position.z + this._fleeDir.z * spd
    const box = new THREE.Box3(
      new THREE.Vector3(nx - 0.28, 0, nz - 0.20),
      new THREE.Vector3(nx + 0.28, 2, nz + 0.20),
    )
    if (wallBoxes.some(b => b.intersectsBox(box))) {
      this._pickDir()
    } else {
      this.group.position.x = nx
      this.group.position.z = nz
      this.group.rotation.y = Math.atan2(this._fleeDir.x, this._fleeDir.z)
      this._hitMesh.position.x = nx
      this._hitMesh.position.z = nz
    }
  }

  _despawn() {
    this.isDead = true
    this._scene.remove(this.group)
    this._scene.remove(this._hitMesh)
    this._hitMesh.geometry.dispose()
    this._hitMesh.material.dispose()
  }
}
