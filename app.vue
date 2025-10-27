<template>
  <div id="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Global app setup
useHead({
  titleTemplate: '%s - Tehnička Škola Ada',
  htmlAttrs: {
    lang: 'sr'
  }
})
</script>

<style>
/* Global styles will be imported via nuxt.config.ts */
</style>
