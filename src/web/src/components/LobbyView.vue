<template>
  <div class="lobby-root">

    <!-- ── Top bar ────────────────────────────────────────────── -->
    <div class="top-bar">
      <button class="tb-btn" @click="$emit('close')">← BACK</button>

      <div class="lobby-title">HEIST LOADOUT</div>

      <button class="tb-btn start" @click="startHeist">▶ START HEIST</button>
    </div>

    <!-- ── Tabs ───────────────────────────────────────────────── -->
    <div class="tabs">
      <button
        v-for="t in TABS" :key="t.id"
        :class="['tab', { active: tab === t.id }]"
        @click="tab = t.id"
      >{{ t.label }}</button>
    </div>

    <!-- ── Panel ──────────────────────────────────────────────── -->
    <div class="panel">
      <ModeSelector v-if="tab === 'mode'"    v-model="localMode" v-model:mutators="localMutators" />
      <LoadoutPanel v-if="tab === 'loadout'" :prog="prog" @update="onLoadoutUpdate" />
      <SkillPanel   v-if="tab === 'skills'"  :prog="prog" @update="onProgUpdate" />
      <ShopPanel    v-if="tab === 'shop'"    :prog="prog" @update="onProgUpdate" />
    </div>

    <!-- ── Lobby chat (visible in co-op) ─────────────────────── -->
    <div v-if="net.enabled" class="loadout-chat">
      <div class="lcc-log" ref="chatLogRef">
        <div v-for="m in lobbyMessages" :key="m.id" class="lcc-msg">
          <span class="lcc-who" :style="{ color: CSS_COLORS[m.playerIndex] ?? '#fff' }">P{{ m.playerIndex + 1 }}</span>
          <span class="lcc-text">{{ m.text }}</span>
        </div>
      </div>
      <div class="lcc-input-row">
        <input
          v-model="chatDraft"
          class="lcc-input"
          maxlength="120"
          placeholder="Chat…"
          @keydown.enter="sendChat"
        />
        <button class="lcc-send" @click="sendChat" :disabled="!chatDraft.trim()">SEND</button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import LoadoutPanel  from './lobby/LoadoutPanel.vue'
import SkillPanel    from './lobby/SkillPanel.vue'
import ShopPanel     from './lobby/ShopPanel.vue'
import ModeSelector  from './ModeSelector.vue'
import { loadProgress, saveProgress } from '../game/PlayerProgress.ts'
import { WEAPONS, TOOLS, computeWeaponStats } from '../game/weapons/WeaponData.ts'
import { state } from '../game/state.ts'
import { NetworkManager } from '../game/NetworkManager.ts'

const emit = defineEmits(['close', 'startHeist'])

const TABS = [
  { id: 'mode',    label: '🎮 MODE'    },
  { id: 'loadout', label: '⚙ LOADOUT' },
  { id: 'skills',  label: '🎯 SKILLS'  },
  { id: 'shop',    label: '🛒 SHOP'    },
]
const tab = ref('mode')
const localMode     = ref(state.gameMode ?? 'heist')
const localMutators = ref<string[]>([...state.activeMutators])
const net = reactive(NetworkManager)

// ── Lobby chat ──────────────────────────────────────────────
const CSS_COLORS    = ['#4488ff', '#ff4444', '#44ff88', '#ffaa44']
const chatDraft     = ref('')
const chatLogRef    = ref(null)
const lobbyMessages = ref([...state.chatMessages])

let _chatCb = null
onMounted(() => {
  _chatCb = (data) => {
    if (data.type === 'chat') {
      const msg = { id: Date.now() + Math.random(), text: data.text, playerIndex: data.pi ?? 0, time: Date.now() }
      lobbyMessages.value.push(msg)
      state.chatMessages.push(msg)
      if (state.chatMessages.length > 30) state.chatMessages.shift()
      nextTick(() => { if (chatLogRef.value) chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight })
    }
  }
  NetworkManager.onMessage(_chatCb)
})
onUnmounted(() => { if (_chatCb) NetworkManager.onMessage(null) })

function sendChat() {
  const text = chatDraft.value.trim()
  if (!text) return
  const msg = { id: Date.now() + Math.random(), text, playerIndex: NetworkManager.playerIndex, time: Date.now() }
  lobbyMessages.value.push(msg)
  state.chatMessages.push(msg)
  if (state.chatMessages.length > 30) state.chatMessages.shift()
  NetworkManager.send('chat', { text, pi: NetworkManager.playerIndex })
  chatDraft.value = ''
  nextTick(() => { if (chatLogRef.value) chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight })
}

// Reactive progress — loaded from localStorage
const prog = reactive(loadProgress())

