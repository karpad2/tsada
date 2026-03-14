<template>
  <Teleport to="body">
    <div class="dc-settings-overlay" ref="overlayRef" tabindex="-1" @keydown.esc="emit('close')">
      <!-- Left sidebar navigation -->
      <div class="dc-settings-sidebar">
        <div class="dc-settings-sidebar-inner">
          <div class="dc-settings-server-name">{{ server.name }}</div>

          <!-- SERVER -->
          <div class="dc-settings-category">{{ $t('dc_settings_cat_server') }}</div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'profile' }"
            @click="activeSection = 'profile'"
          >
            {{ $t('dc_settings_server_profile') }}
          </div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'channels' }"
            @click="activeSection = 'channels'"
          >
            {{ $t('dc_settings_channels') }}
          </div>

          <div class="dc-settings-separator"></div>

          <!-- EXPRESSION -->
          <div class="dc-settings-category">{{ $t('dc_settings_cat_expression') }}</div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'emoji' }"
            @click="activeSection = 'emoji'"
          >
            {{ $t('dc_custom_emojis') }}
          </div>

          <div class="dc-settings-separator"></div>

          <!-- PEOPLE -->
          <div class="dc-settings-category">{{ $t('dc_settings_cat_people') }}</div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'members' }"
            @click="activeSection = 'members'"
          >
            {{ $t('dc_server_members') }}
          </div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'roles' }"
            @click="activeSection = 'roles'"
          >
            {{ $t('dc_settings_roles') }}
          </div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'invites' }"
            @click="activeSection = 'invites'"
          >
            {{ $t('dc_settings_invites') }}
          </div>

          <div class="dc-settings-separator"></div>

          <!-- MODERATION -->
          <div class="dc-settings-category">{{ $t('dc_settings_cat_moderation') }}</div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'bans' }"
            @click="activeSection = 'bans'"
          >
            {{ $t('dc_banned_users') }}
          </div>

          <div class="dc-settings-separator"></div>

          <!-- DANGER ZONE -->
          <div
            class="dc-settings-nav-item dc-settings-danger"
            :class="{ active: activeSection === 'danger' }"
            @click="activeSection = 'danger'"
          >
            {{ $t('dc_settings_danger_zone') }}
          </div>
        </div>
      </div>

      <!-- Right content area -->
      <div class="dc-settings-content">
        <div class="dc-settings-content-inner">

          <!-- ===== SERVER PROFILE ===== -->
          <div v-if="activeSection === 'profile'">
            <h2 class="dc-settings-section-header">{{ $t('dc_settings_server_profile') }}</h2>

            <!-- Banner preview -->
            <div
              class="dc-settings-banner-preview"
              :style="{ background: editBannerColor || 'linear-gradient(135deg, #5865f2, #eb459e)' }"
            >
              <div class="dc-settings-banner-icon">{{ server.icon || '🖥️' }}</div>
              <div class="dc-settings-banner-name">{{ editServerName || server.name }}</div>
            </div>

            <div class="dc-settings-form">
              <div class="dc-settings-field-label">{{ $t('dc_server_name') }}</div>
              <v-text-field
                v-model="editServerName"
                variant="outlined"
                density="compact"
                hide-details
                class="dc-settings-input"
              />

              <div class="dc-settings-field-label mt-4">{{ $t('dc_server_description') }}</div>
              <v-textarea
                v-model="editServerDescription"
                variant="outlined"
                density="compact"
                rows="3"
                hide-details
                class="dc-settings-input"
              />

              <div class="dc-settings-field-label mt-4">{{ $t('dc_server_icon') }}</div>
              <v-text-field
                v-model="editServerIcon"
                variant="outlined"
                density="compact"
                maxlength="5"
                hide-details
                class="dc-settings-input"
                style="max-width: 120px;"
              />

              <div class="dc-settings-field-label mt-4">{{ $t('dc_settings_banner_color') }}</div>
              <div class="dc-settings-field-hint">{{ $t('dc_settings_banner_color_hint') }}</div>
              <div class="dc-settings-color-swatches">
                <div
                  v-for="color in BANNER_COLORS"
                  :key="color"
                  class="dc-settings-color-swatch"
                  :class="{ active: editBannerColor === color }"
                  :style="{ background: color }"
                  @click="editBannerColor = editBannerColor === color ? '' : color"
                />
              </div>

              <div class="mt-4">
                <v-switch
                  v-model="editServerPublic"
                  :label="$t('dc_public_server')"
                  color="#5865f2"
                  hide-details
                />
              </div>

              <v-btn
                color="#5865f2"
                class="mt-6"
                :loading="actionLoading"
                @click="saveServerSettings"
              >
                {{ $t('dc_settings_save_changes') }}
              </v-btn>
              <span v-if="saveSuccess" class="dc-settings-saved-msg ml-3">{{ $t('dc_settings_changes_saved') }}</span>
            </div>
          </div>

          <!-- ===== CHANNELS ===== -->
          <div v-if="activeSection === 'channels'">
            <div class="d-flex align-center mb-4">
              <h2 class="dc-settings-section-header mb-0">{{ $t('dc_settings_channels') }}</h2>
              <v-spacer />
              <v-btn size="small" color="#5865f2" variant="tonal" @click="showAddChannelForm = true">
                <v-icon size="16" class="mr-1">mdi-plus</v-icon>
                {{ $t('dc_create_channel') }}
              </v-btn>
            </div>

            <!-- Add channel form -->
            <div v-if="showAddChannelForm" class="dc-settings-card mb-4">
              <v-text-field
                v-model="newChannelName"
                :label="$t('dc_channel_name')"
                variant="outlined"
                density="compact"
                hide-details
                class="dc-settings-input mb-3"
              />
              <v-select
                v-model="newChannelType"
                :items="[{ title: 'Text', value: 'text' }, { title: 'Voice', value: 'voice' }]"
                label="Type"
                variant="outlined"
                density="compact"
                hide-details
                class="dc-settings-input mb-3"
              />
              <div class="d-flex gap-2">
                <v-btn size="small" color="#5865f2" :disabled="!newChannelName.trim()" @click="addChannel">
                  {{ $t('dc_create_channel') }}
                </v-btn>
                <v-btn size="small" variant="text" @click="showAddChannelForm = false">
                  {{ $t('cancel') }}
                </v-btn>
              </div>
            </div>

            <!-- Text channels -->
            <div class="dc-settings-channel-group-label">
              <v-icon size="16" class="mr-1">mdi-pound</v-icon>
              {{ $t('dc_text_channels') }}
            </div>
            <div v-for="ch in textChannels" :key="ch.$id" class="dc-settings-channel-item">
              <v-icon size="18" class="mr-2" color="#949ba4">{{ ch.icon || 'mdi-pound' }}</v-icon>
              <span class="dc-settings-channel-name">{{ ch.name }}</span>
              <v-spacer />
              <v-btn icon size="x-small" variant="text" color="#b5bac1" @click="editingChannel = ch">
                <v-icon size="16">mdi-cog</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" color="error" @click="removeChannel(ch)">
                <v-icon size="16">mdi-delete</v-icon>
              </v-btn>
            </div>
            <div v-if="textChannels.length === 0" class="dc-settings-empty">{{ $t('dc_settings_no_members') }}</div>

            <!-- Voice channels -->
            <div class="dc-settings-channel-group-label mt-4">
              <v-icon size="16" class="mr-1">mdi-volume-high</v-icon>
              {{ $t('dc_voice_channels') }}
            </div>
            <div v-for="ch in voiceChannels" :key="ch.$id" class="dc-settings-channel-item">
              <v-icon size="18" class="mr-2" color="#949ba4">{{ ch.icon || 'mdi-volume-high' }}</v-icon>
              <span class="dc-settings-channel-name">{{ ch.name }}</span>
              <v-spacer />
              <v-btn icon size="x-small" variant="text" color="#b5bac1" @click="editingChannel = ch">
                <v-icon size="16">mdi-cog</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" color="error" @click="removeChannel(ch)">
                <v-icon size="16">mdi-delete</v-icon>
              </v-btn>
            </div>
            <div v-if="voiceChannels.length === 0" class="dc-settings-empty">{{ $t('dc_settings_no_members') }}</div>
          </div>

          <!-- ===== EMOJIS ===== -->
          <div v-if="activeSection === 'emoji'">
            <div class="d-flex align-center mb-2">
              <h2 class="dc-settings-section-header mb-0">{{ $t('dc_custom_emojis') }}</h2>
              <v-spacer />
              <v-btn size="small" color="#5865f2" variant="tonal" @click="emojiFileInput?.click()">
                <v-icon size="16" class="mr-1">mdi-upload</v-icon>
                {{ $t('dc_upload_emoji') }}
              </v-btn>
              <input
                ref="emojiFileInput"
                type="file"
                accept="image/png,image/gif,image/webp"
                hidden
                @change="handleEmojiUpload"
              />
            </div>
            <div class="dc-settings-field-hint mb-4">
              {{ $t('dc_settings_emoji_count', { count: emojis.length }) }}
            </div>

            <!-- Upload form -->
            <div v-if="emojiUploadFile" class="dc-settings-card mb-4">
              <div class="d-flex align-center mb-3">
                <img
                  v-if="emojiUploadPreview"
                  :src="emojiUploadPreview"
                  style="width:40px;height:40px;object-fit:contain;border-radius:4px;"
                  class="mr-3"
                />
                <v-text-field
                  v-model="emojiUploadName"
                  :label="$t('dc_emoji_name')"
                  variant="outlined"
                  density="compact"
                  hide-details
                  maxlength="20"
                  class="dc-settings-input"
                />
              </div>
              <div class="d-flex gap-2">
                <v-btn size="small" color="#5865f2" :disabled="!emojiUploadName.trim()" :loading="actionLoading" @click="uploadEmoji">
                  {{ $t('dc_upload_emoji') }}
                </v-btn>
                <v-btn size="small" variant="text" @click="emojiUploadFile = null; emojiUploadPreview = ''">
                  {{ $t('cancel') }}
                </v-btn>
              </div>
            </div>

            <!-- Emoji grid -->
            <div class="dc-settings-emoji-grid">
              <div v-for="emoji in emojis" :key="emoji.$id" class="dc-settings-emoji-card">
                <img :src="chatService.getEmojiUrl(emoji.file_id)" class="dc-settings-emoji-img" />
                <span class="dc-settings-emoji-name">:{{ emoji.name }}:</span>
                <v-spacer />
                <v-btn icon size="x-small" variant="text" color="error" @click="removeEmoji(emoji)">
                  <v-icon size="14">mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
            <div v-if="emojis.length === 0" class="dc-settings-empty">{{ $t('dc_no_emojis') }}</div>
          </div>

          <!-- ===== MEMBERS ===== -->
          <div v-if="activeSection === 'members'">
            <div class="d-flex align-center mb-2">
              <h2 class="dc-settings-section-header mb-0">{{ $t('dc_server_members') }}</h2>
            </div>
            <div class="dc-settings-field-hint mb-4">
              {{ $t('dc_settings_member_count', { count: members.length }) }}
            </div>

            <v-text-field
              v-model="memberSearch"
              :placeholder="$t('dc_settings_search_members')"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="dc-settings-input mb-4"
            />

            <!-- Members grouped by role -->
            <template v-for="role in roleOrder" :key="role">
              <div v-if="membersGrouped[role]?.length" class="dc-settings-members-role-group">
                <div class="dc-settings-members-role-header">
                  <v-icon size="14" :color="DC_ROLES[role].color" class="mr-1">{{ DC_ROLES[role].icon }}</v-icon>
                  {{ $t('dc_role_' + role) }} — {{ membersGrouped[role].length }}
                </div>
                <div v-for="member in membersGrouped[role]" :key="member.$id" class="dc-settings-member-row">
                  <v-icon size="18" :color="DC_ROLES[member.role]?.color || '#949ba4'" class="mr-2">
                    {{ DC_ROLES[member.role]?.icon || 'mdi-account' }}
                  </v-icon>
                  <span class="dc-settings-member-name" :style="{ color: DC_ROLES[member.role]?.color }">
                    {{ member.nickname }}
                  </span>
                  <v-spacer />
                  <v-select
                    :model-value="member.role"
                    :items="roleOptions"
                    item-title="name"
                    item-value="key"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 140px;"
                    class="dc-settings-input mr-2"
                    @update:model-value="(val: DcRoleType) => changeMemberRole(member, val)"
                  />
                  <v-btn
                    v-if="member.role !== 'owner'"
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="kickMember(member)"
                  >
                    <v-icon size="16">mdi-account-remove</v-icon>
                  </v-btn>
                </div>
              </div>
            </template>
            <div v-if="filteredMembers.length === 0" class="dc-settings-empty">{{ $t('dc_settings_no_members') }}</div>
          </div>

          <!-- ===== ROLES ===== -->
          <div v-if="activeSection === 'roles'">
            <h2 class="dc-settings-section-header">{{ $t('dc_settings_roles') }}</h2>
            <div class="dc-settings-field-hint mb-4">{{ $t('dc_settings_role_hierarchy') }}</div>

            <div class="dc-settings-roles-list">
              <div v-for="role in roleOrder" :key="role" class="dc-settings-role-card">
                <div class="dc-settings-role-color-bar" :style="{ background: DC_ROLES[role].color }"></div>
                <div class="dc-settings-role-info">
                  <div class="d-flex align-center">
                    <v-icon size="20" :color="DC_ROLES[role].color" class="mr-2">{{ DC_ROLES[role].icon }}</v-icon>
                    <span class="dc-settings-role-name" :style="{ color: DC_ROLES[role].color }">
                      {{ $t('dc_role_' + role) }}
                    </span>
                  </div>
                  <div class="dc-settings-role-level">
                    {{ $t('dc_settings_role_level') }}: {{ DC_ROLES[role].level }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== INVITES ===== -->
          <div v-if="activeSection === 'invites'">
            <h2 class="dc-settings-section-header">{{ $t('dc_settings_invites') }}</h2>

            <div class="dc-settings-card">
              <div class="dc-settings-field-label">{{ $t('dc_invite_code') }}</div>
              <div class="dc-settings-invite-box">
                <code class="dc-settings-invite-code">{{ server.invite_code }}</code>
                <v-btn icon size="small" variant="text" @click="copyInviteCode">
                  <v-icon size="18">mdi-content-copy</v-icon>
                </v-btn>
                <v-spacer />
                <v-btn size="small" variant="tonal" color="#5865f2" @click="regenerateInviteCode">
                  {{ $t('dc_regenerate_code') }}
                </v-btn>
              </div>
            </div>
          </div>

          <!-- ===== BANS ===== -->
          <div v-if="activeSection === 'bans'">
            <h2 class="dc-settings-section-header">{{ $t('dc_banned_users') }}</h2>

            <div v-if="bans.length === 0" class="dc-settings-empty">{{ $t('dc_no_banned') }}</div>
            <div v-for="ban in bans" :key="ban.$id" class="dc-settings-ban-row">
              <v-icon color="error" class="mr-2">mdi-account-cancel</v-icon>
              <div>
                <div class="dc-settings-ban-name">{{ ban.nickname }}</div>
                <div class="dc-settings-ban-reason">{{ ban.reason || $t('dc_no_reason') }}</div>
              </div>
              <v-spacer />
              <v-btn size="small" variant="tonal" color="success" @click="unbanUser(ban)">
                <v-icon size="16" class="mr-1">mdi-account-check</v-icon>
                Unban
              </v-btn>
            </div>
          </div>

          <!-- ===== DANGER ZONE ===== -->
          <div v-if="activeSection === 'danger'">
            <h2 class="dc-settings-section-header dc-settings-danger-text">{{ $t('dc_settings_danger_zone') }}</h2>

            <!-- Leave server -->
            <div class="dc-settings-danger-card mb-4">
              <div>
                <div class="dc-settings-danger-card-title">{{ $t('dc_leave_server') }}</div>
                <div class="dc-settings-danger-card-desc">{{ $t('dc_settings_leave_warning') }}</div>
              </div>
              <v-btn color="warning" variant="tonal" @click="confirmLeaveServer">
                {{ $t('dc_leave_server') }}
              </v-btn>
            </div>

            <!-- Delete server (owner only) -->
            <div v-if="isOwner" class="dc-settings-danger-card">
              <div>
                <div class="dc-settings-danger-card-title">{{ $t('dc_delete_server') }}</div>
                <div class="dc-settings-danger-card-desc">{{ $t('dc_settings_delete_warning') }}</div>
              </div>
              <v-btn color="error" variant="tonal" @click="confirmDeleteServer">
                {{ $t('dc_delete_server') }}
              </v-btn>
            </div>
          </div>

        </div>

        <!-- Close button -->
        <button class="dc-settings-close" @click="emit('close')">
          <v-icon size="20">mdi-close</v-icon>
          <span class="dc-settings-close-label">ESC</span>
        </button>
      </div>
    </div>

    <!-- Channel Settings overlay (renders on top) -->
    <DcChannelSettings
      v-if="editingChannel"
      :channel="editingChannel"
      :chat-service="chatService"
      @close="editingChannel = null"
      @update:channel="onChannelUpdated"
      @channel-deleted="onChannelDeleted"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog'
import DcChannelSettings from '@/components/dc/DcChannelSettings.vue'
import {
  DcChatService,
  DC_ROLES,
  isAdmin,
  type DcUser,
  type DcRoleType,
  type DcServer,
  type DcServerMember,
  type DcServerChannel,
  type DcCustomEmoji,
  type DcBan
} from '@/services/DcChatService'

const { t } = useI18n()
const { openDialog } = useConfirmDialog()

const BANNER_COLORS = [
  '#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245',
  '#f47b67', '#e7c6ff', '#3ba55d', '#5bc0eb', '#1e1f22'
]

const roleOrder: DcRoleType[] = ['owner', 'admin', 'moderator', 'vip', 'trusted', 'member']

// ==================== PROPS & EMITS ====================

const props = defineProps<{
  server: DcServer
  currentUser: DcUser
  members: DcServerMember[]
  channels: DcServerChannel[]
  emojis: DcCustomEmoji[]
  bans: DcBan[]
  chatService: DcChatService
  currentMembership: DcServerMember | null
}>()

const emit = defineEmits<{
  'close': []
  'update:server': [server: DcServer]
  'update:members': [members: DcServerMember[]]
  'update:channels': [channels: DcServerChannel[]]
  'update:emojis': [emojis: DcCustomEmoji[]]
  'update:bans': [bans: DcBan[]]
  'server-deleted': []
  'server-left': []
}>()

// ==================== STATE ====================

const overlayRef = ref<HTMLElement | null>(null)
const activeSection = ref('profile')
const actionLoading = ref(false)
const saveSuccess = ref(false)

// Profile edit
const editServerName = ref(props.server.name)
const editServerDescription = ref(props.server.description)
const editServerIcon = ref(props.server.icon)
const editServerPublic = ref(props.server.is_public)
const editBannerColor = ref(props.server.banner_color || '')

// Channel management
const showAddChannelForm = ref(false)
const newChannelName = ref('')
const newChannelType = ref<'text' | 'voice'>('text')
const editingChannel = ref<DcServerChannel | null>(null)

// Emoji management
const emojiFileInput = ref<HTMLInputElement | null>(null)
const emojiUploadFile = ref<File | null>(null)
const emojiUploadPreview = ref('')
const emojiUploadName = ref('')

// Members
const memberSearch = ref('')

// ==================== COMPUTED ====================

const isOwner = computed(() => props.currentMembership?.role === 'owner')

const textChannels = computed(() => props.channels.filter(c => c.type === 'text'))
const voiceChannels = computed(() => props.channels.filter(c => c.type === 'voice'))

const filteredMembers = computed(() => {
  if (!memberSearch.value.trim()) return props.members
  const q = memberSearch.value.toLowerCase()
  return props.members.filter(m => m.nickname.toLowerCase().includes(q))
})

const membersGrouped = computed(() => {
  const groups: Record<string, DcServerMember[]> = {}
  for (const role of roleOrder) {
    groups[role] = filteredMembers.value.filter(m => m.role === role)
  }
  return groups
})

const roleOptions = computed(() =>
  Object.entries(DC_ROLES).map(([key, val]) => ({ key, name: t('dc_role_' + key), color: val.color }))
)

// ==================== LIFECYCLE ====================

onMounted(() => {
  nextTick(() => {
    overlayRef.value?.focus()
  })
})

// ==================== SERVER PROFILE ====================

async function saveServerSettings() {
  actionLoading.value = true
  saveSuccess.value = false
  try {
    await props.chatService.updateServer(props.server.$id!, {
      name: editServerName.value,
      description: editServerDescription.value,
      icon: editServerIcon.value,
      is_public: editServerPublic.value,
      banner_color: editBannerColor.value
    })

    emit('update:server', {
      ...props.server,
      name: editServerName.value,
      description: editServerDescription.value,
      icon: editServerIcon.value,
      is_public: editServerPublic.value,
      banner_color: editBannerColor.value
    })

    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } finally {
    actionLoading.value = false
  }
}

// ==================== CHANNELS ====================

async function addChannel() {
  if (!props.server.$id || !newChannelName.value.trim()) return

  const ch = await props.chatService.createChannel(
    props.server.$id,
    newChannelName.value.trim(),
    newChannelType.value,
    newChannelType.value === 'text' ? 'mdi-pound' : 'mdi-volume-high',
    props.channels.length
  )

  if (ch) {
    emit('update:channels', [...props.channels, ch])
    newChannelName.value = ''
    showAddChannelForm.value = false
  }
}

function onChannelUpdated(updated: DcServerChannel) {
  emit('update:channels', props.channels.map(c => c.$id === updated.$id ? updated : c))
  editingChannel.value = null
}

function onChannelDeleted(channelId: string) {
  emit('update:channels', props.channels.filter(c => c.$id !== channelId))
  editingChannel.value = null
}

async function removeChannel(ch: DcServerChannel) {
  const result = await openDialog({
    title: t('dc_delete_channel'),
    message: `${t('dc_delete_channel')}: #${ch.name}?`,
    confirmText: t('dc_delete_channel'),
    color: 'error',
    icon: 'mdi-delete'
  })
  if (!result) return

  await props.chatService.deleteChannel(ch.$id!)
  emit('update:channels', props.channels.filter(c => c.$id !== ch.$id))
}

// ==================== EMOJIS ====================

function handleEmojiUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  emojiUploadFile.value = file
  emojiUploadName.value = file.name.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '')
  const reader = new FileReader()
  reader.onload = (e) => { emojiUploadPreview.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

async function uploadEmoji() {
  if (!emojiUploadFile.value || !emojiUploadName.value.trim() || !props.server.$id || !props.currentUser.$id) return

  actionLoading.value = true
  try {
    const emoji = await props.chatService.uploadEmoji(
      props.server.$id,
      emojiUploadName.value.trim(),
      emojiUploadFile.value,
      props.currentUser.$id
    )
    if (emoji) {
      emit('update:emojis', [...props.emojis, emoji])
    }
    emojiUploadFile.value = null
    emojiUploadPreview.value = ''
    emojiUploadName.value = ''
    if (emojiFileInput.value) emojiFileInput.value.value = ''
  } finally {
    actionLoading.value = false
  }
}

async function removeEmoji(emoji: DcCustomEmoji) {
  await props.chatService.deleteEmoji(emoji.$id!, emoji.file_id)
  emit('update:emojis', props.emojis.filter(e => e.$id !== emoji.$id))
}

// ==================== MEMBERS ====================

async function changeMemberRole(member: DcServerMember, newRole: DcRoleType) {
  await props.chatService.setMemberRole(member.$id!, newRole)
  const updated = props.members.map(m =>
    m.$id === member.$id ? { ...m, role: newRole } : m
  )
  emit('update:members', updated)
}

async function kickMember(member: DcServerMember) {
  const result = await openDialog({
    title: t('dc_kick_member'),
    message: t('dc_kick_member_confirm', { name: member.nickname }),
    confirmText: t('dc_kick_member'),
    color: 'error',
    icon: 'mdi-account-remove'
  })
  if (!result) return

  await props.chatService.kickMember(member.$id!)
  emit('update:members', props.members.filter(m => m.$id !== member.$id))
}

// ==================== INVITES ====================

function copyInviteCode() {
  navigator.clipboard.writeText(props.server.invite_code)
}

async function regenerateInviteCode() {
  if (!props.server.$id) return
  const newCode = await props.chatService.regenerateInviteCode(props.server.$id)
  if (newCode) {
    emit('update:server', { ...props.server, invite_code: newCode })
  }
}

// ==================== BANS ====================

async function unbanUser(ban: DcBan) {
  await props.chatService.unbanUser(ban.$id!)
  emit('update:bans', props.bans.filter(b => b.$id !== ban.$id))
}

// ==================== DANGER ZONE ====================

async function confirmLeaveServer() {
  const result = await openDialog({
    title: t('dc_leave_server'),
    message: t('dc_leave_server_confirm', { name: props.server.name }),
    confirmText: t('dc_leave_server'),
    color: 'warning',
    icon: 'mdi-logout'
  })
  if (!result) return

  await props.chatService.leaveServer(props.server.$id!, props.currentUser.$id!)
  emit('server-left')
}

async function confirmDeleteServer() {
  const result = await openDialog({
    title: t('dc_delete_server'),
    message: t('dc_delete_server_confirm', { name: props.server.name }),
    confirmText: t('dc_delete_server'),
    color: 'error',
    icon: 'mdi-delete-alert'
  })
  if (!result) return

  actionLoading.value = true
  try {
    await props.chatService.deleteServer(props.server.$id!)
    emit('server-deleted')
  } finally {
    actionLoading.value = false
  }
}
</script>

<style scoped>
.dc-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  display: flex;
  background: #313338;
  outline: none;
}

