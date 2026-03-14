<template>
  <aside class="props-panel">
    <div class="panel-title">ASSET</div>

    <!-- ── Asset metadata ─────────────────────────────────── -->
    <div class="prop-group">
      <div class="prop-label">Name</div>
      <input class="prop-input" :value="asset.name" @input="$emit('updateMeta', 'name', $event.target.value)" />
      <div class="prop-label">Icon (emoji)</div>
      <input class="prop-input" :value="asset.icon" maxlength="2"
        @input="$emit('updateMeta', 'icon', $event.target.value)" />
      <NumberField label="Default HP" :value="asset.hp" @update="$emit('updateMeta', 'hp', $event)" />
    </div>

    <div class="separator" />

    <!-- ── Shape count ────────────────────────────────────── -->
    <div class="shape-count">{{ (asset.shapes || []).length }} shape{{ (asset.shapes || []).length !== 1 ? 's' : '' }}</div>

    <!-- ── Selected shape properties ──────────────────────── -->
    <template v-if="shape">
      <div class="element-type">{{ kindLabel }}</div>

      <!-- Position -->
      <NumberField label="X (local)" :value="shape.lx" @update="setShape('lx', $event)" />
      <NumberField label="Y (local)" :value="shape.ly" @update="setShape('ly', $event)" />
      <NumberField label="Z (local)" :value="shape.lz" @update="setShape('lz', $event)" />

      <!-- Rotation (degrees) -->
      <div class="prop-label" style="margin-top:4px">ROTATION (°)</div>
      <div class="rot-row">
        <div class="rot-field">
          <label class="rot-label rx">X</label>
          <input class="prop-input number rot-inp" type="number" step="5"
            :value="toDeg(shape.rotX)" @change="setShape('rotX', toRad($event.target.value))" />
        </div>
        <div class="rot-field">
          <label class="rot-label ry">Y</label>
          <input class="prop-input number rot-inp" type="number" step="5"
            :value="toDeg(shape.rotY)" @change="setShape('rotY', toRad($event.target.value))" />
        </div>
        <div class="rot-field">
          <label class="rot-label rz">Z</label>
          <input class="prop-input number rot-inp" type="number" step="5"
            :value="toDeg(shape.rotZ)" @change="setShape('rotZ', toRad($event.target.value))" />
        </div>
      </div>

      <!-- Box / Emissive Box dimensions -->
      <template v-if="shape.kind === 'box' || shape.kind === 'boxE'">
        <NumberField label="Width (W)"  :value="shape.w" @update="setShape('w', $event)" />
        <NumberField label="Height (H)" :value="shape.h" @update="setShape('h', $event)" />
        <NumberField label="Depth (D)"  :value="shape.d" @update="setShape('d', $event)" />
      </template>

      <!-- Cylinder dimensions -->
      <template v-if="shape.kind === 'cyl'">
        <NumberField label="Top Radius"    :value="shape.rT" @update="setShape('rT', $event)" />
        <NumberField label="Bottom Radius" :value="shape.rB" @update="setShape('rB', $event)" />
        <NumberField label="Height (H)"    :value="shape.h"  @update="setShape('h', $event)" />
        <NumberField label="Segments"      :value="shape.segs" @update="setShape('segs', Math.max(3, Math.round($event)))" />
      </template>

      <!-- Color -->
      <ColorField label="Color" :value="shape.color" @update="setShape('color', $event)" />

      <!-- Surface (box / cyl only) -->
      <template v-if="shape.kind !== 'boxE'">
        <div class="prop-label">Surface</div>
        <select class="prop-input" :value="shape.surface || 'default'" @change="setShape('surface', $event.target.value)">
          <option v-for="s in SURFACES" :key="s" :value="s">{{ s }}</option>
        </select>
      </template>

      <!-- Texture (box / cyl only) -->
      <template v-if="shape.kind !== 'boxE'">
        <div class="prop-label">Texture</div>
        <select class="prop-input" :value="shape.tex || ''" @change="setShape('tex', $event.target.value || undefined)">
          <option value="">none</option>
          <option v-for="t in TEXTURES" :key="t" :value="t">{{ t }}</option>
        </select>

        <!-- Tiling (only visible when texture is set) -->
        <template v-if="shape.tex">
          <div class="tile-row">
            <div class="tile-field">
              <label class="prop-label">Tile U</label>
              <input class="prop-input number tile-inp" type="number" step="1" min="1"
                :value="shape.sizeU ?? 4" @change="setShape('sizeU', parseFloat($event.target.value) || 4)" />
            </div>
            <div class="tile-field">
              <label class="prop-label">Tile V</label>
              <input class="prop-input number tile-inp" type="number" step="1" min="1"
                :value="shape.sizeV ?? 4" @change="setShape('sizeV', parseFloat($event.target.value) || 4)" />
            </div>
          </div>
        </template>
      </template>

      <!-- Opacity (box / cyl only) -->
      <template v-if="shape.kind !== 'boxE'">
        <div class="prop-label">Opacity</div>
        <div class="opacity-row">
          <input class="opacity-slider" type="range" min="0" max="1" step="0.05"
            :value="shape.opacity ?? 1" @input="setShape('opacity', parseFloat($event.target.value))" />
          <span class="opacity-val">{{ ((shape.opacity ?? 1) * 100).toFixed(0) }}%</span>
        </div>
      </template>

      <!-- Emissive settings -->
      <template v-if="shape.kind === 'boxE'">
        <ColorField  label="Emissive Color" :value="shape.emissive" @update="setShape('emissive', $event)" />
        <NumberField label="Intensity" :value="shape.ei" @update="setShape('ei', Math.max(0, Math.min(3, $event)))" />
      </template>

      <!-- Shape actions -->
      <div class="shape-actions">
        <button class="action-btn" @click="$emit('duplicateShape', selectedShapeIdx)">Copy Shape</button>
        <button class="action-btn danger" @click="$emit('deleteShape', selectedShapeIdx)">Delete Shape</button>
      </div>
    </template>

    <template v-else-if="(asset.shapes || []).length">
      <div class="empty-msg">Click a shape to edit</div>
    </template>

    <!-- ── Asset actions ──────────────────────────────────── -->
    <div class="bottom-actions">
      <button class="save-btn" @click="$emit('saveAsset')">Save Asset</button>
      <button class="action-btn danger" v-if="asset.savedAt" @click="$emit('deleteAsset')">Delete Asset</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  asset:            { type: Object, required: true },
  selectedShapeIdx: { type: Number, default: null },
})
const emit = defineEmits(['updateMeta', 'updateShape', 'duplicateShape', 'deleteShape', 'saveAsset', 'deleteAsset'])

