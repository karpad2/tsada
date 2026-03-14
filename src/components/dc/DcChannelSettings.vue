<template>
  <Teleport to="body">
    <div class="dc-settings-overlay" ref="overlayRef" tabindex="-1" @keydown.esc="emit('close')">
      <!-- Left sidebar navigation -->
      <div class="dc-settings-sidebar">
        <div class="dc-settings-sidebar-inner">
          <div class="dc-settings-server-name">
            <v-icon size="14" class="mr-1">{{ channel.type === 'text' ? 'mdi-pound' : 'mdi-volume-high' }}</v-icon>
            {{ channel.name }}
          </div>
          <div class="dc-settings-category">
            {{ channel.type === 'text' ? $t('dc_channel_text_channels') : $t('dc_channel_voice_channels') }}
          </div>

          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'overview' }"
            @click="activeSection = 'overview'"
          >
            {{ $t('dc_channel_overview') }}
          </div>
          <div
            class="dc-settings-nav-item"
            :class="{ active: activeSection === 'permissions' }"
            @click="activeSection = 'permissions'"
          >
            {{ $t('dc_channel_permissions') }}
          </div>

          <div class="dc-settings-separator"></div>

          <div
            class="dc-settings-nav-item dc-settings-danger"
            :class="{ active: activeSection === 'delete' }"
            @click="activeSection = 'delete'"
          >
            {{ $t('dc_delete_channel') }}
          </div>
        </div>
      </div>

      <!-- Right content area -->
      <div class="dc-settings-content">
        <div class="dc-settings-content-inner">

          <!-- ===== OVERVIEW ===== -->
          <div v-if="activeSection === 'overview'">
            <h2 class="dc-settings-section-header">{{ $t('dc_channel_overview') }}</h2>

            <div class="dc-settings-field-label">{{ $t('dc_channel_name') }}</div>
            <v-text-field
              v-model="editName"
              variant="outlined"
              density="compact"
              hide-details
              class="dc-settings-input mb-4"
            />

            <div v-if="channel.type === 'text'" class="mb-4">
              <div class="dc-settings-field-label">{{ $t('dc_channel_topic') }}</div>
              <v-textarea
                v-model="editTopic"
                variant="outlined"
                density="compact"
                rows="4"
                :maxlength="1024"
                counter
                :placeholder="$t('dc_channel_topic_placeholder')"
                class="dc-settings-input"
              />
            </div>

            <div v-if="channel.type === 'text'" class="mb-4">
              <div class="dc-settings-field-label">{{ $t('dc_channel_slowmode') }}</div>
              <div class="dc-settings-field-hint">{{ $t('dc_channel_slowmode_hint') }}</div>
              <v-select
                v-model="editSlowmode"
                :items="slowmodeOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="compact"
                hide-details
                class="dc-settings-input"
                style="max-width: 200px;"
              />
            </div>

            <v-btn
              color="#5865f2"
              class="mt-2"
              :loading="actionLoading"
              @click="saveOverview"
            >
              {{ $t('dc_settings_save_changes') }}
            </v-btn>
            <span v-if="saveSuccess" class="dc-settings-saved-msg ml-3">{{ $t('dc_settings_changes_saved') }}</span>
          </div>

          <!-- ===== PERMISSIONS ===== -->
          <div v-if="activeSection === 'permissions'">
            <h2 class="dc-settings-section-header">{{ $t('dc_channel_permissions') }}</h2>

            <!-- Private channel toggle -->
            <div class="dc-settings-card mb-6">
              <div class="d-flex align-center">
                <v-icon class="mr-3" color="#949ba4">mdi-lock</v-icon>
                <div>
                  <div class="dc-settings-perm-title">{{ $t('dc_channel_private') }}</div>
                  <div class="dc-settings-field-hint">{{ $t('dc_channel_private_hint') }}</div>
                </div>
                <v-spacer />
                <v-switch
                  v-model="isPrivate"
                  color="#5865f2"
                  hide-details
                  @update:model-value="onPrivateToggle"
                />
              </div>
            </div>

            <!-- View Role -->
            <div class="dc-settings-field-label">{{ $t('dc_channel_view_role') }}</div>
            <v-select
              v-model="editViewRole"
              :items="roleOptions"
              item-title="name"
              item-value="key"
              variant="outlined"
              density="compact"
              hide-details
              class="dc-settings-input mb-4"
              style="max-width: 250px;"
            />

            <!-- Write Role -->
            <div class="dc-settings-field-label">{{ $t('dc_channel_write_role') }}</div>
            <v-select
              v-model="editWriteRole"
              :items="roleOptions"
              item-title="name"
              item-value="key"
              variant="outlined"
              density="compact"
              hide-details
              class="dc-settings-input mb-4"
              style="max-width: 250px;"
            />

            <!-- Visual role permission cards -->
            <div class="dc-settings-field-label mt-6">{{ $t('dc_settings_role_hierarchy') }}</div>
            <div class="dc-settings-perm-grid">
              <div v-for="role in roleOrder" :key="role" class="dc-settings-perm-card">
                <div class="dc-settings-perm-card-header">
                  <v-icon size="16" :color="DC_ROLES[role].color" class="mr-1">{{ DC_ROLES[role].icon }}</v-icon>
                  <span :style="{ color: DC_ROLES[role].color }">{{ $t('dc_role_' + role) }}</span>
                </div>
                <div class="dc-settings-perm-card-perms">
                  <div class="dc-settings-perm-item">
                    <v-icon size="14" :color="canRoleView(role) ? '#57f287' : '#ed4245'">
                      {{ canRoleView(role) ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                    <span>View</span>
                  </div>
                  <div class="dc-settings-perm-item">
                    <v-icon size="14" :color="canRoleWrite(role) ? '#57f287' : '#ed4245'">
                      {{ canRoleWrite(role) ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                    <span>Write</span>
                  </div>
                </div>
              </div>
            </div>

            <v-btn
              color="#5865f2"
              class="mt-6"
              :loading="actionLoading"
              @click="savePermissions"
            >
              {{ $t('dc_settings_save_changes') }}
            </v-btn>
            <span v-if="saveSuccess" class="dc-settings-saved-msg ml-3">{{ $t('dc_settings_changes_saved') }}</span>
          </div>

          <!-- ===== DELETE CHANNEL ===== -->
          <div v-if="activeSection === 'delete'">
            <h2 class="dc-settings-section-header dc-settings-danger-text">{{ $t('dc_delete_channel') }}</h2>

            <div class="dc-settings-danger-card">
              <div>
                <div class="dc-settings-danger-card-title">
                  {{ $t('dc_delete_channel') }}: #{{ channel.name }}
                </div>
                <div class="dc-settings-danger-card-desc">{{ $t('dc_channel_delete_warning') }}</div>
              </div>
              <v-btn color="error" variant="tonal" @click="confirmDeleteChannel">
                {{ $t('dc_delete_channel') }}
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog'
import {
  DcChatService,
  DC_ROLES,
  type DcRoleType,
  type DcServerChannel
} from '@/services/DcChatService'

const { t } = useI18n()
const { openDialog } = useConfirmDialog()

const roleOrder: DcRoleType[] = ['owner', 'admin', 'moderator', 'vip', 'trusted', 'member']

const props = defineProps<{
  channel: DcServerChannel
  chatService: DcChatService
}>()

const emit = defineEmits<{
  'close': []
  'update:channel': [channel: DcServerChannel]
  'channel-deleted': [channelId: string]
}>()

// ==================== STATE ====================

const overlayRef = ref<HTMLElement | null>(null)
const activeSection = ref('overview')
const actionLoading = ref(false)
const saveSuccess = ref(false)

// Overview edit
const editName = ref(props.channel.name)
const editTopic = ref(props.channel.topic || '')
const editSlowmode = ref(props.channel.slowmode || 0)

// Permissions edit
const editViewRole = ref(props.channel.view_role || 'member')
const editWriteRole = ref(props.channel.write_role || 'member')
const isPrivate = ref(props.channel.view_role !== 'member')

const slowmodeOptions = computed(() => [
  { label: t('dc_channel_slowmode_off'), value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
])

const roleOptions = computed(() =>
  Object.entries(DC_ROLES).map(([key, val]) => ({ key, name: t('dc_role_' + key), color: val.color }))
)

// ==================== COMPUTED ====================

function canRoleView(role: DcRoleType): boolean {
  const roleLevel = DC_ROLES[role]?.level || 0
  const requiredLevel = DC_ROLES[editViewRole.value as DcRoleType]?.level || 0
  return roleLevel >= requiredLevel
}

function canRoleWrite(role: DcRoleType): boolean {
  const roleLevel = DC_ROLES[role]?.level || 0
  const requiredLevel = DC_ROLES[editWriteRole.value as DcRoleType]?.level || 0
  return roleLevel >= requiredLevel
}

// ==================== LIFECYCLE ====================

onMounted(() => {
  nextTick(() => {
    overlayRef.value?.focus()
  })
})

// ==================== ACTIONS ====================

function onPrivateToggle(val: boolean) {
  if (val) {
    editViewRole.value = 'trusted'
  } else {
    editViewRole.value = 'member'
  }
}

async function saveOverview() {
  if (!props.channel.$id) return
  actionLoading.value = true
  saveSuccess.value = false
  try {
    await props.chatService.updateChannel(props.channel.$id, {
      name: editName.value,
      topic: editTopic.value,
      slowmode: editSlowmode.value
    })
    emit('update:channel', {
      ...props.channel,
      name: editName.value,
      topic: editTopic.value,
      slowmode: editSlowmode.value
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } finally {
    actionLoading.value = false
  }
}

async function savePermissions() {
  if (!props.channel.$id) return
  actionLoading.value = true
  saveSuccess.value = false
  try {
    await props.chatService.updateChannel(props.channel.$id, {
      view_role: editViewRole.value,
      write_role: editWriteRole.value
    })
    emit('update:channel', {
      ...props.channel,
      view_role: editViewRole.value,
      write_role: editWriteRole.value
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } finally {
    actionLoading.value = false
  }
}

async function confirmDeleteChannel() {
  const result = await openDialog({
    title: t('dc_delete_channel'),
    message: `${t('dc_delete_channel')}: #${props.channel.name}?`,
    confirmText: t('dc_delete_channel'),
    color: 'error',
    icon: 'mdi-delete'
  })
  if (!result) return

  await props.chatService.deleteChannel(props.channel.$id!)
  emit('channel-deleted', props.channel.$id!)
}
</script>

<style scoped>
/* Reuse identical overlay styles from DcServerSettings */
.dc-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 210;
  display: flex;
  background: #313338;
  outline: none;
}

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
  display: flex;
  align-items: center;
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
  margin-bottom: 8px;
}

.dc-settings-card {
  background: #1e1f22;
  border-radius: 8px;
  padding: 16px;
}

.dc-settings-saved-msg {
  color: #57f287;
  font-size: 13px;
  font-weight: 500;
}

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

/* Permissions specific */
.dc-settings-perm-title {
  font-size: 15px;
  font-weight: 600;
  color: #f2f3f5;
}

.dc-settings-perm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.dc-settings-perm-card {
  background: #1e1f22;
  border-radius: 8px;
  padding: 12px;
}

.dc-settings-perm-card-header {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.dc-settings-perm-card-perms {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dc-settings-perm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #b5bac1;
}

/* Close button */
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
  z-index: 211;
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

/* Input styling */
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

/* Responsive */
@media (max-width: 960px) {
  .dc-settings-sidebar {
    width: 180px;
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
  .dc-settings-danger-card {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .dc-settings-perm-grid {
    grid-template-columns: 1fr;
  }
}
</style>
