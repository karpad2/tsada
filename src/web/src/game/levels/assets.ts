import * as THREE      from 'three'
import { Destructible } from '../Destructible.ts'
import { getTex }       from './textures.ts'

// ── Material helper ───────────────────────────────────────────
// Clones and repeats the texture so each surface tiles correctly.
function _mat(color, texName, sizeU = 4, sizeV = 4) {
  const m = new THREE.MeshLambertMaterial({ color})
  if (texName) {
    const t    = getTex(texName).clone()
    t.needsUpdate = true
    t.repeat.set(sizeU / 4, sizeV / 4)   // 1 repeat per 4 world-units
    m.map = t
  }
  return m
}

// ── Structural (permanent, added to wallMeshes by LevelBuilder) ───

export function addWall(scene, x, z, w, h = 4, d, color = 0xcfbf9a, y = 0, tex) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    _mat(color, tex, Math.max(w, d), h),
  )
  m.position.set(x, y + h / 2, z)
  m.castShadow = m.receiveShadow = true
  scene.add(m)
  return m
}

export function addFloor(scene, x, z, w, d, color = 0x9a8a70, tex, y = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    _mat(color, tex, w, d),
  )
  m.rotation.x = -Math.PI / 2
  m.position.set(x, y, z)
  m.receiveShadow = true
  scene.add(m)
  return m
}

export function addCeiling(scene, x, z, w, d, h = 4, color = 0xe0d8cc) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshLambertMaterial({ color, side: THREE.BackSide}),
  )
  m.rotation.x = Math.PI / 2
  m.position.set(x, h, z)
  scene.add(m)
  return m
}

export function addPillar(scene, x, z, h = 4, color = 0xb0a080) {
  return addWall(scene, x, z, 0.4, h, 0.4, color)
}

// ── Destructible props ────────────────────────────────────────

export function makeProp(scene, x, z, w, h, d, color = 0x3a3030, hp = 60) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color}),
  )
  mesh.position.set(x, h / 2, z)
  mesh.castShadow = mesh.receiveShadow = true
  scene.add(mesh)
  return new Destructible(scene, mesh, hp)
}

// ── Named prop shortcuts ──────────────────────────────────────
// All return Destructible. Override hp via LevelBuilder prop data.
export const makeDesk        = (s,x,z) => makeProp(s, x, z, 2.2, 0.8, 1.0, 0x5a3a18, 80)
export const makeCrate       = (s,x,z,size=1.1) => makeProp(s, x, z, size, size, size, 0x8a6a40, 60)
export const makeBarrel      = (s,x,z) => makeProp(s, x, z, 0.55, 1.0, 0.55, 0x445566, 40)
export const makeShelf       = (s,x,z) => makeProp(s, x, z, 2.0, 2.0, 0.4, 0x6a5030, 70)
export const makeCounter     = (s,x,z,w=3,d=0.6) => makeProp(s, x, z, w, 1.0, d, 0x6a3a18, 120)
export const makeContainer   = (s,x,z) => makeProp(s, x, z, 2.4, 2.6, 6.0, 0x4a6a4a, 600)
export const makeDisplayCase = (s,x,z) => makeProp(s, x, z, 1.0, 1.2, 0.5, 0x99bbcc, 50)
export const makeSafe        = (s,x,z) => makeProp(s, x, z, 0.8, 1.0, 0.6, 0x303840, 350)
export const makeServerRack  = (s,x,z) => makeProp(s, x, z, 0.6, 2.0, 0.8, 0x1a1a2a, 80)
export const makeGamingTable = (s,x,z) => makeProp(s, x, z, 1.6, 0.85, 3.2, 0x1a5a1a, 120)
export const makePedestal    = (s,x,z) => makeProp(s, x, z, 0.7, 1.2, 0.7, 0xd0c8b0, 60)
export const makeFilingCab   = (s,x,z) => makeProp(s, x, z, 0.5, 1.3, 0.6, 0x5a6878, 90)
export const makeLocker      = (s,x,z) => makeProp(s, x, z, 0.5, 1.8, 0.4, 0x4a5a6a, 100)
export const makeSofa        = (s,x,z) => makeProp(s, x, z, 2.2, 0.85, 0.85, 0x4a3a5a, 70)
export const makeWorkbench   = (s,x,z) => makeProp(s, x, z, 2.8, 0.9, 0.7, 0x5a4a30, 100)
export const makeTank        = (s,x,z) => makeProp(s, x, z, 0.9, 2.2, 0.9, 0x3a4a3a, 250)
export const makeConsole     = (s,x,z) => makeProp(s, x, z, 1.4, 1.1, 0.6, 0x222222, 80)
export const makeCabinet     = (s,x,z) => makeProp(s, x, z, 0.6, 1.8, 0.4, 0x4a5060, 100)
export const makeGurney      = (s,x,z) => makeProp(s, x, z, 0.7, 0.7, 1.9, 0xd0d0d0, 50)
export const makeCargoBox    = (s,x,z) => makeProp(s, x, z, 1.6, 0.9, 1.1, 0x7a6a50, 70)
export const makeConsolePod  = (s,x,z) => makeProp(s, x, z, 2.4, 1.0, 0.8, 0x202830, 90)

