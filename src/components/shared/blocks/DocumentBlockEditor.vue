<template>
    <div class="document-block-editor">
        <!-- Mode Toggle -->
        <v-btn-toggle v-model="mode" mandatory class="mb-4" density="compact" color="primary">
            <v-btn value="select" size="small">
                <v-icon left size="small">mdi-format-list-bulleted</v-icon>
                {{ $t('select_existing') }}
            </v-btn>
            <v-btn value="upload" size="small">
                <v-icon left size="small">mdi-upload</v-icon>
                {{ $t('upload_new') }}
            </v-btn>
        </v-btn-toggle>

        <!-- SELECT MODE: Pick existing documents -->
        <div v-if="mode === 'select'">
            <v-autocomplete
                v-model="localSettings.documentIds"
                :items="documents"
                :label="$t('select_documents')"
                item-value="id"
                item-title="title"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-file-document-multiple"
                multiple
                chips
                closable-chips
                class="mb-4"
                @update:model-value="emitSettings"
            >
                <template #append>
                    <v-btn icon size="small" variant="text" @click="loadDocuments">
                        <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                </template>
            </v-autocomplete>

            <v-switch
                v-model="localSettings.showPreview"
                :label="$t('show_preview')"
                color="primary"
                @change="emitSettings"
            />

            <!-- Selected Documents Preview -->
            <v-card v-if="selectedDocuments.length > 0" variant="outlined" class="mt-4">
                <v-card-title class="text-body-2 d-flex align-center">
                    <v-icon left size="small" class="mr-2">mdi-file-document-multiple</v-icon>
                    {{ $t('selected_documents') }} ({{ selectedDocuments.length }})
                </v-card-title>
                <v-card-text>
                    <draggable
                        v-model="localSettings.documentIds"
                        item-key="id"
                        handle=".doc-drag-handle"
                        @end="emitSettings"
                    >
                        <template #item="{ element: docId }">
                            <v-list-item
                                :key="docId"
                                class="doc-item mb-1 rounded"
                            >
                                <template #prepend>
                                    <v-icon class="doc-drag-handle cursor-move mr-2" size="small">mdi-drag-vertical</v-icon>
                                    <v-icon size="small" :color="getDocTypeColor(getDocumentById(docId)?.fileType)">
                                        {{ getDocTypeIcon(getDocumentById(docId)?.fileType) }}
                                    </v-icon>
                                </template>
                                <v-list-item-title class="text-body-2">
                                    {{ getDocumentById(docId)?.title || docId }}
                                </v-list-item-title>
                                <v-list-item-subtitle v-if="getDocumentById(docId)?.fileSize" class="text-caption">
                                    {{ formatFileSize(getDocumentById(docId)?.fileSize) }}
                                </v-list-item-subtitle>
                                <template #append>
                                    <v-btn icon size="x-small" variant="text" color="primary" @click="editDocument(docId)">
                                        <v-icon size="small">mdi-pencil</v-icon>
                                    </v-btn>
                                    <v-btn icon size="x-small" variant="text" color="error" @click="removeDocument(docId)">
                                        <v-icon size="small">mdi-close</v-icon>
                                    </v-btn>
                                </template>
                            </v-list-item>
                        </template>
                    </draggable>
                </v-card-text>
            </v-card>

            <v-alert v-else type="info" variant="tonal" density="compact" class="mt-3">
                <v-icon left size="small">mdi-information</v-icon>
                {{ $t('document_block_info') }}
            </v-alert>
        </div>

        <!-- UPLOAD MODE: Create new document -->
        <div v-else-if="mode === 'upload'" class="upload-section">
            <!-- Document Metadata -->
            <v-row dense class="mb-4">
                <v-col cols="12">
                    <v-text-field
                        v-model="newDocument.title_hu"
                        label="Cím (Magyar)"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-format-title"
                    />
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="newDocument.title_rs"
                        label="Наслов (Srpski)"
                        variant="outlined"
                        density="comfortable"
                    />
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="newDocument.title_en"
                        label="Title (English)"
                        variant="outlined"
                        density="comfortable"
                    />
                </v-col>
                <v-col cols="12">
                    <v-textarea
                        v-model="newDocument.short_hu"
                        label="Leírás (Magyar)"
                        variant="outlined"
                        density="comfortable"
                        rows="2"
                        auto-grow
                    />
                </v-col>
            </v-row>

            <!-- File Upload Zone -->
            <div
                class="upload-zone"
                :class="{ 'dragover': isDragging, 'has-file': uploadedFile }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
                @click="triggerFileInput"
            >
                <input
                    ref="fileInput"
                    type="file"
                    class="d-none"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                    @change="handleFileSelect"
                />

                <div v-if="!uploadedFile" class="upload-placeholder">
                    <v-icon size="48" color="grey">mdi-cloud-upload</v-icon>
                    <p class="text-body-1 mt-2 mb-1">{{ $t('drag_drop_file') }}</p>
                    <p class="text-caption text-grey">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR</p>
                </div>

                <div v-else class="uploaded-file-info d-flex align-center gap-3">
                    <v-icon size="40" :color="getDocTypeColor(getFileExtension(uploadedFile.name))">
                        {{ getDocTypeIcon(getFileExtension(uploadedFile.name)) }}
                    </v-icon>
                    <div class="flex-1">
                        <p class="text-body-2 font-weight-medium mb-0">{{ uploadedFile.name }}</p>
                        <p class="text-caption text-grey mb-0">{{ formatFileSize(uploadedFile.size) }}</p>
                    </div>
                    <v-btn icon size="small" variant="text" color="error" @click.stop="clearFile">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
            </div>

            <!-- Upload Progress -->
            <v-progress-linear
                v-if="isUploading"
                :model-value="uploadProgress"
                color="primary"
                class="mt-3"
                height="6"
                rounded
            />

            <!-- Upload Actions -->
            <div class="d-flex gap-2 mt-4">
                <v-btn
                    color="primary"
                    variant="flat"
                    :loading="isUploading"
                    :disabled="!uploadedFile || !newDocument.title_hu"
                    @click="uploadDocument"
                >
                    <v-icon left>mdi-upload</v-icon>
                    {{ isEditingDocument ? $t('update_document') : $t('upload_document') }}
                </v-btn>
                <v-btn
                    v-if="isEditingDocument"
                    variant="tonal"
                    @click="cancelEditDocument"
                >
                    {{ $t('cancel') }}
                </v-btn>
            </div>

            <!-- Recently Uploaded -->
            <div v-if="recentlyUploaded.length > 0" class="mt-6">
                <p class="text-subtitle-2 font-weight-medium mb-2">{{ $t('recently_uploaded') }}</p>
                <v-chip
                    v-for="doc in recentlyUploaded"
                    :key="doc.id"
                    class="mr-2 mb-2"
                    color="success"
                    variant="tonal"
                    closable
                    @click="addToSelection(doc.id)"
                    @click:close="removeFromRecent(doc.id)"
                >
                    <v-icon left size="small">mdi-file-document</v-icon>
                    {{ doc.title }}
                </v-chip>
            </div>
        </div>

        <!-- Edit Document Dialog -->
        <v-dialog v-model="editDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon left color="primary">mdi-file-document-edit</v-icon>
                    {{ $t('edit_document') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field
                        v-model="editingDoc.title_hu"
                        label="Cím (Magyar)"
                        variant="outlined"
                        density="comfortable"
                        class="mb-3"
                    />
                    <v-text-field
                        v-model="editingDoc.title_rs"
                        label="Наслов (Srpski)"
                        variant="outlined"
                        density="comfortable"
                        class="mb-3"
                    />
                    <v-text-field
                        v-model="editingDoc.title_en"
                        label="Title (English)"
                        variant="outlined"
                        density="comfortable"
                        class="mb-3"
                    />
                    <v-textarea
                        v-model="editingDoc.short_hu"
                        label="Leírás (Magyar)"
                        variant="outlined"
                        density="comfortable"
                        rows="2"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="editDialog = false">{{ $t('cancel') }}</v-btn>
                    <v-btn color="primary" variant="flat" :loading="isSavingDoc" @click="saveDocumentEdit">
                        {{ $t('save') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from 'vue';
import { Databases, Storage, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';
import { useLoadingStore } from '@/stores/loading';
import { notify } from '@kyvg/vue3-notification';
import draggable from 'vuedraggable';

interface DocumentItem {
    id: string;
    title: string;
    title_hu?: string;
    title_rs?: string;
    title_en?: string;
    short_hu?: string;
    short_rs?: string;
    short_en?: string;
    fileId?: string;
    fileType?: string;
    fileSize?: number;
    visible?: boolean;
}

export default defineComponent({
    name: 'DocumentBlockEditor',
    components: { draggable },
    props: {
        block: { type: Object, required: true },
        settings: { type: Object, default: () => ({}) },
        language: { type: String, default: 'rs' }
    },
    emits: ['update:settings', 'save'],
    setup(props, { emit }) {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const loadingStore = useLoadingStore();

        // State
        const mode = ref<'select' | 'upload'>('select');
        const documents = ref<DocumentItem[]>([]);
        const isDragging = ref(false);
        const isUploading = ref(false);
        const uploadProgress = ref(0);
        const uploadedFile = ref<File | null>(null);
        const fileInput = ref<HTMLInputElement | null>(null);
        const recentlyUploaded = ref<{ id: string; title: string }[]>([]);
        const isEditingDocument = ref(false);

        // Edit dialog
        const editDialog = ref(false);
        const editingDoc = ref<any>({});
        const editingDocId = ref<string | null>(null);
        const isSavingDoc = ref(false);

        const localSettings = ref({
            documentIds: props.settings.documentIds || [],
            showPreview: props.settings.showPreview !== false
        });

        // New document form
        const newDocument = ref({
            title_hu: '',
            title_rs: '',
            title_en: '',
            short_hu: '',
            short_rs: '',
            short_en: ''
        });

        const selectedDocuments = computed(() => {
            return localSettings.value.documentIds.map((id: string) =>
                documents.value.find(d => d.id === id)
            ).filter(Boolean);
        });

        // Load documents list
        const loadDocuments = async () => {
            try {
                const result = await database.listDocuments(
                    config.website_db,
                    config.documents_db,
                    [
                        Query.select(['title_hu', 'title_rs', 'title_en', 'short_hu', 'short_rs', 'short_en', '$id', 'visible', 'default_file', 'file_size']),
                        Query.limit(100)
                    ]
                );

                const local = loadingStore.language;
                documents.value = result.documents.map(element => {
                    let title = '';
                    switch (local) {
                        case 'en': title = element.title_en || element.title_hu || element.title_rs; break;
                        case 'hu': title = element.title_hu || element.title_rs || element.title_en; break;
                        default: title = element.title_rs || element.title_hu || element.title_en; break;
                    }
                    return {
                        id: element.$id,
                        title: title || 'Untitled Document',
                        title_hu: element.title_hu,
                        title_rs: element.title_rs,
                        title_en: element.title_en,
                        short_hu: element.short_hu,
                        short_rs: element.short_rs,
                        short_en: element.short_en,
                        visible: element.visible,
                        fileId: element.default_file,
                        fileSize: element.file_size
                    };
                });
            } catch (error) {
                console.error('Failed to load documents:', error);
            }
        };

        // Get document by ID
        const getDocumentById = (docId: string) => {
            return documents.value.find(d => d.id === docId);
        };

        // Remove document from selection
        const removeDocument = (docId: string) => {
            localSettings.value.documentIds = localSettings.value.documentIds.filter(
                (id: string) => id !== docId
            );
            emitSettings();
        };

        // File handling
        const triggerFileInput = () => {
            fileInput.value?.click();
        };

        const handleFileSelect = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files[0]) {
                uploadedFile.value = target.files[0];
                // Auto-fill title if empty
                if (!newDocument.value.title_hu) {
                    const name = target.files[0].name.replace(/\.[^/.]+$/, '');
                    newDocument.value.title_hu = name;
                }
            }
        };

        const handleFileDrop = (event: DragEvent) => {
            isDragging.value = false;
            if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
                uploadedFile.value = event.dataTransfer.files[0];
                if (!newDocument.value.title_hu) {
                    const name = event.dataTransfer.files[0].name.replace(/\.[^/.]+$/, '');
                    newDocument.value.title_hu = name;
                }
            }
        };

        const clearFile = () => {
            uploadedFile.value = null;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
        };

        // Upload document
        const uploadDocument = async () => {
            if (!uploadedFile.value || !newDocument.value.title_hu) return;

            isUploading.value = true;
            uploadProgress.value = 0;

            try {
                // 1. Upload file to storage
                const fileResponse = await storage.createFile(
                    config.documents,
                    ID.unique(),
                    uploadedFile.value
                );

                uploadProgress.value = 50;

                // 2. Create document record
                const docData: any = {
                    title_hu: newDocument.value.title_hu,
                    title_rs: newDocument.value.title_rs || newDocument.value.title_hu,
                    title_en: newDocument.value.title_en || newDocument.value.title_hu,
                    short_hu: newDocument.value.short_hu,
                    short_rs: newDocument.value.short_rs || newDocument.value.short_hu,
                    short_en: newDocument.value.short_en || newDocument.value.short_hu,
                    default_file: fileResponse.$id,
                    file_name: uploadedFile.value.name,
                    file_size: uploadedFile.value.size,
                    visible: true
                };

                const docResponse = await database.createDocument(
                    config.website_db,
                    config.documents_db,
                    ID.unique(),
                    docData
                );

                uploadProgress.value = 100;

                // 3. Add to selection
                localSettings.value.documentIds.push(docResponse.$id);
                emitSettings();

                // 4. Add to recently uploaded
                recentlyUploaded.value.push({
                    id: docResponse.$id,
                    title: newDocument.value.title_hu
                });

                // 5. Reload documents list
                await loadDocuments();

                // 6. Reset form
                resetUploadForm();

                notify({ type: 'success', text: 'Dokumentum feltöltve!' });

                // Switch to select mode
                mode.value = 'select';
            } catch (error: any) {
                console.error('Failed to upload document:', error);
                notify({ type: 'error', text: 'Hiba: ' + (error.message || 'Feltöltési hiba') });
            } finally {
                isUploading.value = false;
                uploadProgress.value = 0;
            }
        };

        // Reset upload form
        const resetUploadForm = () => {
            newDocument.value = {
                title_hu: '',
                title_rs: '',
                title_en: '',
                short_hu: '',
                short_rs: '',
                short_en: ''
            };
            clearFile();
            isEditingDocument.value = false;
        };

        // Edit document
        const editDocument = (docId: string) => {
            const doc = getDocumentById(docId);
            if (!doc) return;

            editingDocId.value = docId;
            editingDoc.value = {
                title_hu: doc.title_hu || '',
                title_rs: doc.title_rs || '',
                title_en: doc.title_en || '',
                short_hu: doc.short_hu || '',
                short_rs: doc.short_rs || '',
                short_en: doc.short_en || ''
            };
            editDialog.value = true;
        };

        // Save document edit
        const saveDocumentEdit = async () => {
            if (!editingDocId.value) return;

            isSavingDoc.value = true;

            try {
                await database.updateDocument(
                    config.website_db,
                    config.documents_db,
                    editingDocId.value,
                    {
                        title_hu: editingDoc.value.title_hu,
                        title_rs: editingDoc.value.title_rs,
                        title_en: editingDoc.value.title_en,
                        short_hu: editingDoc.value.short_hu,
                        short_rs: editingDoc.value.short_rs,
                        short_en: editingDoc.value.short_en
                    }
                );

                await loadDocuments();
                editDialog.value = false;
                notify({ type: 'success', text: 'Dokumentum frissítve!' });
            } catch (error: any) {
                console.error('Failed to update document:', error);
                notify({ type: 'error', text: 'Hiba: ' + (error.message || 'Mentési hiba') });
            } finally {
                isSavingDoc.value = false;
            }
        };

        // Cancel edit document
        const cancelEditDocument = () => {
            isEditingDocument.value = false;
            resetUploadForm();
        };

        // Add to selection from recently uploaded
        const addToSelection = (docId: string) => {
            if (!localSettings.value.documentIds.includes(docId)) {
                localSettings.value.documentIds.push(docId);
                emitSettings();
            }
        };

        // Remove from recently uploaded
        const removeFromRecent = (docId: string) => {
            recentlyUploaded.value = recentlyUploaded.value.filter(d => d.id !== docId);
        };

        // Helpers
        const getFileExtension = (filename: string): string => {
            return filename.split('.').pop()?.toLowerCase() || '';
        };

        const formatFileSize = (bytes?: number): string => {
            if (!bytes) return '';
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };

        const getDocTypeIcon = (type?: string): string => {
            const icons: Record<string, string> = {
                pdf: 'mdi-file-pdf-box',
                doc: 'mdi-file-word',
                docx: 'mdi-file-word',
                xls: 'mdi-file-excel',
                xlsx: 'mdi-file-excel',
                ppt: 'mdi-file-powerpoint',
                pptx: 'mdi-file-powerpoint',
                txt: 'mdi-file-document-outline',
                zip: 'mdi-folder-zip',
                rar: 'mdi-folder-zip'
            };
            return icons[type || ''] || 'mdi-file-document';
        };

        const getDocTypeColor = (type?: string): string => {
            const colors: Record<string, string> = {
                pdf: 'red',
                doc: 'blue',
                docx: 'blue',
                xls: 'green',
                xlsx: 'green',
                ppt: 'orange',
                pptx: 'orange',
                txt: 'grey',
                zip: 'amber',
                rar: 'amber'
            };
            return colors[type || ''] || 'grey';
        };

        const emitSettings = () => {
            emit('update:settings', { ...localSettings.value });
            emit('save');
        };

        watch(() => props.settings, (newSettings) => {
            localSettings.value = {
                documentIds: newSettings.documentIds || [],
                showPreview: newSettings.showPreview !== false
            };
        }, { deep: true });

        onMounted(loadDocuments);

        return {
            mode,
            documents,
            localSettings,
            selectedDocuments,
            isDragging,
            isUploading,
            uploadProgress,
            uploadedFile,
            fileInput,
            newDocument,
            recentlyUploaded,
            isEditingDocument,
            editDialog,
            editingDoc,
            isSavingDoc,
            loadDocuments,
            getDocumentById,
            removeDocument,
            triggerFileInput,
            handleFileSelect,
            handleFileDrop,
            clearFile,
            uploadDocument,
            editDocument,
            saveDocumentEdit,
            cancelEditDocument,
            addToSelection,
            removeFromRecent,
            getFileExtension,
            formatFileSize,
            getDocTypeIcon,
            getDocTypeColor,
            emitSettings
        };
    }
});
</script>

<style scoped>
.upload-section {
    background: rgba(var(--v-theme-surface-variant), 0.3);
    border-radius: 12px;
    padding: 16px;
}

.upload-zone {
    border: 2px dashed rgba(var(--v-theme-primary), 0.3);
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(var(--v-theme-surface), 0.5);
}

.upload-zone:hover,
.upload-zone.dragover {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.05);
}

.upload-zone.has-file {
    border-style: solid;
    border-color: rgb(var(--v-theme-success));
    background: rgba(var(--v-theme-success), 0.05);
}

.upload-placeholder {
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.uploaded-file-info {
    text-align: left;
}

.doc-item {
    background: rgba(var(--v-theme-surface-variant), 0.3);
    transition: all 0.2s ease;
}

.doc-item:hover {
    background: rgba(var(--v-theme-primary), 0.1);
}

.doc-drag-handle {
    cursor: move !important;
}

.cursor-move {
    cursor: move !important;
}

.gap-2 {
    gap: 8px;
}

.gap-3 {
    gap: 12px;
}

.flex-1 {
    flex: 1;
}

/* Dark mode */
:deep(.v-theme--dark) .upload-section {
    background: rgba(0, 0, 0, 0.3);
}

:deep(.v-theme--dark) .upload-zone {
    background: rgba(0, 0, 0, 0.2);
}

:deep(.v-theme--dark) .doc-item {
    background: rgba(255, 255, 255, 0.05);
}
</style>
