import * as THREE from 'three'
import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeDisplayCase(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 1.00, 0.14, 0.50, 0xBB9944,    0, 0.07,    0)  // base — gold wood
    // Glass body (transparent)
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 1.00, 0.46),
      new THREE.MeshLambertMaterial({ color: 0xAADDFF, transparent: true, opacity: 0.3}),
    )
    glass.position.set(0, 0.64, 0)
    g.add(glass)
    _box(g, 1.00, 0.05, 0.50, 0xBB9944,    0, 1.17,    0)  // top cap
    // 4 slim corner posts
    for (const [px, pz] of [[-0.47,-0.22],[0.47,-0.22],[-0.47,0.22],[0.47,0.22]])
      _box(g, 0.04, 1.02, 0.04, 0x9B7A2A, px, 0.65, pz)
  }, 50)
}
