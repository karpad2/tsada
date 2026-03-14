import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeDesk(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 2.2,  0.08, 1.0,  0xD4972A,    0, 0.84,   0)  // tabletop — warm wood
    _box(g, 2.16, 0.68, 0.04, 0xBB8020,    0, 0.42, 0.49)  // front modesty panel
    for (const [lx, lz] of [[-1.04,-0.44],[1.04,-0.44],[-1.04,0.44],[1.04,0.44]])
      _box(g, 0.07, 0.80, 0.07, 0x7A4E14, lx, 0.40,   lz)  // 4 legs
  }, 80)
}