/* ===== SIDEBAR ===== */
.dc-settings-sidebar {
  width: 232px;
  background: #2b2d31;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  overflow-y: auto;
}

.dc-settings-sidebar-inner {
  width: 218px;
  padding: 60px 6px 60px 20px;
}

.dc-settings-server-name {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #949ba4;
  padding: 6px 10px;
  margin-bottom: 4px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-settings-category {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #949ba4;
  padding: 18px 10px 4px;
  letter-spacing: 0.02em;
}

.dc-settings-nav-item {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #b5bac1;
  margin-bottom: 2px;
  transition: background 0.1s, color 0.1s;
  user-select: none;
}

.dc-settings-nav-item:hover {
  background: rgba(79, 84, 92, 0.4);
  color: #dbdee1;
}

.dc-settings-nav-item.active {
  background: rgba(79, 84, 92, 0.6);
  color: white;
}

.dc-settings-danger {
  color: #f23f43 !important;
}

.dc-settings-danger:hover {
  background: rgba(242, 63, 67, 0.15) !important;
}

.dc-settings-separator {
  height: 1px;
  background: rgba(79, 84, 92, 0.48);
  margin: 8px 10px;
}

/* ===== CONTENT ===== */
.dc-settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 60px 40px 80px 40px;
  position: relative;
  min-width: 0;
}

