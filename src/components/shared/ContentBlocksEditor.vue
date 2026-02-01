<template>
    <v-card class="content-blocks-editor" elevation="2" rounded>
        <v-card-title class="d-flex align-center pa-4 bg-sky-600 text-white">
            <v-icon left>mdi-view-dashboard-variant</v-icon>
            <span class="text-h6 ml-2">{{ $t('content_blocks') }}</span>
            <v-spacer />

            <!-- Language Filter -->
            <v-btn-toggle
                v-model="currentLanguage"
                mandatory
                density="compact"
                color="white"
                class="mr-3"
            >
                <v-btn value="rs" size="small">RS</v-btn>
                <v-btn value="hu" size="small">HU</v-btn>
                <v-btn value="en" size="small">EN</v-btn>
            </v-btn-toggle>

            <v-chip size="small" color="white" variant="flat" class="text-sky-600">
                {{ filteredBlocks.length }} {{ $t('blocks') }}
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
            <!-- Empty State -->
            <div v-if="filteredBlocks.length === 0" class="empty-state text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-puzzle-plus-outline</v-icon>
                <p class="text-body-1 text-grey mt-4">{{ $t('no_blocks_for_language', { lang: getLanguageName(currentLanguage) }) }}</p>
                <v-btn
                    color="primary"
                    variant="tonal"
                    class="mt-4"
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
                <template #item="{ element, index }">
                    <v-card
                        class="block-item mb-4"
                        :class="{ 'border-primary': expandedBlock === element.$id }"
                        variant="outlined"
                        rounded
                    >
                        <!-- Block Header -->
                        <v-card-title
                            class="block-header d-flex align-center pa-3"
                            :class="getBlockHeaderClass(element.type)"
                        >
                            <v-icon class="drag-handle cursor-move mr-2" color="white">
                                mdi-drag-vertical
                            </v-icon>

                            <v-chip size="small" :color="getBlockTypeColor(element.type)" variant="flat" class="mr-2">
                                <v-icon left size="small">{{ getBlockTypeIcon(element.type) }}</v-icon>
                                {{ $t(`block_type_${element.type || 'text'}`) }}
                            </v-chip>

                            <span class="text-body-1 font-weight-medium text-white ml-2">
                                {{ element.title || $t('untitled_block') }}
                            </span>

                            <v-spacer />

                            <v-switch
                                v-model="element.visible"
                                density="compact"
                                hide-details
                                color="white"
                                class="mr-2"
                                @change="saveBlock(element)"
                            />

                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="white"
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
                                color="white"
                                @click="confirmDelete(element)"
                            >
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </v-card-title>

                        <!-- Block Content (Expanded) -->
                        <v-expand-transition>
                            <v-card-text v-if="expandedBlock === element.$id" class="pa-4">
                                <!-- Block Title -->
                                <v-text-field
                                    v-model="element.title"
                                    :label="$t('block_title')"
                                    variant="outlined"
                                    density="comfortable"
                                    prepend-inner-icon="mdi-format-title"
                                    class="mb-4"
                                    @change="saveBlock(element)"
                                />

                                <!-- Type-specific Editor -->
                                <component
                                    :is="getBlockEditorComponent(element.type)"
                                    :block="element"
                                    :settings="parseSettings(element.settings)"
                                    @update:settings="(s) => updateBlockSettings(element, s)"
                                    @save="saveBlock(element)"
                                />

                                <!-- Block Actions -->
                                <div class="d-flex justify-end mt-4 gap-2">
                                    <v-btn
                                        variant="tonal"
                                        color="primary"
                                        size="small"
                                        @click="saveBlock(element)"
                                        :loading="savingId === element.$id"
                                    >
                                        <v-icon left size="small">mdi-content-save</v-icon>
                                        {{ $t('save') }}
                                    </v-btn>
                                </div>
                            </v-card-text>
                        </v-expand-transition>
                    </v-card>
                </template>
            </draggable>

            <!-- Add Block Button -->
            <v-btn
                v-if="filteredBlocks.length > 0"
                color="primary"
                variant="outlined"
                block
                class="mt-4"
                @click="showAddBlockDialog = true"
            >
                <v-icon left>mdi-plus</v-icon>
                {{ $t('add_block') }} ({{ getLanguageName(currentLanguage) }})
            </v-btn>
        </v-card-text>

        <!-- Add Block Dialog -->
        <v-dialog v-model="showAddBlockDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6 pa-4">
                    <v-icon left color="primary">mdi-puzzle-plus</v-icon>
                    {{ $t('add_new_block') }} ({{ getLanguageName(currentLanguage) }})
                </v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col
                            v-for="blockType in blockTypes"
                            :key="blockType.value"
                            cols="6"
                            sm="4"
                        >
                            <v-card
                                class="block-type-card text-center pa-4"
                                variant="outlined"
                                :color="selectedBlockType === blockType.value ? 'primary' : undefined"
                                @click="selectedBlockType = blockType.value"
                                hover
                            >
                                <v-icon size="32" :color="blockType.color">{{ blockType.icon }}</v-icon>
                                <p class="text-body-2 mt-2 mb-0">{{ $t(blockType.label) }}</p>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showAddBlockDialog = false">
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="flat"
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
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon left color="error">mdi-alert</v-icon>
                    {{ $t('confirm_delete') }}
                </v-card-title>
                <v-card-text>
                    {{ $t('delete_block_confirmation') }}
                    <strong v-if="blockToDelete">{{ blockToDelete.title || $t('untitled_block') }}</strong>?
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="deleteDialog = false">
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn
                        color="error"
                        variant="flat"
                        @click="deleteBlock"
                        :loading="isDeleting"
                    >
                        {{ $t('delete') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
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
        const database = new Databases(appw);
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
            { value: 'text', label: 'block_type_text', icon: 'mdi-text-box', color: 'blue' },
            { value: 'gallery', label: 'block_type_gallery', icon: 'mdi-image-multiple', color: 'green' },
            { value: 'video', label: 'block_type_video', icon: 'mdi-video', color: 'red' },
            { value: 'form', label: 'block_type_form', icon: 'mdi-form-select', color: 'purple' },
            { value: 'document', label: 'block_type_document', icon: 'mdi-file-document', color: 'orange' }
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
            return blockType?.color || 'blue';
        };

        const getBlockHeaderClass = (type: string): string => {
            const colorMap: Record<string, string> = {
                text: 'bg-blue-darken-1',
                gallery: 'bg-green-darken-1',
                video: 'bg-red-darken-1',
                form: 'bg-purple-darken-1',
                document: 'bg-orange-darken-1'
            };
            return colorMap[type] || 'bg-grey-darken-1';
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
    border-radius: 16px !important;
}

.block-item {
    transition: all 0.3s ease;
    border-radius: 12px !important;
    overflow: hidden;
}

.block-item:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
}

.block-header {
    border-radius: 0;
    transition: background-color 0.3s ease;
}

.drag-handle {
    cursor: move;
}

.ghost-block {
    opacity: 0.5;
    background: rgb(var(--v-theme-primary-lighten-4));
}

.block-type-card {
    cursor: pointer;
    transition: all 0.2s ease;
}

.block-type-card:hover {
    transform: translateY(-2px);
}

.empty-state {
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.cursor-move {
    cursor: move !important;
}

.gap-2 {
    gap: 8px;
}

/* Block type colors */
.bg-blue-darken-1 { background-color: #1976d2 !important; }
.bg-green-darken-1 { background-color: #388e3c !important; }
.bg-red-darken-1 { background-color: #d32f2f !important; }
.bg-purple-darken-1 { background-color: #7b1fa2 !important; }
.bg-orange-darken-1 { background-color: #f57c00 !important; }
.bg-grey-darken-1 { background-color: #616161 !important; }

/* Responsive */
@media (max-width: 600px) {
    .block-header {
        flex-wrap: wrap;
        gap: 8px;
    }
}
</style>
