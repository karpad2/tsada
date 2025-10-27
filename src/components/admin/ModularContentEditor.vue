<template>
  <div class="modular-content-editor">
    <div class="editor-header mb-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">{{ $t('modular_content') }}</h3>

        <!-- Language Settings -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <v-switch
              v-model="languageSettings.serbian"
              density="compact"
              hide-details
            ></v-switch>
            <label class="text-sm">{{ $t('serbian') }}</label>
          </div>
          <div class="flex items-center space-x-2">
            <v-switch
              v-model="languageSettings.hungarian"
              density="compact"
              hide-details
            ></v-switch>
            <label class="text-sm">{{ $t('hungarian') }}</label>
          </div>
          <div class="flex items-center space-x-2">
            <v-switch
              v-model="languageSettings.english"
              density="compact"
              hide-details
            ></v-switch>
            <label class="text-sm">{{ $t('english') }}</label>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <!-- Basic Content -->
        <v-btn @click="addComponent('text')" size="small" color="blue">
          <i class="pi pi-file-edit mr-1"></i>
          {{ $t('text') }}
        </v-btn>
        <v-btn @click="addComponent('heading')" size="small" color="blue">
          <i class="pi pi-heading mr-1"></i>
          {{ $t('heading') }}
        </v-btn>

        <!-- Media -->
        <v-btn @click="addComponent('image')" size="small" color="green">
          <i class="pi pi-image mr-1"></i>
          {{ $t('image') }}
        </v-btn>
        <v-btn @click="addComponent('video')" size="small" color="green">
          <i class="pi pi-video mr-1"></i>
          {{ $t('video') }}
        </v-btn>
        <v-btn @click="addComponent('youtube')" size="small" color="green">
          <i class="pi pi-youtube mr-1"></i>
          {{ $t('youtube_video') }}
        </v-btn>
        <v-btn @click="addComponent('gallery')" size="small" color="green">
          <i class="pi pi-images mr-1"></i>
          {{ $t('gallery') }}
        </v-btn>

        <!-- Documents -->
        <v-btn @click="addComponent('documents')" size="small" color="orange">
          <i class="pi pi-file mr-1"></i>
          {{ $t('documents') }}
        </v-btn>

        <!-- Layout -->
        <v-btn @click="addComponent('divider')" size="small" color="purple">
          <i class="pi pi-minus mr-1"></i>
          {{ $t('divider') }}
        </v-btn>
      </div>
    </div>

    <div class="components-list">
      <div
        v-for="(component, index) in components"
        :key="component.$id"
        class="component-item mb-4 p-4 border border-gray-200 rounded-lg"
      >
        <div class="component-header flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <span class="component-type badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {{ component.type }}
            </span>
            <span class="component-order text-sm text-gray-500">
              Order: {{ component.order }}
            </span>
          </div>
          <div class="component-actions flex gap-1">
            <v-btn @click="moveComponent(index, -1)" :disabled="index === 0" size="small" variant="text">
              <i class="pi pi-arrow-up"></i>
            </v-btn>
            <v-btn @click="moveComponent(index, 1)" :disabled="index === components.length - 1" size="small" variant="text">
              <i class="pi pi-arrow-down"></i>
            </v-btn>
            <v-btn @click="deleteComponent(index)" size="small" variant="text" color="error">
              <i class="pi pi-trash"></i>
            </v-btn>
          </div>
        </div>

        <!-- Text Component Editor -->
        <div v-if="component.type === 'text'" class="component-editor space-y-4">
          <div v-if="languageSettings.serbian" class="mb-4">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {{ $t('content_rs') }}
            </label>
            <ckeditor
              v-model="component.content_rs.content"
              @input="saveComponent(component)"
            />
          </div>
          <div v-if="languageSettings.hungarian" class="mb-4">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {{ $t('content_hu') }}
            </label>
            <ckeditor
              v-model="component.content_hu.content"
              @input="saveComponent(component)"
            />
          </div>
          <div v-if="languageSettings.english" class="mb-4">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {{ $t('content_en') }}
            </label>
            <ckeditor
              v-model="component.content_en.content"
              @input="saveComponent(component)"
            />
          </div>
        </div>

        <!-- Heading Component Editor -->
        <div v-else-if="component.type === 'heading'" class="component-editor">
          <v-text-field
            v-if="languageSettings.serbian"
            v-model="component.content_rs.title"
            :label="$t('heading_rs')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-if="languageSettings.hungarian"
            v-model="component.content_hu.title"
            :label="$t('heading_hu')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-if="languageSettings.english"
            v-model="component.content_en.title"
            :label="$t('heading_en')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-select
            v-model="component.settings.heading_level"
            :items="[1, 2, 3, 4, 5, 6]"
            :label="$t('heading_level')"
            @update:modelValue="saveComponent(component)"
          ></v-select>
        </div>

        <!-- Video Component Editor -->
        <div v-else-if="component.type === 'video'" class="component-editor">
          <v-text-field
            v-model="component.content_rs.video_id"
            :label="$t('video_id')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-switch
            v-model="component.content_rs.autoplay"
            :label="$t('autoplay')"
            @change="saveComponent(component)"
          ></v-switch>
          <v-switch
            v-model="component.content_rs.controls"
            :label="$t('show_controls')"
            @change="saveComponent(component)"
          ></v-switch>
        </div>

        <!-- Image Component Editor -->
        <div v-else-if="component.type === 'image'" class="component-editor">
          <v-text-field
            v-model="component.content_rs.image_id"
            :label="$t('image_id')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-model="component.content_rs.alt_text"
            :label="$t('alt_text')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-model="component.content_rs.caption"
            :label="$t('caption')"
            @change="saveComponent(component)"
          ></v-text-field>
        </div>

        <!-- YouTube Component Editor -->
        <div v-else-if="component.type === 'youtube'" class="component-editor">
          <v-text-field
            v-model="component.content_rs.youtube_url"
            :label="$t('youtube_url')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-if="languageSettings.serbian"
            v-model="component.content_rs.title"
            :label="$t('video_title_rs')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-if="languageSettings.hungarian"
            v-model="component.content_hu.title"
            :label="$t('video_title_hu')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-if="languageSettings.english"
            v-model="component.content_en.title"
            :label="$t('video_title_en')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-switch
            v-model="component.content_rs.autoplay"
            :label="$t('autoplay')"
            @change="syncYouTubeSettingsToAllLanguages(component)"
          ></v-switch>
        </div>

        <!-- Gallery Component Editor -->
        <div v-else-if="component.type === 'gallery'" class="component-editor">
          <v-btn class="mb-4" @click="handleCreateGallery(component)" size="small">
            {{ $t('create_a_new_album') }}
          </v-btn>

          <v-select
            v-model="component.content_rs.gallery_id"
            :items="galleries"
            :label="$t('gallery')"
            item-value="id"
            item-text="title"
            @update:modelValue="syncGalleryIdToAllLanguages(component)"
          ></v-select>

          <v-switch
            v-model="component.content_rs.show_captions"
            :label="$t('show_captions')"
            @change="syncGallerySettingsToAllLanguages(component)"
          ></v-switch>

          <div v-if="component.content_rs.gallery_id && showAlbumViewer(component)" class="mt-4">
            <AlbumViewer :caption="component.content_rs.show_captions" :id="component.content_rs.gallery_id" />
          </div>
        </div>

        <!-- Documents Component Editor -->
        <div v-else-if="component.type === 'documents'" class="component-editor">
          <div class="mb-4">
            <h4 class="text-md font-semibold mb-2">{{ $t('documents') }}</h4>
            <p class="text-sm text-gray-600 mb-3">{{ $t('documents_section_description') }}</p>

            <DocLister :_id="contentId" />
          </div>

          <v-text-field
            v-if="languageSettings.serbian"
            v-model="component.content_rs.title"
            :label="$t('section_title_rs')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-if="languageSettings.hungarian"
            v-model="component.content_hu.title"
            :label="$t('section_title_hu')"
            @change="saveComponent(component)"
          ></v-text-field>
          <v-text-field
            v-if="languageSettings.english"
            v-model="component.content_en.title"
            :label="$t('section_title_en')"
            @change="saveComponent(component)"
          ></v-text-field>
        </div>

        <!-- Divider Component Editor -->
        <div v-else-if="component.type === 'divider'" class="component-editor">
          <v-select
            v-model="component.settings.divider_style"
            :items="['line', 'dashed', 'dotted', 'double', 'thick']"
            :label="$t('divider_style')"
            @update:modelValue="saveComponent(component)"
          ></v-select>
          <v-select
            v-model="component.settings.divider_color"
            :items="['gray', 'blue', 'green', 'red', 'yellow', 'purple']"
            :label="$t('divider_color')"
            @update:modelValue="saveComponent(component)"
          ></v-select>
          <v-slider
            v-model="component.settings.spacing"
            :min="1"
            :max="10"
            :step="1"
            :label="$t('spacing')"
            @update:modelValue="saveComponent(component)"
          ></v-slider>
        </div>





        <!-- Generic fallback for unknown types -->
        <div v-else class="component-editor">
          <p class="text-yellow-600">{{ $t('unknown_component_type') }}: {{ component.type }}</p>
        </div>
      </div>
    </div>

    <div v-if="components.length === 0" class="empty-state text-center py-8 text-gray-500">
      <i class="pi pi-plus-circle text-4xl mb-2"></i>
      <p>{{ $t('no_components_yet') }}</p>
      <p class="text-sm">{{ $t('click_add_component_to_start') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { Databases, ID, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import type { ContentComponent } from '@/types/contentTypes';
import AlbumViewer from '@/components/AlbumViewer.vue';
import DocLister from '@/components/DocLister.vue';
import { convertifserbian } from '@/lang';
import { useLoadingStore } from '@/stores/loading';

export default defineComponent({
  name: 'ModularContentEditor',
  components: {
    AlbumViewer,
    DocLister
  },
  props: {
    contentId: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      default: 'about'
    }
  },
  setup(props) {
    const components = ref<ContentComponent[]>([]);
    const loading = ref(false);
    const galleries = ref<any[]>([]);

    // Language settings - default to Serbian and Hungarian enabled
    const languageSettings = ref({
      serbian: true,
      hungarian: true,
      english: false
    });

    const database = new Databases(appw);

    const loadComponents = async () => {
      try {
        loading.value = true;
        const response = await database.listDocuments(
          config.website_db,
          config.text_components,
          [
            Query.equal("doc_id", props.contentId),
            Query.orderAsc("order")
          ]
        );

        // Group by component_id to combine all languages for each component
        const componentsByComponentId: { [key: string]: any[] } = {};

        response.documents.forEach(doc => {
          const componentId = doc.component_id || doc.$id;
          if (!componentsByComponentId[componentId]) {
            componentsByComponentId[componentId] = [];
          }
          componentsByComponentId[componentId].push(doc);
        });

        // Transform to ContentComponent format
        components.value = Object.keys(componentsByComponentId).map(componentId => {
          const componentDocs = componentsByComponentId[componentId];
          const mainDoc = componentDocs[0];

          // Build content for each language
          const content_rs = componentDocs.find(d => d.lang === 'rs')?.content || componentDocs.find(d => d.lang === 'rs')?.text || '';
          const content_en = componentDocs.find(d => d.lang === 'en')?.content || componentDocs.find(d => d.lang === 'en')?.text || '';
          const content_hu = componentDocs.find(d => d.lang === 'hu')?.content || componentDocs.find(d => d.lang === 'hu')?.text || '';

          return {
            $id: componentId,
            type: mainDoc.type || 'text',
            name: mainDoc.title || `component_${mainDoc.order}`,
            order: mainDoc.order || 0,
            parent_id: mainDoc.doc_id,
            parent_type: props.contentType,
            content_rs: content_rs ? (typeof content_rs === 'string' ? JSON.parse(content_rs) : content_rs) : { content: content_rs },
            content_en: content_en ? (typeof content_en === 'string' ? JSON.parse(content_en) : content_en) : { content: content_en },
            content_hu: content_hu ? (typeof content_hu === 'string' ? JSON.parse(content_hu) : content_hu) : { content: content_hu },
            settings: mainDoc.settings ? JSON.parse(mainDoc.settings) : {},
            visible: mainDoc.visible !== false,
            published: mainDoc.published !== false,
            created_at: mainDoc.$createdAt,
            updated_at: mainDoc.$updatedAt,
            created_by: 'modular_editor'
          } as ContentComponent;
        }).sort((a, b) => a.order - b.order);

      } catch (error) {
        console.error('Error loading components:', error);
      } finally {
        loading.value = false;
      }
    };

    const addComponent = async (type: string) => {
      const newComponent: ContentComponent = {
        $id: ID.unique(),
        type,
        name: `${type}_${Date.now()}`,
        order: components.value.length,
        parent_id: props.contentId,
        parent_type: props.contentType,
        content_rs: getDefaultContent(type),
        content_en: getDefaultContent(type),
        content_hu: getDefaultContent(type),
        language_metadata: {
          primary_language: 'rs',
          available_languages: ['rs', 'en', 'hu'],
          translation_status: {
            rs: 'complete',
            en: 'complete',
            hu: 'complete'
          }
        },
        settings: getDefaultSettings(type),
        visible: true,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'modular_editor'
      };

      components.value.push(newComponent);
      await saveComponent(newComponent);
    };

    const getDefaultContent = (type: string) => {
      switch (type) {
        case 'text':
          return { content: '', style: 'paragraph' };
        case 'heading':
          return { title: '', subtitle: '' };
        case 'image':
          return { image_id: '', alt_text: '', caption: '' };
        case 'video':
          return { video_id: '', autoplay: false, controls: true };
        case 'youtube':
          return { youtube_url: '', title: '', autoplay: false };
        case 'gallery':
          return { gallery_id: '', show_captions: false };
        case 'documents':
          return { title: '', description: '' };
        case 'divider':
          return { style: 'line' };
        default:
          return { content: '' };
      }
    };

    const getDefaultSettings = (type: string) => {
      switch (type) {
        case 'heading':
          return { heading_level: 2, alignment: 'left' };
        case 'image':
          return { alignment: 'center', size: 'medium' };
        case 'video':
          return { aspect_ratio: '16:9', alignment: 'center', show_controls: true };
        case 'youtube':
          return { aspect_ratio: '16:9', alignment: 'center', show_title: true };
        case 'gallery':
          return { show_captions: false, grid_columns: 3, alignment: 'center' };
        case 'documents':
          return { show_description: true, alignment: 'left' };
        case 'divider':
          return {
            divider_style: 'line',
            divider_color: 'gray',
            spacing: 5
          };
        default:
          return { alignment: 'left' };
      }
    };

    const saveComponent = async (component: ContentComponent) => {
      try {
        // Save each language as a separate record
        const languages = ['rs', 'en', 'hu'] as const;

        for (const lang of languages) {
          const langContent = component[`content_${lang}` as keyof ContentComponent];
          const recordId = `${component.$id}_${lang}`;

          const updateData = {
            doc_id: props.contentId,
            component_id: component.$id, // Common ID for all languages
            type: component.type,
            title: component.name,
            text: typeof langContent === 'object' && langContent && 'content' in langContent ? langContent.content : '', // fallback for legacy
            lang: lang,
            order: component.order,
            content: JSON.stringify(langContent),
            settings: JSON.stringify(component.settings),
            visible: component.visible,
            published: component.published
          };

          try {
            await database.updateDocument(
              config.website_db,
              config.text_components,
              recordId,
              updateData
            );
          } catch (error) {
            // If update fails, create new document
            try {
              await database.createDocument(
                config.website_db,
                config.text_components,
                recordId,
                updateData
              );
            } catch (createError) {
              console.error(`Error creating component for ${lang}:`, createError);
            }
          }
        }

      } catch (error) {
        console.error('Error saving component:', error);
      }
    };

    const deleteComponent = async (index: number) => {
      const component = components.value[index];

      try {
        // Delete all language records for this component
        const languages = ['rs', 'en', 'hu'];

        for (const lang of languages) {
          const recordId = `${component.$id}_${lang}`;

          try {
            await database.deleteDocument(
              config.website_db,
              config.text_components,
              recordId
            );
          } catch (error) {
            console.log(`Record ${recordId} not found, skipping`);
          }
        }

        components.value.splice(index, 1);
        await reorderComponents();

      } catch (error) {
        console.error('Error deleting component:', error);
      }
    };

    const moveComponent = async (index: number, direction: number) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= components.value.length) return;

      // Swap components
      const temp = components.value[index];
      components.value[index] = components.value[newIndex];
      components.value[newIndex] = temp;

      await reorderComponents();
    };

    const reorderComponents = async () => {
      // Update order values
      components.value.forEach((component, index) => {
        component.order = index;
      });

      // Save all components with new order
      for (const component of components.value) {
        await saveComponent(component);
      }
    };

    // Gallery methods
    const loadGalleries = async (): Promise<void> => {
      try {
        const result = await database.listDocuments(
          config.website_db,
          config.gallery,
          [
            Query.select(["title_hu", "title_en", "title_rs", "short_en", "short_hu", "short_rs", "$id", "default_image", "visible"]),
            Query.limit(25)
          ]
        )

        const loadingStore = useLoadingStore()
        const local = loadingStore.language

        galleries.value = result.documents.map(element => {
          let title = ""

          switch (local) {
            case "en":
              title = element.title_en
              break
            case "hu":
              title = element.title_hu
              break
            case "rs":
            case "sr":
              title = convertifserbian(element.title_rs)
              break
          }

          return {
            id: element.$id,
            title,
            visible: element.visible
          }
        })

      } catch (error) {
        console.error('Failed to load galleries:', error)
      }
    };

    const handleCreateGallery = async (component: ContentComponent): Promise<void> => {
      try {
        const result = await database.createDocument(
          config.website_db,
          config.gallery,
          ID.unique(),
          {
            visible: false,
            title_rs: `Gallery for ${props.contentId}`,
            title_hu: `Gallery for ${props.contentId}`,
            title_en: `Gallery for ${props.contentId}`
          }
        );

        // Set the gallery ID in the component and save
        component.content_rs.gallery_id = result.$id;
        component.content_en.gallery_id = result.$id;
        component.content_hu.gallery_id = result.$id;
        await saveComponent(component);

        // Reload galleries to show the new one
        await loadGalleries();
      } catch (error) {
        console.error('Failed to create gallery:', error);
      }
    };

    const syncGalleryIdToAllLanguages = async (component: ContentComponent): Promise<void> => {
      const galleryId = component.content_rs.gallery_id;
      component.content_en.gallery_id = galleryId;
      component.content_hu.gallery_id = galleryId;
      await saveComponent(component);
    };

    const syncGallerySettingsToAllLanguages = async (component: ContentComponent): Promise<void> => {
      const showCaptions = component.content_rs.show_captions;
      component.content_en.show_captions = showCaptions;
      component.content_hu.show_captions = showCaptions;
      await saveComponent(component);
    };

    const syncYouTubeSettingsToAllLanguages = async (component: ContentComponent): Promise<void> => {
      const autoplay = component.content_rs.autoplay;
      const youtubeUrl = component.content_rs.youtube_url;
      component.content_en.autoplay = autoplay;
      component.content_hu.autoplay = autoplay;
      component.content_en.youtube_url = youtubeUrl;
      component.content_hu.youtube_url = youtubeUrl;
      await saveComponent(component);
    };

    const showAlbumViewer = (component: ContentComponent): boolean => {
      return !!(component.content_rs.gallery_id);
    };

    onMounted(() => {
      loadComponents();
      loadGalleries();
    });

    return {
      components,
      loading,
      galleries,
      languageSettings,
      addComponent,
      saveComponent,
      deleteComponent,
      moveComponent,
      handleCreateGallery,
      syncGalleryIdToAllLanguages,
      syncGallerySettingsToAllLanguages,
      syncYouTubeSettingsToAllLanguages,
      showAlbumViewer
    };
  }
});
</script>

<style scoped>
.modular-content-editor {
  @apply w-full;
}

.component-item {
  @apply transition-all duration-200 hover:shadow-md;
}

.component-item:hover {
  @apply border-blue-300;
}

.component-type.badge {
  @apply text-xs font-medium uppercase;
}

.empty-state {
  @apply border-2 border-dashed border-gray-300 rounded-lg;
}

.component-editor .v-field {
  @apply mb-3;
}
</style>