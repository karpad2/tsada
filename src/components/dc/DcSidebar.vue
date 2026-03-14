<template>
  <div class="dc-sidebar">
    <div class="dc-sidebar-header">
      <v-icon color="white" class="mr-2">{{ currentServer ? 'mdi-server' : 'mdi-school' }}</v-icon>
      <span class="font-weight-bold text-truncate">{{ currentServer ? currentServer.name : $t('dc_default_server') }}</span>
      <v-spacer />
      <v-btn v-if="currentServer && canManage" icon size="x-small" variant="text" @click="emit('open-settings')">
        <v-icon size="16" color="white">mdi-cog</v-icon>
      </v-btn>
    </div>

    <!-- Encryption indicator -->
    <div v-if="currentServer" class="dc-encryption-badge">
      <v-icon size="12" class="mr-1">mdi-lock</v-icon>
      {{ $t('dc_encrypted') }}
    </div>

    <!-- Channels (scrollable area) -->
    <div class="dc-channels-scroll">
      <!-- Text Channels -->
      <div class="dc-channel-label">{{ $t('dc_text_channels') }}</div>
      <template v-for="ch in textChannels" :key="ch.key">
        <div
          class="dc-channel-item"
          :class="{ active: currentChannel === ch.key }"
          @click="emit('select-channel', ch.key)"
        >
          <v-icon size="18" class="mr-2">{{ ch.icon }}</v-icon>
          <span class="dc-channel-name">{{ ch.name }}</span>
          <v-icon v-if="ch.locked" size="12" class="ml-auto" color="warning">mdi-lock</v-icon>
        </div>
      </template>

      <!-- Voice Channels -->
      <div class="dc-channel-label mt-4">{{ $t('dc_voice_channels') }}</div>
      <template v-for="vc in voiceChannels" :key="vc.key">
        <div
          class="dc-channel-item"
          :class="{ active: currentVoiceChannel === vc.key }"
          @click="emit('toggle-voice', vc.key)"
        >
          <v-icon size="18" class="mr-2">{{ vc.icon }}</v-icon>
          <span class="dc-channel-name">{{ vc.name }}</span>
          <span v-if="voiceUsers[vc.key]?.length" class="ml-auto dc-vc-count">{{ voiceUsers[vc.key].length }}</span>
        </div>
        <!-- Connected users under this voice channel -->
        <div v-if="voiceUsers[vc.key]?.length" class="dc-voice-users">
          <div v-for="user in voiceUsers[vc.key]" :key="user" class="dc-voice-user">
            <v-icon size="14" :color="user === currentUser?.nickname && voiceMuted ? 'red' : 'green'" class="mr-1">
              {{ user === currentUser?.nickname && voiceMuted ? 'mdi-microphone-off' : 'mdi-account-voice' }}
            </v-icon>
            {{ user }}
          </div>
        </div>
      </template>
    </div>

    <!-- Voice Connected Panel -->
    <div v-if="currentVoiceChannel" class="dc-voice-panel">
      <div class="dc-voice-panel-top">
        <div class="dc-voice-panel-info">
          <div class="dc-voice-panel-status">
            <v-icon size="16" color="#23a559" class="mr-1">mdi-signal-cellular-3</v-icon>
            <span class="dc-voice-status-text">{{ $t('dc_voice_connected') }}</span>
          </div>
          <div class="dc-voice-panel-channel">
            {{ activeVoiceChannelName }} / {{ currentServer ? currentServer.name : $t('dc_default_server') }}
          </div>
        </div>
        <v-btn
          icon size="small" variant="text"
          class="dc-voice-hangup-btn"
          @click="emit('leave-voice')"
          :title="$t('dc_voice_disconnect')"
        >
          <v-icon size="20">mdi-phone-hangup</v-icon>
        </v-btn>
      </div>
      <!-- Voice control buttons row -->
      <div class="dc-voice-panel-controls">
        <v-btn
          icon size="small" variant="text"
          class="dc-vc-btn"
          :class="{ 'dc-vc-btn-danger': voiceMuted }"
          @click="emit('toggle-mute')"
          :title="voiceMuted ? $t('dc_unmute') : $t('dc_mute')"
        >
          <v-icon size="20">{{ voiceMuted ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
        </v-btn>
        <v-btn
          icon size="small" variant="text"
          class="dc-vc-btn"
          :class="{ 'dc-vc-btn-active': voiceCameraOn }"
          @click="emit('toggle-camera')"
          :title="voiceCameraOn ? $t('dc_camera_off') : $t('dc_camera')"
        >
          <v-icon size="20">{{ voiceCameraOn ? 'mdi-video' : 'mdi-video-off' }}</v-icon>
        </v-btn>
        <v-menu v-model="showSoundboard" :close-on-content-click="false" location="top start" offset="8">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon size="small" variant="text"
              class="dc-vc-btn"
              :class="{ 'dc-vc-btn-active': showSoundboard }"
              :title="$t('dc_soundboard')"
            >
              <v-icon size="20">mdi-music-box-multiple</v-icon>
            </v-btn>
          </template>
          <!-- Soundboard popup -->
          <div class="dc-soundboard-popup">
            <div class="dc-soundboard-header">{{ $t('dc_soundboard') }}</div>
            <div class="dc-soundboard-grid">
              <button
                v-for="sound in soundboardSounds"
                :key="sound.id"
                class="dc-soundboard-item"
                @click="emit('play-soundboard', sound.id)"
              >
                <span class="dc-soundboard-emoji">{{ sound.emoji }}</span>
                <span class="dc-soundboard-name">{{ sound.name }}</span>
              </button>
            </div>
          </div>
        </v-menu>
        <v-btn
          icon size="small" variant="text"
          class="dc-vc-btn"
          :class="{ 'dc-vc-btn-active': voiceScreenSharing }"
          @click="emit('toggle-screen-share')"
          :title="voiceScreenSharing ? $t('dc_stop_screen_share') : $t('dc_screen_share')"
        >
          <v-icon size="20">{{ voiceScreenSharing ? 'mdi-monitor-off' : 'mdi-monitor-share' }}</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- User Panel (bottom) -->
    <div class="dc-user-panel">
      <v-icon size="20" class="mr-2" :color="currentUserRoleColor">mdi-account-circle</v-icon>
      <div class="dc-user-info">
        <span class="text-body-2" :style="{ color: currentUserRoleColor }">
          {{ currentUser.nickname }}
        </span>
        <span
          v-if="currentUser.role"
          class="dc-role-badge-small"
          :style="{ backgroundColor: currentUserRoleColor + '33', color: currentUserRoleColor }"
        >
          {{ $t('dc_role_' + currentUser.role) }}
        </span>
      </div>
      <v-spacer />
      <v-btn icon size="x-small" variant="text" @click="emit('logout')">
        <v-icon size="16">mdi-logout</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DcServer, DcUser } from '@/services/DcChatService'
import { SOUNDBOARD_SOUNDS } from '@/utils/voiceSounds'

interface DisplayChannel {
  key: string
  name: string
  icon: string
  locked: boolean
}

const props = defineProps<{
  currentServer: DcServer | null
  textChannels: DisplayChannel[]
  voiceChannels: DisplayChannel[]
  currentChannel: string
  currentVoiceChannel: string | null
  voiceUsers: Record<string, string[]>
  currentUser: DcUser
  voiceMuted: boolean
  voiceCameraOn: boolean
  voiceScreenSharing: boolean
  canManage: boolean
  currentUserRoleColor: string
}>()

const emit = defineEmits<{
  'select-channel': [channelId: string]
  'toggle-voice': [channelId: string]
  'open-settings': []
  'toggle-mute': []
  'toggle-camera': []
  'toggle-screen-share': []
  'play-soundboard': [soundId: string]
  'logout': []
  'leave-voice': []
}>()

const showSoundboard = ref(false)
const soundboardSounds = SOUNDBOARD_SOUNDS

const activeVoiceChannelName = computed(() => {
  if (!props.currentVoiceChannel) return ''
  const vc = props.voiceChannels.find(c => c.key === props.currentVoiceChannel)
  return vc ? vc.name : props.currentVoiceChannel
})
</script>

<style scoped>
.dc-sidebar {
  width: 240px;
  background: #2b2d31;
  display: flex;
  flex-direction: column;
  color: #949ba4;
  flex-shrink: 0;
}

.dc-sidebar-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #1e1f22;
  color: white;
  font-size: 15px;
  border-bottom: 1px solid #1a1b1e;
  flex-shrink: 0;
}

