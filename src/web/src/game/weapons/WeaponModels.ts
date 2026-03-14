// ─────────────────────────────────────────────────────────────
// WeaponModels — shared 3D weapon meshes used by both
// WeaponView (FPS first-person) and EnemyMesh (third-person).
// Each builder returns a THREE.Group centred at the origin.
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three'

function bx(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}

function cyl(r: number, len: number, mat: THREE.Material, segs = 6) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segs), mat)
}

// ── Pistol ──────────────────────────────────────────────────
export function buildPistolModel(): THREE.Group {
  const darkGray = new THREE.MeshLambertMaterial({ color: 0x333338 })
  const midGray  = new THREE.MeshLambertMaterial({ color: 0x55555c })
  const tan      = new THREE.MeshLambertMaterial({ color: 0xc09060 })
  const yellow   = new THREE.MeshLambertMaterial({ color: 0xffcc00 })
  const black    = new THREE.MeshLambertMaterial({ color: 0x111114 })

  const g = new THREE.Group()
  g.add(bx(0.082, 0.115, 0.240, midGray,  0,      0,       0))
  g.add(bx(0.078, 0.044, 0.225, darkGray, 0,  0.078,   0))
  g.add(bx(0.038, 0.038, 0.135, black,    0,  0.058,  -0.178))
  g.add(bx(0.078, 0.162, 0.074, tan,      0, -0.122,   0.058))
  g.add(bx(0.042, 0.014, 0.066, midGray,  0, -0.058,   0.012))
  g.add(bx(0.080, 0.026, 0.076, yellow,   0, -0.062,   0.058))
  g.add(bx(0.014, 0.020, 0.014, darkGray, 0,  0.108,  -0.068))
  g.add(bx(0.010, 0.016, 0.010, darkGray, 0,  0.050,  -0.175))
  return g
}

// ── SMG ─────────────────────────────────────────────────────
export function buildSMGModel(): THREE.Group {
  const darkGray = new THREE.MeshLambertMaterial({ color: 0x2a2a30 })
  const midGray  = new THREE.MeshLambertMaterial({ color: 0x48484f })
  const black    = new THREE.MeshLambertMaterial({ color: 0x111114 })
  const brown    = new THREE.MeshLambertMaterial({ color: 0x5a3820 })

  const g = new THREE.Group()
  g.add(bx(0.095, 0.105, 0.280, midGray,  0,       0,      0))
  g.add(bx(0.090, 0.038, 0.260, darkGray, 0,   0.070,      0))
  g.add(bx(0.040, 0.040, 0.110, black,    0,   0.048,  -0.185))
  g.add(bx(0.068, 0.130, 0.052, darkGray, 0.0, -0.118,  0.038))
  g.add(bx(0.088, 0.055, 0.100, midGray,  0,  -0.038,  -0.110))
  g.add(bx(0.075, 0.140, 0.068, brown,    0,  -0.118,   0.100))
  g.add(bx(0.040, 0.044, 0.055, darkGray, 0,  -0.010,   0.165))
  g.add(bx(0.010, 0.018, 0.010, black,    0,   0.090,  -0.180))
  return g
}

// ── Shotgun ─────────────────────────────────────────────────
export function buildShotgunModel(): THREE.Group {
  const darkGray = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
  const midGray  = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
  const wood     = new THREE.MeshLambertMaterial({ color: 0x7a4020 })
  const black    = new THREE.MeshLambertMaterial({ color: 0x111114 })

  const g = new THREE.Group()
  g.add(bx(0.095, 0.095, 0.200, midGray,  0,      0,      0))
  g.add(bx(0.046, 0.046, 0.300, black,    0,  0.024,  -0.250))
  g.add(bx(0.038, 0.038, 0.270, darkGray, 0, -0.030,  -0.215))
  g.add(bx(0.082, 0.050, 0.110, wood,     0, -0.020,  -0.170))
  g.add(bx(0.080, 0.090, 0.200, wood,     0, -0.020,   0.120))
  g.add(bx(0.072, 0.130, 0.065, wood,     0, -0.090,   0.040))
  g.add(bx(0.010, 0.022, 0.010, darkGray, 0,  0.062,  -0.388))
  g.add(bx(0.042, 0.022, 0.052, black,    0, -0.030,   0.000))
  return g
}

