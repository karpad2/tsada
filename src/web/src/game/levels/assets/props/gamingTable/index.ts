import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeGamingTable(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 1.60, 0.06, 3.20, 0x1A7A34,    0, 0.86,    0)  // felt top — bright green
    // Padded rail around edge
    _box(g, 1.60, 0.08, 0.06, 0x3A2010,    0, 0.90,  1.61)  // far rail
    _box(g, 1.60, 0.08, 0.06, 0x3A2010,    0, 0.90, -1.61)  // near rail
    _box(g, 0.06, 0.08, 3.20, 0x3A2010,  0.83, 0.90,   0)   // right rail
    _box(g, 0.06, 0.08, 3.20, 0x3A2010, -0.83, 0.90,   0)   // left rail
    for (const [lx, lz] of [[-0.75,-1.52],[0.75,-1.52],[-0.75,1.52],[0.75,1.52]])
      _box(g, 0.09, 0.86, 0.09, 0x5A3A18, lx, 0.43,   lz)  // 4 legs
  }, 120)
}
