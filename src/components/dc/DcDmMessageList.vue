<template>
  <div class="dc-dm-messages" ref="containerEl">
    <!-- Load more spinner / beginning indicator -->
    <div v-if="isLoadingMore" class="dc-dm-load-more">
      <v-progress-circular indeterminate size="20" width="2" color="#5865f2" />
    </div>
    <div v-else-if="hasMoreMessages === false && messages.length > 0" class="dc-dm-conv-start">
      <v-icon size="40" color="#5865f2" class="mb-2">mdi-lock-check</v-icon>
      <div>{{ $t('dc_dm_e2ee_start') }}</div>
    </div>

    <div v-if="messages.length === 0 && !isLoadingMore" class="dc-dm-messages-empty">
      <v-icon size="48" color="#5865f2" class="mb-3">mdi-lock-check</v-icon>
      <div class="dc-dm-messages-empty-title">{{ $t('dc_dm_e2ee_start') }}</div>
      <div class="dc-dm-messages-empty-sub">{{ $t('dc_dm_e2ee_desc') }}</div>
    </div>

    <div
      v-for="msg in messages"
      :key="msg.id"
      class="dc-dm-msg"
      :class="{ 'dc-dm-msg-own': msg.senderId === currentUserId }"
    >
      <div class="dc-dm-msg-bubble">

        <!-- FILE message -->
        <template v-if="msg.type === 'file'">
          <!-- Image preview (only when done and is an image) -->
          <div
            v-if="isImageMime(msg.fileMimeType) && msg.fileStatus === 'done' && msg.fileBlob"
            class="dc-dm-file-img-wrap"
          >
            <img
              :src="getBlobUrl(msg)"
              class="dc-dm-file-img"
              :alt="msg.fileName"
              @click="openImage(msg)"
            />
          </div>

          <!-- File info row -->
          <div class="dc-dm-file-info">
            <v-icon size="28" class="dc-dm-file-icon">{{ fileIcon(msg.fileMimeType) }}</v-icon>
            <div class="dc-dm-file-details">
              <div class="dc-dm-file-name">{{ msg.fileName || 'File' }}</div>
              <div class="dc-dm-file-meta">
                <span>{{ formatFileSize(msg.fileSize) }}</span>
                <span v-if="msg.fileStatus === 'sending'" class="dc-dm-file-status-label">
                  {{ $t('dc_dm_file_sending') }} {{ msg.fileProgress ?? 0 }}%
                </span>
                <span v-else-if="msg.fileStatus === 'receiving'" class="dc-dm-file-status-label">
                  {{ $t('dc_dm_file_receiving') }} {{ msg.fileProgress ?? 0 }}%
                </span>
                <span v-else-if="msg.fileStatus === 'error'" class="dc-dm-file-status-err">
                  {{ $t('dc_dm_file_error') }}
                </span>
                <span v-else-if="msg.fileStatus === 'cancelled'" class="dc-dm-file-status-err">
                  {{ $t('dc_dm_file_cancelled') }}
                </span>
              </div>
            </div>
            <!-- Download button when done -->
            <button
              v-if="msg.fileStatus === 'done' && msg.fileBlob"
              class="dc-dm-file-dl-btn"
              @click="downloadFile(msg)"
              :title="$t('dc_dm_file_download')"
            >
              <v-icon size="18">mdi-download</v-icon>
            </button>
          </div>

          <!-- Progress bar -->
          <div
            v-if="msg.fileStatus === 'sending' || msg.fileStatus === 'receiving'"
            class="dc-dm-file-progress-wrap"
          >
            <div
              class="dc-dm-file-progress-bar"
              :style="{ width: (msg.fileProgress ?? 0) + '%' }"
            ></div>
          </div>
        </template>

        <!-- TEXT message -->
        <div v-else class="dc-dm-msg-text">{{ msg.text }}</div>

        <!-- Meta row (time + delivery status) -->
        <div class="dc-dm-msg-meta">
          <span class="dc-dm-msg-time">{{ formatTime(msg.timestamp) }}</span>
          <v-icon
            v-if="msg.senderId === currentUserId"
            size="14"
            :color="statusColor(msg.status)"
            class="ml-1"
          >{{ statusIcon(msg.status) }}</v-icon>
        </div>
      </div>
    </div>

    <div v-if="peerTyping" class="dc-dm-typing">
      <span class="dc-dm-typing-dots">
        <span></span><span></span><span></span>
      </span>
      {{ peerNickname }} {{ $t('dc_dm_typing') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { DcDmMessage } from '@/types/DcDmTypes'

const props = defineProps<{
  messages: DcDmMessage[]
  currentUserId: string
  peerNickname: string
  peerTyping?: boolean
  hasMoreMessages?: boolean
  isLoadingMore?: boolean
}>()

const emit = defineEmits<{
  'load-more': []
}>()

const containerEl = ref<HTMLElement | null>(null)
const blobUrls = new Map<string, string>()

// Saved scroll state when loading older messages
let savedScrollState: { height: number; top: number } | null = null

// Auto-scroll logic: restore position when prepending, scroll-to-bottom for new messages
watch(() => props.messages.length, () => {
  if (savedScrollState) {
    nextTick(() => {
      if (containerEl.value && savedScrollState) {
        containerEl.value.scrollTop =
          savedScrollState.top + (containerEl.value.scrollHeight - savedScrollState.height)
        savedScrollState = null
      }
    })
  } else {
    nextTick(() => {
      if (containerEl.value) {
        containerEl.value.scrollTop = containerEl.value.scrollHeight
      }
    })
  }
}, { immediate: true })

function onScroll() {
  const container = containerEl.value
  if (!container || savedScrollState || props.isLoadingMore) return
  if (container.scrollTop < 60 && props.hasMoreMessages) {
    savedScrollState = { height: container.scrollHeight, top: container.scrollTop }
    emit('load-more')
  }
}

onMounted(() => {
  containerEl.value?.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  containerEl.value?.removeEventListener('scroll', onScroll)
  blobUrls.forEach(url => URL.revokeObjectURL(url))
  blobUrls.clear()
})

function getBlobUrl(msg: DcDmMessage): string {
  const key = msg.fileId || String(msg.id)
  if (!blobUrls.has(key) && msg.fileBlob) {
    blobUrls.set(key, URL.createObjectURL(msg.fileBlob))
  }
  return blobUrls.get(key) || ''
}

function openImage(msg: DcDmMessage): void {
  const url = getBlobUrl(msg)
  if (url) window.open(url, '_blank')
}

function downloadFile(msg: DcDmMessage): void {
  const url = getBlobUrl(msg)
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = msg.fileName || 'file'
  a.click()
}

function isImageMime(mime?: string): boolean {
  return !!mime && mime.startsWith('image/')
}

function fileIcon(mime?: string): string {
  if (!mime) return 'mdi-file-outline'
  if (mime.startsWith('image/')) return 'mdi-file-image-outline'
  if (mime === 'application/pdf') return 'mdi-file-pdf-box'
  if (mime.includes('word') || mime.includes('document')) return 'mdi-file-word-box'
  if (mime.includes('sheet') || mime.includes('excel')) return 'mdi-file-excel-box'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'mdi-file-powerpoint-box'
  if (mime === 'text/plain') return 'mdi-file-document-outline'
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z') || mime.includes('compressed')) return 'mdi-zip-box-outline'
  return 'mdi-file-outline'
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function statusIcon(status: string): string {
  switch (status) {
    case 'pending': return 'mdi-clock-outline'
    case 'sent': return 'mdi-check'
    case 'delivered': return 'mdi-check-all'
    default: return 'mdi-check'
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return '#949ba4'
    case 'sent': return '#b5bac1'
    case 'delivered': return '#23a559'
    default: return '#949ba4'
  }
}
</script>

<style scoped>
.dc-dm-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #313338;
}

.dc-dm-messages-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #949ba4;
  text-align: center;
  padding: 32px;
}

.dc-dm-messages-empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #dbdee1;
  margin-bottom: 4px;
}

