// ─────────────────────────────────────────────────────────────
// WeaponData — single source of truth for all weapon/attachment/tool/skill numbers
// ─────────────────────────────────────────────────────────────

// ── Weapon definitions ────────────────────────────────────────
export const WEAPONS = {
  pistol: {
    id: 'pistol', name: 'PISTOL 9MM', price: 0,
    dmg: 25, fireRate: 0.14, magSize: 15, reserve: 90,
    spread: 0.018, reloadTime: 1.8, isAuto: false,
    concealment: 28,
    slots: ['sight', 'magazine', 'suppressor'],
  },
  smg: {
    id: 'smg', name: 'KRINKOV SMG', price: 50000,
    dmg: 18, fireRate: 0.09, magSize: 30, reserve: 120,
    spread: 0.024, reloadTime: 1.6, isAuto: true,
    concealment: 18,
    slots: ['sight', 'magazine', 'suppressor', 'grip'],
  },
  shotgun: {
    id: 'shotgun', name: 'PUMP SHOTGUN', price: 75000,
    dmg: 12, pellets: 8, fireRate: 0.75, magSize: 8, reserve: 32,
    spread: 0.08, reloadTime: 2.4, isAuto: false,
    concealment: 8,
    slots: ['sight', 'suppressor'],
  },
  rifle: {
    id: 'rifle', name: 'ASSAULT RIFLE', price: 100000,
    dmg: 35, fireRate: 0.12, magSize: 30, reserve: 120,
    spread: 0.015, reloadTime: 2.0, isAuto: true,
    concealment: 5,
    slots: ['sight', 'magazine', 'suppressor', 'grip'],
  },
  sniper: {
    id: 'sniper', name: 'SNIPER RIFLE', price: 120000,
    dmg: 95, fireRate: 1.5, magSize: 5, reserve: 20,
    spread: 0.004, reloadTime: 3.0, isAuto: false,
    concealment: 10,
    slots: ['sight', 'magazine'],
  },
  lmg: {
    id: 'lmg', name: 'LIGHT MACHINE GUN', price: 90000,
    dmg: 14, fireRate: 0.08, magSize: 100, reserve: 200,
    spread: 0.035, reloadTime: 4.5, isAuto: true,
    concealment: 2,
    slots: ['sight', 'grip'],
    slowADS: true,
  },
  dualPistols: {
    id: 'dualPistols', name: 'DUAL PISTOLS', price: 65000,
    dmg: 20, fireRate: 0.07, magSize: 30, reserve: 120,
    spread: 0.030, reloadTime: 2.2, isAuto: true,
    concealment: 22,
    slots: ['suppressor'],
    noADS: true,
  },
  taser: {
    id: 'taser', name: 'TASER', price: 40000,
    dmg: 15, fireRate: 2.0, magSize: 1, reserve: 8,
    spread: 0.005, reloadTime: 0.8, isAuto: false,
    concealment: 30,
    slots: [],
    maxRange: 8,
    stunDuration: 4,
    isSilent: true,
  },
  crossbow: {
    id: 'crossbow', name: 'CROSSBOW', price: 80000,
    dmg: 120, fireRate: 0.0, magSize: 1, reserve: 12,
    spread: 0.001, reloadTime: 3.0, isAuto: false,
    concealment: 22,
    slots: ['sight'],
    isSilent: true,
  },
}

// ── Attachment definitions ─────────────────────────────────────
export const ATTACHMENTS = {
  // Sights
  redDot: {
    id: 'redDot', name: 'Red Dot Sight', slot: 'sight', price: 8000,
    delta: { spread: -0.003 },
    adsFov: 55,    // quick target acquisition, minimal zoom
  },
  holographic: {
    id: 'holographic', name: 'Holographic', slot: 'sight', price: 14000,
    delta: { spread: -0.005, concealment: -1 },
    adsFov: 45,    // moderate zoom
  },
  scope: {
    id: 'scope', name: 'Marksman Scope', slot: 'sight', price: 20000,
    delta: { spread: -0.010, concealment: -3 },
    adsFov: 20,    // high magnification
  },
  // Magazines
  extended: {
    id: 'extended', name: 'Extended Magazine', slot: 'magazine', price: 12000,
    delta: { magSize: 10, reserve: 10, concealment: -2 },
  },
  drum: {
    id: 'drum', name: 'Drum Magazine', slot: 'magazine', price: 22000,
    delta: { magSize: 20, concealment: -4 },
  },
  speedLoader: {
    id: 'speedLoader', name: 'Speed Loader', slot: 'magazine', price: 10000,
    delta: { reloadTime: -0.3, concealment: 1 },
  },
  // Suppressors
  suppressor: {
    id: 'suppressor', name: 'Suppressor', slot: 'suppressor', price: 18000,
    delta: { concealment: 5 },
    dmgMult: 0.85,
    suppressedShots: 1,   // shots before alarm in stealth
  },
  // Grips
  verticalGrip: {
    id: 'verticalGrip', name: 'Vertical Grip', slot: 'grip', price: 7000,
    delta: { spread: -0.003 },
  },
  angledGrip: {
    id: 'angledGrip', name: 'Angled Grip', slot: 'grip', price: 11000,
    delta: { spread: -0.005, fireRate: -0.02 },
  },
}

