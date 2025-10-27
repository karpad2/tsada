<template>
    <v-card class="language-field-group" elevation="1" rounded>
        <v-card-title class="language-header d-flex align-center pa-3" :class="getLanguageColor(languageKey)">
            <v-icon left>{{ getLanguageIcon(languageKey) }}</v-icon>
            <span class="text-h6">{{ $t(languageKey) }}</span>
            <v-spacer />
            <v-switch
                :model-value="enabled"
                @update:model-value="$emit('update:enabled', $event)"
                color="white"
                inset
                hide-details
                @change="$emit('save')"
            />
        </v-card-title>

        <v-expand-transition>
            <v-card-text v-if="enabled" class="language-content pa-4">
                <v-row>
                    <!-- Title Field -->
                    <v-col v-if="showTitle" cols="12">
                        <v-text-field
                            :model-value="titleValue"
                            @update:model-value="$emit('update:title', $event)"
                            :counter="titleMaxLength"
                            :label="$t(`${languageKey}_title`)"
                            :placeholder="$t('enter_title_placeholder')"
                            variant="outlined"
                            density="comfortable"
                            :prepend-inner-icon="'mdi-format-title'"
                            :error-messages="titleErrors"
                            @input="validateTitle"
                            @change="$emit('save')"
                        >
                            <template #append-inner>
                                <v-icon
                                    v-if="titleValue && titleValue.length > 0"
                                    color="success"
                                    size="small"
                                >
                                    mdi-check-circle
                                </v-icon>
                            </template>
                        </v-text-field>
                    </v-col>

                    <!-- Short Description Field -->
                    <v-col v-if="showShort" cols="12">
                        <v-textarea
                            :model-value="shortValue"
                            @update:model-value="$emit('update:short', $event)"
                            :counter="shortMaxLength"
                            :label="$t(`${languageKey}_short`)"
                            :placeholder="$t('enter_description_placeholder')"
                            variant="outlined"
                            density="comfortable"
                            :prepend-inner-icon="'mdi-text'"
                            :error-messages="shortErrors"
                            rows="3"
                            auto-grow
                            @input="validateShort"
                            @change="$emit('save')"
                        >
                            <template #append-inner>
                                <v-icon
                                    v-if="shortValue && shortValue.length > 0"
                                    color="success"
                                    size="small"
                                >
                                    mdi-check-circle
                                </v-icon>
                            </template>
                        </v-textarea>
                    </v-col>
                </v-row>

                <!-- Content Editor -->
                <div v-if="showContent" class="mt-4">
                    <v-card variant="outlined" rounded>
                        <v-card-title class="text-body-1 pa-3 bg-grey-lighten-4">
                            <v-icon left size="small">mdi-file-document-edit</v-icon>
                            {{ $t(`${languageKey}_content`) }}
                        </v-card-title>
                        <v-card-text class="pa-2">
                            <ckeditor
                                :model-value="contentValue"
                                @update:model-value="$emit('update:content', $event)"
                                @change="$emit('save')"
                                :config="editorConfig"
                            />
                        </v-card-text>
                    </v-card>
                </div>

                <!-- Custom Fields Slot -->
                <div v-if="$slots['custom-fields']" class="mt-4">
                    <slot name="custom-fields" :language="languageKey"></slot>
                </div>

                <!-- Content Statistics -->
                <v-row v-if="showStats" class="mt-4">
                    <v-col cols="12">
                        <v-card variant="tonal" color="info" rounded>
                            <v-card-text class="pa-3">
                                <div class="d-flex gap-4 text-body-2">
                                    <v-chip
                                        v-if="showTitle && titleValue"
                                        size="small"
                                        color="success"
                                        prepend-icon="mdi-format-title"
                                    >
                                        {{ $t('title') }}: {{ titleValue.length }}/{{ titleMaxLength }}
                                    </v-chip>

                                    <v-chip
                                        v-if="showShort && shortValue"
                                        size="small"
                                        color="info"
                                        prepend-icon="mdi-text"
                                    >
                                        {{ $t('description') }}: {{ shortValue.length }}/{{ shortMaxLength }}
                                    </v-chip>

                                    <v-chip
                                        v-if="showContent && contentValue"
                                        size="small"
                                        color="primary"
                                        prepend-icon="mdi-file-document-edit"
                                    >
                                        {{ $t('content') }}: {{ getContentLength(contentValue) }} {{ $t('characters') }}
                                    </v-chip>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-expand-transition>
    </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
    name: 'LanguageFieldGroup',
    emits: ['update:enabled', 'update:title', 'update:short', 'update:content', 'save'],
    setup(props) {
        const { t } = useI18n();

        // Validation state
        const titleErrors = ref<string[]>([]);
        const shortErrors = ref<string[]>([]);

        // Methods
        const getLanguageColor = (lang: string): string => {
            const colors = {
                rs: 'bg-red-darken-1 text-white',
                srb: 'bg-red-darken-1 text-white',
                hu: 'bg-green-darken-1 text-white',
                en: 'bg-blue-darken-1 text-white'
            };
            return colors[lang as keyof typeof colors] || 'bg-grey-darken-1 text-white';
        };

        const getLanguageIcon = (lang: string): string => {
            const icons = {
                rs: 'mdi-flag',
                srb: 'mdi-flag',
                hu: 'mdi-flag',
                en: 'mdi-flag'
            };
            return icons[lang as keyof typeof icons] || 'mdi-translate';
        };

        const validateTitle = (value: string) => {
            titleErrors.value = [];
            if (props.required && (!value || value.trim() === '')) {
                titleErrors.value.push(t('title_required'));
            }
            if (value && value.length > props.titleMaxLength) {
                titleErrors.value.push(t('title_too_long', { max: props.titleMaxLength }));
            }
        };

        const validateShort = (value: string) => {
            shortErrors.value = [];
            if (value && value.length > props.shortMaxLength) {
                shortErrors.value.push(t('description_too_long', { max: props.shortMaxLength }));
            }
        };

        const getContentLength = (content: string): number => {
            // Remove HTML tags for character count
            const div = document.createElement('div');
            div.innerHTML = content || '';
            return div.textContent?.length || 0;
        };

        // CKEditor configuration with minimal toolbar for light/dark mode support
        const editorConfig = computed(() => ({
            toolbar: {
                items: [
                    'bold', 'italic', 'underline', '|',
                    'bulletedList', 'numberedList', '|',
                    'link', 'undo', 'redo'
                ],
                shouldNotGroupWhenFull: false
            },
            language: 'en',
            removePlugins: [
                'CKFinderUploadAdapter',
                'CKFinder',
                'EasyImage',
                'Image',
                'ImageCaption',
                'ImageStyle',
                'ImageToolbar',
                'ImageUpload',
                'MediaEmbed'
            ],
            link: {
                decorators: {
                    openInNewTab: {
                        mode: 'manual',
                        label: 'Open in a new tab',
                        attributes: {
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        }
                    }
                }
            },
            typing: {
                transformations: {
                    remove: [
                        'enDash',
                        'emDash'
                    ]
                }
            }
        }));

        return {
            titleErrors,
            shortErrors,
            getLanguageColor,
            getLanguageIcon,
            validateTitle,
            validateShort,
            getContentLength,
            editorConfig
        };
    },
    props: {
        languageKey: {
            type: String,
            required: true,
            validator: (value: string) => ['rs', 'srb', 'hu', 'en'].includes(value)
        },
        enabled: {
            type: Boolean,
            default: false
        },
        titleValue: {
            type: String,
            default: ''
        },
        shortValue: {
            type: String,
            default: ''
        },
        contentValue: {
            type: String,
            default: ''
        },
        showTitle: {
            type: Boolean,
            default: true
        },
        showShort: {
            type: Boolean,
            default: false
        },
        showContent: {
            type: Boolean,
            default: true
        },
        showStats: {
            type: Boolean,
            default: true
        },
        required: {
            type: Boolean,
            default: false
        },
        titleMaxLength: {
            type: Number,
            default: 100
        },
        shortMaxLength: {
            type: Number,
            default: 300
        }
    }
});
</script>

