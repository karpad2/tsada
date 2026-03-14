import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeCargoBox(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 1.60, 0.90, 1.10, 0xB09050,    0, 0.45,    0)  // body — tan cargo
    // 2 packing straps (front/back)
    _box(g, 1.61, 0.07, 0.05, 0x6B4C10,    0, 0.45,  0.45)
    _box(g, 1.61, 0.07, 0.05, 0x6B4C10,    0, 0.45, -0.45)
    // Edge corner plates
    for (const [cx, cz] of [[-0.78,-0.54],[0.78,-0.54],[-0.78,0.54],[0.78,0.54]])
      _box(g, 0.06, 0.92, 0.06, 0x8B6A30, cx, 0.46, cz)
  }, 70)
}
