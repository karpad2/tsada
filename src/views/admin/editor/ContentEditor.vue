<template>
  <div class="content-editor admin-panel container px-5 mx-auto">
    <div class="page-header mb-2">
      <h1 class="section-title !text-2xl sm:!text-3xl !mb-1">{{ $t('content_editor') || 'Content Editor' }}</h1>
      <div class="section-accent !w-20"></div>
    </div>

    <!-- General Controls -->
    <GeneralControlsSection
      :visible="formData.visible"
      :pinned="formData.pinned"
      :not-news="formData.notNews"
      :show-date-value="formData.show_date"
      :show-pinned="true"
      :show-not-news="true"
      :show-date="true"
      :show-facebook-share="true"
      :is-loading="isLoading"
      :is-any-loading="isAnyLoading()"
      @save="save"
      @delete="deleteContent"
      @facebook-share="shareFacebook"
      @update:visible="updateField('visible', $event)"
      @update:pinned="updateField('pinned', $event)"
      @update:notNews="updateField('notNews', $event)"
      @update:showDate="updateField('show_date', $event)"
    >
      <template #custom-switches>
        <v-switch
          v-model="formData.eu_funding_enabled"
          :label="$t('eu_funding_enabled')"
          color="primary"
          density="compact"
          hide-details
          @change="save"
        />
      </template>
    </GeneralControlsSection>

    <section class="editor-section mb-4">
      <div class="editor-section-title">
        <span class="section-icon"><v-icon size="small" color="white">mdi-calendar-clock</v-icon></span>
        {{ $t('news_schedule') }}
      </div>
      <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm font-medium">{{ $t('news_publish_from') }}</span>
          <input v-model="formData.publish_from" type="datetime-local" class="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700" @change="saveSchedule" />
        </label>
        <label class="block">
          <span class="text-sm font-medium">{{ $t('news_publish_until') }}</span>
          <input v-model="formData.publish_until" type="datetime-local" class="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700" @change="saveSchedule" />
        </label>
        <p class="md:col-span-2 text-xs text-gray-500">{{ $t('news_schedule_help') }}</p>
      </div>
    </section>

    <!-- File Upload Section -->
    <section class="editor-section image-section relative">
      <div class="editor-section-title">
        <span class="section-icon"><v-icon size="small" color="white">mdi-image</v-icon></span>
        {{ $t('file_upload') }}
      </div>
      <FileUploadSection
        upload-type="image"
        :multiple="false"
        :auto-upload="true"
        :preview-urls="img ? [img] : []"
        :uploaded-file-ids="default_image ? [default_image] : []"
        :storage-id="config.website_images"
        @files-uploaded="handleFilesUploaded"
      />

      <!-- Draggable crop box picker -->
      <div v-if="default_image" class="mt-4">
        <p class="text-caption text-medium-emphasis mb-2">{{ $t('image_position_hint') }}</p>
        <div
          class="position-picker editor-position-picker"
          ref="positionPickerRef"
        >
          <img :src="img" class="position-picker-img" draggable="false" />
          <div
            class="crop-box"
            :style="{
              left: cropBoxLeft + '%',
              top: cropBoxTop + '%',
              width: cropBoxSizePercent.w + '%',
              height: cropBoxSizePercent.h + '%'
            }"
            @mousedown="startDrag"
            @touchstart="startDrag"
          >
            <div class="crop-box-inner"></div>
          </div>
        </div>

        <!-- Élő preview, ahogy a kártyán / listázásban meg fog jelenni -->
        <div class="mt-3 d-flex align-center" style="gap: 16px; flex-wrap: wrap;">
          <div>
            <span class="text-caption text-medium-emphasis d-block mb-1">{{ $t('preview_as_thumbnail') }}</span>
            <div
              class="thumb-preview editor-thumb-preview thumb-preview--card"
              :style="{
                backgroundImage: `url(${img})`,
                backgroundPosition: `${formData.image_position_x}% ${formData.image_position_y}%`
              }"
            ></div>
          </div>
          <div>
            <span class="text-caption text-medium-emphasis d-block mb-1">{{ $t('preview_as_square') }}</span>
            <div
              class="thumb-preview editor-thumb-preview thumb-preview--square"
              :style="{
                backgroundImage: `url(${img})`,
                backgroundPosition: `${formData.image_position_x}% ${formData.image_position_y}%`
              }"
            ></div>
          </div>

          <v-btn
            size="small"
            variant="outlined"
            color="primary"
            class="ml-auto"
            :disabled="formData.image_position_x === 50 && formData.image_position_y === 50"
            @click="resetFocalPoint"
          >
            <v-icon left size="small">mdi-restore</v-icon>
            {{ $t('reset_position') }}
          </v-btn>
        </div>
      </div>
    </section>

    <!-- Language Sections -->
    <section class="editor-section language-sections">
      <div class="editor-section-title">
        <span class="section-icon"><v-icon size="small" color="white">mdi-translate</v-icon></span>
        {{ $t('multilingual_content') || $t('multilanguage_content') || 'Languages' }}
      </div>
      <!-- Language Section Header with AI Translate -->
      <v-card  v-if="false" class="mb-4" elevation="2">
        <v-card-title  class="d-flex align-center bg-gradient-primary">
          <v-icon left color="white">mdi-translate</v-icon>
          <span class="text-white">{{ $t('multilingual_content') }}</span>
          <v-spacer></v-spacer>

          <!-- AI Translate Button -->
          <v-btn
            v-if="hasAnyContent"
            @click="showTranslateDialog = true"
            color="white"
            variant="tonal"
            size="small"
            class="mr-2"
          >
            <v-icon left size="small">mdi-robot</v-icon>
            {{ $t('auto_translate') }}
          </v-btn>

          <!-- Progress indicator -->
          <v-chip small :color="completedLanguages === 3 ? 'success' : 'warning'">
            {{ completedLanguages }}/3
          </v-chip>
        </v-card-title>
      </v-card>

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
    </section>

    <!-- YouTube Video -->
    <section class="editor-section youtube-section">
      <div class="editor-section-title">
        <span class="section-icon"><v-icon size="small" color="white">mdi-youtube</v-icon></span>
        {{ $t('yt_video') }}
      </div>
      <v-text-field
        v-model="formData.yt_video"
        :counter="100"
        :label="$t('yt_video')"
        hide-details
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-youtube"
        @change="save"
      />
    </section>

    <!-- Documents Section -->
    <section class="editor-section documents-section">
      <div class="editor-section-title">
        <span class="section-icon"><v-icon size="small" color="white">mdi-file-document</v-icon></span>
        {{ $t('documents_flag') }}
      </div>
      <v-switch
        v-model="formData.documents_flag"
        :label="$t('documents_flag')"
        color="primary"
        hide-details
        @change="handleDocumentsToggle"
      />
      <div v-if="formData.documents_flag" class="mt-4">
        <DocLister :_id="id" />
      </div>
    </section>

    <!-- Album Section -->
    <section class="editor-section album-section">
      <div class="editor-section-title">
        <span class="section-icon"><v-icon size="small" color="white">mdi-image-multiple</v-icon></span>
        {{ $t('album_flag') }}
      </div>
      <v-switch
        v-model="formData.album_flag"
        :label="$t('album_flag')"
        color="primary"
        hide-details
        @change="save"
      />
      <div v-if="formData.album_flag" class="mt-4">
        <v-btn class="mb-4" color="primary" prepend-icon="mdi-plus" @click="handleCreateGallery">
          {{ $t('create_a_new_album') }}
        </v-btn>

        <v-select
          v-model="formData.gallery_id"
          :items="galleries"
          :label="$t('gallery')"
          item-value="id"
          item-text="title"
          variant="outlined"
          density="comfortable"
          @update:modelValue="handleGalleryChange"
        />

        <div v-if="showAlbumViewer" class="mt-4">
          <AlbumViewer :caption="false" :id="formData.gallery_id" />
        </div>
      </div>
    </section>

    <!-- Content Blocks Section -->
    <section class="editor-section content-blocks-section !p-0 overflow-hidden">
      <div class="pa-4 pb-2">
        <div class="editor-section-title !border-0 !pb-0 !mb-2">
          <span class="section-icon"><v-icon size="small" color="white">mdi-view-dashboard-variant</v-icon></span>
          {{ $t('content_blocks') }}
          <v-chip size="x-small" color="info" variant="tonal" class="ml-2">
            {{ $t('advanced') }}
          </v-chip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-3">
          {{ $t('content_blocks_description') }}
        </p>
      </div>
      <div class="px-3 pb-4">
        <ContentBlocksEditor :doc-id="id" @update="onTextComponentsUpdate" />
      </div>
    </section>

    <!-- Content History Section -->
    <section class="editor-section content-history-section">
      <div class="editor-section-title">
        <span class="section-icon"><v-icon size="small" color="white">mdi-history</v-icon></span>
        {{ $t('history') || 'History' }}
      </div>
      <ContentHistoryPanel :content-id="id" @restored="loadContent" />
    </section>

    <!-- AI Translation Dialog -->
    <v-dialog v-model="showTranslateDialog" max-width="600">
      <v-card>
        <v-card-title class="headline primary--text">
          <v-icon left color="primary">mdi-robot</v-icon>
          {{ $t('auto_translate_content') }}
        </v-card-title>

        <v-card-text class="pt-4">
          <div class="text-body-1 mb-4">
            {{ $t('auto_translate_content_description') }}
          </div>

          <!-- Fordítási folyamat -->
          <div v-if="isTranslating" class="translation-progress">
            <v-progress-linear
              :value="translationProgress"
              color="primary"
              height="8"
              rounded
              striped
              class="mb-3"
            ></v-progress-linear>
            <div class="text-center">
              <v-icon color="primary" class="rotating">mdi-robot</v-icon>
              <p class="caption mt-2">{{ $t('translating_content') }}...</p>
            </div>
          </div>

          <!-- Információ -->
          <v-alert v-else type="info" dense outlined class="mb-0">
            <div class="d-flex align-start">
              <v-icon color="info" class="mr-2">mdi-information</v-icon>
              <div>
                <div class="font-weight-bold mb-1">{{ $t('how_it_works') }}</div>
                <ul class="caption mb-0 pl-4">
                  <li>{{ $t('ai_detects_source_content') }}</li>
                  <li>{{ $t('translates_titles_and_content') }}</li>
                  <li>{{ $t('uses_free_ai_services') }}</li>
                </ul>
              </div>
            </div>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTranslateDialog = false" :disabled="isTranslating">
            {{ $t('cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="autoTranslateContent"
            :loading="isTranslating"
            :disabled="isTranslating"
          >
            <v-icon left>mdi-robot</v-icon>
            {{ $t('start_translation') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import { useRoute, useRouter } from 'vue-router'
import { Databases, ID, Storage, Query } from "appwrite"
import { appw, config } from "@/appwrite"
import { loadNewsSchedule, setNewsSchedule } from '@/services/content/newsSchedule'
import axios from "axios"
import { useLoadingStore } from "@/stores/loading"
import AlbumViewer from "@/components/AlbumViewer.vue"
import { convertifserbian } from "@/lang"
import DocLister from "@/components/DocLister.vue"
import { useEditor } from '@/composables/useEditor'
import { LoadingManager } from '@/utils/editorUtils'
import GeneralControlsSection from '@/components/shared/GeneralControlsSection.vue'
import LanguageFieldGroup from '@/components/shared/LanguageFieldGroup.vue'
import FileUploadSection from '@/components/shared/FileUploadSection.vue'
import ContentBlocksEditor from '@/components/shared/ContentBlocksEditor.vue'
import ContentHistoryPanel from '@/components/shared/ContentHistoryPanel.vue'
import { useTranslation } from '@/composables/useTranslation'
import { useI18n } from 'vue-i18n'
import { ContentBackupService } from '@/services/ContentBackupService'

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
  pinned: boolean
  sort_order: number
  eu_funding_enabled: boolean
  image_position_x: number
  image_position_y: number
  publish_from: string
  publish_until: string
}

export default defineComponent({
  name: 'ContentEditor',
  components: {
    AlbumViewer,
    DocLister,
    GeneralControlsSection,
    LanguageFieldGroup,
    FileUploadSection,
    ContentBlocksEditor,
    ContentHistoryPanel
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loadingManager = new LoadingManager()
    const { t } = useI18n()
    const translationComposable = useTranslation()

    // Reactive state
    const id = ref<string>(route.params.id as string)
    const file_link = ref(null)
    const img = ref<string>("https://dummyimage.com/720x400")
    const galleries = ref([])
    const default_image = ref<string>("")
    const uploading = ref<boolean>(false)
    const _update = ref<boolean>(true)

    // Translation state
    const showTranslateDialog = ref(false)
    const isTranslating = ref(false)
    const translationProgress = ref(0)

    // Focal point / crop position picker
    const positionPickerRef = ref<HTMLElement | null>(null)

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
      notNews: false,
      pinned: false,
      sort_order: 0,
      eu_funding_enabled: false,
      publish_from: "",
      publish_until: "",
      image_position_x: 50,
      image_position_y: 50
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

    const showAlbumViewer = computed(() => _update.value && formData.gallery_id)

    // Computed properties for translation
    const hasAnyContent = computed(() => {
      return (
        formData.title_rs.trim().length > 0 ||
        formData.title_hu.trim().length > 0 ||
        formData.title_en.trim().length > 0 ||
        formData.content_rs.trim().length > 0 ||
        formData.content_hu.trim().length > 0 ||
        formData.content_en.trim().length > 0
      )
    })

    const completedLanguages = computed(() => {
      let count = 0
      if (formData.title_rs.trim() && formData.content_rs.trim()) count++
      if (formData.title_hu.trim() && formData.content_hu.trim()) count++
      if (formData.title_en.trim() && formData.content_en.trim()) count++
      return count
    })

    // Database instances
    const database = new Databases(appw)
    const storage = new Storage(appw)
    const backupService = ContentBackupService.getInstance()

    // Store for original data (for backup comparison)
    const originalData = ref<Record<string, any>>({})

    // Methods
    const loadContent = async (): Promise<void> => {
      try {
        const document = await database.getDocument(
          config.website_db, 
          config.about_us_db, 
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
          pinned: document.pinned || false,
          sort_order: document.sort_order || 0,
          show_date: document.show_date || false,
          documents_flag: document.has_documents || false,
          album_flag: document.has_gallery || false,
          gallery_id: typeof document.gallery === 'string' ? document.gallery : (document.gallery?.$id || ""),
          eu_funding_enabled: document.eu_funding_enabled || false,
          image_position_x: typeof document.image_position_x === 'number' ? document.image_position_x : 50,
          image_position_y: typeof document.image_position_y === 'number' ? document.image_position_y : 50
        })
        
        // Set image
        if (document.default_image) {
          default_image.value = document.default_image
          img.value = storage.getFileView(config.website_images, document.default_image).toString()
        }

        // Store original data for backup comparison
        originalData.value = { ...document }

        const schedule = await loadNewsSchedule()
        const window = schedule[id.value] || {}
        formData.publish_from = toLocalInput(window.from)
        formData.publish_until = toLocalInput(window.until)

      } catch (error) {
        console.error('Failed to load content:', error)
      }
    }

    const toLocalInput = (iso?: string): string => {
      if (!iso) return ''
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return String(iso).slice(0, 16)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    const saveSchedule = async (): Promise<void> => {
      try {
        await setNewsSchedule(id.value, {
          from: formData.publish_from,
          until: formData.publish_until
        })
      } catch (error) {
        console.error('Failed to save news schedule:', error)
      }
    }

    const save = async (): Promise<void> => {
      try {
        const newData = {
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
          pinned: formData.pinned,
          sort_order: formData.sort_order,
          show_date: formData.show_date,
          eu_funding_enabled: formData.eu_funding_enabled,
          image_position_x: formData.image_position_x,
          image_position_y: formData.image_position_y
        }

        // Create backup before saving (if we have original data)
        if (Object.keys(originalData.value).length > 0) {
          await backupService.createBackup(
            id.value,
            'about_us',
            config.about_us_db,
            originalData.value,
            newData,
            'update'
          )
        }

        await database.updateDocument(
          config.website_db,
          config.about_us_db,
          id.value,
          newData
        )

        // Update original data after successful save
        originalData.value = { ...originalData.value, ...newData }
        await saveSchedule()

      } catch (error) {
        console.error('Failed to save:', error)
      }
    }

    const deleteContent = async (): Promise<void> => {
      try {
        await database.deleteDocument(config.website_db, config.about_us_db, id.value)
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
        
      } catch (error) {
        console.error('Failed to share on Facebook:', error)
      }
    }

    const handleFilesUploaded = async (uploadedFiles: any[]): Promise<void> => {
      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0]
        default_image.value = file.$id
        img.value = storage.getFileView(config.website_images, file.$id).toString()
        // Új kép feltöltésekor a fókuszpontot visszaállítjuk középre
        formData.image_position_x = 50
        formData.image_position_y = 50
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

    const onTextComponentsUpdate = (): void => {
      // Optionally refresh or notify about changes
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

    /**
     * Húzható crop doboz logika.
     *
     * A dobozt a felhasználó az egész képen szabadon húzhatja. A doboz fix
     * arányú (négyzet, a kép rövidebb oldalához igazítva), a középpontja
     * alapján számoljuk az image_position_x/y (0-100%) értékeket, amit
     * a megjelenítésnél object-position/background-position formájában
     * lehet felhasználni, hogy a kép cropolásakor (kártya, sablon ikon, stb.)
     * a fontos rész (pl. egy fej) ne vágódjon le.
     */
    const cropBoxSizePercent = ref<{ w: number; h: number }>({ w: 40, h: 40 })
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    const cropBoxLeft = computed(() => {
      const half = cropBoxSizePercent.value.w / 2
      return Math.min(100 - cropBoxSizePercent.value.w, Math.max(0, formData.image_position_x - half))
    })

    const cropBoxTop = computed(() => {
      const half = cropBoxSizePercent.value.h / 2
      return Math.min(100 - cropBoxSizePercent.value.h, Math.max(0, formData.image_position_y - half))
    })

    const getEventPoint = (event: MouseEvent | TouchEvent): { x: number; y: number } => {
      if ('touches' in event && event.touches.length > 0) {
        const touch = event.touches[0]
        return { x: touch.clientX, y: touch.clientY }
      }
      if ('changedTouches' in event && event.changedTouches.length > 0) {
        const touch = event.changedTouches[0]
        return { x: touch.clientX, y: touch.clientY }
      }
      const mouseEvent = event as MouseEvent
      return { x: mouseEvent.clientX, y: mouseEvent.clientY }
    }

    const startDrag = (event: MouseEvent | TouchEvent): void => {
      event.preventDefault()
      const el = positionPickerRef.value
      if (!el) return

      isDragging.value = true
      const rect = el.getBoundingClientRect()
      const point = getEventPoint(event)

      // Megjegyezzük, hol fogtuk meg a dobozt, hogy ne ugorjon a sarka az egérre
      const boxLeftPx = (cropBoxLeft.value / 100) * rect.width
      const boxTopPx = (cropBoxTop.value / 100) * rect.height
      dragOffset.value = {
        x: (point.x - rect.left) - boxLeftPx,
        y: (point.y - rect.top) - boxTopPx
      }

      window.addEventListener('mousemove', onDrag)
      window.addEventListener('touchmove', onDrag, { passive: false })
      window.addEventListener('mouseup', stopDrag)
      window.addEventListener('touchend', stopDrag)
    }

    const onDrag = (event: MouseEvent | TouchEvent): void => {
      if (!isDragging.value) return
      event.preventDefault()

      const el = positionPickerRef.value
      if (!el) return

      const rect = el.getBoundingClientRect()
      const point = getEventPoint(event)

      const boxLeftPx = (point.x - rect.left) - dragOffset.value.x
      const boxTopPx = (point.y - rect.top) - dragOffset.value.y

      const boxWPx = (cropBoxSizePercent.value.w / 100) * rect.width
      const boxHPx = (cropBoxSizePercent.value.h / 100) * rect.height

      const clampedLeftPx = Math.min(rect.width - boxWPx, Math.max(0, boxLeftPx))
      const clampedTopPx = Math.min(rect.height - boxHPx, Math.max(0, boxTopPx))

      const centerXPercent = ((clampedLeftPx + boxWPx / 2) / rect.width) * 100
      const centerYPercent = ((clampedTopPx + boxHPx / 2) / rect.height) * 100

      formData.image_position_x = Math.round(Math.min(100, Math.max(0, centerXPercent)))
      formData.image_position_y = Math.round(Math.min(100, Math.max(0, centerYPercent)))
    }

    const stopDrag = (): void => {
      if (!isDragging.value) return
      isDragging.value = false

      window.removeEventListener('mousemove', onDrag)
      window.removeEventListener('touchmove', onDrag)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('touchend', stopDrag)

      save()
    }

    const resetFocalPoint = (): void => {
      formData.image_position_x = 50
      formData.image_position_y = 50
      save()
    }

    /**
     * Intelligens AI fordítás - detektálja a legjobb forrásnyelvet
     */
    const detectSourceContent = (): { code: string; title: string; content: string } | null => {
      const contents = [
        { code: 'sr', title: formData.title_rs, content: formData.content_rs },
        { code: 'hu', title: formData.title_hu, content: formData.content_hu },
        { code: 'en', title: formData.title_en, content: formData.content_en }
      ]

      const scored = contents
        .filter(item => item.title.trim().length > 0 || item.content.trim().length > 0)
        .map(item => ({
          ...item,
          score: item.title.trim().length + item.content.trim().length
        }))
        .sort((a, b) => b.score - a.score)

      if (scored.length === 0) return null

      const best = scored[0]
      return { code: best.code, title: best.title.trim(), content: best.content.trim() }
    }

    /**
     * Tartalom automatikus fordítása AI-val
     */
    const autoTranslateContent = async (): Promise<void> => {
      const source = detectSourceContent()

      if (!source) {
        notify({ type: 'warning', text: t('no_content_to_translate') })
        return
      }

      isTranslating.value = true
      translationProgress.value = 0
      showTranslateDialog.value = false

      try {
        const { translateWithAI } = translationComposable

        // Meghatározzuk, mely nyelvekre kell fordítani
        const targetLanguages: Array<{ code: string; isEmpty: boolean }> = [
          { code: 'sr', isEmpty: !formData.title_rs.trim() && !formData.content_rs.trim() },
          { code: 'hu', isEmpty: !formData.title_hu.trim() && !formData.content_hu.trim() },
          { code: 'en', isEmpty: !formData.title_en.trim() && !formData.content_en.trim() }
        ].filter(lang => lang.code !== source.code && lang.isEmpty)

        if (targetLanguages.length === 0) {
          notify({ type: 'info', text: t('all_content_already_filled') })
          return
        }

        const totalSteps = targetLanguages.length * 2 // title + content
        let completed = 0

        for (const target of targetLanguages) {
          try {
            // Fordítjuk a címet
            if (source.title) {
              const translatedTitle = await translateWithAI(source.title, source.code, target.code)

              // Frissítjük a címet
              if (target.code === 'sr') formData.title_rs = translatedTitle
              else if (target.code === 'hu') formData.title_hu = translatedTitle
              else if (target.code === 'en') formData.title_en = translatedTitle

              completed++
              translationProgress.value = (completed / totalSteps) * 100
            }

            // Fordítjuk a tartalmat
            if (source.content) {
              const translatedContent = await translateWithAI(source.content, source.code, target.code)

              // Frissítjük a tartalmat
              if (target.code === 'sr') formData.content_rs = translatedContent
              else if (target.code === 'hu') formData.content_hu = translatedContent
              else if (target.code === 'en') formData.content_en = translatedContent

              completed++
              translationProgress.value = (completed / totalSteps) * 100
            }

            // Kis késleltetés a rate limiting elkerülésére
            await new Promise(resolve => setTimeout(resolve, 500))

          } catch (error) {
            console.error(`❌ Translation failed for ${target.code}:`, error)
            notify({ type: 'error', text: t('translation_failed_for_language', { lang: target.code }) })
          }
        }

        notify({ type: 'success', text: t('content_translated_successfully') })

        // Mentés az új tartalommal
        await save()

      } catch (error) {
        console.error('Translation error:', error)
        notify({ type: 'error', text: t('translation_error') })
      } finally {
        isTranslating.value = false
        translationProgress.value = 0
      }
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (uploading.value) {
        event.preventDefault()
        // this.$notify({ type: 'error', text: this.$t('file_still_uploading') })
        event.returnValue = ''
      }
    }

    // Lifecycle hooks
    onMounted(() => {
      Promise.all([loadContent(), loadGalleries()])
      window.addEventListener('beforeunload', handleBeforeUnload)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })

    return {
      // State
      id,
      file_link,
      img,
      galleries,
      formData,
      uploading,
      showAlbumViewer,
      default_image,

      // Loading helpers
      isLoading,
      isAnyLoading,
      updateField,
      handleFieldChange,

      // Methods
      save,
      saveSchedule,
      deleteContent,
      shareFacebook,
      handleFileUpload,
      handleFilesUploaded,
      handleDocumentsToggle,
      handleCreateGallery,
      handleGalleryChange,
      onTextComponentsUpdate,

      // Focal point / crop position (draggable box)
      positionPickerRef,
      cropBoxLeft,
      cropBoxTop,
      cropBoxSizePercent,
      startDrag,
      resetFocalPoint,

      // Translation
      showTranslateDialog,
      isTranslating,
      translationProgress,
      hasAnyContent,
      completedLanguages,
      autoTranslateContent,

      // Config
      config
    }
  }
})
</script>

<style scoped>
.content-editor {
  max-width: 1200px;
}

.language-content {
  @apply space-y-4;
}

/* Focal point / crop position picker */
.position-picker {
  width: 100%;
  height: 320px;
  position: relative;
  border-radius: 0.85rem;
  overflow: hidden;
}

.position-picker-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  display: block;
}

.crop-box {
  position: absolute;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.5), 0 2px 12px rgba(14, 165, 233, 0.35);
  cursor: grab;
  touch-action: none;
  border-radius: 4px;
}

.crop-box:active {
  cursor: grabbing;
}

.crop-box-inner {
  width: 100%;
  height: 100%;
  background: rgba(14, 165, 233, 0.18);
  outline: 1px dashed rgba(255, 255, 255, 0.85);
  outline-offset: -1px;
}

.thumb-preview--card {
  width: 220px;
  height: 120px;
}

.thumb-preview--square {
  width: 100px;
  height: 100px;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.translation-progress {
  text-align: center;
  padding: 20px 0;
}
</style>