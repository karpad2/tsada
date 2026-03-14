// ─────────────────────────────────────────────────────────────
// PlayerProgress — localStorage CRUD for all persistent progression
// ─────────────────────────────────────────────────────────────
import { WEAPONS, ATTACHMENTS, TOOLS } from './weapons/WeaponData.ts'

const KEY = 'heist_player_progress'

/** Set true to unlock everything for testing — flip to false for production. */
const DEV_MODE = true

const DEFAULTS = {
  money:    0,
  xp:       0,
  ownedWeapons:     ['pistol'],
  ownedAttachments: [],
  ownedTools:       [],
  equippedWeapon:   'pistol',
  equippedAttachments: { sight: null, magazine: null, suppressor: null, grip: null },
  equippedTools:    [null, null],   // two tool slots
  spentSkills:      { ghost: 0, muscle: 0, tech: 0, sharpshooter: 0 },
}

/** Load progress from localStorage, merging missing keys with defaults. */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return _clone(DEFAULTS)
    const saved = JSON.parse(raw)
    // Deep merge so new fields in DEFAULTS appear for existing users
    // Migrate old single equippedTool → equippedTools array
    const equippedTools = saved.equippedTools ?? (saved.equippedTool ? [saved.equippedTool, null] : [null, null])
    const prog = {
      ...DEFAULTS,
      ...saved,
      equippedTools,
      equippedAttachments: { ...DEFAULTS.equippedAttachments, ...(saved.equippedAttachments ?? {}) },
      spentSkills:         { ...DEFAULTS.spentSkills,         ...(saved.spentSkills ?? {}) },
    }
    if (DEV_MODE) _applyDevMode(prog)
    return prog
  } catch {
    const prog = _clone(DEFAULTS)
    if (DEV_MODE) _applyDevMode(prog)
    return prog
  }
}

function _applyDevMode(prog) {
  prog.ownedWeapons     = Object.keys(WEAPONS)
  prog.ownedAttachments = Object.keys(ATTACHMENTS)
  prog.ownedTools       = Object.keys(TOOLS)
  prog.money            = Math.max(prog.money, 9_999_999)
  prog.xp               = Math.max(prog.xp,    99_999)
}

/** Persist progress object to localStorage. */
export function saveProgress(prog) {
  localStorage.setItem(KEY, JSON.stringify(prog))
}

/**
 * Total skill points available (unspent).
 * Gained at rate: 1 point per 250 XP.
 */
export function getSkillPoints(prog) {
  const total = Math.floor(prog.xp / 250)
  const spent  = Object.values(prog.spentSkills).reduce((a, b) => a + b, 0)
  return Math.max(0, total - spent)
}

/**
 * Buy an item from the shop.
 * type: 'weapon' | 'attachment' | 'tool'
 * Returns updated prog object (call saveProgress() after if needed).
 */
export function buyItem(type, id, prog) {
  const listKey = { weapon: 'ownedWeapons', attachment: 'ownedAttachments', tool: 'ownedTools' }[type]
  if (!listKey) return prog
  if (prog[listKey].includes(id)) return prog   // already owned

  return prog   // price check is done in ShopPanel.vue, here we just mutate
}

/**
 * Deduct money and add item to owned list.
 * Synchronous version for use in ShopPanel.
 */
export function purchaseItem(type, id, price, prog) {
  if (prog.money < price) return { success: false, prog }
  const listKey = { weapon: 'ownedWeapons', attachment: 'ownedAttachments', tool: 'ownedTools' }[type]
  if (!listKey) return { success: false, prog }
  if (prog[listKey].includes(id)) return { success: false, prog }
  const updated = {
    ...prog,
    money: prog.money - price,
    [listKey]: [...prog[listKey], id],
  }
  saveProgress(updated)
  return { success: true, prog: updated }
}

/**
 * Spend skill points.
 * tree: 'ghost' | 'muscle' | 'tech' | 'sharpshooter'
 * targetTier: 1-4 (total tiers to have in this tree)
 * Returns { success, prog }
 */
export function spendSkillPoint(tree, targetTier, prog) {
  const current = prog.spentSkills[tree] ?? 0
  if (targetTier !== current + 1) return { success: false, prog }   // must buy sequentially
  const available = getSkillPoints(prog)
  // Tier costs: 1, 2, 3, 4
  const tierCost = targetTier
  if (available < tierCost) return { success: false, prog }
  const updated = {
    ...prog,
    spentSkills: { ...prog.spentSkills, [tree]: targetTier },
  }
  saveProgress(updated)
  return { success: true, prog: updated }
}

/** Refund a skill tier (for reset functionality). */
export function refundSkillTree(tree, prog) {
  const updated = {
    ...prog,
    spentSkills: { ...prog.spentSkills, [tree]: 0 },
  }
  saveProgress(updated)
  return updated
}

/** Award XP and money from a completed heist session. */
export function awardHeistRewards(xpGained, moneyGained) {
  const prog = loadProgress()
  prog.xp    += xpGained
  prog.money += moneyGained
  saveProgress(prog)
  return prog
}

function _clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
