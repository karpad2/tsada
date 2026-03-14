<template>
  <div class="lp-overlay" @mousemove="onMouse" @mousedown="onDown" @mouseup="onUp">
    <canvas ref="cv" :width="SIZE" :height="SIZE" class="lp-canvas" />
    <div class="lp-picks">
      <span v-for="i in totalPicks" :key="i" :class="{ broken: i > picks }">&#x1f4cd;</span>
    </div>
    <div class="lp-hint">Move mouse to position pick &mdash; Click &amp; hold to turn</div>
    <div class="lp-esc">[ESC] Cancel</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { state } from '../game/state.ts'

const emit = defineEmits<{ success: []; cancel: [] }>()

const SIZE = 500
const R    = 190    // lock radius
const CX   = SIZE / 2
const CY   = SIZE / 2

const cv = ref<HTMLCanvasElement | null>(null)

// ── Game state ───────────────────────────────────────────────
const totalPicks = 5
const picks      = ref(totalPicks)
const sweetSpot  = ref((Math.random() - 0.5) * Math.PI * 0.8)   // random angle, ~±72°
const tolerance  = 0.13   // radians (~7.5°) for full turn

let pickAngle  = 0       // controlled by mouse
let turning    = false   // mouse held
let turnAngle  = 0       // current wrench rotation (0..PI/2)
let maxTurn    = 0       // max allowed rotation at current pick angle
let shakeT     = 0       // shake/force timer (break pick after ~2s)
let shakeOff   = 0       // visual shake offset
let broken     = false   // current pick breaking animation
let brokenT    = 0
let done       = false
let raf        = 0

// ── Input ────────────────────────────────────────────────────
function onMouse(e: MouseEvent) {
  if (done || broken) return
  const rect = cv.value?.getBoundingClientRect()
  if (!rect) return
  const mx = e.clientX - rect.left - CX
  pickAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2,
    (mx / (SIZE * 0.38)) * (Math.PI / 2)))
}

function onDown() { if (!done && !broken) turning = true }
function onUp()   { turning = false }

function onKey(e: KeyboardEvent) {
  if (e.code === 'Escape') {
    done = true
    state.lockpickResult = 'cancel'
    state.lockpickActive = false
    emit('cancel')
  }
}

// ── Compute maxTurn based on pick proximity to sweet spot ────
function computeMaxTurn(): number {
  const diff = Math.abs(pickAngle - sweetSpot.value)
  if (diff <= tolerance) return 1.0
  if (diff < tolerance * 5) return 1.0 - (diff - tolerance) / (tolerance * 4)
  return 0.04
}

