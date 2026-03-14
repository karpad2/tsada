import * as THREE      from 'three'
import { Destructible } from '../../Destructible.ts'
import { getTex } from '../textures.ts'

// ── Surface property presets ──────────────────────────────────
const SURFACE = {
  metal:    {},
  wood:     {},
  concrete: {},
  fabric:   {},
  rubber:   {},
  plastic:  {},
  skin:     {},
  glass:    {},
  default:  {},
}

// ── Material helper ───────────────────────────────────────────
// Clones and repeats the texture so each surface tiles correctly.
export function _mat(color, texName, sizeU = 4, sizeV = 4, surface = 'default') {
  const s = SURFACE[surface] ?? SURFACE.default
  const m = new THREE.MeshLambertMaterial({ color })
  if (texName) {
    const t    = getTex(texName).clone()
    t.needsUpdate = true
    t.repeat.set(sizeU / 4, sizeV / 4)   // 1 repeat per 4 world-units
    m.map = t
  }
  return m
}

// ── Quick standard material ───────────────────────────────────
export function _std(color, surface = 'default') {
  const s = SURFACE[surface] ?? SURFACE.default
  return new THREE.MeshLambertMaterial({ color })
}

// ── Wheel helper (shared by vehicles) ────────────────────────
export function _wheel(g, x, z) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12),
    _std(0x111111, 'rubber'),
  )
  m.rotation.z = Math.PI / 2; m.position.set(x, 0.36, z); g.add(m)
}

// ── Base destructible prop (single box) ───────────────────────
export function makeProp(scene, x, z, w, h, d, color = 0x3a3030, hp = 60, surface = 'default') {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    _std(color, surface),
  )
  mesh.position.set(x, h / 2, z)
  mesh.castShadow = mesh.receiveShadow = true
  scene.add(mesh)
  return new Destructible(scene, mesh, hp)
}

// ── Multi-part prop using a Group ─────────────────────────────
// buildFn(group): add child meshes; y=0 in group space = floor level
export function makeDetailedProp(scene, x, z, buildFn, hp = 80) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  buildFn(g)
  scene.add(g)
  return new Destructible(scene, g, hp)
}

// Box sub-mesh — lx/ly/lz are local-space centers (ly=0 → sitting on floor)
export function _box(g, w, h, d, color, lx = 0, ly = 0, lz = 0, surface = 'default') {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    _std(color, surface),
  )
  m.position.set(lx, ly, lz)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  return m
}

// Emissive box (screens, LEDs, glowing panels)
export function _boxE(g, w, h, d, color, emissive, ei = 0.8, lx = 0, ly = 0, lz = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: ei}),
  )
  m.position.set(lx, ly, lz)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  return m
}

// Cylinder sub-mesh
export function _cyl(g, rT, rB, h, color, lx = 0, ly = 0, lz = 0, segs = 14, surface = 'default') {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rT, rB, h, segs),
    _std(color, surface),
  )
  m.position.set(lx, ly, lz)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  return m
}

// ── Shape-data-driven builders (for Asset Editor / custom assets) ──

/** Build material from shape definition — handles tex, opacity, surface */
export function _shapeMat(s) {
  const surface = s.surface ?? 'default'
  if (s.tex) {
    const mat = _mat(s.color, s.tex, s.sizeU ?? 4, s.sizeV ?? 4, surface)
    if (s.opacity != null && s.opacity < 1) { mat.transparent = true; mat.opacity = s.opacity }
    return mat
  }
  if (s.opacity != null && s.opacity < 1) {
    const sp = SURFACE[surface] ?? SURFACE.default
    return new THREE.MeshLambertMaterial({
      color: s.color,
      transparent: true, opacity: s.opacity,
    })
  }
  return _std(s.color, surface)
}

/** Box from shape definition (supports tex/opacity) */
export function _boxFromShape(g, s) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), _shapeMat(s))
  m.position.set(s.lx ?? 0, s.ly ?? 0, s.lz ?? 0)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  return m
}

/** Cylinder from shape definition (supports tex/opacity) */
export function _cylFromShape(g, s) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(s.rT, s.rB, s.h, s.segs ?? 14), _shapeMat(s))
  m.position.set(s.lx ?? 0, s.ly ?? 0, s.lz ?? 0)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  return m
}
