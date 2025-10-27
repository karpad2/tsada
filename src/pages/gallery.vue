<template>
  <div class="gallery-page container mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold mb-8 dark:text-white">{{ $t('gallery') }}</h1>

    <Gallery />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: useI18n().t('gallery'),
  meta: [
    {
      name: 'description',
      content: 'Galerija Tehničke škole Ada - slike događaja, ekskurzija i školskih aktivnosti'
    }
  ]
})
</script>