.dc-settings-content-inner {
  max-width: 740px;
  width: 100%;
}

.dc-settings-section-header {
  font-size: 20px;
  font-weight: 600;
  color: #f2f3f5;
  margin-bottom: 20px;
}

.dc-settings-field-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #b5bac1;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}

.dc-settings-field-hint {
  font-size: 13px;
  color: #949ba4;
  margin-bottom: 4px;
}

.dc-settings-form {
  margin-top: 20px;
}

/* Banner preview */
.dc-settings-banner-preview {
  border-radius: 8px;
  height: 140px;
  display: flex;
  align-items: flex-end;
  padding: 16px;
  position: relative;
  margin-bottom: 12px;
}

.dc-settings-banner-icon {
  font-size: 48px;
  margin-right: 12px;
  background: #313338;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #313338;
  margin-bottom: -24px;
}

.dc-settings-banner-name {
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  margin-bottom: -16px;
}

/* Color swatches */
.dc-settings-color-swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.dc-settings-color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
}

.dc-settings-color-swatch:hover {
  transform: scale(1.1);
}

.dc-settings-color-swatch.active {
  border-color: white;
  transform: scale(1.1);
}

/* Cards */
.dc-settings-card {
  background: #1e1f22;
  border-radius: 8px;
  padding: 16px;
}

