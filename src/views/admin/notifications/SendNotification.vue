<template>
  <div class="send-notification-page min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-black text-white mb-2">Push Értesítés Küldése</h1>
        <p class="text-gray-300">Küldj értesítéseket az összes feliratkozott felhasználónak</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="icon-wrapper bg-purple-500/20 p-3 rounded-xl">
              <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Feliratkozók</p>
              <p class="text-white text-2xl font-bold">{{ stats.totalSubscribers }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="icon-wrapper bg-pink-500/20 p-3 rounded-xl">
              <svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Elküldött ma</p>
              <p class="text-white text-2xl font-bold">{{ stats.sentToday }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="icon-wrapper bg-green-500/20 p-3 rounded-xl">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Összes küldés</p>
              <p class="text-white text-2xl font-bold">{{ stats.totalSent }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Form -->
      <div class="glass-card p-8 rounded-3xl mb-8">
        <form @submit.prevent="sendNotification">
          <!-- Title -->
          <div class="mb-6">
            <label class="block text-white font-semibold mb-2">Értesítés címe *</label>
            <input
              v-model="notification.title"
              type="text"
              required
              maxlength="50"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Pl. Fontos bejelentés"
            />
            <p class="text-sm text-gray-400 mt-1">{{ notification.title.length }}/50 karakter</p>
          </div>

          <!-- Body -->
          <div class="mb-6">
            <label class="block text-white font-semibold mb-2">Értesítés szövege *</label>
            <textarea
              v-model="notification.body"
              required
              maxlength="200"
              rows="4"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              placeholder="Ide írhatod az értesítés részletes szövegét..."
            ></textarea>
            <p class="text-sm text-gray-400 mt-1">{{ notification.body.length }}/200 karakter</p>
          </div>

          <!-- Icon URL (Optional) -->
          <div class="mb-6">
            <label class="block text-white font-semibold mb-2">Ikon URL (opcionális)</label>
            <input
              v-model="notification.icon"
              type="url"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="https://example.com/icon.png"
            />
          </div>

          <!-- Action URL -->
          <div class="mb-6">
            <label class="block text-white font-semibold mb-2">Művelet URL (kattintás esetén)</label>
            <input
              v-model="notification.actionUrl"
              type="url"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="https://tsada.edu.rs/news"
            />
          </div>

          <!-- Tag (for grouping) -->
          <div class="mb-6">
            <label class="block text-white font-semibold mb-2">Kategória (tag)</label>
            <select
              v-model="notification.tag"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Nincs kategória</option>
              <option value="announcement">Bejelentés</option>
              <option value="event">Esemény</option>
              <option value="urgent">Sürgős</option>
              <option value="news">Hír</option>
              <option value="reminder">Emlékeztető</option>
            </select>
          </div>

          <!-- Require Interaction -->
          <div class="mb-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="notification.requireInteraction"
                type="checkbox"
                class="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
              />
              <span class="text-white">Megköveteli a felhasználói interakciót (nem tűnik el automatikusan)</span>
            </label>
          </div>

          <!-- Preview -->
          <div class="mb-8">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Előnézet
            </h3>
            <div class="notification-preview bg-white rounded-xl p-4 shadow-lg max-w-md">
              <div class="flex gap-3">
                <img
                  :src="notification.icon || '/favicon.png'"
                  alt="Icon"
                  class="w-12 h-12 rounded-lg"
                  @error="(e) => (e.target as HTMLImageElement).src = '/favicon.png'"
                />
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-gray-900 truncate">{{ notification.title || 'Értesítés címe' }}</h4>
                  <p class="text-sm text-gray-600 line-clamp-2">{{ notification.body || 'Értesítés szövege...' }}</p>
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
              class="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:cursor-not-allowed"
            >
              <span v-if="!isSending" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Értesítés Küldése ({{ stats.totalSubscribers }} felhasználó)
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Küldés folyamatban...
              </span>
            </button>

            <button
              type="button"
              @click="resetForm"
              class="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
            >
              Törlés
            </button>
          </div>
        </form>
      </div>

      <!-- Recent Notifications -->
      <div class="glass-card p-8 rounded-3xl">
        <h2 class="text-2xl font-bold text-white mb-6">Legutóbbi értesítések</h2>

        <div v-if="recentNotifications.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-gray-400">Még nem küldtél értesítéseket</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="notif in recentNotifications"
            :key="notif.$id"
            class="notification-item bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold text-white mb-1">{{ notif.title }}</h4>
                <p class="text-sm text-gray-300 mb-2">{{ notif.body }}</p>
                <div class="flex items-center gap-4 text-xs text-gray-400">
                  <span>{{ formatDate(notif.sent_at) }}</span>
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {{ notif.recipients_count }} felhasználó
                  </span>
                </div>
              </div>
              <span
                v-if="notif.tag"
                class="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium"
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
import { Databases, Query } from 'appwrite';
import { config, appw } from '@/appwrite';
import moment from 'moment';

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
const currentTime = computed(() => moment().format('HH:mm'));

const isFormValid = computed(() => {
  return notification.value.title.trim().length > 0 && notification.value.body.trim().length > 0;
});

onMounted(async () => {
  await loadStats();
  await loadRecentNotifications();
});

async function loadStats() {
  const database = new Databases(appw);

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
    const today = moment().startOf('day').toISOString();
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
  const database = new Databases(appw);

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
    const database = new Databases(appw);

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

    alert('Értesítés sikeresen elküldve!');
    resetForm();
    await loadStats();
    await loadRecentNotifications();
  } catch (error) {
    console.error('Failed to send notification:', error);
    alert('Hiba történt az értesítés küldése közben!');
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
  return moment(dateString).fromNow();
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.notification-preview {
  animation: preview-pulse 2s ease-in-out infinite;
}

@keyframes preview-pulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);
  }
  50% {
    box-shadow: 0 8px 30px rgba(236, 72, 153, 0.4);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
