<template>
  <div class="coop-root">

    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="onBack">← BACK</button>
      <span class="title">CO-OP LOBBY</span>
      <button
        v-if="inRoom && net.isHost"
        class="start-top-btn"
        :disabled="!canStart"
        @click="doStart"
      >
        ▶ START HEIST
      </button>
      <div v-else-if="inRoom" class="wait-top">Waiting for host…</div>
    </div>

    <!-- ── Not in room: tab selection ──────────────────────────── -->
    <div v-if="!inRoom" class="pre-room">

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'public' }"  @click="tab = 'public'">PUBLIC</button>
        <button class="tab" :class="{ active: tab === 'invite' }"  @click="tab = 'invite'">INVITE</button>
      </div>

      <!-- ── PUBLIC tab ──────────────────────────────────────── -->
      <div v-if="tab === 'public'" class="tab-panel">

        <div v-if="lobbyStatus" class="lobby-status">{{ lobbyStatus }}</div>

        <button class="action-btn host-btn" @click="doCreatePublic" :disabled="busy || !lobbyReady">
          {{ busy ? 'CONNECTING…' : 'HOST PUBLIC GAME' }}
        </button>

        <div class="divider">OPEN ROOMS</div>

        <div class="room-list-wrap">
          <div v-if="scanning" class="scan-msg">Searching…</div>
          <div v-else-if="publicRooms.length === 0" class="scan-msg">No public rooms found</div>
          <div v-else class="room-list">
            <div
              v-for="r in publicRooms"
              :key="r"
              class="room-entry"
              @click="doJoinPublic(r)"
            >
              <span class="re-dot" />
              <span class="re-id">{{ r.replace('heist-p-', '') }}</span>
              <span class="re-join">JOIN →</span>
            </div>
          </div>
          <button class="refresh-btn" @click="refreshRooms" :disabled="scanning || !lobbyReady">
            {{ scanning ? '…' : '↻ REFRESH' }}
          </button>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>

      <!-- ── INVITE tab ──────────────────────────────────────── -->
      <div v-if="tab === 'invite'" class="tab-panel">
        <button class="action-btn host-btn" @click="doCreateInvite" :disabled="busy">
          {{ busy ? 'CONNECTING…' : 'CREATE PRIVATE ROOM' }}
        </button>
        <div class="divider">OR</div>
        <div class="join-row">
          <input
            v-model="joinCode"
            class="code-input"
            placeholder="ROOM CODE"
            maxlength="12"
            @keydown.enter="doJoinInvite"
          />
          <button class="action-btn" @click="doJoinInvite" :disabled="busy || !joinCode.trim()">
            JOIN
          </button>
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>

    </div>

    <!-- ── In room: two-column layout ─────────────────────────── -->
    <div v-else class="room-layout">

      <!-- LEFT: lobby info -->
      <div class="lobby-sidebar">

        <!-- Room code display -->
        <div v-if="!net.isPublic" class="room-code-box">
          <div class="rc-label">ROOM CODE</div>
          <div class="rc-code" @click="copyCode">{{ net.roomCode }}</div>
          <div class="rc-hint">{{ copied ? 'copied!' : 'click to copy' }}</div>
        </div>
        <div v-else class="room-code-box public-tag">
          <div class="rc-label">PUBLIC ROOM</div>
        </div>

        <!-- Player slots -->
        <div class="player-list">
          <div
            v-for="i in 4"
            :key="i"
            class="player-slot"
            :class="{
              filled:   !!net.players[i - 1],
              me:       net.players[i - 1]?.index === net.playerIndex,
              ready:    net.players[i - 1]?.ready,
            }"
          >
            <span class="slot-dot" :style="{ background: '#' + COLORS[i-1].toString(16).padStart(6, '0') }" />
            <span class="slot-name">
              {{ net.players[i - 1]
                ? (net.players[i - 1].index === net.playerIndex ? 'YOU' : `PLAYER ${i}`)
                : '— WAITING —'
              }}
            </span>
            <span v-if="net.players[i - 1]?.ready" class="slot-ready">READY</span>
            <template v-if="net.isHost && net.players[i - 1] && net.players[i - 1].index !== 0">
              <button class="slot-kick" @click="doKick(net.players[i - 1].peerId)" title="Kick">KICK</button>
              <button class="slot-ban"  @click="doBan(net.players[i - 1].peerId)"  title="Ban">BAN</button>
            </template>
          </div>
        </div>

        <!-- Ready button -->
        <button
          class="action-btn ready-btn"
          :class="{ active: myReady }"
          @click="toggleReady"
        >
          {{ myReady ? 'UNREADY' : 'READY UP' }}
        </button>

        <!-- Lobby chat -->
        <div class="lobby-chat">
          <div class="lc-log" ref="chatLogRef">
            <div
              v-for="m in lobbyMessages"
              :key="m.id"
              class="lc-msg"
            >
              <span class="lc-who" :style="{ color: CSS_COLORS[m.playerIndex] ?? '#fff' }">P{{ m.playerIndex + 1 }}</span>
              <span class="lc-text">{{ m.text }}</span>
            </div>
            <div v-if="lobbyMessages.length === 0" class="lc-empty">No messages yet</div>
          </div>
          <div class="lc-input-row">
            <input
              v-model="chatDraft"
              class="lc-input"
              maxlength="120"
              placeholder="Type a message…"
              @keydown.enter="sendChat"
            />
            <button class="lc-send" @click="sendChat" :disabled="!chatDraft.trim()">SEND</button>
          </div>
        </div>

      </div>

      <!-- RIGHT: loadout panel (full-size) -->
      <div class="loadout-main">
        <!-- Loadout tabs -->
        <div class="loadout-tabs">
          <button
            v-for="t in LOADOUT_TABS" :key="t.id"
            :class="['lt', { active: loadoutTab === t.id }]"
            @click="loadoutTab = t.id"
          >{{ t.label }}</button>
        </div>
        <div class="loadout-panel-area">
          <ModeSelector v-if="loadoutTab === 'mode'"    v-model="localMode" v-model:mutators="localMutators" />
          <LoadoutPanel v-if="loadoutTab === 'loadout'" :prog="prog" @update="onLoadoutUpdate" />
          <SkillPanel   v-if="loadoutTab === 'skills'"  :prog="prog" @update="onProgUpdate" />
          <ShopPanel    v-if="loadoutTab === 'shop'"    :prog="prog" @update="onProgUpdate" />
        </div>
      </div>

    </div>

    <!-- Disconnected / Kicked / Banned overlay -->
    <div v-if="hostDisconnected" class="dc-overlay">
      <div class="dc-box">
        <div class="dc-title">
          {{ dcReason === 'ban' ? 'YOU WERE BANNED' : dcReason === 'kick' ? 'YOU WERE KICKED' : 'HOST DISCONNECTED' }}
        </div>
        <div class="dc-msg">
          {{ dcReason === 'ban' ? 'The host has banned you from this room.'
           : dcReason === 'kick' ? 'The host has kicked you from the room.'
           : 'The host has left or the connection was lost.' }}
        </div>
        <button class="action-btn dc-btn" @click="onDismissDC">OK</button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { NetworkManager, PLAYER_COLORS } from '../game/NetworkManager.ts'
