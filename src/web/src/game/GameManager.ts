import { state } from './state.ts'
import { awardHeistRewards } from './PlayerProgress.ts'
import { checkSessionAchievements } from './Achievements.ts'

// ── Tiny event emitter ────────────────────────────────────────
const _listeners = {}
function on(event, fn)  { (_listeners[event] ??= []).push(fn) }
function off(event, fn) { _listeners[event] = (_listeners[event] ?? []).filter(f => f !== fn) }
function emit(event, ...args) { _listeners[event]?.forEach(fn => fn(...args)) }

// ── Phase durations ───────────────────────────────────────────
const CONTROL_DURATION      = 35    // 20s regroup before next anticipation
const ANTICIPATION_DURATION = 28
const ASSAULT_DURATION      = 300   // 5 min

let _controlTimer = 0
let _antTimer     = 0
let _assaultTimer = 0

// ── Network callback — called on every phase / alarm change ──
let _netPhaseCallback: ((phase: string, alarmLevel: number) => void) | null = null
export function setNetPhaseCallback(cb: ((phase: string, alarmLevel: number) => void) | null) {
  _netPhaseCallback = cb
}

function setPhase(phase) {
  const prev = state.phase
  state.phase = phase
  if (phase === 'CONTROL') {
    _controlTimer = state.gameMode === 'holdout' ? 45 : CONTROL_DURATION
    if (state.gameMode === 'holdout') state.holdoutTradeOpen = true
  }
  if (prev === 'ASSAULT' && phase === 'CONTROL') {
    emit('retreatAll')
    if (state.gameMode === 'holdout') state.holdoutWave++
  }
  emit('phaseChanged', phase)
  _netPhaseCallback?.(phase, state.alarmLevel)
}

// ── Mask ──────────────────────────────────────────────────────
let _maskOn = false
function isMaskOn() { return _maskOn }

function putOnMask() {
  if (_maskOn) return
  _maskOn = true
  state.maskOn = true
  // Mask on: enemies now detect you via LOS — no instant alarm
}

// ── Stealth detection rate ────────────────────────────────────
// detectionRate: 0-100, fills from enemy LOS in STEALTH only.
// When it hits 100 → CONTROL (alarm raised). CONTROL is already loud.
let _detectRate      = 0    // current detection fill 0-100
let _susRate         = 0    // suspicion multiplier from dead bodies / events

export function getDetectionRate() { return _detectRate }
export function getSusRate()       { return _susRate }
function addSus(amount)            { _susRate = Math.min(5, _susRate + amount) }

function _addDetection(amount) {
  if (state.phase !== 'STEALTH') return
  _detectRate = Math.min(100, _detectRate + amount)
  if (_detectRate >= 100) {
    setPhase('CONTROL')
    state.alarmLevel = 30   // partial alarm already built
  }
}

/** Called by Enemy when it has LOS on unmasked player. rate = 0-1 per second. STEALTH only. */
function addEnemyDetection(ratePerSec, delta, detectMult = 1.0) {
  if (state.phase !== 'STEALTH') return
  const susMult = 1 + _susRate * 0.3   // each sus point → +30% detection speed
  _addDetection(ratePerSec * delta * detectMult * susMult)
}

/** Called by Enemy when no LOS — detection rate drains back. STEALTH only. */
function decayDetection(ratePerSec, delta) {
  if (state.phase !== 'STEALTH') return
  _detectRate = Math.max(0, _detectRate - ratePerSec * delta)
  state.detectionRate = _detectRate
}

/** Guard killed in stealth — big sus spike + alarm. */
function onGuardKilledStealth() {
  _addDetection(35)
  increaseAlarm(20)
  addSus(1)     // each dead guard raises suspicion permanently
}

/** Civilian killed — money penalty only, no alarm. */
function onCivilianKilled() {
  state.civilianKills++
  state.money = Math.max(0, state.money - 50_000)
  state.sessionMoney = Math.max(0, state.sessionMoney - 50_000)
  emit('civKillPenalty')
}

// ── Alarm / suspicion ─────────────────────────────────────────
function increaseAlarm(amount) {
  state.alarmLevel = Math.min(100, state.alarmLevel + amount)
  if (state.alarmLevel > 0 && state.phase === 'STEALTH') setPhase('CONTROL')
  else if (state.alarmLevel >= 100 && state.phase === 'CONTROL') _beginAnticipation()
  else _netPhaseCallback?.(state.phase, state.alarmLevel)
}

function triggerAlarm() {
  if (!['STEALTH', 'CONTROL'].includes(state.phase)) return
  _detectRate      = 100
  state.alarmLevel = 100
  _beginAnticipation()
}

/** Radio call-in: goes to CONTROL only (not ANTICIPATION). */
function radioAlarm() {
  if (!['STEALTH', 'CONTROL'].includes(state.phase)) return
  _detectRate = 100
  if (state.phase === 'STEALTH') {
    state.alarmLevel = Math.max(state.alarmLevel, 50)
    setPhase('CONTROL')
  }
}

// ── Phase transitions ─────────────────────────────────────────
function _beginAnticipation() {
  if (['ANTICIPATION', 'ASSAULT', 'ESCAPED', 'FAILED'].includes(state.phase)) return
  _antTimer = ANTICIPATION_DURATION
  setPhase('ANTICIPATION')
  emit('spawnWave')           // slow spawning starts during anticipation
}

function _startAssault() {
  if (state.phase === 'ASSAULT') return
  _assaultTimer         = ASSAULT_DURATION
  state.killsThisAssault = 0
  state.killQuota        = Math.floor(200 + state.waveNumber * 30 + state.drama * 15)
  setPhase('ASSAULT')
  emit('spawnWave')
}

