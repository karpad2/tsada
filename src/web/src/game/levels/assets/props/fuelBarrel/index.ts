import { makeDetailedProp, _cyl } from '../../_utils.ts'

export function makeFuelBarrel(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _cyl(g, 0.27, 0.27, 0.92, 0xcc2222,  0, 0.50, 0)    // red body
    _cyl(g, 0.29, 0.29, 0.06, 0x333333,  0, 0.08, 0)    // bottom ring
    _cyl(g, 0.29, 0.29, 0.06, 0x333333,  0, 0.50, 0)    // mid ring
    _cyl(g, 0.29, 0.29, 0.06, 0x333333,  0, 0.92, 0)    // top ring
    _cyl(g, 0.04, 0.04, 0.08, 0x888888, -0.10, 0.96, 0)  // fill cap
    _cyl(g, 0.28, 0.28, 0.28, 0xff5500,  0, 0.50, 0)    // flame-label band
  }, 60)
}
