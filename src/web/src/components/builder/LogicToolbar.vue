<template>
  <aside class="toolbar">
    <div v-for="cat in NODE_CATEGORIES" :key="cat.label">
      <div class="tool-section-label">{{ cat.label }}</div>
      <button
        v-for="t in cat.types" :key="t"
        class="tool-btn node-btn"
        :title="NODE_TYPES[t].label"
        :style="{ borderLeftColor: NODE_TYPES[t].color }"
        @click="$emit('addNode', t)"
      >
        <span class="node-icon">{{ NODE_TYPES[t].icon }}</span>
        <span class="node-lbl">{{ NODE_TYPES[t].label }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { NODE_TYPES, NODE_CATEGORIES } from '../../game/levels/nodeRegistry.ts'

defineEmits(['addNode'])
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
  gap: 3px;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.tool-section-label {
  font-size: 8px;
  letter-spacing: 0.1em;
  color: #555;
  width: 100%;
  text-align: center;
  padding: 4px 0 1px;
}

.tool-btn {
  width: 52px;
  height: 30px;
  background: rgba(255,255,255,0.05);
  border: 1px solid #333;
  border-radius: 4px;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 4px;
  transition: background 0.1s, border-color 0.1s;
  flex-shrink: 0;
}
.tool-btn:hover { background: rgba(255,255,255,0.1); border-color: #555; color: #eee; }

.node-btn { border-left-width: 3px; }
.node-icon { font-size: 13px; flex-shrink: 0; }
.node-lbl { font-size: 7px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: 0.03em; }
</style>
