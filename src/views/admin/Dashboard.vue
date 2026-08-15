<template>
  <div class="page-shell">
    <div class="page-panel container">
      <v-container fluid class="pa-0">
        <div class="page-header-row">
          <div>
            <p class="dash-kicker">{{ $t('admin_panel') }}</p>
            <h1 class="section-title !text-2xl sm:!text-3xl !mb-1">
              {{ userName ? $t('dashboard_welcome_user', { name: userName }) : $t('dashboard') }}
            </h1>
            <div class="section-accent !mb-2"></div>
            <p class="page-subtitle !mt-0">
              {{ $t('dashboard_subtitle') }}
              <v-chip
                v-if="role"
                size="small"
                color="primary"
                variant="tonal"
                class="ml-2"
              >
                {{ $t(role) }}
              </v-chip>
            </p>
          </div>
        </div>

        <!-- Stats -->
        <v-row v-if="showStats" class="mb-2">
          <v-col
            v-for="stat in visibleStats"
            :key="stat.key"
            cols="6"
            md="3"
          >
            <v-card class="dash-stat" :to="stat.to" hover>
              <v-card-text class="d-flex align-center ga-3">
                <div class="dash-stat-icon" :class="stat.tone">
                  <v-icon :icon="stat.icon" size="22" />
                </div>
                <div class="min-w-0">
                  <div class="dash-stat-value">
                    <v-progress-circular
                      v-if="statsLoading"
                      indeterminate
                      size="18"
                      width="2"
                      color="primary"
                    />
                    <template v-else>{{ formatCount(stat.value) }}</template>
                  </div>
                  <div class="dash-stat-label">{{ $t(stat.labelKey) }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Quick access groups -->
        <div
          v-for="group in visibleGroups"
          :key="group.id"
          class="mb-6"
        >
          <h2 class="page-section-title !mb-3">{{ $t(group.titleKey) }}</h2>
          <v-row>
            <v-col
              v-for="item in group.items"
              :key="item.to"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card class="dash-tile h-100" :to="item.to" hover>
                <v-card-text class="d-flex align-start ga-3">
                  <div class="dash-tile-icon" :class="item.tone">
                    <v-icon :icon="item.icon" size="24" />
                  </div>
                  <div class="min-w-0">
                    <div class="dash-tile-title">{{ $t(item.titleKey) }}</div>
                    <div class="dash-tile-desc">{{ $t(item.descKey) }}</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Recent messages -->
        <div v-if="canSeeMessages" class="mb-2">
          <div class="d-flex align-center justify-space-between mb-3">
            <h2 class="page-section-title !mb-0">{{ $t('dashboard_recent_messages') }}</h2>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              to="/admin/messages"
            >
              {{ $t('dashboard_view_all') }}
              <v-icon end size="16">mdi-arrow-right</v-icon>
            </v-btn>
          </div>

          <v-card>
            <v-list v-if="recentMessages.length" lines="two" class="bg-transparent">
              <v-list-item
                v-for="msg in recentMessages"
                :key="msg.id"
                :to="'/admin/message/' + msg.id"
                rounded="lg"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="40">
                    <v-icon>mdi-email-outline</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ msg.name || $t('unknown') }}</v-list-item-title>
                <v-list-item-subtitle>{{ msg.email }}</v-list-item-subtitle>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ formatDate(msg.date) }}</span>
                </template>
              </v-list-item>
            </v-list>
            <div v-else-if="!statsLoading" class="text-center py-8 text-medium-emphasis">
              <v-icon size="40" class="mb-2">mdi-inbox-outline</v-icon>
              <p>{{ $t('dashboard_no_messages') }}</p>
            </div>
            <div v-else class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="32" />
            </div>
          </v-card>
        </div>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Databases, Query } from 'appwrite'
import { appw, config, user as account } from '@/appwrite'
import { useLoadingStore } from '@/stores/loading'
import { countPendingImages } from '@/services/gallery/approval'
import { SITE_MODULES } from '@/services/modules/registry'

