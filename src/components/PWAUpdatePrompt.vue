<template>
  <div
    v-if="updateAvailable"
    class="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-sm"
  >
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <i class="pi pi-refresh text-blue-600 text-xl"></i>
      </div>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ $t('new_version_available') || 'Új verzió elérhető' }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {{ $t('update_app_message') || 'Frissítsd az alkalmazást a legújabb funkciókhoz.' }}
        </p>
        <div class="flex space-x-2 mt-3">
          <button
            @click="updateApp"
            :disabled="updating"
            class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
          >
            <i v-if="updating" class="pi pi-spin pi-spinner mr-1"></i>
            {{ updating ? (updateButtonText || 'Frissítés...') : (updateButtonText || 'Frissítés') }}
          </button>
          <button
            @click="dismissUpdate"
            class="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs px-3 py-1 rounded transition-colors"
          >
            {{ $t('later') || 'Később' }}
          </button>
        </div>
      </div>
      <button
        @click="dismissUpdate"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>
  </div>

  <!-- Offline ready notification -->
  <div
    v-if="offlineReady && !updateAvailable"
    class="fixed bottom-4 right-4 z-50 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg shadow-lg p-4 max-w-sm"
  >
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <i class="pi pi-check-circle text-green-600 text-xl"></i>
      </div>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-green-900 dark:text-green-100">
          {{ $t('offline_ready') || 'Offline használatra kész' }}
        </h3>
        <p class="text-sm text-green-700 dark:text-green-200 mt-1">
          {{ $t('offline_ready_message') || 'Az alkalmazás mostantól offline is használható.' }}
        </p>
      </div>
      <button
        @click="offlineReady = false"
        class="flex-shrink-0 text-green-400 hover:text-green-600"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export default defineComponent({
  name: 'PWAUpdatePrompt',
  setup() {
    const updating = ref(false)
    const {
      needRefresh: updateAvailable,
      offlineReady,
      updateServiceWorker: pwaUpdate,
    } = useRegisterSW()

    const updateApp = async () => {
      updating.value = true
      try {
        await pwaUpdate()
      } catch (error) {
        console.error('Update failed:', error)
      } finally {
        updating.value = false
      }
    }

    const dismissUpdate = () => {
      updateAvailable.value = false
    }

    return {
      updateAvailable,
      offlineReady,
      updating,
      updateApp,
      dismissUpdate
    }
  }
})
</script>

<style scoped>
/* Animation for entering/leaving */
.v-enter-active, .v-leave-active {
  transition: all 0.3s ease;
}
.v-enter-from, .v-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>