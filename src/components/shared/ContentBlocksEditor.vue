<template>
    <div class="content-blocks-editor">
        <div class="blocks-toolbar">
            <div class="blocks-toolbar-left">
                <span class="blocks-toolbar-icon">
                    <v-icon size="small" color="white">mdi-view-dashboard-variant</v-icon>
                </span>
                <span class="blocks-toolbar-title">{{ $t('content_blocks') }}</span>
                <v-chip size="small" color="primary" variant="tonal" class="ml-2">
                    {{ filteredBlocks.length }} {{ $t('blocks') }}
                </v-chip>
            </div>

            <div class="blocks-toolbar-right">
                <v-btn-toggle
                    v-model="currentLanguage"
                    mandatory
                    density="compact"
                    color="primary"
                    divided
                    class="lang-toggle"
                >
                    <v-btn value="rs" size="small">RS</v-btn>
                    <v-btn value="hu" size="small">HU</v-btn>
                    <v-btn value="en" size="small">EN</v-btn>
                </v-btn-toggle>
            </div>
        </div>

        <div class="blocks-body pa-4">
            <!-- Empty State -->
            <div v-if="filteredBlocks.length === 0" class="empty-state text-center py-10">
                <div class="empty-icon-wrap mx-auto mb-4">
                    <v-icon size="40" color="primary">mdi-puzzle-plus-outline</v-icon>
                </div>
                <p class="text-body-1 text-medium-emphasis mb-4">
                    {{ $t('no_blocks_for_language', { lang: getLanguageName(currentLanguage) }) }}
                </p>
                <v-btn
                    color="primary"
                    class="glass-btn-like"
                    @click="showAddBlockDialog = true"
                >
                    <v-icon left>mdi-plus</v-icon>
                    {{ $t('add_first_block') }}
                </v-btn>
            </div>

            <!-- Blocks List -->
            <draggable
                v-else
                v-model="filteredBlocks"
                item-key="$id"
                handle=".drag-handle"
                ghost-class="ghost-block"
                @end="onDragEnd"
            >
                <template #item="{ element }">
                    <div
                        class="block-item mb-3"
                        :class="[
                            getBlockHeaderClass(element.type),
                            { 'is-expanded': expandedBlock === element.$id }
                        ]"
                    >
                        <!-- Block Header -->
                        <div class="block-header d-flex align-center pa-3">
                            <v-icon class="drag-handle cursor-move mr-2" color="primary">
                                mdi-drag-vertical
                            </v-icon>

                            <v-chip
                                size="small"
                                :color="getBlockTypeColor(element.type)"
                                variant="tonal"
                                class="mr-2"
                            >
                                <v-icon left size="small">{{ getBlockTypeIcon(element.type) }}</v-icon>
                                {{ $t(`block_type_${element.type || 'text'}`) }}
                            </v-chip>

                            <span class="text-body-1 font-weight-medium block-title-text">
                                {{ element.title || $t('untitled_block') }}
                            </span>

                            <v-spacer />

                            <v-switch
                                v-model="element.visible"
                                density="compact"
                                hide-details
                                color="primary"
                                class="mr-2"
                                @change="saveBlock(element)"
                            />

                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="primary"
                                @click="toggleExpand(element.$id)"
                            >
                                <v-icon>
                                    {{ expandedBlock === element.$id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                </v-icon>
                            </v-btn>

                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="error"
                                @click="confirmDelete(element)"
                            >
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </div>

                        <!-- Block Content (Expanded) -->
                        <v-expand-transition>
                            <div v-if="expandedBlock === element.$id" class="block-body pa-4">
                                <v-text-field
                                    v-model="element.title"
                                    :label="$t('block_title')"
                                    variant="outlined"
                                    density="comfortable"
                                    prepend-inner-icon="mdi-format-title"
                                    class="mb-4"
                                    @change="saveBlock(element)"
                                />

                                <component
                                    :is="getBlockEditorComponent(element.type)"
                                    :block="element"
                                    :settings="parseSettings(element.settings)"
                                    @update:settings="(s) => updateBlockSettings(element, s)"
                                    @save="saveBlock(element)"
                                />

                                <div class="d-flex justify-end mt-4 gap-2">
                                    <v-btn
                                        color="primary"
                                        size="small"
                                        @click="saveBlock(element)"
                                        :loading="savingId === element.$id"
                                    >
                                        <v-icon left size="small">mdi-content-save</v-icon>
                                        {{ $t('save') }}
                                    </v-btn>
                                </div>
                            </div>
                        </v-expand-transition>
                    </div>
                </template>
            </draggable>

            <!-- Add Block Button -->
            <v-btn
                v-if="filteredBlocks.length > 0"
                color="primary"
                variant="outlined"
                block
                class="mt-2 add-block-btn"
                @click="showAddBlockDialog = true"
            >
                <v-icon left>mdi-plus</v-icon>
                {{ $t('add_block') }} ({{ getLanguageName(currentLanguage) }})
            </v-btn>
        </div>

        <!-- Add Block Dialog -->
        <v-dialog v-model="showAddBlockDialog" max-width="520">
            <v-card class="blocks-dialog" rounded="lg">
                <v-card-title class="editor-card-header">
                    <v-icon left>mdi-puzzle-plus</v-icon>
                    {{ $t('add_new_block') }} ({{ getLanguageName(currentLanguage) }})
                </v-card-title>
                <v-card-text class="pa-4">
                    <v-row>
                        <v-col
                            v-for="blockType in blockTypes"
                            :key="blockType.value"
                            cols="6"
                            sm="4"
                        >
                            <div
                                class="block-type-card text-center pa-4"
                                :class="{ 'is-selected': selectedBlockType === blockType.value }"
                                @click="selectedBlockType = blockType.value"
                            >
                                <v-icon size="32" :color="blockType.color">{{ blockType.icon }}</v-icon>
                                <p class="text-body-2 mt-2 mb-0 font-weight-medium">{{ $t(blockType.label) }}</p>
                            </div>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-spacer />
                    <v-btn variant="text" @click="showAddBlockDialog = false">
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="addBlock"
                        :loading="isAdding"
                        :disabled="!selectedBlockType"
                    >
                        {{ $t('add') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
            <v-card class="blocks-dialog" rounded="lg">
                <v-card-title class="text-h6 pa-4">
                    <v-icon left color="error">mdi-alert</v-icon>
                    {{ $t('confirm_delete') }}
                </v-card-title>
                <v-card-text>
                    {{ $t('delete_block_confirmation') }}
                    <strong v-if="blockToDelete">{{ blockToDelete.title || $t('untitled_block') }}</strong>?
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-spacer />
                    <v-btn variant="text" @click="deleteDialog = false">
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn
                        color="error"
                        @click="deleteBlock"
                        :loading="isDeleting"
                    >
                        {{ $t('delete') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed, markRaw } from 'vue';
import { Databases, ID, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { notify } from '@kyvg/vue3-notification';
import { useI18n } from 'vue-i18n';
import { useLoadingStore } from '@/stores/loading';
import draggable from 'vuedraggable';

// Block Editor Components
import TextBlockEditor from './blocks/TextBlockEditor.vue';
import GalleryBlockEditor from './blocks/GalleryBlockEditor.vue';
import VideoBlockEditor from './blocks/VideoBlockEditor.vue';
import FormBlockEditor from './blocks/FormBlockEditor.vue';
import DocumentBlockEditor from './blocks/DocumentBlockEditor.vue';

const database = new Databases(appw);

interface ContentBlock {
    $id: string;
    doc_id: string;
    title: string;
    text: string;
    lang: string;
    type: string;
    settings: string;
    order: number;
    visible: boolean;
}

interface BlockType {
    value: string;
    label: string;
    icon: string;
    color: string;
}

export default defineComponent({
    name: 'ContentBlocksEditor',
    components: {
        draggable,
        TextBlockEditor,
        GalleryBlockEditor,
        VideoBlockEditor,
        FormBlockEditor,
        DocumentBlockEditor
    },
    props: {
        docId: {
            type: String,
            required: true
        }
    },
    emits: ['update'],
    setup(props, { emit }) {
        const { t } = useI18n();
        const loadingStore = useLoadingStore();

        // State
        const allBlocks = ref<ContentBlock[]>([]);
        const currentLanguage = ref(loadingStore.language === 'sr' ? 'rs' : loadingStore.language || 'rs');
        const expandedBlock = ref<string | null>(null);
        const isLoading = ref(false);
        const isAdding = ref(false);
        const isDeleting = ref(false);
        const savingId = ref<string | null>(null);
        const deleteDialog = ref(false);
        const blockToDelete = ref<ContentBlock | null>(null);
        const showAddBlockDialog = ref(false);
        const selectedBlockType = ref<string>('text');

        // Filtered blocks by current language
        const filteredBlocks = computed({
            get: () => allBlocks.value.filter(b => b.lang === currentLanguage.value),
            set: (newValue) => {
                // Update order in filtered list and merge back
                const otherBlocks = allBlocks.value.filter(b => b.lang !== currentLanguage.value);
                allBlocks.value = [...otherBlocks, ...newValue];
            }
        });

        // Helper methods
        const getLanguageName = (lang: string): string => {
            const names: Record<string, string> = {
                rs: 'Srpski',
                hu: 'Magyar',
                en: 'English'
            };
            return names[lang] || lang;
        };

        // Block types configuration
        const blockTypes: BlockType[] = [
            { value: 'text', label: 'block_type_text', icon: 'mdi-text-box', color: 'primary' },
            { value: 'gallery', label: 'block_type_gallery', icon: 'mdi-image-multiple', color: 'success' },
            { value: 'video', label: 'block_type_video', icon: 'mdi-video', color: 'error' },
            { value: 'form', label: 'block_type_form', icon: 'mdi-form-select', color: 'info' },
            { value: 'document', label: 'block_type_document', icon: 'mdi-file-document', color: 'warning' }
        ];

        // Block editor component mapping
        const blockEditorComponents = {
            text: markRaw(TextBlockEditor),
            gallery: markRaw(GalleryBlockEditor),
            video: markRaw(VideoBlockEditor),
            form: markRaw(FormBlockEditor),
            document: markRaw(DocumentBlockEditor)
        };

        // Methods
        const getBlockEditorComponent = (type: string) => {
            return blockEditorComponents[type as keyof typeof blockEditorComponents] || blockEditorComponents.text;
        };

        const getBlockTypeIcon = (type: string): string => {
            const blockType = blockTypes.find(bt => bt.value === type);
            return blockType?.icon || 'mdi-text-box';
        };

        const getBlockTypeColor = (type: string): string => {
            const blockType = blockTypes.find(bt => bt.value === type);
            return blockType?.color || 'primary';
        };

        const getBlockHeaderClass = (type: string): string => {
            const colorMap: Record<string, string> = {
                text: 'block-type-text',
                gallery: 'block-type-gallery',
                video: 'block-type-video',
                form: 'block-type-form',
                document: 'block-type-document'
            };
            return colorMap[type] || 'block-type-text';
        };

        const parseSettings = (settings: string): Record<string, any> => {
            try {
                return settings ? JSON.parse(settings) : {};
            } catch {
                return {};
            }
        };

        const updateBlockSettings = (block: ContentBlock, newSettings: Record<string, any>) => {
            block.settings = JSON.stringify(newSettings);
        };

        // Load blocks
        const loadBlocks = async () => {
            isLoading.value = true;
            try {
                const response = await database.listDocuments(
                    config.website_db,
                    config.text_components,
                    [
                        Query.equal('doc_id', props.docId),
                        Query.orderAsc('order'),
                        Query.limit(100)
                    ]
                );
                allBlocks.value = response.documents as unknown as ContentBlock[];
            } catch (error) {
                console.error('Failed to load content blocks:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_load_blocks')
                });
            } finally {
                isLoading.value = false;
            }
        };

        // Add new block
        const addBlock = async () => {
            isAdding.value = true;
            try {
                const languageBlocks = filteredBlocks.value;
                const newOrder = languageBlocks.length > 0
                    ? Math.max(...languageBlocks.map(b => b.order)) + 1
                    : 0;

                const defaultSettings: Record<string, any> = {};

                // Type-specific default settings
                switch (selectedBlockType.value) {
                    case 'gallery':
                        defaultSettings.galleryId = '';
                        defaultSettings.layout = 'grid';
                        defaultSettings.columns = 3;
                        break;
                    case 'video':
                        defaultSettings.videoUrl = '';
                        defaultSettings.provider = 'youtube';
                        defaultSettings.autoplay = false;
                        break;
                    case 'form':
                        defaultSettings.formId = '';
                        defaultSettings.showResults = false;
                        break;
                    case 'document':
                        defaultSettings.documentIds = [];
                        defaultSettings.showPreview = true;
                        break;
                }

                const newBlock = await database.createDocument(
                    config.website_db,
                    config.text_components,
                    ID.unique(),
                    {
                        doc_id: props.docId,
                        title: '',
                        text: '',
                        lang: currentLanguage.value,
                        type: selectedBlockType.value,
                        settings: JSON.stringify(defaultSettings),
                        order: newOrder,
                        visible: true,
                        published: false
                    }
                );

                allBlocks.value.push(newBlock as unknown as ContentBlock);
                expandedBlock.value = newBlock.$id;
                showAddBlockDialog.value = false;
                selectedBlockType.value = 'text';

                notify({
                    type: 'success',
                    text: t('block_added')
                });

                emit('update');
            } catch (error) {
                console.error('Failed to add block:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_add_block')
                });
            } finally {
                isAdding.value = false;
            }
        };

        // Save block
        const saveBlock = async (block: ContentBlock) => {
            savingId.value = block.$id;
            try {
                await database.updateDocument(
                    config.website_db,
                    config.text_components,
                    block.$id,
                    {
                        title: block.title,
                        text: block.text || '',
                        lang: block.lang,
                        type: block.type,
                        settings: block.settings || '{}',
                        order: block.order,
                        visible: block.visible
                    }
                );

                notify({
                    type: 'success',
                    text: t('saved')
                });

                emit('update');
            } catch (error) {
                console.error('Failed to save block:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_save_block')
                });
            } finally {
                savingId.value = null;
            }
        };

        // Confirm delete
        const confirmDelete = (block: ContentBlock) => {
            blockToDelete.value = block;
            deleteDialog.value = true;
        };

        // Delete block
        const deleteBlock = async () => {
            if (!blockToDelete.value) return;

            isDeleting.value = true;
            try {
                await database.deleteDocument(
                    config.website_db,
                    config.text_components,
                    blockToDelete.value.$id
                );

                allBlocks.value = allBlocks.value.filter(
                    b => b.$id !== blockToDelete.value!.$id
                );

                await updateBlockOrder();

                notify({
                    type: 'success',
                    text: t('block_deleted')
                });

                emit('update');
            } catch (error) {
                console.error('Failed to delete block:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_delete_block')
                });
            } finally {
                isDeleting.value = false;
                deleteDialog.value = false;
                blockToDelete.value = null;
            }
        };

        // Toggle expand
        const toggleExpand = (id: string) => {
            expandedBlock.value = expandedBlock.value === id ? null : id;
        };

        // Handle drag end
        const onDragEnd = async () => {
            await updateBlockOrder();
        };

        // Update block order
        const updateBlockOrder = async () => {
            try {
                const blocksToUpdate = filteredBlocks.value;
                const updatePromises = blocksToUpdate.map((block, index) => {
                    block.order = index;
                    return database.updateDocument(
                        config.website_db,
                        config.text_components,
                        block.$id,
                        { order: index }
                    );
                });

                await Promise.all(updatePromises);

                notify({
                    type: 'success',
                    text: t('order_updated')
                });

                emit('update');
            } catch (error) {
                console.error('Failed to update order:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_update_order')
                });
            }
        };

        // Watch for docId changes
        watch(() => props.docId, () => {
            if (props.docId) {
                loadBlocks();
            }
        });

        // Load on mount
        onMounted(() => {
            if (props.docId) {
                loadBlocks();
            }
        });

        return {
            allBlocks,
            filteredBlocks,
            blockTypes,
            currentLanguage,
            expandedBlock,
            isLoading,
            isAdding,
            isDeleting,
            savingId,
            deleteDialog,
            blockToDelete,
            showAddBlockDialog,
            selectedBlockType,
            loadBlocks,
            addBlock,
            saveBlock,
            confirmDelete,
            deleteBlock,
            toggleExpand,
            onDragEnd,
            getLanguageName,
            getBlockEditorComponent,
            getBlockTypeIcon,
            getBlockTypeColor,
            getBlockHeaderClass,
            parseSettings,
            updateBlockSettings
        };
    }
});
</script>

