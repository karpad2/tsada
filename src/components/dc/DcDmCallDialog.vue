<template>
  <!-- Incoming call -->
  <div v-if="callState === 'ringing'" class="dc-call-overlay">
    <div class="dc-call-card dc-call-ringing">
      <div class="dc-call-avatar" :style="{ backgroundColor: avatarColor }">
        {{ peerNickname.charAt(0).toUpperCase() }}
        <div class="dc-call-avatar-ring"></div>
        <div class="dc-call-avatar-ring dc-call-avatar-ring-2"></div>
      </div>
      <div class="dc-call-name">{{ peerNickname }}</div>
      <div class="dc-call-type">
        <v-icon size="16" class="mr-1">{{ withVideo ? 'mdi-video' : 'mdi-phone' }}</v-icon>
        {{ withVideo ? $t('dc_dm_call_video') : $t('dc_dm_call_audio') }}
      </div>
      <div class="dc-call-actions">
        <button class="dc-call-btn dc-call-reject" @click="emit('reject')" :title="$t('dc_dm_call_reject')">
          <v-icon size="28">mdi-phone-hangup</v-icon>
        </button>
        <button class="dc-call-btn dc-call-accept" @click="emit('accept')" :title="$t('dc_dm_call_answer')">
          <v-icon size="28">mdi-phone</v-icon>
        </button>
      </div>
    </div>
  </div>

  <!-- Calling (outgoing, waiting for answer) -->
  <div v-else-if="callState === 'calling'" class="dc-call-overlay">
    <div class="dc-call-card">
      <div class="dc-call-avatar dc-call-avatar-calling" :style="{ backgroundColor: avatarColor }">
        {{ peerNickname.charAt(0).toUpperCase() }}
      </div>
      <div class="dc-call-name">{{ peerNickname }}</div>
      <div class="dc-call-type dc-call-type-muted">
        <v-icon size="16" class="mr-1">{{ withVideo ? 'mdi-video-outline' : 'mdi-phone-outline' }}</v-icon>
        {{ $t('dc_dm_call_calling') }}
        <span class="dc-call-dots"><span></span><span></span><span></span></span>
      </div>
      <div class="dc-call-actions">
        <button class="dc-call-btn dc-call-reject" @click="emit('hangup')" :title="$t('dc_dm_call_hangup')">
          <v-icon size="28">mdi-phone-hangup</v-icon>
        </button>
      </div>
    </div>
  </div>

  <!-- Active call -->
  <div v-else-if="callState === 'connected'" class="dc-call-overlay dc-call-active">
    <!-- Video tiles -->
    <template v-if="withVideo">
      <div class="dc-call-video-area">
        <!-- Remote video -->
        <video
          v-if="remoteStream"
          ref="remoteVideoEl"
          class="dc-call-video-remote"
          autoplay
          playsinline
        ></video>
        <div v-else class="dc-call-video-placeholder">
          <div class="dc-call-avatar dc-call-avatar-large" :style="{ backgroundColor: avatarColor }">
            {{ peerNickname.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Local video (picture-in-picture) -->
        <video
          v-if="localStream && !videoOff"
          ref="localVideoEl"
          class="dc-call-video-local"
          autoplay
          playsinline
          muted
        ></video>
        <div v-else class="dc-call-video-local dc-call-pip-placeholder">
          <v-icon size="20" color="#949ba4">mdi-video-off</v-icon>
        </div>
      </div>
    </template>

    <!-- Audio-only -->
    <template v-else>
      <div class="dc-call-audio-area">
        <div class="dc-call-avatar dc-call-avatar-large" :style="{ backgroundColor: avatarColor }">
          {{ peerNickname.charAt(0).toUpperCase() }}
          <div v-if="!muted" class="dc-call-speaking-ring"></div>
        </div>
        <div class="dc-call-name">{{ peerNickname }}</div>
        <div class="dc-call-duration">{{ formattedDuration }}</div>
      </div>
    </template>

    <!-- Call controls -->
    <div class="dc-call-controls">
      <!-- Mute -->
      <button
        class="dc-call-ctrl-btn"
        :class="{ active: muted }"
        @click="emit('toggle-mute')"
        :title="muted ? $t('dc_dm_call_unmute') : $t('dc_dm_call_mute')"
      >
        <v-icon size="22">{{ muted ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
      </button>

      <!-- Camera toggle (only for video calls) -->
      <button
        v-if="withVideo"
        class="dc-call-ctrl-btn"
        :class="{ active: videoOff }"
        @click="emit('toggle-video')"
        :title="$t('dc_dm_call_camera')"
      >
        <v-icon size="22">{{ videoOff ? 'mdi-video-off' : 'mdi-video' }}</v-icon>
      </button>

      <!-- Hang up -->
      <button class="dc-call-ctrl-btn dc-call-ctrl-hangup" @click="emit('hangup')">
        <v-icon size="22">mdi-phone-hangup</v-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { DmCallState } from '@/utils/dcDmCallManager'

const props = defineProps<{
  callState: DmCallState
  peerNickname: string
  withVideo: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  muted: boolean
  videoOff: boolean
}>()

const emit = defineEmits<{
  accept: []
  reject: []
  hangup: []
  'toggle-mute': []
  'toggle-video': []
}>()

const remoteVideoEl = ref<HTMLVideoElement | null>(null)
const localVideoEl = ref<HTMLVideoElement | null>(null)

// Call duration
const duration = ref(0)
let durationInterval: ReturnType<typeof setInterval> | null = null

const formattedDuration = ref('0:00')

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

watch(() => props.callState, (state) => {
  if (state === 'connected') {
    duration.value = 0
    durationInterval = setInterval(() => {
      duration.value++
      formattedDuration.value = formatDuration(duration.value)
    }, 1000)
  } else {
    if (durationInterval) {
      clearInterval(durationInterval)
      durationInterval = null
    }
    duration.value = 0
    formattedDuration.value = '0:00'
  }
})

// Attach streams to video elements
watch([() => props.remoteStream, remoteVideoEl], ([stream, el]) => {
  if (el && stream) {
    el.srcObject = stream
  }
})

watch([() => props.localStream, localVideoEl], ([stream, el]) => {
  if (el && stream) {
    el.srcObject = stream
  }
})

const avatarColor = (() => {
  const colors = ['#5865f2', '#ed4245', '#faa61a', '#23a559', '#9b59b6', '#e91e63', '#3498db']
  let hash = 0
  for (let i = 0; i < props.peerNickname.length; i++) {
    hash = props.peerNickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})()

onBeforeUnmount(() => {
  if (durationInterval) clearInterval(durationInterval)
})
</script>

<style scoped>
/* ===================== OVERLAY ===================== */
.dc-call-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
}

/* ===================== CALL CARD ===================== */
.dc-call-card {
  background: #2b2d31;
  border-radius: 16px;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.dc-call-name {
  font-size: 22px;
  font-weight: 700;
  color: #f2f3f5;
}

.dc-call-type {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #5865f2;
  font-weight: 500;
}

.dc-call-type-muted {
  color: #949ba4;
}

/* ===================== AVATAR ===================== */
.dc-call-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: 800;
  color: white;
  position: relative;
  margin-bottom: 4px;
}

.dc-call-avatar-large {
  width: 110px;
  height: 110px;
  font-size: 48px;
}

/* Ringing pulse rings */
.dc-call-avatar-ring {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0.4;
  animation: dc-call-ring 1.8s ease-out infinite;
}

.dc-call-avatar-ring-2 {
  animation-delay: 0.6s;
}

@keyframes dc-call-ring {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.6); opacity: 0; }
}

/* Pulsing for outgoing call */
.dc-call-avatar-calling {
  animation: dc-call-pulse 2s ease-in-out infinite;
}

@keyframes dc-call-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(88, 101, 242, 0.5); }
  50% { box-shadow: 0 0 0 16px rgba(88, 101, 242, 0); }
}

