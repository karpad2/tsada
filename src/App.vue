<script>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Index from '@/views/Index.vue';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useLoadingStore } from '@/stores/loading';
import { computed, watch } from 'vue';

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    Index,
    PWAUpdatePrompt,
    ConfirmDialog
  },
  setup() {
    const loadingStore = useLoadingStore();
    const route = useRoute();

    const routeKey = computed(() => {
      return `${loadingStore.language}`;
    });

    // Reset EU funding logo when route changes
    watch(() => route.path, () => {
      loadingStore.setCurrentPageEuFunding(false);
    });

    return {
      routeKey
    };
  }
}
</script>

<template>
  <Index class="app-ambient">
    <notifications position="top right"/>
    <RouterView :key="routeKey" />
    <PWAUpdatePrompt />
    <ConfirmDialog />
  </Index>
</template>

<style scoped>

</style>

