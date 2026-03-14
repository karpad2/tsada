import * as THREE from 'three'

function _add(g, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z)
  m.castShadow = m.receiveShadow = true; g.add(m); return m
}

export function addArmoredTruck(scene, x, z, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)

  // Main armoured body — military dark olive
  _add(g, new THREE.BoxGeometry(2.4, 1.9, 5.5),
    new THREE.MeshLambertMaterial({ color: 0x3A4E2A}), 0, 1.1, 0)
  // Cab — slightly different shade
  _add(g, new THREE.BoxGeometry(2.2, 0.9, 2.0),
    new THREE.MeshLambertMaterial({ color: 0x2E3E20}), 0, 2.45, 1.4)
  // Bulletproof windshield — dark tinted
  _add(g, new THREE.BoxGeometry(2.0, 0.58, 0.10),
    new THREE.MeshLambertMaterial({ color: 0x334455, transparent: true, opacity: 0.45}),
    0, 2.20, 2.45)
  // Armour side panels (raised ridges)
  _add(g, new THREE.BoxGeometry(0.06, 1.5, 5.5),
    new THREE.MeshLambertMaterial({ color: 0x2A3A1A}), -1.23, 1.45, 0)
  _add(g, new THREE.BoxGeometry(0.06, 1.5, 5.5),
    new THREE.MeshLambertMaterial({ color: 0x2A3A1A}),  1.23, 1.45, 0)
  // Front push-bar
  _add(g, new THREE.BoxGeometry(2.4, 0.14, 0.18),
    new THREE.MeshLambertMaterial({ color: 0x1A1A1A}), 0, 0.38, 2.78)
  _add(g, new THREE.BoxGeometry(2.4, 0.14, 0.18),
    new THREE.MeshLambertMaterial({ color: 0x1A1A1A}), 0, 0.78, 2.78)
  // Headlights (caged)
  for (const px of [-0.75, 0.75])
    _add(g, new THREE.BoxGeometry(0.36, 0.22, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xFFEEAA, emissive: 0xDDAA22, emissiveIntensity: 0.6}),
      px, 1.72, 2.48)
  // Roof light bar
  _add(g, new THREE.BoxGeometry(1.6, 0.14, 0.35),
    new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0xDD2200, emissiveIntensity: 0.5}),
    0, 2.08, 1.2)

  for (const [px, pz] of [[-1.2,2.0],[1.2,2.0],[-1.2,-0.2],[1.2,-0.2],[-1.2,-2.0],[1.2,-2.0]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 12),
      new THREE.MeshLambertMaterial({ color: 0x111111}))
    w.rotation.z = Math.PI / 2; w.position.set(px, 0.44, pz)
    w.castShadow = true; g.add(w)
  }
  scene.add(g)
}
