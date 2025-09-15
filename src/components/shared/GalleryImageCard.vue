<template>
    <v-card
        class="gallery-image-card"
        :class="{ 'is-default': isDefault, 'is-loading': loading }"
        elevation="4"
        rounded="lg"
    >
        <!-- Image Display -->
        <div class="image-container">
            <v-img
                :src="previewUrl"
                :alt="image.filename || 'Gallery Image'"
                height="200"
                cover
                class="gallery-image"
            >
                <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular indeterminate color="grey-lighten-4" />
                    </div>
                </template>
            </v-img>

            <!-- Default Badge -->
            <v-chip
                v-if="isDefault"
                color="success"
                size="small"
                class="default-badge"
                prepend-icon="mdi-star"
                variant="elevated"
            >
                {{ $t('default') }}
            </v-chip>

            <!-- Loading Overlay -->
            <v-overlay
                v-if="loading"
                contained
                class="align-center justify-center"
            >
                <v-progress-circular indeterminate color="white" />
            </v-overlay>

            <!-- Hover Actions -->
            <v-fade-transition>
                <div
                    v-show="showActions"
                    class="image-actions-overlay"
                    @mouseenter="showActions = true"
                    @mouseleave="showActions = false"
                >
                    <div class="actions-content">
                        <!-- Quick Actions -->
                        <div class="quick-actions">
                            <v-btn
                                v-if="!isDefault"
                                @click="$emit('set-default')"
                                size="small"
                                color="primary"
                                icon="mdi-star"
                                variant="elevated"
                                :disabled="loading"
                                class="action-btn"
                            />
                            <v-btn
                                @click="openImagePreview"
                                size="small"
                                color="info"
                                icon="mdi-eye"
                                variant="elevated"
                                class="action-btn"
                            />
                            <v-btn
                                @click="downloadImage"
                                size="small"
                                color="success"
                                icon="mdi-download"
                                variant="elevated"
                                class="action-btn"
                            />
                            <v-btn
                                @click="confirmDelete"
                                size="small"
                                color="error"
                                icon="mdi-delete"
                                variant="elevated"
                                :loading="loading"
                                class="action-btn"
                            />
                        </div>
                    </div>
                </div>
            </v-fade-transition>
        </div>

        <!-- Card Content -->
        <v-card-text class="pa-3">
            <div class="d-flex align-center justify-space-between">
                <div class="flex-grow-1 min-width-0">
                    <h4 class="text-body-1 font-weight-medium text-truncate">
                        {{ displayName }}
                    </h4>
                    <p class="text-body-2 text-grey ma-0">
                        {{ formatDate(image.$createdAt) }}
                    </p>
                </div>

                <!-- Image Info -->
                <v-menu location="top">
                    <template #activator="{ props }">
                        <v-btn
                            v-bind="props"
                            size="small"
                            icon="mdi-information"
                            variant="text"
                            color="grey"
                        />
                    </template>

                    <v-card min-width="200">
                        <v-card-text class="pa-3">
                            <v-list density="compact" class="pa-0">
                                <v-list-item>
                                    <v-list-item-title>{{ $t('filename') }}:</v-list-item-title>
                                    <v-list-item-subtitle>{{ image.filename || 'Unknown' }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>{{ $t('id') }}:</v-list-item-title>
                                    <v-list-item-subtitle class="font-mono">{{ image.image_id }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>{{ $t('uploaded') }}:</v-list-item-title>
                                    <v-list-item-subtitle>{{ formatDateTime(image.$createdAt) }}</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-menu>
            </div>
        </v-card-text>

        <!-- Card Actions -->
        <v-card-actions class="pa-3 pt-0">
            <v-btn
                v-if="!isDefault"
                @click="$emit('set-default')"
                size="small"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-star"
                :disabled="loading"
                block
            >
                {{ $t('set_as_default') }}
            </v-btn>

            <v-chip
                v-else
                color="success"
                size="small"
                variant="elevated"
                prepend-icon="mdi-star"
                class="flex-grow-1 justify-center"
            >
                {{ $t('default_image') }}
            </v-chip>
        </v-card-actions>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon left color="error">mdi-delete-alert</v-icon>
                    {{ $t('confirm_delete') }}
                </v-card-title>

                <v-card-text>
                    <p>{{ $t('delete_image_confirmation') }}</p>
                    <v-chip color="info" size="small" class="mt-2">
                        {{ displayName }}
                    </v-chip>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="deleteDialog = false" text>
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn @click="deleteImage" color="error">
                        {{ $t('delete') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Image Preview Dialog -->
        <v-dialog v-model="previewDialog" max-width="800">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon left>mdi-eye</v-icon>
                    {{ displayName }}
                    <v-spacer />
                    <v-btn
                        @click="previewDialog = false"
                        icon="mdi-close"
                        variant="text"
                        size="small"
                    />
                </v-card-title>

                <v-card-text class="pa-0">
                    <v-img
                        :src="fullSizeUrl"
                        :alt="displayName"
                        contain
                        max-height="600"
                    >
                        <template #placeholder>
                            <div class="d-flex align-center justify-center fill-height">
                                <v-progress-circular indeterminate />
                            </div>
                        </template>
                    </v-img>
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        @click="downloadImage"
                        prepend-icon="mdi-download"
                        color="primary"
                    >
                        {{ $t('download') }}
                    </v-btn>
                    <v-spacer />
                    <v-btn @click="previewDialog = false" text>
                        {{ $t('close') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { getFileView, getFileDownload, DataParsingManager } from '@/utils/editorUtils';
import { appwriteService } from '@/appwrite';
import { useI18n } from 'vue-i18n';

export default defineComponent({
    name: 'GalleryImageCard',
    emits: ['set-default', 'delete'],
    props: {
        image: {
            type: Object,
            required: true
        },
        previewUrl: {
            type: String,
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        const { t } = useI18n();

        // State
        const showActions = ref(false);
        const deleteDialog = ref(false);
        const previewDialog = ref(false);

        const config = appwriteService.config;

        // Computed
        const displayName = computed(() => {
            return props.image.filename || `Image ${props.image.$id.slice(-8)}`;
        });

        const fullSizeUrl = computed(() => {
            return getFileView(props.image.image_id, config.website_images);
        });

        // Methods
        const confirmDelete = () => {
            deleteDialog.value = true;
            showActions.value = false;
        };

        const deleteImage = () => {
            emit('delete');
            deleteDialog.value = false;
        };

        const openImagePreview = () => {
            previewDialog.value = true;
            showActions.value = false;
        };

        const downloadImage = () => {
            const url = getFileDownload(props.image.image_id, config.website_images);
            const link = document.createElement('a');
            link.href = url;
            link.download = displayName.value;
            link.click();
        };

        const formatDate = DataParsingManager.formatDate;
        const formatDateTime = DataParsingManager.formatDateTime;

        return {
            // State
            showActions,
            deleteDialog,
            previewDialog,

            // Computed
            displayName,
            fullSizeUrl,

            // Methods
            confirmDelete,
            deleteImage,
            openImagePreview,
            downloadImage,
            formatDate,
            formatDateTime
        };
    }
});
</script>

<style scoped>
.gallery-image-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px !important;
    overflow: hidden;
    position: relative;
}

.gallery-image-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
}

.gallery-image-card.is-default {
    border: 2px solid rgb(var(--v-theme-success));
}

.gallery-image-card.is-loading {
    opacity: 0.7;
}

.image-container {
    position: relative;
    overflow: hidden;
}

.gallery-image {
    transition: transform 0.3s ease;
}

.gallery-image-card:hover .gallery-image {
    transform: scale(1.05);
}

.default-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 2;
}

.image-actions-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    z-index: 3;
}

.actions-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.quick-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
}

.action-btn {
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.font-mono {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
}

.min-width-0 {
    min-width: 0;
}

.text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 600px) {
    .gallery-image-card {
        margin-bottom: 16px;
    }

    .quick-actions {
        flex-direction: column;
        gap: 4px;
    }

    .action-btn {
        width: 36px;
        height: 36px;
    }
}

/* Dark mode adjustments */
.v-theme--dark .image-actions-overlay {
    background: rgba(0, 0, 0, 0.8);
}

.v-theme--dark .gallery-image-card.is-default {
    border-color: rgb(var(--v-theme-success));
    box-shadow: 0 0 20px rgba(var(--v-theme-success), 0.3);
}
</style>