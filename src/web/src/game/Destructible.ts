import * as THREE from 'three'

// ── Destructible prop ─────────────────────────────────────────
// Wraps a mesh. When health hits 0 the mesh disappears and a
// cluster of box-debris is spawned with physics velocities.
// Engine receives the chunks via the onShatter callback and
// runs their physics loop.
export class Destructible {
  constructor(scene, root, health = 80) {
    this.scene     = scene
    this.mesh      = root   // root: Mesh or Group — removed from scene on shatter
    this.health    = health
    this.maxHealth = health
    this.shattered = false
    /** @type {(chunks: object[]) => void} set by Engine */
    this.onShatter = null

    // Find a representative mesh (first child with a material) for colour feedback
    let rep = root
    if (!root.material) {
      root.traverse(c => { if (c.isMesh && !rep.material) rep = c })
    }
    this._rep = rep

    root.updateMatrixWorld(true)
    this.box3       = new THREE.Box3().setFromObject(root)
    this._origColor = rep.material?.color ? rep.material.color.clone() : new THREE.Color(0x888888)

    this.refreshBox = () => {
      root.updateMatrixWorld(true)
      this.box3.setFromObject(root)
    }

    // Tag root AND all descendants so any raycast hit registers
    root.userData.destructible = this
    root.traverse(c => { c.userData.destructible = this })
  }

  // amount = damage; hitPoint = THREE.Vector3 of impact (optional)
  takeDamage(amount, hitPoint) {
    if (this.shattered) return
    this.health -= amount

    // Tint toward dark charred colour as health drops
    const t = Math.max(0, this.health / this.maxHealth)
    this._rep.material.color.lerpColors(
      new THREE.Color(0.10, 0.05, 0.02),
      this._origColor,
      t * 0.75 + 0.1,
    )

    if (this.health <= 0) this._shatter(hitPoint)
  }

  _shatter(hitPoint) {
    if (this.shattered) return
    this.shattered = true
    this.scene.remove(this.mesh)

    const size   = new THREE.Vector3()
    const center = new THREE.Vector3()
    this.box3.getSize(size)
    this.box3.getCenter(center)
    const hp = hitPoint ?? center

    const count  = 8 + Math.floor(Math.random() * 7)
    const chunks = []

    for (let i = 0; i < count; i++) {
      const cw  = size.x * (0.10 + Math.random() * 0.30)
      const ch  = size.y * (0.10 + Math.random() * 0.30)
      const cd  = size.z * (0.10 + Math.random() * 0.30)
      const geo = new THREE.BoxGeometry(cw, ch, cd)
      const mat = this._rep.material.clone()
      mat.transparent = true
      mat.opacity     = 1

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        center.x + (Math.random() - 0.5) * size.x * 0.9,
        center.y + (Math.random() - 0.5) * size.y * 0.9,
        center.z + (Math.random() - 0.5) * size.z * 0.9,
      )
      mesh.castShadow = true
      this.scene.add(mesh)

      // Velocity: radially away from impact + upward kick
      const away = new THREE.Vector3().subVectors(mesh.position, hp)
      if (away.length() < 0.01) away.set(Math.random() - 0.5, 0, Math.random() - 0.5)
      away.normalize().multiplyScalar(4 + Math.random() * 7)
      away.y += 2.5 + Math.random() * 5

      chunks.push({
        mesh,
        vel:    away,
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 22,
        ),
        timer: 5 + Math.random() * 5,
      })
    }

    if (this.onShatter) this.onShatter(chunks)
  }
}
