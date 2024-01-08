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
    
    <notifications position="bottom right"/> 
    <RouterView  />
  
  </Index>

</template>

<style scoped>

</style>

