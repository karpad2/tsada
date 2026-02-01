<template>
    <v-card class="text-components-editor" elevation="2" rounded>
        <v-card-title class="d-flex align-center pa-4 bg-sky-600 text-white">
            <v-icon left>mdi-text-box-multiple</v-icon>
            <span class="text-h6 ml-2">{{ $t('text_components') }}</span>
            <v-spacer />
            <v-chip size="small" color="white" variant="flat" class="text-sky-600">
                {{ components.length }} {{ $t('sections') }}
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-4">
            <!-- Empty State -->
            <div v-if="components.length === 0" class="empty-state text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-text-box-plus-outline</v-icon>
                <p class="text-body-1 text-grey mt-4">{{ $t('no_text_components') }}</p>
                <v-btn
                    color="primary"
                    variant="tonal"
                    class="mt-4"
                    @click="addComponent"
                >
                    <v-icon left>mdi-plus</v-icon>
                    {{ $t('add_first_section') }}
                </v-btn>
            </div>

            <!-- Components List -->
            <draggable
                v-else
                v-model="components"
                item-key="$id"
                handle=".drag-handle"
                ghost-class="ghost-component"
                @end="onDragEnd"
            >
                <template #item="{ element, index }">
                    <v-card
                        class="component-item mb-4"
                        :class="{ 'border-primary': expandedComponent === element.$id }"
                        variant="outlined"
                        rounded
                    >
                        <!-- Component Header -->
                        <v-card-title
                            class="component-header d-flex align-center pa-3"
                            :class="{ 'bg-grey-lighten-4': expandedComponent !== element.$id }"
                        >
                            <v-icon class="drag-handle cursor-move mr-2" color="grey">
                                mdi-drag-vertical
                            </v-icon>

                            <v-chip size="small" color="primary" variant="flat" class="mr-2">
                                #{{ index + 1 }}
                            </v-chip>

                            <span class="text-body-1 font-weight-medium">
                                {{ element.title || $t('untitled_section') }}
                            </span>

                            <v-spacer />

                            <v-switch
                                v-model="element.visible"
                                :label="$t('visible')"
                                density="compact"
                                hide-details
                                color="success"
                                class="mr-4"
                                @change="saveComponent(element)"
                            />

                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                @click="toggleExpand(element.$id)"
                            >
                                <v-icon>
                                    {{ expandedComponent === element.$id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
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
                        </v-card-title>

                        <!-- Component Content (Expanded) -->
                        <v-expand-transition>
                            <v-card-text v-if="expandedComponent === element.$id" class="pa-4">
                                <!-- Section Title -->
                                <v-text-field
                                    v-model="element.title"
                                    :label="$t('section_title')"
                                    variant="outlined"
                                    density="comfortable"
                                    prepend-inner-icon="mdi-format-title"
                                    class="mb-4"
                                    @change="saveComponent(element)"
                                />

                                <!-- Language Tabs -->
                                <v-tabs v-model="activeLanguageTab" color="primary" class="mb-4">
                                    <v-tab value="rs">
                                        <v-icon left size="small">mdi-flag</v-icon>
                                        Srpski
                                    </v-tab>
                                    <v-tab value="hu">
                                        <v-icon left size="small">mdi-flag</v-icon>
                                        Magyar
                                    </v-tab>
                                    <v-tab value="en">
                                        <v-icon left size="small">mdi-flag</v-icon>
                                        English
                                    </v-tab>
                                </v-tabs>

                                <v-window v-model="activeLanguageTab">
                                    <!-- Serbian Content -->
                                    <v-window-item value="rs">
                                        <div class="content-editor-wrapper">
                                            <ckeditor
                                                v-model="element.content_rs"
                                                @change="saveComponent(element)"
                                            />
                                        </div>
                                    </v-window-item>

                                    <!-- Hungarian Content -->
                                    <v-window-item value="hu">
                                        <div class="content-editor-wrapper">
                                            <ckeditor
                                                v-model="element.content_hu"
                                                @change="saveComponent(element)"
                                            />
                                        </div>
                                    </v-window-item>

                                    <!-- English Content -->
                                    <v-window-item value="en">
                                        <div class="content-editor-wrapper">
                                            <ckeditor
                                                v-model="element.content_en"
                                                @change="saveComponent(element)"
                                            />
                                        </div>
                                    </v-window-item>
                                </v-window>

                                <!-- Component Actions -->
                                <div class="d-flex justify-end mt-4 gap-2">
                                    <v-btn
                                        variant="tonal"
                                        color="primary"
                                        size="small"
                                        @click="saveComponent(element)"
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

            <!-- Add New Component Button -->
            <v-btn
                v-if="components.length > 0"
                color="primary"
                variant="outlined"
                block
                class="mt-4"
                @click="addComponent"
                :loading="isAdding"
            >
                <v-icon left>mdi-plus</v-icon>
                {{ $t('add_section') }}
            </v-btn>
        </v-card-text>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon left color="error">mdi-alert</v-icon>
                    {{ $t('confirm_delete') }}
                </v-card-title>
                <v-card-text>
                    {{ $t('delete_component_confirmation') }}
                    <strong v-if="componentToDelete">{{ componentToDelete.title || $t('untitled_section') }}</strong>?
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="deleteDialog = false">
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn
                        color="error"
                        variant="flat"
                        @click="deleteComponent"
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
import { defineComponent, ref, onMounted, watch } from 'vue';
import { Databases, ID, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { notify } from '@kyvg/vue3-notification';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';

interface TextComponent {
    $id: string;
    doc_id: string;
    title: string;
    text: string;
    content_rs: string;
    content_hu: string;
    content_en: string;
    lang: string;
    order: number;
    visible: boolean;
    published: boolean;
}

export default defineComponent({
    name: 'TextComponentsEditor',
    components: {
        draggable
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

        // State
        const components = ref<TextComponent[]>([]);
        const expandedComponent = ref<string | null>(null);
        const activeLanguageTab = ref('rs');
        const isLoading = ref(false);
        const isAdding = ref(false);
        const isDeleting = ref(false);
        const savingId = ref<string | null>(null);
        const deleteDialog = ref(false);
        const componentToDelete = ref<TextComponent | null>(null);

        // Load components
        const loadComponents = async () => {
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
                components.value = response.documents as unknown as TextComponent[];
            } catch (error) {
                console.error('Failed to load text components:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_load_components')
                });
            } finally {
                isLoading.value = false;
            }
        };

        // Add new component
        const addComponent = async () => {
            isAdding.value = true;
            try {
                const newOrder = components.value.length > 0
                    ? Math.max(...components.value.map(c => c.order)) + 1
                    : 0;

                const newComponent = await database.createDocument(
                    config.website_db,
                    config.text_components,
                    ID.unique(),
                    {
                        doc_id: props.docId,
                        title: '',
                        text: '',
                        content_rs: '',
                        content_hu: '',
                        content_en: '',
                        lang: 'rs',
                        order: newOrder,
                        visible: true,
                        published: false
                    }
                );

                components.value.push(newComponent as unknown as TextComponent);
                expandedComponent.value = newComponent.$id;

                notify({
                    type: 'success',
                    text: t('component_added')
                });

                emit('update');
            } catch (error) {
                console.error('Failed to add component:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_add_component')
                });
            } finally {
                isAdding.value = false;
            }
        };

        // Save component
        const saveComponent = async (component: TextComponent) => {
            savingId.value = component.$id;
            try {
                // Determine which text field to use based on language
                // The 'text' field is used by the renderer based on 'lang'
                // So we set it based on the current active tab
                let textContent = '';
                switch (activeLanguageTab.value) {
                    case 'rs':
                        textContent = component.content_rs || '';
                        break;
                    case 'hu':
                        textContent = component.content_hu || '';
                        break;
                    case 'en':
                        textContent = component.content_en || '';
                        break;
                }

                await database.updateDocument(
                    config.website_db,
                    config.text_components,
                    component.$id,
                    {
                        title: component.title,
                        text: textContent,
                        content_rs: component.content_rs || '',
                        content_hu: component.content_hu || '',
                        content_en: component.content_en || '',
                        lang: activeLanguageTab.value,
                        order: component.order,
                        visible: component.visible
                    }
                );

                notify({
                    type: 'success',
                    text: t('saved')
                });

                emit('update');
            } catch (error) {
                console.error('Failed to save component:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_save_component')
                });
            } finally {
                savingId.value = null;
            }
        };

        // Confirm delete
        const confirmDelete = (component: TextComponent) => {
            componentToDelete.value = component;
            deleteDialog.value = true;
        };

        // Delete component
        const deleteComponent = async () => {
            if (!componentToDelete.value) return;

            isDeleting.value = true;
            try {
                await database.deleteDocument(
                    config.website_db,
                    config.text_components,
                    componentToDelete.value.$id
                );

                components.value = components.value.filter(
                    c => c.$id !== componentToDelete.value!.$id
                );

                // Reorder remaining components
                await updateComponentOrder();

                notify({
                    type: 'success',
                    text: t('component_deleted')
                });

                emit('update');
            } catch (error) {
                console.error('Failed to delete component:', error);
                notify({
                    type: 'error',
                    text: t('failed_to_delete_component')
                });
            } finally {
                isDeleting.value = false;
                deleteDialog.value = false;
                componentToDelete.value = null;
            }
        };

        // Toggle expand
        const toggleExpand = (id: string) => {
            expandedComponent.value = expandedComponent.value === id ? null : id;
        };

        // Handle drag end
        const onDragEnd = async () => {
            await updateComponentOrder();
        };

        // Update component order
        const updateComponentOrder = async () => {
            try {
                const updatePromises = components.value.map((component, index) => {
                    component.order = index;
                    return database.updateDocument(
                        config.website_db,
                        config.text_components,
                        component.$id,
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
                loadComponents();
            }
        });

        // Load on mount
        onMounted(() => {
            if (props.docId) {
                loadComponents();
            }
        });

        return {
            components,
            expandedComponent,
            activeLanguageTab,
            isLoading,
            isAdding,
            isDeleting,
            savingId,
            deleteDialog,
            componentToDelete,
            loadComponents,
            addComponent,
            saveComponent,
            confirmDelete,
            deleteComponent,
            toggleExpand,
            onDragEnd
        };
    }
});
</script>

<style scoped>
.text-components-editor {
    border-radius: 16px !important;
}

.component-item {
    transition: all 0.3s ease;
    border-radius: 12px !important;
}

.component-item:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
}

.component-header {
    border-radius: 12px 12px 0 0;
    transition: background-color 0.3s ease;
}

.drag-handle {
    cursor: move;
}

.ghost-component {
    opacity: 0.5;
    background: rgb(var(--v-theme-primary-lighten-4));
}

.content-editor-wrapper {
    min-height: 200px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 8px;
    overflow: hidden;
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

/* Dark mode */
.v-theme--dark .bg-grey-lighten-4 {
    background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
}

.v-theme--dark .component-item {
    border-color: rgba(var(--v-theme-on-surface), 0.12);
}

/* Responsive */
@media (max-width: 600px) {
    .component-header {
        flex-wrap: wrap;
        gap: 8px;
    }

    .v-tabs {
        width: 100%;
    }
}
</style>
