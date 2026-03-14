<template>
  <div class="dc-voice-view">
    <!-- Screen share takes priority if someone is sharing -->
    <div v-if="remoteScreenStream" class="dc-vv-screen-share">
      <video ref="screenVideoEl" class="dc-vv-screen-video" autoplay playsinline></video>
      <div class="dc-vv-screen-label">
        <v-icon size="14" class="mr-1">mdi-monitor-share</v-icon>
        {{ screenShareUser }} {{ $t('dc_screen_sharing') }}
      </div>
    </div>

    <!-- Users grid -->
    <div class="dc-vv-users-area" :class="{ 'dc-vv-has-screen': remoteScreenStream }">
      <div class="dc-vv-grid" :class="gridClass">
        <div
          v-for="user in channelUsers"
          :key="user"
          class="dc-vv-user-tile"
          :class="{ 'dc-vv-user-speaking': false }"
        >
          <!-- Video feed when stream is available -->
          <div v-if="remoteVideoStreams[user]" class="dc-vv-user-video-area">
            <video
              :ref="(el) => setVideoRef(user, el as HTMLVideoElement | null)"
              class="dc-vv-user-video"
              autoplay
              playsinline
              muted
            ></video>
          </div>
          <!-- Avatar fallback when no video -->
          <div v-else class="dc-vv-user-avatar-area">
            <div class="dc-vv-user-avatar" :style="{ backgroundColor: getUserColor(user) }">
              {{ user.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="dc-vv-user-bar">
            <span class="dc-vv-user-name">{{ user }}</span>
            <v-icon
              v-if="user === currentUser?.nickname && voiceMuted"
              size="14" color="#ed4245" class="ml-1"
            >mdi-microphone-off</v-icon>
            <v-icon
              v-if="remoteVideoStreams[user]"
              size="14" color="#23a559" class="ml-1"
            >mdi-video</v-icon>
          </div>
        </div>
      </div>

      <!-- Empty state when alone -->
      <div v-if="channelUsers.length <= 1" class="dc-vv-empty">
        <v-icon size="48" color="#5865f2" class="mb-3">mdi-account-voice</v-icon>
        <div class="dc-vv-empty-title">{{ $t('dc_voice_no_others') }}</div>
        <div class="dc-vv-empty-subtitle">{{ $t('dc_voice_invite_hint') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import type { DcUser } from '@/services/DcChatService'
import { DC_ROLES, type DcRoleType } from '@/services/DcChatService'

const props = defineProps<{
  channelUsers: string[]
  currentUser: DcUser | null
  allUsers: DcUser[]
  voiceMuted: boolean
  voiceCameraOn: boolean
  voiceScreenSharing: boolean
  remoteScreenStream: MediaStream | null
  screenShareUser: string
  remoteVideoStreams: Record<string, MediaStream>
}>()

const screenVideoEl = ref<HTMLVideoElement | null>(null)
const videoRefs = new Map<string, HTMLVideoElement>()

function setVideoRef(user: string, el: HTMLVideoElement | null) {
  if (el) {
    videoRefs.set(user, el)
    // Set srcObject immediately
    const stream = props.remoteVideoStreams[user]
    if (stream && el.srcObject !== stream) {
      el.srcObject = stream
    }
  } else {
    videoRefs.delete(user)
  }
}

// Watch for stream changes and update video elements
watch(() => props.remoteVideoStreams, (streams) => {
  nextTick(() => {
    for (const [user, el] of videoRefs) {
      const stream = streams[user]
      if (stream && el.srcObject !== stream) {
        el.srcObject = stream
      } else if (!stream) {
        el.srcObject = null
      }
    }
  })
}, { deep: true })

watch(() => props.remoteScreenStream, (stream) => {
  nextTick(() => {
    if (screenVideoEl.value && stream) {
      screenVideoEl.value.srcObject = stream
    }
  })
}, { immediate: true })

const gridClass = computed(() => {
  const count = props.channelUsers.length
  if (props.remoteScreenStream) return 'dc-vv-grid-sidebar'
  if (count <= 1) return 'dc-vv-grid-1'
  if (count === 2) return 'dc-vv-grid-2'
  if (count <= 4) return 'dc-vv-grid-4'
  if (count <= 9) return 'dc-vv-grid-9'
  return 'dc-vv-grid-many'
})

function getUserColor(nickname: string): string {
  const user = props.allUsers.find(u => u.nickname === nickname)
  const role = (user?.role || 'member') as DcRoleType
  return DC_ROLES[role]?.color || '#5865f2'
}

onBeforeUnmount(() => {
  videoRefs.clear()
})
</script>

<style scoped>
.dc-voice-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #313338;
  overflow: hidden;
}

/* Screen share section */
.dc-vv-screen-share {
  flex: 1;
  min-height: 0;
  position: relative;
  background: #1e1f22;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dc-vv-screen-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.dc-vv-screen-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #dbdee1;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
}

/* Users area */
.dc-vv-users-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-height: 0;
  position: relative;
}

.dc-vv-has-screen {
  flex: 0 0 auto;
  height: 160px;
  padding: 8px;
}

/* Grid layouts */
.dc-vv-grid {
  display: grid;
  gap: 8px;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 800px;
}

.dc-vv-grid-1 {
  grid-template-columns: 1fr;
  max-width: 400px;
  max-height: 400px;
}

.dc-vv-grid-2 {
  grid-template-columns: 1fr 1fr;
  max-width: 700px;
  max-height: 400px;
}

.dc-vv-grid-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.dc-vv-grid-9 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.dc-vv-grid-many {
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 1fr;
}

.dc-vv-grid-sidebar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  height: 100%;
}

.dc-vv-grid-sidebar .dc-vv-user-tile {
  min-width: 120px;
  max-width: 160px;
}

/* User tile */
.dc-vv-user-tile {
  background: #2b2d31;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.dc-vv-user-tile:hover {
  outline: 2px solid #5865f2;
}

.dc-vv-user-speaking {
  outline: 2px solid #23a559 !important;
}

/* Video area */
.dc-vv-user-video-area {
  flex: 1;
  min-height: 0;
  background: #1e1f22;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.dc-vv-user-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Avatar area */
.dc-vv-user-avatar-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background: #1e1f22;
}

.dc-vv-user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: white;
}

.dc-vv-has-screen .dc-vv-user-avatar {
  width: 48px;
  height: 48px;
  font-size: 20px;
}

.dc-vv-user-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.4);
}

.dc-vv-user-name {
  font-size: 13px;
  font-weight: 500;
  color: #dbdee1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Empty state */
.dc-vv-empty {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #949ba4;
  text-align: center;
}

.dc-vv-empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #dbdee1;
  margin-bottom: 4px;
}

.dc-vv-empty-subtitle {
  font-size: 13px;
  color: #949ba4;
}

@media (max-width: 600px) {
  .dc-vv-grid-2,
  .dc-vv-grid-4 {
    grid-template-columns: 1fr;
  }
  .dc-vv-grid-9,
  .dc-vv-grid-many {
    grid-template-columns: 1fr 1fr;
  }
  .dc-vv-user-avatar {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
}
</style>
