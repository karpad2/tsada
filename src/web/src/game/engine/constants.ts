// ── Player physics ────────────────────────────────────────────
export const PLAYER_RADIUS = 0.38
export const STAND_HEIGHT  = 1.72
export const CROUCH_HEIGHT = 1.05
export const WALK_SPEED    = 4.5
export const SPRINT_SPEED  = 8.0
export const CROUCH_SPEED  = 2.0
export const JUMP_VEL      = 5.8
export const GRAVITY       = 18.0

// ── Grenade ───────────────────────────────────────────────────
export const GRENADE_FUSE   = 2.8
export const GRENADE_SPEED  = 13
export const GRENADE_RADIUS = 6
export const GRENADE_DMG    = 110
export const MAX_GRENADES   = 3

// ── Flashbang ─────────────────────────────────────────────────
export const FLASHBANG_FUSE    = 1.5   // shorter fuse
export const FLASHBANG_SPEED   = 14
export const FLASHBANG_RADIUS  = 9    // stun radius (m)
export const FLASHBANG_STUN    = 3.5  // enemy stun duration (s)
export const FLASHBANG_BLIND   = 2.8  // player blind duration (s)
export const MAX_FLASHBANGS    = 2

// ── Smoke grenade ─────────────────────────────────────────────
export const SMOKE_FUSE          = 0.4   // detonates quickly after throw
export const SMOKE_SPEED         = 11
export const SMOKE_RADIUS        = 5     // 5 m cloud radius
export const SMOKE_DURATION      = 12    // cloud lasts 12 s
export const MAX_SMOKE_GRENADES  = 2

// ── Bullet damage to props (less than vs enemies) ─────────────
export const PROP_DMG = 18

// ── Halo-style rechargeable shield ───────────────────────────
export const MAX_SHIELD            = 150
export const SHIELD_RECHARGE_DELAY = 3   // seconds without damage before recharge starts
export const SHIELD_RECHARGE_RATE  = 34    // shield/second while recharging

// ── L4D down state ────────────────────────────────────────────
export const DOWN_TIMES = [30, 20, 10]   // custody countdown per down (1st/2nd/3rd)
