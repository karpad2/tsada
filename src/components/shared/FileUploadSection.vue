<template>
    <v-card class="file-upload-section mb-6" elevation="2" rounded>
        <v-card-title class="bg-primary text-white">
            <v-icon left>{{ uploadType === 'image' ? 'mdi-image-multiple' : 'mdi-file-document' }}</v-icon>
            {{ $t('file_upload') }}
        </v-card-title>

        <v-card-text class="pa-6">
            <!-- Upload Input -->
            <div class="upload-container">
                <v-file-input
                    v-model="files"
                    :accept="acceptTypes"
                    :label="uploadLabel"
                    :multiple="multiple"
                    :loading="uploading"
                    :disabled="uploading"
                    :error-messages="validationErrors"
                    show-size
                    clearable
                    prepend-icon="mdi-cloud-upload"
                    variant="outlined"
                    density="comfortable"
                    class="file-input-custom mb-4"
                    @update:model-value="handleFileChange"
                    @click:clear="clearFiles"
                />

                <!-- Upload Button -->
                <v-btn
                    v-if="files.length > 0 && !uploading"
                    @click="startUpload"
                    color="success"
                    size="large"
                    block
                    :disabled="validationErrors.length > 0"
                    class="mb-4"
                >
                    <v-icon left>mdi-upload</v-icon>
                    {{ $t('upload_files', { count: files.length }) }}
                </v-btn>

                <!-- Upload Progress -->
                <div v-if="uploading" class="upload-progress mb-4">
                    <div class="d-flex justify-space-between align-center mb-2">
                        <v-chip color="info" size="small">
                            <v-icon left size="small">mdi-cloud-upload-outline</v-icon>
                            {{ $t('uploading') }}...
                        </v-chip>
                        <v-chip color="success" size="small" variant="outlined">
                            {{ uploadProgress }}%
                        </v-chip>
                    </div>

                    <v-progress-linear
                        :model-value="uploadProgress"
                        color="success"
                        height="10"
                        rounded
                        striped
                        :indeterminate="uploadProgress === 0"
                    >
                        <template #default="{ value }">
                            <small class="text-white font-weight-bold">{{ Math.ceil(value) }}%</small>
                        </template>
                    </v-progress-linear>

                    <v-list v-if="currentlyUploading.length > 0" density="compact" class="mt-2">
                        <v-list-item
                            v-for="(file, index) in currentlyUploading"
                            :key="index"
                            :prepend-icon="getFileIcon(file.type)"
                        >
                            <v-list-item-title class="text-body-2">{{ file.name }}</v-list-item-title>
                            <v-list-item-subtitle>{{ formatFileSize(file.size) }}</v-list-item-subtitle>

                            <template #append>
                                <v-progress-circular
                                    :model-value="100"
                                    size="20"
                                    width="2"
                                    color="success"
                                    indeterminate
                                />
                            </template>
                        </v-list-item>
                    </v-list>
                </div>

                <!-- Messages -->
                <v-alert
                    v-if="errorMessage"
                    type="error"
                    variant="tonal"
                    dismissible
                    class="mb-4"
                    @click:close="errorMessage = ''"
                >
                    <template #prepend>
                        <v-icon>mdi-alert-circle</v-icon>
                    </template>
                    {{ errorMessage }}
                </v-alert>

                <v-alert
                    v-if="successMessage"
                    type="success"
                    variant="tonal"
                    dismissible
                    class="mb-4"
                    @click:close="successMessage = ''"
                >
                    <template #prepend>
                        <v-icon>mdi-check-circle</v-icon>
                    </template>
                    {{ successMessage }}
                </v-alert>

                <!-- File Validation Info -->
                <v-expansion-panels v-if="!uploading" variant="accordion" class="mb-4">
                    <v-expansion-panel>
                        <v-expansion-panel-title>
                            <v-icon left>mdi-information</v-icon>
                            {{ $t('upload_requirements') }}
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-list density="compact">
                                <v-list-item>
                                    <template #prepend>
                                        <v-icon color="info">mdi-file-check</v-icon>
                                    </template>
                                    <v-list-item-title>{{ $t('allowed_types') }}:</v-list-item-title>
                                    <v-list-item-subtitle>{{ allowedTypesDisplay }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <template #prepend>
                                        <v-icon color="warning">mdi-scale-unbalanced</v-icon>
                                    </template>
                                    <v-list-item-title>{{ $t('max_file_size') }}:</v-list-item-title>
                                    <v-list-item-subtitle>{{ maxFileSize }} MB</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item v-if="multiple">
                                    <template #prepend>
                                        <v-icon color="success">mdi-file-multiple</v-icon>
                                    </template>
                                    <v-list-item-title>{{ $t('multiple_files_allowed') }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
        </v-card-text>

        <!-- Preview Section -->
        <div v-if="showPreview && previewUrls.length > 0">
            <v-divider />

            <v-card-title class="d-flex align-center">
                <v-icon left>mdi-eye</v-icon>
                {{ $t('preview') }}
                <v-spacer />
                <v-chip color="info" size="small">{{ previewUrls.length }} {{ $t('files') }}</v-chip>
            </v-card-title>

            <v-card-text>
                <!-- Image Preview Grid -->
                <div v-if="uploadType === 'image'">
                    <v-row>
                        <v-col
                            v-for="(url, index) in previewUrls"
                            :key="index"
                            cols="12" sm="6" md="4" lg="3"
                        >
                            <v-card class="preview-card" elevation="4" rounded>
                                <v-img
                                    :src="url"
                                    :alt="`Preview ${index + 1}`"
                                    height="200"
                                    cover
                                    class="preview-image"
                                >
                                    <template #placeholder>
                                        <div class="d-flex align-center justify-center fill-height">
                                            <v-progress-circular indeterminate color="grey-lighten-4" />
                                        </div>
                                    </template>
                                </v-img>

                                <!-- Image Actions -->
                                <v-card-actions v-if="showActions" class="justify-space-between pa-2">
                                    <div class="d-flex gap-1">
                                        <v-btn
                                            v-if="multiple && defaultImageId !== uploadedFileIds[index]"
                                            @click="$emit('set-default', uploadedFileIds[index])"
                                            size="small"
                                            color="primary"
                                            variant="tonal"
                                            density="compact"
                                        >
                                            <v-icon left size="small">mdi-star</v-icon>
                                            {{ $t('set_default') }}
                                        </v-btn>

                                        <v-chip
                                            v-if="defaultImageId === uploadedFileIds[index]"
                                            color="success"
                                            size="small"
                                            variant="elevated"
                                        >
                                            <v-icon left size="small">mdi-star</v-icon>
                                            {{ $t('default') }}
                                        </v-chip>
                                    </div>

                                    <v-btn
                                        @click="confirmDelete(uploadedFileIds[index])"
                                        size="small"
                                        color="error"
                                        variant="tonal"
                                        density="compact"
                                        icon="mdi-delete"
                                    />
                                </v-card-actions>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>

                <!-- Document Preview -->
                <div v-else-if="uploadType === 'document'">
                    <v-list>
                        <v-list-item
                            v-for="(fileName, index) in uploadedFileNames"
                            :key="index"
                            class="border rounded mb-2"
                        >
                            <template #prepend>
                                <v-avatar color="info" size="40">
                                    <v-icon>{{ getFileIcon(getFileExtension(fileName)) }}</v-icon>
                                </v-avatar>
                            </template>

                            <v-list-item-title>{{ fileName }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ $t('file_attached') }} - {{ getFileExtension(fileName).toUpperCase() }}
                            </v-list-item-subtitle>

                            <template #append v-if="showActions">
                                <div class="d-flex gap-2">
                                    <v-btn
                                        @click="downloadFile(uploadedFileIds[index])"
                                        size="small"
                                        color="primary"
                                        variant="tonal"
                                        icon="mdi-download"
                                    />
                                    <v-btn
                                        @click="confirmDelete(uploadedFileIds[index])"
                                        size="small"
                                        color="error"
                                        variant="tonal"
                                        icon="mdi-delete"
                                    />
                                </div>
                            </template>
                        </v-list-item>
                    </v-list>
                </div>
            </v-card-text>
        </div>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon left color="error">mdi-delete-alert</v-icon>
                    {{ $t('confirm_delete') }}
                </v-card-title>

                <v-card-text>
                    {{ $t('delete_file_confirmation') }}
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="deleteDialog = false" text>
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn @click="deleteFile" color="error">
                        {{ $t('delete') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import {
    uploadMultipleFiles,
    ValidationManager,
    EditorConfigManager,
    showNotification,
    DataParsingManager,
    getFileDownload
} from '@/utils/editorUtils';
import { useI18n } from 'vue-i18n';
import { trackFileUpload, trackUserInteraction, trackError } from '@/utils/analytics';

export default defineComponent({
    name: 'FileUploadSection',
    emits: ['files-uploaded', 'upload-progress', 'upload-error', 'set-default', 'delete-file'],
    props: {
        uploadType: {
            type: String,
            default: 'image',
            validator: (value: string) => ['image', 'document', 'video', 'audio'].includes(value)
        },
        multiple: {
            type: Boolean,
            default: false
        },
        showPreview: {
            type: Boolean,
            default: true
        },
        showActions: {
            type: Boolean,
            default: true
        },
        previewUrls: {
            type: Array<string>,
            default: () => []
        },
        uploadedFileIds: {
            type: Array<string>,
            default: () => []
        },
        uploadedFileNames: {
            type: Array<string>,
            default: () => []
        },
        defaultImageId: {
            type: String,
            default: ''
        },
        storageId: {
            type: String,
            default: ''
        },
        autoUpload: {
            type: Boolean,
            default: false
        },
        maxFiles: {
            type: Number,
            default: 10
        }
    },
    setup(props, { emit }) {
        const { t } = useI18n();

        // Reactive state
        const files = ref<File[]>([]);
        const uploading = ref(false);
        const uploadProgress = ref(0);
        const errorMessage = ref('');
        const successMessage = ref('');
        const validationErrors = ref<string[]>([]);
        const currentlyUploading = ref<File[]>([]);
        const deleteDialog = ref(false);
        const fileToDelete = ref<string>('');

        const config = EditorConfigManager.getConfig();

        // Computed properties
        const uploadConfig = computed(() => {
            if (props.uploadType === 'image') return config.imageUpload;
            if (props.uploadType === 'document') return config.documentUpload;
            return config.imageUpload; // fallback
        });

        const acceptTypes = computed(() => {
            const extensions = uploadConfig.value.allowedExtensions;
            return extensions.join(',');
        });

        const allowedTypes = computed(() => uploadConfig.value.allowedTypes);
        const maxFileSize = computed(() => uploadConfig.value.maxSize);

        const allowedTypesDisplay = computed(() => {
            return uploadConfig.value.allowedExtensions.join(', ');
        });

        const uploadLabel = computed(() => {
            const typeText = props.uploadType === 'image' ? t('images') : t('documents');
            const multipleText = props.multiple ? t('multiple') : t('single');
            return `${t('select')} ${multipleText} ${typeText}`;
        });

        // Methods
        const validateFiles = (filesToValidate: File[]): string[] => {
            const errors: string[] = [];

            if (filesToValidate.length > props.maxFiles) {
                errors.push(t('too_many_files', { max: props.maxFiles }));
            }

            for (const file of filesToValidate) {
                if (!ValidationManager.validateFileType(file, allowedTypes.value)) {
                    errors.push(t('invalid_file_type', { name: file.name, types: allowedTypesDisplay.value }));
                }

                if (!ValidationManager.validateFileSize(file, maxFileSize.value)) {
                    errors.push(t('file_too_large', { name: file.name, max: maxFileSize.value }));
                }
            }

            return errors;
        };

        const handleFileChange = (newFiles: File[] | File | null) => {
            // Convert to array format
            let fileArray: File[] = [];
            if (newFiles) {
                if (Array.isArray(newFiles)) {
                    fileArray = newFiles;
                } else {
                    fileArray = [newFiles];
                }
            }

            if (fileArray.length === 0) {
                clearFiles();
                return;
            }

            // Track file selection
            trackUserInteraction('file_select', 'file_input', {
                file_count: fileArray.length,
                file_types: fileArray.map(f => f.type),
                total_size: fileArray.reduce((sum, f) => sum + f.size, 0),
                upload_type: props.uploadType
            });

            files.value = fileArray;
            clearMessages();

            // Validate files
            const errors = validateFiles(fileArray);
            validationErrors.value = errors;

            if (errors.length === 0 && props.autoUpload) {
                startUpload();
            }
        };

        const clearFiles = () => {
            files.value = [];
            validationErrors.value = [];
            clearMessages();
        };

        const clearMessages = () => {
            errorMessage.value = '';
            successMessage.value = '';
        };

        const startUpload = async () => {
            if (files.value.length === 0) return;
            await uploadFiles(files.value);
        };

        const uploadFiles = async (filesToUpload: File[]) => {
            uploading.value = true;
            uploadProgress.value = 0;
            currentlyUploading.value = [...filesToUpload];
            clearMessages();

            const uploadStartTime = performance.now();

            try {
                const uploadedFiles = await uploadMultipleFiles(
                    filesToUpload,
                    props.storageId,
                    (progress) => {
                        uploadProgress.value = progress;
                        emit('upload-progress', progress);
                    }
                );

                const uploadDuration = performance.now() - uploadStartTime;

                // Track successful uploads
                for (const file of filesToUpload) {
                    trackFileUpload(
                        file.type,
                        file.size,
                        uploadDuration
                    );
                }

                trackUserInteraction('files_uploaded', 'upload_section', {
                    file_count: uploadedFiles.length,
                    upload_type: props.uploadType,
                    total_size: filesToUpload.reduce((sum, f) => sum + f.size, 0),
                    upload_duration_ms: uploadDuration
                });

                emit('files-uploaded', uploadedFiles);
                successMessage.value = t('upload_success', { count: uploadedFiles.length });

                showNotification(
                    t('upload_success', { count: uploadedFiles.length }),
                    'success'
                );

                // Clear files input
                clearFiles();

            } catch (error: any) {
                console.error('Upload error:', error);

                // Track upload errors
                trackError(
                    'upload_error',
                    error.message || 'Upload failed',
                    'FileUploadSection'
                );

                errorMessage.value = error.message || t('upload_failed');
                emit('upload-error', error);

                showNotification(
                    error.message || t('upload_failed'),
                    'error'
                );
            } finally {
                uploading.value = false;
                uploadProgress.value = 0;
                currentlyUploading.value = [];
            }
        };

        const confirmDelete = (fileId: string) => {
            fileToDelete.value = fileId;
            deleteDialog.value = true;
        };

        const deleteFile = () => {
            // Track file deletion
            trackUserInteraction('file_delete', 'delete_button', {
                file_id: fileToDelete.value,
                upload_type: props.uploadType
            });

            emit('delete-file', fileToDelete.value);
            deleteDialog.value = false;
            fileToDelete.value = '';
        };

        const downloadFile = (fileId: string) => {
            // Track file download
            trackUserInteraction('file_download', 'download_button', {
                file_id: fileId,
                upload_type: props.uploadType
            });

            const url = getFileDownload(fileId, props.storageId);
            window.open(url, '_blank');
        };

        const getFileIcon = (type: string): string => {
            if (type.includes('image')) return 'mdi-image';
            if (type.includes('pdf')) return 'mdi-file-pdf-box';
            if (type.includes('word')) return 'mdi-file-word';
            if (type.includes('text')) return 'mdi-file-document';
            if (type.includes('video')) return 'mdi-video';
            if (type.includes('audio')) return 'mdi-music';
            return 'mdi-file';
        };

        const getFileExtension = (filename: string): string => {
            return filename.split('.').pop() || '';
        };

        const formatFileSize = DataParsingManager.formatFileSize;

        return {
            // State
            files,
            uploading,
            uploadProgress,
            errorMessage,
            successMessage,
            validationErrors,
            currentlyUploading,
            deleteDialog,
            fileToDelete,

            // Computed
            acceptTypes,
            allowedTypesDisplay,
            maxFileSize,
            uploadLabel,

            // Methods
            handleFileChange,
            clearFiles,
            startUpload,
            confirmDelete,
            deleteFile,
            downloadFile,
            getFileIcon,
            getFileExtension,
            formatFileSize
        };
    }
});
</script>

<style scoped>
.file-upload-section {
    border-radius: 16px !important;
}

.file-input-custom {
    border-radius: 12px;
}

.preview-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px !important;
}

.preview-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.preview-image {
    border-radius: 8px;
}

.upload-progress {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.v-expansion-panel-title {
    font-weight: 500;
}

.v-list-item {
    border-radius: 8px;
    margin-bottom: 8px;
}

.gap-1 {
    gap: 4px;
}

.gap-2 {
    gap: 8px;
}

.border {
    border: 1px solid rgba(0, 0, 0, 0.12);
}

.dark .border {
    border-color: rgba(255, 255, 255, 0.12);
}
</style>