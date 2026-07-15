<template>
  <section class="editor-toolbar">
    <!-- Status Controls -->
    <div class="editor-toolbar-switches dark:text-white" v-if="showStatusControls">
      <v-switch
        v-if="showVisible"
        :model-value="visible"
        @update:model-value="$emit('update:visible', $event)"
        :label="$t('visible')"
        color="primary"
        density="compact"
        hide-details
        @change="$emit('save')"
      />

      <v-switch
        v-if="showPinned"
        :model-value="pinned"
        @update:model-value="$emit('update:pinned', $event)"
        :label="$t('pinned_news')"
        color="orange"
        density="compact"
        hide-details
        @change="$emit('save')"
      />

      <v-switch
        v-if="showNotNews"
        :model-value="notNews"
        @update:model-value="$emit('update:notNews', $event)"
        :label="$t('not_news')"
        color="primary"
        density="compact"
        hide-details
        @change="$emit('save')"
      />

      <v-switch
        v-if="showDate"
        :model-value="showDateValue"
        @update:model-value="$emit('update:showDate', $event)"
        :label="$t('show_date')"
        color="primary"
        density="compact"
        hide-details
        @change="$emit('save')"
      />

      <!-- Custom switches slot -->
      <slot name="custom-switches"></slot>
    </div>

    <!-- Action Buttons -->
    <div class="editor-toolbar-actions">
      <v-btn
        v-if="showSave"
        @click="$emit('save')"
        :disabled="isLoading('save')"
        :loading="isLoading('save')"
        color="success"
        prepend-icon="mdi-content-save"
      >
        {{ $t('save') }}
      </v-btn>

      <v-btn
        v-if="showDelete"
        @click="$emit('delete')"
        :disabled="isAnyLoading"
        color="error"
        variant="outlined"
        prepend-icon="mdi-delete"
      >
        {{ $t('delete') }}
      </v-btn>

      <v-btn
        v-if="showGoBack"
        @click="$router.go(-1)"
        :disabled="isAnyLoading"
        variant="outlined"
        color="primary"
        prepend-icon="mdi-arrow-left"
      >
        {{ $t('goback') }}
      </v-btn>

      <v-btn
        v-if="showFacebookShare"
        @click="$emit('facebook-share')"
        :disabled="isAnyLoading"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-facebook"
      >
        {{ $t('fb_share') }}
      </v-btn>

      <!-- Custom buttons slot -->
      <slot name="custom-buttons"></slot>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GeneralControlsSection',
  emits: ['save', 'delete', 'facebook-share', 'update:visible', 'update:pinned', 'update:notNews', 'update:showDate'],
  props: {
    // Status controls
    visible: {
      type: Boolean,
      default: false
    },
    pinned: {
      type: Boolean,
      default: false
    },
    notNews: {
      type: Boolean,
      default: false
    },
    showDateValue: {
      type: Boolean,
      default: false
    },

    // Loading states
    isLoading: {
      type: Function,
      default: () => false
    },
    isAnyLoading: {
      type: Boolean,
      default: false
    },

    // Visibility of controls
    showStatusControls: {
      type: Boolean,
      default: true
    },
    showVisible: {
      type: Boolean,
      default: true
    },
    showPinned: {
      type: Boolean,
      default: false
    },
    showNotNews: {
      type: Boolean,
      default: false
    },
    showDate: {
      type: Boolean,
      default: false
    },
    showSave: {
      type: Boolean,
      default: true
    },
    showDelete: {
      type: Boolean,
      default: true
    },
    showGoBack: {
      type: Boolean,
      default: true
    },
    showFacebookShare: {
      type: Boolean,
      default: false
    }
  }
});
</script>
