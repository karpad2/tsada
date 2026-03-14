<template>
  <div ref="container" class="preview-container">
    <canvas ref="canvas" class="preview-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { WeaponView } from '../../game/WeaponView.ts'

const props = defineProps<{
  weaponId: string
  attachments: Record<string, string | null>
}>()

const container = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()

let renderer: THREE.WebGLRenderer | null = null
let wv: WeaponView | null = null
let animId = 0
let orbitAngle = 0
let orbitAngleTarget = 0
let orbitPitch = 0.3
let orbitPitchTarget = 0.3
let orbitDist = 0.65
let orbitDistTarget = 0.65
let dragging = false
let autoRotate = true
let lastTime = 0

function init() {
  if (!canvas.value || !container.value) return
  const rect = container.value.getBoundingClientRect()

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(rect.width, rect.height)
  renderer.setClearColor(0x000000, 0)

  wv = new WeaponView(rect.width / rect.height)
  // Override camera for preview (wider FOV, further back)
  wv._camera.fov = 40
  wv._camera.near = 0.01
  wv._camera.far = 10
  wv._camera.updateProjectionMatrix()

  buildWeapon()
  lastTime = performance.now()
  animate()
}

function buildWeapon() {
  if (!wv) return
  wv.setWeapon(props.weaponId, props.attachments)
  // Override group position to center for turntable
  if (wv._group) {
    wv._group.position.set(0, 0, 0)
    // Slight upward offset so the weapon sits nicely in view
    wv._group.position.y = 0.02
  }
}

function updateCamera() {
  if (!wv) return
  // Smooth orbit
  orbitAngle += (orbitAngleTarget - orbitAngle) * 0.1
  orbitPitch += (orbitPitchTarget - orbitPitch) * 0.1
  orbitDist += (orbitDistTarget - orbitDist) * 0.1

  const cp = Math.cos(orbitPitch)
  wv._camera.position.set(
    Math.sin(orbitAngle) * cp * orbitDist,
    Math.sin(orbitPitch) * orbitDist + 0.02,
    Math.cos(orbitAngle) * cp * orbitDist,
  )
  wv._camera.lookAt(0, 0.02, 0)
}

function animate() {
  animId = requestAnimationFrame(animate)
  if (!renderer || !wv) return

  const now = performance.now()
  const delta = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now

  if (autoRotate && !dragging) {
    orbitAngleTarget += delta * 0.25
  }

  updateCamera()
  renderer.render(wv._scene, wv._camera)
}

function onResize() {
  if (!container.value || !renderer || !wv) return
  const rect = container.value.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return
  renderer.setSize(rect.width, rect.height)
  wv._camera.aspect = rect.width / rect.height
  wv._camera.updateProjectionMatrix()
}

// Mouse/touch orbit controls
function onPointerDown(e: PointerEvent) {
  dragging = true
  autoRotate = false
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  orbitAngleTarget -= e.movementX * 0.008
  orbitPitchTarget = Math.max(-0.6, Math.min(1.2, orbitPitchTarget + e.movementY * 0.006))
}
function onPointerUp() {
  dragging = false
  // Resume auto-rotate after 3 seconds of no input
  setTimeout(() => { if (!dragging) autoRotate = true }, 3000)
}
function onWheel(e: WheelEvent) {
  e.preventDefault()
  orbitDistTarget = Math.max(0.3, Math.min(1.5, orbitDistTarget + e.deltaY * 0.001))
}

let resizeObs: ResizeObserver | null = null

onMounted(() => {
  init()
  if (container.value) {
    resizeObs = new ResizeObserver(onResize)
    resizeObs.observe(container.value)
    canvas.value?.addEventListener('pointerdown', onPointerDown)
    canvas.value?.addEventListener('pointermove', onPointerMove)
    canvas.value?.addEventListener('pointerup', onPointerUp)
    canvas.value?.addEventListener('wheel', onWheel, { passive: false })
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  resizeObs?.disconnect()
  canvas.value?.removeEventListener('pointerdown', onPointerDown)
  canvas.value?.removeEventListener('pointermove', onPointerMove)
  canvas.value?.removeEventListener('pointerup', onPointerUp)
  canvas.value?.removeEventListener('wheel', onWheel)
  wv?.dispose()
  renderer?.dispose()
})

watch(() => [props.weaponId, props.attachments], () => {
  buildWeapon()
}, { deep: true })
</script>

<style scoped>
.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.preview-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}
.preview-canvas:active {
  cursor: grabbing;
}
</style>
