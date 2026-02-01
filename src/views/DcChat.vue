<template>
  <div class="dc-wrapper">
    <!-- Auth Dialog (Login / Register) -->
    <v-dialog v-model="showAuthDialog" persistent max-width="450">
      <v-card class="dc-dialog">
        <v-card-title class="text-h5">
          <v-icon class="mr-2">mdi-account-circle</v-icon>
          {{ authMode === 'login' ? $t('dc_login') : $t('dc_register') }}
        </v-card-title>
        <v-card-text>
          <v-alert v-if="authError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ authError }}
          </v-alert>

          <v-text-field
            v-model="authNickname"
            :label="$t('dc_nickname')"
            variant="outlined"
            maxlength="20"
            counter
            :rules="[v => !!v || $t('dc_nickname_required'), v => v.length >= 2 || $t('dc_nickname_min')]"
            autofocus
          />

          <v-text-field
            v-model="authPin"
            :label="authMode === 'register' ? $t('dc_pin_register') : $t('dc_pin')"
            variant="outlined"
            :type="showPin ? 'text' : 'password'"
            :maxlength="8"
            :rules="authMode === 'register' ? [v => v.length >= 4 || $t('dc_pin_min')] : []"
            :append-inner-icon="showPin ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPin = !showPin"
            @keyup.enter="handleAuth"
          />

          <v-text-field
            v-if="authMode === 'register'"
            v-model="authPinConfirm"
            :label="$t('dc_pin_confirm')"
            variant="outlined"
            :type="showPin ? 'text' : 'password'"
            :maxlength="8"
            :rules="[v => v === authPin || $t('dc_pin_mismatch')]"
            @keyup.enter="handleAuth"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="toggleAuthMode">
            {{ authMode === 'login' ? $t('dc_no_account') : $t('dc_has_account') }}
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="authLoading"
            :disabled="!canAuth"
            @click="handleAuth"
          >
            {{ authMode === 'login' ? $t('dc_enter') : $t('dc_register') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Banned State -->
    <v-container v-if="isBanned" class="d-flex align-center justify-center" style="height: 80vh;">
      <v-card class="text-center pa-8 dc-dialog" max-width="400">
        <v-icon size="64" color="error">mdi-cancel</v-icon>
        <h2 class="text-h5 mt-4">{{ $t('dc_banned') }}</h2>
        <p class="text-body-2 text-medium-emphasis mt-2">{{ banReason || $t('dc_banned_reason') }}</p>
      </v-card>
    </v-container>

    <!-- Main DC Layout -->
    <div v-else-if="currentUser" class="dc-layout">
      <!-- Sidebar: Channels -->
      <div class="dc-sidebar">
        <div class="dc-sidebar-header">
          <v-icon color="white" class="mr-2">mdi-message-text</v-icon>
          <span class="font-weight-bold">{{ $t('dc_title') }}</span>
        </div>

        <!-- Text Channels -->
        <div class="dc-channel-group">
          <div class="dc-channel-label">{{ $t('dc_text_channels') }}</div>
          <template v-for="ch in visibleTextChannels" :key="ch.id">
            <div
              class="dc-channel-item"
              :class="{ active: currentChannel === ch.id, 'dc-channel-restricted': isChannelRestricted(ch) }"
              @click="switchChannel(ch.id)"
            >
              <v-icon size="18" class="mr-2">{{ ch.icon }}</v-icon>
              {{ $t(ch.nameKey) }}
              <v-icon v-if="isChannelRestricted(ch)" size="12" class="ml-auto" color="warning">mdi-lock</v-icon>
            </div>
          </template>
        </div>

        <!-- Voice Channels -->
        <div class="dc-channel-group">
          <div class="dc-channel-label">{{ $t('dc_voice_channels') }}</div>
          <template v-for="vc in visibleVoiceChannels" :key="vc.id">
            <div
              class="dc-channel-item"
              :class="{ active: currentVoiceChannel === vc.id, 'dc-channel-restricted': isChannelRestricted(vc) }"
              @click="toggleVoiceChannel(vc.id)"
            >
              <v-icon size="18" class="mr-2">{{ vc.icon }}</v-icon>
              {{ $t(vc.nameKey) }}
              <span v-if="voiceUsers[vc.id]?.length" class="ml-auto text-caption">({{ voiceUsers[vc.id].length }})</span>
              <v-icon v-if="isChannelRestricted(vc)" size="12" class="ml-1" color="warning">mdi-lock</v-icon>
            </div>
          </template>
          <!-- Connected users in voice -->
          <div v-if="currentVoiceChannel" class="dc-voice-users">
            <div v-for="user in voiceUsers[currentVoiceChannel] || []" :key="user" class="dc-voice-user">
              <v-icon size="14" color="green" class="mr-1">mdi-account-voice</v-icon>
              {{ user }}
            </div>
          </div>
        </div>

        <!-- User Panel (bottom) -->
        <div class="dc-user-panel">
          <v-icon size="20" class="mr-2" :color="currentUser.role ? DC_ROLES[currentUser.role]?.color : 'grey'">mdi-account-circle</v-icon>
          <div class="dc-user-info">
            <span class="text-body-2" :style="currentUser.role ? { color: DC_ROLES[currentUser.role]?.color } : {}">
              {{ currentUser.nickname }}
            </span>
            <span
              v-if="currentUser.role"
              class="dc-role-badge-small"
              :style="{ backgroundColor: DC_ROLES[currentUser.role]?.color + '33', color: DC_ROLES[currentUser.role]?.color }"
            >
              {{ $t('dc_role_' + currentUser.role) }}
            </span>
          </div>
          <v-spacer />
          <v-btn
            v-if="currentVoiceChannel"
            icon size="x-small" variant="text" color="error"
            @click="leaveVoice"
          >
            <v-icon size="16">mdi-phone-hangup</v-icon>
          </v-btn>
          <v-btn
            icon size="x-small" variant="text"
            @click="handleLogout"
          >
            <v-icon size="16">mdi-logout</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="dc-main">
        <!-- Channel Header -->
        <div class="dc-header">
          <v-icon size="20" class="mr-2">{{ currentChannelData?.icon || 'mdi-pound' }}</v-icon>
          <span class="font-weight-bold">{{ currentChannelData ? $t(currentChannelData.nameKey) : currentChannel }}</span>
          <span v-if="currentChannelData?.descriptionKey" class="text-caption text-medium-emphasis ml-4">
            {{ $t(currentChannelData.descriptionKey) }}
          </span>
          <v-spacer />
          <span class="text-caption text-medium-emphasis">{{ $t('dc_messages_count', { count: messages.length }) }}</span>
          <!-- Admin: ban list -->
          <v-btn v-if="isModerator" icon size="small" variant="text" class="ml-2" @click="showBanDialog = true">
            <v-icon size="18">mdi-shield-account</v-icon>
          </v-btn>
          <!-- Admin: role manager -->
          <v-btn v-if="isAdminUser" icon size="small" variant="text" class="ml-1" @click="showRoleDialog = true">
            <v-icon size="18">mdi-account-cog</v-icon>
          </v-btn>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="dc-messages" @scroll="onScroll">
          <div v-if="messages.length === 0" class="text-center text-medium-emphasis pa-8">
            <v-icon size="48" color="grey">mdi-message-outline</v-icon>
            <p class="mt-2">{{ $t('dc_no_messages') }}</p>
          </div>
          <div
            v-for="msg in messages"
            :key="msg.$id"
            :data-msg-id="msg.$id"
            class="dc-message"
            :class="{ 'dc-message-own': msg.clientId === clientId }"
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
                <!-- Message actions -->
                <div class="dc-message-actions">
                  <!-- Reply button -->
                  <v-btn
                    v-if="canWriteCurrentChannel"
                    icon size="x-small" variant="text"
                    class="dc-message-action"
                    @click="setReplyTo(msg)"
                  >
                    <v-icon size="14">mdi-reply</v-icon>
                  </v-btn>
                  <!-- Reaction picker -->
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
                        @click="toggleReaction(msg, emoji)"
                      >{{ emoji }}</span>
                    </div>
                  </v-menu>
                  <!-- Moderator actions -->
                  <v-btn
                    v-if="isModerator"
                    icon size="x-small" variant="text" color="error"
                    class="dc-message-action"
                    @click="deleteMsg(msg)"
                  >
                    <v-icon size="14">mdi-delete</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="isModerator && msg.clientId !== clientId"
                    icon size="x-small" variant="text" color="warning"
                    class="dc-message-action"
                    @click="banUserFromMessage(msg)"
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
                  @click="toggleReaction(msg, emoji as string)"
                >
                  <span class="dc-reaction-emoji">{{ emoji }}</span>
                  <span class="dc-reaction-count">{{ group.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reply Bar -->
        <div v-if="replyingTo" class="dc-reply-bar">
          <v-icon size="16" class="mr-2">mdi-reply</v-icon>
          <span class="text-medium-emphasis mr-1">{{ $t('dc_reply_to') }}</span>
          <span class="font-weight-bold mr-2" :style="{ color: getUserColor(replyingTo.clientId, replyingTo.nickname) }">
            {{ replyingTo.nickname }}
          </span>
          <span class="dc-reply-bar-text">{{ truncateText(replyingTo.text, 60) }}</span>
          <v-spacer />
          <v-btn icon size="x-small" variant="text" @click="cancelReply">
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Message Input -->
        <div class="dc-input">
          <v-text-field
            v-if="canWriteCurrentChannel"
            v-model="messageInput"
            :placeholder="$t('dc_message_placeholder', { channel: currentChannelData ? $t(currentChannelData.nameKey) : currentChannel })"
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

      <!-- Members Sidebar (right) -->
      <div class="dc-members">
        <div class="dc-members-header">{{ $t('dc_members') }} — {{ allUsers.length }}</div>
        <!-- Group by role -->
        <template v-for="roleKey in roleOrder" :key="roleKey">
          <div v-if="getMembersByRole(roleKey).length > 0">
            <div class="dc-members-role-header" :style="{ color: DC_ROLES[roleKey]?.color }">
              <v-icon size="12" class="mr-1">{{ DC_ROLES[roleKey]?.icon }}</v-icon>
              {{ $t('dc_role_' + roleKey) }} — {{ getMembersByRole(roleKey).length }}
            </div>
            <div v-for="user in getMembersByRole(roleKey)" :key="user.nickname" class="dc-member">
              <v-icon size="16" class="mr-2" :color="isUserOnline(user) ? DC_ROLES[roleKey]?.color : 'grey'">
                {{ isUserOnline(user) ? 'mdi-circle' : 'mdi-circle-outline' }}
              </v-icon>
              <span :style="{ color: DC_ROLES[roleKey]?.color, opacity: isUserOnline(user) ? 1 : 0.5 }">
                {{ user.nickname }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Ban Dialog (Moderator+) -->
    <v-dialog v-model="showBanDialog" max-width="500">
      <v-card class="dc-dialog">
        <v-card-title>
          <v-icon class="mr-2">mdi-shield-account</v-icon>
          {{ $t('dc_banned_users') }}
        </v-card-title>
        <v-card-text>
          <div v-if="bans.length === 0" class="text-center text-grey py-4">{{ $t('dc_no_banned') }}</div>
          <v-list v-else density="compact" bg-color="transparent">
            <v-list-item v-for="ban in bans" :key="ban.$id">
              <template #prepend>
                <v-icon color="error">mdi-account-cancel</v-icon>
              </template>
              <v-list-item-title>{{ ban.nickname }}</v-list-item-title>
              <v-list-item-subtitle>{{ ban.reason || $t('dc_no_reason') }}</v-list-item-subtitle>
              <template #append>
                <v-btn icon size="small" variant="text" color="success" @click="unbanUser(ban)">
                  <v-icon>mdi-account-check</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showBanDialog = false">{{ $t('dc_close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role Manager Dialog (Admin+) -->
    <v-dialog v-model="showRoleDialog" max-width="600">
      <v-card class="dc-dialog">
        <v-card-title>
          <v-icon class="mr-2">mdi-account-cog</v-icon>
          {{ $t('dc_role_management') }}
        </v-card-title>
        <v-card-text>
          <!-- User list with role selector -->
          <v-list density="compact" bg-color="transparent">
            <v-list-item v-for="user in allUsers" :key="user.$id">
              <template #prepend>
                <v-icon :color="DC_ROLES[user.role || 'member']?.color">
                  {{ DC_ROLES[user.role || 'member']?.icon }}
                </v-icon>
              </template>
              <v-list-item-title :style="{ color: DC_ROLES[user.role || 'member']?.color }">
                {{ user.nickname }}
              </v-list-item-title>
              <template #append>
                <v-select
                  :model-value="user.role || 'member'"
                  :items="roleOptions"
                  item-title="name"
                  item-value="key"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px"
                  @update:model-value="(val: DcRoleType) => changeUserRole(user, val)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRoleDialog = false">{{ $t('dc_close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog';
import {
  DcChatService,
  DC_ROLES,
  DC_TEXT_CHANNELS,
  DC_VOICE_CHANNELS,
  canViewChannel,
  canWriteChannel,
  canModerate,
  isAdmin,
  type DcMessage,
  type DcBan,
  type DcReaction,
  type DcUser,
  type DcRoleType,
  type DcChannel
} from '@/services/DcChatService';

const { t } = useI18n();
const { openDialog } = useConfirmDialog();

const chatService = new DcChatService();

// ==================== AUTH STATE ====================
const showAuthDialog = ref(false);
const authMode = ref<'login' | 'register'>('login');
const authNickname = ref('');
const authPin = ref('');
const authPinConfirm = ref('');
const authError = ref('');
const authLoading = ref(false);
const showPin = ref(false);

const currentUser = ref<DcUser | null>(null);
const clientId = DcChatService.getClientId();

const canAuth = computed(() => {
  if (!authNickname.value || authNickname.value.length < 2) return false;
  if (!authPin.value || authPin.value.length < 4) return false;
  if (authMode.value === 'register' && authPin.value !== authPinConfirm.value) return false;
  return true;
});

// ==================== BAN STATE ====================
const isBanned = ref(false);
const banReason = ref('');

// ==================== MESSAGES ====================
const messages = ref<DcMessage[]>([]);
const messageInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

// ==================== CHANNELS ====================
const currentChannel = ref('általános');
const currentVoiceChannel = ref<string | null>(null);
const voiceUsers = ref<Record<string, string[]>>({});

const currentChannelData = computed(() => {
  return DC_TEXT_CHANNELS.find(c => c.id === currentChannel.value);
});

const visibleTextChannels = computed(() => {
  return DC_TEXT_CHANNELS.filter(ch => canViewChannel(currentUser.value?.role, ch));
});

const visibleVoiceChannels = computed(() => {
  return DC_VOICE_CHANNELS.filter(ch => canViewChannel(currentUser.value?.role, ch));
});

const canWriteCurrentChannel = computed(() => {
  const channel = DC_TEXT_CHANNELS.find(c => c.id === currentChannel.value);
  if (!channel) return false;
  return canWriteChannel(currentUser.value?.role, channel);
});

function isChannelRestricted(channel: DcChannel): boolean {
  return channel.viewRole !== 'member';
}

// ==================== USERS & ROLES ====================
const allUsers = ref<DcUser[]>([]);
const userRolesMap = computed(() => {
  const map: Record<string, DcRoleType> = {};
  for (const user of allUsers.value) {
    if (user.role) {
      map[user.nickname] = user.role;
    }
  }
  return map;
});

const isModerator = computed(() => canModerate(currentUser.value?.role));
const isAdminUser = computed(() => isAdmin(currentUser.value?.role));

const roleOrder: DcRoleType[] = ['owner', 'admin', 'moderator', 'vip', 'trusted', 'member'];
const roleOptions = computed(() =>
  Object.entries(DC_ROLES).map(([key, val]) => ({ key, name: t('dc_role_' + key), color: val.color }))
);

// ==================== REPLY ====================
const replyingTo = ref<DcMessage | null>(null);

// ==================== REACTIONS ====================
const messageReactions = ref<Record<string, DcReaction[]>>({});
let reactionsUnsubscribe: (() => void) | null = null;

// ==================== ADMIN ====================
const showBanDialog = ref(false);
const showRoleDialog = ref(false);
const bans = ref<DcBan[]>([]);

// ==================== GIF & EMOJI ====================
const showGifPicker = ref(false);
const gifSearch = ref('');
const gifs = ref<{ id: string; preview: string; url: string }[]>([]);
let gifSearchTimeout: ReturnType<typeof setTimeout> | null = null;

const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👎'];
const emojiCategories = {
  faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🔯', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'],
  objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🕹️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎']
};

// ==================== WEBRTC ====================
let localStream: MediaStream | null = null;
const peerConnections = ref<Record<string, RTCPeerConnection>>({});

// ==================== AUTH FUNCTIONS ====================

function toggleAuthMode() {
  authMode.value = authMode.value === 'login' ? 'register' : 'login';
  authError.value = '';
  authPin.value = '';
  authPinConfirm.value = '';
}

async function handleAuth() {
  if (!canAuth.value) return;

  authLoading.value = true;
  authError.value = '';

  try {
    if (authMode.value === 'register') {
      const result = await chatService.register(authNickname.value.trim(), authPin.value);
      if (!result.success) {
        authError.value = result.error || t('dc_error');
        return;
      }
      currentUser.value = result.user!;
    } else {
      const result = await chatService.login(authNickname.value.trim(), authPin.value);
      if (!result.success) {
        authError.value = result.error || t('dc_error');
        return;
      }
      currentUser.value = result.user!;
    }

    showAuthDialog.value = false;
    await initializeChat();
  } finally {
    authLoading.value = false;
  }
}

function handleLogout() {
  chatService.logout();
  currentUser.value = null;
  messages.value = [];
  showAuthDialog.value = true;
  authNickname.value = '';
  authPin.value = '';
  authPinConfirm.value = '';
}

// ==================== CHAT FUNCTIONS ====================

async function initializeChat() {
  await loadMessages();
  subscribeToChannel();
  subscribeToReactions();
  await loadAllUsers();

  if (isModerator.value) {
    await loadBans();
  }
}

async function loadMessages() {
  messages.value = await chatService.getMessages(currentChannel.value);
  if (messages.value.length > 0) {
    const ids = messages.value.map(m => m.$id!).filter(Boolean);
    messageReactions.value = await chatService.getReactionsForMessages(ids);
  }
  await nextTick();
  scrollToBottom();
}

function subscribeToChannel() {
  chatService.subscribeToMessages(currentChannel.value, (msg: DcMessage) => {
    if (!messages.value.find(m => m.$id === msg.$id)) {
      messages.value.push(msg);
      nextTick(() => scrollToBottom());
    }
  });
}

function subscribeToReactions() {
  reactionsUnsubscribe?.();
  reactionsUnsubscribe = chatService.subscribeToReactions((reaction, isDelete) => {
    if (!messageReactions.value[reaction.messageId]) {
      messageReactions.value[reaction.messageId] = [];
    }

    if (isDelete) {
      messageReactions.value[reaction.messageId] = messageReactions.value[reaction.messageId].filter(
        r => r.$id !== reaction.$id
      );
    } else {
      if (!messageReactions.value[reaction.messageId].find(r => r.$id === reaction.$id)) {
        messageReactions.value[reaction.messageId].push(reaction);
      }
    }
  });
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentUser.value) return;
  messageInput.value = '';
  const replyId = replyingTo.value?.$id || undefined;
  replyingTo.value = null;
  await chatService.sendMessage(currentUser.value.nickname, text, currentChannel.value, replyId);
}

function setReplyTo(msg: DcMessage) {
  replyingTo.value = msg;
}

function cancelReply() {
  replyingTo.value = null;
}

function getReplyMessage(messageId: string): DcMessage | undefined {
  return messages.value.find(m => m.$id === messageId);
}

function scrollToMessage(messageId: string) {
  if (!messagesContainer.value) return;
  const el = messagesContainer.value.querySelector(`[data-msg-id="${messageId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('dc-message-highlight');
    setTimeout(() => el.classList.remove('dc-message-highlight'), 2000);
  }
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

function switchChannel(channelId: string) {
  const channel = DC_TEXT_CHANNELS.find(c => c.id === channelId);
  if (!channel || !canViewChannel(currentUser.value?.role, channel)) return;

  currentChannel.value = channelId;
  replyingTo.value = null;
  loadMessages();
  subscribeToChannel();
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function onScroll() {
  // Future: load more messages on scroll up
}

// ==================== REACTIONS ====================

async function toggleReaction(msg: DcMessage, emoji: string) {
  if (!msg.$id || !currentUser.value) return;
  await chatService.toggleReaction(msg.$id, emoji, currentUser.value.nickname);
}

function groupReactions(reactions: DcReaction[]): Record<string, DcReaction[]> {
  const grouped: Record<string, DcReaction[]> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r);
  }
  return grouped;
}

// ==================== EMOJI & GIF ====================

function insertEmoji(emoji: string) {
  messageInput.value += emoji;
}

async function searchGifs() {
  if (gifSearchTimeout) clearTimeout(gifSearchTimeout);

  gifSearchTimeout = setTimeout(async () => {
    if (!gifSearch.value.trim()) {
      gifs.value = [];
      return;
    }

    try {
      const response = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(gifSearch.value)}&key=LIVDSRZULELA&limit=20&media_filter=minimal`);
      const data = await response.json();

      gifs.value = data.results?.map((r: any) => ({
        id: r.id,
        preview: r.media[0]?.tinygif?.url || r.media[0]?.nanogif?.url,
        url: r.media[0]?.gif?.url || r.media[0]?.mediumgif?.url
      })) || [];
    } catch (error) {
      console.error('GIF search failed:', error);
      gifs.value = [];
    }
  }, 500);
}

function sendGif(url: string) {
  messageInput.value = url;
  sendMessage();
  showGifPicker.value = false;
  gifSearch.value = '';
  gifs.value = [];
}

// ==================== VOICE CHAT ====================

async function toggleVoiceChannel(channelId: string) {
  const channel = DC_VOICE_CHANNELS.find(c => c.id === channelId);
  if (!channel || !canViewChannel(currentUser.value?.role, channel)) return;

  if (currentVoiceChannel.value === channelId) {
    leaveVoice();
  } else {
    await joinVoice(channelId);
  }
}

async function joinVoice(channelId: string) {
  if (!currentUser.value) return;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    currentVoiceChannel.value = channelId;

    if (!voiceUsers.value[channelId]) {
      voiceUsers.value[channelId] = [];
    }
    if (!voiceUsers.value[channelId].includes(currentUser.value.nickname)) {
      voiceUsers.value[channelId].push(currentUser.value.nickname);
    }

    await chatService.sendMessage(
      currentUser.value.nickname,
      `__VOICE_JOIN__${channelId}`,
      '__voice_signaling__'
    );
  } catch (error) {
    console.error('Failed to join voice:', error);
    currentVoiceChannel.value = null;
  }
}

function leaveVoice() {
  if (!currentUser.value) return;

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  if (currentVoiceChannel.value && voiceUsers.value[currentVoiceChannel.value]) {
    voiceUsers.value[currentVoiceChannel.value] = voiceUsers.value[currentVoiceChannel.value].filter(
      u => u !== currentUser.value?.nickname
    );
  }

  Object.values(peerConnections.value).forEach(pc => pc.close());
  peerConnections.value = {};

  if (currentVoiceChannel.value) {
    chatService.sendMessage(
      currentUser.value.nickname,
      `__VOICE_LEAVE__${currentVoiceChannel.value}`,
      '__voice_signaling__'
    );
  }

  currentVoiceChannel.value = null;
}

// ==================== USERS & ROLES ====================

async function loadAllUsers() {
  allUsers.value = await chatService.getAllUsers();
}

function getMembersByRole(roleKey: string): DcUser[] {
  return allUsers.value.filter(user => (user.role || 'member') === roleKey);
}

function isUserOnline(user: DcUser): boolean {
  if (!user.lastSeen) return false;
  const lastSeen = new Date(user.lastSeen);
  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

async function changeUserRole(user: DcUser, newRole: DcRoleType) {
  if (!user.$id) return;
  await chatService.setUserRole(user.$id, newRole);
  await loadAllUsers();

  // Update current user if it's us
  if (user.$id === currentUser.value?.$id) {
    currentUser.value = { ...currentUser.value, role: newRole };
  }
}

// ==================== HELPERS ====================

function getUserColor(cId: string, name: string): string {
  const user = allUsers.value.find(u => u.clientId === cId || u.nickname === name);
  if (user?.role && DC_ROLES[user.role]) {
    return DC_ROLES[user.role].color;
  }
  return getAvatarColor(name);
}

function getAvatarColor(name: string): string {
  const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
    '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderMessage(text: string): string {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/(https?:\/\/[^\s]+\.gif(\?[^\s]*)?)/gi, '<img src="$1" class="dc-message-gif" loading="lazy" />');
  html = html.replace(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp)(\?[^\s]*)?)/gi, '<img src="$1" class="dc-message-image" loading="lazy" />');
  html = html.replace(/(https?:\/\/[^\s<]+)/gi, (match) => {
    if (match.includes('<img')) return match;
    return `<a href="${match}" target="_blank" rel="noopener">${match}</a>`;
  });
  return html;
}

// ==================== ADMIN FUNCTIONS ====================

async function loadBans() {
  bans.value = await chatService.getAllBans();
}

async function deleteMsg(msg: DcMessage) {
  if (!msg.$id) return;
  await chatService.deleteMessage(msg.$id);
  messages.value = messages.value.filter(m => m.$id !== msg.$id);
}

async function banUserFromMessage(msg: DcMessage) {
  const user = allUsers.value.find(u => u.nickname === msg.nickname);
  if (!user || !currentUser.value) return;

  const result = await openDialog({
    title: t('dc_banned_users'),
    message: t('dc_ban_reason_prompt'),
    prompt: true,
    promptLabel: t('dc_ban_reason_prompt'),
    confirmText: 'Ban',
    color: 'error',
    icon: 'mdi-account-cancel'
  });
  if (result === null) return;
  const reason = (typeof result === 'string' ? result : '') || '';
  await chatService.banUser(user, reason, currentUser.value.nickname);
  bans.value = await chatService.getAllBans();
}

async function unbanUser(ban: DcBan) {
  if (!ban.$id) return;
  await chatService.unbanUser(ban.$id);
  bans.value = bans.value.filter(b => b.$id !== ban.$id);
}

// ==================== LIFECYCLE ====================

onMounted(async () => {
  // Try to restore session
  const savedUser = await chatService.getCurrentUser();

  if (savedUser) {
    // Check if banned
    const ban = await chatService.isBanned(savedUser.clientId);
    if (ban) {
      isBanned.value = true;
      banReason.value = ban.reason || '';
      return;
    }

    currentUser.value = savedUser;
    await initializeChat();
  } else {
    showAuthDialog.value = true;
  }
});

onBeforeUnmount(() => {
  chatService.unsubscribeFromMessages();
  reactionsUnsubscribe?.();
  leaveVoice();
});

watch(showBanDialog, async (val) => {
  if (val && isModerator.value) {
    bans.value = await chatService.getAllBans();
  }
});

watch(showRoleDialog, async (val) => {
  if (val && isAdminUser.value) {
    await loadAllUsers();
  }
});
</script>

<style scoped>
.dc-wrapper {
  height: calc(100vh - 64px);
  overflow: hidden;
}

.dc-layout {
  display: flex;
  height: 100%;
}

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
}

