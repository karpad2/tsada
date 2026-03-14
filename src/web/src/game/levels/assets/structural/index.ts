import * as THREE from 'three'
import { _mat }   from '../_utils.ts'

// Place a 'wall.png' / 'floor.png' etc. in this folder for a custom texture.

export function addWall(scene, x, z, w, h = 4, d, color = 0xcfbf9a, y = 0, tex) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    _mat(color, tex, Math.max(w, d), h),
  )
  m.position.set(x, y + h / 2, z)
  m.castShadow = m.receiveShadow = true
  scene.add(m)
  return m
}

export function addFloor(scene, x, z, w, d, color = 0x9a8a70, tex, y = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    _mat(color, tex, w, d),
  )
  m.rotation.x = -Math.PI / 2
  m.position.set(x, y, z)
  m.receiveShadow = true
  scene.add(m)
  return m
}

export function addCeiling(scene, x, z, w, d, h = 4, color = 0xe0d8cc) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshLambertMaterial({ color, side: THREE.BackSide}),
  )
  m.rotation.x = Math.PI / 2
  m.position.set(x, h, z)
  scene.add(m)
  return m
}

export function addPillar(scene, x, z, h = 4, color = 0xb0a080) {
  return addWall(scene, x, z, 0.4, h, 0.4, color)
}
