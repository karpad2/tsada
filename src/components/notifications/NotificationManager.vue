<template>
  <div class="notification-manager">
    <!-- Notification Permission Request Banner -->
    <transition name="slide-down">
      <div
        v-if="showPermissionBanner && !isGranted && !isDenied"
        class="permission-banner fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div class="glass-card p-6 rounded-2xl shadow-2xl border border-purple-500/30">
          <div class="flex items-start gap-4">
            <div class="notification-icon flex-shrink-0">
              <svg class="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            <div class="flex-1">
              <h3 class="text-lg font-bold text-white mb-2">{{ $t('notification.enable_title') || 'Engedélyezed az értesítéseket?' }}</h3>
              <p class="text-sm text-gray-300 mb-4">
                {{ $t('notification.enable_description') || 'Kapj értesítést fontos iskolai hírekről, eseményekről és bejelentésekről.' }}
              </p>

              <div class="flex gap-3">
                <button
                  @click="requestPermission"
                  :disabled="isRequesting"
                  class="btn-primary flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  <span v-if="!isRequesting">{{ $t('notification.enable_btn') || 'Engedélyezem' }}</span>
                  <span v-else class="flex items-center justify-center">
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                </button>

                <button
                  @click="dismissBanner"
                  class="btn-secondary px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  {{ $t('notification.later_btn') || 'Később' }}
                </button>
              </div>
            </div>

            <button @click="closeBanner" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Notification Settings Toggle (for when already granted/denied) -->
    <div class="notification-settings" v-if="showSettings">
      <div class="settings-card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('notification.settings_title') || 'Push értesítések' }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ subscriptionStatus }}</p>
            </div>
          </div>

          <button
            v-if="isGranted && isSubscribed"
            @click="unsubscribe"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {{ $t('notification.disable_btn') || 'Kikapcsolás' }}
          </button>

          <button
            v-else-if="isGranted && !isSubscribed"
            @click="subscribe"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {{ $t('notification.resubscribe_btn') || 'Újra bekapcsolás' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PushNotificationService } from '@/services/notifications/PushNotificationService';

const props = defineProps<{
  autoShow?: boolean;
  showSettings?: boolean;
}>();

const notificationService = PushNotificationService.getInstance();

const showPermissionBanner = ref(false);
const isRequesting = ref(false);
const permission = ref<NotificationPermission>('default');
const isSubscribed = ref(false);

const isGranted = computed(() => permission.value === 'granted');
const isDenied = computed(() => permission.value === 'denied');

const subscriptionStatus = computed(() => {
  if (isDenied.value) return 'Értesítések letiltva';
  if (isGranted.value && isSubscribed.value) return 'Aktív';
  if (isGranted.value && !isSubscribed.value) return 'Inaktív';
  return 'Nem engedélyezett';
});

onMounted(async () => {
  // Check if notifications are supported
  if (!notificationService.isSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  // Get current permission status
  permission.value = notificationService.getPermissionStatus();
  isSubscribed.value = await notificationService.isSubscribed();

  // Auto-show banner if configured and not decided yet
  if (props.autoShow && permission.value === 'default') {
    // Show banner after 5 seconds
    setTimeout(() => {
      const dismissed = localStorage.getItem('notification_banner_dismissed');
      if (!dismissed) {
        showPermissionBanner.value = true;
      }
    }, 5000);
  }
});

async function requestPermission() {
  isRequesting.value = true;

  try {
    const result = await notificationService.requestPermission();
    permission.value = result;

    if (result === 'granted') {
      isSubscribed.value = await notificationService.isSubscribed();
      showPermissionBanner.value = false;

      // Show success notification
      await notificationService.showNotification({
        title: '🎉 Értesítések bekapcsolva!',
        body: 'Mostantól értesítünk a fontos iskolai hírekről.',
        icon: '/favicon.png',
        tag: 'welcome-notification',
      });
    }
  } catch (error) {
    console.error('Failed to request permission:', error);
  } finally {
    isRequesting.value = false;
  }
}

async function subscribe() {
  try {
    await notificationService.subscribe();
    isSubscribed.value = true;
  } catch (error) {
    console.error('Failed to subscribe:', error);
  }
}

async function unsubscribe() {
  try {
    await notificationService.unsubscribe();
    isSubscribed.value = false;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
  }
}

function dismissBanner() {
  localStorage.setItem('notification_banner_dismissed', 'true');
  showPermissionBanner.value = false;
}

function closeBanner() {
  showPermissionBanner.value = false;
}

// Expose methods for parent components
defineExpose({
  requestPermission,
  subscribe,
  unsubscribe,
  showBanner: () => { showPermissionBanner.value = true; },
});
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
}

.notification-icon svg {
  filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.5));
  animation: bell-ring 2s ease-in-out infinite;
}

@keyframes bell-ring {
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30% {
    transform: rotate(-10deg);
  }
  20%, 40% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(0deg);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translate(-50%, -100%);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.btn-primary {
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
  transform: translateY(-2px);
}

.btn-secondary:hover {
  transform: translateY(-2px);
}
</style>
