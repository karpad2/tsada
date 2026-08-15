<template>
  <div class="app-layout">
    <Header v-show="!hideHeaders" class="no_print" />

    <div class="min-h-screen">
      <NoInternet v-if="showOffline" />
      <iframe
        v-else-if="easterEggActive"
        src="https://elgoog.im/t-rex/"
        class="w-full min-h-screen border-0"
      />
      <main v-else class="min-h-screen">
        <slot />
      </main>
    </div>

    <Footer v-show="!hideHeaders" class="no_print" />
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useLoadingStore } from '@/stores/loading'
import Header from '@/components/HeaderModular.vue'
import Footer from '@/components/Footer.vue'
import NoInternet from '@/components/NoInternet.vue'
import axios from 'axios'
import { isClient } from '@/utils/ssr'

export default {
  name: 'AppLayout',
  components: {
    Header,
    Footer,
    NoInternet
  },
  setup() {
    const store = useLoadingStore()

    // Optimistic online for SSR + first paint — re-check only on client
    const checking = ref(false)
    const weHaveNet = ref(true)
    const isLoading = computed(() => store.isLoading)
    const hideHeaders = computed(() => store.hideheaders)
    const easterEggActive = ref(false)
    const showOffline = computed(() => !weHaveNet.value && !checking.value)

    const checkConnection = async () => {
      try {
        const response = await axios.get('https://share.tsada.edu.rs/ping', {
          timeout: 5000
        })
        weHaveNet.value = response.data === 'Pong'
      } catch {
        // Keep content visible if ping fails but browser reports online
        weHaveNet.value = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
      } finally {
        checking.value = false
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'w') {
        easterEggActive.value = true
      }
    }

    onMounted(() => {
      store.isLoading = true
      checkConnection()
      window.addEventListener('keydown', handleKeydown)
      setTimeout(() => {
        store.isLoading = false
      }, 1000)
    })

    onBeforeUnmount(() => {
      if (isClient) {
        window.removeEventListener('keydown', handleKeydown)
      }
    })

    return {
      checking,
      weHaveNet,
      isLoading,
      hideHeaders,
      easterEggActive,
      showOffline
    }
  }
}
</script>

<style scoped>
.no_print {
  print-color-adjust: exact;
}
</style>