import { state } from '../game/state.ts'
import { loadProgress, saveProgress } from '../game/PlayerProgress.ts'
import { WEAPONS, TOOLS, computeWeaponStats } from '../game/weapons/WeaponData.ts'
import LoadoutPanel  from './lobby/LoadoutPanel.vue'
import SkillPanel    from './lobby/SkillPanel.vue'
import ShopPanel     from './lobby/ShopPanel.vue'
import ModeSelector  from './ModeSelector.vue'

const emit = defineEmits(['close', 'startHeist'])
const COLORS = PLAYER_COLORS

const LOADOUT_TABS = [
  { id: 'mode',    label: '🎮 MODE'  },
  { id: 'loadout', label: 'LOADOUT' },
  { id: 'skills',  label: 'SKILLS'  },
  { id: 'shop',    label: 'SHOP'    },
]

const net          = reactive(NetworkManager)
const inRoom       = ref(false)
const tab          = ref('public')    // 'public' | 'invite'
const loadoutTab    = ref('mode')
const localMode     = ref(state.gameMode ?? 'heist')
const localMutators = ref<string[]>([...state.activeMutators])
const prog         = reactive(loadProgress())

function onLoadoutUpdate(newEquip) {
  prog.equippedWeapon      = newEquip.equippedWeapon
  prog.equippedAttachments = newEquip.equippedAttachments
  prog.equippedTools       = newEquip.equippedTools
  saveProgress(prog)
}

