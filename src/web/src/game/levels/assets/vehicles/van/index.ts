import * as THREE from 'three'
import { _wheel } from '../../_utils.ts'

function _m(color) {
  return new THREE.MeshLambertMaterial({ color })
}
function _add(g, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z)
  m.castShadow = m.receiveShadow = true; g.add(m); return m
}

export function addVan(scene, x, z, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)

  // Main cargo box — bright police/courier blue
  _add(g, new THREE.BoxGeometry(2.2, 1.6, 4.8), _m(0x1A55AA), 0, 0.95, 0)
  // Cab roof raised section
  _add(g, new THREE.BoxGeometry(2.0, 0.85, 2.1), _m(0x144488), 0, 2.08, 1.05)
  // Windshield
  _add(g, new THREE.BoxGeometry(1.9, 0.65, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x66BBFF, transparent: true, opacity: 0.55}),
    0, 1.82, 2.12)
  // Rear doors — hint (two darker panels)
  _add(g, new THREE.BoxGeometry(1.0, 1.4, 0.05), _m(0x0F3A7A), -0.55, 0.90, -2.43)
  _add(g, new THREE.BoxGeometry(1.0, 1.4, 0.05), _m(0x0F3A7A),  0.55, 0.90, -2.43)
  // Bumper front
  _add(g, new THREE.BoxGeometry(2.2, 0.20, 0.20), _m(0x111111, 0.4, 0.7), 0, 0.42, 2.52)
  // Headlights
  _add(g, new THREE.BoxGeometry(0.30, 0.22, 0.06), new THREE.MeshLambertMaterial({
    color: 0xFFFFAA, emissive: 0xFFDD44, emissiveIntensity: 0.7}), -0.72, 0.55, 2.44)
  _add(g, new THREE.BoxGeometry(0.30, 0.22, 0.06), new THREE.MeshLambertMaterial({
    color: 0xFFFFAA, emissive: 0xFFDD44, emissiveIntensity: 0.7}),  0.72, 0.55, 2.44)

  _wheel(g, -1.1, 1.5); _wheel(g, 1.1, 1.5)
  _wheel(g, -1.1, -1.5); _wheel(g, 1.1, -1.5)
  scene.add(g)
}