// ── Tool definitions ───────────────────────────────────────────
// pickupRefund: fraction of cooldown restored when picking up a deployed tool
export const TOOLS = {
  ammoBag: {
    id: 'ammoBag', name: 'AMMO BAG', price: 20000,
    cooldown: 90, pickupRefund: 0.5,
    effect: 'refillAmmo',
    desc: 'Deploy at feet. Pick up (F) to refill all ammo.',
  },
  doctorBag: {
    id: 'doctorBag', name: 'DOCTOR BAG', price: 35000,
    cooldown: 60, pickupRefund: 0.5,
    heal: 70, uses: 2,
    desc: 'Deploy. Use (F) to heal 70 HP. 2 uses per deploy.',
  },
  ecm: {
    id: 'ecm', name: 'ECM JAMMER', price: 60000,
    cooldown: 90, pickupRefund: 0.5,
    duration: 20,
    desc: 'Deploy. Disables all alarms for 20s. Pick up to recover 45s.',
  },
  gasMine: {
    id: 'gasMine', name: 'GAS MINE', price: 25000,
    cooldown: 45, pickupRefund: 0,
    radius: 3, duration: 8, slowMult: 0.5,
    desc: 'Pressure plate. Enemy walks over → slowed 50% for 8s.',
  },
  explosiveMine: {
    id: 'explosiveMine', name: 'EXP. MINE', price: 40000,
    cooldown: 60, pickupRefund: 0,
    radius: 4, dmg: 120,
    desc: 'Pressure plate. Enemy walks over → explosion.',
  },
  breachCharge: {
    id: 'breachCharge', name: 'BREACH CHARGE', price: 55000,
    cooldown: 60, pickupRefund: 0,
    radius: 2.5, dmg: 600, fuseTime: 3,
    desc: 'Stick to any surface (Q). Detonates after 3s — blows a hole through walls.',
  },
  apTurret: {
    id: 'apTurret', name: 'AP TURRET', price: 80000,
    cooldown: 60, pickupRefund: 0.5,
    range: 8, dps: 15, health: 100,
    desc: 'Auto-shoots enemies in range. 100 HP. Pick up (F) to recover 30s.',
  },
  gooGun: {
    id: 'gooGun', name: 'GOO GUN', price: 55000,
    cooldown: 45, pickupRefund: 0.3,
    wallHP: 80, duration: 30,
    desc: 'Fire (T) to shoot goo — creates temporary wall. Enemies can destroy it.',
  },
  sonar: {
    id: 'sonar', name: 'SONAR RADAR', price: 45000,
    cooldown: 75, pickupRefund: 0.5,
    radius: 25, duration: 8,
    desc: 'Reveals enemy positions within 25m for 8s.',
  },
  zipline: {
    id: 'zipline', name: 'ZIPLINE', price: 30000,
    cooldown: 30, pickupRefund: 0,
    length: 20,
    desc: 'Press T twice to set anchors. F near anchor to ride.',
  },
}

