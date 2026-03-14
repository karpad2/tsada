<template>
  <div class="chat-wrap" v-if="net.enabled || visibleMessages.length > 0">

    <!-- Message log -->
    <div class="chat-log">
      <TransitionGroup name="msg">
        <div
          v-for="m in visibleMessages"
          :key="m.id"
          class="chat-msg"
          :class="{ fading: !state.chatOpen && msgAge(m) > 5000, 'system-msg': m.system }"
        >
          <template v-if="m.system">
            <span class="chat-who sys-tag">SYSTEM</span>
            <span class="chat-text" :style="{ color: m.color || '#ffcc44' }">{{ m.text }}</span>
          </template>
          <template v-else>
            <span class="chat-who" :style="{ color: CSS_COLORS[m.playerIndex] ?? '#fff' }">P{{ m.playerIndex + 1 }}</span>
            <span class="chat-text">{{ m.text }}</span>
          </template>
        </div>
      </TransitionGroup>
    </div>

    <!-- Input row (when open) -->
    <div v-if="state.chatOpen" class="chat-input-row">
      <span class="chat-prompt">SAY &gt;</span>
      <input
        ref="inputRef"
        v-model="draft"
        class="chat-input"
        maxlength="120"
        placeholder="üzenet…"
        @keydown="onKey"
      />
    </div>

    <!-- Passive hint when closed and enabled -->
    <div v-else-if="net.enabled" class="chat-hint">[T] CHAT</div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { state } from '../game/state.ts'
import { NetworkManager } from '../game/NetworkManager.ts'

const net      = reactive(NetworkManager)
const draft    = ref('')
const inputRef = ref(null)
const now      = ref(Date.now())
let _ticker    = null

const CSS_COLORS = ['#4488ff', '#ff4444', '#44ff88', '#ffaa44']

// ── Tick "now" every second for auto-fade ─────────────────────
onMounted(() => {
  _ticker = setInterval(() => { now.value = Date.now() }, 500)
  document.addEventListener('keydown', onGlobalKey)
})
onUnmounted(() => {
  clearInterval(_ticker)
  document.removeEventListener('keydown', onGlobalKey)
  state.chatOpen = false
})

// ── Visible messages: last 8, within 8s when closed ──────────
const visibleMessages = computed(() => {
  const msgs = state.chatMessages.slice(-8)
  if (state.chatOpen) return msgs
  return msgs.filter(m => now.value - m.time < 8000)
})

function msgAge(m) { return now.value - m.time }

// ── Global T key → open chat ──────────────────────────────────
function onGlobalKey(e) {
  if (e.code === 'KeyT' && !state.chatOpen && net.enabled && document.pointerLockElement) {
    e.preventDefault()
    state.chatOpen = true
    document.exitPointerLock()
    nextTick(() => inputRef.value?.focus())
  }
}

// ── Input keydown: Enter sends, Escape cancels ─────────────────
function onKey(e) {
  e.stopPropagation()   // prevent Engine.js from seeing keystrokes
  if (e.key === 'Enter') {
    e.preventDefault()
    sendMessage()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closeChat()
  }
}

function sendMessage() {
  const text = draft.value.trim()
  if (text) {
    const msg = {
      id: Date.now() + Math.random(),
      text,
      playerIndex: NetworkManager.playerIndex,
      time: Date.now(),
    }
    state.chatMessages.push(msg)
    if (state.chatMessages.length > 20) state.chatMessages.shift()
    NetworkManager.send('chat', { text, pi: NetworkManager.playerIndex })
  }
  draft.value = ''
  closeChat()
}

function closeChat() {
  state.chatOpen = false
}
</script>

<style scoped>
.chat-wrap {
  position: fixed;
  bottom: 110px;
  left: 14px;
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

/* ── Message log ── */
.chat-log {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chat-msg {
  display: flex;
  gap: 6px;
  align-items: baseline;
  background: rgba(0, 0, 0, 0.55);
  padding: 3px 8px;
  border-radius: 3px;
  border-left: 2px solid rgba(255,255,255,0.15);
  transition: opacity 0.8s;
}
.chat-msg.fading {
  opacity: 0.4;
}

.chat-who {
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
.sys-tag {
  color: #ffcc44;
  font-size: 10px;
  letter-spacing: 0.08em;
}
.system-msg {
  border-left-color: rgba(255, 204, 68, 0.35);
}
.chat-text {
  color: #ddd;
  word-break: break-word;
}

/* ── Input row ── */
.chat-input-row {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  padding: 5px 10px;
}
.chat-prompt {
  color: #ffdd88;
  font-size: 11px;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}
.chat-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  caret-color: #ffdd88;
}
.chat-input::placeholder { color: #666; }

/* ── Passive hint ── */
.chat-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.22);
  letter-spacing: 0.06em;
  padding: 2px 0;
}

/* ── Transitions ── */
.msg-enter-active { transition: opacity 0.2s, transform 0.2s; }
.msg-leave-active { transition: opacity 0.2s, transform 0.15s; }
.msg-enter-from   { opacity: 0; transform: translateX(-8px); }
.msg-leave-to     { opacity: 0; transform: translateX(-8px); }
</style>
