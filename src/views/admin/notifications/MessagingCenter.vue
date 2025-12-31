<template>
  <div class="messaging-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-black text-white mb-2">📱 Appwrite Messaging Center</h1>
        <p class="text-gray-300">Natív Appwrite Messaging használatával - Push, Email, SMS</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 class="text-white font-semibold">Üzenetek</h3>
          </div>
          <p class="text-3xl font-bold text-white">{{ stats.totalMessages }}</p>
          <p class="text-sm text-gray-400 mt-1">Összes elküldött</p>
        </div>

        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 class="text-white font-semibold">Topics</h3>
          </div>
          <p class="text-3xl font-bold text-white">{{ topics.length }}</p>
          <p class="text-sm text-gray-400 mt-1">Aktív csoportok</p>
        </div>

        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-white font-semibold">Sikeres</h3>
          </div>
          <p class="text-3xl font-bold text-white">{{ stats.successful }}</p>
          <p class="text-sm text-gray-400 mt-1">Kézbesítve</p>
        </div>

        <div class="stat-card glass-card p-6 rounded-2xl">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-white font-semibold">Ütemezett</h3>
          </div>
          <p class="text-3xl font-bold text-white">{{ stats.scheduled }}</p>
          <p class="text-sm text-gray-400 mt-1">Várakozik</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Send Notification Form -->
        <div class="lg:col-span-2">
          <div class="glass-card p-8 rounded-3xl">
            <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Új Értesítés Küldése
            </h2>

            <form @submit.prevent="sendNotification">
              <!-- Notification Type Tabs -->
              <div class="flex gap-2 mb-6">
                <button
                  type="button"
                  v-for="type in notificationTypes"
                  :key="type.value"
                  @click="selectedType = type.value"
                  :class="[
                    'flex-1 px-4 py-3 rounded-lg font-semibold transition-all',
                    selectedType === type.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  ]"
                >
                  {{ type.label }}
                </button>
              </div>

              <!-- Title & Body -->
              <div class="space-y-4 mb-6">
                <div>
                  <label class="block text-white font-semibold mb-2">Cím</label>
                  <input
                    v-model="notification.title"
                    type="text"
                    maxlength="50"
                    class="input-field"
                    placeholder="Értesítés címe..."
                  />
                  <p class="text-sm text-gray-400 mt-1">{{ notification.title.length }}/50</p>
                </div>

                <div>
                  <label class="block text-white font-semibold mb-2">Szöveg</label>
                  <textarea
                    v-model="notification.body"
                    maxlength="200"
                    rows="4"
                    class="input-field resize-none"
                    placeholder="Értesítés szövege..."
                  ></textarea>
                  <p class="text-sm text-gray-400 mt-1">{{ notification.body.length }}/200</p>
                </div>
              </div>

              <!-- Target Selection -->
              <div class="mb-6">
                <label class="block text-white font-semibold mb-2">Címzettek</label>
                <select v-model="notification.targetType" class="input-field">
                  <option value="all">Mindenki (all-users topic)</option>
                  <option value="topic">Meghatározott topic</option>
                  <option value="users">Konkrét felhasználók</option>
                </select>

                <div v-if="notification.targetType === 'topic'" class="mt-3">
                  <select v-model="notification.selectedTopic" class="input-field">
                    <option value="">Válassz topic-ot...</option>
                    <option v-for="topic in topics" :key="topic.$id" :value="topic.$id">
                      {{ topic.name }} ({{ topic.total || 0 }} feliratkozó)
                    </option>
                  </select>
                </div>

                <div v-if="notification.targetType === 'users'" class="mt-3">
                  <input
                    v-model="notification.userIds"
                    type="text"
                    class="input-field"
                    placeholder="User ID-k vesszővel elválasztva..."
                  />
                  <p class="text-sm text-gray-400 mt-1">Példa: user1, user2, user3</p>
                </div>
              </div>

              <!-- Advanced Options -->
              <div class="mb-6">
                <button
                  type="button"
                  @click="showAdvanced = !showAdvanced"
                  class="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <svg
                    class="w-5 h-5 transition-transform"
                    :class="{ 'rotate-90': showAdvanced }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Haladó beállítások
                </button>

                <div v-if="showAdvanced" class="mt-4 space-y-4 p-4 bg-white/5 rounded-xl">
                  <!-- Icon & Sound -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-white text-sm mb-2">Ikon URL</label>
                      <input v-model="notification.icon" type="url" class="input-field" placeholder="https://..." />
                    </div>
                    <div>
                      <label class="block text-white text-sm mb-2">Hang</label>
                      <input v-model="notification.sound" type="text" class="input-field" placeholder="default" />
                    </div>
                  </div>

                  <!-- Priority & Badge -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-white text-sm mb-2">Prioritás (Android)</label>
                      <select v-model="notification.priority" class="input-field">
                        <option value="default">Alap</option>
                        <option value="high">Magas</option>
                        <option value="max">Maximum</option>
                        <option value="low">Alacsony</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-white text-sm mb-2">Badge szám</label>
                      <input v-model.number="notification.badge" type="number" class="input-field" placeholder="0" />
                    </div>
                  </div>

                  <!-- iOS Interruption Level -->
                  <div>
                    <label class="block text-white text-sm mb-2">iOS Interruption Level</label>
                    <select v-model="notification.interruptionLevel" class="input-field">
                      <option value="active">Aktív (alapértelmezett)</option>
                      <option value="time-sensitive">Időérzékeny</option>
                      <option value="critical">Kritikus (Do Not Disturb bypass)</option>
                      <option value="passive">Passzív</option>
                    </select>
                  </div>

                  <!-- Schedule -->
                  <div>
                    <label class="flex items-center gap-2 text-white mb-2">
                      <input v-model="notification.scheduled" type="checkbox" class="checkbox" />
                      Ütemezett küldés
                    </label>
                    <input
                      v-if="notification.scheduled"
                      v-model="notification.scheduledAt"
                      type="datetime-local"
                      class="input-field"
                    />
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-4">
                <button
                  type="submit"
                  :disabled="isSending || !isFormValid"
                  class="flex-1 btn-primary"
                >
                  <span v-if="!isSending">
                    {{ notification.scheduled ? '⏰ Ütemezés' : '📤 Küldés Most' }}
                  </span>
                  <span v-else class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Küldés...
                  </span>
                </button>
                <button type="button" @click="resetForm" class="px-6 py-4 btn-secondary">
                  Törlés
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Sidebar: Topics & Recent Messages -->
        <div class="space-y-6">
          <!-- Topics -->
          <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-xl font-bold text-white mb-4">Topics</h3>
            <div v-if="topics.length === 0" class="text-center py-8 text-gray-400">
              <p>Még nincsenek topics</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="topic in topics"
                :key="topic.$id"
                class="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-white font-semibold">{{ topic.name }}</h4>
                    <p class="text-sm text-gray-400">{{ topic.total || 0 }} feliratkozó</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Messages -->
          <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-xl font-bold text-white mb-4">Legutóbbi</h3>
            <div v-if="recentMessages.length === 0" class="text-center py-8 text-gray-400">
              <p>Még nincsenek üzenetek</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="msg in recentMessages.slice(0, 5)"
                :key="msg.$id"
                class="p-3 bg-white/5 rounded-lg"
              >
                <h4 class="text-white font-semibold text-sm truncate">{{ msg.data?.title || 'Untitled' }}</h4>
                <p class="text-xs text-gray-400">{{ formatDate(msg.$createdAt) }}</p>
                <span
                  :class="[
                    'inline-block mt-2 px-2 py-1 rounded text-xs font-medium',
                    msg.status === 'sent' ? 'bg-green-500/20 text-green-300' :
                    msg.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-gray-500/20 text-gray-300'
                  ]"
                >
                  {{ msg.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { AppwriteMessagingService } from '@/services/notifications/AppwriteMessagingService';
import moment from 'moment';

const messagingService = AppwriteMessagingService.getInstance();

const notificationTypes = [
  { value: 'push', label: '📱 Push' },
  { value: 'email', label: '📧 Email' },
  { value: 'sms', label: '💬 SMS' },
];

const selectedType = ref('push');
const showAdvanced = ref(false);
const isSending = ref(false);

const notification = ref({
  title: '',
  body: '',
  targetType: 'all',
  selectedTopic: '',
  userIds: '',
  icon: '',
  sound: '',
  priority: 'default',
  badge: 0,
  interruptionLevel: 'active',
  scheduled: false,
  scheduledAt: '',
});

const stats = ref({
  totalMessages: 0,
  successful: 0,
  scheduled: 0,
});

const topics = ref<any[]>([]);
const recentMessages = ref<any[]>([]);

const isFormValid = computed(() => {
  return notification.value.title.trim().length > 0 && notification.value.body.trim().length > 0;
});

onMounted(async () => {
  await loadTopics();
  await loadRecentMessages();
  await loadStats();
});

async function loadTopics() {
  try {
    const result = await messagingService.listTopics();
    topics.value = result.topics || [];
  } catch (error) {
    console.error('Failed to load topics:', error);
  }
}

async function loadRecentMessages() {
  try {
    const result = await messagingService.listMessages(10);
    recentMessages.value = result.messages || [];
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

async function loadStats() {
  try {
    const messages = await messagingService.listMessages(100);
    stats.value.totalMessages = messages.total || 0;

    if (messages.messages) {
      stats.value.successful = messages.messages.filter((m: any) => m.status === 'sent').length;
      stats.value.scheduled = messages.messages.filter((m: any) => m.status === 'scheduled').length;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function sendNotification() {
  if (!isFormValid.value) return;

  isSending.value = true;

  try {
    const payload = {
      title: notification.value.title,
      body: notification.value.body,
      icon: notification.value.icon,
      sound: notification.value.sound,
    };

    const options = {
      priority: notification.value.priority as any,
      badge: notification.value.badge,
      interruptionLevel: notification.value.interruptionLevel as any,
      scheduledAt: notification.value.scheduled ? notification.value.scheduledAt : undefined,
    };

    let result;

    if (notification.value.targetType === 'all') {
      result = await messagingService.sendToAll(payload, options);
    } else if (notification.value.targetType === 'topic') {
      result = await messagingService.sendToTopic(notification.value.selectedTopic, payload, options);
    } else if (notification.value.targetType === 'users') {
      const userIds = notification.value.userIds.split(',').map(id => id.trim());
      result = await messagingService.sendToUsers(userIds, payload, options);
    }

    alert('✅ Értesítés sikeresen elküldve!');
    resetForm();
    await loadRecentMessages();
    await loadStats();
  } catch (error: any) {
    console.error('Failed to send notification:', error);
    alert('❌ Hiba történt: ' + (error.message || 'Ismeretlen hiba'));
  } finally {
    isSending.value = false;
  }
}

function resetForm() {
  notification.value = {
    title: '',
    body: '',
    targetType: 'all',
    selectedTopic: '',
    userIds: '',
    icon: '',
    sound: '',
    priority: 'default',
    badge: 0,
    interruptionLevel: 'active',
    scheduled: false,
    scheduledAt: '',
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

.input-field {
  @apply w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all;
}

.btn-primary {
  @apply px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300;
}

.checkbox {
  @apply w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500;
}
</style>