/* Saved message */
.dc-settings-saved-msg {
  color: #57f287;
  font-size: 13px;
  font-weight: 500;
}

/* ===== CHANNELS ===== */
.dc-settings-channel-group-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #949ba4;
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.dc-settings-channel-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.1s;
}

.dc-settings-channel-item:hover {
  background: rgba(79, 84, 92, 0.3);
}

.dc-settings-channel-name {
  font-size: 15px;
  color: #dbdee1;
}

/* ===== EMOJIS ===== */
.dc-settings-emoji-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dc-settings-emoji-card {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.1s;
}

.dc-settings-emoji-card:hover {
  background: rgba(79, 84, 92, 0.3);
}

.dc-settings-emoji-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-right: 12px;
  border-radius: 4px;
}

.dc-settings-emoji-name {
  font-size: 14px;
  color: #b5bac1;
}

/* ===== MEMBERS ===== */
.dc-settings-members-role-group {
  margin-bottom: 16px;
}

.dc-settings-members-role-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #949ba4;
  display: flex;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 4px;
}

.dc-settings-member-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.1s;
}

.dc-settings-member-row:hover {
  background: rgba(79, 84, 92, 0.3);
}

.dc-settings-member-name {
  font-size: 15px;
  font-weight: 500;
}

/* ===== ROLES ===== */
.dc-settings-roles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dc-settings-role-card {
  display: flex;
  background: #1e1f22;
  border-radius: 8px;
  overflow: hidden;
}

