import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeCabinet(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 0.60, 1.80, 0.40, 0x5A6470,    0, 0.90,    0)   // body — slate gray
    // Two drawer divider lines
    _box(g, 0.56, 0.02, 0.04, 0x3A4450,    0, 0.90,  0.21)  // mid divider
    _box(g, 0.56, 0.02, 0.04, 0x3A4450,    0, 0.45,  0.21)  // lower divider
    // Two handles
    _box(g, 0.18, 0.04, 0.05, 0xBBBBBB,    0, 1.22,  0.22)  // upper handle
    _box(g, 0.18, 0.04, 0.05, 0xBBBBBB,    0, 0.62,  0.22)  // lower handle
  }, 100)
}
