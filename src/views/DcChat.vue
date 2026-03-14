<template>
  <div class="dc-wrapper">
    <!-- Auth Dialog -->
    <DcAuthDialog
      v-model="showAuthDialog"
      :chat-service="chatService"
      @authenticated="onAuthenticated"
    />

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
      <!-- Server Bar -->
      <DcServerBar
        :servers="myServers"
        :current-server-id="currentServer?.$id || null"
        :dm-active="dm.dmActive.value"
        :dm-unread-count="dm.unreadTotal.value"
        @select-server="switchServer"
        @select-default="switchToDefaultServer"
        @create-server="showCreateServerDialog = true"
        @join-server="showJoinServerDialog = true"
        @select-dm="handleSelectDm"
      />

      <!-- DM Mode -->
      <template v-if="dm.dmActive.value">
        <DcDmSidebar
          :conversations="dm.conversations.value"
          :contacts="dm.contacts.value"
          :connection-states="dm.connectionStates.value"
          :current-conversation-id="dm.currentConversationId.value"
          @open-conversation="dm.openConversation"
          @add-contact="showAddContactDialog = true"
        />

        <div class="dc-main">
          <DcDmChat
            v-if="dm.currentConversationId.value && currentDmPeer"
            :peer-nickname="currentDmPeer.peerNickname"
            :messages="dm.currentMessages.value"
            :current-user-id="currentUser?.$id || ''"
            :connection-state="dm.connectionStates.value[currentDmPeer.peerUserId] || 'disconnected'"
            :peer-typing="!!dm.typingPeers.value[currentDmPeer.peerUserId]"
            :has-more-messages="dm.hasMoreMessages.value"
            :is-loading-more="dm.isLoadingMore.value"
            @send="dm.sendMessage"
            @send-file="dm.sendFile"
            @typing="dm.sendTyping()"
            @load-more="dm.loadMoreMessages()"
            @close="dm.currentConversationId.value = null"
            @start-voice-call="onDmStartCall(false)"
            @start-video-call="onDmStartCall(true)"
          />
          <div v-else class="dc-dm-empty-main">
            <v-icon size="64" color="#5865f2" class="mb-3">mdi-message-lock</v-icon>
            <div class="dc-dm-empty-title">{{ $t('dc_dm_select_conversation') }}</div>
            <div class="dc-dm-empty-sub">{{ $t('dc_dm_e2ee_desc') }}</div>
          </div>
        </div>
      </template>

      <!-- Server Mode -->
      <template v-else>
      <!-- Channel Sidebar -->
      <DcSidebar
        :current-server="currentServer"
        :text-channels="visibleTextChannels"
        :voice-channels="visibleVoiceChannels"
        :current-channel="currentChannel"
        :current-voice-channel="currentVoiceChannel"
        :voice-users="voiceUsers"
        :current-user="currentUser"
        :voice-muted="voiceMuted"
        :voice-camera-on="voiceCameraOn"
        :voice-screen-sharing="voiceScreenSharing"
        :can-manage="canManageCurrentServer"
        :current-user-role-color="currentUserRoleColor"
        @select-channel="switchChannel"
        @toggle-voice="toggleVoiceChannel"
        @open-settings="openServerSettings"
        @toggle-mute="toggleMute"
        @toggle-camera="toggleCamera"
        @toggle-screen-share="toggleScreenShare"
        @play-soundboard="playSoundboard"
        @logout="handleLogout"
        @leave-voice="leaveVoice"
      />

      <!-- Main Chat Area -->
      <div class="dc-main">
        <!-- Voice Channel View -->
        <template v-if="viewingVoiceChannel && currentVoiceChannel">
          <!-- Voice Channel Header -->
          <div class="dc-header">
            <v-icon size="20" class="mr-2">mdi-volume-high</v-icon>
            <span class="font-weight-bold">{{ activeVoiceChannelName }}</span>
          </div>

          <DcVoiceView
            :channel-users="voiceUsers[currentVoiceChannel] || []"
            :current-user="currentUser"
            :all-users="allUsers"
            :voice-muted="voiceMuted"
            :voice-camera-on="voiceCameraOn"
            :voice-screen-sharing="voiceScreenSharing"
            :remote-screen-stream="remoteScreenStream"
            :screen-share-user="screenShareUser"
            :remote-video-streams="remoteVideoStreams"
          />
        </template>

        <!-- Text Channel View -->
        <template v-else>
          <!-- Screen Share Overlay -->
          <div v-if="remoteScreenStream" class="dc-screen-share-overlay">
            <div class="dc-screen-share-header">
              <v-icon size="16" class="mr-1">mdi-monitor-share</v-icon>
              {{ screenShareUser }} {{ $t('dc_screen_sharing') }}
              <v-spacer />
              <v-btn icon size="x-small" variant="text" @click="remoteScreenStream = null; screenShareUser = ''">
                <v-icon size="16">mdi-close</v-icon>
              </v-btn>
            </div>
            <video ref="screenShareVideo" class="dc-screen-share-video" autoplay playsinline></video>
          </div>

          <!-- Channel Header -->
          <div class="dc-header">
            <v-icon size="20" class="mr-2">{{ currentChannelIcon }}</v-icon>
            <span class="font-weight-bold">{{ currentChannelName }}</span>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">{{ $t('dc_messages_count', { count: messages.length }) }}</span>
            <v-btn v-if="isModerator" icon size="small" variant="text" class="ml-2" @click="showBanDialog = true">
              <v-icon size="18">mdi-shield-account</v-icon>
            </v-btn>
            <v-btn v-if="isAdminUser" icon size="small" variant="text" class="ml-1" @click="showRoleDialog = true">
              <v-icon size="18">mdi-account-cog</v-icon>
            </v-btn>
          </div>

          <!-- Messages -->
          <DcMessageList
            ref="messageListRef"
            :messages="messages"
            :client-id="clientId"
            :message-reactions="messageReactions"
            :server-emojis="serverEmojis"
            :all-users="allUsers"
            :server-members="serverMembers"
            :current-server="currentServer"
            :is-moderator="isModerator"
            :can-write="canWriteCurrentChannel"
            :chat-service="chatService"
            @reply="setReplyTo"
            @delete-msg="deleteMsg"
            @ban-user="banUserFromMessage"
            @toggle-reaction="toggleReaction"
          />

          <!-- Message Input -->
          <DcMessageInput
            :channel-name="currentChannelName"
            :can-write="canWriteCurrentChannel"
            :replying-to="replyingTo"
            :reply-color="replyColor"
            :server-emojis="serverEmojis"
            :chat-service="chatService"
            @send="onSendMessage"
            @cancel-reply="replyingTo = null"
          />
        </template>
      </div>

      <!-- Members Sidebar -->
      <DcMembersSidebar
        :all-users="allUsers"
        :server-members="serverMembers"
        :current-server="currentServer"
      />
      </template>
    </div>

    <!-- ======================== DIALOGS ======================== -->

    <DcCreateServerDialog
      v-if="currentUser"
      v-model="showCreateServerDialog"
      :chat-service="chatService"
      :current-user="currentUser"
      @created="onServerAddedOrJoined"
    />

    <DcJoinServerDialog
      v-if="currentUser"
      v-model="showJoinServerDialog"
      :chat-service="chatService"
      :current-user="currentUser"
      @joined="onServerAddedOrJoined"
    />

    <!-- Server Settings -->
    <DcServerSettings
      v-if="showServerSettingsDialog && currentServer && currentUser"
      :server="currentServer"
      :current-user="currentUser"
      :members="serverMembers"
      :channels="serverChannelsList"
      :emojis="serverEmojis"
      :bans="bans"
      :chat-service="chatService"
      :current-membership="currentMembership"
      @close="showServerSettingsDialog = false"
      @update:server="handleServerUpdate"
      @update:members="serverMembers = $event"
      @update:channels="serverChannelsList = $event"
      @update:emojis="serverEmojis = $event"
      @update:bans="bans = $event"
      @server-deleted="onServerRemovedOrLeft"
      @server-left="onServerRemovedOrLeft"
    />

    <!-- Ban Dialog -->
    <DcBanDialog
      v-model="showBanDialog"
      :bans="bans"
      @unban="unbanUser"
    />

    <!-- Role Manager Dialog (Admin+) -->
    <v-dialog v-model="showRoleDialog" max-width="600">
      <v-card class="dc-dialog">
        <v-card-title>
          <v-icon class="mr-2">mdi-account-cog</v-icon>
          {{ $t('dc_role_management') }}
        </v-card-title>
        <v-card-text>
          <v-list density="compact" bg-color="transparent">
            <v-list-item v-for="user in allUsers" :key="user.$id">
              <template #prepend>
                <v-icon :color="DC_ROLES[user.role || 'member']?.color">
                  {{ DC_ROLES[user.role || 'member']?.icon }}
                </v-icon>
              </template>
              <v-list-item-title :style="{ color: DC_ROLES[user.role || 'member']?.color }">{{ user.nickname }}</v-list-item-title>
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

    <!-- Screen Share Settings Dialog -->
    <DcScreenShareDialog
      v-model="showScreenShareDialog"
      @start-share="startScreenShare"
    />

    <!-- DM Add Contact Dialog -->
    <DcAddContactDialog
      v-if="currentUser"
      v-model="showAddContactDialog"
      :contacts="dm.contacts.value"
      :search-fn="dm.searchUsers"
      @add-contact="dm.addContact"
    />

    <!-- DM Call Dialog (globally visible, independent of DM mode) -->
    <DcDmCallDialog
      v-if="dm.callState.value !== 'idle'"
      :call-state="dm.callState.value"
      :peer-nickname="dm.callPeerNickname.value"
      :with-video="dm.callWithVideo.value"
      :local-stream="dm.localCallStream.value"
      :remote-stream="dm.remoteCallStream.value"
      :muted="dm.callMuted.value"
      :video-off="dm.callVideoOff.value"
      @accept="dm.acceptCall()"
      @reject="dm.rejectCall()"
      @hangup="dm.hangupCall()"
      @toggle-mute="dm.toggleCallMute()"
      @toggle-video="dm.toggleCallVideo()"
    />
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
  type DcServer,
  type DcServerMember,
  type DcServerChannel,
  type DcCustomEmoji
} from '@/services/DcChatService';
import { VoiceManager } from '@/utils/voiceManager';
import { playSoundboardSound } from '@/utils/voiceSounds';

