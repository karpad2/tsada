<template>
    <section class="header-section mb-6">
        <!-- Status Controls -->
        <div class="flex flex-wrap gap-4 mb-4 dark:text-white" v-if="showStatusControls">
            <v-switch
                v-if="showVisible"
                :model-value="visible"
                @update:model-value="$emit('update:visible', $event)"
                :label="$t('visible')"
                @change="$emit('save')"
            />

            <v-switch
                v-if="showNotNews"
                :model-value="notNews"
                @update:model-value="$emit('update:notNews', $event)"
                :label="$t('not_news')"
                @change="$emit('save')"
            />

            <v-switch
                v-if="showDate"
                :model-value="showDateValue"
                @update:model-value="$emit('update:showDate', $event)"
                :label="$t('show_date')"
                @change="$emit('save')"
            />

            <!-- Custom switches slot -->
            <slot name="custom-switches"></slot>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons flex gap-2 mb-4">
            <v-btn
                v-if="showSave"
                @click="$emit('save')"
                :disabled="isLoading('save')"
                :loading="isLoading('save')"
                color="success"
            >
                {{ $t('save') }}
            </v-btn>

            <v-btn
                v-if="showDelete"
                @click="$emit('delete')"
                :disabled="isAnyLoading"
                color="error"
            >
                {{ $t('delete') }}
            </v-btn>

            <v-btn
                v-if="showGoBack"
                @click="$router.go(-1)"
                :disabled="isAnyLoading"
                color="secondary"
            >
                {{ $t('goback') }}
            </v-btn>

            <v-btn
                v-if="showFacebookShare"
                @click="$emit('facebook-share')"
                :disabled="isAnyLoading"
                color="primary"
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
    emits: ['save', 'delete', 'facebook-share', 'update:visible', 'update:notNews', 'update:showDate'],
    props: {
        // Status controls
        visible: {
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

        // Control visibility
        showStatusControls: {
            type: Boolean,
            default: true
        },
        showVisible: {
            type: Boolean,
            default: true
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
            default: false
        },
        showFacebookShare: {
            type: Boolean,
            default: false
        }
    }
});
</script>

<style scoped>
.header-section {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e5e7eb;
}

.dark .header-section {
    background-color: #111827;
    border-color: #374151;
}

.action-buttons {
    gap: 12px;
}
</style>