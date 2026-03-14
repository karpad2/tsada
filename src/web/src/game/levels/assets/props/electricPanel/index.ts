import { makeDetailedProp, _box, _boxE } from '../../_utils.ts'

export function makeElectricPanel(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g,  0.70, 0.90, 0.18, 0x555555,   0,    0.75,    0)    // main box
    _box(g,  0.60, 0.78, 0.04, 0x333333,   0,    0.75, -0.10)   // door panel
    _box(g,  0.04, 0.12, 0.06, 0x222222,   0.28, 0.75, -0.13)   // handle
    _box(g,  0.68, 0.06, 0.04, 0xffcc00,   0,    1.18, -0.10)   // warning stripe
    _boxE(g, 0.04, 0.20, 0.04, 0xcc0000, 0xff2200, 0.5, -0.18, 0.80, -0.04) // red wire
    _boxE(g, 0.04, 0.20, 0.04, 0x0044cc, 0x0066ff, 0.5,  0.00, 0.80, -0.04) // blue wire
    _boxE(g, 0.04, 0.20, 0.04, 0xcccc00, 0xffff00, 0.5,  0.18, 0.80, -0.04) // yellow wire
  }, 80)
}