// Components
import DcAuthDialog from '@/components/dc/DcAuthDialog.vue';
import DcServerBar from '@/components/dc/DcServerBar.vue';
import DcSidebar from '@/components/dc/DcSidebar.vue';
import DcMessageList from '@/components/dc/DcMessageList.vue';
import DcMessageInput from '@/components/dc/DcMessageInput.vue';
import DcMembersSidebar from '@/components/dc/DcMembersSidebar.vue';
import DcServerSettings from '@/components/dc/DcServerSettings.vue';
import DcCreateServerDialog from '@/components/dc/DcCreateServerDialog.vue';
import DcJoinServerDialog from '@/components/dc/DcJoinServerDialog.vue';
import DcBanDialog from '@/components/dc/DcBanDialog.vue';
import DcVoiceView from '@/components/dc/DcVoiceView.vue';
import DcScreenShareDialog from '@/components/dc/DcScreenShareDialog.vue';
import type { ScreenShareSettings } from '@/components/dc/DcScreenShareDialog.vue';
import DcDmSidebar from '@/components/dc/DcDmSidebar.vue';
import DcDmChat from '@/components/dc/DcDmChat.vue';
import DcAddContactDialog from '@/components/dc/DcAddContactDialog.vue';
import DcDmCallDialog from '@/components/dc/DcDmCallDialog.vue';
import { useDcDm } from '@/composables/useDcDm';
import { useNotifier } from '@/composables/useNotifier';