.dc-settings-role-color-bar {
  width: 4px;
  flex-shrink: 0;
}

.dc-settings-role-info {
  padding: 12px 16px;
  flex: 1;
}

.dc-settings-role-name {
  font-size: 15px;
  font-weight: 600;
}

.dc-settings-role-level {
  font-size: 12px;
  color: #949ba4;
  margin-top: 2px;
}

/* ===== INVITES ===== */
.dc-settings-invite-box {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.dc-settings-invite-code {
  font-size: 18px;
  color: white;
  background: #313338;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: monospace;
  letter-spacing: 1px;
}

/* ===== BANS ===== */
.dc-settings-ban-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 4px;
  transition: background 0.1s;
}

.dc-settings-ban-row:hover {
  background: rgba(79, 84, 92, 0.3);
}

.dc-settings-ban-name {
  font-size: 15px;
  color: #dbdee1;
  font-weight: 500;
}

.dc-settings-ban-reason {
  font-size: 12px;
  color: #949ba4;
}

/* ===== DANGER ZONE ===== */
.dc-settings-danger-text {
  color: #f23f43 !important;
}

.dc-settings-danger-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e1f22;
  border: 1px solid rgba(242, 63, 67, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.dc-settings-danger-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #f2f3f5;
  margin-bottom: 4px;
}