.dc-encryption-badge {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 10px;
  color: #3ba55d;
  background: rgba(59, 165, 93, 0.1);
  flex-shrink: 0;
}

.dc-channels-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 8px 8px;
}

.dc-channel-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 0 8px;
  margin-bottom: 4px;
  color: #949ba4;
}

.dc-channel-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 2px;
}

.dc-channel-item:hover {
  background: #35373c;
  color: #dbdee1;
}

.dc-channel-item.active {
  background: #404249;
  color: white;
}

.dc-channel-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-vc-count {
  font-size: 11px;
  color: #949ba4;
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: 8px;
}

.dc-voice-users {
  padding-left: 28px;
}

.dc-voice-user {
  font-size: 12px;
  padding: 2px 0;
  color: #b5bac1;
  display: flex;
  align-items: center;
}

/* Voice Connected Panel */
.dc-voice-panel {
  flex-shrink: 0;
  background: #232428;
  border-top: 1px solid #1a1b1e;
  padding: 12px 8px 8px;
}

.dc-voice-panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.dc-voice-panel-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.dc-voice-panel-status {
  display: flex;
  align-items: center;
}

.dc-voice-status-text {
  font-size: 13px;
  font-weight: 600;
  color: #23a559;
}

.dc-voice-panel-channel {
  font-size: 11px;
  color: #949ba4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 1px;
}