// ── Render loop ──────────────────────────────────────────────
let lastT = 0
function frame(t: number) {
  if (done) return
  const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0.016
  lastT = t

  const ctx = cv.value?.getContext('2d')
  if (!ctx) { raf = requestAnimationFrame(frame); return }

  // ── Update logic ───────────────────────────────────
  maxTurn = computeMaxTurn()
  const maxAngle = maxTurn * (Math.PI / 2)

  if (broken) {
    brokenT += dt
    if (brokenT > 0.6) {
      broken = false; brokenT = 0; shakeT = 0; shakeOff = 0; turnAngle = 0
      if (picks.value <= 0) {
        done = true
        state.lockpickResult = 'cancel'
        state.lockpickActive = false
        emit('cancel')
        return
      }
    }
  } else if (turning) {
    if (turnAngle < maxAngle) {
      // Turn smoothly toward max
      turnAngle = Math.min(maxAngle, turnAngle + dt * 2.5)
      shakeT = 0; shakeOff = 0
    } else {
      // At limit — check if fully unlocked
      if (maxTurn >= 0.98 && turnAngle >= Math.PI / 2 - 0.02) {
        // SUCCESS
        done = true
        state.lockpickResult = 'success'
        state.lockpickActive = false
        emit('success')
        return
      }
      // Forcing — shake & eventual break
      shakeT += dt
      shakeOff = (Math.sin(shakeT * 45) * 3) * Math.min(1, shakeT / 0.5)
      if (shakeT > 1.8) {
        // Break pick
        picks.value--
        broken = true; brokenT = 0
        turning = false
      }
    }
  } else {
    // Spring back
    turnAngle = Math.max(0, turnAngle - dt * 4.5)
    shakeT = Math.max(0, shakeT - dt * 3)
    shakeOff *= 0.85
  }

  // ── Draw ───────────────────────────────────────────
  ctx.clearRect(0, 0, SIZE, SIZE)

  // Dark vignette background
  const grad = ctx.createRadialGradient(CX, CY, R * 0.3, CX, CY, R * 1.6)
  grad.addColorStop(0, 'rgba(0,0,0,0.75)')
  grad.addColorStop(1, 'rgba(0,0,0,0.95)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.save()
  ctx.translate(CX + shakeOff, CY)
  ctx.rotate(Math.PI-(Math.PI/2))   // rotate lock 180°

  // Lock body (outer ring)
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fillStyle = '#3a3a3e'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#555'
  ctx.stroke()

  // Inner circle
  ctx.beginPath()
  ctx.arc(0, 0, R - 18, 0, Math.PI * 2)
  ctx.fillStyle = '#2a2a2e'
  ctx.fill()

  // Scratches (decorative)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(0, 0, R - 30 - i * 3, a, a + 0.5)
    ctx.stroke()
  }

  // Keyhole
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(-4, -14, 8, 28)
  ctx.beginPath()
  ctx.arc(0, -10, 8, 0, Math.PI * 2)
  ctx.fill()

  // ── Wrench (bottom, rotates with turnAngle) ───────
  ctx.save()
  ctx.rotate(turnAngle)
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 8)
  ctx.lineTo(0, R - 10)
  ctx.stroke()
  // Wrench handle
  ctx.fillStyle = '#555'
  ctx.fillRect(-8, R - 40, 16, 34)
  ctx.fillStyle = '#444'
  ctx.fillRect(-6, R - 34, 12, 6)
  ctx.fillRect(-6, R - 22, 12, 6)
  ctx.restore()

  // ── Lockpick (top, user-controlled angle) ─────────
  const pickCanvas = -Math.PI / 2 + pickAngle + turnAngle
  const pickLen = R - 12

  if (broken) {
    // Draw broken pick (two halves)
    const halfLen = pickLen * 0.4
    ctx.save()
    ctx.rotate(pickCanvas)
    // Base half
    ctx.strokeStyle = '#b8b8b8'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(0, -(halfLen))
    ctx.stroke()
    // Tip half (falling)
    ctx.save()
    ctx.translate(0, -(halfLen + 10))
    ctx.rotate(brokenT * 3)
    ctx.globalAlpha = 1 - brokenT * 1.5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -(pickLen - halfLen - 10))
    ctx.stroke()
    ctx.restore()
    ctx.restore()
  } else {
    ctx.save()
    ctx.rotate(pickCanvas)
    // Pick shaft
    ctx.strokeStyle = '#c8c8c8'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(0, -pickLen)
    ctx.stroke()
    // Pick tip (bent end)
    ctx.strokeStyle = '#dda844'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -pickLen)
    ctx.lineTo(4, -pickLen - 8)
    ctx.stroke()
    // Pick handle (outer end)
    ctx.fillStyle = '#999'
    ctx.fillRect(-3, -pickLen + 2, 6, -14)
    ctx.restore()
  }

  ctx.restore()  // undo translate

  raf = requestAnimationFrame(frame)
}

// ── Lifecycle ────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', onKey)
  raf = requestAnimationFrame(frame)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  cancelAnimationFrame(raf)
})
</script>

<style scoped>
.lp-overlay {
  position: fixed; inset: 0;
  z-index: 200;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6);
  cursor: none;
  user-select: none;
}
.lp-canvas {
  image-rendering: auto;
  cursor: none;
}
.lp-picks {
  margin-top: 14px;
  font-size: 22px;
  letter-spacing: 4px;
}
.lp-picks span       { filter: grayscale(0); transition: filter 0.3s; }
.lp-picks span.broken { filter: grayscale(1) brightness(0.3); }
.lp-hint {
  margin-top: 10px;
  font: 13px/1 'Courier New', monospace;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.lp-esc {
  margin-top: 6px;
  font: 12px/1 'Courier New', monospace;
  color: rgba(255,255,255,0.3);
}
</style>
