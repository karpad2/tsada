<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="emit('update:modelValue', $event)">
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
              <v-btn icon size="small" variant="text" color="success" @click="emit('unban', ban)">
                <v-icon>mdi-account-check</v-icon>
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
import type { DcBan } from '@/services/DcChatService'

defineProps<{
  modelValue: boolean
  bans: DcBan[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'unban': [ban: DcBan]
}>()
</script>

<style scoped>
.dc-dialog {
  background: #2b2d31 !important;
  color: #dbdee1 !important;
}
</style>
