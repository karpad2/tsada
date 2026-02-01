<template>
  <v-dialog v-model="state.visible" max-width="450" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon v-if="state.icon" :color="state.color" class="mr-2">{{ state.icon }}</v-icon>
        {{ state.title || $t('confirm_delete') }}
      </v-card-title>
      <v-card-text>
        <p>{{ state.message }}</p>
        <v-text-field
          v-if="state.prompt"
          v-model="state.promptValue"
          :label="state.promptLabel"
          variant="outlined"
          density="compact"
          class="mt-3"
          autofocus
          @keyup.enter="confirmAction"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancelAction">
          {{ state.cancelText || $t('cancel') }}
        </v-btn>
        <v-btn :color="state.color || 'primary'" variant="flat" @click="confirmAction">
          {{ state.confirmText || $t('accept') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog'

const { state, confirmAction, cancelAction } = useConfirmDialog()
</script>
