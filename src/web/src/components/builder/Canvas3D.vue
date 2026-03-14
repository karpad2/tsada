<template>
  <div class="c3d-root">
    <canvas ref="canvas" class="c3d-canvas" @click="onClick" @mousemove="onMove" />

    <!-- Controls hint -->
    <div class="c3d-hint">
      RMB/Alt+drag=pan · Scroll=zoom · Middle=orbit · G=rotate · Del=remove
    </div>

    <!-- Refresh button -->
    <button class="c3d-refresh" @click="rebuild">↺ Refresh Scene</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { buildFromData } from '../../game/levels/LevelBuilder.ts'

const props = defineProps({
  levelOutput:  { type: Object, required: true },  // toOutputFormat(levelData)
  selectedProp: { type: String, default: null },   // prop type to place, or null
})
const emit = defineEmits(['placeProp', 'removeProp'])

const canvas = ref(null)
let renderer, scene, camera, raycaster
let floorPlane, selectedMesh = null
let animId

// ── Setup ────────────────────────────────────────────────────
function init() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a24)
  scene.fog = new THREE.Fog(0x1a1a24, 30, 80)

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
  camera.position.set(0, 30, 20)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.7))
  const sun = new THREE.DirectionalLight(0xfffaea, 1.2)
  sun.position.set(10, 25, 10); sun.castShadow = true
  scene.add(sun)

  raycaster = new THREE.Raycaster()
  floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

  resize()
  rebuild()
  _setupOrbitControls()
  _loop()
}

// ── Orbit controls (simple, no library needed) ────────────────
let _isOrbit = false, _lastMouse = null, _camTheta = 0.4, _camPhi = Math.PI / 4, _camDist = 35
function _setupOrbitControls() {
  const c = canvas.value
  c.addEventListener('mousedown', e => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      _isOrbit = true; _lastMouse = { x: e.clientX, y: e.clientY }; e.preventDefault()
    }
  })
  c.addEventListener('contextmenu', e => e.preventDefault())
  c.addEventListener('mousedown', e => {
    if (e.button === 2) {
      _isOrbit = true; _lastMouse = { x: e.clientX, y: e.clientY }; e.preventDefault()
    }
  })
  window.addEventListener('mousemove', e => {
    if (!_isOrbit || !_lastMouse) return
    const dx = e.clientX - _lastMouse.x, dy = e.clientY - _lastMouse.y
    _lastMouse = { x: e.clientX, y: e.clientY }
    _camTheta -= dx * 0.005
    _camPhi   = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, _camPhi + dy * 0.005))
    _updateCam()
  })
  window.addEventListener('mouseup', () => { _isOrbit = false; _lastMouse = null })
  c.addEventListener('wheel', e => {
    e.preventDefault()
    _camDist = Math.max(5, Math.min(80, _camDist + e.deltaY * 0.05))
    _updateCam()
  }, { passive: false })
}
function _updateCam() {
  camera.position.set(
    Math.sin(_camTheta) * Math.cos(_camPhi) * _camDist,
    Math.sin(_camPhi) * _camDist,
    Math.cos(_camTheta) * Math.cos(_camPhi) * _camDist,
  )
  camera.lookAt(0, 0, 0)
}

// ── Scene build ───────────────────────────────────────────────
const _placedMeshes = []
function rebuild() {
  // Clear scene (keep lights)
  while (scene.children.length > 0) scene.remove(scene.children[0])
  scene.add(new THREE.AmbientLight(0xffffff, 0.7))
  const sun = new THREE.DirectionalLight(0xfffaea, 1.2)
  sun.position.set(10, 25, 10); sun.castShadow = true
  scene.add(sun)
  _placedMeshes.length = 0
  selectedMesh = null

  if (!props.levelOutput) return
  try {
    buildFromData(scene, props.levelOutput)
  } catch (e) {
    console.warn('[Canvas3D] buildFromData error:', e)
  }
}

// ── Raycasting for prop placement ─────────────────────────────
function _rayFloor(e) {
  const rect = canvas.value.getBoundingClientRect()
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(ndc, camera)
  const hit = new THREE.Vector3()
  raycaster.ray.intersectPlane(floorPlane, hit)
  return hit
}

function onClick(e) {
  if (e.button !== 0) return
  if (_isOrbit) return

  const pt = _rayFloor(e)
  if (!pt) return

  const snap = 0.5
  const wx = Math.round(pt.x / snap) * snap
  const wz = Math.round(pt.z / snap) * snap

  if (props.selectedProp) {
    emit('placeProp', { type: props.selectedProp, x: +wx.toFixed(1), z: +wz.toFixed(1) })
    // Rebuild to show new prop
    setTimeout(rebuild, 50)
  } else {
    // Try to select existing mesh
    const rect = canvas.value.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top)  / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects(scene.children, true)
    if (hits.length > 0) {
      selectedMesh = hits[0].object
    } else {
      selectedMesh = null
    }
  }
}

function onMove(e) {
  if (!props.selectedProp) return
  // Ghost preview: could show a placeholder mesh at cursor pos
  // For simplicity, skip ghost preview (too much complexity)
}

// ── Resize ────────────────────────────────────────────────────
function resize() {
  if (!canvas.value || !renderer) return
  const w = canvas.value.parentElement.clientWidth
  const h = canvas.value.parentElement.clientHeight
  canvas.value.width  = w; canvas.value.height = h
  renderer.setSize(w, h)
  camera.aspect = w / h; camera.updateProjectionMatrix()
}

// ── Render loop ───────────────────────────────────────────────
function _loop() {
  animId = requestAnimationFrame(_loop)
  renderer.render(scene, camera)
}

onMounted(() => { init(); window.addEventListener('resize', resize) })
onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  renderer?.dispose()
})

watch(() => props.levelOutput, rebuild, { deep: true })
</script>

<style scoped>
.c3d-root   { position: relative; width: 100%; height: 100%; overflow: hidden; }
.c3d-canvas { display: block; width: 100%; height: 100%; }
.c3d-hint   {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  font: 10px monospace; color: rgba(255,255,255,0.3); pointer-events: none; white-space: nowrap;
}
.c3d-refresh {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.6); border: 1px solid #555; color: #ccc;
  font: 12px monospace; padding: 5px 10px; border-radius: 4px; cursor: pointer;
}
.c3d-refresh:hover { background: rgba(255,255,255,0.1); }
</style>
