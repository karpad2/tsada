import * as THREE from 'three'

// ── Shared THREE scratch objects ───────────────────────────────
const _tmp1 = new THREE.Vector3()
const _ray  = new THREE.Ray()

/**
 * Line-of-sight check: returns true if there is no solid wall between `from` and `to`.
 */
export function hasLOS(from, to, wallBoxes) {
  _ray.origin.copy(from)
  _ray.direction.subVectors(to, from).normalize()
  const maxDist = from.distanceTo(to)
  for (const box of wallBoxes) {
    const hit = _ray.intersectBox(box, _tmp1)
    if (!hit) continue
    const d = from.distanceTo(hit)
    // Ignore walls right at the origin (enemy clipping own cover) but block everything else
    if (d > 0.2 && d < maxDist - 0.05) return false
  }
  return true
}

/** Simple box mesh helper used by mesh builders. */
export function bx(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}

/** Pivot group with a mesh offset by -h/2 (limb rotation from top). */
export function limbPivot(w, h, d, mat, px, py, pz) {
  const pivot = new THREE.Group()
  pivot.position.set(px, py, pz)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.y = -h / 2
  mesh.castShadow = true
  pivot.add(mesh)
  return pivot
}

// ── Enemy type definitions ─────────────────────────────────────
// tier:          guard | light | medium | heavy
// melee:         only deal damage when adjacent (baton)
// keepDist:      sniper stays at this range from player
// shotgun:       fires 5 pellets with distance falloff
// mineInterval:  lays mine every N seconds → onLayMine callback
// deploysSentry: stops and deploys auto-turret → onDeploySentry callback
// molotov:       throws fire bottle → onThrowMolotov callback
// spinup:        minigun winds up N seconds before firing