/* Speaking indicator */
.dc-call-speaking-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 3px solid #23a559;
  animation: dc-call-speak 1s ease-in-out infinite;
}

@keyframes dc-call-speak {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0.3; }
}

/* ===================== ACTIONS (ringing/calling) ===================== */
.dc-call-actions {
  display: flex;
  gap: 32px;
  margin-top: 16px;
}

.dc-call-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, opacity 0.15s;
}

.dc-call-btn:hover {
  transform: scale(1.1);
}

.dc-call-accept {
  background: #23a559;
  color: white;
}

.dc-call-reject {
  background: #ed4245;
  color: white;
}

/* ===================== ANIMATED DOTS ===================== */
.dc-call-dots {
  display: inline-flex;
  gap: 2px;
  margin-left: 2px;
}

.dc-call-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #949ba4;
  animation: dc-call-dot-bounce 1.4s infinite ease-in-out;
}

.dc-call-dots span:nth-child(1) { animation-delay: 0s; }
.dc-call-dots span:nth-child(2) { animation-delay: 0.2s; }
.dc-call-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dc-call-dot-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ===================== ACTIVE CALL - VIDEO ===================== */
.dc-call-active {
  flex-direction: column;
}

.dc-call-video-area {
  flex: 1;
  width: 100%;
  position: relative;
  background: #1e1f22;
}

.dc-call-video-remote {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #1e1f22;
}

.dc-call-video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e1f22;
}

.dc-call-video-local {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 160px;
  height: 90px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #2b2d31;
  background: #313338;
}

.dc-call-pip-placeholder {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 160px;
  height: 90px;
  border-radius: 8px;
  background: #313338;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #2b2d31;
}

/* ===================== ACTIVE CALL - AUDIO ===================== */
.dc-call-audio-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
}

.dc-call-duration {
  font-size: 18px;
  color: #949ba4;
  font-variant-numeric: tabular-nums;
}

/* ===================== CONTROLS ===================== */
.dc-call-controls {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(30, 31, 34, 0.9);
  width: 100%;
  justify-content: center;
  flex-shrink: 0;
}

.dc-call-ctrl-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #383a40;
  color: #dbdee1;
  transition: background 0.15s, transform 0.1s;
}

.dc-call-ctrl-btn:hover {
  background: #404249;
  transform: scale(1.05);
}

.dc-call-ctrl-btn.active {
  background: #ed4245;
  color: white;
}

.dc-call-ctrl-hangup {
  background: #ed4245;
  color: white;
}

.dc-call-ctrl-hangup:hover {
  background: #c03537;
}
</style>
