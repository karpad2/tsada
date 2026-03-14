<template>
  <div class="briefing-screen">
    <div class="briefing-box">

      <!-- Header -->
      <div class="header-row">
        <div class="mission-tag">MISSION BRIEFING</div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <!-- Level name + difficulty -->
      <div class="level-name">{{ level.name }}</div>
      <div class="diff-row">
        <span
          v-for="i in 4" :key="i"
          class="diff-star"
          :class="{ lit: i <= level.difficulty }"
        >★</span>
        <span class="diff-label">{{ diffLabel }}</span>
      </div>

      <!-- Description -->
      <p class="level-desc">{{ level.desc }}</p>

      <div class="divider" />

      <!-- Objectives list -->
      <div class="section-title">OBJECTIVES</div>
      <ul class="obj-list">
        <li v-for="(obj, i) in objectives" :key="i" class="obj-item">
          <span class="obj-bullet">◆</span>
          <span>{{ obj }}</span>
        </li>
      </ul>

      <div class="divider" />

      <!-- Intel panel -->
      <div class="intel-grid">
        <div class="intel-item">
          <div class="intel-label">LOCATION</div>
          <div class="intel-value">{{ level.name }}</div>
        </div>
        <div class="intel-item">
          <div class="intel-label">EXTRACT</div>
          <div class="intel-value">{{ extractLabel }}</div>
        </div>
        <div class="intel-item">
          <div class="intel-label">HEAT LEVEL</div>
          <div class="intel-value" :class="heatClass">{{ heatLabel }}</div>
        </div>
        <div class="intel-item">
          <div class="intel-label">VEHICLE</div>
          <div class="intel-value">{{ vehicleLabel }}</div>
        </div>
      </div>

      <!-- CTA -->
      <button class="start-btn" @click="emit('startHeist')">
        ▶ START HEIST
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LEVELS }  from '../game/levels/index.ts'
import { state }   from '../game/state.ts'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'startHeist'): void
}>()

const level = computed(() => LEVELS[state.selectedLevel] ?? LEVELS[0])

const diffLabel = computed(() => {
  const labels = ['', 'EASY', 'MEDIUM', 'HARD', 'OVERKILL']
  return labels[level.value.difficulty] ?? ''
})

const heatLabel = computed(() => {
  const labels = ['', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME']
  return labels[level.value.difficulty] ?? 'UNKNOWN'
})
const heatClass = computed(() => {
  const d = level.value.difficulty
  if (d >= 4) return 'extreme'
  if (d >= 3) return 'high'
  if (d >= 2) return 'medium'
  return 'low'
})

const vehicleLabel = computed(() => {
  const v = level.value.vehicle ?? 'van'
  return v.charAt(0).toUpperCase() + v.slice(1)
})

const extractLabel = computed(() => 'Escape vehicle')

// Build a objectives list from level data
const objectives = computed(() => {
  const lvl = level.value as any
  const list: string[] = []

  if (lvl.drill) list.push('Crack the vault with a thermal drill')
  if (lvl.saw)   list.push('Saw through the security bars')

  const bagCount = Array.isArray(lvl.objectives) ? lvl.objectives.length : 0
  if (bagCount > 0) list.push(`Collect ${bagCount} bag${bagCount > 1 ? 's' : ''} of loot`)

  list.push('Reach the escape vehicle')

  return list
})
</script>

<style scoped>
.briefing-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
  z-index: 90;
}

.briefing-box {
  width: 560px;
  font-family: 'Courier New', monospace;
  color: #ddd;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 32px 40px;
}

/* Header */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.mission-tag {
  font-size: 11px;
  letter-spacing: 0.22em;
  color: #ff6633;
  opacity: 0.9;
}
.close-btn {
  background: none;
  border: 1px solid rgba(255,255,255,0.2);
  color: #888;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 3px;
  font-family: inherit;
}
.close-btn:hover { color: #fff; border-color: #fff; }

/* Level name */
.level-name {
  font-size: 2rem;
  letter-spacing: 0.16em;
  color: #fff;
  margin-bottom: 8px;
}

/* Difficulty */
.diff-row { display: flex; align-items: center; gap: 4px; margin-bottom: 16px; }
.diff-star { font-size: 16px; color: #333; }
.diff-star.lit { color: #ff9900; }
.diff-label { font-size: 11px; letter-spacing: 0.16em; color: #ff9900; margin-left: 8px; opacity: 0.85; }

/* Description */
.level-desc { font-size: 0.9rem; opacity: 0.65; line-height: 1.6; margin-bottom: 0; }

/* Divider */
.divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 18px 0; }

/* Objectives */
.section-title { font-size: 10px; letter-spacing: 0.22em; color: #ffaa44; margin-bottom: 12px; }
.obj-list { list-style: none; padding: 0; margin: 0 0 0 4px; display: flex; flex-direction: column; gap: 8px; }
.obj-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem; }
.obj-bullet { color: #ffaa44; flex-shrink: 0; margin-top: 1px; }

/* Intel grid */
.intel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  margin-bottom: 28px;
}
.intel-item {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px;
  padding: 10px 14px;
}
.intel-label { font-size: 10px; letter-spacing: 0.18em; opacity: 0.45; margin-bottom: 4px; }
.intel-value { font-size: 0.95rem; font-weight: bold; }
.intel-value.low     { color: #66ee88; }
.intel-value.medium  { color: #ffdd44; }
.intel-value.high    { color: #ff8833; }
.intel-value.extreme { color: #ff3333; }

/* Start button */
.start-btn {
  width: 100%;
  padding: 14px;
  font-size: 1.1rem;
  letter-spacing: 0.18em;
  font-family: inherit;
  background: #cc3300;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s;
}
.start-btn:hover { background: #ee4400; }
</style>
