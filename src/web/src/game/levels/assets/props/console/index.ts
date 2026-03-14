import { makeDetailedProp, _box, _boxE } from '../../_utils.ts'

export function makeConsole(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g,  1.40, 1.10, 0.60, 0x1A1A26,    0, 0.55,    0)  // body — dark chassis
    _boxE(g, 1.10, 0.55, 0.04, 0x112244, 0x0033CC, 0.9,  0, 0.72, 0.32)  // screen — blue glow
    _box(g,  1.10, 0.05, 0.22, 0x333340,    0, 0.33, 0.30)  // keyboard tray
    _box(g,  0.08, 0.08, 0.08, 0x00CC44, -0.40, 1.05, 0.32) // power LED — green
  }, 80)
}
