import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeLocker(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 0.50, 1.80, 0.40, 0x3A7AB8,    0, 0.90,    0)   // body — steel blue
    _box(g, 0.44, 0.04, 0.03, 0x2255AA,    0, 1.68, 0.205)  // vent top
    _box(g, 0.44, 0.04, 0.03, 0x2255AA,    0, 1.54, 0.205)  // vent 2
    _box(g, 0.02, 1.70, 0.02, 0x1A4A88,    0, 0.90,  0.21)  // centre divide line
    _box(g, 0.04, 0.22, 0.06, 0xCCCCCC,  0.10, 0.90,  0.21)  // handle
  }, 100)
}