const SURFACES = ['default', 'metal', 'wood', 'concrete', 'fabric', 'rubber', 'plastic', 'skin', 'glass']

const TEXTURES = [
  'floor_tile', 'floor_marble', 'floor_wood', 'floor_carpet',
  'floor_casino', 'floor_metal', 'floor_asphalt', 'floor_concrete',
  'floor_linoleum', 'floor_stone',
  'wall_plaster', 'wall_brick', 'wall_concrete', 'wall_panel',
  'wall_metal', 'wall_marble', 'wall_tile',
]

const shape = computed(() => {
  if (props.selectedShapeIdx == null) return null
  return props.asset.shapes?.[props.selectedShapeIdx] ?? null
})

const kindLabel = computed(() => {
  if (!shape.value) return ''
  return { box: 'BOX', cyl: 'CYLINDER', boxE: 'EMISSIVE BOX' }[shape.value.kind] || shape.value.kind
})

function setShape(key, val) {
  emit('updateShape', props.selectedShapeIdx, key, val)
}

function toDeg(rad) { return Math.round((rad ?? 0) * 180 / Math.PI) }
function toRad(degStr) { return (parseFloat(degStr) || 0) * Math.PI / 180 }

// Sub-components
const NumberField = {
  props: ['label', 'value'],
  emits: ['update'],
  template: `
    <div class="prop-field">
      <label class="prop-label">{{ label }}</label>
      <input class="prop-input number" type="number" step="0.05" :value="value"
        @change="$emit('update', parseFloat($event.target.value) || 0)" />
    </div>
  `,
}
const ColorField = {
  props: ['label', 'value'],
  emits: ['update'],
  computed: {
    hex() { return '#' + (this.value ?? 0).toString(16).padStart(6, '0') }
  },
  template: `
    <div class="prop-field">
      <label class="prop-label">{{ label }}</label>
      <input class="prop-input color-inp" type="color" :value="hex"
        @change="$emit('update', parseInt($event.target.value.slice(1), 16))" />
    </div>
  `,
}
</script>