<style scoped>
.content-blocks-editor {
    border-radius: 1rem;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 20px rgba(14, 165, 233, 0.08);
}

:global(.dark) .content-blocks-editor {
    background: rgba(30, 41, 59, 0.45);
    border-color: rgba(148, 163, 184, 0.16);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.blocks-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.9rem 1.15rem;
    background: linear-gradient(90deg, #0ea5e9, #38bdf8);
    color: white;
}

.blocks-toolbar-left,
.blocks-toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.blocks-toolbar-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.6rem;
    background: rgba(255, 255, 255, 0.2);
}

.blocks-toolbar-title {
    font-weight: 600;
    font-size: 1.05rem;
}

.lang-toggle {
    background: rgba(255, 255, 255, 0.15) !important;
    border-radius: 9999px !important;
}

.lang-toggle :deep(.v-btn) {
    color: white !important;
    min-width: 2.5rem;
}

.blocks-body {
    min-height: 120px;
}

.block-item {
    border-radius: 0.85rem;
    overflow: hidden;
    border: 1px solid rgba(14, 165, 233, 0.15);
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

:global(.dark) .block-item {
    background: rgba(15, 23, 42, 0.55);
    border-color: rgba(148, 163, 184, 0.16);
}

.block-item:hover {
    border-color: rgba(14, 165, 233, 0.4);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.12);
}

