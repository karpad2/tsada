<template>
  <div class="content-editor container px-5 mx-auto bg-white dark:bg-gray-900">
    <!-- Admin Navigation -->
    <nav class="admin-navigation mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
            {{ $t('content_editor') }}
          </h2>
          <div class="flex items-center space-x-2 text-sm">
            <div v-if="hasUnsavedChanges" class="flex items-center text-orange-600 dark:text-orange-400">
              <i class="pi pi-clock mr-1"></i>
              <span>Unsaved changes</span>
            </div>
            <div v-else-if="lastSaved" class="flex items-center text-green-600 dark:text-green-400">
              <i class="pi pi-check mr-1"></i>
              <span>Saved {{ formatRelativeTime(lastSaved) }}</span>
            </div>
            <label class="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                v-model="autoSaveEnabled"
                class="rounded"
              />
              <span class="text-xs">Auto-save</span>
            </label>
          </div>
        </div>
        <div class="flex space-x-3">
          <v-btn
            v-if="contentMode === 'legacy'"
            @click="convertToModular"
            variant="outlined"
            color="primary"
            :loading="isLoading('convert')"
            :disabled="isLoading('convert')"
          >
            <i class="pi pi-arrow-right mr-2" v-if="!isLoading('convert')"></i>
            {{ $t('convert_to_modular') }}
          </v-btn>
          <v-btn
            v-if="contentMode === 'modular'"
            @click="revertToLegacy"
            variant="outlined"
            color="warning"
            :loading="isLoading('revert')"
            :disabled="isLoading('revert')"
          >
            <i class="pi pi-undo mr-2" v-if="!isLoading('revert')"></i>
            {{ $t('revert_to_legacy') }}
          </v-btn>
          <v-btn
            @click="showMigrationPanel = !showMigrationPanel"
            variant="outlined"
            color="secondary"
            :class="{ 'bg-blue-50': showMigrationPanel }"
          >
            <i class="pi pi-cog mr-2"></i>
            {{ $t('migration_panel') }}
          </v-btn>
          <v-btn
            @click="previewContent"
            variant="outlined"
            :loading="isLoading('preview')"
            :disabled="isAnyLoading()"
          >
            <i class="pi pi-eye mr-2" v-if="!isLoading('preview')"></i>
            {{ $t('preview') }}
          </v-btn>
          <v-btn
            @click="showBackupDialog = true; loadBackups()"
            variant="outlined"
            color="info"
            :loading="isLoading('backup')"
            :disabled="isAnyLoading()"
          >
            <i class="pi pi-history mr-2" v-if="!isLoading('backup')"></i>
            Backup
          </v-btn>
        </div>
      </div>
    </nav>

    <!-- Migration Panel -->
    <div v-if="showMigrationPanel" class="migration-panel-container mb-6">
      <ContentMigrationPanel />
    </div>

    <!-- General Controls -->
    <GeneralControlsSection
      :visible="formData.visible"
      :not-news="formData.notNews"
      :show-date-value="formData.show_date"
      :show-not-news="true"
      :show-date="true"
      :show-facebook-share="true"
      :is-loading="isLoading"
      :is-any-loading="isAnyLoading()"
      @save="save"
      @delete="deleteContent"
      @facebook-share="shareFacebook"
      @update:visible="updateField('visible', $event)"
      @update:notNews="updateField('notNews', $event)"
      @update:showDate="updateField('show_date', $event)"
    />

    <!-- File Upload Section -->
    <FileUploadSection
      upload-type="image"
      :multiple="false"
      :auto-upload="true"
      :preview-urls="img ? [img] : []"
      :uploaded-file-ids="default_image ? [default_image] : []"
      :storage-id="config.website_images"
      @files-uploaded="handleFilesUploaded"
    />

    <!-- Content Mode Selection -->
    <section class="content-mode-selection mb-6">
      <v-card>
        <v-card-title>{{ $t('content_mode') }}</v-card-title>
        <v-card-text>
          <v-radio-group v-model="contentMode" @update:modelValue="handleContentModeChange">
            <v-radio
              label="Legacy Content (Simple Text Fields)"
              value="legacy"
            ></v-radio>
            <v-radio
              label="Modular Content (Block-based Editor)"
              value="modular"
            ></v-radio>
          </v-radio-group>
        </v-card-text>
      </v-card>
    </section>

    <!-- Legacy Content Mode -->
    <section v-if="contentMode === 'legacy'" class="legacy-content-section">
      <h3 class="text-lg font-semibold mb-4">{{ $t('legacy_content') }}</h3>

      <!-- Language Sections -->
      <div class="language-sections">
        <LanguageFieldGroup
          language-key="srb"
          :enabled="formData.srb_flag"
          :title-value="formData.title_rs"
          :content-value="formData.content_rs"
          @update:enabled="updateField('srb_flag', $event)"
          @update:title="updateField('title_rs', $event)"
          @update:content="updateField('content_rs', $event)"
          @save="handleFieldChange"
        />

        <LanguageFieldGroup
          language-key="hu"
          :enabled="formData.hun_flag"
          :title-value="formData.title_hu"
          :content-value="formData.content_hu"
          @update:enabled="updateField('hun_flag', $event)"
          @update:title="updateField('title_hu', $event)"
          @update:content="updateField('content_hu', $event)"
          @save="handleFieldChange"
        />

        <LanguageFieldGroup
          language-key="en"
          :enabled="formData.en_flag"
          :title-value="formData.title_en"
          :content-value="formData.content_en"
          @update:enabled="updateField('en_flag', $event)"
          @update:title="updateField('title_en', $event)"
          @update:content="updateField('content_en', $event)"
          @save="handleFieldChange"
        />
      </div>
    </section>

    <!-- Modular Content Mode -->
    <section v-else-if="contentMode === 'modular'" class="modular-content-section">
      <ModularContentEditor
        :content-id="id"
        :content-type="mode"
      />
    </section>

    <!-- Legacy Content Additional Features (only in legacy mode) -->
    <div v-if="contentMode === 'legacy'">
      <!-- YouTube Video -->
      <section class="youtube-section mb-6">
        <v-text-field
          v-model="formData.yt_video"
          :counter="100"
          :label="$t('yt_video')"
          hide-details
          @change="save"
        />
      </section>

      <!-- Documents Section -->
      <section class="documents-section mb-6">
        <v-switch
          v-model="formData.documents_flag"
          :label="$t('documents_flag')"
          @change="handleDocumentsToggle"
        />
        <div v-if="formData.documents_flag" class="mt-4">
          <DocLister :_id="id" />
        </div>
      </section>

      <!-- Album Section -->
      <section class="album-section mb-6">
        <v-switch
          v-model="formData.album_flag"
          :label="$t('album_flag')"
          @change="save"
        />
        <div v-if="formData.album_flag" class="mt-4">
          <v-btn class="mb-4" @click="handleCreateGallery">
            {{ $t('create_a_new_album') }}
          </v-btn>

          <v-select
            v-model="formData.gallery_id"
            :items="galleries"
            :label="$t('gallery')"
            item-value="id"
            item-text="title"
            @update:modelValue="handleGalleryChange"
          />

          <div v-if="showAlbumViewer" class="mt-4">
            <AlbumViewer :caption="false" :id="formData.gallery_id" />
          </div>
        </div>
      </section>
    </div>

    <!-- Migration Preview Dialog -->
    <MigrationPreview
      v-model="showMigrationPreview"
      :document-data="currentDocumentData"
      @confirm="convertToModular"
      @cancel="showMigrationPreview = false"
    />

    <!-- Batch Migration Progress Dialog -->
    <BatchMigrationProgress
      v-model="showBatchProgress"
      :total-components="currentDocumentData.text_rs ? 1 : 0 + currentDocumentData.text_en ? 1 : 0 + currentDocumentData.text_hu ? 1 : 0"
      @cancel="showBatchProgress = false"
      @completed="onMigrationCompleted"
    />

    <!-- Backup Management Dialog -->
    <v-dialog v-model="showBackupDialog" max-width="800">
      <v-card>
        <v-card-title>
          <span class="text-h5">Content Backup Management</span>
        </v-card-title>

        <v-card-text>
          <div class="mb-4">
            <v-btn
              @click="createManualBackup"
              color="primary"
              :loading="isLoading('backup')"
              class="mr-2"
            >
              <i class="pi pi-plus mr-2"></i>
              Manuális Backup Létrehozása
            </v-btn>
          </div>

          <v-data-table
            :headers="[
              { title: 'Időpont', key: 'backup_timestamp', width: '200px' },
              { title: 'Típus', key: 'backup_reason', width: '100px' },
              { title: 'Méret', key: 'size', width: '100px' },
              { title: 'Műveletek', key: 'actions', width: '200px', sortable: false }
            ]"
            :items="backups.map(b => ({
              ...b,
              backup_timestamp: new Date(b.backup_timestamp).toLocaleString('hu-HU'),
              size: Math.round(b.backup_metadata?.backup_size / 1024) + ' KB'
            }))"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:item.backup_reason="{ item }">
              <v-chip
                :color="item.backup_reason === 'conversion' ? 'orange' : item.backup_reason === 'manual' ? 'green' : 'blue'"
                small
              >
                {{ item.backup_reason }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                @click="restoreFromBackup(item.$id)"
                color="warning"
                size="small"
                variant="outlined"
                class="mr-1"
                :loading="isLoading('restore')"
              >
                <i class="pi pi-undo mr-1"></i>
                Visszaállítás
              </v-btn>
              <v-btn
                @click="exportBackup(item)"
                color="info"
                size="small"
                variant="outlined"
              >
                <i class="pi pi-download mr-1"></i>
                Export
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showBackupDialog = false">Bezárás</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Client, Databases, ID, Storage, Query } from "appwrite"
import { appw, config } from "@/appwrite"
import axios from "axios"
import { useLoadingStore } from "@/stores/loading"
import AlbumViewer from "@/components/AlbumViewer.vue"
import { convertifserbian } from "@/lang"
import DocLister from "@/components/DocLister.vue"
import { useEditor } from '@/composables/useEditor'
import { ContentBackupService, listContentBackups, exportContentBackup } from '@/utils/contentBackup'
import { LoadingManager } from '@/utils/editorUtils'
import GeneralControlsSection from '@/components/shared/GeneralControlsSection.vue'
import LanguageFieldGroup from '@/components/shared/LanguageFieldGroup.vue'
import FileUploadSection from '@/components/shared/FileUploadSection.vue'
import ModularContentEditor from '@/components/admin/ModularContentEditor.vue'
import ContentMigrationPanel from '@/components/admin/ContentMigrationPanel.vue'
import MigrationPreview from '@/components/admin/MigrationPreview.vue'
import BatchMigrationProgress from '@/components/admin/BatchMigrationProgress.vue'

interface FormData {
  title_en: string
  title_hu: string
  title_rs: string
  content_rs: string
  content_hu: string
  content_en: string
  yt_video: string
  show_date: boolean
  srb_flag: boolean
  hun_flag: boolean
  en_flag: boolean
  visible: boolean
  documents_flag: boolean
  album_flag: boolean
  gallery_id: string
  notNews: boolean
}

export default defineComponent({
  name: 'ContentEditor',
  components: {
    AlbumViewer,
    DocLister,
    GeneralControlsSection,
    LanguageFieldGroup,
    FileUploadSection,
    ModularContentEditor,
    ContentMigrationPanel,
    MigrationPreview,
    BatchMigrationProgress
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loadingManager = new LoadingManager()

    // Reactive state
    const id = ref<string>(route.params.id as string)
    const mode = ref<string>(route.params.mode as string)
    const file_link = ref(null)
    const img = ref<string>("https://dummyimage.com/720x400")
    const galleries = ref([])
    const default_image = ref<string>("")
    const uploading = ref<boolean>(false)
    const _update = ref<boolean>(true)
    const contentMode = ref<string>('legacy') // 'legacy' or 'modular'
    const showMigrationPanel = ref<boolean>(false)
    const showMigrationPreview = ref<boolean>(false)
    const showBatchProgress = ref<boolean>(false)
    const autoSaveEnabled = ref<boolean>(true)
    const lastSaved = ref<Date | null>(null)
    const hasUnsavedChanges = ref<boolean>(false)
    let autoSaveTimeout: NodeJS.Timeout | null = null

    const formData = reactive<FormData>({
      title_en: "",
      title_hu: "",
      title_rs: "",
      content_rs: "",
      content_hu: "",
      content_en: "",
      yt_video: "",
      show_date: false,
      srb_flag: true,
      hun_flag: true,
      en_flag: false,
      visible: false,
      documents_flag: false,
      album_flag: false,
      gallery_id: "",
      notNews: false
    })

    // Loading helpers
    const isLoading = (key: string) => loadingManager.isLoading(key)
    const isAnyLoading = () => loadingManager.isAnyLoading()

    // Field update helper
    const updateField = (field: string, value: any) => {
      (formData as any)[field] = value
    }

    const handleFieldChange = async () => {
      await save()
    }

    const handleContentModeChange = async (mode: string) => {
      contentMode.value = mode
      // Optionally save the content mode preference
      // Could be saved to localStorage or as a document field
    }

    const showAlbumViewer = computed(() => _update.value && formData.gallery_id)

    const currentDocumentData = computed(() => ({
      $id: id.value,
      title_rs: formData.title_rs,
      title_en: formData.title_en,
      title_hu: formData.title_hu,
      text_rs: formData.content_rs,
      text_en: formData.content_en,
      text_hu: formData.content_hu,
      yt_video: formData.yt_video ? [formData.yt_video] : [],
      has_gallery: formData.album_flag,
      gallery: formData.gallery_id,
      has_documents: formData.documents_flag,
      video: null
    }))

    // Database instances
    const database = new Databases(appw)
    const storage = new Storage(appw)

    // Helper function to get collection based on mode
    const getCollectionForMode = (mode: string): string => {
      switch (mode) {
        case 'document':
          return config.documents_db;
        case 'news':
          return config.news_db;
        case 'courses':
          return config.courselist;
        case 'about':
        default:
          return config.about_us_db;
      }
    }

    // Methods
    const loadContent = async (): Promise<void> => {
      try {
        console.log(`Loading content - mode: ${mode.value}, id: ${id.value}, collection: ${getCollectionForMode(mode.value)}`)
        const document = await database.getDocument(
          config.website_db,
          getCollectionForMode(mode.value),
          id.value
        )
        
        // Map document data to form
        Object.assign(formData, {
          title_rs: document.title_rs || "",
          content_rs: document.text_rs || "",
          title_hu: document.title_hu || "",
          content_hu: document.text_hu || "",
          title_en: document.title_en || "",
          content_en: document.text_en || "",
          yt_video: document.yt_video || "",
          visible: document.visible || false,
          notNews: document.notNews || false,
          show_date: document.show_date || false,
          documents_flag: document.has_documents || false,
          album_flag: document.has_gallery || false,
          gallery_id: document.gallery?.$id || ""
        })

        // Determine content mode based on use_legacy_content field
        if (document.use_legacy_content === false) {
          contentMode.value = 'modular'
        } else {
          contentMode.value = 'legacy'
        }
        
        // Set image
        if (document.default_image) {
          default_image.value = document.default_image
          img.value = storage.getFileView(config.website_images, document.default_image).toString()
        }
        
      } catch (error) {
        console.error('Failed to load content:', error)
      }
    }

    const save = async (isAutoSave: boolean = false): Promise<void> => {
      try {
        if (!isAutoSave) {
          loadingManager.setLoading('save', true)
        }

        console.log('Saving document with default_image:', default_image.value)
        await database.updateDocument(
          config.website_db,
          getCollectionForMode(mode.value),
          id.value,
          {
            title_rs: formData.title_rs,
            title_hu: formData.title_hu,
            title_en: formData.title_en,
            text_en: formData.content_en,
            text_hu: formData.content_hu,
            text_rs: formData.content_rs,
            isHungarian: formData.hun_flag,
            isSerbian: formData.srb_flag,
            isEnglish: formData.en_flag,
            visible: formData.visible,
            yt_video: formData.yt_video,
            has_documents: formData.documents_flag,
            has_gallery: formData.album_flag,
            gallery: formData.gallery_id || null,
            default_image: default_image.value,
            notNews: formData.notNews,
            show_date: formData.show_date
          }
        )

        lastSaved.value = new Date()
        hasUnsavedChanges.value = false
        console.log(`Document ${isAutoSave ? 'auto-' : ''}saved successfully`)

        // Show success notification only for manual saves
        if (!isAutoSave) {
          // this.$notify(this.$t('saved'))
        }

      } catch (error) {
        console.error('Failed to save:', error)
        if (!isAutoSave) {
          // this.$notify({ type: 'error', text: this.$t('save_failed') })
        }
      } finally {
        if (!isAutoSave) {
          loadingManager.setLoading('save', false)
        }
      }
    }

    const triggerAutoSave = () => {
      if (!autoSaveEnabled.value) return

      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }

      hasUnsavedChanges.value = true

      autoSaveTimeout = setTimeout(() => {
        save(true)
      }, 3000) // Auto-save after 3 seconds of inactivity
    }

    const deleteContent = async (): Promise<void> => {
      try {
        await database.deleteDocument(config.website_db, getCollectionForMode(mode.value), id.value)
        // this.$notify(this.$t('deleted'))
        router.push("/home")
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }

    const shareFacebook = async (): Promise<void> => {
      try {
        const settings = await database.getDocument(config.website_db, config.users_settings, "fb_access_token")
        const shareUrl = `https://share.tsada.edu.rs/${id.value}`
        
        const response = await axios.post(
          `https://graph.facebook.com/v20.0/${config.pan}/feed`,
          {
            message: null,
            link: shareUrl,
            access_token: settings.parameter,
            published: true
          }
        )
        
        console.log('Facebook share response:', response)
      } catch (error) {
        console.error('Failed to share on Facebook:', error)
      }
    }

    const handleFilesUploaded = async (uploadedFiles: any[]): Promise<void> => {
      console.log('Files uploaded:', uploadedFiles)
      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0]
        console.log('Setting default_image to:', file.$id)
        default_image.value = file.$id
        img.value = storage.getFileView(config.website_images, file.$id).toString()
        await save()
      }
    }

    const handleFileUpload = async (): Promise<void> => {
      if (!file_link.value) {
        console.warn("No file selected")
        return
      }

      try {
        uploading.value = true

        const result = await storage.createFile(
          config.website_images,
          ID.unique(),
          file_link.value
        )

        default_image.value = result.$id
        img.value = storage.getFileView(config.website_images, result.$id).toString()

        await save()
        // this.$notify(this.$t('file_uploaded'))

      } catch (error) {
        console.error('Failed to upload file:', error)
      } finally {
        uploading.value = false
      }
    }

    const handleDocumentsToggle = (): void => {
      save()
      // Additional document synchronization logic if needed
    }

    const handleCreateGallery = async (): Promise<void> => {
      if (!formData.gallery_id) {
        formData.gallery_id = await createNewGallery()
      }
      await save()
    }

    const handleGalleryChange = async (): Promise<void> => {
      _update.value = false
      await save()
      _update.value = true
    }

    const createNewGallery = async (): Promise<string> => {
      try {
        const result = await database.createDocument(
          config.website_db,
          config.gallery,
          ID.unique(),
          {
            visible: false,
            title_rs: formData.title_rs,
            title_hu: formData.title_hu,
            title_en: formData.title_en
          }
        )
        return result.$id
      } catch (error) {
        console.error('Failed to create gallery:', error)
        return ""
      }
    }

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
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (uploading.value || hasUnsavedChanges.value) {
        event.preventDefault()
        // this.$notify({ type: 'error', text: this.$t('file_still_uploading') })
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    const formatRelativeTime = (date: Date): string => {
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor(diff / 1000)

      if (minutes > 60) {
        const hours = Math.floor(minutes / 60)
        return `${hours}h ago`
      } else if (minutes > 0) {
        return `${minutes}m ago`
      } else {
        return `${seconds}s ago`
      }
    }

    const processComponentsInBatches = async (components: any[]) => {
      const BATCH_SIZE = 5
      const batches = []

      // Split components into batches
      for (let i = 0; i < components.length; i += BATCH_SIZE) {
        batches.push(components.slice(i, i + BATCH_SIZE))
      }

      const progressMethods = (window as any).batchMigrationProgressMethods
      let totalCompleted = 0
      const errors: any[] = []

      try {
        const { Databases } = await import('appwrite')
        const { appw, config } = await import('@/appwrite')
        const database = new Databases(appw)

        // Update progress with initial state
        progressMethods?.updateProgress({
          totalBatches: batches.length,
          currentOperation: {
            name: 'Processing components',
            description: `Processing ${components.length} components in ${batches.length} batches`,
            status: 'processing'
          }
        })

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex]

          // Update current batch info
          const batchItems = batch.map((component, index) => ({
            type: component.type,
            status: 'pending' as const,
            $id: component.$id
          }))

          progressMethods?.updateProgress({
            currentBatch: {
              index: batchIndex,
              components: batchItems
            }
          })

          // Process each component in current batch
          for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
            const component = batch[itemIndex]

            // Mark as processing
            batchItems[itemIndex].status = 'processing'
            progressMethods?.updateProgress({
              currentBatch: { components: batchItems }
            })

            try {
              const cleanComponent = {
                type: component.type || 'text',
                order: component.order || 0,
                parent_id: component.parent_id || id.value,
                parent_type: component.parent_type || 'document',
                content_rs: JSON.stringify(component.content_rs || {}),
                content_en: JSON.stringify(component.content_en || {}),
                content_hu: JSON.stringify(component.content_hu || {}),
                language_metadata: JSON.stringify(component.language_metadata || {
                  primary_language: 'rs',
                  available_languages: ['rs'],
                  translation_status: { rs: 'complete', en: 'missing', hu: 'missing' }
                }),
                settings: JSON.stringify(component.settings || {}),
                visible: component.visible !== false,
                published: component.published !== false,
                created_by: component.created_by || 'migration_system'
              }

              await database.createDocument(
                config.website_db,
                config.text_components,
                ID.unique(),
                cleanComponent
              )

              // Mark as completed
              batchItems[itemIndex].status = 'completed'
              totalCompleted++

            } catch (error) {
              console.error(`Failed to create component ${component.$id}:`, error)
              batchItems[itemIndex].status = 'error'
              errors.push({
                component: component.$id,
                message: error.message || 'Unknown error'
              })
            }

            // Update progress
            progressMethods?.updateProgress({
              completedItems: totalCompleted,
              currentBatch: { components: batchItems },
              errors
            })

            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        // Final update
        progressMethods?.updateProgress({
          currentOperation: {
            name: 'Migration completed',
            description: `Processed ${totalCompleted} components successfully`,
            status: 'completed'
          }
        })

        return { successCount: totalCompleted, errors }

      } catch (error) {
        console.error('Batch processing failed:', error)
        progressMethods?.updateProgress({
          currentOperation: {
            name: 'Migration failed',
            description: error.message || 'Unknown error occurred',
            status: 'error'
          }
        })
        throw error
      }
    }

    const onMigrationCompleted = async (result: any) => {
      try {
        // Update document to use modular content
        await database.updateDocument(
          config.website_db,
          getCollectionForMode(mode.value),
          id.value,
          {
            use_legacy_content: false
          }
        )

        // Switch to modular mode
        contentMode.value = 'modular'

        // Clear legacy text fields
        formData.content_rs = ''
        formData.content_en = ''
        formData.content_hu = ''

        const message = result.errors.length > 0
          ? `Részben sikeres migráció! ${result.totalProcessed} komponens létrehozva. ${result.errors.length} hiba történt.`
          : `Sikeresen átváltva moduláris módra! ${result.totalProcessed} komponens létrehozva.`

        alert(message)
        showBatchProgress.value = false

      } catch (error) {
        console.error('Failed to finalize migration:', error)
        alert(`Hiba történt a migráció befejezésekor: ${error.message || error}`)
      } finally {
        loadingManager.setLoading('convert', false)
      }
    }

    const previewContent = (): void => {
      // Use the universal renderer route that handles all content types
      const previewUrl = `/renderer/${mode.value}/${id.value}`

      console.log(`Opening preview URL: ${previewUrl}`)
      window.open(previewUrl, '_blank')
    }

    const showMigrationPreviewDialog = () => {
      showMigrationPreview.value = true
    }

    // Backup functions
    const createContentBackup = async () => {
      try {
        const currentDocument = await database.getDocument(
          config.website_db,
          getCollectionForMode(mode.value),
          id.value
        )

        await ContentBackupService.createAutoBackup(
          id.value,
          mode.value,
          currentDocument,
          'conversion'
        )

        console.log('Backup created successfully before conversion')
      } catch (error) {
        console.warn('Failed to create backup, continuing with conversion:', error)
        // Don't fail the conversion if backup fails
      }
    }

    const backups = ref([])
    const showBackupDialog = ref(false)

    const loadBackups = async () => {
      try {
        backups.value = await listContentBackups(id.value)
      } catch (error) {
        console.error('Failed to load backups:', error)
      }
    }

    const restoreFromBackup = async (backupId: string) => {
      if (!confirm('Biztosan vissza szeretnéd állítani a tartalmat erről a backup-ról? Ez felülírja a jelenlegi tartalmat!')) {
        return
      }

      try {
        loadingManager.setLoading('restore', true)
        await ContentBackupService.restoreFromBackup(
          backupId,
          id.value,
          getCollectionForMode(mode.value)
        )

        // Reload content after restore
        await loadContent()
        alert('Tartalom sikeresen visszaállítva!')
      } catch (error) {
        console.error('Restore failed:', error)
        alert(`Hiba a visszaállítás során: ${error.message || error}`)
      } finally {
        loadingManager.setLoading('restore', false)
      }
    }

    const exportBackup = (backup: any) => {
      exportContentBackup(backup)
    }

    const createManualBackup = async () => {
      try {
        loadingManager.setLoading('backup', true)
        const currentDocument = await database.getDocument(
          config.website_db,
          getCollectionForMode(mode.value),
          id.value
        )

        await ContentBackupService.createBackup(
          id.value,
          mode.value,
          currentDocument,
          'manual',
          'user'
        )

        await loadBackups()
        alert('Manuális backup sikeresen létrehozva!')
      } catch (error) {
        console.error('Manual backup failed:', error)
        alert(`Hiba a backup létrehozása során: ${error.message || error}`)
      } finally {
        loadingManager.setLoading('backup', false)
      }
    }

    const convertToModular = async (previewData?: any): Promise<void> => {
      // If no preview data, show preview first
      if (!previewData) {
        showMigrationPreviewDialog()
        return
      }

      try {
        loadingManager.setLoading('convert', true)

        // Create backup before conversion
        await createContentBackup()

        // Use components from preview data if available
        const components = previewData?.components || []

        console.log('Preview data:', previewData)
        console.log('Components found:', components)
        console.log('Components length:', components?.length)

        if (components && components.length > 0) {
          // Show batch progress dialog
          showBatchProgress.value = true

          // Process components in batches
          await processComponentsInBatches(components)
        } else {
          // No components to process, just update document
          await onMigrationCompleted({ totalProcessed: 0, errors: [] })
        }
      } catch (error) {
        console.error('Conversion failed:', error)
        alert(`Hiba történt az átalakítás során: ${error.message || error}`)
      } finally {
        loadingManager.setLoading('convert', false)
      }
    }

    const revertToLegacy = async (): Promise<void> => {
      if (!confirm('Biztosan vissza szeretnéd váltani legacy módra? Ez törli az összes moduláris komponenst!')) {
        return
      }

      try {
        loadingManager.setLoading('revert', true)

        const { Databases } = await import('appwrite')
        const { appw, config } = await import('@/appwrite')
        const database = new Databases(appw)

        // Update document to use legacy content
        await database.updateDocument(
          config.website_db,
          getCollectionForMode(mode.value),
          id.value,
          {
            use_legacy_content: true,
            componentCount: 0
          }
        )

        // Switch to legacy mode
        contentMode.value = 'legacy'

        alert('Sikeresen visszaváltva legacy módra!')

        // Reload content
        await loadContent()
      } catch (error) {
        console.error('Revert failed:', error)
        alert(`Hiba történt a visszaváltás során: ${error.message || error}`)
      } finally {
        loadingManager.setLoading('revert', false)
      }
    }

    // Watch for changes in form data to trigger auto-save
    watch([
      () => formData.title_rs,
      () => formData.title_en,
      () => formData.title_hu,
      () => formData.content_rs,
      () => formData.content_en,
      () => formData.content_hu,
      () => formData.yt_video,
      () => formData.visible,
      () => formData.notNews,
      () => formData.show_date,
      () => formData.documents_flag,
      () => formData.album_flag,
      () => formData.gallery_id
    ], () => {
      triggerAutoSave()
    }, { deep: true })

    // Keyboard shortcuts
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            save(false)
            break
          case 'p':
            event.preventDefault()
            previewContent()
            break
          case 'z':
            if (event.shiftKey) {
              event.preventDefault()
              // Redo functionality could be added here
            } else {
              event.preventDefault()
              // Undo functionality could be added here
            }
            break
        }
      }
    }

    // Lifecycle hooks
    onMounted(() => {
      loadContent()
      loadGalleries()
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('keydown', handleKeydown)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeydown)
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    })

    return {
      // State
      id,
      mode,
      file_link,
      img,
      galleries,
      formData,
      uploading,
      showAlbumViewer,
      default_image,
      contentMode,
      showMigrationPanel,
      showMigrationPreview,
      showBatchProgress,
      currentDocumentData,
      autoSaveEnabled,
      lastSaved,
      hasUnsavedChanges,

      // Loading helpers
      isLoading,
      isAnyLoading,
      updateField,
      handleFieldChange,
      handleContentModeChange,

      // Methods
      save,
      deleteContent,
      shareFacebook,
      handleFileUpload,
      handleFilesUploaded,
      handleDocumentsToggle,
      handleCreateGallery,
      handleGalleryChange,
      previewContent,
      convertToModular,
      revertToLegacy,
      formatRelativeTime,

      // Backup functions
      backups,
      showBackupDialog,
      loadBackups,
      restoreFromBackup,
      exportBackup,
      createManualBackup,

      // Config
      config
    }
  }
})
</script>

