<template>
  <!-- New version available -->
  <Transition name="pwa-slide">
    <div
      v-if="updateAvailable"
      class="pwa-toast fixed bottom-4 right-4 z-[60] max-w-sm w-[calc(100%-2rem)]"
      role="status"
      aria-live="polite"
    >
      <div class="pwa-toast-inner glass-strong rounded-2xl p-4 shadow-xl">
        <div class="flex items-start gap-3">
          <div class="pwa-icon pwa-icon--sky shrink-0">
            <i class="pi pi-refresh text-sky-600 dark:text-sky-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ $t('new_version_available') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ $t('update_app_message') }}
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                class="glass-btn text-white text-xs font-semibold px-4 py-2 rounded-full disabled:opacity-50"
                :disabled="updating"
                @click="updateApp"
              >
                <i v-if="updating" class="pi pi-spin pi-spinner mr-1"></i>
                {{ updating ? $t('updating') : $t('update_button') }}
              </button>
              <button
                type="button"
                class="btn-ghost-glass text-xs px-3 py-2"
                :disabled="updating"
                @click="dismissUpdate"
              >
                {{ $t('later') }}
              </button>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            :aria-label="$t('later')"
            @click="dismissUpdate"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Offline ready -->
  <Transition name="pwa-slide">
    <div
      v-if="offlineReady && !updateAvailable"
      class="pwa-toast fixed bottom-4 right-4 z-[60] max-w-sm w-[calc(100%-2rem)]"
      role="status"
      aria-live="polite"
    >
      <div class="pwa-toast-inner glass-strong rounded-2xl p-4 shadow-xl">
        <div class="flex items-start gap-3">
          <div class="pwa-icon pwa-icon--green shrink-0">
            <i class="pi pi-check-circle text-emerald-600 dark:text-emerald-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ $t('offline_ready') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ $t('offline_ready_message') }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            @click="offlineReady = false"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { usePWA } from '@/composables/usePWA'

export default defineComponent({
  name: 'PWAUpdatePrompt',
  setup() {
    const updating = ref(false)
    const {
      updateAvailable,
      offlineReady,
      updateApp: pwaUpdate,
      closePrompt
    } = usePWA()

    const updateApp = async () => {
      if (updating.value) return
      updating.value = true
      try {
        await pwaUpdate()
      } catch (error) {
        console.error('[PWA] Update failed:', error)
        updating.value = false
      }
      // On success the page typically reloads via controllerchange
    }

    const dismissUpdate = () => {
      closePrompt()
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
.pwa-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pwa-icon--sky {
  background: rgba(14, 165, 233, 0.12);
  border: 1px solid rgba(14, 165, 233, 0.22);
}

.pwa-icon--green {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.22);
}

.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition: all 0.3s ease;
}

.pwa-slide-enter-from,
.pwa-slide-leave-to {
  opacity: 0;
  transform: translateX(1.5rem);
}
</style>
