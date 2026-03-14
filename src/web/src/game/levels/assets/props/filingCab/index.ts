import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeFilingCab(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 0.50, 1.30, 0.60, 0x5A7090,    0, 0.65,    0)  // body — steel blue-gray
    // 3 drawer faces (inset)
    _box(g, 0.44, 0.26, 0.04, 0x6A88A8,    0, 0.42, 0.32)
    _box(g, 0.44, 0.26, 0.04, 0x6A88A8,    0, 0.73, 0.32)
    _box(g, 0.44, 0.26, 0.04, 0x6A88A8,    0, 1.04, 0.32)
    // 3 handles
    _box(g, 0.14, 0.04, 0.05, 0xBBBBBB,    0, 0.42, 0.35)
    _box(g, 0.14, 0.04, 0.05, 0xBBBBBB,    0, 0.73, 0.35)
    _box(g, 0.14, 0.04, 0.05, 0xBBBBBB,    0, 1.04, 0.35)
  }, 90)
}
