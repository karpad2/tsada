<template>
  <div class="pause-root">
    <div class="panel">
      <div class="title">PAUSED</div>

      <button class="btn btn-resume" @click="$emit('resume')">▶  Resume</button>

      <div class="setting-row">
        <label class="setting-lbl">SENSITIVITY</label>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.05"
          :value="state.mouseSensitivity"
          @input="e => state.mouseSensitivity = +e.target.value"
          class="slider"
        />
        <span class="setting-val">{{ state.mouseSensitivity.toFixed(2) }}</span>
      </div>

      <div class="setting-row">
        <label class="setting-lbl">MUSIC VOL</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="state.musicVolume"
          @input="e => state.musicVolume = +e.target.value"
          class="slider"
        />
        <span class="setting-val">{{ Math.round(state.musicVolume * 100) }}</span>
      </div>

      <!-- Co-op player list -->
      <div v-if="isCoop" class="coop-players">
        <div class="cp-label">PLAYERS</div>
        <div
          v-for="p in net.players"
          :key="p.peerId"
          class="cp-slot"
          :class="{ me: p.index === net.playerIndex }"
        >
          <span class="cp-dot" :style="{ background: '#' + COLORS[p.index].toString(16).padStart(6, '0') }" />
          <span class="cp-name">{{ p.index === net.playerIndex ? 'YOU' : `PLAYER ${p.index + 1}` }}</span>
          <template v-if="net.isHost && p.index !== 0">
            <button class="cp-kick" @click="doKick(p.peerId)">KICK</button>
            <button class="cp-ban"  @click="doBan(p.peerId)">BAN</button>
          </template>
        </div>
      </div>

      <button class="btn btn-restart" @click="$emit('restart')">↻  Restart Heist</button>
      <button class="btn btn-quit" @click="$emit('quit')">✕  Quit to Menu</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { state } from '../game/state.ts'
import { NetworkManager, PLAYER_COLORS } from '../game/NetworkManager.ts'
defineEmits(['resume', 'quit', 'restart'])

const COLORS = PLAYER_COLORS
const net = reactive(NetworkManager)
const isCoop = computed(() => NetworkManager.enabled)

function doKick(peerId) { NetworkManager.kick(peerId) }
function doBan(peerId)  { NetworkManager.ban(peerId) }
</script>

<style scoped>
* { box-sizing: border-box; }

.pause-root {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  z-index: 90;
  font-family: 'Courier New', monospace;
  color: #eee;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  background: rgba(10, 10, 18, 0.92);
  border: 1px solid rgba(255, 170, 0, 0.18);
  border-radius: 8px;
  padding: 40px 52px;
  min-width: 320px;
}

.title {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.3em;
  color: #ffaa00;
  text-shadow: 0 0 20px rgba(255,160,0,0.5);
}

/* ── Buttons ── */
.btn {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  letter-spacing: 0.15em;
  border: none;
  border-radius: 4px;
  padding: 11px 36px;
  width: 100%;
  cursor: pointer;
  transition: background 0.14s, transform 0.08s;
}
.btn:active { transform: scale(0.97); }

.btn-resume {
  background: #ffaa00;
  color: #0a0a0e;
  font-weight: 900;
}
.btn-resume:hover { background: #ffcc22; }

.btn-restart {
  background: rgba(40, 120, 180, 0.75);
  color: #ccddff;
}
.btn-restart:hover { background: rgba(50, 150, 220, 0.9); }

.btn-quit {
  background: rgba(180, 30, 30, 0.75);
  color: #ffcccc;
}
.btn-quit:hover { background: rgba(220, 40, 40, 0.9); }

/* ── Sensitivity slider ── */
.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.setting-lbl {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  opacity: 0.6;
  white-space: nowrap;
  min-width: 96px;
}
.slider {
  flex: 1;
  accent-color: #ffaa00;
  cursor: pointer;
}
.setting-val {
  font-size: 0.85rem;
  min-width: 36px;
  text-align: right;
  color: #ffcc66;
}

/* ── Co-op player list ── */
.coop-players {
  width: 100%;
  display: flex; flex-direction: column; gap: 6px;
  border: 1px solid #2a2a2a; border-radius: 6px;
  background: rgba(0,0,0,0.3); padding: 10px;
}
.cp-label {
  font-size: 0.68rem; letter-spacing: 0.15em; color: #666;
  margin-bottom: 2px;
}
.cp-slot {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 10px; border: 1px solid #2a2a2a; border-radius: 4px;
  background: rgba(255,255,255,0.03);
}
.cp-slot.me { border-color: #4488ff44; }
.cp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cp-name { flex: 1; font-size: 0.78rem; letter-spacing: 0.1em; }
.cp-kick, .cp-ban {
  background: none; border: 1px solid #555; border-radius: 3px;
  padding: 2px 8px; font-family: monospace; font-size: 10px;
  letter-spacing: 0.06em; cursor: pointer; transition: all .15s;
}
.cp-kick { color: #ffaa44; border-color: #664400; }
.cp-kick:hover { background: rgba(255,170,68,0.15); border-color: #ffaa44; }
.cp-ban  { color: #ff4444; border-color: #660000; }
.cp-ban:hover  { background: rgba(255,68,68,0.15); border-color: #ff4444; }
</style>
