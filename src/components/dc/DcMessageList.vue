<template>
  <div ref="messagesContainer" class="dc-messages" @scroll="onScroll" @click="closeContextMenu">
    <div v-if="messages.length === 0" class="text-center text-medium-emphasis pa-8">
      <v-icon size="48" color="grey">mdi-message-outline</v-icon>
      <p class="mt-2">{{ $t('dc_no_messages') }}</p>
    </div>
    <div
      v-for="msg in messages"
      :key="msg.$id"
      :data-msg-id="msg.$id"
      class="dc-message"
      :class="{ 'dc-message-own': msg.clientId === clientId, 'dc-message-ctx-active': contextMenu.msg?.$id === msg.$id }"
      @contextmenu.prevent="openContextMenu($event, msg)"
    >
      <div class="dc-message-avatar">
        <v-icon size="32" :color="getUserColor(msg.clientId, msg.nickname)">mdi-account-circle</v-icon>
      </div>
      <div class="dc-message-content">
        <!-- Reply reference -->
        <div v-if="msg.replyTo && getReplyMessage(msg.replyTo)" class="dc-reply-reference" @click="scrollToMessage(msg.replyTo!)">
          <v-icon size="14" class="mr-1">mdi-reply</v-icon>
          <span class="dc-reply-author" :style="{ color: getUserColor(getReplyMessage(msg.replyTo!)!.clientId, getReplyMessage(msg.replyTo!)!.nickname) }">
            {{ getReplyMessage(msg.replyTo!)!.nickname }}
          </span>
          <span class="dc-reply-text">{{ truncateText(getReplyMessage(msg.replyTo!)!.text, 80) }}</span>
        </div>
        <div class="dc-message-header">
          <span class="dc-message-name" :style="{ color: getUserColor(msg.clientId, msg.nickname) }">
            {{ msg.nickname }}
          </span>
          <!-- Role badge -->
          <span
            v-if="userRolesMap[msg.nickname]"
            class="dc-role-badge"
            :style="{ backgroundColor: DC_ROLES[userRolesMap[msg.nickname]]?.color + '33', color: DC_ROLES[userRolesMap[msg.nickname]]?.color }"
          >
            <v-icon size="10" class="mr-1">{{ DC_ROLES[userRolesMap[msg.nickname]]?.icon }}</v-icon>
            {{ $t('dc_role_' + userRolesMap[msg.nickname]) }}
          </span>
          <span class="dc-message-time">{{ formatTime(msg.timestamp) }}</span>
          <!-- Message actions (hover) -->
          <div class="dc-message-actions">
            <v-btn
              v-if="canWrite"
              icon size="x-small" variant="text"
              class="dc-message-action"
              @click="emit('reply', msg)"
            >
              <v-icon size="14">mdi-reply</v-icon>
            </v-btn>
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" icon size="x-small" variant="text" class="dc-message-action">
                  <v-icon size="14">mdi-emoticon-outline</v-icon>
                </v-btn>
              </template>
              <div class="dc-emoji-picker">
                <span
                  v-for="emoji in quickEmojis"
                  :key="emoji"
                  class="dc-emoji-item"
                  @click="emit('toggle-reaction', msg, emoji)"
                >{{ emoji }}</span>
              </div>
            </v-menu>
            <v-btn
              v-if="isModerator"
              icon size="x-small" variant="text" color="error"
              class="dc-message-action"
              @click="emit('delete-msg', msg)"
            >
              <v-icon size="14">mdi-delete</v-icon>
            </v-btn>
            <v-btn
              v-if="isModerator && msg.clientId !== clientId"
              icon size="x-small" variant="text" color="warning"
              class="dc-message-action"
              @click="emit('ban-user', msg)"
            >
              <v-icon size="14">mdi-gavel</v-icon>
            </v-btn>
          </div>
        </div>
        <!-- Message text with GIF/emoji support -->
        <div class="dc-message-text" v-html="renderMessage(msg.text)"></div>
        <!-- Reactions -->
        <div v-if="messageReactions[msg.$id!]?.length" class="dc-reactions">
          <div
            v-for="(group, emoji) in groupReactions(messageReactions[msg.$id!])"
            :key="emoji"
            class="dc-reaction"
            :class="{ 'dc-reaction-own': group.some(r => r.clientId === clientId) }"
            @click="emit('toggle-reaction', msg, emoji as string)"
          >
            <span class="dc-reaction-emoji">{{ emoji }}</span>
            <span class="dc-reaction-count">{{ group.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right-click Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="dc-context-menu"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        @click.stop
      >
        <!-- Quick reactions row -->
        <div class="dc-ctx-reactions">
          <span
            v-for="emoji in quickEmojis"
            :key="emoji"
            class="dc-ctx-reaction-btn"
            @click="ctxReaction(emoji)"
          >{{ emoji }}</span>
        </div>

        <div class="dc-ctx-separator"></div>

        <!-- Add Reaction -->
        <div class="dc-ctx-item" @click="ctxAddReaction">
          <v-icon size="18" class="dc-ctx-icon">mdi-emoticon-plus-outline</v-icon>
          <span>{{ $t('dc_ctx_add_reaction') }}</span>
          <v-icon size="14" class="dc-ctx-arrow">mdi-chevron-right</v-icon>
        </div>

        <!-- Reply -->
        <div v-if="canWrite" class="dc-ctx-item" @click="ctxReply">
          <v-icon size="18" class="dc-ctx-icon">mdi-reply</v-icon>
          <span>{{ $t('dc_ctx_reply') }}</span>
        </div>

        <div class="dc-ctx-separator"></div>

        <!-- Copy Text -->
        <div class="dc-ctx-item" @click="ctxCopyText">
          <v-icon size="18" class="dc-ctx-icon">mdi-content-copy</v-icon>
          <span>{{ $t('dc_ctx_copy_text') }}</span>
        </div>

        <!-- Copy Message ID -->
        <div class="dc-ctx-item" @click="ctxCopyId">
          <v-icon size="18" class="dc-ctx-icon">mdi-identifier</v-icon>
          <span>{{ $t('dc_ctx_copy_id') }}</span>
        </div>

        <!-- Moderator: Delete Message -->
        <template v-if="isModerator">
          <div class="dc-ctx-separator"></div>
          <div class="dc-ctx-item dc-ctx-danger" @click="ctxDelete">
            <v-icon size="18" class="dc-ctx-icon">mdi-delete</v-icon>
            <span>{{ $t('dc_ctx_delete_message') }}</span>
          </div>
        </template>

        <!-- Moderator: Ban User (not self) -->
        <div
          v-if="isModerator && contextMenu.msg?.clientId !== clientId"
          class="dc-ctx-item dc-ctx-danger"
          @click="ctxBan"
        >
          <v-icon size="18" class="dc-ctx-icon">mdi-gavel</v-icon>
          <span>{{ $t('dc_ctx_ban_user') }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  DC_ROLES,
  type DcMessage,
  type DcReaction,
  type DcRoleType,
  type DcUser,
  type DcServerMember,
  type DcServer,
  type DcCustomEmoji,
  type DcChatService
} from '@/services/DcChatService'

const props = defineProps<{
  messages: DcMessage[]
  clientId: string
  messageReactions: Record<string, DcReaction[]>
  serverEmojis: DcCustomEmoji[]
  allUsers: DcUser[]
  serverMembers: DcServerMember[]
  currentServer: DcServer | null
  isModerator: boolean
  canWrite: boolean
  chatService: DcChatService
}>()

const emit = defineEmits<{
  'reply': [msg: DcMessage]
  'delete-msg': [msg: DcMessage]
  'ban-user': [msg: DcMessage]
  'toggle-reaction': [msg: DcMessage, emoji: string]
}>()

const messagesContainer = ref<HTMLElement | null>(null)

const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👎']

// ==================== CONTEXT MENU ====================

const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  msg: DcMessage | null
}>({
  show: false,
  x: 0,
  y: 0,
  msg: null
})

function openContextMenu(event: MouseEvent, msg: DcMessage) {
  const menuWidth = 220
  const menuHeight = 320

  let x = event.clientX
  let y = event.clientY

  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 8
  }
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 8
  }

  contextMenu.value = { show: true, x, y, msg }
}

