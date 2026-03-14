import * as THREE from 'three'

// ── GlassPanel ──────────────────────────────────────────────
// A shootable glass surface. Hit 1 = crack texture, hit 2 = shatter.
// Shattering spawns flat glass shard chunks and triggers an alarm callback.

const CRACK_COLOR = new THREE.Color(0.85, 0.92, 1.0)
const SHARD_COLOR = 0xaaddff

export class GlassPanel {
  mesh: THREE.Mesh
  scene: THREE.Scene
  hits = 0
  shattered = false
  /** Set by Engine — called when glass breaks (alarm trigger) */
  onBreak: ((center: THREE.Vector3) => void) | null = null
  /** Set by Engine — receives physics shard chunks */
  onShatter: ((chunks: object[]) => void) | null = null

  constructor(scene: THREE.Scene, mesh: THREE.Mesh) {
    this.scene = scene
    this.mesh = mesh
    // Tag mesh so raycast can identify it
    mesh.userData.glassPanel = this
    mesh.traverse(c => { (c as any).userData.glassPanel = this })
  }

  hit(hitPoint?: THREE.Vector3) {
    if (this.shattered) return
    this.hits++

    if (this.hits === 1) {
      // Crack: add wireframe overlay + reduce opacity
      this._crack()
    } else {
      // Shatter
      this._shatter(hitPoint)
    }
  }

  _crack() {
    const mat = this.mesh.material as THREE.MeshLambertMaterial
    mat.opacity = 0.18
    mat.color.copy(CRACK_COLOR)

    // Add visible crack lines as wireframe overlay
    const crackGeo = (this.mesh.geometry as THREE.BoxGeometry).clone()
    const crackMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    })
    const crackMesh = new THREE.Mesh(crackGeo, crackMat)
    crackMesh.position.copy(this.mesh.position)
    crackMesh.rotation.copy(this.mesh.rotation)
    crackMesh.scale.copy(this.mesh.scale)
    this.mesh.parent?.add(crackMesh)
    ;(this as any)._crackMesh = crackMesh
  }

  _shatter(hitPoint?: THREE.Vector3) {
    this.shattered = true

    // Get world position/size
    const worldPos = new THREE.Vector3()
    this.mesh.getWorldPosition(worldPos)
    const worldScale = new THREE.Vector3()
    this.mesh.getWorldScale(worldScale)

    const geo = this.mesh.geometry as THREE.BoxGeometry
    const params = geo.parameters
    const sizeX = params.width * worldScale.x
    const sizeY = params.height * worldScale.y
    const sizeZ = params.depth * worldScale.z

    const hp = hitPoint ?? worldPos

    // Remove glass mesh + crack overlay
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh)
    if ((this as any)._crackMesh?.parent)
      (this as any)._crackMesh.parent.remove((this as any)._crackMesh)

    // Spawn flat glass shards
    const count = 6 + Math.floor(Math.random() * 6)
    const chunks: object[] = []

    for (let i = 0; i < count; i++) {
      // Thin flat shards
      const sw = (0.05 + Math.random() * 0.15) * Math.max(sizeX, sizeZ)
      const sh = (0.05 + Math.random() * 0.15) * sizeY
      const sd = 0.01 + Math.random() * 0.02
      const sGeo = new THREE.BoxGeometry(sw, sh, sd)
      const sMat = new THREE.MeshLambertMaterial({
        color: SHARD_COLOR,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.3,
      })
      const shard = new THREE.Mesh(sGeo, sMat)
      shard.position.set(
        worldPos.x + (Math.random() - 0.5) * sizeX * 0.8,
        worldPos.y + (Math.random() - 0.5) * sizeY * 0.8,
        worldPos.z + (Math.random() - 0.5) * sizeZ * 0.8,
      )
      shard.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )
      this.scene.add(shard)

      const away = new THREE.Vector3().subVectors(shard.position, hp)
      if (away.length() < 0.01) away.set(Math.random() - 0.5, 0, Math.random() - 0.5)
      away.normalize().multiplyScalar(2 + Math.random() * 4)
      away.y += 1 + Math.random() * 2

      chunks.push({
        mesh: shard,
        vel: away,
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
        ),
        timer: 3 + Math.random() * 3,
      })
    }

    if (this.onShatter) this.onShatter(chunks)
    if (this.onBreak) this.onBreak(worldPos)
  }
}