function onProgUpdate(updated) {
  Object.assign(prog, updated)
}
const joinCode     = ref('')
const busy         = ref(false)
const error        = ref('')
const copied       = ref(false)
const myReady         = ref(false)
const scanning        = ref(false)
const publicRooms     = ref([])
const hostDisconnected = ref(false)
const dcReason         = ref('')    // 'disconnect' | 'kick' | 'ban'

// ── Lobby broker ────────────────────────────────────────────
const lobbyReady   = ref(false)
const lobbyStatus  = ref('Connecting to lobby…')

async function initLobby() {
  lobbyReady.value = false
  lobbyStatus.value = 'Connecting to lobby…'
  await NetworkManager.initLobby()
  lobbyReady.value = true
  lobbyStatus.value = ''
  refreshRooms()
}

// Init broker when PUBLIC tab is selected
watch(tab, (t) => {
  if (t === 'public' && !lobbyReady.value) initLobby()
})

// ── Lobby chat ──────────────────────────────────────────────
const CSS_COLORS    = ['#4488ff', '#ff4444', '#44ff88', '#ffaa44']
const chatDraft     = ref('')
const chatLogRef    = ref(null)
const lobbyMessages = ref([])

const canStart = computed(() =>
  net.isHost &&
  net.playerCount >= 1 &&
  net.players.every(p => p.index === 0 || p.ready),
)

// ── Public rooms ────────────────────────────────────────────
async function refreshRooms() {
  scanning.value = true
  try {
    publicRooms.value = await NetworkManager.listPublicRooms()
  } catch { publicRooms.value = [] }
  scanning.value = false
}

async function doCreatePublic() {
  busy.value = true; error.value = ''
  try {
    await NetworkManager.createRoom(true)
    syncNet(); inRoom.value = true
  } catch (e) {
    error.value = 'Failed to create room: ' + (e?.message ?? e)
  }
  busy.value = false
}

async function doJoinPublic(peerId) {
  busy.value = true; error.value = ''
  try {
    await NetworkManager.joinRoom(peerId)
    syncNet(); inRoom.value = true
  } catch {
    error.value = 'Could not connect to room'
  }
  busy.value = false
}

// ── Invite rooms ────────────────────────────────────────────
async function doCreateInvite() {
  busy.value = true; error.value = ''
  try {
    await NetworkManager.createRoom(false)
    syncNet(); inRoom.value = true
  } catch (e) {
    error.value = 'Failed to create room: ' + (e?.message ?? e)
  }
  busy.value = false
}

async function doJoinInvite() {
  const code = joinCode.value.trim().toUpperCase()
  if (!code) return
  busy.value = true; error.value = ''
  try {
    await NetworkManager.joinRoom(code)
    syncNet(); inRoom.value = true
  } catch {
    error.value = 'Could not connect — check room code'
  }
  busy.value = false
}

// ── Shared ──────────────────────────────────────────────────
function toggleReady() {
  myReady.value = !myReady.value
  NetworkManager.setReady(myReady.value)
}

function applyLoadoutToState() {
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
  const tools = prog.equippedTools ?? [null, null]
  state.equippedTools   = [...tools]
  state.activeToolSlot  = 0
  state.toolId          = tools[0] ?? null
  const firstTool = tools[0] ? TOOLS[tools[0]] : null
  state.toolCooldownMax  = firstTool?.cooldown ?? 0
  state.toolCooldownLeft = 0
  state.maxHealth = 100 + (prog.spentSkills.muscle >= 1 ? 30 : 0)
  state.health    = state.maxHealth
}

function doStart() {
  state.gameMode       = localMode.value as 'heist' | 'holdout' | 'mutators'
  state.activeMutators = [...localMutators.value]
  applyLoadoutToState()
  NetworkManager.startGame(state.builderLevel)
  emit('startHeist')
}

