<template>
  <div class="builder-root">

    <!-- ── Top bar ─────────────────────────────────────────────── -->
    <div class="top-bar">
      <button class="tb-btn" @click="$emit('close')">← Back</button>

      <div class="mode-tabs">
        <button :class="['tab', { active: mode === '2d' }]"       @click="mode = '2d'">2D Layout</button>
        <button :class="['tab', { active: mode === '3d' }]"       @click="switchTo3D">3D Assets</button>
        <button :class="['tab', { active: mode === 'settings' }]" @click="mode = 'settings'">⚙ Settings</button>
        <button :class="['tab', { active: mode === 'logic' }]"    @click="mode = 'logic'">⚡ Logic</button>
        <button :class="['tab', { active: mode === 'assets' }]"  @click="mode = 'assets'">🧊 Assets</button>
      </div>

      <div class="tb-actions">
        <Transition name="toast-fade">
          <span v-if="saveToast" class="toast">✓ Saved</span>
        </Transition>
        <button class="tb-btn"      @click="loadModal = true">📂 Load</button>
        <button class="tb-btn"      @click="save">💾 Save</button>
        <button class="tb-btn"      @click="doExportJS">⬇ Export JS</button>
        <button class="tb-btn play" @click="playTest">▶ Play Test</button>
      </div>
    </div>

    <!-- ── 2D Layout ──────────────────────────────────────────── -->
    <div v-if="mode === '2d'" class="editor-layout">
      <div class="toolbar-col">
        <BuilderToolbar
          mode="2d"
          :activeTool="activeTool"
          :subTool="subTool"
          :zoneType="zoneType"
          :doorType="doorType"
          :customAssets="savedCustomAssets"
          @setTool="activeTool = $event"
          @setSubTool="subTool = $event"
          @setZoneType="zoneType = $event"
          @setDoorType="doorType = $event"
        />
        <BuilderLayers v-model="layers" />
      </div>
      <div class="canvas-area">
        <Canvas2D
          ref="canvas2dRef"
          :levelData="levelData"
          :activeTool="activeTool"
          :subTool="subTool"
          :zoneType="zoneType"
          :doorType="doorType"
          :selectedId="selectedId"
          :layers="layers"
          @update:selectedId="selectedId = $event"
          @addElement="onAdd"
          @moveElement="onMove"
          @removeElement="onRemove"
          @snapshot="pushSnapshot"
          @undo="undo"
          @redo="redo"
          @wallGlass="onWallGlass"
        />
      </div>
      <BuilderProperties
        :levelData="levelData"
        :selectedId="selectedId"
        @update="onUpdate"
        @remove="onRemoveSelected"
      />
    </div>

    <!-- ── 3D Assets ──────────────────────────────────────────── -->
    <div v-if="mode === '3d'" class="editor-layout">
      <BuilderToolbar
        mode="3d"
        :subTool="subTool"
        :customAssets="savedCustomAssets"
        @setSubTool="subTool = $event"
      />
      <div class="canvas-area">
        <Canvas3D
          ref="canvas3dRef"
          :levelOutput="levelOutput"
          :selectedProp="subTool"
          @placeProp="onPlaceProp"
          @removeProp="onRemoveProp"
        />
      </div>
    </div>

    <!-- ── Logic Editor ─────────────────────────────────────────── -->
    <div v-if="mode === 'logic'" class="editor-layout">
      <LogicToolbar @addNode="onAddGraphNode" />
      <div class="canvas-area">
        <LogicEditor
          ref="logicEditorRef"
          :graph="levelData.graph"
          :selectedNodeId="selectedGraphNode"
          @update:selectedNodeId="selectedGraphNode = $event"
          @addNode="onAddGraphNodeAt"
          @removeNode="onRemoveGraphNode"
          @moveNode="onMoveGraphNode"
          @addEdge="onAddGraphEdge"
          @removeEdge="onRemoveGraphEdge"
        />
      </div>
      <LogicProperties
        :graph="levelData.graph"
        :selectedNodeId="selectedGraphNode"
        @updateField="onGraphFieldUpdate"
        @deleteNode="onRemoveGraphNode"
      />
    </div>

    <!-- ── Asset Editor ──────────────────────────────────────── -->
    <div v-if="mode === 'assets'" class="editor-layout">
      <AssetToolbar
        :savedAssets="savedCustomAssets"
        :currentId="editingAsset.id"
        @addShape="onAddShape"
        @newAsset="onNewAsset"
        @loadAsset="onLoadAsset"
        @loadPreset="onLoadPreset"
      />
      <div class="canvas-area">
        <AssetEditor
          ref="assetEditorRef"
          :asset="editingAsset"
          :selectedShapeIdx="selectedShapeIdx"
          @select="selectedShapeIdx = $event"
        />
      </div>
      <AssetProperties
        :asset="editingAsset"
        :selectedShapeIdx="selectedShapeIdx"
        @updateMeta="onAssetMetaUpdate"
        @updateShape="onAssetShapeUpdate"
        @duplicateShape="onDuplicateShape"
        @deleteShape="onDeleteShape"
        @saveAsset="onSaveAsset"
        @deleteAsset="onDeleteAsset"
      />
    </div>

    <!-- ── Settings ───────────────────────────────────────────── -->
    <div v-if="mode === 'settings'" class="settings-root">
      <div class="sett-section">
        <div class="sett-title">LEVEL METADATA</div>

        <div class="sett-row">
          <label>Name</label>
          <input class="sett-input" v-model="levelData.name" />
        </div>
        <div class="sett-row">
          <label>Description</label>
          <textarea class="sett-input" rows="3" v-model="levelData.desc" />
        </div>
        <div class="sett-row">
          <label>Difficulty</label>
          <div class="star-row">
            <span
              v-for="n in 4" :key="n"
              class="star" :class="{ lit: n <= levelData.difficulty }"
              @click="levelData.difficulty = n"
            >★</span>
          </div>
        </div>
        <div class="sett-row">
          <label>Vehicle</label>
          <select class="sett-input" v-model="levelData.vehicle">
            <option value="van">Van</option>
            <option value="truck">Truck</option>
            <option value="car">Car</option>
            <option value="armored">Armored Truck</option>
            <option value="">None</option>
          </select>
        </div>
        <div class="sett-row">
          <label>Bag Color</label>
          <input type="color"
            :value="'#' + levelData.bagColor.toString(16).padStart(6, '0')"
            @change="levelData.bagColor = parseInt($event.target.value.slice(1), 16)"
          />
        </div>
      </div>

      <div class="sett-section">
        <div class="sett-title">POPULATION</div>
        <div class="sett-row">
          <label>Civilian Theme</label>
          <select class="sett-input" v-model="levelData.civilianTheme">
            <option value="default">Default</option>
            <option value="bank">Bank</option>
            <option value="office">Office</option>
            <option value="store">Store</option>
            <option value="warehouse">Warehouse</option>
          </select>
        </div>
        <div class="sett-row">
          <label>Civilian Count (0 = auto)</label>
          <input class="sett-input" type="number" min="0" v-model.number="levelData.civilianCount" />
        </div>
        <div class="sett-row">
          <label>Employee Count (0 = auto)</label>
          <input class="sett-input" type="number" min="0" v-model.number="levelData.employeeCount" />
        </div>
      </div>

      <div class="sett-section">
        <div class="sett-title">VEHICLE</div>
        <div class="sett-row">
          <label>Vehicle Angle (degrees)</label>
          <input class="sett-input" type="number" step="1"
            :value="Math.round((levelData.vehicleAngle ?? 0) * 180 / Math.PI)"
            @change="levelData.vehicleAngle = (parseFloat($event.target.value) || 0) * Math.PI / 180"
          />
        </div>
      </div>

      <div class="sett-section">
        <div class="sett-title">THERMAL DRILL</div>
        <div class="sett-row">
          <label>Drill Door Index (-1 = disabled)</label>
          <input class="sett-input" type="number" min="-1" step="1"
            :value="levelData.drill?.doorIndex ?? -1"
            @change="setDrillField('doorIndex', parseInt($event.target.value) ?? -1)"
          />
        </div>
        <div class="sett-row">
          <label>Drill Time (seconds)</label>
          <input class="sett-input" type="number" min="10" step="5"
            :value="levelData.drill?.time ?? 120"
            @change="setDrillField('time', parseFloat($event.target.value) || 120)"
          />
        </div>
      </div>

      <div class="sett-section">
        <div class="sett-title">LEVEL STATS</div>
        <div class="sett-stats">
          <div>Floors: <b>{{ levelData.floors.length }}</b></div>
          <div>Walls: <b>{{ levelData.walls.length }}</b></div>
          <div>Doors: <b>{{ levelData.doors.length }}</b></div>
          <div>Props: <b>{{ levelData.props.length }}</b></div>
          <div>Zones: <b>{{ levelData.zones.length }}</b></div>
          <div>Bags (objectives): <b>{{ levelData.bags.length }}</b></div>
          <div>Lights: <b>{{ levelData.lights.length }}</b></div>
          <div>Cameras: <b>{{ (levelData.cameras ?? []).length }}</b></div>
          <div>Pillars: <b>{{ (levelData.pillars ?? []).length }}</b></div>
          <div>Spawn points: <b>{{ levelData.spawnPoints.length }}</b></div>
          <div>Patrol routes: <b>{{ levelData.patrolRoutes.length }}</b></div>
          <div>Player start: <b :style="{ color: levelData.playerStart ? '#44dd44' : '#dd4444' }">{{ levelData.playerStart ? '✓' : '✗' }}</b></div>
          <div>Escape zone: <b :style="{ color: levelData.escape ? '#44dd44' : '#dd4444' }">{{ levelData.escape ? '✓' : '✗' }}</b></div>
        </div>
      </div>

      <div class="sett-section danger-zone">
        <div class="sett-title" style="color:#ff6666">DANGER ZONE</div>
        <button class="danger-btn" @click="clearAll">🗑 Clear All Elements</button>
        <button class="danger-btn" @click="newLevel">⊕ New Level (reset)</button>
      </div>
    </div>

    <!-- ── Load modal ─────────────────────────────────────────── -->
    <div v-if="loadModal" class="modal-overlay" @click.self="loadModal = false">
      <div class="load-modal">
        <div class="modal-title">LOAD LEVEL</div>

        <div class="load-section">
          <div class="load-section-title">BUILT-IN MAPS</div>
          <div class="load-grid">
            <div
              v-for="(lv, idx) in builtInLevels" :key="lv.id"
              class="load-card"
              @click="doLoadLevel(lv)"
            >
              <div class="load-card-num">{{ String(idx + 1).padStart(2, '0') }}</div>
              <div class="load-card-name">{{ lv.name }}</div>
              <div class="load-card-diff">
                <span v-for="n in 4" :key="n" :class="['star-sm', { lit: n <= lv.difficulty }]">★</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="savedLevels.length" class="load-section">
          <div class="load-section-title">SAVED MAPS</div>
          <div class="load-list">
            <div
              v-for="lv in savedLevels" :key="lv.id"
              class="load-row"
            >
              <div class="load-row-info" @click="doLoadLevel(lv)">
                <span class="load-row-name">{{ lv.name }}</span>
                <span class="load-row-date">{{ formatDate(lv.savedAt) }}</span>
              </div>
              <button class="load-row-del" @click.stop="doDeleteSaved(lv.id)">🗑</button>
            </div>
          </div>
        </div>

        <div class="modal-btns">
          <button class="tb-btn" @click="loadModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- ── Export modal ───────────────────────────────────────── -->
    <div v-if="exportModal" class="modal-overlay" @click.self="exportModal = false">
      <div class="export-modal">
        <div class="modal-title">EXPORT AS JS</div>
        <div class="modal-hint">
          Copy and paste into <code>src/game/levels/maps/XX_yourmap.js</code>
          then register it in <code>index.js</code>
        </div>
        <textarea class="export-ta" readonly :value="exportCode" />
        <div class="modal-btns">
          <button class="tb-btn" @click="copyExport">📋 Copy</button>
          <button class="tb-btn" @click="exportModal = false">Close</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import Canvas2D          from './builder/Canvas2D.vue'
