import { makeDetailedProp, _cyl } from '../../_utils.ts'

export function makeBarrel(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _cyl(g, 0.25, 0.25, 0.88, 0x2255BB, 0, 0.48, 0)       // body — blue steel drum
    _cyl(g, 0.275, 0.275, 0.055, 0x999999, 0, 0.08, 0)    // bottom ring
    _cyl(g, 0.275, 0.275, 0.055, 0x999999, 0, 0.48, 0)    // mid ring
    _cyl(g, 0.275, 0.275, 0.055, 0x999999, 0, 0.88, 0)    // top ring
  }, 40)
}