// ── Rifle (assault rifle) ───────────────────────────────────
export function buildRifleModel(): THREE.Group {
  const darkGray = new THREE.MeshLambertMaterial({ color: 0x262630 })
  const midGray  = new THREE.MeshLambertMaterial({ color: 0x3d3d46 })
  const black    = new THREE.MeshLambertMaterial({ color: 0x111114 })
  const green    = new THREE.MeshLambertMaterial({ color: 0x2a3820 })

  const g = new THREE.Group()
  g.add(bx(0.088, 0.085, 0.310, midGray,  0,   0.030,      0))
  g.add(bx(0.085, 0.065, 0.180, darkGray, 0,  -0.030,   0.040))
  g.add(bx(0.038, 0.038, 0.260, black,    0,   0.048,  -0.260))
  g.add(bx(0.044, 0.044, 0.042, darkGray, 0,   0.048,  -0.385))
  g.add(bx(0.064, 0.165, 0.068, darkGray, 0,  -0.120,   0.050))
  g.add(bx(0.070, 0.135, 0.065, green,    0,  -0.095,   0.112))
  g.add(bx(0.058, 0.075, 0.195, midGray,  0,   0.010,   0.185))
  g.add(bx(0.072, 0.055, 0.030, midGray,  0,  -0.008,   0.290))
  g.add(bx(0.086, 0.068, 0.190, midGray,  0,  -0.008,  -0.140))
  g.add(bx(0.020, 0.030, 0.070, darkGray, 0,   0.088,  -0.010))
  g.add(bx(0.020, 0.035, 0.018, darkGray, 0,   0.088,  -0.280))
  return g
}

// ── Sniper ──────────────────────────────────────────────────
export function buildSniperModel(): THREE.Group {
  const darkGray  = new THREE.MeshLambertMaterial({ color: 0x1e1e24 })
  const midGray   = new THREE.MeshLambertMaterial({ color: 0x3a3a44 })
  const black     = new THREE.MeshLambertMaterial({ color: 0x111114 })
  const tan       = new THREE.MeshLambertMaterial({ color: 0x9a8060 })
  const scopeGray = new THREE.MeshLambertMaterial({ color: 0x222228 })

  const g = new THREE.Group()
  g.add(bx(0.090, 0.090, 0.260, midGray,  0,   0,          0))
  g.add(bx(0.036, 0.036, 0.360, black,    0,   0.027,  -0.290))
  g.add(bx(0.048, 0.048, 0.038, darkGray, 0,   0.027,  -0.466))
  g.add(bx(0.048, 0.048, 0.200, scopeGray,0,   0.090,  -0.050))
  g.add(bx(0.060, 0.060, 0.042, scopeGray,0,   0.090,  -0.145))
  g.add(bx(0.055, 0.055, 0.036, scopeGray,0,   0.090,   0.044))
  g.add(bx(0.028, 0.048, 0.026, darkGray, 0,   0.068,  -0.040))
  g.add(bx(0.028, 0.048, 0.026, darkGray, 0,   0.068,   0.025))
  g.add(bx(0.062, 0.090, 0.054, darkGray, 0,  -0.095,   0.030))
  g.add(bx(0.068, 0.130, 0.062, tan,      0,  -0.080,   0.105))
  g.add(bx(0.074, 0.095, 0.240, midGray,  0,   0.012,   0.180))
  g.add(bx(0.010, 0.055, 0.010, darkGray,-0.028, -0.022, -0.170))
  g.add(bx(0.010, 0.055, 0.010, darkGray, 0.028, -0.022, -0.170))
  return g
}

// ── Suppressed pistol (enemy-only: pistol + silencer) ───────
export function buildSuppressedModel(): THREE.Group {
  const g = buildPistolModel()
  const darkGray = new THREE.MeshLambertMaterial({ color: 0x222228 })
  const supp = cyl(0.026, 0.22, darkGray)
  supp.rotation.x = Math.PI / 2
  supp.position.set(0, 0.050, -0.32)
  supp.castShadow = true
  g.add(supp)
  return g
}

