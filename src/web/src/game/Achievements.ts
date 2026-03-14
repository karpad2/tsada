// ─────────────────────────────────────────────────────────────
// Achievements — definitions, tracking, persistence
// ─────────────────────────────────────────────────────────────
import { reactive } from 'vue'
import { sfx } from './SoundManager.ts'

const STORAGE_KEY = 'heist_achievements'

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  /** Check function receives session stats; return true to unlock */
  check?: (stats: SessionStats) => boolean
  /** Some achievements are triggered manually via unlock() */
  manual?: boolean
}

export interface SessionStats {
  kills: number
  headshots: number
  stealthComplete: boolean
  heistComplete: boolean
  damageTaken: number
  noDamage: boolean
  civilianKills: number
  accuracy: number // 0-1
  timeSec: number
  wavesSurvived: number
  bagsSecured: number
  enemiesDominated: number
  glassShattered: number
  mapId: string
  gameMode: string
}

export const ACHIEVEMENTS: Achievement[] = [
  // Kill milestones
  { id: 'first_blood',    name: 'FIRST BLOOD',      icon: '🔫', desc: 'Get your first kill',                     check: s => s.kills >= 1 },
  { id: 'mass_murderer',  name: 'MASS MURDERER',    icon: '💀', desc: 'Kill 50 enemies in one heist',            check: s => s.kills >= 50 },
  { id: 'genocide',       name: 'GENOCIDE',          icon: '☠️', desc: 'Kill 100 enemies in one heist',           check: s => s.kills >= 100 },

  // Headshots
  { id: 'headhunter',     name: 'HEADHUNTER',       icon: '🎯', desc: 'Get 10 headshots in one heist',           check: s => s.headshots >= 10 },
  { id: 'sniper_elite',   name: 'SNIPER ELITE',     icon: '🔭', desc: 'Get 25 headshots in one heist',           check: s => s.headshots >= 25 },

  // Stealth
  { id: 'ghost',          name: 'GHOST',             icon: '👻', desc: 'Complete a heist without triggering alarm', check: s => s.stealthComplete },
  { id: 'pacifist',       name: 'PACIFIST',          icon: '🕊️', desc: 'Complete a heist with zero kills',        check: s => s.heistComplete && s.kills === 0 },
  { id: 'clean_hands',    name: 'CLEAN HANDS',       icon: '🧤', desc: 'No civilian casualties',                  check: s => s.heistComplete && s.civilianKills === 0 },

  // Survival
  { id: 'bulletproof',    name: 'BULLETPROOF',       icon: '🛡️', desc: 'Complete a heist without taking damage',   check: s => s.heistComplete && s.noDamage },
  { id: 'wave_5',         name: 'HOLD THE LINE',     icon: '🏰', desc: 'Survive 5 assault waves',                 check: s => s.wavesSurvived >= 5 },
  { id: 'wave_10',        name: 'FORTRESS',          icon: '🏯', desc: 'Survive 10 assault waves',                check: s => s.wavesSurvived >= 10 },

  // Completion
  { id: 'first_heist',    name: 'FIRST HEIST',       icon: '💰', desc: 'Complete your first heist',               check: s => s.heistComplete },
  { id: 'speed_run',      name: 'SPEED RUN',         icon: '⚡', desc: 'Complete a heist in under 60 seconds',     check: s => s.heistComplete && s.timeSec < 60 },
  { id: 'bag_man',        name: 'BAG MAN',           icon: '💼', desc: 'Secure 3 bags in one heist',              check: s => s.bagsSecured >= 3 },

  // Special
  { id: 'dominator',      name: 'DOMINATOR',         icon: '🗣️', desc: 'Dominate 5 enemies in one heist',         check: s => s.enemiesDominated >= 5 },
  { id: 'glass_cannon',   name: 'GLASS CANNON',      icon: '🪟', desc: 'Shatter 10 glass panels in one heist',    check: s => s.glassShattered >= 10 },
  { id: 'marksman',       name: 'MARKSMAN',          icon: '🏅', desc: 'Achieve 80%+ accuracy in a heist',        check: s => s.heistComplete && s.accuracy >= 0.8 && s.kills >= 10 },

  // Manual (triggered by specific events)
  { id: 'shield_break',   name: 'SHIELD BREAKER',    icon: '🔨', desc: 'Destroy a shield enemy\'s shield',        manual: true },
  { id: 'taser_dodge',    name: 'SHOCK ABSORBER',    icon: '⚡', desc: 'Get tased and survive',                    manual: true },
  { id: 'all_maps',       name: 'WORLD TOUR',        icon: '🌍', desc: 'Complete all 21 maps',                    manual: true },
]

// ── Reactive state for HUD popups ────────────────────────────
export const achievementState = reactive({
  popup: null as { id: string, name: string, icon: string, desc: string } | null,
  popupTimer: 0,
})

// ── Persistence ──────────────────────────────────────────────
function _loadUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function _saveUnlocked(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

const _unlocked = _loadUnlocked()
const _completedMaps = _loadCompletedMaps()

function _loadCompletedMaps(): Set<string> {
  try {
    const raw = localStorage.getItem('heist_completed_maps')
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function _saveCompletedMaps(set: Set<string>) {
  localStorage.setItem('heist_completed_maps', JSON.stringify([...set]))
}

// ── Public API ───────────────────────────────────────────────

export function isUnlocked(id: string): boolean {
  return _unlocked.has(id)
}

export function getUnlockedCount(): number {
  return _unlocked.size
}

export function getTotalCount(): number {
  return ACHIEVEMENTS.length
}

export function getAllAchievements(): (Achievement & { unlocked: boolean })[] {
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: _unlocked.has(a.id) }))
}

/** Manually unlock a specific achievement (for event-triggered ones). */
export function unlock(id: string) {
  if (_unlocked.has(id)) return
  const ach = ACHIEVEMENTS.find(a => a.id === id)
  if (!ach) return
  _unlocked.add(id)
  _saveUnlocked(_unlocked)
  _showPopup(ach)
}

/** Check all stat-based achievements against session stats. */
export function checkSessionAchievements(stats: SessionStats) {
  if (stats.heistComplete && stats.mapId) {
    _completedMaps.add(stats.mapId)
    _saveCompletedMaps(_completedMaps)
    if (_completedMaps.size >= 21) unlock('all_maps')
  }

  for (const ach of ACHIEVEMENTS) {
    if (ach.manual || _unlocked.has(ach.id)) continue
    if (ach.check && ach.check(stats)) {
      _unlocked.add(ach.id)
      _saveUnlocked(_unlocked)
      _showPopup(ach)
    }
  }
}

/** Tick popup timer (call from game loop). */
export function tickPopup(delta: number) {
  if (achievementState.popupTimer > 0) {
    achievementState.popupTimer -= delta
    if (achievementState.popupTimer <= 0) {
      achievementState.popup = null
    }
  }
}

function _showPopup(ach: Achievement) {
  achievementState.popup = { id: ach.id, name: ach.name, icon: ach.icon, desc: ach.desc }
  achievementState.popupTimer = 4.0
  sfx.achievementUnlock()
}
