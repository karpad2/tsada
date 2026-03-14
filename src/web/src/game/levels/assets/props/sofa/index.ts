import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeSofa(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 2.20, 0.10, 0.85, 0x3A2A50,    0, 0.05,   0)   // base — dark plinth
    _box(g, 2.20, 0.30, 0.80, 0x7B4DAA,    0, 0.35,   0)   // seat cushion — purple
    _box(g, 2.20, 0.48, 0.18, 0x7B4DAA,    0, 0.64,-0.33)  // backrest
    _box(g, 0.18, 0.46, 0.80, 0x5A3A88, -1.1, 0.63,   0)   // left armrest
    _box(g, 0.18, 0.46, 0.80, 0x5A3A88,  1.1, 0.63,   0)   // right armrest
    // Cushion divider lines (2 pillows)
    _box(g, 0.03, 0.25, 0.04, 0x5A3A88,    0, 0.48, 0.38)  // centre seam
  }, 70)
}