<style scoped>
.language-field-group {
    border-radius: 16px !important;
    overflow: hidden;
    margin-bottom: 16px;
}

.language-header {
    transition: all 0.3s ease;
    border-radius: 0 !important;
}

.language-content {
    background-color: rgba(var(--v-theme-surface), 0.8);
}

.v-card--variant-outlined {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Language-specific colors */
.bg-red-darken-1 {
    background-color: rgb(var(--v-theme-error)) !important;
}

.bg-green-darken-1 {
    background-color: rgb(var(--v-theme-success)) !important;
}

.bg-blue-darken-1 {
    background-color: rgb(var(--v-theme-primary)) !important;
}

.bg-grey-darken-1 {
    background-color: rgb(var(--v-theme-secondary)) !important;
}

.bg-grey-lighten-4 {
    background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
}

/* Responsive design */
@media (max-width: 600px) {
    .language-header {
        padding: 12px !important;
        flex-direction: column;
        gap: 8px;
    }

    .language-header .v-spacer {
        display: none;
    }

    .d-flex.gap-4 {
        flex-direction: column;
        gap: 8px !important;
    }
}

/* Dark theme adjustments */
.v-theme--dark .bg-grey-lighten-4 {
    background-color: rgba(var(--v-theme-on-surface), 0.1) !important;
}

.v-theme--dark .language-content {
    background-color: rgba(var(--v-theme-surface), 1);
}

/* Animations */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
    opacity: 0;
    transform: scaleY(0);
    transform-origin: top;
}

.gap-4 {
    gap: 16px;
}
</style>