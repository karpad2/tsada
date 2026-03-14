<template>
  <div class="ae-root">
    <canvas ref="canvas" class="ae-canvas" />

    <!-- Viewport toolbar (Blender-style top-left) -->
    <div class="ae-toolbar">
      <button class="ae-tb" :class="{ active: viewMode === 'solid' }" @click="viewMode = 'solid'" title="Solid">◼</button>
      <button class="ae-tb" :class="{ active: viewMode === 'wireframe' }" @click="viewMode = 'wireframe'" title="Wireframe">◻</button>
      <button class="ae-tb" :class="{ active: viewMode === 'xray' }" @click="viewMode = 'xray'" title="X-Ray">◇</button>
      <span class="ae-sep">|</span>
      <button class="ae-tb" :class="{ active: snapGrid }" @click="snapGrid = !snapGrid" title="Snap to Grid (0.05)">⊞</button>
      <span class="ae-sep">|</span>
      <button class="ae-tb" @click="resetCam" title="Reset Camera">⟳</button>
      <button class="ae-tb" @click="viewFront" title="Front View">F</button>
      <button class="ae-tb" @click="viewTop" title="Top View">T</button>
      <button class="ae-tb" @click="viewSide" title="Side View">S</button>
    </div>

    <!-- Shape outliner (Blender-style bottom-left) -->
    <div v-if="(asset.shapes || []).length" class="ae-outliner">
      <div class="ae-outliner-title">SHAPES</div>
      <div
        v-for="(s, i) in asset.shapes"
        :key="i"
        class="ae-outliner-item"
        :class="{ active: selectedShapeIdx === i }"
        @click="$emit('select', i)"
      >
        <span class="ae-outliner-icon">{{ s.kind === 'box' ? '▬' : s.kind === 'cyl' ? '●' : '◈' }}</span>
        <span class="ae-outliner-label">{{ s.kind === 'boxE' ? 'Emissive' : s.kind === 'cyl' ? 'Cylinder' : 'Box' }} {{ i }}</span>
      </div>
    </div>

    <div class="ae-hint">RMB=orbit · Scroll=zoom · LMB=select · MMB=pan</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive } from 'vue'
import * as THREE from 'three'
import { _boxFromShape, _cylFromShape, _boxE } from '../../game/levels/assets/_utils.ts'

const props = defineProps({
  asset:            { type: Object, required: true },
  selectedShapeIdx: { type: Number, default: null },
})
const emit = defineEmits(['select'])

const canvas = ref(null)
let renderer, scene, camera, raycaster
let animId
let propGroup

// ── View state ─────────────────────────────────────────────
const viewMode = ref('solid')   // solid | wireframe | xray
const snapGrid = ref(false)

// ── Orbit state ────────────────────────────────────────────
let _isOrbit = false, _isPan = false, _lastMouse = null
let _camTheta = 0.6, _camPhi = Math.PI / 5, _camDist = 6
let _camTarget = new THREE.Vector3(0, 0.4, 0)

// ── Setup ──────────────────────────────────────────────────
function init() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a24)

  camera = new THREE.PerspectiveCamera(50, 1, 0.05, 100)
  _updateCam()

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.65))
  const sun = new THREE.DirectionalLight(0xfffaea, 1.1)
  sun.position.set(4, 8, 3)
  sun.castShadow = true
  scene.add(sun)

  // Ground grid
  const grid = new THREE.GridHelper(10, 40, 0x333344, 0x222233)
  scene.add(grid)

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshLambertMaterial({ color: 0x22222a })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.005
  floor.receiveShadow = true
  floor.userData._isFloor = true
  scene.add(floor)

  // Origin axes
  const axLen = 0.4
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0.01,0), new THREE.Vector3(axLen,0.01,0)]),
    new THREE.LineBasicMaterial({ color: 0xff4444 })
  ))
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0.01,0), new THREE.Vector3(0,0.01,axLen)]),
    new THREE.LineBasicMaterial({ color: 0x4444ff })
  ))
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,axLen,0)]),
    new THREE.LineBasicMaterial({ color: 0x44ff44 })
  ))

  raycaster = new THREE.Raycaster()
  propGroup = new THREE.Group()
  scene.add(propGroup)

  _setupControls()
  resize()
  rebuildShapes()
  _loop()
}

