<template>
  <aside class="props-panel">
    <div class="panel-title">PROPERTIES</div>

    <template v-if="!element">
      <div class="empty-msg">Select an element to edit</div>

      <!-- Level metadata always visible when nothing selected -->
      <div class="prop-group">
        <div class="prop-label">Level Name</div>
        <input class="prop-input" :value="levelData.name" @input="set('name', $event.target.value)" />
        <div class="prop-label">Description</div>
        <textarea class="prop-input" rows="2" :value="levelData.desc" @input="set('desc', $event.target.value)" />
        <div class="prop-label">Difficulty</div>
        <div class="star-row">
          <span v-for="n in 4" :key="n" class="star" :class="{ lit: n <= levelData.difficulty }" @click="set('difficulty', n)">★</span>
        </div>
        <div class="prop-label">Vehicle</div>
        <select class="prop-input" :value="levelData.vehicle" @change="set('vehicle', $event.target.value)">
          <option value="van">Van</option>
          <option value="truck">Truck</option>
          <option value="car">Car</option>
          <option value="armored">Armored Truck</option>
          <option value="">None</option>
        </select>
      </div>
    </template>

    <template v-else>
      <div class="element-type">{{ element.type.toUpperCase() }}</div>

      <!-- Floor -->
      <template v-if="element.type === 'floor'">
        <NumberField label="X" :value="element.data.x" @update="setData('x', $event)" />
        <NumberField label="Z" :value="element.data.z" @update="setData('z', $event)" />
        <NumberField label="Width (W)" :value="element.data.w" @update="setData('w', $event)" />
        <NumberField label="Depth (D)" :value="element.data.d" @update="setData('d', $event)" />
        <NumberField label="Y (offset)" :value="element.data.y ?? 0" @update="setData('y', $event || undefined)" />
        <ColorField  label="Color"     :value="element.data.color ?? 0x9a8a70" @update="setData('color', $event)" />
        <div class="prop-label">Texture</div>
        <select class="prop-input" :value="element.data.tex ?? ''" @change="setData('tex', $event.target.value || undefined)">
          <option value="">None (color)</option>
          <option value="floor_tile">Tile</option>
          <option value="floor_asphalt">Asphalt</option>
          <option value="floor_concrete">Concrete</option>
          <option value="floor_wood">Wood</option>
        </select>
      </template>

      <!-- Wall -->
      <template v-if="element.type === 'wall'">
        <NumberField label="X" :value="element.data.x" @update="setData('x', $event)" />
        <NumberField label="Z" :value="element.data.z" @update="setData('z', $event)" />
        <NumberField label="Width (W)" :value="element.data.w" @update="setData('w', $event)" />
        <NumberField label="Depth (D)" :value="element.data.d" @update="setData('d', $event)" />
        <NumberField label="Height (H)" :value="element.data.h ?? 4" @update="setData('h', $event)" />
        <NumberField label="Y (offset)" :value="element.data.y ?? 0" @update="setData('y', $event || undefined)" />
        <ColorField  label="Color"     :value="element.data.color ?? 0x707070" @update="setData('color', $event)" />
        <div class="prop-label">Texture</div>
        <select class="prop-input" :value="element.data.tex ?? ''" @change="setData('tex', $event.target.value || undefined)">
          <option value="">None (color)</option>
          <option value="wall_brick">Brick</option>
          <option value="wall_plaster">Plaster</option>
          <option value="wall_concrete">Concrete</option>
        </select>
        <div class="prop-row">
          <label class="prop-label">Full Glass</label>
          <input type="checkbox" :checked="!!element.data.glass" @change="setData('glass', $event.target.checked || undefined)" />
        </div>
        <div class="prop-row">
          <label class="prop-label">Window</label>
          <input type="checkbox" :checked="!!element.data.window" @change="onToggleWindow($event.target.checked)" />
        </div>
        <template v-if="element.data.window">
          <NumberField label="Window Y" :value="element.data.windowY ?? 1.0" @update="setData('windowY', $event)" />
          <NumberField label="Window H" :value="element.data.windowH ?? 1.5" @update="setData('windowH', $event)" />
        </template>
        <div class="prop-row">
          <label class="prop-label">Destructible</label>
          <input type="checkbox" :checked="!!element.data.destructible" @change="setData('destructible', $event.target.checked || undefined)" />
        </div>
        <div class="prop-row">
          <label class="prop-label">Breachable (AI)</label>
          <input type="checkbox" :checked="!!element.data.breachable" @change="setData('breachable', $event.target.checked || undefined)" />
        </div>
      </template>

      <!-- Zone -->
      <template v-if="element.type === 'zone'">
        <NumberField label="X" :value="element.data.x" @update="setData('x', $event)" />
        <NumberField label="Z" :value="element.data.z" @update="setData('z', $event)" />
        <NumberField label="Width" :value="element.data.w" @update="setData('w', $event)" />
        <NumberField label="Depth" :value="element.data.d" @update="setData('d', $event)" />
        <div class="prop-label">Type</div>
        <div class="btn-group">
          <button :class="{ active: element.data.type === 'public' }"  @click="setData('type','public')">PUBLIC</button>
          <button :class="{ active: element.data.type === 'private' }" @click="setData('type','private')">PRIVATE</button>
          <button :class="{ active: element.data.type === 'secure' }"  @click="setData('type','secure')">SECURE</button>
        </div>
        <div class="prop-label">Label</div>
        <input class="prop-input" :value="element.data.label" @input="setData('label', $event.target.value)" />
      </template>

      <!-- Door -->
      <template v-if="element.type === 'door'">
        <NumberField label="X" :value="element.data.x" @update="setData('x', $event)" />
        <NumberField label="Z" :value="element.data.z" @update="setData('z', $event)" />
        <NumberField label="Angle (rad)" :value="element.data.angle ?? 0" @update="setData('angle', $event)" />
        <NumberField label="Width" :value="element.data.w ?? 1.2" @update="setData('w', $event)" />
        <div class="prop-label">Type</div>
        <div class="btn-group">
          <button :class="{ active: element.data.type === 'normal' }"  @click="setData('type','normal')">NORMAL</button>
          <button :class="{ active: element.data.type === 'secure' }" @click="setData('type','secure')">SECURE</button>
          <button :class="{ active: element.data.type === 'keycard' }" @click="setData('type','keycard')">KEYCARD</button>
          <button :class="{ active: element.data.type === 'drill' }" @click="setData('type','drill')">DRILL</button>
        </div>
        <template v-if="element.data.type === 'keycard'">
          <div class="prop-label">Keycard ID</div>
          <input class="prop-input" :value="element.data.keycardId ?? ''" @input="setData('keycardId', $event.target.value || undefined)" />
        </template>
      </template>

      <!-- Prop -->
      <template v-if="element.type === 'prop'">
        <NumberField label="X" :value="element.data.x" @update="setData('x', $event)" />
        <NumberField label="Z" :value="element.data.z" @update="setData('z', $event)" />
        <NumberField label="Rotation (deg)" :value="Math.round((element.data.rotY ?? 0) * 180 / Math.PI)" @update="setData('rotY', ($event * Math.PI / 180) || undefined)" />
        <div v-if="!element.data.type">
          <NumberField label="Width"  :value="element.data.w ?? 1" @update="setData('w', $event)" />
          <NumberField label="Height" :value="element.data.h ?? 1" @update="setData('h', $event)" />
          <NumberField label="Depth"  :value="element.data.d ?? 1" @update="setData('d', $event)" />
          <NumberField label="HP"     :value="element.data.hp ?? 60" @update="setData('hp', $event)" />
          <ColorField  label="Color"  :value="element.data.color ?? 0x3a3030" @update="setData('color', $event)" />
        </div>
      </template>

      <!-- Light -->
      <template v-if="element.type === 'light'">
        <NumberField label="X"         :value="element.data[0]" @update="setArrIdx(0, $event)" />
        <NumberField label="Y (height)" :value="element.data[1]" @update="setArrIdx(1, $event)" />
        <NumberField label="Z"         :value="element.data[2]" @update="setArrIdx(2, $event)" />
        <NumberField label="Intensity"  :value="element.data[3] ?? 0.7" @update="setArrIdx(3, $event)" />
        <NumberField label="Range"      :value="element.data[4] ?? 12" @update="setArrIdx(4, $event)" />
      </template>

      <!-- Spawn -->
      <template v-if="element.type === 'spawn'">
        <NumberField label="X" :value="element.data[0]" @update="setArrIdx(0, $event)" />
        <NumberField label="Z" :value="element.data[1]" @update="setArrIdx(1, $event)" />
      </template>

      <!-- Bag -->
      <template v-if="element.type === 'bag'">
        <NumberField label="X" :value="element.data[0]" @update="setArrIdx(0, $event)" />
        <NumberField label="Z" :value="element.data[1]" @update="setArrIdx(1, $event)" />
      </template>

      <!-- Camera -->
      <template v-if="element.type === 'camera'">
        <NumberField label="X" :value="element.data.x" @update="setData('x', $event)" />
        <NumberField label="Z" :value="element.data.z" @update="setData('z', $event)" />
        <NumberField label="Y (height)" :value="element.data.y ?? 2.8" @update="setData('y', $event)" />
        <NumberField label="Angle (deg)" :value="Math.round((element.data.angle ?? 0) * 180 / Math.PI)" @update="setData('angle', $event * Math.PI / 180)" />
        <NumberField label="Range" :value="element.data.range ?? 8" @update="setData('range', $event)" />
        <NumberField label="Pan Range" :value="element.data.panRange ?? 0" @update="setData('panRange', $event || undefined)" />
      </template>

      <!-- Pillar -->
      <template v-if="element.type === 'pillar'">
        <NumberField label="X" :value="element.data.x" @update="setData('x', $event)" />
        <NumberField label="Z" :value="element.data.z" @update="setData('z', $event)" />
      </template>

      <!-- Rotation controls (for rotatable elements) -->
      <template v-if="['prop','door','camera'].includes(element.type)">
        <div class="prop-label">ROTATE</div>
        <div class="btn-group">
          <button @click="rotate(-90)">↶ -90°</button>
          <button @click="rotate(-45)">-45°</button>
          <button @click="rotate(45)">+45°</button>
          <button @click="rotate(90)">↷ +90°</button>
        </div>
      </template>
      <template v-if="element.type === 'wall'">
        <div class="prop-label">ROTATE</div>
        <div class="btn-group">
          <button @click="swapWallDims">↻ Swap W↔D</button>
        </div>
      </template>

      <!-- Position assist -->
      <div class="prop-label" style="margin-top:6px">POSITION</div>
      <div class="btn-group">
        <button @click="snapToGrid(1)">Snap 1m</button>
        <button @click="snapToGrid(0.5)">Snap 0.5</button>
      </div>

      <!-- Delete button -->
      <button class="delete-btn" @click="$emit('remove')">🗑 Delete Element</button>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  levelData:  { type: Object, required: true },
  selectedId: { type: [String, Number], default: null },
})
const emit = defineEmits(['update', 'remove'])

