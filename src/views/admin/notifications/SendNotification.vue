<template>
  <div class="send-notification-page page-shell py-8 px-4">
    <div class="page-panel container max-w-4xl admin-dark-form">
      <!-- Header -->
      <div class="page-header">
        <h1 class="section-title">{{ $t('send_push_notification') }}</h1>
        <div class="section-accent"></div>
        <p class="page-subtitle">{{ $t('send_push_description') }}</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="icon-wrapper bg-sky-500/15 p-3 rounded-xl">
              <svg class="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t('subscribers') }}</p>
              <p class="text-gray-900 dark:text-white text-2xl font-bold">{{ stats.totalSubscribers }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="icon-wrapper bg-sky-500/15 p-3 rounded-xl">
              <svg class="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t('sent_today') }}</p>
              <p class="text-gray-900 dark:text-white text-2xl font-bold">{{ stats.sentToday }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="icon-wrapper bg-emerald-500/15 p-3 rounded-xl">
              <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t('total_sent') }}</p>
              <p class="text-gray-900 dark:text-white text-2xl font-bold">{{ stats.totalSent }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Form -->
      <div class="glass rounded-2xl p-8 mb-8">
        <form @submit.prevent="sendNotification">
          <!-- Title -->
          <div class="mb-6">
            <label class="block text-gray-900 dark:text-white font-semibold mb-2">{{ $t('notification_title') }} *</label>
            <input
              v-model="notification.title"
              type="text"
              required
              maxlength="50"
              class="page-input w-full"
              :placeholder="$t('notification_title_placeholder')"
            />
            <p class="text-sm text-gray-500 mt-1">{{ notification.title.length }}/50</p>
          </div>

          <!-- Body -->
          <div class="mb-6">
            <label class="block text-gray-900 dark:text-white font-semibold mb-2">{{ $t('notification_body') }} *</label>
            <textarea
              v-model="notification.body"
              required
              maxlength="200"
              rows="4"
              class="page-input w-full resize-none"
              :placeholder="$t('notification_body_placeholder')"
            ></textarea>
            <p class="text-sm text-gray-400 mt-1">{{ notification.body.length }}/200</p>
          </div>

          <!-- Icon URL (Optional) -->
          <div class="mb-6">
            <label class="block text-gray-900 dark:text-white font-semibold mb-2">{{ $t('icon_url_optional') }}</label>
            <input
              v-model="notification.icon"
              type="url"
              class="page-input w-full"
              placeholder="https://example.com/icon.png"
            />
          </div>

          <!-- Action URL -->
          <div class="mb-6">
            <label class="block text-gray-900 dark:text-white font-semibold mb-2">{{ $t('action_url') }}</label>
            <input
              v-model="notification.actionUrl"
              type="url"
              class="page-input w-full"
              placeholder="https://tsada.edu.rs/news"
            />
          </div>

          <!-- Tag (for grouping) -->
          <div class="mb-6">
            <label class="block text-gray-900 dark:text-white font-semibold mb-2">{{ $t('notification_category') }}</label>
            <select
              v-model="notification.tag"
              class="page-input w-full"
            >
              <option value="">{{ $t('no_category') }}</option>
              <option value="announcement">{{ $t('announcement') }}</option>
              <option value="event">{{ $t('event') }}</option>
              <option value="urgent">{{ $t('urgent') }}</option>
              <option value="news">{{ $t('news') }}</option>
              <option value="reminder">{{ $t('reminder') }}</option>
            </select>
          </div>

          <!-- Require Interaction -->
          <div class="mb-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="notification.requireInteraction"
                type="checkbox"
                class="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
              />
              <span class="text-gray-900 dark:text-white">{{ $t('require_interaction') }}</span>
            </label>
          </div>

          <!-- Preview -->
          <div class="mb-8">
            <h3 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ $t('preview') }}
            </h3>
            <div class="notification-preview glass-card rounded-xl p-4 max-w-md">
              <div class="flex gap-3">
                <img
                  :src="notification.icon || '/favicon.png'"
                  alt="Icon"
                  class="w-12 h-12 rounded-lg"
                  @error="(e) => (e.target as HTMLImageElement).src = '/favicon.png'"
                />
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-gray-900 dark:text-white truncate">{{ notification.title || $t('notification_title') }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{{ notification.body || $t('notification_body') + '...' }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ currentTime }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="isSending || !isFormValid"
              class="flex-1 glass-btn px-6 py-4 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isSending" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {{ $t('send_notification') }} ({{ stats.totalSubscribers }})
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('sending') }}
              </span>
            </button>

            <button
              type="button"
              @click="resetForm"
              class="px-6 py-4 btn-ghost-glass rounded-xl font-semibold"
            >
              {{ $t('delete') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Recent Notifications -->
      <div class="glass-card p-8 rounded-3xl">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">{{ $t('recent_notifications') }}</h2>

        <div v-if="recentNotifications.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400">{{ $t('no_notifications_sent') }}</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="notif in recentNotifications"
            :key="notif.$id"
            class="notification-item glass rounded-xl p-4 hover:border-sky-300 transition-all"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-1">{{ notif.title }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">{{ notif.body }}</p>
                <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ formatDate(notif.sent_at) }}</span>
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {{ notif.recipients_count }} {{ $t('persons') }}
                  </span>
                </div>
              </div>
              <span
                v-if="notif.tag"
                class="glass-badge px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ notif.tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { notify } from '@kyvg/vue3-notification';
