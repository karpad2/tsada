import * as THREE from 'three'
import { _box, _cyl, _std } from '../../_utils.ts'
import { Destructible } from '../../../../Destructible.ts'

export function makeSafe(s, x, z) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  // Static body (back + sides + top + bottom — the shell)
  _box(g, 0.80, 1.00, 0.60, 0x263C26, 0, 0.50, 0)

  // Door pivot — hinge at left edge of door face (x = -0.37)
  const doorPivot = new THREE.Group()
  doorPivot.position.set(-0.37, 0, 0.32)
  g.add(doorPivot)

  // Door face (in pivot local space — centre at x = +0.37 so left edge sits on hinge)
  _box(doorPivot, 0.74, 0.92, 0.04, 0x1A2C1A, 0.37, 0.50, 0)
  // Handle — bronze
  _box(doorPivot, 0.06, 0.28, 0.06, 0xAA8A00, 0.57, 0.50, 0.03)
  // Combination dial
  _cyl(doorPivot, 0.07, 0.07, 0.04, 0xCCCCCC, 0.22, 0.60, 0.03)
  // Dial pointer
  _cyl(doorPivot, 0.02, 0.02, 0.06, 0x888888, 0.22, 0.60, 0.07)

  s.add(g)
  const d = new Destructible(s, g, 350)
  // Attach pivot ref so LevelBuilder / Engine can animate the opening
  ;(d as any).doorPivot = doorPivot
  ;(d as any)._safeOpen = false
  return d
}
