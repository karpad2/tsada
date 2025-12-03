<script>
import { RouterLink, RouterView } from 'vue-router'
import Index from '@/views/Index.vue';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue';
import { useLoadingStore } from '@/stores/loading';
import { computed } from 'vue';

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    Index,
    PWAUpdatePrompt
  },
  setup() {
    const loadingStore = useLoadingStore();
    const routeKey = computed(() => {
      return `${loadingStore.language}`;
    });

    return {
      routeKey
    };
  }
}
</script>

<template>
  <Index class=" dark:bg-gray-600 bg-slate-50">
    <notifications position="top right"/>
    <RouterView :key="routeKey" />
    <PWAUpdatePrompt />
  </Index>
</template>

<style scoped>

</style>

