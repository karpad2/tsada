import * as THREE from 'three'

export function addBag(scene, x, z, color = 0x3a2800) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.55, 0.35),
    new THREE.MeshLambertMaterial({ color}),
  )
  mesh.position.set(x, 0.28, z)
  mesh.castShadow = true
  scene.add(mesh)
  return mesh
}