type Role = 'admin' | 'editor' | 'teacher' | 'photographer' | 'secretary' | ''

interface DashItem {
  to: string
  titleKey: string
  descKey: string
  icon: string
  tone: string
  roles: Role[]
}

interface DashGroup {
  id: string
  titleKey: string
  items: DashItem[]
}

interface DashStat {
  key: string
  labelKey: string
  icon: string
  tone: string
  to: string
  value: number | null
  roles: Role[]
}

const { locale } = useI18n()
const loadingStore = useLoadingStore()
const databases = new Databases(appw)

const userName = ref('')
const statsLoading = ref(true)
const recentMessages = ref<{ id: string; name: string; email: string; date: string }[]>([])

const role = computed<Role>(() => (loadingStore.userRole as Role) || '')

const canSee = (roles: Role[]) => {
  if (!role.value) return false
  if (role.value === 'admin') return true
  return roles.includes(role.value)
}

const showStats = computed(() => canSee(['admin', 'editor', 'photographer']))
const canSeeMessages = computed(() => canSee(['admin', 'editor', 'secretary']))

const stats = ref<DashStat[]>([
  { key: 'messages', labelKey: 'dashboard_stat_messages', icon: 'mdi-email-outline', tone: 'sky', to: '/admin/messages', value: null, roles: ['admin', 'editor', 'secretary'] },
  { key: 'news', labelKey: 'dashboard_stat_news', icon: 'mdi-newspaper-variant-outline', tone: 'indigo', to: '/admin/news-order', value: null, roles: ['admin', 'editor'] },
  { key: 'galleries', labelKey: 'dashboard_stat_galleries', icon: 'mdi-image-multiple-outline', tone: 'amber', to: '/gallery', value: null, roles: ['admin', 'editor', 'photographer'] },
  { key: 'pending_photos', labelKey: 'dashboard_stat_pending_photos', icon: 'mdi-image-plus', tone: 'rose', to: '/admin/gallery-approval', value: null, roles: ['admin', 'editor'] },
  { key: 'forms', labelKey: 'dashboard_stat_forms', icon: 'mdi-form-select', tone: 'emerald', to: '/admin/forms', value: null, roles: ['admin', 'editor'] },
])

const visibleStats = computed(() => stats.value.filter((s) => canSee(s.roles)))

const registryTiles = SITE_MODULES
  .filter((module) => module.admin)
  .map((module) => ({
    to: module.admin!.to,
    titleKey: module.admin!.titleKey,
    descKey: module.admin!.descKey,
    icon: module.admin!.icon,
    tone: module.admin!.tone,
    roles: module.admin!.roles,
    group: module.admin!.group
  }))