function closeContextMenu() {
  contextMenu.value = { show: false, x: 0, y: 0, msg: null }
}

function ctxReaction(emoji: string) {
  if (contextMenu.value.msg) {
    emit('toggle-reaction', contextMenu.value.msg, emoji)
  }
  closeContextMenu()
}

function ctxAddReaction() {
  closeContextMenu()
}

function ctxReply() {
  if (contextMenu.value.msg) {
    emit('reply', contextMenu.value.msg)
  }
  closeContextMenu()
}

function ctxCopyText() {
  if (contextMenu.value.msg) {
    navigator.clipboard.writeText(contextMenu.value.msg.text)
  }
  closeContextMenu()
}

function ctxCopyId() {
  if (contextMenu.value.msg?.$id) {
    navigator.clipboard.writeText(contextMenu.value.msg.$id)
  }
  closeContextMenu()
}

function ctxDelete() {
  if (contextMenu.value.msg) {
    emit('delete-msg', contextMenu.value.msg)
  }
  closeContextMenu()
}

function ctxBan() {
  if (contextMenu.value.msg) {
    emit('ban-user', contextMenu.value.msg)
  }
  closeContextMenu()
}

function handleGlobalClick() {
  if (contextMenu.value.show) {
    closeContextMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
})

// ==================== COMPUTED ====================

