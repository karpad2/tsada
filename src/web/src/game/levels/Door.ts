import * as THREE from 'three'

/**
 * Door — a pivot-animated door with fixed scene-space frame.
 *
 * Frame (hinge post, latch post, lintel) is added directly to `scene`
 * so it never rotates with the leaf.  The leaf only lives in the pivot group.
 *
 * sealBoxes: two invisible Box3 extending along the wall from each side of
 * the frame.  Add these to wallBoxes in LevelBuilder to prevent players
 * bypassing doors through oversized wall gaps.
 */
export class Door {
  constructor(scene, x, z, angle = 0, type = 'normal', w = 1.2, keycardId = null) {
    this.scene      = scene
    this.type       = type
    this.keycardId  = keycardId
    this.isOpen     = false
    this.onOpen     = null
    this._w         = w
    this._baseAngle    = angle
    this._currentSwing = 0

    // Direction vectors in world space
    const cosA = Math.cos(angle), sinA = Math.sin(angle)
    const ldx  = cosA,  ldz  = -sinA    // leaf extends in this direction
    const nx   = sinA,  nz   = cosA     // wall normal (into room)

    // ── Pivot (leaf rotates here) ─────────────────────────
    this.pivot = new THREE.Group()
    this.pivot.position.set(x, 0, z)
    this.pivot.rotation.y = angle
    scene.add(this.pivot)

    // ── Door leaf ─────────────────────────────────────────
    const leafColor = type === 'drill'   ? 0x555566
                    : type === 'secure'  ? 0x3a1010
                    : type === 'keycard' ? 0x182040
                    :                     0x5a4830
    const leafMat = new THREE.MeshLambertMaterial({ color: leafColor})
    const leafGeo = new THREE.BoxGeometry(w, 2.2, 0.09)
    const leaf    = new THREE.Mesh(leafGeo, leafMat)
    leaf.position.set(w / 2, 1.1, 0)
    leaf.castShadow    = true
    leaf.receiveShadow = true
    this.pivot.add(leaf)
    this._leaf = leaf

    // ── Fixed frame (BLACK, in scene space — does NOT rotate) ─
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x111111})
    const FW = 0.13   // post width  (along leaf direction)
    const FD = 0.20   // post depth  (along wall normal)

    // Hinge post
    const hp = new THREE.Mesh(new THREE.BoxGeometry(FW, 2.55, FD), frameMat)
    hp.position.set(x, 1.275, z)
    hp.rotation.y = angle
    scene.add(hp)

    // Latch post (far end of leaf)
    const lp = new THREE.Mesh(new THREE.BoxGeometry(FW, 2.55, FD), frameMat)
    lp.position.set(x + ldx * w, 1.275, z + ldz * w)
    lp.rotation.y = angle
    scene.add(lp)

    // Lintel (horizontal bridge across top)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(w + FW, 0.22, FD), frameMat)
    lintel.position.set(x + ldx * (w / 2), 2.51, z + ldz * (w / 2))
    lintel.rotation.y = angle
    scene.add(lintel)

    // Transom — fills the gap above the lintel up to the ceiling (y = 4)
    const CEIL_H = 4.0
    const transH = CEIL_H - 2.73   // ≈ 1.27 m
    const transom = new THREE.Mesh(new THREE.BoxGeometry(w + FW, transH, FD), frameMat)
    transom.position.set(x + ldx * (w / 2), 2.73 + transH / 2, z + ldz * (w / 2))
    transom.rotation.y = angle
    scene.add(transom)

    // ── Indicator (secure / keycard — fixed to latch post) ───
    this._indicatorMat   = null
    this._indicatorLight = null
    if (type === 'secure' || type === 'keycard' || type === 'drill') {
      const lockedColor = type === 'keycard' ? 0x2244ff : type === 'drill' ? 0xff6600 : 0xff2020
      this._indicatorMat = new THREE.MeshBasicMaterial({ color: lockedColor })
      const indGeo  = new THREE.SphereGeometry(0.075, 8, 8)
      const indicator = new THREE.Mesh(indGeo, this._indicatorMat)
      indicator.position.set(
        x + ldx * (w - 0.1) + nx * 0.13,
        1.95,
        z + ldz * (w - 0.1) + nz * 0.13,
      )
      scene.add(indicator)

      this._indicatorLight = new THREE.PointLight(lockedColor, 0.8, 2.5)
      this._indicatorLight.position.copy(indicator.position)
      scene.add(this._indicatorLight)
    }

    // ── Leaf collision box (closed position) ──────────────
    this.pivot.updateMatrixWorld(true)
    this._box3 = new THREE.Box3().setFromObject(leaf)

    // ── Seal boxes — fill gap beside door along the wall ──
    // Extending 15 m from each door-frame post prevents players
    // from walking around the door through any wall opening.
    this.sealBoxes = this._makeSealBoxes(x, z, angle, w)
  }

  _makeSealBoxes(x, z, angle, w) {
    const EXT = 3,  SH = 3.1, ST = 0.22
    const a = Math.abs(angle) % Math.PI

    if (a < 0.05) {
      // E-W wall: seals extend left/right (± X)
      return [
        new THREE.Box3(new THREE.Vector3(x - EXT,     0, z - ST), new THREE.Vector3(x - 0.05,     SH, z + ST)),
        new THREE.Box3(new THREE.Vector3(x + w + 0.05, 0, z - ST), new THREE.Vector3(x + w + EXT, SH, z + ST)),
      ]
    }
    if (Math.abs(a - Math.PI / 2) < 0.05) {
      // N-S wall: door leaf goes in world -Z, seals extend ± Z
      const zLatch = z - w
      return [
        new THREE.Box3(new THREE.Vector3(x - ST, 0, z + 0.05),       new THREE.Vector3(x + ST, SH, z + EXT)),
        new THREE.Box3(new THREE.Vector3(x - ST, 0, zLatch - EXT),   new THREE.Vector3(x + ST, SH, zLatch - 0.05)),
      ]
    }
    return []
  }

  get box3() { return this._box3 }

  isNear(playerPos, threshold = 1.8) {
    const center = new THREE.Vector3(this._w / 2, 0, 0)
    this.pivot.localToWorld(center)
    return playerPos.distanceTo(center) < threshold
  }

  open() {
    if (this.isOpen) return
    this.isOpen = true
    if (this._indicatorMat) {
      this._indicatorMat.color.set(0x22ff44)
      if (this._indicatorLight) this._indicatorLight.color.set(0x22ff44)
    }
    if (this.onOpen) this.onOpen()
  }

  update(delta) {
    if (!this.isOpen) return
    const TARGET = Math.PI * 0.87
    if (this._currentSwing >= TARGET) return
    const remaining    = TARGET - this._currentSwing
    const speed        = Math.max(0.35, remaining * 4.5)
    this._currentSwing = Math.min(TARGET, this._currentSwing + speed * delta)
    this.pivot.rotation.y = this._baseAngle + this._currentSwing
  }
}
