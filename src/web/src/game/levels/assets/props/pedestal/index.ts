import { makeDetailedProp, _box } from '../../_utils.ts'

export function makePedestal(s, x, z) {
  return makeDetailedProp(s, x, z, g => {
    _box(g, 0.70, 0.10, 0.70, 0xDDDDDD,    0, 0.05,    0)  // base slab
    _box(g, 0.36, 0.90, 0.36, 0xF0F0F0,    0, 0.55,    0)  // column — white
    _box(g, 0.60, 0.10, 0.60, 0xDDDDDD,    0, 1.05,    0)  // capital slab
    _box(g, 0.54, 0.06, 0.54, 0xEEEEEE,    0, 1.13,    0)  // top lip
  }, 60)
}
