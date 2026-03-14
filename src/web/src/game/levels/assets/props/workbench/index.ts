import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeWorkbench(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 2.80, 0.08, 0.70, 0xA07A3A,    0, 0.89,    0)  // worktop — light wood
    _box(g, 2.80, 0.06, 0.68, 0x7A5A1A,    0, 0.40,    0)  // lower shelf
    for (const [lx, lz] of [[-1.32,-0.30],[1.32,-0.30],[-1.32,0.30],[1.32,0.30]])
      _box(g, 0.07, 0.88, 0.07, 0x5A3A18, lx, 0.44,   lz)  // 4 legs — dark wood
  }, 100)
}