.block-item.is-expanded {
    border-color: rgba(14, 165, 233, 0.5);
    box-shadow: 0 8px 24px rgba(14, 165, 233, 0.15);
}

.block-header {
    border-left: 3px solid #0ea5e9;
    background: rgba(14, 165, 233, 0.06);
}

.block-type-text .block-header { border-left-color: #0ea5e9; background: rgba(14, 165, 233, 0.08); }
.block-type-gallery .block-header { border-left-color: #16a34a; background: rgba(22, 163, 74, 0.08); }
.block-type-video .block-header { border-left-color: #dc2626; background: rgba(220, 38, 38, 0.08); }
.block-type-form .block-header { border-left-color: #0284c7; background: rgba(2, 132, 199, 0.08); }
.block-type-document .block-header { border-left-color: #d97706; background: rgba(217, 119, 6, 0.08); }

:global(.dark) .block-header {
    background: rgba(56, 189, 248, 0.08);
}

.block-title-text {
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 40%;
}

:global(.dark) .block-title-text {
    color: #f1f5f9;
}

.block-body {
    border-top: 1px solid rgba(14, 165, 233, 0.12);
    background: rgba(255, 255, 255, 0.4);
}

:global(.dark) .block-body {
    background: rgba(15, 23, 42, 0.35);
    border-top-color: rgba(148, 163, 184, 0.12);
}

.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}

.ghost-block {
    opacity: 0.45;
    border: 2px dashed rgba(14, 165, 233, 0.5) !important;
}

.empty-icon-wrap {
    width: 4.5rem;
    height: 4.5rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(14, 165, 233, 0.12);
    border: 1px solid rgba(14, 165, 233, 0.2);
}

.add-block-btn {
    border-style: dashed !important;
    border-radius: 0.85rem !important;
}

.block-type-card {
    cursor: pointer;
    border-radius: 0.85rem;
    border: 1px solid rgba(14, 165, 233, 0.18);
    background: rgba(255, 255, 255, 0.55);
    transition: all 0.2s ease;
}

.block-type-card:hover {
    transform: translateY(-2px);
    border-color: rgba(14, 165, 233, 0.45);
    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.12);
}

.block-type-card.is-selected {
    border-color: #0ea5e9;
    background: rgba(14, 165, 233, 0.12);
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
}

:global(.dark) .block-type-card {
    background: rgba(30, 41, 59, 0.55);
    border-color: rgba(148, 163, 184, 0.18);
}

.blocks-dialog {
    overflow: hidden;
}

.cursor-move {
    cursor: move !important;
}

.gap-2 {
    gap: 8px;
}

@media (max-width: 600px) {
    .block-header {
        flex-wrap: wrap;
        gap: 8px;
    }

    .block-title-text {
        max-width: 100%;
    }

    .blocks-toolbar {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
