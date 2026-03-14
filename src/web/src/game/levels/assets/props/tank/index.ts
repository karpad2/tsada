import { makeDetailedProp, _box, _cyl } from '../../_utils.ts'

export function makeTank(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _cyl(g, 0.41, 0.41, 1.95, 0x22AA44,    0, 1.05,    0)  // body — bright green
    _cyl(g, 0.43, 0.43, 0.10, 0x1A8833,    0, 0.09,    0)  // bottom cap
    _cyl(g, 0.43, 0.43, 0.10, 0x1A8833,    0, 2.02,    0)  // top cap
    _box(g, 0.08, 0.18, 0.08, 0x888888,  0.12, 2.19, 0)    // valve top
    _box(g, 0.08, 0.06, 0.16, 0x666666,  0.12, 2.14, 0)    // valve handle
  }, 250)
}
