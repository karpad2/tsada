import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeCounter(s, x, z, w = 3, d = 0.6) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, w, 0.87, d, 0x9B6A1A,     0, 0.435,    0)  // body — warm wood
    _box(g, w, 0.10, d, 0xD4C48A,     0, 0.95,     0)  // countertop — light marble
    _box(g, w, 0.87, 0.04, 0x7A5018,  0, 0.435, d * 0.5 + 0.02)  // front kick panel
  }, 120)
}
