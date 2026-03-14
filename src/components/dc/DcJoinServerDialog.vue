<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="emit('update:modelValue', $event)">
    <v-card class="dc-dialog">
      <v-card-title>
        <v-icon class="mr-2">mdi-login</v-icon>
        {{ $t('dc_join_server') }}
      </v-card-title>
      <v-card-text>
        <v-alert v-if="joinServerError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ joinServerError }}
        </v-alert>

        <!-- Invite code -->
        <v-text-field
          v-model="joinInviteCode"
          :label="$t('dc_invite_code')"
          variant="outlined"
          maxlength="20"
          :hint="$t('dc_join_with_code')"
          persistent-hint
        />
        <v-btn color="primary" :loading="loading" :disabled="!joinInviteCode.trim()" @click="joinWithCode" class="mb-6" block>
          {{ $t('dc_join_server') }}
        </v-btn>

        <!-- Public servers browser -->
        <div class="dc-channel-label mb-2">{{ $t('dc_public_servers') }}</div>
        <div v-if="publicServers.length === 0" class="text-center text-grey py-4">
          {{ $t('dc_no_public_servers') }}
        </div>
        <v-list v-else density="compact" bg-color="transparent">
          <v-list-item v-for="srv in publicServers" :key="srv.$id" class="mb-1 rounded">
            <template #prepend>
              <span class="dc-server-emoji-small mr-2">{{ srv.icon || '🖥️' }}</span>
            </template>
            <v-list-item-title class="text-white">{{ srv.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ srv.description }}</v-list-item-subtitle>
            <template #append>
              <v-btn size="small" color="primary" variant="tonal" @click="joinPublicServer(srv)">
                {{ $t('dc_join_server') }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">{{ $t('dc_close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DcChatService, type DcServer, type DcUser } from '@/services/DcChatService'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  chatService: DcChatService
  currentUser: DcUser
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'joined': [server: DcServer]
}>()

const joinInviteCode = ref('')
const joinServerError = ref('')
const loading = ref(false)
const publicServers = ref<DcServer[]>([])

watch(() => props.modelValue, async (val) => {
  if (val) {
    joinServerError.value = ''
    joinInviteCode.value = ''
    publicServers.value = await props.chatService.getPublicServers()
  }
})

async function joinWithCode() {
  if (!props.currentUser.$id || !joinInviteCode.value.trim()) return

  loading.value = true
  joinServerError.value = ''
  try {
    const result = await props.chatService.joinServer(
      joinInviteCode.value.trim(),
      props.currentUser.$id!,
      props.currentUser.nickname
    )

    if (result.success && result.server) {
      emit('update:modelValue', false)
      emit('joined', result.server)
      joinInviteCode.value = ''
    } else {
      joinServerError.value = result.error || t('dc_error')
    }
  } finally {
    loading.value = false
  }
}

async function joinPublicServer(server: DcServer) {
  if (!props.currentUser.$id) return

  loading.value = true
  try {
    const result = await props.chatService.joinPublicServer(
      server.$id!,
      props.currentUser.$id!,
      props.currentUser.nickname
    )

    if (result.success) {
      emit('update:modelValue', false)
      emit('joined', server)
    } else {
      joinServerError.value = result.error || t('dc_error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dc-dialog {
  background: #2b2d31 !important;
  color: #dbdee1 !important;
}

.dc-channel-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #949ba4;
}

.dc-server-emoji-small {
  font-size: 18px;
}
</style>
