<template>
  <section class="page-shell" id="courses">
    <div v-if="loaded" class="page-panel container">
      <div class="page-header">
        <h1 class="section-title !text-2xl sm:!text-3xl">
          {{ $t('parentsvisiting') }}
        </h1>
        <div class="section-accent !w-20"></div>
      </div>

      <div class="flex flex-wrap -m-4">
        <div v-for="classItem in classes" :key="classItem.id" class="xl:w-1/3 md:w-1/2 p-4">
          <div class="glass-card p-6 rounded-2xl h-full">
            <div class="flex items-center mb-4">
              <img class="w-16 h-16 bg-sky-100/50 dark:bg-slate-700/50 object-cover object-center flex-shrink-0 rounded-full mr-4 ring-2 ring-sky-400/20" 
                   :src="classItem.chief_img" :alt="classItem.chief">
              <div class="flex-grow">
                <h2 class="text-gray-900 dark:text-white font-semibold text-lg">
                  {{ classItem.chief }}
                </h2>
                <p class="text-gray-500 dark:text-gray-400">{{ classItem._class }}</p>
              </div>
            </div>
            
            <div v-if="classItem.receiving_schedules && classItem.receiving_schedules.length > 0">
              <h3 class="text-sky-600 dark:text-sky-400 text-xs font-semibold uppercase tracking-wide mb-2">
                {{ $t('classroom_chief_receiving_hour') }}
              </h3>
              <div v-for="(schedule, idx) in classItem.receiving_schedules" :key="idx" 
                   class="mb-3 pb-3 border-b border-sky-500/10 dark:border-white/10 last:border-b-0">
                <div class="flex justify-between items-start">
                  <div class="flex-grow">
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ getDayName(schedule.day) }}
                    </p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">
                      {{ getPeriodName(schedule.period) }}
                    </p>
                    <p v-if="schedule.location" class="text-sky-500 text-xs mt-1">
                      📍 {{ schedule.location }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 dark:text-gray-400 text-sm italic">
              {{ $t('no_receiving_hours') || 'Nincs megadott fogadóóra' }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="page-panel container page-state">
      <Loading />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Databases, Storage, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { loadRelations, commonRelations } from '@/appwrite/relationHelper';

const database = new Databases(appw);
const storage = new Storage(appw);
import { convertifserbian } from '@/lang';
import { useLoadingStore } from '@/stores/loading';
import Loading from '@/components/Loading.vue';

interface Schedule {
  day: string;
  period: string;
  location: string;
}

export default defineComponent({
  name: 'PClassList',
  components: { Loading },
  props: {
    mode: {
      type: String,
      default: '',
    },
  },
  data: () => ({
    admin: false,
    classes: [] as Array<{
      id: string;
      year: number;
      designation: string;
      chief: string;
      chief_img: string;
      receiving_schedules: Schedule[];
      _class: string;
    }>,
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
  }),
  mounted() {
    document.title = this.$t('parentsvisiting');
    const loadingStore = useLoadingStore();
    this.admin = loadingStore.userLoggedin && (loadingStore.userRole === 'admin' || loadingStore.userRole === 'editor');
    this.loadCourses();
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
    
    async loadCourses() {
      try {
        const loadingStore = useLoadingStore();
        const local = loadingStore.language;
        const missingPicture = storage
          .getFilePreview(config.website_images, config.missing_worker_picture, 160, 160, 'center', 75)
          .toString();

        const { documents } = await database.listDocuments(
          config.website_db,
          config.classlist,
          [Query.orderAsc('year'), Query.orderAsc('designation')]
        );

        // Betöltjük a workers relációt (osztályfőnök adatai)
        const docsWithRelations = await loadRelations(documents, [
          { field: 'workers', collectionId: config.workers }
        ]);

        this.classes = docsWithRelations.map((doc) => {
          const worker = doc.workers;
          const chiefName =
            local === 'rs' || local === 'sr'
              ? convertifserbian(worker?.worker_name_rs || '')
              : local === 'hu' || local === 'en'
              ? worker?.worker_name_hu || ''
              : '';

          // Thumbnail preview (not full original)
          const chiefImg = worker?.worker_img
            ? storage
                .getFilePreview(config.website_images, worker.worker_img, 160, 160, 'center', 75)
                .toString()
            : missingPicture;

          // Fogadóórák feldolgozása
          let receiving_schedules: Schedule[] = [];
          try {
            if (doc.receiving_schedules && typeof doc.receiving_schedules === 'string') {
              receiving_schedules = JSON.parse(doc.receiving_schedules);
            } else if (Array.isArray(doc.receiving_schedules)) {
              receiving_schedules = doc.receiving_schedules;
            }
          } catch (e) {
            console.error('Receiving schedules parsing hiba:', e);
            receiving_schedules = [];
          }

          return {
            id: doc.$id,
            year: doc.year,
            designation: doc.designation,
            chief: chiefName,
            chief_img: chiefImg,
            receiving_schedules: receiving_schedules,
            _class: this.classDesignation(doc.year, doc.designation),
          };
        });

        this.loaded = true;
      } catch (error) {
        console.error('Error loading courses:', error);
        this.loaded = true;
      }
    },
    
    classDesignation(year: number, designation: string): string {
      return `${this.toRomanNumeral(year)}-${designation}`;
    },
    
    toRomanNumeral(num: number): string {
      const romanMap: { [key: number]: string } = {
        1: 'I',
        2: 'II',
        3: 'III',
        4: 'IV',
      };
      return romanMap[num] || 'Hiba';
    },
    
    isHidden(value: boolean): boolean {
      return !value;
    },
  },
});
</script>

<style scoped>
.becsuszo_kep {
  /* Add styles if needed */
}
</style>