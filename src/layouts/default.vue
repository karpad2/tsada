<template>
  <div class="min-h-screen bg-slate-50 dark:bg-gray-600">
    <Header />

    <main>
      <slot />
    </main>

    <Footer />

    <!-- Global notifications -->
    <notifications position="top right" />

    <!-- Cookie consent -->
    <VueCookieComply v-if="showCookieConsent" />
  </div>
</template>

<script setup lang="ts">
import Header from '~/components/Header.vue'
import Footer from '~/components/Footer.vue'

const showCookieConsent = ref(true)

// Check if user has already accepted cookies
onMounted(() => {
  const cookieConsent = localStorage.getItem('cookie-consent')
  if (cookieConsent) {
    showCookieConsent.value = false
  }
})
</script>