onMounted(() => {
  // Add startup money for new players (starter amount)
  if (prog.xp === 0 && prog.money === 0) {
    prog.money = 10000  // small starter amount
    saveProgress(prog)
  }
})

function onLoadoutUpdate(newEquip) {
  prog.equippedWeapon      = newEquip.equippedWeapon
  prog.equippedAttachments = newEquip.equippedAttachments
  prog.equippedTools       = newEquip.equippedTools
  saveProgress(prog)
}

function onProgUpdate(updated) {
  Object.assign(prog, updated)
  // saveProgress already called inside PlayerProgress functions
}

function startHeist() {
  // Push selected game mode + mutators to shared state
  state.gameMode       = localMode.value as 'heist' | 'holdout' | 'mutators'
  state.activeMutators = [...localMutators.value]

  // Compute final weapon stats and push to state
  const ws = computeWeaponStats(
    prog.equippedWeapon,
    prog.equippedAttachments,
    prog.spentSkills,
  )
  state.weaponStats  = ws
  state.weaponType   = prog.equippedWeapon
  state.equippedAttachments = { ...prog.equippedAttachments }
  state.concealment  = ws.concealment
  state.ammo         = ws.magSize
  state.reserveAmmo  = ws.reserve
  state.skills       = { ...prog.spentSkills }
  // Multi-slot tool setup (Engine handles per-slot cooldowns; state gets slot 0 initially)
  const tools = prog.equippedTools ?? [null, null]
  state.equippedTools   = [...tools]
  state.activeToolSlot  = 0
  state.toolId          = tools[0] ?? null
  const firstTool = tools[0] ? TOOLS[tools[0]] : null
  state.toolCooldownMax  = firstTool?.cooldown ?? 0
  state.toolCooldownLeft = 0

  // Apply Muscle T1: +30 max health
  state.maxHealth = 100 + (prog.spentSkills.muscle >= 1 ? 30 : 0)
  state.health    = state.maxHealth

  emit('startHeist')
}
</script>

<style scoped>
.lobby-root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #0d0d12;
  color: #ccc;
  font-family: 'Courier New', monospace;
  z-index: 100;
}

/* ── Top bar ── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(10,10,14,0.98);
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.lobby-title {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.2em;
  color: #ffaa00;
}

.tb-btn {
  padding: 6px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid #444;
  border-radius: 3px;
  color: #ccc;
  font: 11px 'Courier New', monospace;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.15s;
}
.tb-btn:hover { background: rgba(255,255,255,0.12); }
.tb-btn.start { background: rgba(40,180,60,0.2); border-color: #44aa44; color: #88ee88; }
.tb-btn.start:hover { background: rgba(40,180,60,0.35); }

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 2px;
  padding: 6px 16px 0;
  background: rgba(10,10,14,0.9);
  flex-shrink: 0;
}

.tab {
  padding: 6px 20px;
  background: rgba(255,255,255,0.04);
  border: 1px solid #333;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  color: #888;
  font: 11px 'Courier New', monospace;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.15s;
}
.tab:hover  { background: rgba(255,255,255,0.08); color: #ccc; }
.tab.active { background: #111118; border-color: #555; color: #ffdd88; }

/* ── Panel ── */
.panel {
  flex: 1;
  overflow: hidden;
  background: #111118;
  border-top: 1px solid #333;
  padding: 16px;
}

/* ── Loadout chat (co-op) ── */
.loadout-chat {
  position: fixed; bottom: 14px; left: 14px;
  width: 320px;
  display: flex; flex-direction: column; gap: 4px;
  background: rgba(0,0,0,0.7); border: 1px solid #2a2a2a;
  border-radius: 6px; padding: 8px; z-index: 110;
  font-family: monospace;
}
.lcc-log {
  max-height: 120px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px;
}
.lcc-msg { display: flex; gap: 6px; align-items: baseline; font-size: 12px; }
.lcc-who { font-weight: bold; font-size: 11px; letter-spacing: 0.05em; flex-shrink: 0; }
.lcc-text { color: #ccc; word-break: break-word; }
.lcc-input-row { display: flex; gap: 4px; }
.lcc-input {
  flex: 1; background: rgba(255,255,255,0.06); border: 1px solid #333;
  color: #ddd; padding: 6px 8px; border-radius: 4px;
  font-family: monospace; font-size: 12px; outline: none;
}
.lcc-input:focus { border-color: #666; }
.lcc-send {
  background: rgba(255,255,255,0.06); border: 1px solid #444;
  color: #aaa; padding: 6px 12px; border-radius: 4px;
  font-family: monospace; font-size: 11px; cursor: pointer; transition: all .15s;
}
.lcc-send:hover:not(:disabled) { border-color: #888; color: #ddd; }
.lcc-send:disabled { opacity: .4; cursor: default; }
</style>