const { notify } = useNotifier();
const { t } = useI18n();
const { openDialog } = useConfirmDialog();
const chatService = new DcChatService();

// DM System
const dm = useDcDm();
const showAddContactDialog = ref(false);

// ==================== CORE STATE ====================
const currentUser = ref<DcUser | null>(null);
const clientId = DcChatService.getClientId();
const showAuthDialog = ref(false);
const isBanned = ref(false);
const banReason = ref('');

// ==================== SERVERS ====================
const myServers = ref<DcServer[]>([]);
const currentServer = ref<DcServer | null>(null);
const serverChannelsList = ref<DcServerChannel[]>([]);
const serverEmojis = ref<DcCustomEmoji[]>([]);
const serverMembers = ref<DcServerMember[]>([]);

// Dialogs
const showCreateServerDialog = ref(false);
const showJoinServerDialog = ref(false);
const showServerSettingsDialog = ref(false);
const showBanDialog = ref(false);
const showRoleDialog = ref(false);

// ==================== MESSAGES & CHANNELS ====================
const messages = ref<DcMessage[]>([]);
const currentChannel = ref('általános');
const currentVoiceChannel = ref<string | null>(null);
const viewingVoiceChannel = ref(false);
const voiceUsers = ref<Record<string, string[]>>({});
const messageReactions = ref<Record<string, DcReaction[]>>({});
let reactionsUnsubscribe: (() => void) | null = null;
let voicePresenceUnsubscribe: (() => void) | null = null;