const userRolesMap = computed(() => {
  const map: Record<string, DcRoleType> = {}
  if (props.currentServer) {
    for (const m of props.serverMembers) {
      map[m.nickname] = m.role
    }
  } else {
    for (const user of props.allUsers) {
      if (user.role) {
        map[user.nickname] = user.role
      }
    }
  }
  return map
})

// ==================== HELPERS ====================

function getUserColor(cId: string, name: string): string {
  if (props.currentServer) {
    const member = props.serverMembers.find(m => m.nickname === name)
    if (member?.role && DC_ROLES[member.role]) {
      return DC_ROLES[member.role].color
    }
  } else {
    const user = props.allUsers.find(u => u.clientId === cId || u.nickname === name)
    if (user?.role && DC_ROLES[user.role]) {
      return DC_ROLES[user.role].color
    }
  }
  return getAvatarColor(name)
}

function getAvatarColor(name: string): string {
  const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
    '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function renderMessage(text: string): string {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  if (props.serverEmojis.length > 0) {
    html = html.replace(/:([a-z0-9_]+):/g, (match, name) => {
      const emoji = props.serverEmojis.find(e => e.name === name)
      if (emoji) {
        return `<img src="${props.chatService.getEmojiUrl(emoji.file_id)}" alt=":${name}:" title=":${name}:" class="dc-custom-emoji-inline" />`
      }
      return match
    })
  }

  html = html.replace(/(https?:\/\/[^\s]+\.gif(\?[^\s]*)?)/gi, '<img src="$1" class="dc-message-gif" loading="lazy" />')
  html = html.replace(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp)(\?[^\s]*)?)/gi, '<img src="$1" class="dc-message-image" loading="lazy" />')
  html = html.replace(/(https?:\/\/[^\s<]+)/gi, (match) => {
    if (match.includes('<img')) return match
    return `<a href="${match}" target="_blank" rel="noopener">${match}</a>`
  })
  return html
}

function getReplyMessage(messageId: string): DcMessage | undefined {
  return props.messages.find(m => m.$id === messageId)
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}

function groupReactions(reactions: DcReaction[]): Record<string, DcReaction[]> {
  const grouped: Record<string, DcReaction[]> = {}
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = []
    grouped[r.emoji].push(r)
  }
  return grouped
}