import Canvas3D          from './builder/Canvas3D.vue'
import BuilderToolbar    from './builder/BuilderToolbar.vue'
import BuilderProperties from './builder/BuilderProperties.vue'
import BuilderLayers    from './builder/BuilderLayers.vue'
import LogicEditor       from './builder/LogicEditor.vue'
import LogicToolbar      from './builder/LogicToolbar.vue'
import LogicProperties   from './builder/LogicProperties.vue'
import AssetEditor       from './builder/AssetEditor.vue'
import AssetToolbar      from './builder/AssetToolbar.vue'
import AssetProperties   from './builder/AssetProperties.vue'
import { useNodeGraph }  from '../composables/useNodeGraph.ts'
import { saveCustomLevel, exportAsJS, listCustomLevels, deleteCustomLevel } from '../game/levels/CustomLevelStore.ts'
import { listCustomAssets, saveCustomAsset, loadCustomAsset, deleteCustomAsset } from '../game/levels/CustomAssetStore.ts'
import { LEVELS }        from '../game/levels/index.ts'
import { state }         from '../game/state.ts'
import { useLevelData }  from '../composables/useLevelData.ts'

const emit = defineEmits(['close', 'playCustom'])

// ── Mode ──────────────────────────────────────────────────────
const mode = ref('2d')

