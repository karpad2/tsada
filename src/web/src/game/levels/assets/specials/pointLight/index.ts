import * as THREE from 'three'

export function addPointLight(scene, x, y, z, intensity = 0.7, distance = 12, color = 0xfffce0) {
  const pl = new THREE.PointLight(color, intensity, distance, 2)
  pl.position.set(x, y, z)
  scene.add(pl)
  return pl
}
