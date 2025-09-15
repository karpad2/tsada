<script>
import { RouterLink, RouterView } from 'vue-router'
import Index from '@/views/Index.vue';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue';
export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    Index,
    PWAUpdatePrompt
  }
  }
</script>

<template>
  <Index class=" dark:bg-gray-600 bg-slate-50">
    <notifications position="top right"/>
    <RouterView  :key="$route.path" />
    <PWAUpdatePrompt />
  </Index>
</template>

<style scoped>

</style>