// ── Tool state ────────────────────────────────────────────────
const activeTool = ref('SELECT')
const subTool    = ref(null)
const zoneType   = ref('public')
const doorType   = ref('normal')

// ── Layer visibility ──────────────────────────────────────────
const layers = ref({
  floors: true, walls: true, zones: true, doors: true, props: true,
  lights: true, cameras: true, spawns: true, bags: true, pillars: true, grid: true,
})

// ── Level data + undo/redo (all from composable) ──────────────
const {
  levelData, levelOutput, selectedId, toOutputFormat,
  pushSnapshot, undo, redo,
  onAdd, onMove, onRemove, onRemoveSelected, onUpdate,
  onPlaceProp, onRemoveProp, clearAll, newLevel, loadLevel,
} = useLevelData()

// ── Wall glass toggle (WINDOW tool) ──────────────────────────────
function onWallGlass(idx: number) {
  const wall = levelData.walls[idx]
  if (wall) wall.glass = !wall.glass
}

// ── Switch to 3D mode ─────────────────────────────────────────
const canvas3dRef = ref(null)

function switchTo3D() {
  mode.value = '3d'
  nextTick(() => canvas3dRef.value?.rebuild?.())
}

// ── Logic graph ──────────────────────────────────────────────
const logicEditorRef  = ref(null)
const selectedGraphNode = ref(null)
const ng = useNodeGraph(levelData.graph)

