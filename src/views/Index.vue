<template>
    <div>
      <!-- Vuetify Top Loading Bar -->
      <v-progress-linear
        v-if="false"
        color="primary"
        indeterminate
        height="4"
        class="no_print"
        style="z-index: 9999"
      />
  
      <!-- Header -->
      <Header v-if="!__hideheaders" class="no_print" />
  
      <!-- Main Container -->
      <div class="min-h-screen">
        <!-- Initial checking -->
        <div v-if="checking">
          <Loading />
        </div>
  
        <!-- Offline -->
        <div v-else-if="!weHaveNet" class="container m-auto w-60 mt-5">
          <NoInternet />
        </div>
          <!-- Actual content -->    
        <div v-else-if="easterEggActive">
          <iframe src="https://elgoog.im/t-rex/" class="w-full min-h-screen border-0"></iframe>
        </div>
        <div v-else>
          <main class="min-h-screen">
            <slot />
          </main>
        </div>
      </div>
  
      <!-- Footer -->
      <Footer v-if="!__hideheaders" class="no_print" />
    </div>
  </template>
  
  <script lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from "vue";
  import { useLoadingStore } from "@/stores/loading";
  import { useSEO } from "@/composables/useSEO";
  import { useRoute } from "vue-router";
  import Header from "@/components/HeaderModular.vue";
  import Footer from "@/components/Footer.vue";
  import Loading from "@/components/Loading.vue";
  import NoInternet from "@/components/NoInternet.vue";
  import axios from "axios";
  
  export default {
    name: "AppLayout",
    components: {
      Header,
      Footer,
      Loading,
      NoInternet,
    },
    setup() {
      const store = useLoadingStore();
  
      const checking = ref(true);
      const weHaveNet = ref(false);
      const isLoading = computed(() => store.isLoading);
      const __hideheaders = computed(() => store.hideheaders);
      const easterEggActive = ref(false);

      const checkConnection = async () => {
        try {
          const response = await axios.get("https://share.tsada.edu.rs/ping");
          weHaveNet.value = response.data === "Pong";
        } catch {
          weHaveNet.value = false;
        } finally {
          checking.value = false;
        }
      };

      // App updates are handled by the PWA service worker + PWAUpdatePrompt.
      // Do NOT compare package.json to GitHub and force SW unregister/reload —
      // that caused infinite refresh loops when versions diverge.

      const handleKeydown = (e) => {
        if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'w') {
          easterEggActive.value = true;
        }
      };
  
      onMounted(() => {
        store.isLoading = true;
        checkConnection();
        window.addEventListener('keydown', handleKeydown);
        setTimeout(() => {
          store.isLoading = false;
        }, 1000);
      });
      onBeforeUnmount(()=>{
        window.removeEventListener('keydown', handleKeydown);
      });
      
  
      return {
        checking,
        weHaveNet,
        isLoading,
        __hideheaders,
        easterEggActive
      };
    },
  };
  </script>
  
  <style scoped>
  .no_print {
    print-color-adjust: exact;
  }
  </style>
  