<template>
  <div class="dc-dm-chat">
    <!-- Header -->
    <div class="dc-dm-chat-header">
      <v-icon size="20" color="#949ba4" class="mr-2">mdi-at</v-icon>
      <span class="dc-dm-chat-peer">{{ peerNickname }}</span>
      <div class="dc-dm-chat-status" :class="'dc-dm-cs-' + connectionState">
        {{ connectionLabel }}
      </div>
      <v-spacer />
      <v-icon size="20" color="#949ba4" class="mr-3 dc-dm-chat-action-icon" @click="emit('start-voice-call')">mdi-phone</v-icon>
      <v-icon size="20" color="#949ba4" class="mr-4 dc-dm-chat-action-icon" @click="emit('start-video-call')">mdi-video</v-icon>
      <v-icon size="18" color="#949ba4" class="dc-dm-chat-close" @click="emit('close')">mdi-close</v-icon>
    </div>

    <!-- Messages -->
    <DcDmMessageList
      :messages="messages"
      :current-user-id="currentUserId"
      :peer-nickname="peerNickname"
      :peer-typing="peerTyping"
      :has-more-messages="hasMoreMessages"
      :is-loading-more="isLoadingMore"
      @load-more="emit('load-more')"
    />

    <!-- Input -->
    <DcDmMessageInput
      :peer-nickname="peerNickname"
      :disabled="connectionState !== 'connected'"
      @send="emit('send', $event)"
      @send-file="emit('send-file', $event)"
      @typing="emit('typing')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DcDmMessage } from '@/types/DcDmTypes'
import type { DmConnectionState } from '@/utils/dcDmManager'
import DcDmMessageList from './DcDmMessageList.vue'
import DcDmMessageInput from './DcDmMessageInput.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  peerNickname: string
  messages: DcDmMessage[]
  currentUserId: string
  connectionState: DmConnectionState
  peerTyping?: boolean
  hasMoreMessages?: boolean
  isLoadingMore?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  'send-file': [file: File]
  typing: []
  close: []
  'start-voice-call': []
  'start-video-call': []
  'load-more': []
}>()

const connectionLabel = computed(() => {
  switch (props.connectionState) {
    case 'connected': return t('dc_dm_online')
    case 'connecting': return t('dc_dm_connecting')
    default: return t('dc_dm_offline')
  }
})
</script>

<style scoped>
.dc-dm-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #313338;
  min-width: 0;
}

.dc-dm-chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #2b2d31;
  border-bottom: 1px solid #1e1f22;
  min-height: 48px;
}

.dc-dm-chat-peer {
  font-size: 16px;
  font-weight: 600;
  color: #f2f3f5;
}

.dc-dm-chat-status {
  font-size: 12px;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 10px;
}

.dc-dm-cs-connected {
  color: #23a559;
  background: rgba(35, 165, 89, 0.15);
}

.dc-dm-cs-connecting {
  color: #faa61a;
  background: rgba(250, 166, 26, 0.15);
}

.dc-dm-cs-disconnected {
  color: #949ba4;
  background: rgba(148, 155, 164, 0.15);
}

.dc-dm-chat-action-icon {
  cursor: pointer;
  opacity: 0.7;
}

.dc-dm-chat-action-icon:hover {
  opacity: 1;
  color: #f2f3f5 !important;
}

.dc-dm-chat-close {
  cursor: pointer;
  opacity: 0.7;
}

.dc-dm-chat-close:hover {
  opacity: 1;
}
</style>