// ── Skill tree definitions ────────────────────────────────────
// Tiers must be bought in order. Cost is cumulative skill points.
export const SKILL_TREES = {
  ghost: {
    id: 'ghost', name: 'GHOST', color: '#44ff88',
    tiers: [
      { cost: 1, name: 'Shadow Walk',  effect: 'Detection range -15%' },
      { cost: 2, name: 'Concealed',    effect: 'Concealment +5' },
      { cost: 3, name: 'Low Profile',  effect: 'Private zones don\'t trigger alarm without mask' },
      { cost: 4, name: 'Six-Sense',    effect: '3s grace period before detection in secure zones' },
    ],
  },
  muscle: {
    id: 'muscle', name: 'MUSCLE', color: '#ff6644',
    tiers: [
      { cost: 1, name: 'Thick Skin',   effect: '+30 max health' },
      { cost: 2, name: 'Rush',         effect: 'Sprint speed +15%' },
      { cost: 3, name: 'Melee',        effect: 'E key — instant kill near enemy (no noise)' },
      { cost: 4, name: 'Bulletproof',  effect: 'Damage taken -30%' },
    ],
  },
  tech: {
    id: 'tech', name: 'TECH', color: '#44aaff',
    tiers: [
      { cost: 1, name: 'Fast Hands',   effect: 'C4 plant time -2s' },
      { cost: 2, name: 'Code Assist',  effect: 'Auto-reveals first Simon Says color' },
      { cost: 3, name: 'Tool Expert',  effect: 'Tool cooldown -30%' },
      { cost: 4, name: 'Dual Deploy',  effect: 'Deploy up to 2 tool instances' },
    ],
  },
  sharpshooter: {
    id: 'sharpshooter', name: 'SHARPSHOOTER', color: '#ffcc44',
    tiers: [
      { cost: 1, name: 'Bullseye',  effect: 'Headshot → recovers 10% shield (1s cooldown)' },
      { cost: 2, name: 'Deep Pockets', effect: 'Magazine +5 rounds' },
      { cost: 3, name: 'Quick Reload', effect: 'Reload time -0.4s' },
      { cost: 4, name: 'Quiet Pro',    effect: '+2 suppressed shots before alarm triggers' },
     ],
  },
}

// ── computeWeaponStats ────────────────────────────────────────
// Returns a flat stats object ready for Engine.js to consume.
// weaponId: string key of WEAPONS
// attachments: { sight, magazine, suppressor, grip } — each value is attachment id or null
// spentSkills: { ghost, muscle, tech, sharpshooter } — each value is tier count (0-4)
export function computeWeaponStats(weaponId, attachments = {}, spentSkills = {}) {
  const base = WEAPONS[weaponId]
  if (!base) throw new Error(`Unknown weapon: ${weaponId}`)

  const s = {
    id:           base.id,
    dmg:          base.dmg,
    fireRate:     base.fireRate,
    magSize:      base.magSize,
    reserve:      base.reserve,
    spread:       base.spread,
    reloadTime:   base.reloadTime,
    isAuto:       base.isAuto,
    concealment:  base.concealment,
    pellets:      base.pellets ?? 1,
    suppressedShots: 0,      // shots in stealth before alarm (only with suppressor)
    dmgMult:      1.0,
    adsFov:       40,        // default ADS FOV (no sight = iron sights)
    sightId:      null as string | null,  // equipped sight attachment id
    noADS:        base.noADS ?? false,
    slowADS:      base.slowADS ?? false,
    maxRange:     base.maxRange ?? Infinity,
    stunDuration: base.stunDuration ?? 0,
    isSilent:     base.isSilent ?? false,
  }

  // Apply attachment deltas
  for (const attachId of Object.values(attachments)) {
    if (!attachId) continue
    const att = ATTACHMENTS[attachId]
    if (!att) continue
    for (const [key, val] of Object.entries(att.delta ?? {})) {
      if (key in s) s[key] = +(s[key] + val).toFixed(4)
    }
    if (att.dmgMult)          s.dmgMult      *= att.dmgMult
    if (att.suppressedShots)  s.suppressedShots += att.suppressedShots
    if (att.adsFov)           { s.adsFov = att.adsFov; s.sightId = att.id }
  }

  // Apply damage multiplier (suppressor, etc.)
  s.dmg = Math.round(s.dmg * s.dmgMult)

  // Apply Sharpshooter skill bonuses
  const ss = spentSkills.sharpshooter ?? 0
  if (ss >= 1) s.dmg          = Math.round(s.dmg * 1.15)
  if (ss >= 2) s.magSize      += 5
  if (ss >= 3) s.reloadTime   = Math.max(0.5, s.reloadTime - 0.4)
  if (ss >= 4) s.suppressedShots += 2

  // Apply Ghost T2 concealment bonus
  if ((spentSkills.ghost ?? 0) >= 2) s.concealment += 5

  // Clamp
  s.magSize     = Math.max(1, s.magSize)
  s.reserve     = Math.max(0, s.reserve)
  s.spread      = Math.max(0.001, s.spread)
  s.reloadTime  = Math.max(0.5, s.reloadTime)
  s.concealment = Math.max(0, Math.min(30, s.concealment))

  return s
}
