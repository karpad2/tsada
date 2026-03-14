import * as THREE      from 'three'
import { Destructible } from './Destructible.ts'

// ── Mesh helpers ──────────────────────────────────────────────
function addBox(scene, x, y, z, w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y + h / 2, z)
  m.castShadow    = true
  m.receiveShadow = true
  scene.add(m)
  return m
}

function addFloor(scene, x, z, w, d, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat)
  m.rotation.x = -Math.PI / 2
  m.position.set(x, 0, z)
  m.receiveShadow = true
  scene.add(m)
  return m
}

// ─────────────────────────────────────────────────────────────
// Level layout (top-down, Z- = north/back, Z+ = south/front)
//
//   +----------BACK WALL----------+     z: -10
//   |    VAULT  (x: -4 to +4)    |     z: -10 to -22
//   +-----+                +------+
//         |  doorway 4m    |           z: -10
//   +-----+----------------+------+    z: -10
//   |  LOBBY (x: -13 to +13)     |     z: -10 to +9
//   |  [desks]  [COUNTER]  [desks]|
//   +-----------------------------+    open front
//                 VAN                   z: +12
//
// Structural walls  → wallMeshes (always block)
// Props & counters  → Destructible (block until destroyed)
// ─────────────────────────────────────────────────────────────
export function buildLevel(scene) {
  const wallMeshes    = []   // structural, permanent collision
  const destructibles = []   // can be shot/blown up

  // ── Materials ─────────────────────────────────────────────
  const mFloor   = new THREE.MeshLambertMaterial({ color: 0x9a8a70})
  const mVaultFlr= new THREE.MeshLambertMaterial({ color: 0x606878})
  const mWall    = new THREE.MeshLambertMaterial({ color: 0xcfbf9a})
  const mCounter = new THREE.MeshLambertMaterial({ color: 0x6a3a18})
  const mProp    = new THREE.MeshLambertMaterial({ color: 0x3a3030})
  const mVault   = new THREE.MeshLambertMaterial({ color: 0x505870})

  // helper: structural wall (always blocks)
  function wall(x, y, z, w, h, d, mat = mWall) {
    const m = addBox(scene, x, y, z, w, h, d, mat)
    wallMeshes.push(m)
    return m
  }

  // helper: destructible prop (blocks until broken)
  function prop(x, z, w, h, d, mat, hp) {
    const m = addBox(scene, x, 0, z, w, h, d, mat.clone())
    const d_ = new Destructible(scene, m, hp)
    destructibles.push(d_)
    return d_
  }

  // ── Floors ────────────────────────────────────────────────
  addFloor(scene,  0,  -0.5, 26, 20, mFloor)
  addFloor(scene,  0, -16,    8, 12, mVaultFlr)

  // ── Structural lobby walls ────────────────────────────────
  wall(-13, 0,  -0.5, 0.4, 4, 20, mWall)    // left
  wall( 13, 0,  -0.5, 0.4, 4, 20, mWall)    // right
  // Back wall with 4 m doorway gap (x: -2 → +2)
  wall( -7.8, 0, -10, 10.4, 4, 0.4, mWall)  // left segment
  wall(  7.8, 0, -10, 10.4, 4, 0.4, mWall)  // right segment
  wall(   0,  2, -10,  5.2, 2, 0.4, mWall)  // door header

  // ── Vault corridor walls (structural) ─────────────────────
  wall(-4, 0, -16, 0.4, 4, 12, mVault)
  wall( 4, 0, -16, 0.4, 4, 12, mVault)
  wall( 0, 0, -22,  8,  4, 0.4, mVault)

  // ── Teller counter — two segments, DESTRUCTIBLE ───────────
  // left segment  x: -10 → -1.5  (width 8.5)
  prop(-5.75, -2, 8.5, 1.1, 0.5, mCounter, 160)
  // right segment x: +1.5 → +10  (width 8.5)
  prop( 5.75, -2, 8.5, 1.1, 0.5, mCounter, 160)

  // ── Lobby desks — DESTRUCTIBLE ────────────────────────────
  prop(-9,  4,   2.4, 0.9, 1.2, mProp, 55)
  prop( 9,  4,   2.4, 0.9, 1.2, mProp, 55)
  prop(-9,  6.5, 2.4, 0.9, 1.2, mProp, 55)
  prop( 9,  6.5, 2.4, 0.9, 1.2, mProp, 55)

  // ── Vault back-office desks — DESTRUCTIBLE ─────────────────
  prop(-7, -6, 2, 0.9, 1, mProp, 50)
  prop( 7, -6, 2, 0.9, 1, mProp, 50)

  // ── Money bags (objectives) ───────────────────────────────
  const bagMat = new THREE.MeshLambertMaterial({ color: 0x3a2800})
  const objectivePositions = [
    new THREE.Vector3(-2, 0, -19),
    new THREE.Vector3( 0, 0, -20),
    new THREE.Vector3( 2, 0, -19),
  ]
  const bagMeshes = objectivePositions.map(pos => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.35), bagMat.clone())
    m.position.set(pos.x, 0.28, pos.z)
    m.castShadow = true
    scene.add(m)
    return m
  })

  // ── Escape zone ───────────────────────────────────────────
  const escapePos    = new THREE.Vector3(0, 0, 12)
  const escapeRadius = 2.5
  const escapeGeo    = new THREE.CylinderGeometry(escapeRadius, escapeRadius, 0.06, 32)
  const escapeMat    = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.4 })
  const escapeDisc   = new THREE.Mesh(escapeGeo, escapeMat)
  escapeDisc.position.copy(escapePos)
  scene.add(escapeDisc)

  // Van
  const vanMat = new THREE.MeshLambertMaterial({ color: 0x222222})
  addBox(scene, 0, 0, 15, 3, 2, 6, vanMat).castShadow = true
  addBox(scene, 0, 0.8, 12.2, 2.6, 0.8, 0.1,
    new THREE.MeshLambertMaterial({ color: 0x3399ff, transparent: true, opacity: 0.5}))

  // ── Spawn points ──────────────────────────────────────────
  const spawnPoints = [
    new THREE.Vector3(-17, 0, -8),
    new THREE.Vector3( 17, 0, -8),
    new THREE.Vector3(-17, 0,  8),
    new THREE.Vector3( 17, 0,  8),
    new THREE.Vector3(  0, 0, -25),
  ]

  // ── Guard patrol routes ───────────────────────────────────
  const patrolRoutes = [
    [new THREE.Vector3(-9, 0, -4), new THREE.Vector3( 9, 0, -4)],
    [new THREE.Vector3(-8, 0,  4), new THREE.Vector3( 8, 0,  4)],
  ]

  // ── Static wall collision boxes ───────────────────────────
  const wallBoxes = wallMeshes.map(m => new THREE.Box3().setFromObject(m))

  return {
    wallBoxes, destructibles,
    objectivePositions, bagMeshes,
    spawnPoints, patrolRoutes,
    escapePos, escapeRadius,

    setEscapeActive(active) {
      escapeMat.color.set(active ? 0x44ff44 : 0x444444)
      escapeMat.opacity = active ? 0.65 : 0.35
    },
  }
}
