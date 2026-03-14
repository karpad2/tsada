<template>
  <div class="layers-panel">
    <div class="layers-title">LAYERS</div>
    <div
      v-for="layer in LAYERS"
      :key="layer.id"
      class="layer-row"
      :class="{ hidden: !visible[layer.id] }"
      @click="toggle(layer.id)"
    >
      <span class="layer-eye">{{ visible[layer.id] ? '👁' : '—' }}</span>
      <span class="layer-icon">{{ layer.icon }}</span>
      <span class="layer-name">{{ layer.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const LAYERS = [
  { id: 'floors',  icon: '▭', label: 'Floors' },
  { id: 'walls',   icon: '▬', label: 'Walls' },
  { id: 'zones',   icon: '⬜', label: 'Zones' },
  { id: 'doors',   icon: '🚪', label: 'Doors' },
  { id: 'props',   icon: '📦', label: 'Props' },
  { id: 'lights',  icon: '☀', label: 'Lights' },
  { id: 'cameras', icon: '📷', label: 'Cameras' },
  { id: 'spawns',  icon: '▲', label: 'Spawns' },
  { id: 'bags',    icon: '◇', label: 'Bags' },
  { id: 'pillars', icon: '⊞', label: 'Pillars' },
  { id: 'grid',    icon: '#', label: 'Grid' },
]

const visible = reactive({ ...props.modelValue })

function toggle(id: string) {
  visible[id] = !visible[id]
  emit('update:modelValue', { ...visible })
}

watch(() => props.modelValue, v => {
  Object.assign(visible, v)
}, { deep: true })
</script>

<style scoped>
.layers-panel {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 4px;
  border-top: 1px solid #333;
}
.layers-title {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #555;
  text-align: center;
  padding: 2px 0 4px;
}
.layer-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  color: #bbb;
  transition: background 0.1s;
}
.layer-row:hover { background: rgba(255,255,255,0.06); }
.layer-row.hidden { opacity: 0.35; }
.layer-eye { font-size: 11px; width: 16px; text-align: center; }
.layer-icon { font-size: 12px; }
.layer-name { font-size: 9px; letter-spacing: 0.04em; color: #999; }
</style>