export const ENEMY_TYPES = {
  guard: {
    tier: 'guard', hp: 80,  dmg: 8,  spd: 2.5, interval: 1.20, range: 20,
    shirt: 0x22882a, pants: 0x155518, hat: false, weapon: 'pistol',
  },
  // ── LIGHT: fast, low HP ──────────────────────────────────────────────────
  cop_smg: {
    tier: 'light', hp: 65,  dmg: 5,  spd: 7.0, interval: 0.22, range: 18,
    shirt: 0x1a50cc, pants: 0x0a2266, hat: true,  weapon: 'smg',
  },
  cop_pistol: {
    tier: 'light', hp: 60,  dmg: 9,  spd: 6.5, interval: 0.80, range: 18,
    shirt: 0x1a50cc, pants: 0x0a2266, hat: true,  weapon: 'pistol',
  },
  cop_baton: {
    tier: 'light', hp: 80,  dmg: 22, spd: 8.0, interval: 0.35, range: 2.5,
    shirt: 0x1a50cc, pants: 0x0a2266, hat: true,  weapon: 'baton', melee: true,
  },
  cop_sniper: {
    tier: 'light', hp: 65,  dmg: 50, spd: 5.0, interval: 2.80, range: 45,
    shirt: 0x1a50cc, pants: 0x0a2266, hat: true,  weapon: 'sniper', keepDist: 20,
    elevate: 3.5,   // grapples to elevated positions
  },
  cop_suppressed: {
    tier: 'light', hp: 60,  dmg: 11, spd: 6.5, interval: 0.60, range: 15,
    shirt: 0x1a50cc, pants: 0x0a2266, hat: true,  weapon: 'suppressed',
  },
  // ── MEDIUM: player-tier stats ────────────────────────────────────────────
  med_shotgun: {
    tier: 'medium', hp: 150, dmg: 18, spd: 5.0, interval: 1.10, range: 10,
    shirt: 0x1a2550, pants: 0x0a1533, hat: false, weapon: 'shotgun', shotgun: true,
  },
  med_miner: {
    tier: 'medium', hp: 130, dmg: 8,  spd: 4.5, interval: 1.40, range: 16,
    shirt: 0x1a2550, pants: 0x0a1533, hat: false, weapon: 'pistol', mineInterval: 10,
  },
  med_sentry: {
    tier: 'medium', hp: 160, dmg: 0,  spd: 4.5, interval: 999,  range: 18,
    shirt: 0x1a2550, pants: 0x0a1533, hat: false, weapon: 'smg', deploysSentry: true,
  },
  // ── HEAVY: tank ──────────────────────────────────────────────────────────
  heavy_lmg: {
    tier: 'heavy', hp: 320, dmg: 7,  spd: 3.0, interval: 0.12, range: 24,
    shirt: 0x2a2a2a, pants: 0x111111, hat: false, weapon: 'lmg',
  },
  heavy_minigun: {
    tier: 'heavy', hp: 380, dmg: 4,  spd: 2.0, interval: 0.07, range: 20,
    shirt: 0x2a2a2a, pants: 0x111111, hat: false, weapon: 'minigun', spinup: 2.0,
  },
  heavy_shotgun: {
    tier: 'heavy', hp: 280, dmg: 28, spd: 3.5, interval: 0.90, range: 8,
    shirt: 0x2a2a2a, pants: 0x111111, hat: false, weapon: 'heavyShotgun', shotgun: true,
  },
  heavy_molotov: {
    tier: 'heavy', hp: 250, dmg: 9,  spd: 3.5, interval: 3.50, range: 18,
    shirt: 0x2a2a2a, pants: 0x111111, hat: false, weapon: 'pistol', molotov: true,
  },
  // ── HRT (Hostage Rescue Team): white SWAT ─────────────────────────────────
  hrt_smg: {
    tier: 'medium', hp: 90,  dmg: 6,  spd: 6.5, interval: 0.25, range: 18,
    shirt: 0xdddddd, pants: 0xbbbbbb, hat: false, weapon: 'smg', hrt: true,
  },
  hrt_shotgun: {
    tier: 'medium', hp: 120, dmg: 16, spd: 5.5, interval: 1.00, range: 10,
    shirt: 0xdddddd, pants: 0xbbbbbb, hat: false, weapon: 'shotgun', shotgun: true, hrt: true,
  },
  hrt_shield: {
    tier: 'heavy', hp: 200, dmg: 10, spd: 4.0, interval: 0.80, range: 15,
    shirt: 0xdddddd, pants: 0xbbbbbb, hat: false, weapon: 'pistol', hrt: true,
  },
  // ── MEDIC ────────────────────────────────────────────────────────────────────
  // White coat; heals nearby wounded allies and shoots back in combat
  medic_swat: {
    tier: 'medium', hp: 90,  dmg: 7,  spd: 5.5, interval: 0.85, range: 14,
    shirt: 0xffffff, pants: 0xdddddd, hat: false, weapon: 'pistol',
    isMedic: true, healRange: 3.5, healRate: 30,
  },
  // ── SPECIAL ENEMIES ─────────────────────────────────────────────────────────
  // Heavy juggernaut: extreme HP, slow, powerful — pure stat enemy
  heavy_juggernaut: {
    tier: 'heavy', hp: 600, dmg: 22, spd: 1.8, interval: 0.85, range: 10,
    shirt: 0x8a0000, pants: 0x550000, hat: false, weapon: 'heavyShotgun', shotgun: true,
  },
  // K9 unit: fast melee rusher (dog-like charge)
  k9_unit: {
    tier: 'light', hp: 30,  dmg: 20, spd: 11.0, interval: 0.45, range: 2.5,
    shirt: 0x8b6914, pants: 0x6b4e10, hat: false, weapon: 'baton', melee: true,
  },
  // Flashbang specialist: throws flashbangs that white-out the player HUD
  cop_flashbang: {
    tier: 'light', hp: 60,  dmg: 7,  spd: 6.0, interval: 0.90, range: 14,
    shirt: 0x1a50cc, pants: 0x0a2266, hat: true,  weapon: 'pistol', flashbangInterval: 8,
  },
  // SWAT commander: calls 3 reinforcements every 25s while alive
  swat_commander: {
    tier: 'medium', hp: 200, dmg: 8,  spd: 4.5, interval: 0.38, range: 18,
    shirt: 0xcc3300, pants: 0x881100, hat: false, weapon: 'smg', commandInterval: 25,
  },
  // ── FBI DRONE SPECIALIST ─────────────────────────────────────────────────────
  // Green-uniformed field operative; advances until visible, then deploys a
  // hovering drone turret and retreats.
  fbi_drone_spec: {
    tier: 'medium', hp: 110, dmg: 0,  spd: 5.0, interval: 999,  range: 20,
    shirt: 0x2d6e2d, pants: 0x1a4a1a, hat: false, weapon: 'smg', deploysDroneTurret: true,
  },
  // ── TASER COP ──────────────────────────────────────────────────────────────────
  // Rushes close and fires taser — stuns player briefly, then tries to cuff
  cop_taser: {
    tier: 'light', hp: 55,  dmg: 5,  spd: 7.5, interval: 3.0,  range: 8,
    shirt: 0xcccc22, pants: 0x0a2266, hat: true,  weapon: 'taser_gun',
    isTaser: true, taserStunDuration: 1.5,
  },
  // ── SHIELD ENEMY ──────────────────────────────────────────────────────────────
  // Frontal shield blocks bullets. Must be flanked or hit in the head from the side.
  swat_shield: {
    tier: 'medium', hp: 220, dmg: 9,  spd: 3.5, interval: 0.90, range: 14,
    shirt: 0x1a2550, pants: 0x0a1533, hat: false, weapon: 'pistol',
    hasShield: true, shieldHp: 300,
  },
  // ── DRONES ──────────────────────────────────────────────────────────────────
  drone_scout: {
    tier: 'light', hp: 40,  dmg: 4,  spd: 8.0, interval: 0.30, range: 15,
    shirt: 0x222222, pants: 0x222222, hat: false, weapon: 'smg',
    isDrone: true, flyHeight: 5, keepDist: 8,
  },
  drone_bomber: {
    tier: 'medium', hp: 80, dmg: 0,  spd: 5.0, interval: 5.0,  range: 18,
    shirt: 0x222222, pants: 0x222222, hat: false, weapon: 'none',
    isDrone: true, flyHeight: 6, keepDist: 10, bombInterval: 5,
  },
}
