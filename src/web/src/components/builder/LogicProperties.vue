<template>
  <aside class="props-panel">
    <template v-if="node">
      <div class="props-header" :style="{ borderBottomColor: typeDef?.color ?? '#555' }">
        <span>{{ typeDef?.icon }}</span>
        <span>{{ typeDef?.label ?? node.type }}</span>
      </div>

      <div class="props-fields">
        <div v-for="field in typeDef?.fields ?? []" :key="field.key" class="field-row">
          <label class="field-label">{{ field.label }}</label>

          <input v-if="field.type === 'string'"
            type="text" class="field-input"
            :value="node.fields[field.key]"
            @input="emit('updateField', node.id, field.key, ($event.target as HTMLInputElement).value)"
          />

          <input v-else-if="field.type === 'number'"
            type="number" class="field-input"
            :value="node.fields[field.key]"
            :min="field.min" :max="field.max" :step="field.step ?? 1"
            @input="emit('updateField', node.id, field.key, parseFloat(($event.target as HTMLInputElement).value) || 0)"
          />

          <select v-else-if="field.type === 'select'"
            class="field-input"
            :value="node.fields[field.key]"
            @change="emit('updateField', node.id, field.key, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>

          <label v-else-if="field.type === 'boolean'" class="field-check">
            <input type="checkbox"
              :checked="node.fields[field.key]"
              @change="emit('updateField', node.id, field.key, ($event.target as HTMLInputElement).checked)"
            />
            {{ node.fields[field.key] ? 'Yes' : 'No' }}
          </label>

          <input v-else-if="field.type === 'color'"
            type="color" class="field-color"
            :value="node.fields[field.key]"
            @input="emit('updateField', node.id, field.key, ($event.target as HTMLInputElement).value)"
          />

          <textarea v-else-if="field.type === 'code'"
            class="field-code"
            rows="6"
            :value="node.fields[field.key]"
            @input="emit('updateField', node.id, field.key, ($event.target as HTMLTextAreaElement).value)"
            spellcheck="false"
          />
        </div>
      </div>

      <button class="delete-btn" @click="emit('deleteNode', node.id)">DELETE NODE</button>
    </template>

    <template v-else>
      <div class="props-empty">
        <div class="empty-title">LOGIC EDITOR</div>
        <div class="empty-stat">{{ graph.nodes.length }} nodes</div>
        <div class="empty-stat">{{ graph.edges.length }} edges</div>
        <div class="empty-hint">Click a node to edit its properties</div>
        <div class="empty-legend">
          <div><span class="dot" style="background:#44cc88" /> Trigger</div>
          <div><span class="dot" style="background:#ffaa44" /> Action</div>
          <div><span class="dot" style="background:#44aaff" /> Flow</div>
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NODE_TYPES } from '../../game/levels/nodeRegistry.ts'
import type { GraphData, GraphNode } from '../../composables/useNodeGraph.ts'

const props = defineProps<{
  graph: GraphData
  selectedNodeId: string | null
}>()

const emit = defineEmits<{
  updateField: [nodeId: string, key: string, value: any]
  deleteNode:  [nodeId: string]
}>()

const node = computed<GraphNode | null>(() =>
  props.selectedNodeId ? props.graph.nodes.find(n => n.id === props.selectedNodeId) ?? null : null)

const typeDef = computed(() => node.value ? NODE_TYPES[node.value.type] : null)
</script>

<style scoped>
.props-panel {
  width: 190px;
  background: rgba(10,10,14,0.96);
  border-left: 1px solid #333;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.props-header {
  padding: 8px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #ddd;
  letter-spacing: 0.08em;
  border-bottom: 2px solid;
  display: flex;
  gap: 6px;
  align-items: center;
}

.props-fields {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 9px;
  color: #777;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.field-input, .field-code {
  background: rgba(255,255,255,0.06);
  border: 1px solid #333;
  border-radius: 3px;
  color: #ddd;
  padding: 4px 6px;
  font: 11px 'Courier New', monospace;
  outline: none;
}
.field-input:focus, .field-code:focus { border-color: #666; }

.field-code {
  resize: vertical;
  min-height: 60px;
  font-size: 10px;
  line-height: 1.4;
  tab-size: 2;
}

.field-color {
  width: 100%;
  height: 24px;
  padding: 0;
  border: 1px solid #333;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
}

.field-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #aaa;
  cursor: pointer;
}
.field-check input { accent-color: #ffaa00; }

.delete-btn {
  margin: 12px 10px;
  padding: 6px;
  background: rgba(200,30,30,0.15);
  border: 1px solid #662222;
  border-radius: 4px;
  color: #ff6666;
  font: 10px 'Courier New', monospace;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.15s;
}
.delete-btn:hover { background: rgba(200,30,30,0.3); border-color: #ff4444; }

.props-empty {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty-title { font-size: 11px; font-weight: bold; color: #888; letter-spacing: 0.12em; }
.empty-stat  { font-size: 10px; color: #666; }
.empty-hint  { font-size: 9px; color: #555; margin-top: 8px; }
.empty-legend { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; font-size: 9px; color: #666; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
</style>
