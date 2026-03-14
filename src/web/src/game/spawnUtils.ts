import * as THREE from 'three'

const _testBox = new THREE.Box3()

/**
 * Check whether a position (x,z) collides with any wallBox or destructible.
 * Uses a capsule-like AABB (0.35m half-width, 2m tall).
 */
function _collides(x: number, z: number, wallBoxes: THREE.Box3[], destructibles: any[]): boolean {
  _testBox.min.set(x - 0.5, 0, z - 0.5)
  _testBox.max.set(x + 0.5, 2.0, z + 0.5)
  if (wallBoxes.some(b => b.intersectsBox(_testBox))) return true
  if (destructibles.some(d => !d.shattered && d.box3.intersectsBox(_testBox))) return true
  return false
}

/**
 * Given a desired spawn position, return a valid position that doesn't
 * overlap walls or props. Tries the original pos first, then spirals out.
 */
export function findClearSpawn(
  pos: THREE.Vector3,
  wallBoxes: THREE.Box3[],
  destructibles: any[] = [],
): THREE.Vector3 {
  // Fast path: no collision at desired pos
  if (!_collides(pos.x, pos.z, wallBoxes, destructibles)) return pos

  // Spiral search: try offsets in expanding rings
  for (let radius = 1; radius <= 6; radius += 1) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const tx = pos.x + Math.cos(angle) * radius
      const tz = pos.z + Math.sin(angle) * radius
      if (!_collides(tx, tz, wallBoxes, destructibles)) {
        return new THREE.Vector3(tx, 0, tz)
      }
    }
  }

  // Fallback: return original (better than not spawning)
  return pos
}