// Reply
const replyingTo = ref<DcMessage | null>(null);

// Users
const allUsers = ref<DcUser[]>([]);
const bans = ref<DcBan[]>([]);

// Refs
const messageListRef = ref<InstanceType<typeof DcMessageList> | null>(null);

// ==================== VOICE ====================
const voiceMuted = ref(false);
const voiceCameraOn = ref(false);
const voiceScreenSharing = ref(false);
const showScreenShareDialog = ref(false);
const remoteScreenStream = ref<MediaStream | null>(null);
const screenShareUser = ref('');
const screenShareVideo = ref<HTMLVideoElement | null>(null);
const remoteVideoStreams = ref<Record<string, MediaStream>>({});
let voiceManager: VoiceManager | null = null;

// ==================== COMPUTED ====================

interface DisplayChannel {
  key: string;
  name: string;
  icon: string;
  locked: boolean;
}

const activeVoiceChannelName = computed(() => {
  if (!currentVoiceChannel.value) return '';
  const vcs = visibleVoiceChannels.value;
  const vc = vcs.find(c => c.key === currentVoiceChannel.value);
  return vc ? vc.name : currentVoiceChannel.value;
});

const currentChannelData = computed(() => {
  if (currentServer.value) {
    const ch = serverChannelsList.value.find(c => c.$id === currentChannel.value);
    return { icon: ch?.icon || 'mdi-pound', name: ch?.name || currentChannel.value };
  }
  const ch = DC_TEXT_CHANNELS.find(c => c.id === currentChannel.value);
  return { icon: ch?.icon || 'mdi-pound', name: ch ? t(ch.nameKey) : currentChannel.value };
});

const currentChannelIcon = computed(() => currentChannelData.value.icon);
const currentChannelName = computed(() => currentChannelData.value.name);

const visibleTextChannels = computed((): DisplayChannel[] => {
  if (currentServer.value) {
    return serverChannelsList.value
      .filter(c => c.type === 'text')
      .map(c => ({ key: c.$id!, name: c.name, icon: c.icon, locked: false }));
  }
  return DC_TEXT_CHANNELS
    .filter(ch => canViewChannel(currentUser.value?.role, ch))
    .map(ch => ({ key: ch.id, name: t(ch.nameKey), icon: ch.icon, locked: ch.viewRole !== 'member' }));
});

