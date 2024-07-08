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
 
  <Index>
    
    <notifications position="top right"/> 
    <RouterView  :key="$route.path" />
  
  </Index>

  

</template>

<style scoped>

</style>

