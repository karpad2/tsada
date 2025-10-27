<template>
  <div class="login-page min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 to-blue-600">
    <div class="login-container bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold mb-6 text-center dark:text-white">{{ $t('login') }}</h1>

      <Login />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['guest'] // Only accessible when not logged in
})

useHead({
  title: useI18n().t('login'),
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>
