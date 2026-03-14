<template>
  <div class="root">

    <!-- Canvas: always in DOM, hidden on menu/lobby/builder so engine can idle -->
    <canvas ref="canvasRef" class="canvas" :class="{ hidden: ['menu', 'lobby', 'coop-lobby', 'briefing', 'builder'].includes(uiState) }" @click="onCanvasClick" />

    <!-- HUD — only when actively playing with pointer lock -->
    <HUD v-if="uiState === 'playing'" />

    <!-- Lockpick minigame overlay -->
    <LockpickOverlay v-if="uiState === 'playing' && state.lockpickActive"
      @success="onLockpickDone" @cancel="onLockpickDone" />

    <!-- Co-op chat overlay (visible while playing) -->
    <CoopChat v-if="uiState === 'playing'" />

    <!-- Game end screen (ESCAPED / WASTED) -->
    <GameScreen />

    <!-- Main Menu -->
    <Transition name="fade">
      <MainMenu v-if="uiState === 'menu'" @openLobby="onOpenHeist" @openCoop="uiState = 'coop-lobby'" @openBuilder="uiState = 'builder'" />
    </Transition>

    <!-- Co-op Lobby -->
    <Transition name="fade">
      <CoopLobby v-if="uiState === 'coop-lobby'" @close="uiState = 'menu'" @startHeist="onStartCoopHeist" />
    </Transition>

    <!-- Lobby (pre-heist loadout) -->
    <Transition name="fade">
      <LobbyView v-if="uiState === 'lobby'" @close="uiState = 'menu'" @startHeist="uiState = 'briefing'" />
    </Transition>

    <!-- Mission Briefing -->
    <Transition name="fade">
      <MissionBriefing v-if="uiState === 'briefing'" @close="uiState = 'lobby'" @startHeist="onStartHeist" />
    </Transition>

    <!-- Pause Menu -->
    <Transition name="fade">
      <PauseMenu v-if="uiState === 'paused'" @resume="onResume" @quit="onQuit" @restart="onRestart" />
    </Transition>

    <!-- Level Builder -->
    <LevelBuilderView
      v-if="uiState === 'builder'"
      @close="uiState = 'menu'"
      @playCustom="onPlayCustom"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { state }            from './game/state.ts'
import HUD                  from './components/HUD.vue'
import CoopChat             from './components/CoopChat.vue'
import GameScreen           from './components/GameScreen.vue'
import MainMenu             from './components/MainMenu.vue'
import PauseMenu            from './components/PauseMenu.vue'
import LobbyView            from './components/LobbyView.vue'
import LevelBuilderView     from './components/LevelBuilderView.vue'
import CoopLobby            from './components/CoopLobby.vue'
import LockpickOverlay      from './components/LockpickOverlay.vue'
import MissionBriefing      from './components/MissionBriefing.vue'
import { createEngine }     from './game/Engine.ts'

const canvasRef = ref(null)
const uiState   = ref('menu')   // 'menu' | 'lobby' | 'coop-lobby' | 'briefing' | 'playing' | 'paused' | 'builder'
let   engine    = null

// ── Pointer-lock change ────────────────────────────────────────
const onLockChange = () => {
  const locked = document.pointerLockElement === canvasRef.value
  if (locked) {
    uiState.value = 'playing'
  } else if (uiState.value === 'playing') {
    // Don't pause when chat or lockpick is open (they exit pointer lock intentionally)
    if (!['ESCAPED', 'FAILED'].includes(state.phase) && !state.chatOpen && !state.lockpickActive) {
      uiState.value = 'paused'
    }
  }
}

// ── Re-lock after chat closes ──────────────────────────────────
watch(() => state.chatOpen, open => {
  if (!open && uiState.value === 'playing') {
    nextTick(() => canvasRef.value?.requestPointerLock())
  }
})

// ── Open lobby (mode is picked inside via ModeSelector) ──────────
function onOpenHeist() {
  uiState.value = 'lobby'
}

// ── Start Heist (from lobby) ───────────────────────────────────
async function enterFullscreen() {
  try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen() } catch {}
}

async function onStartHeist() {
  uiState.value = 'menu'   // hide lobby, make canvas visible
  await nextTick()
  await enterFullscreen()
  // Recreate engine each heist so fresh weapon/skill state is loaded
  engine?.destroy()
  engine = null
  await nextTick()
  engine = createEngine(canvasRef.value)
  canvasRef.value?.requestPointerLock()
}

// ── Start Co-op Heist (from coop lobby) ──────────────────
async function onStartCoopHeist() {
  engine?.destroy()
  engine = null
  await nextTick()
  // Go straight to 'playing' — client may lack user gesture for pointer lock
  uiState.value = 'playing'
  await nextTick()
  engine = createEngine(canvasRef.value)
  try { await enterFullscreen() } catch {}
  // Best-effort pointer lock (works for host who clicked START, may fail for client)
  canvasRef.value?.requestPointerLock()
}

// ── Canvas click — re-acquire pointer lock when playing ──
function onCanvasClick() {
  if (uiState.value === 'playing' && document.pointerLockElement !== canvasRef.value) {
    canvasRef.value?.requestPointerLock()
  }
}

// ── Play custom level from builder ────────────────────────────
async function onPlayCustom() {
  // state.builderLevel is already set by LevelBuilderView before emitting
  uiState.value = 'menu'   // hide builder, show canvas
  await nextTick()
  await enterFullscreen()
  // Destroy previous engine (if any) so fresh engine picks up builderLevel
  engine?.destroy()
  engine = null
  await nextTick()
  engine = createEngine(canvasRef.value)
  canvasRef.value?.requestPointerLock()
}

// ── Lockpick done (success or cancel) ────────────────────────
function onLockpickDone() {
  nextTick(() => canvasRef.value?.requestPointerLock())
}

// ── Resume from pause ─────────────────────────────────────────
function onResume() {
  canvasRef.value?.requestPointerLock()
}

// ── Restart heist (with countdown) ─────────────────────────────
function onRestart() {
  // Resume first so chat is visible
  canvasRef.value?.requestPointerLock()

  function sysMsg(text: string) {
    state.chatMessages.push({
      id: Date.now() + Math.random(), text,
      system: true, color: '#ffcc44', time: Date.now(),
    })
    if (state.chatMessages.length > 30) state.chatMessages.shift()
  }

  let count = 5
  sysMsg(`SYSTEM RESTARTING IN ${count}`)
  const iv = setInterval(() => {
    count--
    if (count > 0) {
      sysMsg(`${count}`)
    } else {
      clearInterval(iv)
      sysMsg('RESTARTING...')
      setTimeout(async () => {
        engine?.destroy()
        engine = null
        state.chatMessages.length = 0
        await nextTick()
        engine = createEngine(canvasRef.value)
        canvasRef.value?.requestPointerLock()
      }, 300)
    }
  }, 1000)
}

// ── Quit to menu ──────────────────────────────────────────────
function onQuit() {
  // Simplest reset: full page reload returns everything to initial state
  window.location.reload()
}

onMounted(() => {
  document.addEventListener('pointerlockchange', onLockChange)
})

onUnmounted(() => {
  engine?.destroy()
  document.removeEventListener('pointerlockchange', onLockChange)
})
</script>

<style scoped>
.root   { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.canvas { display: block; position: absolute; inset: 0; width: 100% !important; height: 100% !important; }
.canvas.hidden { visibility: hidden; pointer-events: none; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>
