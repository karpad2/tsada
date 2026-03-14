<template>
  <aside class="toolbar">

    <div class="tool-section-label">ADD SHAPE</div>
    <button class="tool-btn" title="Box" @click="$emit('addShape', 'box')">▬ </button>
    <button class="tool-btn" title="Cylinder" @click="$emit('addShape', 'cyl')">● </button>
    <button class="tool-btn" title="Emissive Box" @click="$emit('addShape', 'boxE')">◈ </button>

    <div class="tool-section-label" style="margin-top:12px">NEW</div>
    <button class="tool-btn new" @click="$emit('newAsset')">+ New</button>

    <div class="tool-section-label" style="margin-top:12px">PRESETS</div>
    <button
      v-for="p in presets"
      :key="p.id"
      class="tool-btn prop"
      :title="p.name"
      @click="$emit('loadPreset', p)"
    >{{ p.icon }}<span class="prop-lbl">{{ p.name }}</span></button>

    <div class="tool-section-label" style="margin-top:12px">MY ASSETS</div>
    <button
      v-for="a in savedAssets"
      :key="a.id"
      class="tool-btn prop"
      :class="{ active: currentId === a.id }"
      :title="a.name"
      @click="$emit('loadAsset', a.id)"
    >{{ a.icon || '?' }}<span class="prop-lbl">{{ a.name }}</span></button>

    <div v-if="!savedAssets.length" class="empty-hint">No saved assets</div>
  </aside>
</template>

<script setup lang="ts">
import { BUILTIN_ASSETS } from '../../game/levels/assets/builtinAssets.ts'

defineProps({
  savedAssets: { type: Array, default: () => [] },
  currentId:   { type: String, default: null },
})
defineEmits(['addShape', 'newAsset', 'loadAsset', 'loadPreset'])

const presets = BUILTIN_ASSETS
</script>

<style scoped>
.toolbar {
  width: 62px;
  background: rgba(10,10,14,0.96);
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}
.tool-section-label {
  font-size: 9px; letter-spacing: 0.1em; color: #555;
  width: 100%; text-align: center; padding: 2px 0;
}
.tool-btn {
  width: 46px; height: 38px;
  background: rgba(255,255,255,0.05); border: 1px solid #333; border-radius: 4px;
  color: #aaa; font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s, border-color 0.1s; flex-shrink: 0;
}
.tool-btn:hover  { background: rgba(255,255,255,0.1); border-color: #555; color: #eee; }
.tool-btn.active { background: rgba(255,170,0,0.2); border-color: #ffaa00; color: #ffdd88; }
.tool-btn.new    { font-size: 14px; height: 30px; }
.tool-btn.prop {
  width: 52px; height: 30px; font-size: 13px; gap: 4px;
  justify-content: flex-start; padding: 0 4px;
}
.prop-lbl { font-size: 9px; color: #888; letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-hint { font-size: 9px; color: #444; margin-top: 4px; }
</style>
