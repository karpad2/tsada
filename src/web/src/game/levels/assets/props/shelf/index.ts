import { makeDetailedProp, _box } from '../../_utils.ts'

export function makeShelf(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 0.05, 2.0, 0.40, 0x9B6A2A, -0.97, 1.0,    0)  // left side panel
    _box(g, 0.05, 2.0, 0.40, 0x9B6A2A,  0.97, 1.0,    0)  // right side panel
    _box(g, 2.0,  2.0, 0.04, 0x9B6A2A,    0,  1.0, -0.18) // back panel
    _box(g, 1.90, 0.05, 0.40, 0xC8902A,   0,  0.05,   0)  // bottom board
    _box(g, 1.90, 0.05, 0.40, 0xC8902A,   0,  0.68,   0)  // shelf 1
    _box(g, 1.90, 0.05, 0.40, 0xC8902A,   0,  1.32,   0)  // shelf 2
    _box(g, 1.90, 0.05, 0.40, 0xC8902A,   0,  1.96,   0)  // top shelf
  }, 70)
}