// ── Controls ───────────────────────────────────────────────
function _setupControls() {
  const c = canvas.value
  c.addEventListener('contextmenu', e => e.preventDefault())

  c.addEventListener('mousedown', e => {
    if (e.button === 2 || (e.button === 0 && e.altKey)) {
      // RMB or Alt+LMB = orbit
      _isOrbit = true
      _lastMouse = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    } else if (e.button === 1) {
      // MMB = pan
      _isPan = true
      _lastMouse = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }
  })

  window.addEventListener('mousemove', e => {
    if (!_lastMouse) return
    const dx = e.clientX - _lastMouse.x, dy = e.clientY - _lastMouse.y
    _lastMouse = { x: e.clientX, y: e.clientY }

    if (_isOrbit) {
      _camTheta -= dx * 0.006
      _camPhi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, _camPhi + dy * 0.006))
      _updateCam()
    } else if (_isPan) {
      // Pan in camera-relative horizontal plane
      const panSpeed = _camDist * 0.002
      const right = new THREE.Vector3()
      camera.getWorldDirection(right)
      right.cross(camera.up).normalize()
      const up = new THREE.Vector3(0, 1, 0)
      _camTarget.addScaledVector(right, -dx * panSpeed)
      _camTarget.addScaledVector(up, dy * panSpeed)
      _updateCam()
    }
  })
  window.addEventListener('mouseup', () => { _isOrbit = false; _isPan = false; _lastMouse = null })

  c.addEventListener('wheel', e => {
    e.preventDefault()
    _camDist = Math.max(1, Math.min(30, _camDist + e.deltaY * 0.006))
    _updateCam()
  }, { passive: false })

  // Click to select
  c.addEventListener('click', e => {
    if (e.button !== 0 || e.altKey) return
    const rect = c.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects(propGroup.children, false)
    if (hits.length > 0) {
      emit('select', hits[0].object.userData.shapeIdx ?? null)
    } else {
      emit('select', null)
    }
  })
}

function _updateCam() {
  if (!camera) return
  camera.position.set(
    _camTarget.x + Math.sin(_camTheta) * Math.cos(_camPhi) * _camDist,
    _camTarget.y + Math.sin(_camPhi) * _camDist,
    _camTarget.z + Math.cos(_camTheta) * Math.cos(_camPhi) * _camDist,
  )
  camera.lookAt(_camTarget)
}

// Preset views
function resetCam() { _camTheta = 0.6; _camPhi = Math.PI/5; _camDist = 6; _camTarget.set(0,0.4,0); _updateCam() }
function viewFront() { _camTheta = 0; _camPhi = 0.15; _camDist = 5; _camTarget.set(0,0.5,0); _updateCam() }
function viewTop()   { _camTheta = 0; _camPhi = Math.PI/2 - 0.01; _camDist = 5; _camTarget.set(0,0,0); _updateCam() }
function viewSide()  { _camTheta = Math.PI/2; _camPhi = 0.15; _camDist = 5; _camTarget.set(0,0.5,0); _updateCam() }

// ── Shape rebuild ──────────────────────────────────────────
let _wireframeHelper = null

function rebuildShapes() {
  while (propGroup.children.length > 0) propGroup.remove(propGroup.children[0])
  if (_wireframeHelper) { scene.remove(_wireframeHelper); _wireframeHelper = null }

  if (!props.asset?.shapes) return

  for (let i = 0; i < props.asset.shapes.length; i++) {
    const s = props.asset.shapes[i]
    let mesh
    if (s.kind === 'box') {
      mesh = _boxFromShape(propGroup, s)
    } else if (s.kind === 'cyl') {
      mesh = _cylFromShape(propGroup, s)
    } else if (s.kind === 'boxE') {
      mesh = _boxE(propGroup, s.w, s.h, s.d, s.color, s.emissive, s.ei, s.lx, s.ly, s.lz)
    }
    if (mesh) {
      // Apply per-shape rotation
      if (s.rotX) mesh.rotation.x = s.rotX
      if (s.rotY) mesh.rotation.y = s.rotY
      if (s.rotZ) mesh.rotation.z = s.rotZ
      mesh.userData.shapeIdx = i
    }
  }

  _applyViewMode()
  _updateSelection()
}

