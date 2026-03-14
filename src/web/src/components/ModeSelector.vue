<template>
  <div class="mode-selector">

    <!-- ── Mode cards ──────────────────────────────────────────── -->
    <div class="mode-cards">
      <div
        v-for="m in MODES"
        :key="m.id"
        class="mode-card"
        :class="{ selected: modelValue === m.id }"
        @click="emit('update:modelValue', m.id)"
      >
        <div class="mc-icon">{{ m.icon }}</div>
        <div class="mc-name">{{ m.name }}</div>
        <div class="mc-desc">{{ m.desc }}</div>
      </div>
    </div>

    <!-- ── Mutator list (shown when MUTATORS selected) ────────── -->
    <Transition name="fade">
      <div v-if="modelValue === 'mutators'" class="mutator-panel">
        <div class="mut-title">SELECT MUTATORS</div>
        <div class="mut-list">
          <label
            v-for="(mut, id) in MUTATORS"
            :key="id"
            class="mut-row"
            :class="{ checked: mutators.includes(id) }"
          >
            <input
              type="checkbox"
              :checked="mutators.includes(id)"
              @change="toggleMutator(id)"
            />
            <span class="mut-icon">{{ mut.icon }}</span>
            <div class="mut-info">
              <span class="mut-name">{{ mut.name }}</span>
              <span class="mut-desc">{{ mut.desc }}</span>
            </div>
          </label>
        </div>
        <div v-if="mutators.length === 0" class="mut-none">
          No mutators selected — pick at least one for this mode to have an effect.
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { MUTATORS } from '../game/Mutators.ts'

const MODES = [
  {
    id:   'heist',
    icon: '💰',
    name: 'CLASSIC HEIST',
    desc: 'Complete objectives and escape with the loot.',
  },
  {
    id:   'holdout',
    icon: '🛡',
    name: 'HOLDOUT',
    desc: 'Secure the hostage from the vault. Survive HRT assault waves.',
  },
  {
    id:   'mutators',
    icon: '☢',
    name: 'MUTATORS',
    desc: 'Classic heist with gameplay-altering modifiers active.',
  },
]

const props = defineProps<{
  modelValue: string
  mutators:   string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'update:mutators',   val: string[]): void
}>()

function toggleMutator(id: string) {
  const current = [...props.mutators]
  const idx = current.indexOf(id)
  if (idx === -1) current.push(id)
  else current.splice(idx, 1)
  emit('update:mutators', current)
}
</script>

<style scoped>
.mode-selector { display: flex; flex-direction: column; gap: 20px; padding: 8px 0; }

/* ── Mode cards ── */
.mode-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.mode-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 8px;
  padding: 18px 14px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-align: center;
  font-family: 'Courier New', monospace;
}
.mode-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.22); }
.mode-card.selected {
  background: rgba(255,170,0,0.12);
  border-color: rgba(255,170,0,0.55);
  box-shadow: 0 0 16px rgba(255,170,0,0.12);
}
.mc-icon { font-size: 28px; margin-bottom: 10px; }
.mc-name { font-size: 13px; font-weight: bold; letter-spacing: 0.12em; color: #fff; margin-bottom: 6px; }
.mc-desc { font-size: 11px; opacity: 0.5; line-height: 1.5; }
.mode-card.selected .mc-name { color: #ffcc44; }

/* ── Mutator panel ── */
.mutator-panel {
  background: rgba(255,60,0,0.06);
  border: 1px solid rgba(255,80,0,0.2);
  border-radius: 6px;
  padding: 16px 18px;
}
.mut-title {
  font-size: 10px; letter-spacing: 0.22em; color: #ff9944;
  margin-bottom: 12px; font-family: 'Courier New', monospace;
}
.mut-list { display: flex; flex-direction: column; gap: 8px; }
.mut-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px; border-radius: 5px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer; transition: background 0.12s, border-color 0.12s;
  font-family: 'Courier New', monospace;
}
.mut-row:hover { background: rgba(255,255,255,0.07); }
.mut-row.checked {
  background: rgba(255,100,0,0.12); border-color: rgba(255,100,0,0.35);
}
.mut-row input[type=checkbox] { accent-color: #ff6633; width: 15px; height: 15px; flex-shrink: 0; }
.mut-icon { font-size: 20px; flex-shrink: 0; }
.mut-info { display: flex; flex-direction: column; gap: 2px; }
.mut-name { font-size: 12px; font-weight: bold; letter-spacing: 0.10em; color: #fff; }
.mut-desc { font-size: 11px; color: #aaa; }
.mut-none {
  margin-top: 10px; font-size: 11px; color: rgba(255,150,0,0.65);
  font-family: 'Courier New', monospace; font-style: italic;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