.dc-dm-messages-empty-sub {
  font-size: 13px;
  color: #949ba4;
  max-width: 300px;
}

.dc-dm-msg {
  display: flex;
  max-width: 75%;
}

.dc-dm-msg-own {
  align-self: flex-end;
}

.dc-dm-msg-bubble {
  background: #2b2d31;
  border-radius: 12px;
  padding: 8px 12px;
  max-width: 100%;
}

.dc-dm-msg-own .dc-dm-msg-bubble {
  background: #5865f2;
}

.dc-dm-msg-text {
  font-size: 14px;
  color: #dbdee1;
  word-break: break-word;
  white-space: pre-wrap;
}

.dc-dm-msg-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 2px;
}

.dc-dm-msg-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

/* ===================== LOAD MORE ===================== */
.dc-dm-load-more {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px 0;
}

.dc-dm-conv-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 12px 0;
  font-size: 13px;
  color: #949ba4;
  text-align: center;
}

/* ===================== FILE MESSAGE ===================== */
.dc-dm-file-img-wrap {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 300px;
}

.dc-dm-file-img {
  display: block;
  max-width: 100%;
  max-height: 200px;
  object-fit: cover;
  cursor: pointer;
  border-radius: 8px;
  transition: opacity 0.15s;
}

.dc-dm-file-img:hover {
  opacity: 0.9;
}

.dc-dm-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  max-width: 300px;
  padding: 2px 0;
}

.dc-dm-file-icon {
  color: #949ba4;
  flex-shrink: 0;
}

.dc-dm-file-details {
  flex: 1;
  min-width: 0;
}

.dc-dm-file-name {
  font-size: 13px;
  font-weight: 600;
  color: #dbdee1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-dm-file-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  flex-wrap: wrap;
}

.dc-dm-file-status-label {
  color: #faa61a;
}

.dc-dm-file-status-err {
  color: #ed4245;
}

.dc-dm-file-dl-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #dbdee1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.dc-dm-file-dl-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dc-dm-file-progress-wrap {
  margin-top: 6px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.dc-dm-file-progress-bar {
  height: 100%;
  background: #23a559;
  border-radius: 2px;
  transition: width 0.2s;
}

.dc-dm-msg-own .dc-dm-file-progress-bar {
  background: rgba(255, 255, 255, 0.7);
}

/* ===================== TYPING ===================== */
.dc-dm-typing {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
  color: #949ba4;
}

.dc-dm-typing-dots {
  display: inline-flex;
  gap: 2px;
}

.dc-dm-typing-dots span {
  width: 6px;
  height: 6px;
  background: #949ba4;
  border-radius: 50%;
  animation: dc-dm-bounce 1.4s infinite ease-in-out;
}

.dc-dm-typing-dots span:nth-child(1) { animation-delay: 0s; }
.dc-dm-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.dc-dm-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dc-dm-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
