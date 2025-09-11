<script>
import { RouterLink, RouterView } from 'vue-router'
import Index from '@/views/Index.vue';
export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    Index
  }
  }
</script>

<template>
  <Index class=" dark:bg-gray-600 bg-slate-50">
    <notifications position="top right"/> 
    <RouterView  :key="$route.path" />
  </Index>
</template>

<style scoped>

</style>

