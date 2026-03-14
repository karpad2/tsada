import * as THREE from 'three'
import { _wheel } from '../../_utils.ts'

function _add(g, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z)
  m.castShadow = m.receiveShadow = true; g.add(m); return m
}

export function addCar(scene, x, z, color = 0x3366CC, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)
  const mat  = new THREE.MeshLambertMaterial({ color})
  const dark = new THREE.MeshLambertMaterial({ color: Math.max(0, color - 0x1A1A1A)})

  // Body
  _add(g, new THREE.BoxGeometry(1.8, 0.85, 3.8), mat, 0, 0.62, 0)
  // Cabin
  _add(g, new THREE.BoxGeometry(1.5, 0.72, 2.0), dark, 0, 1.27, -0.12)
  // Front windshield
  _add(g, new THREE.BoxGeometry(1.4, 0.52, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x55AAEE, transparent: true, opacity: 0.55}),
    0, 1.05, 0.96)
  // Rear window
  _add(g, new THREE.BoxGeometry(1.3, 0.42, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x55AAEE, transparent: true, opacity: 0.55}),
    0, 1.10, -1.10)
  // Front bumper
  _add(g, new THREE.BoxGeometry(1.8, 0.18, 0.18),
    new THREE.MeshLambertMaterial({ color: 0x111111}), 0, 0.32, 1.98)
  // Headlights
  _add(g, new THREE.BoxGeometry(0.28, 0.16, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xFFFFAA, emissive: 0xFFDD44, emissiveIntensity: 0.7}),
    -0.68, 0.58, 1.92)
  _add(g, new THREE.BoxGeometry(0.28, 0.16, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xFFFFAA, emissive: 0xFFDD44, emissiveIntensity: 0.7}),
     0.68, 0.58, 1.92)
  // Tail lights
  _add(g, new THREE.BoxGeometry(0.28, 0.16, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xFF2222, emissive: 0xCC0000, emissiveIntensity: 0.6}),
    -0.68, 0.58, -1.90)
  _add(g, new THREE.BoxGeometry(0.28, 0.16, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xFF2222, emissive: 0xCC0000, emissiveIntensity: 0.6}),
     0.68, 0.58, -1.90)

  _wheel(g, -0.9, 1.2); _wheel(g, 0.9, 1.2)
  _wheel(g, -0.9, -1.2); _wheel(g, 0.9, -1.2)
  scene.add(g)
}