.dc-settings-danger-card-desc {
  font-size: 13px;
  color: #949ba4;
  max-width: 400px;
}

/* ===== CLOSE BUTTON ===== */
.dc-settings-close {
  position: fixed;
  top: 60px;
  right: 60px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #b5bac1;
  background: transparent;
  color: #b5bac1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  z-index: 201;
}

.dc-settings-close:hover {
  border-color: white;
  color: white;
}

.dc-settings-close-label {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #949ba4;
}

/* ===== EMPTY STATE ===== */
.dc-settings-empty {
  text-align: center;
  color: #949ba4;
  padding: 24px 0;
  font-size: 14px;
}

/* ===== INPUT STYLING ===== */
.dc-settings-input :deep(.v-field) {
  background: #1e1f22;
  color: #dbdee1;
}

.dc-settings-input :deep(.v-field__outline) {
  color: #3f4147;
}

.dc-settings-input :deep(.v-field--focused .v-field__outline) {
  color: #5865f2;
}

.dc-settings-input :deep(input),
.dc-settings-input :deep(textarea) {
  color: #dbdee1 !important;
}

.dc-settings-input :deep(.v-label) {
  color: #949ba4;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 960px) {
  .dc-settings-sidebar {
    width: 180px;
  }
  .dc-settings-sidebar-inner {
    width: 166px;
    padding: 40px 6px 40px 10px;
  }
  .dc-settings-content {
    padding: 40px 20px 60px 20px;
  }
  .dc-settings-close {
    top: 16px;
    right: 16px;
  }
}

@media (max-width: 600px) {
  .dc-settings-overlay {
    flex-direction: column;
  }
  .dc-settings-sidebar {
    width: 100%;
    height: auto;
    max-height: 56px;
    overflow-x: auto;
    overflow-y: hidden;
    justify-content: flex-start;
  }
  .dc-settings-sidebar-inner {
    width: auto;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: nowrap;
  }
  .dc-settings-server-name,
  .dc-settings-category,
  .dc-settings-separator {
    display: none;
  }
  .dc-settings-nav-item {
    white-space: nowrap;
    font-size: 12px;
    padding: 6px 10px;
  }
  .dc-settings-content {
    padding: 20px 12px 40px;
  }
  .dc-settings-close {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
  }
  .dc-settings-close-label {
    display: none;
  }
  .dc-settings-banner-preview {
    height: 100px;
  }
  .dc-settings-danger-card {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