function scrollToMessage(messageId: string) {
  if (!messagesContainer.value) return
  const el = messagesContainer.value.querySelector(`[data-msg-id="${messageId}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('dc-message-highlight')
    setTimeout(() => el.classList.remove('dc-message-highlight'), 2000)
  }
}

function onScroll() {
  // Future: load more messages on scroll up
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(() => props.messages.length, () => {
  nextTick(() => scrollToBottom())
})

defineExpose({ scrollToBottom })
</script>

<style scoped>
.dc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.dc-message {
  display: flex;
  padding: 4px 0;
  margin-bottom: 8px;
}

.dc-message:hover {
  background: #2e3035;
  border-radius: 4px;
}

.dc-message-ctx-active {
  background: #2e3035;
  border-radius: 4px;
}

.dc-message:hover .dc-message-actions {
  opacity: 1;
}

.dc-message-avatar {
  width: 40px;
  flex-shrink: 0;
  padding-top: 2px;
}

.dc-message-content {
  flex: 1;
  min-width: 0;
}

.dc-message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dc-message-name {
  font-weight: 600;
  font-size: 14px;
}

.dc-role-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
}

.dc-message-time {
  font-size: 11px;
  color: #949ba4;
}

.dc-message-actions {
  opacity: 0;
  transition: opacity 0.15s;
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.dc-message-action {
  opacity: 0.7;
}

.dc-message-action:hover {
  opacity: 1;
}

.dc-message-text {
  color: #dbdee1;
  font-size: 14px;
  word-break: break-word;
  margin-top: 2px;
}

.dc-message-text :deep(a) {
  color: #00aff4;
  text-decoration: none;
}

.dc-message-text :deep(a:hover) {
  text-decoration: underline;
}

.dc-message-text :deep(.dc-message-gif),
.dc-message-text :deep(.dc-message-image) {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  display: block;
  margin-top: 4px;
}

.dc-message-text :deep(.dc-custom-emoji-inline) {
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
  margin: 0 2px;
}

.dc-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.dc-reaction {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 2px 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.dc-reaction:hover {
  background: #3f4147;
}

.dc-reaction-own {
  border-color: #5865f2;
  background: rgba(88, 101, 242, 0.2);
}

.dc-reaction-emoji {
  font-size: 14px;
}

.dc-reaction-count {
  font-size: 12px;
  color: #b5bac1;
}

.dc-reply-reference {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.04);
  border-left: 2px solid #5865f2;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 12px;
  color: #949ba4;
  transition: background 0.15s;
}

.dc-reply-reference:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dc-reply-author {
  font-weight: 600;
  margin-right: 6px;
}

.dc-reply-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dc-message-highlight {
  background: rgba(88, 101, 242, 0.15) !important;
  transition: background 0.5s;
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

/* ===== CONTEXT MENU ===== */
.dc-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  background: #111214;
  border-radius: 8px;
  padding: 6px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  animation: dc-ctx-fade-in 0.1s ease-out;
}

@keyframes dc-ctx-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dc-ctx-reactions {
  display: flex;
  gap: 2px;
  padding: 4px 8px 6px;
  justify-content: center;
}

.dc-ctx-reaction-btn {
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s, transform 0.12s;
}

.dc-ctx-reaction-btn:hover {
  background: #313338;
  transform: scale(1.2);
}

.dc-ctx-separator {
  height: 1px;
  background: #2e3035;
  margin: 4px 8px;
}

.dc-ctx-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  color: #b5bac1;
  font-size: 14px;
  gap: 10px;
  transition: background 0.1s, color 0.1s;
  border-radius: 4px;
  margin: 0 6px;
}

.dc-ctx-item:hover {
  background: #5865f2;
  color: white;
}

.dc-ctx-item:hover .dc-ctx-icon {
  color: white !important;
}

.dc-ctx-icon {
  color: #b5bac1;
  flex-shrink: 0;
}

.dc-ctx-arrow {
  margin-left: auto;
  color: #b5bac1;
}

.dc-ctx-item:hover .dc-ctx-arrow {
  color: white;
}

.dc-ctx-danger {
  color: #f23f43;
}

.dc-ctx-danger .dc-ctx-icon {
  color: #f23f43;
}

.dc-ctx-danger:hover {
  background: #f23f43;
  color: white;
}

.dc-ctx-danger:hover .dc-ctx-icon {
  color: white !important;
}
</style>