// Parse selectedId → { type, idx }
const element = computed(() => {
  if (!props.selectedId) return null
  const parts = String(props.selectedId).split('_')
  const type  = parts[0]
  const idx   = parseInt(parts[1] ?? '0')
  const ld    = props.levelData
  const arrays = {
    floor: ld.floors, wall: ld.walls, zone: ld.zones,
    door: ld.doors, prop: ld.props, light: ld.lights,
    bag: ld.bags, spawn: ld.spawnPoints,
    camera: ld.cameras, pillar: ld.pillars,
  }
  const arr = arrays[type]
  if (!arr || idx >= arr.length) return null
  return { type, idx, data: arr[idx] }
})

function set(key, val) { emit('update', { path: [key], val }) }

function setData(key, val) {
  if (!element.value) return
  const { type, idx } = element.value
  const arrayKey = {
    floor: 'floors', wall: 'walls', zone: 'zones',
    door: 'doors', prop: 'props', light: 'lights',
    bag: 'bags', spawn: 'spawnPoints',
    camera: 'cameras', pillar: 'pillars',
  }[type]
  emit('update', { path: [arrayKey, idx, key], val })
}

function setArrIdx(arrIdx, val) {
  if (!element.value) return
  const { type, idx } = element.value
  const arrayKey = {
    light: 'lights', bag: 'bags', spawn: 'spawnPoints',
  }[type]
  emit('update', { path: [arrayKey, idx, arrIdx], val })
}