const visibleVoiceChannels = computed((): DisplayChannel[] => {
  if (currentServer.value) {
    return serverChannelsList.value
      .filter(c => c.type === 'voice')
      .map(c => ({ key: c.$id!, name: c.name, icon: c.icon, locked: false }));
  }
  return DC_VOICE_CHANNELS
    .filter(ch => canViewChannel(currentUser.value?.role, ch))
    .map(ch => ({ key: ch.id, name: t(ch.nameKey), icon: ch.icon, locked: ch.viewRole !== 'member' }));
});

const canWriteCurrentChannel = computed(() => {
  if (currentServer.value) return true;
  const channel = DC_TEXT_CHANNELS.find(c => c.id === currentChannel.value);
  if (!channel) return false;
  return canWriteChannel(currentUser.value?.role, channel);
});

const currentMembership = computed(() => {
  if (!currentServer.value || !currentUser.value) return null;
  return serverMembers.value.find(m => m.user_id === currentUser.value?.$id) || null;
});

const canManageCurrentServer = computed(() => {
  const role = currentMembership.value?.role;
  return role === 'owner' || role === 'admin';
});

const currentUserRoleColor = computed(() => {
  if (currentServer.value) {
    return DC_ROLES[currentMembership.value?.role || 'member']?.color || 'grey';
  }
  return DC_ROLES[currentUser.value?.role || 'member']?.color || 'grey';
});

const isModerator = computed(() => canModerate(currentUser.value?.role));
const isAdminUser = computed(() => isAdmin(currentUser.value?.role));

const roleOptions = computed(() =>
  Object.entries(DC_ROLES).map(([key, val]) => ({ key, name: t('dc_role_' + key), color: val.color }))
);

const replyColor = computed(() => {
  if (!replyingTo.value) return '#b5bac1';
  const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
    '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722'];
  const name = replyingTo.value.nickname;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
});

// ==================== AUTH ====================

function onAuthenticated(user: DcUser) {
  currentUser.value = user;
  showAuthDialog.value = false;
  dm.initializeCallManager(user);
  dm.initialize(user); // start receiving messages immediately, not just when DM tab is opened
  initializeChat();
}

function handleLogout() {
  chatService.logout();
  currentUser.value = null;
  messages.value = [];
  currentServer.value = null;
  myServers.value = [];
  showAuthDialog.value = true;
}

// ==================== SERVER FUNCTIONS ====================

async function loadMyServers() {
  if (!currentUser.value?.$id) return;
  myServers.value = await chatService.getMyServers(currentUser.value.$id);
}

async function switchToDefaultServer() {
  dm.deactivateDm();
  currentServer.value = null;
  serverChannelsList.value = [];
  serverEmojis.value = [];
  serverMembers.value = [];
  currentChannel.value = 'általános';
  await loadMessages();
  subscribeToChannel();
}

async function switchServer(server: DcServer) {
  dm.deactivateDm();
  if (currentServer.value?.$id === server.$id) return;

  currentServer.value = server;
  const [channels, emojis, members] = await Promise.all([
    chatService.getServerChannels(server.$id!),
    chatService.getServerEmojis(server.$id!),
    chatService.getServerMembers(server.$id!),
    chatService.getEncryptionKey(server.$id!)
  ]);
  serverChannelsList.value = channels;
  serverEmojis.value = emojis;
  serverMembers.value = members;

  const firstText = serverChannelsList.value.find(c => c.type === 'text');
  if (firstText) {
    currentChannel.value = firstText.$id!;
    await loadMessages();
    subscribeToChannel();
  } else {
    currentChannel.value = '';
    messages.value = [];
  }
}

async function onServerAddedOrJoined(server: DcServer) {
  await loadMyServers();
  await switchServer(server);
}

async function openServerSettings() {
  if (!currentServer.value) return;
  if (isModerator.value) {
    bans.value = await chatService.getAllBans();
  }
  showServerSettingsDialog.value = true;
}

function handleServerUpdate(server: DcServer) {
  currentServer.value = server;
  loadMyServers();
}

