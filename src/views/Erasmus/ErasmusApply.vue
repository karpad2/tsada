<template>
  <section class="text-gray-600">
    <div class="page-panel container">
      <video-background
        :src="video_link"
        style="min-height: 200px;"
        class="flex flex-wrap w-full mb-20 p-2 rounded"
        overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)"
      >
        <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
          <h1 id="render_title" class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">
            {{ $t("erasmus_apply") }}
          </h1>
          <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
        </div>
      </video-background>

      <div class="pb-2 w-full dark:text-white" v-if="erasmus_apply_on">
        <span v-if="ErasmusApplied">{{ $t("active_apply_edit") }}</span>

        <v-form @submit.prevent="submit" ref="form" v-model="isFormValid">
          <v-text-field required v-model="name" :counter="40" :label="$t('name')" />
          <v-text-field required v-model="phone" :counter="15" :label="$t('phone')" />
          <v-text-field required v-model="email" type="email" :label="$t('email')" />
          <v-text-field
            required
            v-model="born_year"
            type="number"
            :hint="$t('e.g.') + eg_age"
            :label="$t('born_year')"
          />
          <v-text-field
            required
            v-model="mark_avg"
            type="number"
            :hint="$t('e.g.') + ' 5.00'"
            :label="$t('mark_avg')"
          />
          <v-text-field
            required
            v-model="which_class"
            :hint="$t('e.g.') + ' III-3'"
            :label="$t('class')"
          />

          <v-file-input
            v-model="file_motivation_letter"
            accept=".pdf,.doc,.docx,application/pdf"
            prepend-icon="mdi-file-pdf-box"
            show-size
            :clearable="false"
            :loading="uploadingMotivation"
            :label="$t('motivation_letter')"
            :hint="$t('erasmus_pdf_hint')"
            persistent-hint
            :error-messages="motivationError"
            @update:model-value="uploadMotivation"
          />
          <div v-if="link_motivation_letter" class="mb-4">
            <router-link
              class="text-sky-600 underline"
              target="_blank"
              :to="'/sterasmus/docviewer/' + link_motivation_letter"
            >
              {{ $t('erasmus_open_pdf') }}
            </router-link>
          </div>

          <v-file-input
            v-model="file_positive_document"
            accept=".pdf,.doc,.docx,application/pdf"
            prepend-icon="mdi-file-document"
            show-size
            :clearable="true"
            :loading="uploadingOther"
            :label="$t('other_positive_documents')"
            :error-messages="otherError"
            @update:model-value="uploadOther"
          />
          <div v-if="link_positive_document" class="mb-4">
            <router-link
              class="text-sky-600 underline"
              target="_blank"
              :to="'/sterasmus/docviewer/' + link_positive_document"
            >
              {{ $t('erasmus_open_pdf') }}
            </router-link>
          </div>

          <v-checkbox required v-model="accept_law" :label="$t('law_for_data_store')" color="info" />

          <v-btn
            class="me-4"
            type="submit"
            :loading="saving"
            :disabled="!canSubmit"
          >
            {{ $t("apply_for_erasmus") }}
          </v-btn>
        </v-form>
      </div>

      <div class="pb-2 w-full dark:text-white text-black text-center" v-else>
        <h2 class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2">{{ $t("applies_are_closed") }}</h2>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Databases, ID } from 'appwrite'
import { useLoadingStore } from '@/stores/loading'
import { appw, config } from '@/appwrite'
import {
  erasmusUploadErrorKey,
  pickUploadFile,
  uploadErasmusDocument
} from '@/services/erasmus/upload'
import { isPublicModuleOpen } from '@/services/modules/windows'

const database = new Databases(appw)

