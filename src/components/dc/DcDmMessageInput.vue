<template>
  <div class="dc-dm-input">
    <div class="dc-dm-input-row">
      <!-- File attachment button -->
      <button
        class="dc-dm-attach-btn"
        :disabled="disabled"
        :title="$t('dc_dm_file_attach')"
        @click="triggerFileInput"
      >
        <v-icon size="20">mdi-paperclip</v-icon>
      </button>
      <input
        ref="fileInputEl"
        type="file"
        class="dc-dm-file-input"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
        @change="onFileSelected"
      />

      <input
        ref="inputEl"
        v-model="text"
        class="dc-dm-input-field"
        :placeholder="$t('dc_dm_message_placeholder', { name: peerNickname })"
        @keydown.enter.exact.prevent="send"
        @input="onTyping"
        :disabled="disabled"
      />
      <button class="dc-dm-send-btn" @click="send" :disabled="!text.trim() || disabled">
        <v-icon size="20">mdi-send</v-icon>
      </button>
    </div>
    <div class="dc-dm-e2ee-badge">
      <v-icon size="12" color="#23a559" class="mr-1">mdi-lock</v-icon>
      {{ $t('dc_dm_e2ee') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  peerNickname: string
  disabled?: boolean
  maxFileSize?: number
}>()

const emit = defineEmits<{
  send: [text: string]
  'send-file': [file: File]
  typing: []
}>()

const text = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)
let typingTimeout: ReturnType<typeof setTimeout> | null = null

function send() {
  const msg = text.value.trim()
  if (!msg) return
  emit('send', msg)
  text.value = ''
}

function onTyping() {
  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    emit('typing')
  }, 200)
}

function triggerFileInput() {
  fileInputEl.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const maxSize = props.maxFileSize ?? 100 * 1024 * 1024
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    alert(t('dc_dm_file_too_large', { size: maxMB }))
    input.value = ''
    return
  }

  emit('send-file', file)
  input.value = ''
}

function focus() {
  inputEl.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.dc-dm-input {
  padding: 0 16px 12px 16px;
  background: #313338;
}

.dc-dm-input-row {
  display: flex;
  align-items: center;
  background: #383a40;
  border-radius: 8px;
  padding: 4px 4px 4px 8px;
  gap: 4px;
}

.dc-dm-attach-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #949ba4;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  flex-shrink: 0;
}

.dc-dm-attach-btn:hover:not(:disabled) {
  color: #dbdee1;
}

.dc-dm-attach-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dc-dm-file-input {
  display: none;
}

.dc-dm-input-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #dbdee1;
  font-size: 14px;
  padding: 8px 0;
}

.dc-dm-input-field::placeholder {
  color: #6d6f78;
}

.dc-dm-input-field:disabled {
  opacity: 0.5;
}

.dc-dm-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  background: #5865f2;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}

.dc-dm-send-btn:hover:not(:disabled) {
  background: #4752c4;
}

.dc-dm-send-btn:disabled {
  background: #4e5058;
  cursor: not-allowed;
}

.dc-dm-e2ee-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0 0 0;
  font-size: 11px;
  color: #949ba4;
}
</style>