const groups: DashGroup[] = [
  {
    id: 'content',
    titleKey: 'dashboard_content',
    items: [
      { to: '/admin/news-order', titleKey: 'manage_news_order', descKey: 'dash_desc_news', icon: 'mdi-sort', tone: 'indigo', roles: ['admin', 'editor'] },
      { to: '/admin/slide-editor', titleKey: 'presentation_editor', descKey: 'dash_desc_slides', icon: 'mdi-presentation', tone: 'sky', roles: ['admin', 'editor'] },
      { to: '/admin/sponsors', titleKey: 'sponsors_editor', descKey: 'dash_desc_sponsors', icon: 'mdi-handshake-outline', tone: 'amber', roles: ['admin', 'editor'] },
      { to: '/admin/timetable-editor', titleKey: 'tt_editor', descKey: 'dash_desc_timetable', icon: 'mdi-calendar-clock', tone: 'violet', roles: ['admin', 'editor'] },
      { to: '/admin/today', titleKey: 'today_schedule', descKey: 'dash_desc_today', icon: 'mdi-calendar-today', tone: 'amber', roles: ['admin', 'editor', 'secretary'] },
      { to: '/admin/substitutions', titleKey: 'sub_editor', descKey: 'dash_desc_substitutions', icon: 'mdi-account-switch', tone: 'amber', roles: ['admin', 'editor', 'secretary'] },
      { to: '/admin/content-audit', titleKey: 'audit_title', descKey: 'dash_desc_audit', icon: 'mdi-translate', tone: 'sky', roles: ['admin', 'editor'] },
      ...registryTiles.filter((item) => item.group === 'content'),
      { to: '/gallery', titleKey: 'gallery', descKey: 'dash_desc_gallery', icon: 'mdi-image-multiple-outline', tone: 'rose', roles: ['admin', 'editor', 'photographer'] },
    ],
  },
  {
    id: 'communication',
    titleKey: 'dashboard_communication',
    items: [
      { to: '/admin/messages', titleKey: 'messages', descKey: 'dash_desc_messages', icon: 'mdi-email-outline', tone: 'sky', roles: ['admin', 'editor', 'secretary'] },
      { to: '/admin/forms', titleKey: 'forms_management', descKey: 'dash_desc_forms', icon: 'mdi-form-select', tone: 'emerald', roles: ['admin', 'editor'] },
      { to: '/admin/notifications/send', titleKey: 'push_notifications', descKey: 'dash_desc_push', icon: 'mdi-bell-outline', tone: 'amber', roles: ['admin'] },
      { to: '/admin/messaging', titleKey: 'messaging_center', descKey: 'dash_desc_messaging', icon: 'mdi-message-badge-outline', tone: 'indigo', roles: ['admin'] },
    ],
  },
  {
    id: 'school',
    titleKey: 'dashboard_school',
    items: [
      { to: '/admin/erp/class', titleKey: 'erp_class_teacher', descKey: 'dash_desc_class', icon: 'mdi-school-outline', tone: 'sky', roles: ['admin', 'teacher'] },
      { to: '/admin/erp/subjects', titleKey: 'erp_subjects', descKey: 'dash_desc_subjects', icon: 'mdi-book-open-variant', tone: 'emerald', roles: ['admin', 'teacher'] },
      { to: '/admin/erp/study-programs', titleKey: 'erp_study_programs', descKey: 'dash_desc_programs', icon: 'mdi-certificate-outline', tone: 'violet', roles: ['admin', 'teacher'] },
      { to: '/admin/erp/print', titleKey: 'erp_print_manager', descKey: 'dash_desc_print', icon: 'mdi-printer-outline', tone: 'amber', roles: ['admin', 'teacher'] },
      { to: '/admin/erp/template-editor', titleKey: 'erp_template_editor', descKey: 'dash_desc_template', icon: 'mdi-file-document-edit-outline', tone: 'rose', roles: ['admin', 'teacher'] },
      ...registryTiles.filter((item) => item.group === 'school'),
    ],
  },
  {
    id: 'system',
    titleKey: 'dashboard_system',
    items: [
      { to: '/admin/roles', titleKey: 'role_manager', descKey: 'dash_desc_roles', icon: 'mdi-shield-account-outline', tone: 'rose', roles: ['admin'] },
      { to: '/admin/menu-editor', titleKey: 'menu_editor', descKey: 'dash_desc_menu', icon: 'mdi-menu', tone: 'sky', roles: ['admin'] },
      { to: '/admin/modules', titleKey: 'modules_title', descKey: 'dash_desc_modules', icon: 'mdi-toggle-switch-outline', tone: 'amber', roles: ['admin', 'editor'] },
    ],
  },
]

const visibleGroups = computed(() =>
  groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canSee(item.roles)),
    }))
    .filter((group) => group.items.length > 0)
)

function formatCount(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString()
}