function onAddGraphNode(type: string) {
  pushSnapshot()
  const center = logicEditorRef.value?.getViewportCenter?.() ?? { x: 100, y: 100 }
  const node = ng.addNode(type, center.x, center.y)
  selectedGraphNode.value = node.id
}

function onAddGraphNodeAt(type: string, x: number, y: number) {
  pushSnapshot()
  ng.addNode(type, x, y)
}

function onRemoveGraphNode(id: string) {
  pushSnapshot()
  ng.removeNode(id)
  if (selectedGraphNode.value === id) selectedGraphNode.value = null
}

function onMoveGraphNode(id: string, x: number, y: number) {
  ng.moveNode(id, x, y)
}

function onAddGraphEdge(from: string, fromPort: string, to: string, toPort: string) {
  pushSnapshot()
  ng.addEdge(from, fromPort, to, toPort)
}

function onRemoveGraphEdge(id: string) {
  pushSnapshot()
  ng.removeEdge(id)
}

function onGraphFieldUpdate(nodeId: string, key: string, value: any) {
  pushSnapshot()
  ng.updateField(nodeId, key, value)
}

// ── Asset Editor ─────────────────────────────────────────────
const assetEditorRef      = ref(null)
const selectedShapeIdx    = ref<number | null>(null)
const savedCustomAssets   = ref<any[]>([])

function _makeEmptyAsset() {
  return { id: crypto.randomUUID(), name: 'New Asset', icon: '📦', hp: 80, shapes: [], savedAt: 0 }
}
const editingAsset = ref(_makeEmptyAsset())

function refreshCustomAssets() {
  savedCustomAssets.value = listCustomAssets()
}

function onNewAsset() {
  editingAsset.value = _makeEmptyAsset()
  selectedShapeIdx.value = null
}

function onLoadAsset(id: string) {
  const a = loadCustomAsset(id)
  if (a) { editingAsset.value = { ...a }; selectedShapeIdx.value = null }
}

function onLoadPreset(preset: any) {
  editingAsset.value = {
    id: crypto.randomUUID(),
    name: preset.name + ' (custom)',
    icon: preset.icon,
    hp: preset.hp,
    shapes: JSON.parse(JSON.stringify(preset.shapes)),
    savedAt: 0,
  }
  selectedShapeIdx.value = null
}

