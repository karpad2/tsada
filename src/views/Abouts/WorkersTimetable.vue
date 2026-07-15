<template>
  <section class="page-shell transition-colors duration-300">
    <div class="page-panel container">
      <div class="page-header">
        <h1 id="render_title" class="section-title !text-2xl sm:!text-3xl">
          {{ $t('teachers_receiving_hour') }}
        </h1>
        <div class="section-accent !w-20"></div>
      </div>

      <div v-if="loaded" v-for="role in roles" :key="role.id" class="popups mb-8">
        <h2 class="page-section-title">
          {{ role.role }}
        </h2>
        
        <!-- Táblázatos megjelenítés desktop-on -->
        <div class="hidden md:block page-table-wrap overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr>
                <th>
                  
                </th>
                
                <th>
                  {{ $t('p_receiving_hour') }}
                </th>
                <th>
                  {{ $t('u_receiving_hour') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="worker in role.workers" :key="worker.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img class="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600" :src="worker.img" :alt="worker.name">
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ worker.name }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4">
                  <div v-if="worker.p_receiving_schedules && worker.p_receiving_schedules.length > 0">
                    <div v-for="(schedule, idx) in worker.p_receiving_schedules" :key="'p_' + idx" class="mb-2 text-sm">
                      <div v-if="schedule.legacy_text" class="text-gray-700 dark:text-gray-300">
                        {{ schedule.legacy_text }}
                      </div>
                      <div v-else class="flex flex-col">
                        <span class="font-medium text-blue-600 dark:text-blue-400">
                          {{ getDayName(schedule.day) }}
                        </span>
                        <span class="text-gray-700 dark:text-gray-300">
                          {{ getPeriodName(schedule.period) }}
                        </span>
                        <span v-if="schedule.location" class="text-xs text-gray-500 dark:text-gray-400">
                          📍 {{ schedule.location }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400">---</div>
                </td>
                <td class="px-6 py-4">
                  <div v-if="worker.u_receiving_schedules && worker.u_receiving_schedules.length > 0">
                    <div v-for="(schedule, idx) in worker.u_receiving_schedules" :key="'u_' + idx" class="mb-2 text-sm">
                      <div v-if="schedule.legacy_text" class="text-gray-700 dark:text-gray-300">
                        {{ schedule.legacy_text }}
                      </div>
                      <div v-else class="flex flex-col">
                        <span class="font-medium text-green-600 dark:text-green-400">
                          {{ getDayName(schedule.day) }}
                        </span>
                        <span class="text-gray-700 dark:text-gray-300">
                          {{ getPeriodName(schedule.period) }}
                        </span>
                        <span v-if="schedule.location" class="text-xs text-gray-500 dark:text-gray-400">
                          📍 {{ schedule.location }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400">---</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Kártya megjelenítés mobilra -->
        <div class="md:hidden space-y-4">
          <div v-for="worker in role.workers" :key="'card_' + worker.id" 
               class="glass-card p-4 rounded-2xl">
            <div class="flex items-center mb-3">
              <img class="h-12 w-12 rounded-full object-cover ring-2 ring-sky-400/30" :src="worker.img" :alt="worker.name">
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ worker.name }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ worker.contact || '---' }}</p>
              </div>
            </div>
            
            <!-- Pedagógus fogadóóra -->
            <div v-if="worker.p_receiving_schedules && worker.p_receiving_schedules.length > 0" class="mb-3">
              <h4 class="text-sm font-medium text-sky-600 dark:text-sky-400 mb-2 glass-badge px-2 py-1 rounded-lg">
                {{ $t('p_receiving_hour') }}
              </h4>
              <div v-for="(schedule, idx) in worker.p_receiving_schedules" :key="'mobile_p_' + idx" 
                   class="mb-1 text-sm text-gray-700 ">
                <div v-if="schedule.legacy_text">
                  {{ schedule.legacy_text }}
                </div>
                <div v-else>
                  <div class="flex justify-between">
                    <span class="font-medium">{{ getDayName(schedule.day) }}</span>
                    <span>{{ getPeriodName(schedule.period) }}</span>
                  </div>
                  <div v-if="schedule.location" class="text-xs text-gray-500 mt-1">
                    📍 {{ schedule.location }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Ügyfélszolgálati fogadóóra -->
            <div v-if="worker.u_receiving_schedules && worker.u_receiving_schedules.length > 0">
              <h4 class="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2 glass-badge !bg-emerald-500/15 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500/25 px-2 py-1 rounded-lg">
                {{ $t('u_receiving_hour') }}
              </h4>
              <div v-for="(schedule, idx) in worker.u_receiving_schedules" :key="'mobile_u_' + idx" 
                   class="mb-1 text-sm text-gray-700 ">
                <div v-if="schedule.legacy_text">
                  {{ schedule.legacy_text }}
                </div>
                <div v-else>
                  <div class="flex justify-between">
                    <span class="font-medium">{{ getDayName(schedule.day) }}</span>
                    <span>{{ getPeriodName(schedule.period) }}</span>
                  </div>
                  <div v-if="schedule.location" class="text-xs text-gray-500  mt-1">
                    📍 {{ schedule.location }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Databases, Storage, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { convertifserbian } from '@/lang';

const database = new Databases(appw);
const storage = new Storage(appw);
import { useLoadingStore } from '@/stores/loading';
interface Schedule {
  day: string;
  period: string;
  location: string;
  legacy_text?: string;
}

interface Worker {
  id: string;
  name: string;
  contact: string;
  img: string;
  p_receiving_schedules: Schedule[];
  u_receiving_schedules: Schedule[];
}

interface Role {
  id: string;
  role: string;
  workers: Worker[];
}

export default defineComponent({
  name: 'WorkersTimetable',
  data() {
    return {
      roles: [] as Role[],
      loaded: false,
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
    };
  },
  async mounted() {
    document.title = this.$t('teachers_receiving_hour');

    import('gsap').then(({ default: gsap }) => {
      gsap.fromTo(
        '#render_title',
        { opacity: 0, x: 50 },
        { duration: 1, opacity: 1, x: 0, ease: 'power2.out' }
      );
    });

    try {
      await this.loadWorkers();
      import('gsap').then(({ default: gsap }) => {
        gsap.fromTo(
          '.popups',
          { opacity: 0, y: 20 },
          { duration: 0.8, opacity: 1, y: 0, stagger: 0.2, ease: 'power2.out' }
        );
      });
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  },
  methods: {
    getDayName(dayKey: string): string {
      if (dayKey === 'legacy') return '';
      const loadingStore = useLoadingStore();
      const lang = loadingStore.language || 'hu';
      const langKey = lang === 'sr' ? 'rs' : lang;
      return this.dayNames[langKey]?.[dayKey] || dayKey;
    },

    getPeriodName(periodKey: string): string {
      if (periodKey === 'legacy') return '';
      const loadingStore = useLoadingStore();
      const lang = loadingStore.language || 'hu';
      const langKey = lang === 'sr' ? 'rs' : lang;
      return this.periodNames[langKey]?.[periodKey] || periodKey;
    },

    async loadWorkers() {
      const loadingStore = useLoadingStore();
      const local = loadingStore.language;

      try {
        const missingPicture = storage
          .getFilePreview(config.website_images, config.missing_worker_picture, 160, 160, 'center', 75)
          .toString();

        // 2 queries instead of 1 + N roles
        const [rolesRes, workersRes] = await Promise.all([
          database.listDocuments(config.website_db, config.roles_db, [
            Query.orderAsc('listasorrend'),
            Query.equal('has_receiving_hour', true),
            Query.limit(100),
          ]),
          database.listDocuments(config.website_db, config.workers, [
            Query.limit(100),
          ]),
        ]);

        let allWorkerDocs = [...workersRes.documents];
        if (workersRes.total > allWorkerDocs.length) {
          const pages = Math.ceil(Math.min(workersRes.total, 500) / 100);
          for (let p = 1; p < pages; p++) {
            const page = await database.listDocuments(config.website_db, config.workers, [
              Query.limit(100),
              Query.offset(p * 100),
            ]);
            allWorkerDocs.push(...page.documents);
          }
        }

        this.roles = [];
        for (const roleDoc of rolesRes.documents) {
          const roleId = roleDoc.$id;
          let roleName = '';
          if (local === 'en') roleName = roleDoc.role_en;
          else if (local === 'hu') roleName = roleDoc.role_hu;
          else if (local === 'rs' || local === 'sr') roleName = convertifserbian(roleDoc.role_rs);

          const roleWorkers = allWorkerDocs.filter((worker) => {
            const roles = worker.roles;
            if (!roles) return false;
            if (Array.isArray(roles)) {
              return roles.some((r: any) => r === roleId || r?.$id === roleId);
            }
            return roles === roleId || roles?.$id === roleId;
          });

          const workers = roleWorkers.map((worker) => {
            let p_receiving_schedules = [];
            let u_receiving_schedules = [];
            
            // Try parsing new JSON format
            try {
              if (worker.p_receiving_schedules && typeof worker.p_receiving_schedules === 'string' && worker.p_receiving_schedules.trim() !== '') {
                p_receiving_schedules = JSON.parse(worker.p_receiving_schedules);
              }
            } catch (e) {
              console.warn('Error parsing p_receiving_schedules:', e);
            }
            
            try {
              if (worker.u_receiving_schedules && typeof worker.u_receiving_schedules === 'string' && worker.u_receiving_schedules.trim() !== '') {
                u_receiving_schedules = JSON.parse(worker.u_receiving_schedules);
              }
            } catch (e) {
              console.warn('Error parsing u_receiving_schedules:', e);
            }

            // Fallback to old format if no new data
            if (p_receiving_schedules.length === 0 && worker.p_receiving_hour && worker.p_receiving_hour !== '---' && worker.p_receiving_hour.trim() !== '') {
              p_receiving_schedules = [{
                day: 'legacy',
                period: 'legacy',
                location: '',
                legacy_text: worker.p_receiving_hour
              }];
            }
            
            if (u_receiving_schedules.length === 0 && worker.u_receiving_hour && worker.u_receiving_hour !== '---' && worker.u_receiving_hour.trim() !== '') {
              u_receiving_schedules = [{
                day: 'legacy',
                period: 'legacy',
                location: '',
                legacy_text: worker.u_receiving_hour
              }];
            }

            return {
              id: worker.$id,
              name: local === 'en' || local === 'hu' ? worker.worker_name_hu : convertifserbian(worker.worker_name_rs),
              contact: worker.contact || '',
              img: worker.worker_img
                ? storage
                    .getFilePreview(config.website_images, worker.worker_img, 160, 160, 'center', 75)
                    .toString()
                : missingPicture,
              p_receiving_schedules,
              u_receiving_schedules,
            };
          });

          // Only show roles with workers that have schedules
          const workersWithSchedules = workers.filter(worker => 
            (worker.p_receiving_schedules && worker.p_receiving_schedules.length > 0) ||
            (worker.u_receiving_schedules && worker.u_receiving_schedules.length > 0)
          );

          if (workersWithSchedules.length > 0) {
            this.roles.push({ id: roleId, role: roleName, workers: workersWithSchedules });
          }
        }
        this.loaded = true;
      } catch (error) {
        console.error('Error loading workers:', error);
        this.loaded = true;
        throw error;
      }
    }
  }
});
</script>

<style scoped>
.popups {
  transition: all 0.3s ease-in-out;
}

/* Smooth transitions for dark mode */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
</style>