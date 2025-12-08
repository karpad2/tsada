<template>
  <div class="content-editor container px-5 mx-auto bg-white">
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
    >
      <template #custom-switches>
        <v-switch
          v-model="formData.eu_funding_enabled"
          :label="$t('eu_funding_enabled')"
          @change="save"
        />
      </template>
    </GeneralControlsSection>

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

    <!-- Language Sections -->
    <section class="language-sections">
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
import { useRoute, useRouter } from 'vue-router'
import { Client, Databases, ID, Storage, Query } from "appwrite"
import { appw, config } from "@/appwrite"
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
import { useTranslation } from '@/composables/useTranslation'
import { useI18n } from 'vue-i18n'

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
  eu_funding_enabled: boolean
}

export default defineComponent({
  name: 'ContentEditor',
  components: {
    AlbumViewer,
    DocLister,
    GeneralControlsSection,
    LanguageFieldGroup,
    FileUploadSection
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
      eu_funding_enabled: false
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
          show_date: document.show_date || false,
          documents_flag: document.has_documents || false,
          album_flag: document.has_gallery || false,
          gallery_id: document.gallery?.$id || "",
          eu_funding_enabled: document.eu_funding_enabled || false
        })
        
        // Set image
        if (document.default_image) {
          default_image.value = document.default_image
          img.value = storage.getFileView(config.website_images, document.default_image).toString()
        }
        
      } catch (error) {
        console.error('Failed to load content:', error)
      }
    }

    const save = async (): Promise<void> => {
      try {
        console.log('Saving document with default_image:', default_image.value)
        await database.updateDocument(
          config.website_db,
          config.about_us_db,
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
            show_date: formData.show_date,
            eu_funding_enabled: formData.eu_funding_enabled
          }
        )
        console.log('Document saved successfully')

        // Show success notification (assuming $notify is available)
        // this.$notify(this.$t('saved'))
        
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
      console.log('🔍 AI detected source language:', best.code, 'with score:', best.score)
      return { code: best.code, title: best.title.trim(), content: best.content.trim() }
    }

    /**
     * Tartalom automatikus fordítása AI-val
     */
    const autoTranslateContent = async (): Promise<void> => {
      const source = detectSourceContent()

      if (!source) {
        // Show notification using native notification if available
        alert(t('no_content_to_translate'))
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
          alert(t('all_content_already_filled'))
          return
        }

        console.log('🤖 Starting AI translation from', source.code, 'to', targetLanguages.map(l => l.code))

        const totalSteps = targetLanguages.length * 2 // title + content
        let completed = 0

        for (const target of targetLanguages) {
          try {
            // Fordítjuk a címet
            if (source.title) {
              console.log(`🔄 Translating title to ${target.code}...`)
              const translatedTitle = await translateWithAI(source.title, source.code, target.code)

              // Frissítjük a címet
              if (target.code === 'sr') formData.title_rs = translatedTitle
              else if (target.code === 'hu') formData.title_hu = translatedTitle
              else if (target.code === 'en') formData.title_en = translatedTitle

              completed++
              translationProgress.value = (completed / totalSteps) * 100
              console.log(`✅ Title translated to ${target.code}:`, translatedTitle)
            }

            // Fordítjuk a tartalmat
            if (source.content) {
              console.log(`🔄 Translating content to ${target.code}...`)
              const translatedContent = await translateWithAI(source.content, source.code, target.code)

              // Frissítjük a tartalmat
              if (target.code === 'sr') formData.content_rs = translatedContent
              else if (target.code === 'hu') formData.content_hu = translatedContent
              else if (target.code === 'en') formData.content_en = translatedContent

              completed++
              translationProgress.value = (completed / totalSteps) * 100
              console.log(`✅ Content translated to ${target.code}`)
            }

            // Kis késleltetés a rate limiting elkerülésére
            await new Promise(resolve => setTimeout(resolve, 500))

          } catch (error) {
            console.error(`❌ Translation failed for ${target.code}:`, error)
            alert(t('translation_failed_for_language', { lang: target.code }))
          }
        }

        alert(t('content_translated_successfully'))

        // Mentés az új tartalommal
        await save()

      } catch (error) {
        console.error('Translation error:', error)
        alert(t('translation_error'))
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
      loadContent()
      loadGalleries()
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
      deleteContent,
      shareFacebook,
      handleFileUpload,
      handleFilesUploaded,
      handleDocumentsToggle,
      handleCreateGallery,
      handleGalleryChange,

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
  margin: 0 auto;
  padding: 24px;
}

.language-sections {
  @apply border-b border-gray-200 pb-4;
}

.language-section {
  @apply border border-gray-200 rounded-lg p-4;
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
  @apply border border-gray-200 rounded-lg p-4;
}

/* AI Translation Styles */
.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.translation-progress {
  text-align: center;
  padding: 20px 0;
}
</style>