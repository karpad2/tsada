import { makeDetailedProp, _box, _cyl } from '../../_utils.ts'

export function makeGurney(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 0.70, 0.05, 1.90, 0xBBBBBB,    0, 0.72,    0)  // metal frame
    _box(g, 0.62, 0.10, 1.80, 0xF0F0F0,    0, 0.77,    0)  // mattress — white
    _box(g, 0.60, 0.08, 0.28, 0xDDDDDD,    0, 0.80, -0.86) // pillow
    for (const [lx, lz] of [[-0.30,-0.88],[0.30,-0.88],[-0.30,0.88],[0.30,0.88]])
      _box(g, 0.05, 0.72, 0.05, 0xAAAAAA, lx, 0.36,   lz)  // 4 legs
    // Caster wheels (small flat cylinders)
    for (const [lx, lz] of [[-0.30,-0.88],[0.30,-0.88],[-0.30,0.88],[0.30,0.88]])
      _cyl(g, 0.06, 0.06, 0.05, 0x444444, lx, 0.03,   lz)
  }, 50)
}
