import * as THREE from 'three'

/**
 * Build a quadcopter drone mesh.
 * Returns rotors[] array for spinning animation.
 */
export function buildDroneMesh(scene, pos, cfg, self) {
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x222222 })
  const propMat = new THREE.MeshLambertMaterial({ color: 0x555555 })
  const lensMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6 })

  const g = new THREE.Group()
  g.position.set(pos.x, cfg.flyHeight ?? 5, pos.z)

  // Central body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), bodyMat)
  body.castShadow = true
  g.add(body)

  // Camera lens
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), lensMat)
  lens.position.set(0, -0.05, -0.28)
  g.add(lens)

  // Arms + rotors
  const rotors = []
  const armOffsets = [
    { x: -0.35, z: -0.35 },
    { x:  0.35, z: -0.35 },
    { x: -0.35, z:  0.35 },
    { x:  0.35, z:  0.35 },
  ]
  for (const off of armOffsets) {
    // Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), bodyMat)
    arm.position.set(off.x * 0.5, 0, off.z * 0.5)
    g.add(arm)
    // Rotor disc
    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.02, 8),
      propMat,
    )
    rotor.position.set(off.x, 0.10, off.z)
    g.add(rotor)
    rotors.push(rotor)
  }

  // Bomber: underside payload
  if (cfg.bombInterval) {
    const payload = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.25), bodyMat)
    payload.position.set(0, -0.12, 0)
    g.add(payload)
  }

  // Hitbox (invisible, for raycasting)
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.3, 0.8),
    new THREE.MeshBasicMaterial({ visible: false }),
  )
  hitbox.position.copy(g.position)
  hitbox.userData.enemy = self
  scene.add(hitbox)

  self._rotors = rotors
  self._hitboxMesh = hitbox
  self.hitboxes = [hitbox]
  self.group = g
  scene.add(g)
}
