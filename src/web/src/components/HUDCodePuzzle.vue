<template>
  <div class="puzzle-overlay" @keydown.esc.stop="cancel">

    <div class="puzzle-box">
      <div class="puz-title">SECURITY CODE</div>
      <div class="puz-sub">Repeat the color sequence</div>

      <!-- Sequence display (3 colored slots) -->
      <div class="seq-row">
        <div
          v-for="(col, i) in displaySeq"
          :key="i"
          class="seq-slot"
          :style="{ background: col === null ? '#222' : COL_CSS[col], boxShadow: col !== null ? `0 0 12px ${COL_CSS[col]}` : 'none' }"
        />
      </div>

      <!-- Input buttons -->
      <div class="btn-row">
        <button
          v-for="(c, idx) in COLORS"
          :key="idx"
          class="col-btn"
          :style="{ background: COL_CSS[idx], boxShadow: `0 0 8px ${COL_CSS[idx]}` }"
          :disabled="phase !== 'input'"
          @click="onInput(idx)"
        >{{ c }}</button>
      </div>

      <!-- Progress dots -->
      <div class="dots">
        <span
          v-for="i in puzzle.sequence.length"
          :key="i"
          class="dot"
          :class="{ filled: puzzle.inputSoFar.length >= i }"
        />
      </div>

      <div v-if="phase === 'wrong'" class="msg wrong">✗ WRONG — watch again</div>
      <div v-if="phase === 'playback'" class="msg info">Watch the sequence...</div>
      <div v-if="phase === 'input'" class="msg info">Your turn — repeat the sequence</div>

      <button class="cancel-btn" @click="cancel">✕ CANCEL [ESC]</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { state } from '../game/state.ts'

const COLORS  = ['RED', 'GREEN', 'BLUE']
const COL_CSS = ['#e83030', '#30e860', '#3060e8']

const emit  = defineEmits(['solved', 'cancel'])
const props = defineProps({ puzzle: { type: Object, required: true } })

// phase: 'playback' → 'input' → 'wrong' → 'playback' → ...
const phase      = ref('playback')
const displaySeq = ref([null, null, null])   // what's lit up during playback

let playbackTimer = null

function startPlayback() {
  phase.value = 'playback'
  displaySeq.value = [null, null, null]

  const seq = props.puzzle.sequence
  // If Tech T2 is active, auto-fill first color
  const autoFill = (state.skills?.tech ?? 0) >= 2

  let step = autoFill ? 1 : 0   // skip first if auto-filled
  if (autoFill && props.puzzle.inputSoFar.length === 0) {
    // Auto-input the first color without player pressing anything
    props.puzzle.inputSoFar.push(seq[0])
  }

  function showNext() {
    displaySeq.value = [null, null, null]
    if (step >= seq.length) {
      // Playback done — player's turn
      setTimeout(() => { phase.value = 'input' }, 400)
      return
    }
    setTimeout(() => {
      displaySeq.value = displaySeq.value.map((_, i) => i === step ? seq[step] : null)
      step++
      playbackTimer = setTimeout(showNext, 700)
    }, 300)
  }
  playbackTimer = setTimeout(showNext, 500)
}

function onInput(colorIdx) {
  if (phase.value !== 'input') return
  const seq    = props.puzzle.sequence
  const filled = props.puzzle.inputSoFar.length
  if (colorIdx !== seq[filled]) {
    // Wrong — show failure, restart playback
    phase.value = 'wrong'
    props.puzzle.inputSoFar.splice(0)
    playbackTimer = setTimeout(startPlayback, 1400)
    return
  }
  props.puzzle.inputSoFar.push(colorIdx)
  if (props.puzzle.inputSoFar.length >= seq.length) {
    // Solved!
    emit('solved')
  }
}

function cancel() {
  clearTimeout(playbackTimer)
  emit('cancel')
}

const onKey = e => {
  if (e.code === 'Escape') cancel()
  if (e.code === 'Digit1' || e.code === 'Numpad1') onInput(0)
  if (e.code === 'Digit2' || e.code === 'Numpad2') onInput(1)
  if (e.code === 'Digit3' || e.code === 'Numpad3') onInput(2)
}

onMounted(() => {
  document.addEventListener('keydown', onKey)
  startPlayback()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  clearTimeout(playbackTimer)
})

// Restart playback if puzzle changes (new terminal)
watch(() => props.puzzle, () => {
  clearTimeout(playbackTimer)
  props.puzzle.inputSoFar.splice(0)
  startPlayback()
})
</script>

<style scoped>
.puzzle-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  z-index: 200;
  font-family: 'Courier New', monospace;
}

.puzzle-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  background: #0d0d14;
  border: 1px solid #334;
  border-radius: 8px;
  padding: 30px 38px;
  min-width: 340px;
  box-shadow: 0 0 40px rgba(30, 60, 200, 0.25);
}

.puz-title {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: #aaddff;
}
.puz-sub {
  font-size: 11px;
  opacity: 0.5;
  letter-spacing: 0.12em;
}

/* ── Sequence display ── */
.seq-row {
  display: flex;
  gap: 14px;
}
.seq-slot {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 2px solid #334;
  transition: background 0.15s, box-shadow 0.15s;
}

/* ── Input buttons ── */
.btn-row {
  display: flex;
  gap: 12px;
}
.col-btn {
  width: 90px;
  height: 48px;
  border: none;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  text-shadow: 0 1px 3px #0006;
}
.col-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-2px); }
.col-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Progress dots ── */
.dots {
  display: flex;
  gap: 8px;
}
.dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #333;
  transition: background 0.2s;
}
.dot.filled { background: #88aaff; box-shadow: 0 0 6px #88aaff; }

/* ── Messages ── */
.msg {
  font-size: 11px;
  letter-spacing: 0.1em;
  height: 16px;
}
.msg.wrong { color: #ff6666; }
.msg.info  { color: #88aacc; opacity: 0.7; }

.cancel-btn {
  background: transparent;
  border: 1px solid #444;
  border-radius: 4px;
  color: #666;
  font: 10px 'Courier New', monospace;
  padding: 4px 14px;
  cursor: pointer;
  letter-spacing: 0.1em;
  transition: color 0.15s, border-color 0.15s;
}
.cancel-btn:hover { color: #aaa; border-color: #888; }
</style>
