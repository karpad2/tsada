<template>
    <v-container fluid class="gallery-editor pa-6">
        <!-- Page Header -->
        <v-row>
            <v-col>
                <v-card elevation="2" class="header-card mb-6" rounded>
                    <v-card-title class="d-flex align-center bg-primary text-white pa-4">
                        <v-icon left size="large">mdi-image-multiple</v-icon>
                        <span class="text-h5">{{ $t('gallery_editor') }}</span>
                        <v-spacer />
                        <v-chip
                            :color="formData.visible ? 'success' : 'warning'"
                            :prepend-icon="formData.visible ? 'mdi-eye' : 'mdi-eye-off'"
                            variant="elevated"
                        >
                            {{ formData.visible ? $t('visible') : $t('hidden') }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text class="pa-4">
                        <!-- Quick Actions -->
                        <div class="d-flex flex-wrap gap-3 align-center">
                            <v-switch
                                v-model="formData.visible"
                                :label="$t('make_visible')"
                                color="success"
                                inset
                                hide-details
                                @update:model-value="handleFieldChange"
                            />

                            <v-divider vertical class="mx-2" />

                            <v-btn
                                @click="save"
                                :loading="isLoading('save')"
                                :disabled="isAnyLoading()"
                                color="success"
                                size="large"
                                prepend-icon="mdi-content-save"
                                variant="elevated"
                            >
                                {{ $t('save_changes') }}
                            </v-btn>

                            <v-btn
                                @click="deleteContent"
                                :disabled="isAnyLoading()"
                                color="error"
                                size="large"
                                prepend-icon="mdi-delete"
                                variant="outlined"
                            >
                                {{ $t('delete_gallery') }}
                            </v-btn>

                            <v-spacer />

                            <!-- Gallery Statistics -->
                            <div class="d-flex gap-4">
                                <v-chip color="info" prepend-icon="mdi-image">
                                    {{ images.length }} {{ $t('images') }}
                                </v-chip>
                                <v-chip
                                    v-if="formData.default_image"
                                    color="success"
                                    prepend-icon="mdi-star"
                                >
                                    {{ $t('has_default') }}
                                </v-chip>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Main Content -->
        <v-row>
            <!-- File Upload Section -->
            <v-col cols="12" lg="6">
                <FileUploadSection
                    upload-type="image"
                    :multiple="true"
                    :auto-upload="true"
                    :max-files="20"
                    :preview-urls="imagePreviewUrls"
                    :uploaded-file-ids="imageFileIds"
                    :default-image-id="formData.default_image"
                    :storage-id="config.website_images"
                    @files-uploaded="handleFilesUploaded"
                    @set-default="setAsDefault"
                    @delete-file="deletePicture"
                />
            </v-col>

            <!-- Language Fields Section -->
            <v-col cols="12" lg="6">
                <v-card elevation="2" rounded class="language-card">
                    <v-card-title class="bg-secondary text-white">
                        <v-icon left>mdi-translate</v-icon>
                        {{ $t('multilanguage_content') }}
                    </v-card-title>

                    <v-card-text class="pa-4">
                        <v-tabs v-model="activeLanguageTab" color="primary" class="mb-4">
                            <v-tab
                                v-for="lang in supportedLanguages"
                                :key="lang"
                                :value="lang"
                                class="text-capitalize"
                            >
                                <v-icon left>mdi-flag</v-icon>
                                {{ $t(lang) }}
                                <v-chip
                                    v-if="hasContentInLanguage(lang)"
                                    color="success"
                                    size="x-small"
                                    class="ml-2"
                                >
                                    ✓
                                </v-chip>
                            </v-tab>
                        </v-tabs>

                        <v-tabs-window v-model="activeLanguageTab">
                            <v-tabs-window-item
                                v-for="lang in supportedLanguages"
                                :key="lang"
                                :value="lang"
                            >
                                <LanguageFieldGroup
                                    :language-key="lang"
                                    :enabled="true"
                                    :title-value="formData[`title_${lang}`] || ''"
                                    :short-value="formData[`short_${lang}`] || ''"
                                    :show-content="false"
                                    :show-short="true"
                                    :title-max-length="100"
                                    :short-max-length="300"
                                    @update:title="updateField(`title_${lang}`, $event)"
                                    @update:short="updateField(`short_${lang}`, $event)"
                                    @save="handleFieldChange"
                                />
                            </v-tabs-window-item>
                        </v-tabs-window>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Gallery Preview Section -->
        <v-row v-if="images.length > 0">
            <v-col>
                <v-card elevation="2" rounded class="gallery-preview-card">
                    <v-card-title class="bg-info text-white">
                        <v-icon left>mdi-view-grid</v-icon>
                        {{ $t('gallery_preview') }}
                        <v-spacer />
                        <v-btn-toggle v-model="viewMode" mandatory class="bg-transparent">
                            <v-btn
                                value="grid"
                                icon="mdi-view-grid"
                                size="small"
                                variant="text"
                            />
                            <v-btn
                                value="list"
                                icon="mdi-view-list"
                                size="small"
                                variant="text"
                            />
                        </v-btn-toggle>
                    </v-card-title>

                    <v-card-text class="pa-4">
                        <!-- Grid View -->
                        <div v-if="viewMode === 'grid'">
                            <v-row>
                                <v-col
                                    v-for="(image, index) in images"
                                    :key="image.$id"
                                    cols="12" sm="6" md="4" lg="3"
                                >
                                    <GalleryImageCard
                                        :image="image"
                                        :preview-url="getFilePreview(image.image_id, config.website_images)"
                                        :is-default="formData.default_image === image.image_id"
                                        :loading="isLoading(`image-${image.$id}`)"
                                        @set-default="setAsDefault(image.image_id)"
                                        @delete="deletePicture(image.image_id)"
                                    />
                                </v-col>
                            </v-row>
                        </div>

                        <!-- List View -->
                        <div v-else>
                            <v-list>
                                <v-list-item
                                    v-for="(image, index) in images"
                                    :key="image.$id"
                                    class="border rounded mb-3"
                                >
                                    <template #prepend>
                                        <v-avatar size="60" rounded="lg">
                                            <v-img
                                                :src="getFilePreview(image.image_id, config.website_images, 120, 120)"
                                                cover
                                            />
                                        </v-avatar>
                                    </template>

                                    <v-list-item-title>{{ image.filename || `Image ${index + 1}` }}</v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ $t('uploaded') }}: {{ formatDate(image.$createdAt) }}
                                    </v-list-item-subtitle>

                                    <template #append>
                                        <div class="d-flex align-center gap-2">
                                            <v-chip
                                                v-if="formData.default_image === image.image_id"
                                                color="success"
                                                size="small"
                                                prepend-icon="mdi-star"
                                            >
                                                {{ $t('default') }}
                                            </v-chip>

                                            <v-btn-group density="compact">
                                                <v-btn
                                                    v-if="formData.default_image !== image.image_id"
                                                    @click="setAsDefault(image.image_id)"
                                                    size="small"
                                                    color="primary"
                                                    variant="tonal"
                                                    icon="mdi-star"
                                                />
                                                <v-btn
                                                    @click="deletePicture(image.image_id)"
                                                    size="small"
                                                    color="error"
                                                    variant="tonal"
                                                    icon="mdi-delete"
                                                    :loading="isLoading(`image-${image.$id}`)"
                                                />
                                            </v-btn-group>
                                        </div>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </div>

                        <!-- Empty State -->
                        <div v-if="images.length === 0" class="text-center py-12">
                            <v-icon size="64" color="grey-lighten-1">mdi-image-off</v-icon>
                            <h3 class="text-h6 mt-4 text-grey">{{ $t('no_images_yet') }}</h3>
                            <p class="text-body-2 text-grey">{{ $t('upload_first_images') }}</p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Floating Action Button -->
        <v-btn
            class="floating-save-btn"
            :icon="isAnyLoading() ? 'mdi-loading mdi-spin' : 'mdi-content-save'"
            color="success"
            size="large"
            elevation="6"
            @click="save"
            :disabled="!hasChanges || isAnyLoading()"
            :loading="isAnyLoading()"
        />

        <!-- Loading Overlay -->
        <v-overlay
            v-model="showLoadingOverlay"
            class="align-center justify-center"
            persistent
        >
            <v-progress-circular
                indeterminate
                size="64"
                color="primary"
            />
            <div class="text-center mt-4">
                <h3>{{ $t('saving_changes') }}</h3>
                <p class="text-body-2">{{ $t('please_wait') }}</p>
            </div>
        </v-overlay>
    </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Query } from 'appwrite';