export default {
  name: 'ErasmusApply',
  data() {
    return {
      name: '',
      email: '',
      phone: '',
      which_class: '',
      born_year: null as number | null,
      mark_avg: null as number | string | null,
      file_motivation_letter: null as File | File[] | null,
      file_positive_document: null as File | File[] | null,
      link_motivation_letter: '' as string,
      link_positive_document: '' as string,
      erasmus_apply_on: false,
      isFormValid: false,
      accept_law: false,
      ErasmusApplied: '',
      video_link: '',
      uploadingMotivation: false,
      uploadingOther: false,
      saving: false,
      motivationError: '',
      otherError: ''
    }
  },
  computed: {
    eg_age() {
      return new Date().getFullYear() - 16
    },
    canSubmit(): boolean {
      return Boolean(
        this.accept_law &&
        this.isFormValid &&
        this.link_motivation_letter &&
        !this.uploadingMotivation &&
        !this.uploadingOther &&
        !this.saving
      )
    }
  },
  mounted() {
    const store = useLoadingStore()
    document.title = this.$t('erasmus_apply')
    this.getErasmusSettings()
    if (store.ErasmusAppliedID) {
      this.ErasmusApplied = store.ErasmusAppliedID
      this.queriing()
    }
  },
  methods: {
    notify(type: 'success' | 'error' | 'info', text: string) {
      this.$notify({ type, text })
    },
    async queriing() {
      const store = useLoadingStore()
      if (!store.ErasmusAppliedID) return
      try {
        const doc = await database.getDocument(
          config.website_db,
          config.erasmus_applies,
          store.ErasmusAppliedID
        )
        this.name = doc.name || ''
        this.email = doc.email || ''
        this.phone = doc.phone || ''
        this.born_year = doc.age ?? null
        this.link_motivation_letter = doc.link_motivation_letter || ''
        this.link_positive_document = doc.link_other_document || ''
        this.which_class = doc.class || ''
        this.mark_avg = doc.mark ?? null
      } catch (error) {
        console.error('Failed to load Erasmus apply:', error)
      }
    },
    payload() {
      return {
        name: this.name,
        email: this.email,
        age: this.born_year,
        class: this.which_class,
        phone: this.phone,
        mark: this.mark_avg,
        link_motivation_letter: this.link_motivation_letter || null,
        link_other_document: this.link_positive_document || null
      }
    },
    async submit() {
      if (!this.canSubmit) {
        if (!this.link_motivation_letter) {
          this.motivationError = this.$t('erasmus_need_motivation')
          this.notify('error', this.$t('erasmus_need_motivation'))
        }
        return
      }
      const store = useLoadingStore()
      this.saving = true
      try {
        if (!store.ErasmusAppliedID) {
          const created = await database.createDocument(
            config.website_db,
            config.erasmus_applies,
            ID.unique(),
            this.payload()
          )
          store.setErasmusAppliedID(created.$id)
          this.ErasmusApplied = created.$id
        } else {
          await database.updateDocument(
            config.website_db,
            config.erasmus_applies,
            store.ErasmusAppliedID,
            this.payload()
          )
        }
        this.notify('success', this.$t('apply_saved'))
        await this.queriing()
      } catch (error) {
        console.error('Failed to save Erasmus apply:', error)
        this.notify('error', this.$t('create_error'))
      } finally {
        this.saving = false
      }
    },
    async uploadMotivation(value: unknown) {
      const file = pickUploadFile(value)
      if (!file) return
      this.motivationError = ''
      this.uploadingMotivation = true
      this.notify('info', this.$t('file_upload_in_progress'))
      try {
        this.link_motivation_letter = await uploadErasmusDocument(file)
        this.notify('success', this.$t('erasmus_file_ready'))
        if (useLoadingStore().ErasmusAppliedID) {
          await database.updateDocument(
            config.website_db,
            config.erasmus_applies,
            useLoadingStore().ErasmusAppliedID,
            { link_motivation_letter: this.link_motivation_letter }
          )
        }
      } catch (error) {
        console.error('Motivation upload failed:', error)
        this.link_motivation_letter = ''
        this.file_motivation_letter = null
        this.motivationError = this.$t(erasmusUploadErrorKey(error))
        this.notify('error', this.motivationError)
      } finally {
        this.uploadingMotivation = false
      }
    },
    async uploadOther(value: unknown) {
      const file = pickUploadFile(value)
      if (!file) {
        this.link_positive_document = ''
        return
      }
      this.otherError = ''
      this.uploadingOther = true
      this.notify('info', this.$t('file_upload_in_progress'))
      try {
        this.link_positive_document = await uploadErasmusDocument(file)
        this.notify('success', this.$t('erasmus_file_ready'))
        if (useLoadingStore().ErasmusAppliedID) {
          await database.updateDocument(
            config.website_db,
            config.erasmus_applies,
            useLoadingStore().ErasmusAppliedID,
            { link_other_document: this.link_positive_document }
          )
        }
      } catch (error) {
        console.error('Other document upload failed:', error)
        this.link_positive_document = ''
        this.file_positive_document = null
        this.otherError = this.$t(erasmusUploadErrorKey(error))
        this.notify('error', this.otherError)
      } finally {
        this.uploadingOther = false
      }
    },
    async getErasmusSettings() {
      try {
        this.erasmus_apply_on = await isPublicModuleOpen('erasmus_apply')
      } catch (error) {
        console.error('Failed to load Erasmus apply setting:', error)
        this.erasmus_apply_on = false
      }
    }
  }
}
</script>
