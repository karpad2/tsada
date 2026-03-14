<template>
  <div>
    <!-- Reply Bar -->
    <div v-if="replyingTo" class="dc-reply-bar">
      <v-icon size="16" class="mr-2">mdi-reply</v-icon>
      <span class="text-medium-emphasis mr-1">{{ $t('dc_reply_to') }}</span>
      <span class="font-weight-bold mr-2" :style="{ color: replyColor }">
        {{ replyingTo.nickname }}
      </span>
      <span class="dc-reply-bar-text">{{ truncateText(replyingTo.text, 60) }}</span>
      <v-spacer />
      <v-btn icon size="x-small" variant="text" @click="emit('cancel-reply')">
        <v-icon size="16">mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Message Input -->
    <div class="dc-input">
      <v-text-field
        v-if="canWrite"
        v-model="messageInput"
        :placeholder="$t('dc_message_placeholder', { channel: channelName })"
        variant="solo-filled"
        density="comfortable"
        hide-details
        bg-color="grey-darken-3"
        @keyup.enter="sendMessage"
      >
        <template #prepend-inner>
          <!-- GIF button -->
          <v-menu v-model="showGifPicker" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon size="small" variant="text" class="mr-1">
                <v-icon size="20">mdi-gif</v-icon>
              </v-btn>
            </template>
            <v-card class="dc-gif-picker">
              <v-text-field
                v-model="gifSearch"
                :placeholder="$t('dc_gif_search')"
                variant="solo-filled"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-magnify"
                @input="searchGifs"
              />
              <div class="dc-gif-grid">
                <img
                  v-for="gif in gifs"
                  :key="gif.id"
                  :src="gif.preview"
                  class="dc-gif-item"
                  @click="sendGif(gif.url)"
                />
                <div v-if="gifs.length === 0" class="text-center text-grey pa-4">
                  {{ $t('dc_gif_hint') }}
                </div>
              </div>
            </v-card>
          </v-menu>
          <!-- Emoji picker -->
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon size="small" variant="text">
                <v-icon size="20">mdi-emoticon-happy-outline</v-icon>
              </v-btn>
            </template>
            <div class="dc-emoji-picker dc-emoji-picker-large">
              <!-- Custom server emojis -->
              <template v-if="serverEmojis.length > 0">
                <div class="dc-emoji-category">{{ $t('dc_custom_emojis') }}</div>
                <div class="dc-emoji-row">
                  <img
                    v-for="ce in serverEmojis"
                    :key="ce.$id"
                    :src="chatService.getEmojiUrl(ce.file_id)"
                    :title="':' + ce.name + ':'"
                    class="dc-custom-emoji-item"
                    @click="insertEmoji(':' + ce.name + ':')"
                  />
                </div>
              </template>
              <div class="dc-emoji-category">{{ $t('dc_emoji_faces') }}</div>
              <div class="dc-emoji-row">
                <span v-for="emoji in emojiCategories.faces" :key="emoji" class="dc-emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</span>
              </div>
              <div class="dc-emoji-category">{{ $t('dc_emoji_gestures') }}</div>
              <div class="dc-emoji-row">
                <span v-for="emoji in emojiCategories.gestures" :key="emoji" class="dc-emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</span>
              </div>
              <div class="dc-emoji-category">{{ $t('dc_emoji_symbols') }}</div>
              <div class="dc-emoji-row">
                <span v-for="emoji in emojiCategories.symbols" :key="emoji" class="dc-emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</span>
              </div>
              <div class="dc-emoji-category">{{ $t('dc_emoji_objects') }}</div>
              <div class="dc-emoji-row">
                <span v-for="emoji in emojiCategories.objects" :key="emoji" class="dc-emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</span>
              </div>
            </div>
          </v-menu>
        </template>
        <template #append-inner>
          <v-btn icon size="small" variant="text" :disabled="!messageInput.trim()" @click="sendMessage">
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </template>
      </v-text-field>
      <div v-else class="dc-no-write-access">
        <v-icon size="18" class="mr-2">mdi-lock</v-icon>
        {{ $t('dc_no_write_access') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DcMessage, DcCustomEmoji, DcChatService } from '@/services/DcChatService'

const props = defineProps<{
  channelName: string
  canWrite: boolean
  replyingTo: DcMessage | null
  replyColor: string
  serverEmojis: DcCustomEmoji[]
  chatService: DcChatService
}>()

const emit = defineEmits<{
  'send': [text: string, replyId?: string]
  'cancel-reply': []
}>()

const messageInput = ref('')
const showGifPicker = ref(false)
const gifSearch = ref('')
const gifs = ref<{ id: string; preview: string; url: string }[]>([])
let gifSearchTimeout: ReturnType<typeof setTimeout> | null = null

const emojiCategories = {
  faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🔯', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'],
  objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🕹️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎']
}

function insertEmoji(emoji: string) {
  messageInput.value += emoji
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}

function sendMessage() {
  const text = messageInput.value.trim()
  if (!text) return
  messageInput.value = ''
  const replyId = props.replyingTo?.$id || undefined
  emit('send', text, replyId)
}

async function searchGifs() {
  if (gifSearchTimeout) clearTimeout(gifSearchTimeout)

  gifSearchTimeout = setTimeout(async () => {
    if (!gifSearch.value.trim()) {
      gifs.value = []
      return
    }

    try {
      const response = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(gifSearch.value)}&key=LIVDSRZULELA&limit=20&media_filter=minimal`)
      const data = await response.json()

      gifs.value = data.results?.map((r: any) => ({
        id: r.id,
        preview: r.media[0]?.tinygif?.url || r.media[0]?.nanogif?.url,
        url: r.media[0]?.gif?.url || r.media[0]?.mediumgif?.url
      })) || []
    } catch (error) {
      console.error('GIF search failed:', error)
      gifs.value = []
    }
  }, 500)
}

function sendGif(url: string) {
  emit('send', url)
  showGifPicker.value = false
  gifSearch.value = ''
  gifs.value = []
}
</script>

<style scoped>
.dc-reply-bar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #2b2d31;
  border-top: 1px solid #3f4147;
  color: #dbdee1;
  font-size: 13px;
  flex-shrink: 0;
}

.dc-reply-bar-text {
  color: #949ba4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dc-input {
  padding: 0 16px 16px;
  flex-shrink: 0;
}

.dc-no-write-access {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #2b2d31;
  border-radius: 8px;
  color: #949ba4;
  font-size: 14px;
}

.dc-emoji-picker {
  background: #2b2d31;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  max-width: 250px;
}

.dc-emoji-picker-large {
  max-width: 350px;
  max-height: 300px;
  overflow-y: auto;
}

.dc-emoji-category {
  width: 100%;
  font-size: 11px;
  color: #949ba4;
  margin: 8px 0 4px;
  font-weight: 600;
}

.dc-emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  width: 100%;
}

.dc-emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.dc-emoji-item:hover {
  background: #3f4147;
}

.dc-custom-emoji-item {
  width: 28px;
  height: 28px;
  object-fit: contain;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px;
  transition: background 0.15s;
}

.dc-custom-emoji-item:hover {
  background: #3f4147;
}

.dc-gif-picker {
  width: 350px;
  max-height: 400px;
  background: #2b2d31;
  overflow: hidden;
}

.dc-gif-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 8px;
  max-height: 340px;
  overflow-y: auto;
}

.dc-gif-item {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s;
}

.dc-gif-item:hover {
  transform: scale(1.05);
}
</style>