import { appwriteService } from '@/appwrite';
import { useEditor } from '@/composables/useEditor';
import {
    galleryManager,
    getFilePreview,
    MultiLanguageManager,
    DataParsingManager,
    showNotification
} from '@/utils/editorUtils';
import { trackUserInteraction, trackGalleryInteraction, trackAdminAction } from '@/utils/analytics';
import FileUploadSection from '@/components/shared/FileUploadSection.vue';
import LanguageFieldGroup from '@/components/shared/LanguageFieldGroup.vue';
import GalleryImageCard from '@/components/shared/GalleryImageCard.vue';

export default defineComponent({
    name: 'GalleryEditor',
    components: {
        FileUploadSection,
        LanguageFieldGroup,
        GalleryImageCard
    },
    setup() {
        // Reactive state
        const images = ref<any[]>([]);
        const activeLanguageTab = ref('rs');
        const viewMode = ref('grid');
        const showLoadingOverlay = ref(false);

        const config = appwriteService.config;
        const supportedLanguages = MultiLanguageManager.getSupportedLanguages();

        // Load gallery data function
        const loadGalleryData = async (id: string) => {
            const databases = appwriteService.getDatabases();

            try {
                // Load gallery document
                const galleryDoc = await databases.getDocument(
                    config.website_db,
                    config.gallery,
                    id
                );

                // Load associated images
                const imagesResponse = await databases.listDocuments(
                    config.website_db,
                    config.gallery_images || config.album_images,
                    [Query.equal('gallery_id', id), Query.orderDesc('$createdAt')]
                );

                images.value = imagesResponse.documents;

                // Return multilanguage data
                return {
                    ...MultiLanguageManager.createLanguageFields(),
                    title_rs: galleryDoc.title_rs || '',
                    title_hu: galleryDoc.title_hu || '',
                    title_en: galleryDoc.title_en || '',
                    short_rs: galleryDoc.short_rs || '',
                    short_hu: galleryDoc.short_hu || '',
                    short_en: galleryDoc.short_en || '',
                    visible: galleryDoc.visible || false,
                    default_image: galleryDoc.default_image || ''
                };
            } catch (error) {
                console.error('Error loading gallery data:', error);
                showNotification('Error loading gallery data', 'error');
                throw error;
            }
        };

        // Use editor composable with enhanced options
        const {
            formData,
            hasChanges,
            isLoading,
            isAnyLoading,
            save,
            deleteContent,
            updateField,
            handleFieldChange
        } = useEditor({
            collectionId: config.gallery,
            databaseId: config.website_db,
            loadDataFunction: loadGalleryData,
            redirectAfterDelete: '/admin/galleries',
            autoSaveDelay: 3000,
            requiredFields: ['title_rs']
        });

        // Computed properties
        const imagePreviewUrls = computed(() => {
            return images.value.map(img =>
                getFilePreview(img.image_id, config.website_images, 400, 300)
            );
        });

        const imageFileIds = computed(() => {
            return images.value.map(img => img.image_id);
        });

        // Methods
        const hasContentInLanguage = (lang: string): boolean => {
            return !!(formData[`title_${lang}`] || formData[`short_${lang}`]);
        };

        const handleFilesUploaded = async (uploadedFiles: any[]) => {
            showLoadingOverlay.value = true;

            try {
                // Track gallery image upload
                trackGalleryInteraction(
                    'images_added',
                    formData.id || 'new_gallery',
                    uploadedFiles.length
                );

                // Add each uploaded file to gallery_images collection
                for (const file of uploadedFiles) {
                    await galleryManager.addImageToGallery(
                        formData.id,
                        file.$id,
                        file.name
                    );
                }

                // Reload images
                await reloadImages();

                // Set first uploaded image as default if no default exists
                if (!formData.default_image && uploadedFiles.length > 0) {
                    await setAsDefault(uploadedFiles[0].$id);
                }

                showNotification(
                    `Successfully uploaded ${uploadedFiles.length} image(s)`,
                    'success'
                );

            } catch (error: any) {
                console.error('Error handling uploaded files:', error);
                showNotification('Error saving uploaded files', 'error');
            } finally {
                showLoadingOverlay.value = false;
            }
        };

        const reloadImages = async () => {
            const databases = appwriteService.getDatabases();
            const imagesResponse = await databases.listDocuments(
                config.website_db,
                config.gallery_images || config.album_images,
                [Query.equal('gallery_id', formData.id), Query.orderDesc('$createdAt')]
            );
            images.value = imagesResponse.documents;
        };

        const setAsDefault = async (imageId: string) => {
            try {
                // Track setting default image
                trackGalleryInteraction(
                    'set_default',
                    formData.id || 'gallery',
                    1
                );

                await galleryManager.setDefaultImage(imageId, formData.id, config.gallery);
                updateField('default_image', imageId);
                await save();

                showNotification('Default image updated', 'success');
            } catch (error: any) {
                console.error('Error setting default image:', error);
                showNotification('Error setting default image', 'error');
            }
        };

        const deletePicture = async (imageId: string) => {
            if (!confirm('Are you sure you want to delete this image?')) {
                return;
            }

            try {
                // Track image deletion
                trackGalleryInteraction(
                    'image_deleted',
                    formData.id || 'gallery',
                    1
                );

                await galleryManager.deleteImageFromGallery(imageId, formData.id);

                // Remove from local images array
                images.value = images.value.filter(img => img.image_id !== imageId);

                // Clear default if deleted image was default
                if (formData.default_image === imageId) {
                    updateField('default_image', '');
                    await save();
                }

                showNotification('Image deleted successfully', 'success');
            } catch (error: any) {
                console.error('Error deleting image:', error);
                showNotification('Error deleting image', 'error');
            }
        };

        const formatDate = DataParsingManager.formatDate;

        // Enhanced save function with validation
        const saveWithValidation = async () => {
            const errors = MultiLanguageManager.validateLanguageContent(formData, ['rs']);

            if (errors.length > 0) {
                showNotification(errors[0], 'error');
                return;
            }

            // Track gallery save action
            trackAdminAction(
                'save',
                'gallery',
                formData.id || 'new_gallery'
            );

            await save();
        };

        return {
            // State
            images,
            activeLanguageTab,
            viewMode,
            showLoadingOverlay,
            supportedLanguages,
            config,

            // From useEditor
            formData,
            hasChanges,
            isLoading,
            isAnyLoading,
            save: saveWithValidation,
            deleteContent,
            updateField,
            handleFieldChange,

            // Computed
            imagePreviewUrls,
            imageFileIds,

            // Methods
            hasContentInLanguage,
            handleFilesUploaded,
            setAsDefault,
            deletePicture,
            getFilePreview,
            formatDate
        };
    }
});
</script>

<style scoped>
.gallery-editor {
    max-width: 1400px;
    margin: 0 auto;
}

.header-card,
.language-card,
.gallery-preview-card {
    border-radius: 16px !important;
    overflow: hidden;
}

.gallery-preview-card .v-card-title {
    border-radius: 0;
}

.v-tabs {
    border-radius: 12px;
    overflow: hidden;
}

.v-tab {
    text-transform: none !important;
    font-weight: 500;
}

.border {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.gap-2 {
    gap: 8px;
}

.gap-3 {
    gap: 12px;
}

.gap-4 {
    gap: 16px;
}

.floating-save-btn {
    position: fixed !important;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    border-radius: 50% !important;
    width: 56px;
    height: 56px;
    min-width: 56px;
}

@media (max-width: 600px) {
    .gallery-editor {
        padding: 12px;
    }

    .d-flex.flex-wrap.gap-3 {
        flex-direction: column;
        align-items: stretch !important;
    }

    .v-btn {
        width: 100%;
    }
}

.fade-transition-enter-active,
.fade-transition-leave-active {
    transition: opacity 0.3s ease;
}

.fade-transition-enter-from,
.fade-transition-leave-to {
    opacity: 0;
}
</style>