.dc-channel-group {
  padding: 16px 8px 0;
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

.dc-channel-restricted {
  color: #f9a825;
}

.dc-voice-users {
  padding-left: 28px;
}

.dc-voice-user {
  font-size: 12px;
  padding: 2px 0;
  color: #b5bac1;
}

.dc-user-panel {
  margin-top: auto;
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  background: #232428;
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

.dc-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #313338;
  min-width: 0;
}

.dc-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #1e1f22;
  background: #313338;
  color: white;
  flex-shrink: 0;
}

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

.dc-message-highlight {
  background: rgba(88, 101, 242, 0.15) !important;
  transition: background 0.5s;
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

.dc-members {
  width: 240px;
  background: #2b2d31;
  padding: 16px;
  color: #949ba4;
  overflow-y: auto;
  flex-shrink: 0;
}

.dc-members-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.dc-members-role-header {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 12px 0 4px;
  display: flex;
  align-items: center;
}

.dc-member {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
  color: #b5bac1;
}

/* Emoji picker */
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

/* GIF picker */
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

/* Dialog styling */
.dc-dialog {
  background: #2b2d31 !important;
  color: #dbdee1 !important;
}

/* Mobile responsive */
@media (max-width: 960px) {
  .dc-members {
    display: none;
  }
  .dc-sidebar {
    width: 60px;
  }
  .dc-sidebar-header span,
  .dc-channel-label,
  .dc-channel-item span:not(.v-icon),
  .dc-user-panel span,
  .dc-user-info {
    display: none;
  }
  .dc-channel-item {
    justify-content: center;
    padding: 8px;
  }
}

@media (max-width: 600px) {
  .dc-sidebar {
    width: 50px;
  }
}
</style>