function copyCode() {
  navigator.clipboard?.writeText(NetworkManager.roomCode ?? '')
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function onBack() {
  if (inRoom.value) {
    NetworkManager.disconnect()
    inRoom.value = false
  } else {
    emit('close')
  }
}

function onDismissDC() {
  hostDisconnected.value = false
  dcReason.value = ''
  NetworkManager.disconnect()
  inRoom.value = false
  myReady.value = false
}

function doKick(peerId) {
  NetworkManager.kick(peerId)
}

function doBan(peerId) {
  NetworkManager.ban(peerId)
}

// ── Lobby chat send ─────────────────────────────────────────
function sendChat() {
  const text = chatDraft.value.trim()
  if (!text) return
  const msg = { id: Date.now() + Math.random(), text, playerIndex: NetworkManager.playerIndex, time: Date.now() }
  lobbyMessages.value.push(msg)
  // Also persist into state so in-game CoopChat sees earlier msgs
  state.chatMessages.push(msg)
  if (state.chatMessages.length > 30) state.chatMessages.shift()
  NetworkManager.send('chat', { text, pi: NetworkManager.playerIndex })
  chatDraft.value = ''
  nextTick(() => { if (chatLogRef.value) chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight })
}

// ── Sync reactive proxy when players join/leave/ready ─────
function syncNet() {
  net.players     = [...NetworkManager.players]
  net.playerCount = NetworkManager.playerCount
  net.playerIndex = NetworkManager.playerIndex
  net.isHost      = NetworkManager.isHost
  net.connected   = NetworkManager.connected
}

NetworkManager.onJoin(()  => syncNet())
NetworkManager.onLeave(() => syncNet())
NetworkManager.onReady(()  => syncNet())
NetworkManager.onHostDisconnect((reason) => {
  dcReason.value = reason ?? 'disconnect'
  hostDisconnected.value = true
})

// Listen for host-initiated start + lobby chat messages
NetworkManager.onMessage(data => {
  if (data.type === 'start') {
    if (data.levelData) state.builderLevel = data.levelData
    // Compute weapon stats for client too
    applyLoadoutToState()
    emit('startHeist')
  } else if (data.type === 'chat') {
    const msg = { id: Date.now() + Math.random(), text: data.text, playerIndex: data.pi ?? 0, time: Date.now() }
    lobbyMessages.value.push(msg)
    state.chatMessages.push(msg)
    if (state.chatMessages.length > 30) state.chatMessages.shift()
    nextTick(() => { if (chatLogRef.value) chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight })
  }
})

onMounted(() => {
  // Starter money for new players
  if (prog.xp === 0 && prog.money === 0) {
    prog.money = 10000
    saveProgress(prog)
  }
  // Auto-init lobby if PUBLIC tab is default
  if (tab.value === 'public') initLobby()
})

onUnmounted(() => {
  NetworkManager.destroyLobby()
  if (!NetworkManager.enabled || inRoom.value === false) {
    NetworkManager.disconnect()
  }
})
</script>

<style scoped>
.coop-root {
  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  background: #0d0d12;
  color: #ddd; font-family: 'Courier New', monospace;
  z-index: 100;
}

/* ── Header ── */
.header {
  display: flex; align-items: center; gap: 16px;
  padding: 8px 16px;
  background: rgba(10,10,14,0.98);
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}
.back-btn {
  padding: 6px 16px;
  background: rgba(255,255,255,0.06); border: 1px solid #444;
  border-radius: 3px; color: #ccc;
  font: 11px 'Courier New', monospace; letter-spacing: 0.06em;
  cursor: pointer; transition: all .15s;
}
.back-btn:hover { background: rgba(255,255,255,0.12); }
.title {
  font-size: 14px; font-weight: bold; letter-spacing: 0.2em; color: #ffaa00;
  flex: 1;
}
.start-top-btn {
  padding: 6px 16px;
  background: rgba(40,180,60,0.2); border: 1px solid #44aa44;
  border-radius: 3px; color: #88ee88;
  font: 11px 'Courier New', monospace; letter-spacing: 0.06em;
  cursor: pointer; transition: all .15s;
}
.start-top-btn:hover:not(:disabled) { background: rgba(40,180,60,0.35); }
.start-top-btn:disabled { opacity: .4; cursor: default; }
.wait-top { font-size: 11px; color: #666; letter-spacing: 0.08em; }

/* ── Pre-room (centered narrow column) ── */
.pre-room {
  width: 100%; max-width: 420px;
  margin: 40px auto 0;
  padding: 0 20px;
}
.tabs {
  display: flex; gap: 0; margin-bottom: 24px;
  border-bottom: 1px solid #333;
}
.tab {
  flex: 1; padding: 10px 0; text-align: center;
  background: none; border: none; border-bottom: 2px solid transparent;
  color: #666; font-family: monospace; font-size: 13px; letter-spacing: 0.15em;
  cursor: pointer; transition: all .15s;
}
.tab:hover { color: #aaa; }
.tab.active { color: #ffdd88; border-bottom-color: #ffaa00; }

.tab-panel {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}

.lobby-status {
  font-size: 12px; color: #888; letter-spacing: 0.08em; text-align: center;
}

/* ── Shared buttons ── */
.action-btn {
  padding: 10px 24px; border: 1px solid #666; border-radius: 4px;
  background: rgba(255,255,255,0.05); color: #ddd;
  font-family: monospace; font-size: 13px; letter-spacing: 0.1em; cursor: pointer;
  transition: all .15s;
}
.action-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); border-color: #aaa; }
.action-btn:disabled { opacity: .4; cursor: default; }
.host-btn { border-color: #ffaa00; color: #ffdd88; width: 100%; }
.host-btn:hover:not(:disabled) { background: rgba(255,170,0,0.15); }
.divider { color: #555; font-size: 12px; letter-spacing: 0.15em; text-align: center; }

/* ── Public room list ── */
.room-list-wrap {
  width: 100%;
  display: flex; flex-direction: column; gap: 8px;
}
.room-list {
  max-height: 200px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 6px;
}
.room-entry {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border: 1px solid #333; border-radius: 4px;
  background: rgba(255,255,255,0.03);
  cursor: pointer; transition: all .15s;
}
.room-entry:hover { border-color: #44bbff; background: rgba(68,187,255,0.08); }
.re-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #44ff88; flex-shrink: 0;
}
.re-id { flex: 1; font-size: 13px; letter-spacing: 0.12em; color: #ccc; }
.re-join { font-size: 11px; color: #44bbff; letter-spacing: 0.08em; }
.scan-msg { font-size: 12px; color: #555; text-align: center; padding: 12px 0; }
.refresh-btn {
  align-self: center;
  background: none; border: 1px solid #333; color: #666;
  padding: 6px 18px; border-radius: 4px; cursor: pointer;
  font-family: monospace; font-size: 11px; letter-spacing: 0.1em;
  transition: all .15s;
}
.refresh-btn:hover:not(:disabled) { border-color: #666; color: #aaa; }

/* ── Invite join row ── */
.join-row { display: flex; gap: 8px; width: 100%; }
.code-input {
  flex: 1; background: rgba(255,255,255,0.06); border: 1px solid #444;
  color: #ddd; padding: 10px 12px; border-radius: 4px;
  font-family: monospace; font-size: 13px; letter-spacing: 0.12em;
  outline: none; text-transform: uppercase;
}
.code-input:focus { border-color: #888; }
.error-msg { color: #ff6666; font-size: 12px; text-align: center; }

/* ── In-room: two-column layout ── */
.room-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* ── Left sidebar: lobby info ── */
.lobby-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-right: 1px solid #333;
  overflow-y: auto;
  background: rgba(0,0,0,0.2);
}

.room-code-box {
  text-align: center;
  background: rgba(255,255,255,0.04); border: 1px solid #333;
  border-radius: 6px; padding: 14px 20px;
}
.room-code-box.public-tag { padding: 10px 20px; }
.rc-label { font-size: 10px; color: #666; letter-spacing: 0.1em; margin-bottom: 8px; }
.public-tag .rc-label { margin-bottom: 0; color: #44ff88; }
.rc-code {
  font-size: 18px; color: #ffdd88; letter-spacing: 0.14em;
  cursor: pointer; padding: 4px 8px; border-radius: 3px;
  background: rgba(255,200,0,0.08);
}
.rc-code:hover { background: rgba(255,200,0,0.18); }
.rc-hint { font-size: 10px; color: #555; margin-top: 4px; }

.player-list { display: flex; flex-direction: column; gap: 6px; }
.player-slot {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border: 1px solid #2a2a2a; border-radius: 4px;
  background: rgba(255,255,255,0.03);
}
.player-slot.filled { border-color: #444; }
.player-slot.me    { border-color: #4488ff66; }
.player-slot.ready { border-color: #44ff8866; }
.slot-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.slot-name { flex: 1; font-size: 12px; letter-spacing: 0.1em; }
.player-slot:not(.filled) .slot-name { color: #444; font-style: italic; }
.slot-ready { font-size: 10px; color: #44ff88; letter-spacing: 0.08em; }
.slot-kick, .slot-ban {
  background: none; border: 1px solid #555; border-radius: 3px;
  padding: 2px 6px; font-family: monospace; font-size: 9px;
  letter-spacing: 0.06em; cursor: pointer; transition: all .15s;
}
.slot-kick { color: #ffaa44; border-color: #664400; }
.slot-kick:hover { background: rgba(255,170,68,0.15); border-color: #ffaa44; }
.slot-ban  { color: #ff4444; border-color: #660000; }
.slot-ban:hover  { background: rgba(255,68,68,0.15); border-color: #ff4444; }

.ready-btn { width: 100%; }
.ready-btn.active { border-color: #ff6644; color: #ff8866; background: rgba(255,100,68,0.1); }

/* ── Lobby chat ── */
.lobby-chat {
  flex: 1;
  min-height: 0;
  display: flex; flex-direction: column; gap: 6px;
  border: 1px solid #2a2a2a; border-radius: 6px;
  background: rgba(0,0,0,0.3); padding: 8px;
}
.lc-log {
  flex: 1;
  min-height: 60px;
  overflow-y: auto; display: flex; flex-direction: column; gap: 3px;
}
.lc-msg {
  display: flex; gap: 6px; align-items: baseline;
  font-size: 11px;
}
.lc-who {
  font-weight: bold; font-size: 10px; letter-spacing: 0.05em; flex-shrink: 0;
}
.lc-text { color: #ccc; word-break: break-word; }
.lc-empty { color: #444; font-size: 11px; font-style: italic; padding: 8px 0; text-align: center; }
.lc-input-row {
  display: flex; gap: 6px; flex-shrink: 0;
}
.lc-input {
  flex: 1;
  background: rgba(255,255,255,0.06); border: 1px solid #333;
  color: #ddd; padding: 6px 8px; border-radius: 4px;
  font-family: monospace; font-size: 11px; outline: none;
}
.lc-input:focus { border-color: #666; }
.lc-send {
  background: rgba(255,255,255,0.06); border: 1px solid #444;
  color: #aaa; padding: 6px 12px; border-radius: 4px;
  font-family: monospace; font-size: 10px; cursor: pointer;
  letter-spacing: 0.06em; transition: all .15s;
}
.lc-send:hover:not(:disabled) { border-color: #888; color: #ddd; }
.lc-send:disabled { opacity: .4; cursor: default; }

/* ── Right: full loadout area ── */
.loadout-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loadout-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 16px 0;
  background: rgba(10,10,14,0.9);
  flex-shrink: 0;
}
.lt {
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
.lt:hover  { background: rgba(255,255,255,0.08); color: #ccc; }
.lt.active { background: #111118; border-color: #555; color: #ffdd88; }

.loadout-panel-area {
  flex: 1;
  overflow: hidden;
  background: #111118;
  border-top: 1px solid #333;
  padding: 16px;
}

/* ── Host disconnected overlay ── */
.dc-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}
.dc-box {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  background: #1a1a1a; border: 1px solid #ff4444; border-radius: 8px;
  padding: 32px 40px; max-width: 360px; text-align: center;
}
.dc-title {
  font-size: 18px; font-weight: bold; color: #ff6666;
  letter-spacing: 0.15em;
}
.dc-msg { font-size: 13px; color: #999; }
.dc-btn { border-color: #ff4444; color: #ff8866; min-width: 120px; }
.dc-btn:hover { background: rgba(255,68,68,0.15); }
</style>
