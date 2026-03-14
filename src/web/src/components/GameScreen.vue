<template>
  <Transition name="end-fade">
    <div v-if="visible" class="end-screen">
      <div class="end-box">
        <h1 :class="state.phase === 'ESCAPED' ? 'success' : 'fail'">
          {{ endTitle }}
        </h1>

        <!-- ── Rating stars ─────────────────────────────── -->
        <div class="rating-row">
          <span
            v-for="i in 5" :key="i"
            class="star"
            :class="{ lit: i <= starCount }"
          >★</span>
        </div>

        <!-- ── Main stats grid ─────────────────────────── -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value gold">${{ state.money.toLocaleString() }}</div>
            <div class="stat-label">MONEY COLLECTED</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ state.killCount }}</div>
            <div class="stat-label">ENEMIES ELIMINATED</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" :class="stealthClass">{{ state.stealthRating ?? 100 }}%</div>
            <div class="stat-label">STEALTH RATING</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formattedTime }}</div>
            <div class="stat-label">TIME</div>
          </div>

          <template v-if="state.gameMode === 'holdout'">
            <div class="stat-item">
              <div class="stat-value">{{ state.holdoutWave }}</div>
              <div class="stat-label">WAVES SURVIVED</div>
            </div>
          </template>
          <template v-else>
            <div class="stat-item">
              <div class="stat-value">{{ state.objectives }} / {{ state.objectivesTotal }}</div>
              <div class="stat-label">OBJECTIVES</div>
            </div>
          </template>

          <div class="stat-item">
            <div class="stat-value cyan">{{ xpEarned.toLocaleString() }} XP</div>
            <div class="stat-label">EXPERIENCE</div>
          </div>
        </div>

        <!-- ── XP breakdown ─────────────────────────────── -->
        <div class="xp-breakdown">
          <div class="xp-row" v-for="row in xpBreakdown" :key="row.label">
            <span class="xp-lbl">{{ row.label }}</span>
            <span class="xp-val">+{{ row.xp }} XP</span>
          </div>
        </div>

        <!-- ── Achievements unlocked ─────────────────────── -->
        <div v-if="unlockedAchievements.length" class="ach-section">
          <div class="ach-header">ACHIEVEMENTS ({{ unlockedAchievements.length }}/{{ totalAchievements }})</div>
          <div class="ach-list">
            <div v-for="a in recentAchievements" :key="a.id" class="ach-item" :class="{ locked: !a.unlocked }">
              <span class="ach-i">{{ a.icon }}</span>
              <span class="ach-n">{{ a.name }}</span>
            </div>
          </div>
        </div>

        <button class="btn" @click="restart">PLAY AGAIN</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { state }    from '../game/state.ts'
import { getAllAchievements } from '../game/Achievements.ts'

const visible = computed(() => ['ESCAPED', 'FAILED'].includes(state.phase))

const endTitle = computed(() => {
  if (state.gameMode === 'holdout') {
    if (state.phase === 'ESCAPED') return 'HOSTAGE TRADED'
    if (state.holdoutHostageFreed) return 'HOSTAGE RESCUED'
    return 'WASTED'
  }
  return state.phase === 'ESCAPED' ? 'HEIST COMPLETE' : 'WASTED'
})