function _applyViewMode() {
  propGroup.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return
    const mat = child.material
    if (viewMode.value === 'wireframe') {
      mat.wireframe = true
      mat.transparent = false
      mat.opacity = 1
    } else if (viewMode.value === 'xray') {
      mat.wireframe = false
      mat.transparent = true
      mat.opacity = 0.4
    } else {
      mat.wireframe = false
      // Restore original opacity from shape data
      const s = props.asset?.shapes?.[child.userData.shapeIdx]
      if (s?.opacity != null && s.opacity < 1) {
        mat.transparent = true
        mat.opacity = s.opacity
      } else {
        mat.transparent = false
        mat.opacity = 1
      }
    }
  })
}

function _updateSelection() {
  if (_wireframeHelper) { scene.remove(_wireframeHelper); _wireframeHelper = null }
  if (props.selectedShapeIdx == null || !propGroup.children[props.selectedShapeIdx]) return

  const target = propGroup.children[props.selectedShapeIdx]
  _wireframeHelper = new THREE.BoxHelper(target, 0xffaa00)
  scene.add(_wireframeHelper)
}

// ── Resize / render loop ───────────────────────────────────
function resize() {
  if (!canvas.value || !renderer) return
  const w = canvas.value.parentElement.clientWidth
  const h = canvas.value.parentElement.clientHeight
  canvas.value.width = w; canvas.value.height = h
  renderer.setSize(w, h)
  camera.aspect = w / h; camera.updateProjectionMatrix()
}

function _loop() {
  animId = requestAnimationFrame(_loop)
  if (_wireframeHelper) _wireframeHelper.update()
  renderer.render(scene, camera)
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(() => { init(); window.addEventListener('resize', resize) })
onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  renderer?.dispose()
})

watch(() => props.asset?.shapes, rebuildShapes, { deep: true })
watch(() => props.selectedShapeIdx, _updateSelection)
watch(viewMode, () => { if (propGroup) _applyViewMode() })

defineExpose({ rebuild: rebuildShapes, snapGrid })
</script>

<style scoped>
.ae-root   { position: relative; width: 100%; height: 100%; overflow: hidden; }
.ae-canvas { display: block; width: 100%; height: 100%; }
.ae-hint   {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  font: 10px monospace; color: rgba(255,255,255,0.3); pointer-events: none; white-space: nowrap;
}

/* Viewport toolbar */
.ae-toolbar {
  position: absolute; top: 8px; left: 8px;
  display: flex; gap: 2px; align-items: center;
  background: rgba(10,10,14,0.85); border: 1px solid #333; border-radius: 4px;
  padding: 3px 5px;
}
.ae-tb {
  width: 26px; height: 22px; background: none; border: 1px solid transparent;
  border-radius: 3px; color: #888; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.ae-tb:hover { color: #ddd; border-color: #555; }
.ae-tb.active { color: #ffdd88; border-color: #ffaa00; background: rgba(255,170,0,0.15); }
.ae-sep { color: #333; font-size: 12px; margin: 0 2px; }

/* Outliner */
.ae-outliner {
  position: absolute; bottom: 30px; left: 8px;
  background: rgba(10,10,14,0.85); border: 1px solid #333; border-radius: 4px;
  padding: 4px; max-height: 200px; overflow-y: auto; min-width: 120px;
}
.ae-outliner-title { font: 9px monospace; color: #555; letter-spacing: 0.1em; padding: 2px 4px; }
.ae-outliner-item {
  display: flex; align-items: center; gap: 5px; padding: 2px 6px;
  font: 10px monospace; color: #999; cursor: pointer; border-radius: 2px;
}
.ae-outliner-item:hover { background: rgba(255,255,255,0.05); color: #ddd; }
.ae-outliner-item.active { background: rgba(255,170,0,0.15); color: #ffdd88; }
.ae-outliner-icon { font-size: 12px; }
.ae-outliner-label { white-space: nowrap; }
</style>
