import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeCrate(s, x, z, size = 1.1) {
  return makeDetailedProp(s, x, z, g => {
    const hs = size / 2
    _box(g, size, size, size, 0xD4A040, 0, hs, 0)  // body — bright tan wood
    // Horizontal strap on all 4 sides (classic wooden crate band)
    _box(g, size + 0.01, 0.07, 0.03, 0x8B5E20, 0, hs,  hs + 0.015)  // front
    _box(g, size + 0.01, 0.07, 0.03, 0x8B5E20, 0, hs, -hs - 0.015)  // back
    _box(g, 0.03, 0.07, size + 0.01, 0x8B5E20,  hs + 0.015, hs, 0)  // right
    _box(g, 0.03, 0.07, size + 0.01, 0x8B5E20, -hs - 0.015, hs, 0)  // left
  }, 60)
}
