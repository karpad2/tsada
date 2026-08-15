<template>
  <div class="p-6 md:p-8 glass flex flex-col md:ml-auto w-full md:py-8 flex-wrap md:mt-0 rounded-2xl">
    <h2 class="text-xl mb-1 font-semibold title-font text-gray-800 dark:text-white">{{ $t('feedback') }}</h2>
    <div class="section-accent !w-16 !mb-3"></div>
    <p class="leading-relaxed mb-5 text-gray-600 dark:text-gray-300">{{ $t('contactustext') }}</p>

    <label class="block mb-4">
      <span class="block text-sm mb-1 text-gray-600 dark:text-gray-300">{{ $t('name') }}</span>
      <input
        v-model="name"
        type="text"
        maxlength="40"
        :disabled="sending"
        autocomplete="name"
        class="contact-field"
      />
    </label>

    <label class="block mb-4">
      <span class="block text-sm mb-1 text-gray-600 dark:text-gray-300">{{ $t('email') }}</span>
      <input
        v-model="email"
        type="email"
        maxlength="255"
        :disabled="sending"
        autocomplete="email"
        class="contact-field"
      />
    </label>

    <label class="block mb-4">
      <span class="block text-sm mb-1 text-gray-600 dark:text-gray-300">{{ $t('message') }}</span>
      <textarea
        v-model="bodyText"
        rows="5"
        maxlength="255"
        :disabled="sending"
        class="contact-field min-h-[8rem] resize-y"
      />
      <span class="text-xs text-gray-400">{{ bodyText.length }}/255</span>
    </label>

    <p v-if="error" class="text-sm text-rose-600 mb-3">{{ error }}</p>
    <p v-if="sent" class="text-sm text-emerald-600 mb-3">{{ $t('thankyouforsendingmessage') }}</p>

    <button
      type="button"
      class="glass-btn w-full sm:w-auto px-8 py-3 text-white font-semibold rounded-full disabled:opacity-50"
      :disabled="sending"
      @click="send"
    >
      {{ sending ? $t('saving') : $t('submit') }}
    </button>
  </div>
</template>

<script>
import { Databases, ID } from 'appwrite'
import { appw, config } from '@/appwrite'
import { clip, MESSAGE_MAX, NAME_MAX } from '@/utils/contactMessage'

const database = new Databases(appw)

export default {
  name: 'ContactUsPlugin',
  data() {
    return {
      email: '',
      name: '',
      bodyText: '',
      sending: false,
      sent: false,
      error: ''
    }
  },
  methods: {
    async send() {
      this.error = ''
      this.sent = false

      const name = clip(this.name, NAME_MAX)
      const email = clip(this.email, 255)
      const message = clip(this.bodyText, MESSAGE_MAX)

      if (!name || !email || !message) {
        this.error = this.$t('contact_fill_all')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.error = this.$t('contact_invalid_email')
        return
      }

      this.sending = true
      try {
        await database.createDocument(
          config.website_db,
          config.mess_coll,
          ID.unique(),
          { name, email, message }
        )
        this.sent = true
        this.email = ''
        this.name = ''
        this.bodyText = ''
        this.$notify({ type: 'success', text: this.$t('thankyouforsendingmessage') })
      } catch (error) {
        console.error('Error sending message:', error)
        this.error = this.$t('contact_send_error')
        this.$notify({ type: 'error', text: this.$t('contact_send_error') })
      } finally {
        this.sending = false
      }
    }
  }
}
</script>

<style scoped>
.contact-field {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border-radius: 0.8rem;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
}
.dark .contact-field {
  border-color: #475569;
  background: #1e293b;
  color: #f1f5f9;
}
</style>
