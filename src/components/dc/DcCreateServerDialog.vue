<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="emit('update:modelValue', $event)">
    <v-card class="dc-dialog">
      <v-card-title>
        <v-icon class="mr-2">mdi-plus-circle</v-icon>
        {{ $t('dc_create_server') }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="newServerName"
          :label="$t('dc_server_name')"
          variant="outlined"
          maxlength="50"
          counter
        />
        <v-text-field
          v-model="newServerDescription"
          :label="$t('dc_server_description')"
          variant="outlined"
          maxlength="200"
          counter
        />
        <v-text-field
          v-model="newServerIcon"
          :label="$t('dc_server_icon')"
          variant="outlined"
          maxlength="5"
          hint="Emoji (pl. 🎮, 🎵, 📚)"
          persistent-hint
        />
        <v-switch
          v-model="newServerPublic"
          :label="$t('dc_public_server')"
          color="primary"
          hide-details
          class="mt-2"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!newServerName.trim()" @click="createServer">
          {{ $t('dc_create_server') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DcChatService, type DcServer, type DcUser } from '@/services/DcChatService'

const props = defineProps<{
  modelValue: boolean
  chatService: DcChatService
  currentUser: DcUser
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [server: DcServer]
}>()

const newServerName = ref('')
const newServerDescription = ref('')
const newServerIcon = ref('')
const newServerPublic = ref(false)
const loading = ref(false)

async function createServer() {
  if (!props.currentUser.$id || !newServerName.value.trim()) return

  loading.value = true
  try {
    const server = await props.chatService.createServer(
      newServerName.value.trim(),
      newServerIcon.value || '🖥️',
      newServerDescription.value.trim(),
      props.currentUser.$id!,
      props.currentUser.nickname,
      newServerPublic.value
    )

    if (server) {
      emit('update:modelValue', false)
      emit('created', server)
      newServerName.value = ''
      newServerDescription.value = ''
      newServerIcon.value = ''
      newServerPublic.value = false
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
</style>