async function onServerRemovedOrLeft() {
  showServerSettingsDialog.value = false;
  await switchToDefaultServer();
  await loadMyServers();
}

// ==================== CHAT FUNCTIONS ====================

async function initializeChat() {
  await loadMessages();
  subscribeToChannel();
  subscribeToReactions();

  const promises: Promise<void>[] = [loadAllUsers(), loadMyServers(), loadVoicePresence()];
  if (isModerator.value) promises.push(loadBans());
  await Promise.all(promises);

  subscribeToVoicePresence();
}

async function loadVoicePresence() {
  try {
    const presence = await chatService.getActiveVoiceUsers();
    // Merge with existing voiceUsers (don't overwrite if we're already tracking)
    for (const [channelId, users] of Object.entries(presence)) {
      if (!voiceUsers.value[channelId]) voiceUsers.value[channelId] = [];
      for (const user of users) {
        if (!voiceUsers.value[channelId].includes(user)) {
          voiceUsers.value[channelId].push(user);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load voice presence:', error);
  }
}

function subscribeToVoicePresence() {
  voicePresenceUnsubscribe?.();
  voicePresenceUnsubscribe = chatService.subscribeToVoicePresence(
    (nickname: string, channelId: string) => {
      // User joined or pinged - ensure they're in the list
      if (!voiceUsers.value[channelId]) voiceUsers.value[channelId] = [];
      if (!voiceUsers.value[channelId].includes(nickname)) {
        voiceUsers.value[channelId].push(nickname);
      }
    },
    (nickname: string, _channelId: string) => {
      // User left - remove from all channels
      for (const ch of Object.keys(voiceUsers.value)) {
        voiceUsers.value[ch] = voiceUsers.value[ch].filter(u => u !== nickname);
      }
    }
  );
}

async function loadMessages() {
  if (currentServer.value) {
    messages.value = await chatService.getServerMessages(currentServer.value.$id!, currentChannel.value);
  } else {
    messages.value = await chatService.getMessages(currentChannel.value);
  }
  if (messages.value.length > 0) {
    const ids = messages.value.map(m => m.$id!).filter(Boolean);
    messageReactions.value = await chatService.getReactionsForMessages(ids);
  }
  await nextTick();
  messageListRef.value?.scrollToBottom();
}

function subscribeToChannel() {
  const onMessage = (msg: DcMessage) => {
    if (!messages.value.find(m => m.$id === msg.$id)) {
      messages.value.push(msg);
    }
  };
  if (currentServer.value) {
    chatService.subscribeToServerMessages(currentServer.value.$id!, currentChannel.value, onMessage);
  } else {
    chatService.subscribeToMessages(currentChannel.value, onMessage);
  }
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

function switchChannel(channelId: string) {
  if (!currentServer.value) {
    const channel = DC_TEXT_CHANNELS.find(c => c.id === channelId);
    if (!channel || !canViewChannel(currentUser.value?.role, channel)) return;
  }

  viewingVoiceChannel.value = false;
  currentChannel.value = channelId;
  replyingTo.value = null;
  loadMessages();
  subscribeToChannel();
}

async function onSendMessage(text: string, replyId?: string) {
  if (!currentUser.value) return;
  replyingTo.value = null;

  if (currentServer.value) {
    await chatService.sendServerMessage(currentUser.value.nickname, text, currentServer.value.$id!, currentChannel.value, replyId);
  } else {
    await chatService.sendMessage(currentUser.value.nickname, text, currentChannel.value, replyId);
  }
}

function setReplyTo(msg: DcMessage) {
  replyingTo.value = msg;
}

// ==================== REACTIONS ====================

async function toggleReaction(msg: DcMessage, emoji: string) {
  if (!msg.$id || !currentUser.value) return;
  await chatService.toggleReaction(msg.$id, emoji, currentUser.value.nickname);
}

// ==================== VOICE ====================

function setVideoStream(nickname: string, stream: MediaStream | null) {
  if (stream) {
    remoteVideoStreams.value = { ...remoteVideoStreams.value, [nickname]: stream };
  } else {
    const { [nickname]: _removed, ...rest } = remoteVideoStreams.value;
    remoteVideoStreams.value = rest;
  }
}

function initVoiceManager() {
  voiceManager = new VoiceManager(chatService, {
    onUserJoined(nickname: string) {
      if (currentVoiceChannel.value && !voiceUsers.value[currentVoiceChannel.value]?.includes(nickname)) {
        if (!voiceUsers.value[currentVoiceChannel.value]) voiceUsers.value[currentVoiceChannel.value] = [];
        voiceUsers.value[currentVoiceChannel.value].push(nickname);
      }
    },
    onUserLeft(nickname: string) {
      if (currentVoiceChannel.value && voiceUsers.value[currentVoiceChannel.value]) {
        voiceUsers.value[currentVoiceChannel.value] = voiceUsers.value[currentVoiceChannel.value].filter(u => u !== nickname);
      }
    },
    onMuteChanged(muted: boolean) {
      voiceMuted.value = muted;
    },
    onCameraChanged(active: boolean) {
      voiceCameraOn.value = active;
    },
    onScreenShareChanged(active: boolean, nickname?: string) {
      voiceScreenSharing.value = active && nickname === currentUser.value?.nickname;
      if (active && nickname && nickname !== currentUser.value?.nickname) {
        screenShareUser.value = nickname;
      }
      if (!active && nickname) {
        if (screenShareUser.value === nickname) {
          remoteScreenStream.value = null;
          screenShareUser.value = '';
        }
      }
    },
    onRemoteCameraStream(nickname: string, stream: MediaStream | null) {
      setVideoStream(nickname, stream);
    },
    onRemoteScreenStream(nickname: string, stream: MediaStream | null) {
      setVideoStream(nickname, stream);
      if (stream) {
        if (screenShareUser.value === nickname) {
          remoteScreenStream.value = stream;
          nextTick(() => {
            if (screenShareVideo.value && remoteScreenStream.value) {
              screenShareVideo.value.srcObject = remoteScreenStream.value;
            }
          });
        }
      } else if (screenShareUser.value === nickname) {
        remoteScreenStream.value = null;
        screenShareUser.value = '';
      }
    },
    onError(error: string) {
      console.error('[DcChat] Voice error:', error);
    }
  });
}

function toggleMute() {
  if (voiceManager) voiceManager.toggleMute();
}

async function toggleCamera() {
  if (!voiceManager) return;
  await voiceManager.toggleCamera();
  const nick = currentUser.value?.nickname;
  if (nick) setVideoStream(nick, voiceManager.localCameraStream);
}

function toggleScreenShare() {
  if (!voiceManager) return;
  if (voiceScreenSharing.value) {
    voiceManager.toggleScreenShare();
  } else {
    showScreenShareDialog.value = true;
  }
}

async function startScreenShare(settings: ScreenShareSettings) {
  if (voiceManager) await voiceManager.toggleScreenShare(settings);
}

function playSoundboard(soundId: string) {
  if (voiceManager) {
    voiceManager.playSoundboard(soundId);
  } else {
    playSoundboardSound(soundId);
  }
}

async function toggleVoiceChannel(channelId: string) {
  if (!currentServer.value) {
    const channel = DC_VOICE_CHANNELS.find(c => c.id === channelId);
    if (!channel || !canViewChannel(currentUser.value?.role, channel)) return;
  }

  if (currentVoiceChannel.value !== channelId) {
    if (currentVoiceChannel.value) await leaveVoice();
    await joinVoice(channelId);
  }
  viewingVoiceChannel.value = true;
}

async function joinVoice(channelId: string) {
  if (!currentUser.value) return;
  if (!voiceManager) initVoiceManager();

  const success = await voiceManager!.joinChannel(channelId, currentUser.value.nickname);
  if (success) {
    currentVoiceChannel.value = channelId;
    if (!voiceUsers.value[channelId]) voiceUsers.value[channelId] = [];
    if (!voiceUsers.value[channelId].includes(currentUser.value.nickname)) {
      voiceUsers.value[channelId].push(currentUser.value.nickname);
    }
  }
}

async function leaveVoice() {
  if (!currentUser.value || !voiceManager) return;

  if (currentVoiceChannel.value && voiceUsers.value[currentVoiceChannel.value]) {
    voiceUsers.value[currentVoiceChannel.value] = voiceUsers.value[currentVoiceChannel.value].filter(
      u => u !== currentUser.value?.nickname
    );
  }

  await voiceManager.leaveChannel();
  currentVoiceChannel.value = null;
  viewingVoiceChannel.value = false;
  voiceMuted.value = false;
  voiceCameraOn.value = false;
  voiceScreenSharing.value = false;
  remoteScreenStream.value = null;
  screenShareUser.value = '';
}

// ==================== DM ====================

const currentDmPeer = computed(() => {
  if (!dm.currentConversationId.value) return null;
  const conv = dm.conversations.value.find(c => c.id === dm.currentConversationId.value);
  if (conv) return { peerUserId: conv.peerUserId, peerNickname: conv.peerNickname };
  return null;
});

function handleSelectDm() {
  dm.activateDm();
  if (currentUser.value && !dm.initialized.value) {
    dm.initialize(currentUser.value);
  }
}

async function onDmStartCall(withVideo: boolean) {
  if (!currentDmPeer.value) return;
  const started = await dm.startCall(
    currentDmPeer.value.peerUserId,
    currentDmPeer.value.peerNickname,
    withVideo
  );
  if (!started) {
    notify({ title: t('dc_dm_call_error'), text: t('dc_dm_call_media_error'), type: 'error' });
  }
}

// ==================== USERS & ADMIN ====================

async function loadAllUsers() {
  allUsers.value = await chatService.getAllUsers();
}

async function changeUserRole(user: DcUser, newRole: DcRoleType) {
  if (!user.$id) return;
  await chatService.setUserRole(user.$id, newRole);
  await loadAllUsers();

  if (user.$id === currentUser.value?.$id) {
    currentUser.value = { ...currentUser.value, role: newRole };
  }
}

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
  const savedUser = await chatService.getCurrentUser();

  if (savedUser) {
    const ban = await chatService.isBanned(savedUser.clientId);
    if (ban) {
      isBanned.value = true;
      banReason.value = ban.reason || '';
      return;
    }

    currentUser.value = savedUser;
    dm.initializeCallManager(savedUser);
    dm.initialize(savedUser); // start receiving messages immediately
    await initializeChat();
  } else {
    showAuthDialog.value = true;
  }
});

onBeforeUnmount(() => {
  chatService.unsubscribeFromMessages();
  reactionsUnsubscribe?.();
  voicePresenceUnsubscribe?.();
  if (voiceManager) {
    voiceManager.destroy();
    voiceManager = null;
  }
  dm.destroy();
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
  height: 100vh;
  overflow: hidden;
}

.dc-layout {
  display: flex;
  height: 100%;
}

.dc-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #313338;
  min-width: 0;
  position: relative;
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

.dc-screen-share-overlay {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  bottom: 52px;
  z-index: 10;
  background: #1e1f22;
  display: flex;
  flex-direction: column;
}

.dc-screen-share-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #2b2d31;
  color: #b5bac1;
  font-size: 13px;
}

.dc-screen-share-video {
  flex: 1;
  width: 100%;
  object-fit: contain;
  background: #000;
}

.dc-dialog {
  background: #2b2d31 !important;
  color: #dbdee1 !important;
}

.dc-dm-empty-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #949ba4;
  text-align: center;
}

.dc-dm-empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #dbdee1;
  margin-bottom: 4px;
}

.dc-dm-empty-sub {
  font-size: 14px;
  color: #949ba4;
  max-width: 340px;
}
</style>