// ── Vehicles (visual only — no collision) ────────────────────

function _wheel(g, x, z) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12),
    new THREE.MeshLambertMaterial({ color: 0x111111}),
  )
  m.rotation.z = Math.PI / 2; m.position.set(x, 0.36, z); g.add(m)
}

export function addVan(scene, x, z, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)
  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4.8),
    new THREE.MeshLambertMaterial({ color: 0x223344}))
  body.position.y = 0.95; g.add(body)
  // Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 2.1),
    new THREE.MeshLambertMaterial({ color: 0x1a2a36}))
  cab.position.set(0, 2.08, 1.05); g.add(cab)
  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x3399ff, transparent: true, opacity: 0.5}))
  ws.position.set(0, 1.82, 2.12); g.add(ws)
  _wheel(g, -1.1, 1.5); _wheel(g, 1.1, 1.5)
  _wheel(g, -1.1, -1.5); _wheel(g, 1.1, -1.5)
  scene.add(g)
}

export function addTruck(scene, x, z, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 7.0),
    new THREE.MeshLambertMaterial({ color: 0x334433}))
  body.position.y = 1.2; g.add(body)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.4),
    new THREE.MeshLambertMaterial({ color: 0x223322}))
  cab.position.set(0, 2.75, 2.4); g.add(cab)
  const ws = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x3399ff, transparent: true, opacity: 0.5}))
  ws.position.set(0, 2.6, 3.65); g.add(ws)
  for (const [px, pz] of [[-1.3,2.5],[1.3,2.5],[-1.3,-0.5],[1.3,-0.5],[-1.3,-2.8],[1.3,-2.8]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12),
      new THREE.MeshLambertMaterial({ color: 0x111111}))
    w.rotation.z = Math.PI / 2; w.position.set(px, 0.42, pz); g.add(w)
  }
  scene.add(g)
}

export function addCar(scene, x, z, color = 0x334466, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 3.8),
    new THREE.MeshLambertMaterial({ color}))
  body.position.y = 0.62; g.add(body)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 2.0),
    new THREE.MeshLambertMaterial({ color}))
  roof.position.set(0, 1.27, -0.1); g.add(roof)
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x3399ff, transparent: true, opacity: 0.5}))
  ws.position.set(0, 1.05, 0.95); g.add(ws)
  _wheel(g, -0.9, 1.2); _wheel(g, 0.9, 1.2)
  _wheel(g, -0.9, -1.2); _wheel(g, 0.9, -1.2)
  scene.add(g)
}

// Armored truck / police vehicle
export function addArmoredTruck(scene, x, z, angle = 0) {
  const g = new THREE.Group(); g.rotation.y = angle; g.position.set(x, 0, z)
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 5.5),
    new THREE.MeshLambertMaterial({ color: 0x3a4a3a}))
  body.position.y = 1.1; g.add(body)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 2.0),
    new THREE.MeshLambertMaterial({ color: 0x2a3a2a}))
  cab.position.set(0, 2.45, 1.4); g.add(cab)
  const ws = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x336699, transparent: true, opacity: 0.45}))
  ws.position.set(0, 2.2, 2.45); g.add(ws)
  for (const [px, pz] of [[-1.2,2.0],[1.2,2.0],[-1.2,-0.2],[1.2,-0.2],[-1.2,-2.0],[1.2,-2.0]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 12),
      new THREE.MeshLambertMaterial({ color: 0x111111}))
    w.rotation.z = Math.PI / 2; w.position.set(px, 0.44, pz); g.add(w)
  }
  scene.add(g)
}

// ── Escape disc ───────────────────────────────────────────────

export function addEscapeDisc(scene, x, z, radius = 2.5) {
  const geo = new THREE.CylinderGeometry(radius, radius, 0.06, 32)
  const mat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.4 })
  const disc = new THREE.Mesh(geo, mat)
  disc.position.set(x, 0.01, z)
  scene.add(disc)
  return {
    disc,
    setActive(active) {
      mat.color.set(active ? 0x44ff44 : 0x444444)
      mat.opacity = active ? 0.65 : 0.35
    },
  }
}

// ── Objective bag ─────────────────────────────────────────────

export function addBag(scene, x, z, color = 0x3a2800) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.55, 0.35),
    new THREE.MeshLambertMaterial({ color}),
  )
  mesh.position.set(x, 0.28, z)
  mesh.castShadow = true
  scene.add(mesh)
  return mesh
}

// ── Interior light ────────────────────────────────────────────

export function addPointLight(scene, x, y, z, intensity = 0.7, distance = 12, color = 0xfffce0) {
  const pl = new THREE.PointLight(color, intensity, distance)
  pl.position.set(x, y, z)
  scene.add(pl)
  return pl
}
