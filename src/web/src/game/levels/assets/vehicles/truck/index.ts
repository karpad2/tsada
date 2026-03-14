import * as THREE from 'three'

function _add(g, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z)
  m.castShadow = m.receiveShadow = true; g.add(m); return m
}

export function addTruck(scene, x, z, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)

  // Cargo box — bright delivery white with green stripe
  _add(g, new THREE.BoxGeometry(2.6, 2.2, 7.0),
    new THREE.MeshLambertMaterial({ color: 0xEEEEDD}), 0, 1.2, 0)
  // Side stripe
  _add(g, new THREE.BoxGeometry(0.04, 0.35, 7.02),
    new THREE.MeshLambertMaterial({ color: 0x228833}), -1.31, 1.55, 0)
  _add(g, new THREE.BoxGeometry(0.04, 0.35, 7.02),
    new THREE.MeshLambertMaterial({ color: 0x228833}),  1.31, 1.55, 0)
  // Cab — darker
  _add(g, new THREE.BoxGeometry(2.4, 1.1, 2.4),
    new THREE.MeshLambertMaterial({ color: 0x558844}), 0, 2.75, 2.4)
  // Windshield
  _add(g, new THREE.BoxGeometry(2.2, 0.8, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x66BBFF, transparent: true, opacity: 0.55}),
    0, 2.6, 3.65)
  // Front bumper + grille
  _add(g, new THREE.BoxGeometry(2.6, 0.22, 0.22),
    new THREE.MeshLambertMaterial({ color: 0x222222}), 0, 0.5, 3.66)
  _add(g, new THREE.BoxGeometry(2.0, 0.55, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x333333}), 0, 1.05, 3.66)
  // Headlights
  for (const px of [-0.85, 0.85])
    _add(g, new THREE.BoxGeometry(0.38, 0.22, 0.06),
      new THREE.MeshLambertMaterial({ color: 0xFFFFAA, emissive: 0xFFDD44, emissiveIntensity: 0.7}),
      px, 1.68, 3.67)
  // Exhaust pipe
  _add(g, new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8),
    new THREE.MeshLambertMaterial({ color: 0x555555}), 1.38, 2.55, 0.5)

  for (const [px, pz] of [[-1.3,2.5],[1.3,2.5],[-1.3,-0.5],[1.3,-0.5],[-1.3,-2.8],[1.3,-2.8]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12),
      new THREE.MeshLambertMaterial({ color: 0x111111}))
    w.rotation.z = Math.PI / 2; w.position.set(px, 0.42, pz)
    w.castShadow = true; g.add(w)
  }
  scene.add(g)
}