import { Databases, Query } from 'appwrite';
import { config, appw } from '@/appwrite';

const database = new Databases(appw);
import dayjs from '@/utils/dayjs';

const { t } = useI18n();

interface NotificationForm {
  title: string;
  body: string;
  icon: string;
  actionUrl: string;
  tag: string;
  requireInteraction: boolean;
}

const notification = ref<NotificationForm>({
  title: '',
  body: '',
  icon: '',
  actionUrl: '',
  tag: '',
  requireInteraction: false,
});

const stats = ref({
  totalSubscribers: 0,
  sentToday: 0,
  totalSent: 0,
});

const recentNotifications = ref<any[]>([]);
const isSending = ref(false);
const currentTime = computed(() => dayjs().format('HH:mm'));

const isFormValid = computed(() => {
  return notification.value.title.trim().length > 0 && notification.value.body.trim().length > 0;
});

onMounted(async () => {
  await loadStats();
  await loadRecentNotifications();
});

async function loadStats() {


  try {
    // Get total subscribers
    const subscriptions = await database.listDocuments(
      config.website_db,
      config.push_subscriptions || 'push_subscriptions'
    );
    stats.value.totalSubscribers = subscriptions.total;

    // Get sent notifications
    const notifications = await database.listDocuments(
      config.website_db,
      config.push_notifications_log || 'push_notifications_log'
    );
    stats.value.totalSent = notifications.total;

    // Get today's sent count
    const today = dayjs().startOf('day').toISOString();
    const todayNotifications = await database.listDocuments(
      config.website_db,
      config.push_notifications_log || 'push_notifications_log',
      [Query.greaterThanEqual('sent_at', today)]
    );
    stats.value.sentToday = todayNotifications.total;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function loadRecentNotifications() {


  try {
    const result = await database.listDocuments(
      config.website_db,
      config.push_notifications_log || 'push_notifications_log',
      [Query.orderDesc('sent_at'), Query.limit(10)]
    );
    recentNotifications.value = result.documents;
  } catch (error) {
    console.error('Failed to load recent notifications:', error);
  }
}

async function sendNotification() {
  if (!isFormValid.value) return;

  isSending.value = true;

  try {
  

    // Save notification to log
    await database.createDocument(
      config.website_db,
      config.push_notifications_log || 'push_notifications_log',
      'unique()',
      {
        title: notification.value.title,
        body: notification.value.body,
        icon: notification.value.icon || '/favicon.png',
        action_url: notification.value.actionUrl,
        tag: notification.value.tag,
        require_interaction: notification.value.requireInteraction,
        recipients_count: stats.value.totalSubscribers,
        sent_at: new Date().toISOString(),
      }
    );

    // TODO: Here you would call your backend API to actually send the push notifications
    // This would typically be a serverless function or backend service that uses
    // the Web Push protocol to send notifications to all subscribed devices

    notify({ type: 'success', text: t('notification_sent_success') });
    resetForm();
    await loadStats();
    await loadRecentNotifications();
  } catch (error) {
    console.error('Failed to send notification:', error);
    notify({ type: 'error', text: t('notification_sent_error') });
  } finally {
    isSending.value = false;
  }
}

function resetForm() {
  notification.value = {
    title: '',
    body: '',
    icon: '',
    actionUrl: '',
    tag: '',
    requireInteraction: false,
  };
}

function formatDate(dateString: string) {
  return dayjs(dateString).fromNow();
}
</script>

<style scoped>
.notification-preview {
  animation: preview-pulse 2s ease-in-out infinite;
}

@keyframes preview-pulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(14, 165, 233, 0.2);
  }
  50% {
    box-shadow: 0 8px 30px rgba(56, 189, 248, 0.3);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
