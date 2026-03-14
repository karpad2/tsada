import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeContainer(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 2.40, 2.60, 6.00, 0x2266AA,    0, 1.30,    0)  // body — shipping blue
    // 4 vertical corner posts
    for (const [cx, cz] of [[-1.14,-2.88],[1.14,-2.88],[-1.14,2.88],[1.14,2.88]])
      _box(g, 0.14, 2.60, 0.14, 0x0A0A14, cx, 1.30, cz)
    _box(g, 2.40, 0.10, 6.00, 0x1A4A88,   0, 2.57,    0)  // top ridge — darker blue
    // Door marks on one end
    _box(g, 0.04, 2.40, 0.04, 0x0A0A14,    0, 1.30, -2.99)  // centre seam line
  }, 600)
}