<style scoped>
.content-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.language-sections {
  @apply border-b border-gray-200 dark:border-gray-600 pb-4;
}

.language-section {
  @apply border border-gray-200 dark:border-gray-600 rounded-lg p-4;
}

.language-content {
  @apply space-y-4;
}

.action-buttons {
  @apply flex-wrap;
}

.preview-section {
  @apply mt-4;
}

.image-section,
.youtube-section,
.documents-section,
.album-section {
  @apply border border-gray-200 dark:border-gray-600 rounded-lg p-4;
}

/* Dark mode for Vuetify components */
.dark :deep(.v-card) {
  background-color: rgb(55 65 81) !important;
  color: rgb(243 244 246) !important;
}

.dark :deep(.v-card-title) {
  color: rgb(243 244 246) !important;
}

.dark :deep(.v-radio-group) {
  color: rgb(243 244 246) !important;
}

.dark :deep(.v-label) {
  color: rgb(203 213 225) !important;
}

.dark :deep(.v-switch .v-label) {
  color: rgb(203 213 225) !important;
}

.dark :deep(.v-select .v-field) {
  background-color: rgb(71 85 105) !important;
  border-color: rgb(100 116 139) !important;
}

.dark :deep(.v-text-field .v-field) {
  background-color: rgb(71 85 105) !important;
  border-color: rgb(100 116 139) !important;
}

.dark :deep(.v-text-field .v-field__input) {
  color: rgb(248 250 252) !important;
}
</style>