function _endAssault() {
  if (state.phase !== 'ASSAULT') return
  setPhase('CONTROL')         // retreatAll emitted automatically by setPhase
}

// ── Enemy death ───────────────────────────────────────────────
function onEnemyKilled() {
  state.enemiesAlive = Math.max(0, state.enemiesAlive - 1)
  if (state.phase === 'ASSAULT') {
    state.killsThisAssault++
    if (state.killsThisAssault >= state.killQuota) _endAssault()
  }
}

// ── Objectives ────────────────────────────────────────────────
function completeObjective() {
  state.objectives++
  state.money += 50_000
  if (state.objectives >= state.objectivesTotal) {
    emit('allDone')
    state.hint = 'Head to the  VAN  to escape!'
  }
}

// ── End states ────────────────────────────────────────────────
function escape() {
  setPhase('ESCAPED')
  // Persist XP + money earned this session
  const xpBonus = 500   // escape bonus
  awardHeistRewards(state.sessionXP + xpBonus, state.sessionMoney)
  // Check achievements
  checkSessionAchievements({
    kills: state.killCount,
    headshots: state.headshotCount,
    stealthComplete: state.stealthRating >= 100,
    heistComplete: true,
    damageTaken: state.damageTaken,
    noDamage: state.damageTaken === 0,
    civilianKills: state.civilianKills,
    accuracy: state.shotsFired > 0 ? state.shotsHit / state.shotsFired : 0,
    timeSec: state.sessionTime,
    wavesSurvived: state.waveNumber,
    bagsSecured: state.objectives,
    enemiesDominated: state.dominateCount,
    glassShattered: state.glassShattered,
    mapId: state.currentMapId ?? '',
    gameMode: state.gameMode,
  })
}
function playerDied() { setPhase('FAILED') }

// ── Helpers ───────────────────────────────────────────────────
function isLoudPhase() {
  return ['CONTROL', 'ANTICIPATION', 'ASSAULT'].includes(state.phase)
}

// ── Per-frame tick ────────────────────────────────────────────
function tick(delta) {
  switch (state.phase) {
    case 'CONTROL':
      _controlTimer -= delta
      state.controlTimeLeft = Math.max(0, _controlTimer)
      if (state.gameMode === 'holdout') {
        state.holdoutReward = Math.floor(50000 * Math.pow(1.5, state.holdoutWave))
      }
      if (_controlTimer <= 0) {
        if (state.gameMode === 'holdout') state.holdoutTradeOpen = false
        _beginAnticipation()
      }
      break

    case 'ANTICIPATION':
      _antTimer -= delta
      state.anticipationTimeLeft = Math.max(0, _antTimer)
      if (_antTimer <= 0) _startAssault()
      break

    case 'ASSAULT':
      state.drama   += delta * 0.3
      _assaultTimer -= delta
      state.assaultTimeLeft = Math.max(0, _assaultTimer)
      if (_assaultTimer <= 0) _endAssault()
      break
  }
}

/** Bagging a body reduces sus by 0.5 (cleanup reward). */
function onBodyBagged() { _susRate = Math.max(0, _susRate - 0.5) }

/** Full reset for new heist. */
function resetAll() {
  // Clear all stale event listeners from previous engine
  for (const key in _listeners) delete _listeners[key]

  _detectRate   = 0
  _susRate      = 0
  _maskOn       = false
  _controlTimer = 0
  _antTimer     = 0
  _assaultTimer = 0
  state.phase            = 'STEALTH'
  state.alarmLevel       = 0
  state.detectionRate    = 0
  state.susRate          = 0
  state.maskOn           = false
  state.waveNumber       = 0
  state.killsThisAssault = 0
  state.killQuota        = 0
  state.controlTimeLeft  = 0
  state.anticipationTimeLeft = 0
  state.assaultTimeLeft  = 0
  state.drama            = 0
  state.enemiesAlive     = 0
  state.objectives       = 0
  state.money            = 0
  state.sessionXP        = 0
  state.sessionMoney     = 0
  state.hint             = ''

  // Holdout
  state.holdoutWave               = 0
  state.holdoutReward             = 0
  state.holdoutTradeOpen          = false
  state.holdoutHostageSecurity    = 100
  state.holdoutHostageMaxSecurity = 100
  state.holdoutTraded             = false
  state.holdoutHostageFreed       = false
}

/** Holdout: trade hostage → cash out → ESCAPED */
function holdoutTrade() {
  if (state.gameMode !== 'holdout' || !state.holdoutTradeOpen) return
  state.holdoutTraded    = true
  state.holdoutTradeOpen = false
  state.money       += state.holdoutReward
  state.sessionMoney += state.holdoutReward
  escape()
}

/** Holdout: start first assault (called by Engine after spawn delay) */
function holdoutStartAssault() {
  state.alarmLevel = 100
  putOnMask()
  _beginAnticipation()
}

/** Reset stealth state for new heist. */
function resetStealth() { _detectRate = 0; _susRate = 0 }

export const GameManager = {
  on, off, emit,
  increaseAlarm, triggerAlarm, radioAlarm,
  addEnemyDetection, decayDetection, onGuardKilledStealth, onCivilianKilled, getDetectionRate,
  addSus, getSusRate, onBodyBagged, resetStealth, resetAll,
  putOnMask, isMaskOn,
  onEnemyKilled, completeObjective,
  escape, playerDied, isLoudPhase, tick,
  holdoutTrade, holdoutStartAssault,
}