function formatDate(dateStr: string): string {
  const localeMap: Record<string, string> = { hu: 'hu-HU', sr: 'sr-RS', rs: 'sr-RS', en: 'en-GB' }
  return new Date(dateStr).toLocaleString(localeMap[locale.value] || 'hu-HU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function countDocuments(collectionId: string): Promise<number | null> {
  try {
    const result = await databases.listDocuments(config.website_db, collectionId, [Query.limit(1)])
    return result.total
  } catch {
    return null
  }
}

onMounted(async () => {
  try {
    const acc = await account.get()
    userName.value = acc.name || acc.email || ''
  } catch {
    userName.value = ''
  }

  if (!showStats.value && !canSeeMessages.value) {
    statsLoading.value = false
    return
  }

  const [messages, news, galleries, forms, pendingPhotos, recent] = await Promise.allSettled([
    canSee(['admin', 'editor', 'secretary']) ? countDocuments(config.mess_coll) : Promise.resolve(null),
    canSee(['admin', 'editor']) ? countDocuments(config.news_db) : Promise.resolve(null),
    canSee(['admin', 'editor', 'photographer']) ? countDocuments(config.gallery) : Promise.resolve(null),
    canSee(['admin', 'editor']) ? countDocuments(config.forms) : Promise.resolve(null),
    canSee(['admin', 'editor']) ? countPendingImages() : Promise.resolve(null),
    canSeeMessages.value
      ? databases.listDocuments(config.website_db, config.mess_coll, [
          Query.orderDesc('$createdAt'),
          Query.limit(5),
        ])
      : Promise.resolve(null),
  ])

  const setStat = (key: string, result: PromiseSettledResult<number | null>) => {
    const stat = stats.value.find((s) => s.key === key)
    if (stat) stat.value = result.status === 'fulfilled' ? result.value : null
  }

  setStat('messages', messages)
  setStat('news', news)
  setStat('galleries', galleries)
  setStat('forms', forms)
  setStat('pending_photos', pendingPhotos)

  if (recent.status === 'fulfilled' && recent.value) {
    recentMessages.value = recent.value.documents.map((doc) => ({
      id: doc.$id,
      name: doc.name || '',
      email: doc.email || '',
      date: doc.$createdAt,
    }))
  }

  statsLoading.value = false
})
</script>

<style scoped>
.dash-kicker {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0284c7;
  margin-bottom: 0.25rem;
}

:global(.dark) .dash-kicker {
  color: #7dd3fc;
}

.dash-stat,
.dash-tile {
  height: 100%;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.dash-stat:hover,
.dash-tile:hover {
  transform: translateY(-2px);
}

.dash-stat-icon,
.dash-tile-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dash-tile-icon {
  width: 2.75rem;
  height: 2.75rem;
}

.dash-stat-icon.sky,
.dash-tile-icon.sky { background: rgba(14, 165, 233, 0.14); color: #0284c7; }
.dash-stat-icon.indigo,
.dash-tile-icon.indigo { background: rgba(99, 102, 241, 0.14); color: #4f46e5; }
.dash-stat-icon.amber,
.dash-tile-icon.amber { background: rgba(245, 158, 11, 0.16); color: #d97706; }
.dash-stat-icon.emerald,
.dash-tile-icon.emerald { background: rgba(16, 185, 129, 0.14); color: #059669; }
.dash-stat-icon.violet,
.dash-tile-icon.violet { background: rgba(139, 92, 246, 0.14); color: #7c3aed; }
.dash-stat-icon.rose,
.dash-tile-icon.rose { background: rgba(244, 63, 94, 0.14); color: #e11d48; }

.dash-stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}

.dash-stat-label,
.dash-tile-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.dash-tile-title {
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.15rem;
}

:global(.dark) .dash-stat-value,
:global(.dark) .dash-tile-title {
  color: #f1f5f9;
}

:global(.dark) .dash-stat-label,
:global(.dark) .dash-tile-desc {
  color: #94a3b8;
}

.min-w-0 {
  min-width: 0;
}

.h-100 {
  height: 100%;
}
</style>
