<template>
  <div class="relative mb-4 container px-5 mx-auto bg-white">
    <!-- Main Controls -->
    <section class="control-section mb-6">
      <div class="flex flex-wrap gap-4 mb-4">
        <v-switch 
          v-model="formData.visible" 
          :label="$t('visible')" 
          @change="save" 
        />
        <v-switch 
          v-model="formData.notNews" 
          :label="$t('not_news')" 
          @change="save" 
        />
        <v-switch 
          v-model="formData.show_date" 
          :label="$t('show_date')" 
          @change="save" 
        />
      </div>
      
      <div class="action-buttons flex gap-2 mb-4">
        <v-btn @click="save">{{ $t('save') }}</v-btn>
        <v-btn @click="deleteContent" color="error">{{ $t('delete') }}</v-btn>
        <v-btn @click="shareFacebook" color="primary">{{ $t('fb_share') }}</v-btn>
      </div>
    </section>

    <!-- Image Upload Section -->
    <section class="image-section mb-6">
      <v-file-input 
        v-model="file_link" 
        accept="image/*" 
        :label="$t('fileupload')" 
        @change="handleFileUpload" 
      />
      
      <div class="preview-section">
        <h3>{{ $t("preview") }}</h3>
        <div class="flex flex-wrap -m-4">
          <div class="xl:w-1/5 md:w-1/2 p-4 cursor-pointer">
            <div class="bg-slate-100/30 hover:bg-sky-600/30 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
              <img 
                class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out"
                :src="img" 
                alt="content preview"
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Language Sections -->
    <section class="language-sections">
      <!-- Serbian -->
      <div class="language-section mb-6">
        <v-switch 
          v-model="formData.srb_flag" 
          :label="$t('srb')" 
          @change="save" 
        />
        <div v-if="formData.srb_flag" class="language-content mt-4">
          <v-text-field
            v-model="formData.title_rs"
            :counter="100"
            :label="$t('srb_title')"
            hide-details
            @change="save"
          />
          <div class="mt-4">
            <ckeditor v-model="formData.content_rs" />
          </div>
        </div>
      </div>

      <!-- Hungarian -->
      <div class="language-section mb-6">
        <v-switch 
          v-model="formData.hun_flag" 
          :label="$t('hu')" 
          @change="save" 
        />
        <div v-if="formData.hun_flag" class="language-content mt-4">
          <v-text-field
            v-model="formData.title_hu"
            :counter="100"
            :label="$t('hu_title')"
            hide-details
            @change="save"
          />
          <div class="mt-4">
            <ckeditor v-model="formData.content_hu" />
          </div>
        </div>
      </div>

      <!-- English -->
      <div class="language-section mb-6">
        <v-switch 
          v-model="formData.en_flag" 
          :label="$t('en')" 
          @change="save" 
        />
        <div v-if="formData.en_flag" class="language-content mt-4">
          <v-text-field
            v-model="formData.title_en"
            :counter="100"
            :label="$t('en_title')"
            hide-details
            @change="save"
          />
          <div class="mt-4">
            <ckeditor v-model="formData.content_en" />
          </div>
        </div>
      </div>
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
    DocLister
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // Reactive state
    const id = ref<string>(route.params.id as string)
    const file_link = ref(null)
    const img = ref<string>("https://dummyimage.com/720x400")
    const galleries = ref([])
    const default_image = ref<string>("")
    const uploading = ref<boolean>(false)
    const _update = ref<boolean>(true)
    
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
      notNews: true
    })

    const showAlbumViewer = computed(() => _update.value && formData.gallery_id)

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
          notNews: document.notNews || true,
          show_date: document.show_date || false,
          documents_flag: document.has_documents || false,
          album_flag: document.has_gallery || false,
          gallery_id: document.gallery?.$id || ""
        })
        
        // Set image
        if (document.default_image) {
          img.value = storage.getFileView(config.website_images, document.default_image).toString()
        }
        
      } catch (error) {
        console.error('Failed to load content:', error)
      }
    }

    const save = async (): Promise<void> => {
      try {
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
            show_date: formData.show_date
          }
        )
        
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
      
      // Methods
      save,
      deleteContent,
      shareFacebook,
      handleFileUpload,
      handleDocumentsToggle,
      handleCreateGallery,
      handleGalleryChange
    }
  }
})
</script>

<style scoped>
.content-editor {
  @apply max-w-full;
}

.control-section {
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
</style>