function onAddShape(kind: string) {
  const defaults = {
    box:  { kind: 'box',  w: 0.5, h: 0.5, d: 0.5, color: 0x888888, lx: 0, ly: 0.25, lz: 0, surface: 'default' },
    cyl:  { kind: 'cyl',  rT: 0.25, rB: 0.25, h: 0.5, color: 0x888888, lx: 0, ly: 0.25, lz: 0, segs: 14, surface: 'default' },
    boxE: { kind: 'boxE', w: 0.3, h: 0.2, d: 0.05, color: 0x112255, emissive: 0x0044CC, ei: 0.8, lx: 0, ly: 0.5, lz: 0 },
  }
  editingAsset.value.shapes.push({ ...defaults[kind] })
  selectedShapeIdx.value = editingAsset.value.shapes.length - 1
}

function onAssetMetaUpdate(key: string, val: any) {
  editingAsset.value[key] = val
}

function onAssetShapeUpdate(idx: number, key: string, val: any) {
  if (editingAsset.value.shapes[idx]) {
    editingAsset.value.shapes[idx][key] = val
  }
}

function onDuplicateShape(idx: number) {
  const s = editingAsset.value.shapes[idx]
  if (!s) return
  editingAsset.value.shapes.push({ ...s, lx: s.lx + 0.3 })
  selectedShapeIdx.value = editingAsset.value.shapes.length - 1
}

function onDeleteShape(idx: number) {
  editingAsset.value.shapes.splice(idx, 1)
  selectedShapeIdx.value = null
}

function onSaveAsset() {
  saveCustomAsset(editingAsset.value)
  refreshCustomAssets()
  saveToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { saveToast.value = false }, 1800)
}

function onDeleteAsset() {
  if (!confirm('Delete this asset?')) return
  deleteCustomAsset(editingAsset.value.id)
  editingAsset.value = _makeEmptyAsset()
  selectedShapeIdx.value = null
  refreshCustomAssets()
}

// Load custom assets on init + mode switch
refreshCustomAssets()
watch(mode, v => { if (v === 'assets') refreshCustomAssets() })

// ── Load modal ───────────────────────────────────────────────
const loadModal = ref(false)
const builtInLevels = LEVELS
const savedLevels = ref<any[]>([])

function refreshSavedLevels() {
  savedLevels.value = listCustomLevels()
}

function doLoadLevel(data: any) {
  if (loadLevel(data)) {
    loadModal.value = false
    mode.value = '2d'
    selectedGraphNode.value = null
  }
}

function doDeleteSaved(id: string) {
  // eslint-disable-next-line no-alert
  if (!confirm('Delete this saved level?')) return
  deleteCustomLevel(id)
  refreshSavedLevels()
}

function formatDate(ts: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

watch(loadModal, v => { if (v) refreshSavedLevels() })

// ── Save to localStorage ──────────────────────────────────────
const saveToast = ref(false)
let toastTimer = null

function save() {
  saveCustomLevel(toOutputFormat(levelData))
  saveToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { saveToast.value = false }, 1800)
}

// ── Export JS ─────────────────────────────────────────────────
const exportModal = ref(false)
const exportCode  = ref('')

function doExportJS() {
  exportCode.value = exportAsJS(toOutputFormat(levelData))
  exportModal.value = true
}

function copyExport() {
  navigator.clipboard?.writeText(exportCode.value).catch(() => {})
}

// ── Drill settings helper ─────────────────────────────────────
function setDrillField(key: string, val: any) {
  if (!levelData.drill) {
    levelData.drill = { doorIndex: -1, time: 120 }
  }
  levelData.drill[key] = val
  // If doorIndex is -1, clear drill entirely
  if (key === 'doorIndex' && val < 0) {
    levelData.drill = null
  }
}

// ── Play test ─────────────────────────────────────────────────
function playTest() {
  if (!levelData.playerStart) {
    // eslint-disable-next-line no-alert
    alert('Set a Player Start point first (◉ tool in 2D mode).')
    return
  }
  if (!levelData.escape) {
    // eslint-disable-next-line no-alert
    alert('Set an Escape zone first (○ tool in 2D mode).')
    return
  }
  if (!levelData.bags.length) {
    // eslint-disable-next-line no-alert
    alert('Place at least one Bag/objective (◇ tool in 2D mode).')
    return
  }
  const out = toOutputFormat(levelData)
  state.builderLevel = out
  emit('playCustom', out)
}
</script>

<style scoped>
.builder-root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #0d0d12;
  color: #ccc;
  font-family: 'Courier New', monospace;
  z-index: 100;
}

