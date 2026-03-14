import { makeDetailedProp, _box, _boxE } from '../../_utils.ts'

export function makeServerRack(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 0.60, 2.00, 0.80, 0x0A0A14,   0,  1.0,    0)  // outer frame — near-black
    // Server units (alternating shades, front-mounted)
    const cols = [0x00CC44, 0xFF8800, 0x00CC44, 0x00CC44, 0xFF8800, 0x00CC44]
    for (let i = 0; i < 6; i++) {
      _box(g,  0.52, 0.12, 0.74, 0x1A2235,  0, 0.16 + i * 0.28,  0)   // server unit
      _boxE(g, 0.06, 0.04, 0.04, cols[i], cols[i], 1.0, -0.22, 0.16 + i * 0.28, 0.41) // LED
    }
  }, 80)
}