<style scoped>
.props-panel {
  width: 190px; flex-shrink: 0;
  background: rgba(10,10,14,0.96); border-left: 1px solid #333;
  padding: 10px; overflow-y: auto;
  font-family: 'Courier New', monospace; color: #ccc;
  display: flex; flex-direction: column; gap: 6px;
}
.panel-title   { font-size: 11px; letter-spacing: 0.12em; color: #ffaa00; border-bottom: 1px solid #333; padding-bottom: 4px; }
.element-type  { font-size: 13px; font-weight: bold; color: #ffcc44; }
.empty-msg     { font-size: 11px; color: #555; }
.prop-group    { display: flex; flex-direction: column; gap: 5px; }
.prop-label    { font-size: 10px; letter-spacing: 0.08em; color: #888; margin-top: 2px; }
.prop-field    { display: flex; flex-direction: column; gap: 2px; }
.prop-input    { background: rgba(255,255,255,0.06); border: 1px solid #444; border-radius: 3px; color: #ddd; font: 12px monospace; padding: 4px 6px; width: 100%; }
.prop-input:focus { outline: none; border-color: #ffaa00; }
.prop-input.number { width: 100%; }
.color-inp     { padding: 1px; height: 28px; cursor: pointer; }
.separator     { border-top: 1px solid #333; margin: 4px 0; }
.shape-count   { font-size: 10px; color: #666; }
.shape-actions { display: flex; gap: 4px; margin-top: 6px; }
.action-btn {
  flex: 1; padding: 5px 4px; font: 10px monospace; letter-spacing: 0.06em;
  background: rgba(255,255,255,0.05); border: 1px solid #444; border-radius: 3px;
  color: #aaa; cursor: pointer;
}
.action-btn:hover { background: rgba(255,255,255,0.1); }
.action-btn.danger { border-color: #a02020; color: #ff8888; }
.action-btn.danger:hover { background: rgba(200,30,30,0.2); }
.bottom-actions { margin-top: auto; display: flex; flex-direction: column; gap: 6px; }
.save-btn {
  padding: 7px; background: rgba(0,200,100,0.15); border: 1px solid #2a8855; border-radius: 4px;
  color: #88ffbb; font: 11px monospace; cursor: pointer; letter-spacing: 0.08em;
}
.save-btn:hover { background: rgba(0,200,100,0.25); }

/* Rotation row */
.rot-row { display: flex; gap: 4px; }
.rot-field { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.rot-label { font-size: 9px; font-weight: bold; letter-spacing: 0.1em; text-align: center; }
.rot-label.rx { color: #ff6666; }
.rot-label.ry { color: #66ff66; }
.rot-label.rz { color: #6688ff; }
.rot-inp { text-align: center; padding: 3px 2px; font-size: 11px; }

/* Tiling row */
.tile-row { display: flex; gap: 4px; margin-top: 2px; }
.tile-field { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.tile-inp { text-align: center; padding: 3px 2px; font-size: 11px; }

/* Opacity */
.opacity-row { display: flex; align-items: center; gap: 6px; }
.opacity-slider { flex: 1; height: 4px; accent-color: #ffaa00; cursor: pointer; }
.opacity-val { font-size: 10px; color: #888; min-width: 28px; text-align: right; }
</style>