/* ── Top bar ─────────────────────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(10, 10, 14, 0.98);
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.mode-tabs {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.tab {
  padding: 5px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 3px;
  color: #888;
  font: 11px 'Courier New', monospace;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.15s;
}
.tab:hover  { background: rgba(255,255,255,0.1); color: #ccc; }
.tab.active { background: rgba(255,170,0,0.18); border-color: #ffaa00; color: #ffdd88; }

.tb-actions { display: flex; align-items: center; gap: 6px; }

.tb-btn {
  padding: 5px 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid #444;
  border-radius: 3px;
  color: #ccc;
  font: 11px 'Courier New', monospace;
  letter-spacing: 0.05em;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.tb-btn:hover { background: rgba(255,255,255,0.12); border-color: #666; }
.tb-btn.play  { background: rgba(40,180,60,0.2); border-color: #44aa44; color: #88ee88; }
.tb-btn.play:hover { background: rgba(40,180,60,0.35); }

.toast {
  font-size: 11px;
  color: #44dd88;
  letter-spacing: 0.08em;
}
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.3s; }
.toast-fade-enter-from,  .toast-fade-leave-to      { opacity: 0; }

/* ── Editor layout ───────────────────────────────────────────── */
.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.toolbar-col {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* ── Settings ────────────────────────────────────────────────── */
.settings-root {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 480px;
  margin: 0 auto;
}

.sett-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sett-title {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #ffaa00;
  border-bottom: 1px solid #333;
  padding-bottom: 5px;
  margin-bottom: 2px;
}

.sett-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sett-row label { font-size: 10px; color: #888; letter-spacing: 0.06em; }

.sett-input {
  background: rgba(255,255,255,0.07);
  border: 1px solid #444;
  border-radius: 3px;
  color: #ddd;
  font: 13px 'Courier New', monospace;
  padding: 5px 8px;
  resize: vertical;
}
.sett-input:focus { outline: none; border-color: #ffaa00; }

.star-row { display: flex; gap: 5px; }
.star      { font-size: 22px; color: #444; cursor: pointer; transition: color 0.15s; }
.star.lit  { color: #ffaa00; }

.sett-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 12px;
  font-size: 12px;
  color: #999;
}
.sett-stats b { color: #ddd; }

.danger-zone { margin-top: 8px; }

.danger-btn {
  width: 100%;
  padding: 7px;
  background: rgba(200,30,30,0.15);
  border: 1px solid #882222;
  border-radius: 3px;
  color: #ff8888;
  font: 11px 'Courier New', monospace;
  letter-spacing: 0.06em;
  cursor: pointer;
}
.danger-btn:hover { background: rgba(200,30,30,0.3); }

/* ── Export modal ────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.export-modal {
  background: #111118;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 20px;
  width: min(700px, 90vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-title { font-size: 13px; letter-spacing: 0.12em; color: #ffaa00; }
.modal-hint  { font-size: 11px; color: #777; }
.modal-hint code { color: #aaa; font-family: monospace; }

.export-ta {
  flex: 1;
  min-height: 300px;
  background: rgba(255,255,255,0.04);
  border: 1px solid #333;
  border-radius: 3px;
  color: #bbb;
  font: 12px 'Courier New', monospace;
  padding: 10px;
  resize: none;
}

.modal-btns { display: flex; gap: 8px; justify-content: flex-end; }

/* ── Load modal ─────────────────────────────────────────────── */
.load-modal {
  background: #111118;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 20px;
  width: min(720px, 92vw);
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.load-section { display: flex; flex-direction: column; gap: 8px; }
.load-section-title {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #888;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}

.load-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 6px;
}

.load-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.load-card:hover { background: rgba(255,170,0,0.1); border-color: #ffaa00; }
.load-card-num  { font-size: 9px; color: #555; }
.load-card-name { font-size: 11px; color: #ddd; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.load-card-diff { font-size: 10px; }
.star-sm     { color: #444; }
.star-sm.lit { color: #ffaa00; }

.load-list { display: flex; flex-direction: column; gap: 4px; }

.load-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px 10px;
  transition: all 0.15s;
}
.load-row:hover { border-color: #666; }

.load-row-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}
.load-row-info:hover .load-row-name { color: #ffdd88; }
.load-row-name { font-size: 11px; color: #ccc; }
.load-row-date { font-size: 9px; color: #666; }
.load-row-del {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.5;
  transition: opacity 0.15s;
}
.load-row-del:hover { opacity: 1; }
</style>
