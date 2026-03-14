import { makeDetailedProp, _cyl, _box } from '../../_utils.ts'

export function makeGasTank(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _cyl(g, 0.38, 0.38, 1.80, 0x44aa44,  0, 0.95, 0)    // green body
    _cyl(g, 0.40, 0.40, 0.08, 0x338833,  0, 0.08, 0)    // bottom cap
    _cyl(g, 0.40, 0.40, 0.08, 0x338833,  0, 1.85, 0)    // top cap
    _box(g, 0.06, 0.14, 0.06, 0x888888,  0.10, 2.00, 0) // valve
    _box(g, 0.06, 0.04, 0.12, 0x666666,  0.10, 1.96, 0) // handle
    _cyl(g, 0.385, 0.385, 0.10, 0xffcc00, 0, 0.50, 0)   // yellow warning band
    _cyl(g, 0.385, 0.385, 0.10, 0xffcc00, 0, 1.40, 0)   // yellow warning band
  }, 120)
}
