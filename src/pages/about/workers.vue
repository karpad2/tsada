<template>
  <div class="workers-page container mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold mb-8 dark:text-white">{{ $t('workers') }}</h1>

    <Workers />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: useI18n().t('workers'),
  meta: [
    {
      name: 'description',
      content: 'Zaposleni u Tehničkoj školi Ada - nastavnici i osoblje'
    }
  ]
})
</script>
