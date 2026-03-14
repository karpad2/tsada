import { makeDetailedProp, _box, _boxE } from '../../_utils.ts'

export function makeConsolePod(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g,  2.40, 1.00, 0.80, 0x1A1A30,    0, 0.50,    0)  // body — dark navy
    _boxE(g, 2.00, 0.55, 0.04, 0x112255, 0x0044CC, 0.9,  0, 0.72, 0.42)  // wide screen
    _box(g,  0.80, 0.05, 0.15, 0x333344,    0, 0.20, 0.41)  // button row
    _box(g,  0.08, 0.08, 0.08, 0xFF4400,  0.90, 0.98, 0.41) // status LED — red
    _box(g,  0.08, 0.08, 0.08, 0x00CC44, -0.90, 0.98, 0.41) // status LED — green
  }, 90)
}
