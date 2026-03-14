<template>
  <v-dialog :model-value="modelValue" persistent max-width="450" @update:model-value="emit('update:modelValue', $event)">
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DcChatService, type DcUser } from '@/services/DcChatService'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  chatService: DcChatService
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'authenticated': [user: DcUser]
}>()

const authMode = ref<'login' | 'register'>('login')
const authNickname = ref('')
const authPin = ref('')
const authPinConfirm = ref('')
const authError = ref('')
const authLoading = ref(false)
const showPin = ref(false)

const canAuth = computed(() => {
  if (!authNickname.value || authNickname.value.length < 2) return false
  if (!authPin.value || authPin.value.length < 4) return false
  if (authMode.value === 'register' && authPin.value !== authPinConfirm.value) return false
  return true
})

function toggleAuthMode() {
  authMode.value = authMode.value === 'login' ? 'register' : 'login'
  authError.value = ''
  authPin.value = ''
  authPinConfirm.value = ''
}

async function handleAuth() {
  if (!canAuth.value) return

  authLoading.value = true
  authError.value = ''

  try {
    if (authMode.value === 'register') {
      const result = await props.chatService.register(authNickname.value.trim(), authPin.value)
      if (!result.success) {
        authError.value = result.error || t('dc_error')
        return
      }
      emit('authenticated', result.user!)
    } else {
      const result = await props.chatService.login(authNickname.value.trim(), authPin.value)
      if (!result.success) {
        authError.value = result.error || t('dc_error')
        return
      }
      emit('authenticated', result.user!)
    }

    emit('update:modelValue', false)
  } finally {
    authLoading.value = false
  }
}
</script>

<style scoped>
.dc-dialog {
  background: #2b2d31 !important;
  color: #dbdee1 !important;
}
</style>
