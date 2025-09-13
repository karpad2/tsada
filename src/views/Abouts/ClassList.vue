<template>
  <section class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800" id="courses">
    <div class="container mx-auto px-6 py-12">
      <!-- Header Section -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
        <div class="mb-6 lg:mb-0">
          <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t("classlist") }}
          </h1>
          <div class="flex items-center space-x-4">
            <div class="h-1 w-24 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full"></div>
            <p class="text-gray-600 dark:text-gray-300">
              
            </p>
          </div>
        </div>
        
        <div v-if="admin" class="flex space-x-4">
          <button
            class="btn-primary-modern"
            :disabled="loading"
            @click="levelUpClasses"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            {{ $t("level_up_classes") }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24">
        <div class="loading-spinner"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400 text-lg">{{ $t("loading") }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-card">
        <svg class="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <p class="text-red-600 dark:text-red-400 text-lg font-medium">{{ error }}</p>
      </div>

      <!-- Classes Grid -->
      <div v-else class="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <!-- Add New Class Card -->
        <div v-if="admin" @click="new_stuff" class="add-class-card group">
          <div class="add-class-content">
            <div class="add-class-icon">
              <svg class="w-12 h-12 text-gray-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-700 group-hover:text-white transition-colors duration-300">
              {{ $t("add_new_class") }}
            </h3>
            <p class="text-gray-500 group-hover:text-gray-200 transition-colors duration-300">
              {{ $t("create_new_class_description") }}
            </p>
          </div>
        </div>

        <!-- Class Cards -->
        <div
          v-for="_class in classes"
          :key="_class.id"
          class="class-card group"
          :class="getCardColor(_class.role)"
        >
          <!-- Card Header -->
          <div class="class-card-header">
            <div class="class-year-badge" v-if="false">
              {{ roman_number(_class.year) }}-{{ _class.designation }}
            </div>
            <div v-if="admin" class="class-card-menu">
              <button
                @click.stop="classopen(_class.id)"
                class="edit-btn"
                :disabled="loading"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Card Content -->
          <div class="class-card-content">
            <h3 class="class-title">
              {{ roman_number(_class.year) }}-{{ _class.designation }} {{ $t("class") }}
            </h3>
            
            <div class="class-info">
              <div class="info-item">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H10a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">{{ _class.role }}</span>
              </div>

              <div class="info-item">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t("masterchief") }}:</span>
                  <span class="text-gray-700 dark:text-gray-300 font-medium">{{ _class.chief }}</span>
                </div>
              </div>

              <div class="info-item">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                </svg>
                <div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t("teaching_language") }}:</span>
                  <span class="language-badge" :class="getLanguageBadgeColor(_class.language)">
                    <span v-if="_class.language === 'class_hun'">{{ $t("hun_teaching") }}</span>
                    <span v-else-if="_class.language === 'class_srb'">{{ $t("srb_teaching") }}</span>
                    <span v-else>{{ $t("unknown_language") }}</span>
                  </span>
                </div>
              </div>

              <!-- Receiving Schedules Section -->
              <div v-if="_class.receiving_schedules && _class.receiving_schedules.length > 0" class="info-item">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="w-full">
                  <span class="text-sm text-gray-500 dark:text-gray-400 mb-2 block">{{ $t("classroom_chief_receiving_hour") }}:</span>
                  <div class="space-y-2">
                    <div v-for="(schedule, idx) in _class.receiving_schedules" :key="idx" 
                         class="bg-white/50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200/50 dark:border-gray-600/50">
                      <div class="flex justify-between items-start">
                        <div class="flex-grow">
                          <p class="text-gray-900 dark:text-white font-medium text-sm">
                            {{ getDayName(schedule.day) }}
                          </p>
                          <p class="text-gray-600 dark:text-gray-300 text-xs">
                            {{ getPeriodName(schedule.period) }}
                          </p>
                          <p v-if="schedule.location" class="text-sky-600 dark:text-sky-400 text-xs mt-1 flex items-center">
                            📍 {{ schedule.location }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fallback for old receiving_hour format -->
              <div v-else-if="_class.receiving_hour" class="info-item">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t("classroom_chief_receiving_hour") }}:</span>
                  <span class="text-gray-700 dark:text-gray-300 font-mono">{{ _class.receiving_hour }}</span>
                </div>
              </div>

              <!-- No receiving hours message -->
              <div v-else class="info-item">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-gray-500 dark:text-gray-400 text-sm italic">
                  {{ $t('no_receiving_hours') || 'Nincs megadott fogadóóra' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Databases, ID, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { convertifserbian } from "@/lang";
import { useLoadingStore } from "@/stores/loading";

interface Schedule {
  day: string;
  period: string;
  location: string;
}

interface Class {
  id: string;
  year: number;
  designation: string;
  role: string;
  chief: string;
  language: string;
  receiving_hour: string;
  receiving_schedules: Schedule[];
}

export default {
  name: 'ClassList',
  data: () => ({
    admin: false,
    classes: [] as Class[],
    loading: false,
    error: null as string | null,
    dayNames: {
      hu: {
        monday: 'Hétfő',
        tuesday: 'Kedd',
        wednesday: 'Szerda',
        thursday: 'Csütörtök',
        friday: 'Péntek'
      },
      rs: {
        monday: 'Понедељак',
        tuesday: 'Уторак',
        wednesday: 'Среда',
        thursday: 'Четвртак',
        friday: 'Петак'
      },
      en: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday'
      }
    },
    periodNames: {
      hu: {
        period_1: '1. óra (6:40-7:25)',
        period_2: '2. óra (7:30-8:15)',
        period_3: '3. óra (8:20-9:05)',
        period_4: '4. óra (9:20-10:05)',
        period_5: '5. óra (10:10-10:55)',
        period_6: '6. óra (11:00-11:40)',
        period_7: '7. óra (11:45-12:25)',
        period_8: '8. óra (12:30-13:10)',
        afternoon_1: '1. délutáni óra (13:15-14:00)',
        afternoon_2: '2. délutáni óra (14:05-14:50)',
        afternoon_3: '3. délutáni óra (14:55-15:40)',
        afternoon_4: '4. délutáni óra (15:55-16:35)',
        afternoon_5: '5. délutáni óra (16:40-17:20)',
        afternoon_6: '6. délutáni óra (17:25-18:05)',
        afternoon_7: '7. délutáni óra (18:10-18:50)',
        afternoon_8: '8. délutáni óra (18:55-19:35)'
      },
      rs: {
        period_1: '1. час (6:40-7:25)',
        period_2: '2. час (7:30-8:15)',
        period_3: '3. час (8:20-9:05)',
        period_4: '4. час (9:20-10:05)',
        period_5: '5. час (10:10-10:55)',
        period_6: '6. час (11:00-11:40)',
        period_7: '7. час (11:45-12:25)',
        period_8: '8. час (12:30-13:10)',
        afternoon_1: '1. поподневни час (13:15-14:00)',
        afternoon_2: '2. поподневни час (14:05-14:50)',
        afternoon_3: '3. поподневни час (14:55-15:40)',
        afternoon_4: '4. поподневни час (15:55-16:35)',
        afternoon_5: '5. поподневни час (16:40-17:20)',
        afternoon_6: '6. поподневни час (17:25-18:05)',
        afternoon_7: '7. поподневни час (18:10-18:50)',
        afternoon_8: '8. поподневни час (18:55-19:35)'
      },
      en: {
        period_1: '1st period (6:40-7:25)',
        period_2: '2nd period (7:30-8:15)',
        period_3: '3rd period (8:20-9:05)',
        period_4: '4th period (9:20-10:05)',
        period_5: '5th period (10:10-10:55)',
        period_6: '6th period (11:00-11:40)',
        period_7: '7th period (11:45-12:25)',
        period_8: '8th period (12:30-13:10)',
        afternoon_1: '1st afternoon period (13:15-14:00)',
        afternoon_2: '2nd afternoon period (14:05-14:50)',
        afternoon_3: '3rd afternoon period (14:55-15:40)',
        afternoon_4: '4th afternoon period (15:55-16:35)',
        afternoon_5: '5th afternoon period (16:40-17:20)',
        afternoon_6: '6th afternoon period (17:25-18:05)',
        afternoon_7: '7th afternoon period (18:10-18:50)',
        afternoon_8: '8th afternoon period (18:55-19:35)'
      }
    }
  }),
  mounted() {
    document.title = this.$t("classlist");
    const cc = useLoadingStore();
    this.admin = cc.userLoggedin;
    this.fetchClasses();
  },
  methods: {
    getDayName(dayKey: string): string {
      const loadingStore = useLoadingStore();
      const lang = loadingStore.language || 'hu';
      const langKey = lang === 'sr' ? 'rs' : lang;
      return this.dayNames[langKey]?.[dayKey] || dayKey;
    },

    getPeriodName(periodKey: string): string {
      const loadingStore = useLoadingStore();
      const lang = loadingStore.language || 'hu';
      const langKey = lang === 'sr' ? 'rs' : lang;
      return this.periodNames[langKey]?.[periodKey] || periodKey;
    },

    async fetchClasses() {
      this.loading = true;
      this.error = null;
      const db = new Databases(appw);
      const store = useLoadingStore();
      const locale = store.language;

      try {
        const response = await db.listDocuments(
          config.website_db,
          config.classlist,
          [Query.orderAsc("year"), Query.orderAsc("designation")]
        );

        this.classes = response.documents.map(doc => {
          // Fogadóórák feldolgozása
          let receiving_schedules: Schedule[] = [];
          try {
            if (doc.receiving_schedules && typeof doc.receiving_schedules === 'string') {
              receiving_schedules = JSON.parse(doc.receiving_schedules);
            } else if (Array.isArray(doc.receiving_schedules)) {
              receiving_schedules = doc.receiving_schedules;
            }
          } catch (e) {
            console.log('Receiving schedules parsing hiba:', e);
            receiving_schedules = [];
          }

          return {
            id: doc.$id,
            year: doc.year,
            designation: doc.designation,
            role:
              (locale === "hu" && doc.courses?.title_hu) ||
              (["rs", "sr"].includes(locale) && doc.courses?.title_rs) ||
              doc.courses?.title_en ||
              "",
            chief:
              (locale === "hu" && doc.workers?.worker_name_hu) ||
              (["rs", "sr"].includes(locale) && convertifserbian(doc.workers?.worker_name_rs)) ||
              doc.workers?.worker_name_hu ||
              "",
            language: doc.language,
            receiving_hour: doc.receiving_hour || "",
            receiving_schedules: receiving_schedules,
          };
        });
      } catch (err) {
        this.error = this.$t("fetch_error");
        console.error("Failed to fetch classes:", err);
      } finally {
        this.loading = false;
      }
    },

    async new_stuff() {
      this.loading = true;
      this.error = null;
      const db = new Databases(appw);
      try {
        const newDoc = await db.createDocument(config.website_db, config.classlist, ID.unique(), { year: 1 });
        await this.$router.push(`/admin/class-edit/${newDoc.$id}`);
      } catch (err) {
        this.error = this.$t("create_error");
        console.error("Failed to create class:", err);
      } finally {
        this.loading = false;
      }
    },

    async levelUpClasses() {
      this.loading = true;
      this.error = null;
      const db = new Databases(appw);
      try {
        const response = await db.listDocuments(config.website_db, config.classlist);
        const classesToUpdate: Class[] = [];
        const classesToDelete: string[] = [];

        for (const doc of response.documents) {
          const currentYear = doc.year;
          if (currentYear >= 4) {
            classesToDelete.push(doc.$id);
          } else {
            classesToUpdate.push({
              id: doc.$id,
              year: currentYear + 1,
              designation: doc.designation,
              role: doc.courses?.title_hu || doc.courses?.title_rs || doc.courses?.title_en || "",
              chief: doc.workers?.worker_name_hu || convertifserbian(doc.workers?.worker_name_rs) || "",
              language: doc.language,
              receiving_hour: doc.receiving_hour || "",
              receiving_schedules: [],
            });
          }
        }

        for (const classItem of classesToUpdate) {
          await db.updateDocument(config.website_db, config.classlist, classItem.id, { year: classItem.year });
        }

        for (const classId of classesToDelete) {
          await db.deleteDocument(config.website_db, config.classlist, classId);
        }

        await this.fetchClasses();
      } catch (err) {
        this.error = this.$t("level_up_error");
        console.error("Failed to level up classes:", err);
      } finally {
        this.loading = false;
      }
    },

    async classopen(id: string) {
      if (this.admin && !this.loading) {
        try {
          await this.$router.push(`/admin/class-edit/${id}`);
        } catch (err) {
          this.error = this.$t("navigation_error");
          console.error("Navigation failed:", err);
        }
      }
    },

    roman_number(n: number): string {
      const numerals = ["", "I", "II", "III", "IV"];
      return numerals[n] || "Hiba";
    },

    getCardColor(role: string): string {
      if (!role) return "card-default";
      const colorClasses = [
        "card-blue",
        "card-green", 
        "card-purple",
        "card-orange",
        "card-pink",
        "card-cyan",
        "card-yellow",
        "card-red",
        "card-indigo",
        "card-teal"
      ];
      const hash = this.hashString(role.toLowerCase());
      const index = hash % colorClasses.length;
      return colorClasses[index];
    },

    getLanguageBadgeColor(language: string): string {
      switch (language) {
        case 'class_hun': return 'badge-hungarian';
        case 'class_srb': return 'badge-serbian';
        default: return 'badge-unknown';
      }
    },

    hashString(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    },
  },
};
</script>

<style scoped>
/* Button Styles */
.btn-primary-modern {
  @apply inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}

/* Loading Animation */
.loading-spinner {
  @apply w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin;
}

/* Error Card */
.error-card {
  @apply flex flex-col items-center justify-center py-16 px-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800;
}

/* Add New Class Card */
.add-class-card {
  @apply relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-80;
}

.add-class-content {
  @apply flex flex-col items-center justify-center h-full p-8 text-center space-y-4;
}

.add-class-icon {
  @apply w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-110;
}

/* Class Cards */
.class-card {
  @apply relative overflow-hidden rounded-2xl backdrop-blur-sm border border-white/20 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 min-h-80 cursor-pointer;
}

.class-card::before {
  @apply absolute inset-0 bg-gradient-to-br opacity-10 pointer-events-none;
  content: '';
}

.class-card-header {
  @apply flex items-start justify-between p-6 pb-0;
}

.class-year-badge {
  @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white shadow-lg backdrop-blur-sm;
}

.class-card-menu {
  @apply opacity-0 group-hover:opacity-100 transition-opacity duration-200;
}

.edit-btn {
  @apply p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 shadow-md hover:shadow-lg backdrop-blur-sm;
}

.class-card-content {
  @apply p-6 pt-4;
}

.class-title {
  @apply text-xl font-bold text-gray-800 dark:text-white mb-6;
}

.class-info {
  @apply space-y-4;
}

.info-item {
  @apply flex items-start space-x-3;
}

.info-item > div {
  @apply flex flex-col;
}

.language-badge {
  @apply inline-flex px-2 py-1 rounded-md text-xs font-medium;
}

.badge-hungarian {
  @apply bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400;
}

.badge-serbian {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400;
}

.badge-unknown {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300;
}

/* Color Variants */
.card-default { @apply bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900; }
.card-blue { @apply bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40; }
.card-green { @apply bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40; }
.card-purple { @apply bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40; }
.card-orange { @apply bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40; }
.card-pink { @apply bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/40; }
.card-cyan { @apply bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/40 dark:to-cyan-800/40; }
.card-yellow { @apply bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40; }
.card-red { @apply bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40; }
.card-indigo { @apply bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40; }
.card-teal { @apply bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/40; }

/* Responsive Design */
@media (max-width: 768px) {
  .class-card {
    @apply min-h-64;
  }
  
  .add-class-card {
    @apply min-h-48;
  }
  
  .add-class-content {
    @apply p-6;
  }
  
  .add-class-icon {
    @apply w-16 h-16;
  }
}
</style>