.dc-voice-hangup-btn {
  color: #b5bac1 !important;
  border-radius: 4px;
  flex-shrink: 0;
}
.dc-voice-hangup-btn:hover {
  color: #ed4245 !important;
  background: rgba(237, 66, 69, 0.15) !important;
}

.dc-voice-panel-controls {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.dc-vc-btn {
  color: #b5bac1 !important;
  border-radius: 8px !important;
  width: 36px !important;
  height: 36px !important;
  background: #2b2d31 !important;
}
.dc-vc-btn:hover {
  color: #dbdee1 !important;
  background: #404249 !important;
}

.dc-vc-btn-danger {
  color: #fff !important;
  background: #ed4245 !important;
}
.dc-vc-btn-danger:hover {
  background: #d83c3e !important;
}

.dc-vc-btn-active {
  color: #fff !important;
  background: #5865f2 !important;
}
.dc-vc-btn-active:hover {
  background: #4752c4 !important;
}

/* Soundboard popup */
.dc-soundboard-popup {
  background: #111214;
  border-radius: 8px;
  padding: 12px;
  width: 260px;
  max-height: 300px;
  overflow-y: auto;
}

.dc-soundboard-header {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #b5bac1;
  margin-bottom: 8px;
  padding: 0 4px;
}

.dc-soundboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.dc-soundboard-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: #2b2d31;
  color: #dbdee1;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  transition: background 0.15s;
}
.dc-soundboard-item:hover {
  background: #404249;
}
.dc-soundboard-item:active {
  background: #5865f2;
  color: white;
}

.dc-soundboard-emoji {
  font-size: 16px;
  flex-shrink: 0;
}

.dc-soundboard-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* User Panel */
.dc-user-panel {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  background: #232428;
  flex-shrink: 0;
}

.dc-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dc-role-badge-small {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
}

@media (max-width: 960px) {
  .dc-sidebar {
    width: 60px;
  }
  .dc-sidebar-header span,
  .dc-channel-label,
  .dc-channel-name,
  .dc-vc-count,
  .dc-user-panel span,
  .dc-user-info,
  .dc-encryption-badge,
  .dc-voice-panel-channel,
  .dc-voice-status-text {
    display: none;
  }
  .dc-channel-item {
    justify-content: center;
    padding: 8px;
  }
  .dc-voice-panel-controls {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .dc-sidebar {
    width: 50px;
  }
}
</style>