function onToggleWindow(checked) {
  if (checked) {
    setData('window', true)
    setData('glass', undefined)  // mutually exclusive
  } else {
    setData('window', undefined)
    setData('windowY', undefined)
    setData('windowH', undefined)
  }
}

function rotate(deg) {
  if (!element.value) return
  const { type } = element.value
  const rad = deg * Math.PI / 180
  if (type === 'prop') {
    const cur = element.value.data.rotY ?? 0
    setData('rotY', +((cur + rad) % (Math.PI * 2)).toFixed(4) || undefined)
  } else if (type === 'door' || type === 'camera') {
    const cur = element.value.data.angle ?? 0
    setData('angle', +((cur + rad)).toFixed(4))
  }
}

function swapWallDims() {
  if (!element.value || element.value.type !== 'wall') return
  const w = element.value.data
  const tmp = w.w; w.w = w.d; w.d = tmp
}

function snapToGrid(grid) {
  if (!element.value) return
  const d = element.value.data
  if (Array.isArray(d)) {
    // array-based (spawn, bag, light, etc.)
    if (d[0] != null) d[0] = Math.round(d[0] / grid) * grid
    if (d[1] != null) d[1] = Math.round(d[1] / grid) * grid
  } else {
    if (d.x != null) setData('x', Math.round(d.x / grid) * grid)
    if (d.z != null) setData('z', Math.round(d.z / grid) * grid)
  }
}

