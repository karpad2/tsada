<script>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Index from '@/views/Index.vue';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useLoadingStore } from '@/stores/loading';
import { watch } from 'vue';

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

    // Reset EU funding logo when route changes
    watch(() => route.path, () => {
      loadingStore.setCurrentPageEuFunding(false);
    });

    return {};
  }
}
</script>

<template>
  <div class="app-ambient">
    <Index>
      <notifications position="top right" />
      <RouterView />
      <PWAUpdatePrompt />
      <ConfirmDialog />
    </Index>
  </div>
</template>

<style scoped>

</style>

