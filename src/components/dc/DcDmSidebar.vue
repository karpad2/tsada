<template>
  <div class="dc-dm-sidebar">
    <!-- Header -->
    <div class="dc-dm-sidebar-header">
      <span class="dc-dm-sidebar-title">{{ $t('dc_dm_title') }}</span>
      <v-icon
        size="20"
        color="#b5bac1"
        class="dc-dm-sidebar-add"
        @click="emit('add-contact')"
        :title="$t('dc_dm_add_contact')"
      >mdi-account-plus</v-icon>
    </div>

    <!-- Search -->
    <div class="dc-dm-sidebar-search">
      <input
        v-model="filter"
        class="dc-dm-sidebar-filter"
        :placeholder="$t('dc_dm_search_conversations')"
      />
    </div>

    <!-- Conversations list -->
    <div class="dc-dm-sidebar-list">
      <div
        v-for="conv in filteredConversations"
        :key="conv.id"
        class="dc-dm-sidebar-item"
        :class="{ 'dc-dm-sidebar-active': currentConversationId === conv.id }"
        @click="emit('open-conversation', conv.peerUserId, conv.peerNickname)"
      >
        <div class="dc-dm-sidebar-avatar" :style="{ backgroundColor: getContactColor(conv.peerUserId) }">
          {{ conv.peerNickname.charAt(0).toUpperCase() }}
          <div
            class="dc-dm-sidebar-dot"
            :class="'dc-dm-dot-' + getState(conv.peerUserId)"
          ></div>
        </div>
        <div class="dc-dm-sidebar-info">
          <div class="dc-dm-sidebar-name">{{ conv.peerNickname }}</div>
          <div class="dc-dm-sidebar-last">{{ conv.lastMessage || $t('dc_dm_no_messages') }}</div>
        </div>
        <div v-if="conv.unreadCount > 0" class="dc-dm-sidebar-badge">
          {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
        </div>
      </div>

      <!-- Contacts without conversation -->
      <div v-if="contactsWithoutConv.length > 0" class="dc-dm-sidebar-section">
        {{ $t('dc_dm_contacts') }}
      </div>
      <div
        v-for="contact in contactsWithoutConv"
        :key="contact.$id"
        class="dc-dm-sidebar-item"
        @click="emit('open-conversation', contact.contact_id, contact.contact_nickname)"
      >
        <div class="dc-dm-sidebar-avatar" :style="{ backgroundColor: '#5865f2' }">
          {{ contact.contact_nickname.charAt(0).toUpperCase() }}
          <div
            class="dc-dm-sidebar-dot"
            :class="'dc-dm-dot-' + getState(contact.contact_id)"
          ></div>
        </div>
        <div class="dc-dm-sidebar-info">
          <div class="dc-dm-sidebar-name">{{ contact.contact_nickname }}</div>
          <div class="dc-dm-sidebar-last">{{ $t('dc_dm_start_chat') }}</div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredConversations.length === 0 && contactsWithoutConv.length === 0" class="dc-dm-sidebar-empty">
        <v-icon size="32" color="#949ba4" class="mb-2">mdi-message-text-outline</v-icon>
        <div>{{ $t('dc_dm_no_contacts') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DcDmConversation, DcContact } from '@/types/DcDmTypes'
import type { DmConnectionState } from '@/utils/dcDmManager'

const props = defineProps<{
  conversations: DcDmConversation[]
  contacts: DcContact[]
  connectionStates: Record<string, DmConnectionState>
  currentConversationId: string | null
}>()

const emit = defineEmits<{
  'open-conversation': [peerUserId: string, peerNickname: string]
  'add-contact': []
}>()

const filter = ref('')

const filteredConversations = computed(() => {
  if (!filter.value) return props.conversations
  const q = filter.value.toLowerCase()
  return props.conversations.filter(c => c.peerNickname.toLowerCase().includes(q))
})

const contactsWithoutConv = computed(() => {
  const convPeerIds = new Set(props.conversations.map(c => c.peerUserId))
  return props.contacts.filter(c => !convPeerIds.has(c.contact_id) && !c.blocked)
})

function getState(peerUserId: string): DmConnectionState {
  return props.connectionStates[peerUserId] || 'disconnected'
}

function getContactColor(peerUserId: string): string {
  // Simple deterministic color
  let hash = 0
  for (let i = 0; i < peerUserId.length; i++) {
    hash = peerUserId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = ['#5865f2', '#ed4245', '#faa61a', '#23a559', '#9b59b6', '#e91e63', '#3498db']
  return colors[Math.abs(hash) % colors.length]
}
</script>

<style scoped>
.dc-dm-sidebar {
  width: 240px;
  background: #2b2d31;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1e1f22;
  flex-shrink: 0;
}

.dc-dm-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #1e1f22;
}

.dc-dm-sidebar-title {
  font-size: 14px;
  font-weight: 700;
  color: #949ba4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dc-dm-sidebar-add {
  cursor: pointer;
  opacity: 0.7;
}

.dc-dm-sidebar-add:hover {
  opacity: 1;
}

.dc-dm-sidebar-search {
  padding: 8px 12px;
}

.dc-dm-sidebar-filter {
  width: 100%;
  background: #1e1f22;
  border: none;
  outline: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  color: #dbdee1;
}

.dc-dm-sidebar-filter::placeholder {
  color: #6d6f78;
}

.dc-dm-sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.dc-dm-sidebar-section {
  font-size: 11px;
  font-weight: 700;
  color: #949ba4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 8px 4px 8px;
}

.dc-dm-sidebar-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  gap: 10px;
  margin-bottom: 2px;
}

.dc-dm-sidebar-item:hover {
  background: #35373c;
}

.dc-dm-sidebar-active {
  background: #404249 !important;
}

.dc-dm-sidebar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
  position: relative;
}

.dc-dm-sidebar-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #2b2d31;
}

.dc-dm-dot-connected {
  background: #23a559;
}

.dc-dm-dot-connecting {
  background: #faa61a;
}

.dc-dm-dot-disconnected {
  background: #80848e;
}

.dc-dm-sidebar-info {
  flex: 1;
  min-width: 0;
}

.dc-dm-sidebar-name {
  font-size: 14px;
  font-weight: 500;
  color: #dbdee1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-dm-sidebar-last {
  font-size: 12px;
  color: #949ba4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-dm-sidebar-badge {
  background: #ed4245;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.dc-dm-sidebar-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: #949ba4;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 960px) {
  .dc-dm-sidebar {
    width: 200px;
  }
}

@media (max-width: 600px) {
  .dc-dm-sidebar {
    width: 60px;
  }
  .dc-dm-sidebar-header {
    padding: 8px;
    justify-content: center;
  }
  .dc-dm-sidebar-title,
  .dc-dm-sidebar-search,
  .dc-dm-sidebar-info,
  .dc-dm-sidebar-section {
    display: none;
  }
  .dc-dm-sidebar-item {
    justify-content: center;
    padding: 6px;
  }
  .dc-dm-sidebar-badge {
    position: absolute;
    top: -4px;
    right: -4px;
  }
  .dc-dm-sidebar-avatar {
    position: relative;
  }
}
</style>
