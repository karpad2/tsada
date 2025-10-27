<template>
  <div class="content-editor">
    <!-- Editor Header -->
    <div class="editor-header">
      <div class="header-left">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ $t('content_editor') }}
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ $t('drag_components_to_reorder') }}
        </p>
      </div>

      <div class="header-right">
        <!-- Language Selector -->
        <div class="language-selector">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('editing_language') }}:
          </label>
          <select
            v-model="currentEditingLanguage"
            class="ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rs">Srpski</option>
            <option value="en">English</option>
            <option value="hu">Magyar</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <v-btn @click="togglePreview" :color="previewMode ? 'secondary' : 'primary'" class="mr-2">
            <i class="pi pi-eye mr-2"></i>
            {{ previewMode ? $t('edit_mode') : $t('preview_mode') }}
          </v-btn>
          <v-btn @click="saveContent" color="success" :loading="saving">
            <i class="pi pi-save mr-2"></i>
            {{ $t('save') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Component Palette -->
    <div v-if="!previewMode" class="component-palette">
      <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        {{ $t('add_components') }}
      </h3>

      <div class="palette-grid">
        <div
          v-for="componentType in availableComponents"
          :key="componentType.type"
          class="palette-item"
          @click="addComponent(componentType.type)"
        >
          <i :class="componentType.icon" class="text-2xl mb-2"></i>
          <span class="text-sm font-medium">{{ $t(componentType.name) }}</span>
        </div>
      </div>
    </div>

    <!-- Main Editor Area -->
    <div class="editor-main">
      <!-- Preview Mode -->
      <div v-if="previewMode" class="preview-container">
        <ContentRenderer
          :content-id="contentId"
          :content-type="contentType"
          :preview-mode="true"
        />
      </div>

      <!-- Edit Mode -->
      <div v-else class="edit-container">
        <!-- Empty State -->
        <div v-if="components.length === 0" class="empty-state">
          <i class="pi pi-plus-circle text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-600 mb-2">{{ $t('no_components_yet') }}</h3>
          <p class="text-gray-500">{{ $t('add_components_to_start') }}</p>
        </div>

        <!-- Component List (Draggable) -->
        <draggable
          v-else
          v-model="components"
          :options="dragOptions"
          class="components-list"
          @end="onDragEnd"
        >
          <div
            v-for="(component, index) in components"
            :key="component.$id"
            class="component-item"
            :class="{ 'is-editing': editingComponent === component.$id }"
          >
            <!-- Component Header -->
            <div class="component-header">
              <div class="component-info">
                <i :class="getComponentIcon(component.type)" class="mr-2"></i>
                <span class="component-name">{{ getComponentName(component) }}</span>
                <span class="component-type">{{ $t(component.type) }}</span>
              </div>

              <div class="component-actions">
                <!-- Visibility Toggle -->
                <button
                  @click="toggleComponentVisibility(component)"
                  :class="['visibility-btn', { 'invisible': !component.visible }]"
                  :title="component.visible ? $t('hide_component') : $t('show_component')"
                >
                  <i :class="component.visible ? 'pi pi-eye' : 'pi pi-eye-slash'"></i>
                </button>

                <!-- Edit Button -->
                <button
                  @click="editComponent(component)"
                  class="edit-btn"
                  :title="$t('edit_component')"
                >
                  <i class="pi pi-pencil"></i>
                </button>

                <!-- Duplicate Button -->
                <button
                  @click="duplicateComponent(component)"
                  class="duplicate-btn"
                  :title="$t('duplicate_component')"
                >
                  <i class="pi pi-copy"></i>
                </button>

                <!-- Delete Button -->
                <button
                  @click="deleteComponent(component, index)"
                  class="delete-btn"
                  :title="$t('delete_component')"
                >
                  <i class="pi pi-trash"></i>
                </button>

                <!-- Drag Handle -->
                <div class="drag-handle" :title="$t('drag_to_reorder')">
                  <i class="pi pi-bars"></i>
                </div>
              </div>
            </div>

            <!-- Component Editor -->
            <div
              v-if="editingComponent === component.$id"
              class="component-editor"
            >
              <ComponentEditor
                :component="component"
                :language="currentEditingLanguage"
                @update="updateComponent"
                @close="editingComponent = null"
              />
            </div>

            <!-- Component Preview -->
            <div v-else class="component-preview">
              <component
                :is="getComponentBlockName(component.type)"
                :component="component"
                :language="currentEditingLanguage"
              />
            </div>
          </div>
        </draggable>
      </div>
    </div>

    <!-- Quick Add Floating Button -->
    <div v-if="!previewMode" class="quick-add-fab">
      <v-btn
        @click="showQuickAdd = !showQuickAdd"
        color="primary"
        fab
        large
        :class="{ 'rotate-45': showQuickAdd }"
      >
        <i class="pi pi-plus text-xl"></i>
      </v-btn>

      <!-- Quick Add Menu -->
      <div v-if="showQuickAdd" class="quick-add-menu">
        <button
          v-for="componentType in frequentComponents"
          :key="componentType.type"
          @click="addComponent(componentType.type)"
          class="quick-add-item"
        >
          <i :class="componentType.icon"></i>
          <span>{{ $t(componentType.name) }}</span>
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t('confirm_delete') }}</v-card-title>
        <v-card-text>
          {{ $t('delete_component_warning') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn @click="confirmDelete" color="error">{{ $t('delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useLoadingStore } from '@/stores/loading';
import { Databases, ID } from 'appwrite';
import { appw, config } from '@/appwrite';
import type { ContentComponent, ComponentType } from '@/types/contentTypes';
import draggable from 'vuedraggable';

// Import components
import ContentRenderer from './ContentRenderer.vue';
import ComponentEditor from './ComponentEditor.vue';

// Import all block components dynamically
import TextBlock from './blocks/TextBlock.vue';
import HeadingBlock from './blocks/HeadingBlock.vue';
import GalleryBlock from './blocks/GalleryBlock.vue';
import VideoBlock from './blocks/VideoBlock.vue';
import YouTubeBlock from './blocks/YouTubeBlock.vue';

export default defineComponent({
  name: 'ContentEditor',
  components: {
    ContentRenderer,
    ComponentEditor,
    draggable,
    TextBlock,
    HeadingBlock,
    GalleryBlock,
    VideoBlock,
    YouTubeBlock
  },

  props: {
    contentId: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      default: 'document'
    }
  },

  setup(props) {
    const loadingStore = useLoadingStore();

    // Reactive data
    const components = ref<ContentComponent[]>([]);
    const currentEditingLanguage = ref('rs');
    const previewMode = ref(false);
    const editingComponent = ref<string | null>(null);
    const showQuickAdd = ref(false);
    const showDeleteDialog = ref(false);
    const componentToDelete = ref<{ component: ContentComponent; index: number } | null>(null);
    const saving = ref(false);

    // Available component types
    const availableComponents = ref([
      { type: 'text', name: 'text_component', icon: 'pi pi-align-left' },
      { type: 'heading', name: 'heading_component', icon: 'pi pi-heading' },
      { type: 'gallery', name: 'gallery_component', icon: 'pi pi-images' },
      { type: 'image', name: 'image_component', icon: 'pi pi-image' },
      { type: 'video', name: 'video_component', icon: 'pi pi-video' },
      { type: 'youtube', name: 'youtube_component', icon: 'pi pi-youtube' },
      { type: 'form', name: 'form_component', icon: 'pi pi-list' },
      { type: 'button', name: 'button_component', icon: 'pi pi-external-link' },
      { type: 'divider', name: 'divider_component', icon: 'pi pi-minus' },
      { type: 'table', name: 'table_component', icon: 'pi pi-table' },
      { type: 'quote', name: 'quote_component', icon: 'pi pi-comment' },
      { type: 'accordion', name: 'accordion_component', icon: 'pi pi-chevron-down' },
      { type: 'tabs', name: 'tabs_component', icon: 'pi pi-bookmark' }
    ]);

    const frequentComponents = computed(() => [
      { type: 'text', name: 'text_component', icon: 'pi pi-align-left' },
      { type: 'heading', name: 'heading_component', icon: 'pi pi-heading' },
      { type: 'gallery', name: 'gallery_component', icon: 'pi pi-images' },
      { type: 'video', name: 'video_component', icon: 'pi pi-video' }
    ]);

    const dragOptions = computed(() => ({
      animation: 200,
      group: 'components',
      disabled: false,
      ghostClass: 'ghost',
      handle: '.drag-handle'
    }));

    // Methods
    const loadComponents = async () => {
      try {
        const database = new Databases(appw);
        const response = await database.listDocuments(
          config.website_db,
          config.enhanced_text_components,
          [
            // Query.equal("parent_id", props.contentId),
            // Query.equal("parent_type", props.contentType),
            // Query.orderAsc("order")
          ]
        );

        components.value = response.documents as ContentComponent[];
      } catch (error) {
        console.error('Error loading components:', error);
        components.value = [];
      }
    };

    const addComponent = async (type: ComponentType) => {
      try {
        const database = new Databases(appw);

        // Create default content for each language
        const defaultContent = getDefaultContentForType(type);

        const newComponent: Partial<ContentComponent> = {
          type,
          name: `${type}_${Date.now()}`,
          order: components.value.length,
          parent_id: props.contentId,
          parent_type: props.contentType as any,
          content_rs: defaultContent,
          content_en: defaultContent,
          content_hu: defaultContent,
          language_metadata: {
            primary_language: currentEditingLanguage.value as 'rs' | 'en' | 'hu',
            available_languages: [currentEditingLanguage.value as 'rs' | 'en' | 'hu'],
            current_editing_language: currentEditingLanguage.value as 'rs' | 'en' | 'hu',
            translation_status: {
              rs: currentEditingLanguage.value === 'rs' ? 'complete' : 'missing',
              en: currentEditingLanguage.value === 'en' ? 'complete' : 'missing',
              hu: currentEditingLanguage.value === 'hu' ? 'complete' : 'missing'
            }
          },
          settings: getDefaultSettingsForType(type),
          visible: true,
          published: true
        };

        const response = await database.createDocument(
          config.website_db,
          config.enhanced_text_components,
          ID.unique(),
          newComponent
        );

        components.value.push(response as ContentComponent);
        editingComponent.value = response.$id;
        showQuickAdd.value = false;

      } catch (error) {
        console.error('Error adding component:', error);
      }
    };

    const updateComponent = async (componentId: string, updates: Partial<ContentComponent>) => {
      try {
        const database = new Databases(appw);

        // If updating language-specific content, update language metadata
        const component = components.value.find(c => c.$id === componentId);
        if (component && (updates.content_rs || updates.content_en || updates.content_hu)) {
          const updatedLanguageMetadata = {
            ...component.language_metadata,
            current_editing_language: currentEditingLanguage.value as 'rs' | 'en' | 'hu',
            translation_status: {
              ...component.language_metadata.translation_status
            }
          };

          // Update translation status based on content changes
          if (updates.content_rs) {
            updatedLanguageMetadata.translation_status.rs = hasContent(updates.content_rs) ? 'complete' : 'missing';
            if (!updatedLanguageMetadata.available_languages.includes('rs')) {
              updatedLanguageMetadata.available_languages.push('rs');
            }
          }
          if (updates.content_en) {
            updatedLanguageMetadata.translation_status.en = hasContent(updates.content_en) ? 'complete' : 'missing';
            if (!updatedLanguageMetadata.available_languages.includes('en')) {
              updatedLanguageMetadata.available_languages.push('en');
            }
          }
          if (updates.content_hu) {
            updatedLanguageMetadata.translation_status.hu = hasContent(updates.content_hu) ? 'complete' : 'missing';
            if (!updatedLanguageMetadata.available_languages.includes('hu')) {
              updatedLanguageMetadata.available_languages.push('hu');
            }
          }

          updates.language_metadata = updatedLanguageMetadata;
        }

        await database.updateDocument(
          config.website_db,
          config.enhanced_text_components,
          componentId,
          updates
        );

        // Update local state
        const index = components.value.findIndex(c => c.$id === componentId);
        if (index !== -1) {
          components.value[index] = { ...components.value[index], ...updates };
        }

      } catch (error) {
        console.error('Error updating component:', error);
      }
    };

    // Helper function to check if content has meaningful data
    const hasContent = (content: any): boolean => {
      if (!content) return false;
      if (typeof content === 'string') return content.trim().length > 0;
      if (typeof content === 'object') {
        const hasTitle = content.title && content.title.trim().length > 0;
        const hasText = content.text && content.text.trim().length > 0;
        const hasContent = content.content && content.content.trim().length > 0;
        return hasTitle || hasText || hasContent;
      }
      return true; // For other content types, assume it has content
    };

    const deleteComponent = (component: ContentComponent, index: number) => {
      componentToDelete.value = { component, index };
      showDeleteDialog.value = true;
    };

    const confirmDelete = async () => {
      if (!componentToDelete.value) return;

      try {
        const database = new Databases(appw);
        await database.deleteDocument(
          config.website_db,
          config.enhanced_text_components,
          componentToDelete.value.component.$id
        );

        components.value.splice(componentToDelete.value.index, 1);

        // Update order for remaining components
        await updateComponentOrder();

      } catch (error) {
        console.error('Error deleting component:', error);
      } finally {
        showDeleteDialog.value = false;
        componentToDelete.value = null;
      }
    };

    const duplicateComponent = async (component: ContentComponent) => {
      try {
        const database = new Databases(appw);

        const duplicated: Partial<ContentComponent> = {
          ...component,
          name: `${component.name}_copy_${Date.now()}`,
          order: components.value.length
        };

        delete duplicated.$id;
        delete duplicated.created_at;
        delete duplicated.updated_at;

        const response = await database.createDocument(
          config.website_db,
          config.enhanced_text_components,
          ID.unique(),
          duplicated
        );

        components.value.push(response as ContentComponent);

      } catch (error) {
        console.error('Error duplicating component:', error);
      }
    };

    const toggleComponentVisibility = async (component: ContentComponent) => {
      const updates = { visible: !component.visible };
      await updateComponent(component.$id, updates);
    };

    const editComponent = (component: ContentComponent) => {
      editingComponent.value = editingComponent.value === component.$id ? null : component.$id;
    };

    const onDragEnd = async () => {
      await updateComponentOrder();
    };

    const updateComponentOrder = async () => {
      try {
        const database = new Databases(appw);
        const promises = components.value.map((component, index) =>
          database.updateDocument(
            config.website_db,
            config.enhanced_text_components,
            component.$id,
            { order: index }
          )
        );

        await Promise.all(promises);
      } catch (error) {
        console.error('Error updating component order:', error);
      }
    };

    const saveContent = async () => {
      saving.value = true;
      try {
        // Update the main content document to use the new modular system
        const database = new Databases(appw);
        await database.updateDocument(
          config.website_db,
          getCollectionForContentType(props.contentType),
          props.contentId,
          {
            use_legacy_content: false,
            components: components.value.map(c => c.$id)
          }
        );

        // Show success message
        console.log('Content saved successfully!');

      } catch (error) {
        console.error('Error saving content:', error);
      } finally {
        saving.value = false;
      }
    };

    const togglePreview = () => {
      previewMode.value = !previewMode.value;
      editingComponent.value = null;
    };

    // Helper functions
    const getDefaultContentForType = (type: ComponentType) => {
      const defaults: Record<ComponentType, any> = {
        text: { content: '', style: 'paragraph' },
        rich_text: { content: '', style: 'paragraph' },
        heading: { title: 'New Heading', subtitle: '' },
        gallery: { images: [], layout: 'grid', columns: 3, show_captions: true, lightbox: true },
        image: { id: '', caption: '', alt_text: '' },
        video: { autoplay: false, controls: true, muted: false, loop: false },
        youtube: { youtube_url: '', autoplay: false, controls: true, muted: false, loop: false },
        form: { fields: [], submit_action: 'email', submit_target: '', success_message: '', error_message: '' },
        button: { text: 'Button', style: 'primary', size: 'medium', action: 'link' },
        divider: {},
        table: { headers: [], rows: [], sortable: false, searchable: false, pagination: false, responsive: true },
        quote: { content: '', author: '' },
        code: { content: '', language: 'javascript' },
        embed: { code: '' },
        download: { file_id: '', filename: '' },
        accordion: { items: [], allow_multiple: false, style: 'default' },
        tabs: { tabs: [], position: 'top', style: 'default' },
        cards: { cards: [], columns: 3, style: 'default' },
        timeline: { items: [], style: 'default' },
        contact_info: { email: '', phone: '', address: '' },
        map: { latitude: 0, longitude: 0, zoom: 10 },
        social_media: { links: [] },
        newsletter: { action: 'email', target: '' },
        legacy_content: { content: '' }
      };

      return defaults[type] || {};
    };

    const getDefaultSettingsForType = (type: ComponentType) => {
      return {
        layout: 'container',
        alignment: 'left',
        spacing: 'normal',
        animation: 'none'
      };
    };

    const getCollectionForContentType = (type: string): string => {
      switch (type) {
        case 'document':
          return config.documents_db;
        case 'news':
          return config.news_db;
        case 'page':
          return config.pages_db;
        case 'about':
        default:
          return config.about_us_db;
      }
    };

    const getComponentIcon = (type: ComponentType): string => {
      const iconMap: Record<ComponentType, string> = {
        text: 'pi pi-align-left',
        rich_text: 'pi pi-align-left',
        heading: 'pi pi-heading',
        gallery: 'pi pi-images',
        image: 'pi pi-image',
        video: 'pi pi-video',
        youtube: 'pi pi-youtube',
        form: 'pi pi-list',
        button: 'pi pi-external-link',
        divider: 'pi pi-minus',
        table: 'pi pi-table',
        quote: 'pi pi-comment',
        code: 'pi pi-code',
        embed: 'pi pi-globe',
        download: 'pi pi-download',
        accordion: 'pi pi-chevron-down',
        tabs: 'pi pi-bookmark',
        cards: 'pi pi-th-large',
        timeline: 'pi pi-clock',
        contact_info: 'pi pi-phone',
        map: 'pi pi-map',
        social_media: 'pi pi-share-alt',
        newsletter: 'pi pi-envelope',
        legacy_content: 'pi pi-file-text'
      };

      return iconMap[type] || 'pi pi-question';
    };

    const getComponentName = (component: ContentComponent): string => {
      // Try to get a meaningful name from the component content
      const content = component.content_rs || component.content_en || component.content_hu;

      if (content.title) return content.title;
      if (content.text && content.text.length > 0) {
        return content.text.substring(0, 30) + '...';
      }
      if (content.content && content.content.length > 0) {
        const textContent = content.content.replace(/<[^>]*>/g, '');
        return textContent.substring(0, 30) + '...';
      }

      return component.name || `${component.type}_${component.$id.substring(0, 8)}`;
    };

    const getComponentBlockName = (type: ComponentType): string => {
      const nameMap: Record<string, string> = {
        text: 'TextBlock',
        rich_text: 'TextBlock',
        heading: 'HeadingBlock',
        gallery: 'GalleryBlock',
        video: 'VideoBlock',
        youtube: 'YouTubeBlock'
      };

      return nameMap[type] || 'div';
    };

    // Watch for language changes in the loading store
    watch(() => loadingStore.language, (newLang) => {
      currentEditingLanguage.value = newLang;
    });

    // Lifecycle
    onMounted(() => {
      currentEditingLanguage.value = loadingStore.language;
      loadComponents();
    });

    return {
      components,
      currentEditingLanguage,
      previewMode,
      editingComponent,
      showQuickAdd,
      showDeleteDialog,
      saving,
      availableComponents,
      frequentComponents,
      dragOptions,
      addComponent,
      updateComponent,
      deleteComponent,
      confirmDelete,
      duplicateComponent,
      toggleComponentVisibility,
      editComponent,
      onDragEnd,
      saveContent,
      togglePreview,
      getComponentIcon,
      getComponentName,
      getComponentBlockName
    };
  }
});
</script>

<style scoped>
.content-editor {
  @apply h-full flex flex-col;
}

.editor-header {
  @apply flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
}

.header-left {
  @apply flex-1;
}

.header-right {
  @apply flex items-center space-x-4;
}

.language-selector {
  @apply flex items-center text-sm;
}

.action-buttons {
  @apply flex items-center;
}

.component-palette {
  @apply p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800;
}

.palette-grid {
  @apply grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4;
}

.palette-item {
  @apply flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-blue-300 dark:hover:border-blue-600 transition-colors;
}

.editor-main {
  @apply flex-1 overflow-auto;
}

.preview-container {
  @apply p-6;
}

.edit-container {
  @apply p-6;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-20 text-center;
}

.components-list {
  @apply space-y-6;
}

.component-item {
  @apply border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden transition-all;
}

.component-item.is-editing {
  @apply border-blue-500 shadow-lg;
}

.component-header {
  @apply flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600;
}

.component-info {
  @apply flex items-center space-x-2;
}

.component-name {
  @apply font-medium text-gray-800 dark:text-white;
}

.component-type {
  @apply text-sm text-gray-500 dark:text-gray-400 capitalize;
}

.component-actions {
  @apply flex items-center space-x-2;
}

.component-actions button {
  @apply p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}

.visibility-btn.invisible {
  @apply text-gray-400;
}

.edit-btn {
  @apply text-blue-600 hover:text-blue-800;
}

.duplicate-btn {
  @apply text-green-600 hover:text-green-800;
}

.delete-btn {
  @apply text-red-600 hover:text-red-800;
}

.drag-handle {
  @apply cursor-move text-gray-400 hover:text-gray-600;
}

.component-editor {
  @apply p-6 bg-white dark:bg-gray-800;
}

.component-preview {
  @apply p-6 bg-white dark:bg-gray-800;
}

.quick-add-fab {
  @apply fixed bottom-6 right-6 z-10;
}

.quick-add-fab .v-btn {
  @apply transition-transform;
}

.quick-add-fab .rotate-45 {
  @apply transform rotate-45;
}

.quick-add-menu {
  @apply absolute bottom-16 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 space-y-1 min-w-48;
}

.quick-add-item {
  @apply flex items-center space-x-3 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

/* Drag and drop styles */
.ghost {
  @apply opacity-50;
}

.sortable-chosen {
  @apply opacity-75;
}

.sortable-drag {
  @apply opacity-100;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    @apply flex-col space-y-4 items-start;
  }

  .header-right {
    @apply w-full justify-between;
  }

  .palette-grid {
    @apply grid-cols-2 md:grid-cols-4;
  }

  .quick-add-fab {
    @apply bottom-4 right-4;
  }
}
</style>