const formattedTime = computed(() => {
  const t = Math.floor(state.sessionTime ?? 0)
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const stealthClass = computed(() => {
  const r = state.stealthRating ?? 100
  if (r >= 80) return 'good'
  if (r >= 50) return 'ok'
  return 'bad'
})

const xpBreakdown = computed(() => {
  const rows = []
  const success = state.phase === 'ESCAPED'

  if (success) rows.push({ label: 'Heist completed', xp: 500 })
  if ((state.money ?? 0) > 0) rows.push({ label: 'Payout bonus', xp: Math.floor((state.money ?? 0) / 1000) * 10 })

  const rating = state.stealthRating ?? 100
  if (rating >= 80)      rows.push({ label: 'Ghost bonus (80%+ stealth)', xp: 300 })
  else if (rating >= 50) rows.push({ label: 'Stealth bonus', xp: 100 })

  if ((state.killCount ?? 0) > 0)
    rows.push({ label: `${state.killCount} enemies eliminated`, xp: (state.killCount ?? 0) * 5 })

  if (state.gameMode === 'holdout' && (state.holdoutWave ?? 0) > 0)
    rows.push({ label: `${state.holdoutWave} waves survived`, xp: (state.holdoutWave ?? 0) * 50 })

  return rows
})

const xpEarned = computed(() => xpBreakdown.value.reduce((s, r) => s + r.xp, 0))

const starCount = computed(() => {
  if (state.phase !== 'ESCAPED') return 1
  const r = state.stealthRating ?? 100
  if (r >= 95) return 5
  if (r >= 80) return 4
  if (r >= 60) return 3
  if (r >= 30) return 2
  return 1
})

const allAch = computed(() => getAllAchievements())
const unlockedAchievements = computed(() => allAch.value.filter(a => a.unlocked))
const totalAchievements = computed(() => allAch.value.length)
const recentAchievements = computed(() => allAch.value.filter(a => a.unlocked).slice(-6))

function restart() { window.location.reload() }
</script>

<style scoped>
.end-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.80);
  backdrop-filter: blur(6px);
  pointer-events: auto;
  z-index: 100;
}
.end-box {
  text-align: center;
  font-family: 'Courier New', monospace;
  color: #fff;
  padding: 40px 60px;
  background: rgba(0,0,0,0.7);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  min-width: 560px;
}
h1 {
  font-size: 3rem;
  letter-spacing: 0.2em;
  margin-bottom: 0.6rem;
  text-shadow: 0 2px 12px #000c;
}
h1.success { color: #44ee66; }
h1.fail    { color: #ee3322; }

/* ── Stars ── */
.rating-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 1.6rem; }
.star { font-size: 28px; color: #333; transition: color 0.3s; }
.star.lit { color: #ffd700; text-shadow: 0 0 10px #ffd70099; }

/* ── Stats grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 24px;
  margin-bottom: 1.4rem;
}
.stat-item {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 12px 8px;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.stat-value.gold  { color: #ffe050; }
.stat-value.cyan  { color: #44ddff; }
.stat-value.good  { color: #44ee66; }
.stat-value.ok    { color: #ffdd44; }
.stat-value.bad   { color: #ee4422; }
.stat-label { font-size: 0.7rem; opacity: 0.5; letter-spacing: 0.12em; }

/* ── XP breakdown ── */
.xp-breakdown {
  background: rgba(68,221,255,0.06);
  border: 1px solid rgba(68,221,255,0.15);
  border-radius: 6px;
  padding: 10px 18px;
  margin-bottom: 1.6rem;
  text-align: left;
}
.xp-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 3px 0; }
.xp-lbl { opacity: 0.7; }
.xp-val { color: #44ddff; font-weight: bold; }

/* ── Achievements ── */
.ach-section {
  margin-bottom: 1.2rem;
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 6px;
  padding: 10px 14px;
}
.ach-header { font-size: 0.75rem; color: #ffd700; letter-spacing: 0.12em; margin-bottom: 8px; }
.ach-list { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.ach-item {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.2);
  padding: 4px 10px; border-radius: 4px; font-size: 0.8rem;
}
.ach-item.locked { opacity: 0.3; }
.ach-i { font-size: 1.1rem; }
.ach-n { color: #fff; }

.btn {
  padding: 12px 44px;
  font-size: 1rem;
  font-family: inherit;
  background: #222;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.12em;
  transition: background 0.15s;
}
.btn:hover { background: #444; }

.end-fade-enter-active { transition: opacity 0.6s 0.3s; }
.end-fade-leave-active { transition: opacity 0.2s; }
.end-fade-enter-from,
.end-fade-leave-to     { opacity: 0; }
</style>