// ── LMG ───────────────────────────────────────────────────
export function buildLMGModel(): THREE.Group {
  const darkGray = new THREE.MeshLambertMaterial({ color: 0x262630 })
  const midGray  = new THREE.MeshLambertMaterial({ color: 0x3d3d46 })
  const black    = new THREE.MeshLambertMaterial({ color: 0x111114 })

  const g = new THREE.Group()
  g.add(bx(0.10, 0.10, 0.36, midGray, 0, 0, 0))          // receiver
  g.add(bx(0.10, 0.08, 0.22, darkGray, 0, -0.04, 0.05))   // lower
  g.add(bx(0.04, 0.04, 0.28, black, 0, 0.05, -0.28))      // barrel
  g.add(bx(0.05, 0.05, 0.04, darkGray, 0, 0.05, -0.42))   // muzzle brake
  // Drum magazine
  const drum = cyl(0.10, 0.06, darkGray, 12)
  drum.position.set(0, -0.14, -0.05); g.add(drum)
  // Stock
  g.add(bx(0.07, 0.12, 0.22, midGray, 0, -0.01, 0.22))
  g.add(bx(0.06, 0.09, 0.06, midGray, 0, -0.04, 0.34))
  // Bipod legs
  g.add(bx(0.02, 0.10, 0.02, black, -0.06, -0.10, -0.28))
  g.add(bx(0.02, 0.10, 0.02, black,  0.06, -0.10, -0.28))
  // Grip
  g.add(bx(0.065, 0.14, 0.06, darkGray, 0, -0.11, 0.05))
  return g
}

// ── Dual Pistols ──────────────────────────────────────────
export function buildDualPistolsModel(): THREE.Group {
  const g = new THREE.Group()
  const left  = buildPistolModel(); left.position.set(-0.12, 0, 0)
  const right = buildPistolModel(); right.position.set(0.12, 0, 0)
  g.add(left, right)
  return g
}

// ── Taser ─────────────────────────────────────────────────
export function buildTaserModel(): THREE.Group {
  const yellow = new THREE.MeshLambertMaterial({ color: 0xeedd00 })
  const black  = new THREE.MeshLambertMaterial({ color: 0x111114 })

  const g = new THREE.Group()
  g.add(bx(0.08, 0.10, 0.18, yellow, 0, 0, 0))            // body
  g.add(bx(0.06, 0.12, 0.06, black, 0, -0.10, 0.04))      // grip
  // Prong tips
  g.add(bx(0.015, 0.015, 0.08, black, -0.025, 0.02, -0.13))
  g.add(bx(0.015, 0.015, 0.08, black,  0.025, 0.02, -0.13))
  // Spark emitter (emissive)
  const spark = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.03, 0.02),
    new THREE.MeshLambertMaterial({ color: 0x4488ff, emissive: 0x2244ff, emissiveIntensity: 1.0 }),
  )
  spark.position.set(0, 0.02, -0.17); g.add(spark)
  return g
}

// ── Crossbow ──────────────────────────────────────────────
export function buildCrossbowModel(): THREE.Group {
  const wood    = new THREE.MeshLambertMaterial({ color: 0x5c3a1e})
  const darkMet = new THREE.MeshLambertMaterial({ color: 0x222228})
  const string  = new THREE.MeshLambertMaterial({ color: 0xddccaa})

  const g = new THREE.Group()
  // Stock (horizontal)
  g.add(bx(0.06, 0.08, 0.36, wood, 0, 0, 0.10))
  // Tiller (the bow arm — horizontal, perpendicular to stock)
  g.add(bx(0.44, 0.04, 0.04, darkMet, 0, 0.04, -0.14))
  // Rail / barrel
  g.add(bx(0.04, 0.04, 0.24, darkMet, 0, 0.04, -0.02))
  // Stirrup at front
  g.add(bx(0.06, 0.12, 0.02, darkMet, 0, 0, -0.26))
  // Grip
  g.add(bx(0.05, 0.14, 0.05, wood, 0, -0.10, 0.08))
  // Trigger guard
  g.add(bx(0.03, 0.06, 0.10, darkMet, 0, -0.04, 0.02))
  // Bowstring (thin, across the bow)
  g.add(bx(0.005, 0.005, 0.44, string, 0, 0.04, -0.14).rotateY(Math.PI / 2))

  return g
}

// ── Dispatcher ──────────────────────────────────────────────
export function buildWeaponModel(type: string): THREE.Group | null {
  switch (type) {
    case 'pistol':      return buildPistolModel()
    case 'smg':         return buildSMGModel()
    case 'shotgun':     return buildShotgunModel()
    case 'rifle':       return buildRifleModel()
    case 'sniper':      return buildSniperModel()
    case 'suppressed':  return buildSuppressedModel()
    case 'lmg':         return buildLMGModel()
    case 'dualPistols': return buildDualPistolsModel()
    case 'taser':       return buildTaserModel()
    case 'crossbow':    return buildCrossbowModel()
    default:            return null
  }
}
