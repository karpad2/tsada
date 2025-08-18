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
      <div class="min-h-screen bg-slate-50 dark:bg-slate-900/80 ">
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
  import { ref, computed, onMounted } from "vue";
  import { useLoadingStore } from "@/stores/loading";
  import Header from "@/components/Header.vue";
  import Footer from "@/components/Footer.vue";
  import Loading from "@/components/Loading.vue";
  import NoInternet from "@/components/NoInternet.vue";
  import axios from "axios";
  import pkg from "../../package.json";
import { onBeforeUnmount } from "vue";
  
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
      const currentVersion = pkg.version;
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
  
      const checkForUpdates = async () => {
        try {
          const res = await fetch("https://raw.githubusercontent.com/karpad2/tsada/refs/heads/main/package.json");
          const data = await res.json();
          if (data.version !== currentVersion && import.meta.env.PROD) {
            clearCacheAndReload();
          }
        } catch (err) {
          console.warn("Update check failed:", err);
        }
      };

  
      const clearCacheAndReload = () => {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            for (const reg of regs) reg.unregister();
            location.reload();
          });
        } else {
          location.reload();
        }
      };

      const handleKeydown = (e) => {
  if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'w') {
    easterEggActive.value = true;
    //alert('🎉 Easter Egg Activated with Ctrl+Shift+Alt+W!');
  }
};
  
      onMounted(() => {
        store.isLoading = true;
        checkConnection();
        checkForUpdates();
        window.addEventListener('keydown', handleKeydown);
        // hide progress bar after 1s for visual effect
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
  