// Simple sub-components as render functions
const NumberField = {
  props: ['label', 'value'],
  emits: ['update'],
  template: `
    <div class="prop-field">
      <label class="prop-label">{{ label }}</label>
      <input class="prop-input number" type="number" step="0.1" :value="value"
        @change="$emit('update', parseFloat($event.target.value) || 0)" />
    </div>
  `,
}

const ColorField = {
  props: ['label', 'value'],
  emits: ['update'],
  computed: {
    hex() {
      const v = this.value ?? 0
      return '#' + v.toString(16).padStart(6, '0')
    }
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
  width: 190px;
  flex-shrink: 0;
  background: rgba(10,10,14,0.96);
  border-left: 1px solid #333;
  padding: 10px 10px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  color: #ccc;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-title   { font-size: 11px; letter-spacing: 0.12em; color: #ffaa00; border-bottom: 1px solid #333; padding-bottom: 4px; }
.element-type  { font-size: 13px; font-weight: bold; color: #ffcc44; }
.empty-msg     { font-size: 11px; color: #555; margin-bottom: 8px; }
.prop-group    { display: flex; flex-direction: column; gap: 5px; }
.prop-label    { font-size: 10px; letter-spacing: 0.08em; color: #888; margin-top: 2px; }
.prop-field    { display: flex; flex-direction: column; gap: 2px; }
.prop-input    { background: rgba(255,255,255,0.06); border: 1px solid #444; border-radius: 3px; color: #ddd; font: 12px monospace; padding: 4px 6px; width: 100%; }
.prop-input:focus { outline: none; border-color: #ffaa00; }
.prop-input.number { width: 100%; }
.color-inp     { padding: 1px; height: 28px; cursor: pointer; }
.prop-row      { display: flex; align-items: center; justify-content: space-between; }
.star-row      { display: flex; gap: 4px; }
.star          { font-size: 20px; color: #444; cursor: pointer; transition: color 0.15s; }
.star.lit      { color: #ffaa00; }
.btn-group     { display: flex; gap: 4px; flex-wrap: wrap; }
.btn-group button {
  flex: 1; padding: 3px 4px; font: 9px monospace; letter-spacing: 0.06em;
  background: rgba(255,255,255,0.05); border: 1px solid #444; border-radius: 3px;
  color: #aaa; cursor: pointer;
}
.btn-group button.active { background: rgba(255,170,0,0.2); border-color: #ffaa00; color: #ffdd88; }
.delete-btn {
  margin-top: 8px; padding: 6px; background: rgba(200,30,30,0.2); border: 1px solid #a02020;
  border-radius: 4px; color: #ff8888; font: 11px monospace; cursor: pointer; letter-spacing: 0.08em;
}
.delete-btn:hover { background: rgba(200,30,30,0.35); }
</style>
