<template>
  <div class="admin-dashboard container mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold mb-8 dark:text-white">{{ $t('admin_dashboard') }}</h1>

    <Dashboard />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'] // Only accessible when logged in
})

useHead({
  title: 'Admin Dashboard',
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>
