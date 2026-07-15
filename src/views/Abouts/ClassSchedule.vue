<template>
  <section class="page-shell">
    <div class="page-panel container">

      <!-- Header -->
      <div class="page-header">
        <div class="inline-flex items-center gap-3 mb-2">
          <div class="w-11 h-11 bg-gradient-to-br from-sky-500 to-sky-400 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/25">
            <i class="pi pi-calendar text-white text-lg"></i>
          </div>
          <h1 id="schedule-title" class="section-title !mb-0">
            {{ $t("class_schedule") }}
          </h1>
        </div>
        <div class="section-accent"></div>
        <p v-if="activeConfig" class="page-subtitle">
          {{ $t("tt_valid_from") }}: {{ formatDate(activeConfig.valid_from) }}
        </p>
      </div>

      <!-- No schedule message -->
      <div v-if="!loading && !activeConfig" class="text-center py-20">
        <i class="pi pi-calendar-times text-6xl text-gray-300 mb-4"></i>
        <p class="text-xl text-gray-500">{{ $t("tt_no_schedule") }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>

      <!-- Schedule content -->
      <div v-if="activeConfig && !loading" class="pb-8">

        <!-- Tab selector -->
        <div class="flex flex-wrap gap-2 mb-6 px-6">
          <button
            v-for="tab in tabs" :key="tab.key"
            @click="activeTab = tab.key"
            :class="activeTab === tab.key
              ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
              : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600'"
            class="px-5 py-2.5 rounded-full font-medium transition-all duration-200 text-sm border border-gray-200 dark:border-slate-600"
          >
            <i :class="tab.icon" class="mr-2"></i>
            {{ $t(tab.label) }}
          </button>
        </div>

        <!-- By Class Tab -->
        <div v-if="activeTab === 'class'" class="px-6">
          <div class="mb-4 flex flex-wrap gap-3 items-center">
            <select v-model="selectedClass"
              class="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-w-[200px]">
              <option value="">{{ $t("tt_select_class") }}</option>
              <option v-for="cls in availableClasses" :key="cls" :value="cls">{{ cls }}</option>
            </select>

            <div v-if="selectedClass" class="flex gap-2">
              <button
                @click="selectedShift = 'morning'"
                :class="selectedShift === 'morning' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200'"
                class="px-4 py-2 rounded-lg font-medium transition-all text-sm"
              >
                <i class="pi pi-sun mr-1"></i> {{ $t("tt_morning_shift") }}
              </button>
              <button
                @click="selectedShift = 'afternoon'"
                :class="selectedShift === 'afternoon' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200'"
                class="px-4 py-2 rounded-lg font-medium transition-all text-sm"
              >
                <i class="pi pi-moon mr-1"></i> {{ $t("tt_afternoon_shift") }}
              </button>
            </div>
          </div>

          <schedule-grid
            v-if="selectedClass && currentClassSchedule"
            :schedule="currentClassSchedule"
            :periods="shiftPeriods"
            :title="selectedClass"
          />
        </div>

        <!-- By Teacher Tab -->
        <div v-if="activeTab === 'teacher'" class="px-6">
          <div class="mb-4">
            <select v-model="selectedTeacher"
              class="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-w-[250px]">
              <option value="">{{ $t("tt_select_teacher") }}</option>
              <option v-for="teacher in allTeachers" :key="teacher" :value="teacher">{{ teacher }}</option>
            </select>
          </div>

          <div v-if="selectedTeacher" class="page-table-wrap overflow-hidden">
            <div class="page-table-bar">
              <h3 class="text-white font-bold text-lg">{{ selectedTeacher }}</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 dark:bg-slate-700">
                    <th class="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-slate-600 w-16">{{ $t("tt_period") }}</th>
                    <th v-for="day in dayKeys" :key="day" class="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-slate-600">
                      {{ $t('tt_' + day) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="period in 8" :key="period"
                    :class="period % 2 === 0 ? 'bg-white/60 dark:bg-slate-800/60' : 'bg-gray-50/40 dark:bg-slate-700/40'"
                    class="hover:bg-blue-50/50 dark:hover:bg-slate-600/50 transition-colors">
                    <td class="px-3 py-2 border-b dark:border-slate-600">
                      <span class="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold">
                        {{ period }}
                      </span>
                    </td>
                    <td v-for="day in dayKeys" :key="day"
                      class="px-3 py-2 text-center border-b dark:border-slate-600 text-gray-700 dark:text-gray-200">
                      <span v-if="teacherSchedule[day] && teacherSchedule[day][period - 1]"
                        class="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-medium">
                        {{ teacherSchedule[day][period - 1] }}
                      </span>
                      <span v-else class="text-gray-300 dark:text-slate-600">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- By Room Tab -->
        <div v-if="activeTab === 'room'" class="px-6">
          <div class="mb-4">
            <select v-model="selectedRoom"
              class="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-w-[250px]">
              <option value="">{{ $t("tt_select_room") }}</option>
              <option v-for="room in allRooms" :key="room" :value="room">{{ room }}</option>
            </select>
          </div>

          <div v-if="selectedRoom" class="page-table-wrap overflow-hidden">
            <div class="page-table-bar">
              <h3 class="text-white font-bold text-lg">{{ selectedRoom }}</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 dark:bg-slate-700">
                    <th class="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-slate-600 w-16">{{ $t("tt_period") }}</th>
                    <th v-for="day in dayKeys" :key="day" class="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-slate-600">
                      {{ $t('tt_' + day) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="period in 8" :key="period"
                    :class="period % 2 === 0 ? 'bg-white/60 dark:bg-slate-800/60' : 'bg-gray-50/40 dark:bg-slate-700/40'"
                    class="hover:bg-blue-50/50 dark:hover:bg-slate-600/50 transition-colors">
                    <td class="px-3 py-2 border-b dark:border-slate-600">
                      <span class="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold">
                        {{ period }}
                      </span>
                    </td>
                    <td v-for="day in dayKeys" :key="day"
                      class="px-3 py-2 text-center border-b dark:border-slate-600">
                      <span v-if="roomSchedule[day] && roomSchedule[day][period - 1]"
                        class="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-xs font-medium">
                        {{ roomSchedule[day][period - 1].class }} - {{ roomSchedule[day][period - 1].teacher }}
                      </span>
                      <span v-else class="text-green-500 dark:text-green-400 text-xs font-medium">{{ $t("tt_room_free") }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Databases, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";
import dayjs from '@/utils/dayjs';

const database = new Databases(appw);

interface ScheduleEntry {
  teacher: string;
  room?: string;
}

interface ClassScheduleDoc {
  $id: string;
  config_id: string;
  class_name: string;
  shift: string;
  schedule: string; // JSON string: { "1": [{ teacher, room }, ...], ... }
}

interface TimetableConfig {
  $id: string;
  name: string;
  valid_from: string;
  is_active: boolean;
}

const ScheduleGrid = {
  name: 'ScheduleGrid',
  props: {
    schedule: { type: Object, required: true },
    periods: { type: Array, required: true },
    title: { type: String, default: '' }
  },
  template: `
    <div class="page-table-wrap overflow-hidden">
      <div class="page-table-bar">
        <h3 class="text-white font-bold text-lg">{{ title }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 dark:bg-slate-700">
              <th class="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-slate-600 w-16">{{ $t("tt_period") }}</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-400 dark:text-gray-500 border-b dark:border-slate-600 w-28 text-xs"></th>
              <th v-for="day in ['monday','tuesday','wednesday','thursday','friday']" :key="day" class="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-slate-600">
                {{ $t('tt_' + day) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(period, idx) in 8" :key="period"
              :class="period % 2 === 0 ? 'bg-white/60 dark:bg-slate-800/60' : 'bg-gray-50/40 dark:bg-slate-700/40'"
              class="hover:bg-blue-50/50 dark:hover:bg-slate-600/50 transition-colors">
              <td class="px-3 py-2 border-b dark:border-slate-600">
                <span class="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold">
                  {{ period }}
                </span>
              </td>
              <td class="px-3 py-2 border-b dark:border-slate-600 text-xs text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap">
                {{ periods[idx] || '' }}
              </td>
              <td v-for="day in ['1','2','3','4','5']" :key="day"
                class="px-3 py-2 text-center border-b dark:border-slate-600 text-gray-700 dark:text-gray-200">
                <div v-if="schedule[day] && schedule[day][idx] && schedule[day][idx].teacher"
                  class="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-medium">
                  <div>{{ schedule[day][idx].teacher }}</div>
                  <div v-if="schedule[day][idx].room" class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{{ schedule[day][idx].room }}</div>
                </div>
                <span v-else class="text-gray-300 dark:text-slate-600">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
};

export default {
  components: { ScheduleGrid },
  data() {
    return {
      loading: true,
      activeConfig: null as TimetableConfig | null,
      classSchedules: [] as ClassScheduleDoc[],
      activeTab: 'class',
      selectedClass: '',
      selectedShift: 'morning',
      selectedTeacher: '',
      selectedRoom: '',
      dayKeys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      morningPeriods: [
        '6:40-7:25', '7:30-8:15', '8:20-9:05', '9:20-10:05',
        '10:10-10:55', '11:00-11:40', '11:45-12:25', '12:30-13:10'
      ],
      afternoonPeriods: [
        '13:15-14:00', '14:05-14:50', '14:55-15:40', '15:55-16:35',
        '16:40-17:20', '17:25-18:05', '18:10-18:50', '18:55-19:35'
      ],
      tabs: [
        { key: 'class', label: 'tt_by_class', icon: 'pi pi-users' },
        { key: 'teacher', label: 'tt_by_teacher', icon: 'pi pi-user' },
        { key: 'room', label: 'tt_by_room', icon: 'pi pi-building' }
      ]
    };
  },
  computed: {
    shiftPeriods(): string[] {
      return this.selectedShift === 'morning' ? this.morningPeriods : this.afternoonPeriods;
    },
    availableClasses(): string[] {
      const classes = new Set<string>();
      this.classSchedules.forEach(doc => classes.add(doc.class_name));
      const sorted = Array.from(classes).sort((a, b) => {
        const yearA = a.match(/^(\w+)-/)?.[1] || a;
        const yearB = b.match(/^(\w+)-/)?.[1] || b;
        if (yearA !== yearB) return yearA.localeCompare(yearB);
        return a.localeCompare(b);
      });
      return sorted;
    },
    currentClassSchedule(): Record<string, ScheduleEntry[]> | null {
      const doc = this.classSchedules.find(
        d => d.class_name === this.selectedClass && d.shift === this.selectedShift
      );
      if (!doc) return null;
      try {
        return JSON.parse(doc.schedule);
      } catch {
        return null;
      }
    },
    allTeachers(): string[] {
      const teachers = new Set<string>();
      this.classSchedules.forEach(doc => {
        try {
          const schedule = JSON.parse(doc.schedule);
          for (const day of Object.values(schedule) as ScheduleEntry[][]) {
            for (const entry of day) {
              if (entry?.teacher) teachers.add(entry.teacher);
            }
          }
        } catch {}
      });
      return Array.from(teachers).sort((a, b) => a.localeCompare(b, 'hu'));
    },
    teacherSchedule(): Record<string, Array<string | null>> {
      // For each day, find which class the teacher is teaching at each period
      const result: Record<string, Array<string | null>> = {};
      for (const dayName of this.dayKeys) {
        result[dayName] = Array(8).fill(null);
      }
      const dayMap = { '1': 'monday', '2': 'tuesday', '3': 'wednesday', '4': 'thursday', '5': 'friday' };

      this.classSchedules.forEach(doc => {
        try {
          const schedule = JSON.parse(doc.schedule);
          for (const [dayNum, entries] of Object.entries(schedule) as [string, ScheduleEntry[]][]) {
            const dayName = dayMap[dayNum as keyof typeof dayMap];
            if (!dayName) continue;
            entries.forEach((entry, idx) => {
              if (entry?.teacher === this.selectedTeacher) {
                result[dayName][idx] = `${doc.class_name} (${doc.shift === 'morning' ? 'DE' : 'DU'})`;
              }
            });
          }
        } catch {}
      });
      return result;
    },
    allRooms(): string[] {
      const rooms = new Set<string>();
      this.classSchedules.forEach(doc => {
        try {
          const schedule = JSON.parse(doc.schedule);
          for (const day of Object.values(schedule) as ScheduleEntry[][]) {
            for (const entry of day) {
              if (entry?.room) rooms.add(entry.room);
            }
          }
        } catch {}
      });
      return Array.from(rooms).sort((a, b) => a.localeCompare(b, 'hu'));
    },
    roomSchedule(): Record<string, Array<{ class: string; teacher: string } | null>> {
      const result: Record<string, Array<{ class: string; teacher: string } | null>> = {};
      for (const dayName of this.dayKeys) {
        result[dayName] = Array(8).fill(null);
      }
      const dayMap = { '1': 'monday', '2': 'tuesday', '3': 'wednesday', '4': 'thursday', '5': 'friday' };

      this.classSchedules.forEach(doc => {
        try {
          const schedule = JSON.parse(doc.schedule);
          for (const [dayNum, entries] of Object.entries(schedule) as [string, ScheduleEntry[]][]) {
            const dayName = dayMap[dayNum as keyof typeof dayMap];
            if (!dayName) continue;
            entries.forEach((entry, idx) => {
              if (entry?.room === this.selectedRoom) {
                result[dayName][idx] = { class: doc.class_name, teacher: entry.teacher };
              }
            });
          }
        } catch {}
      });
      return result;
    }
  },
  async mounted() {
    await this.loadSchedule();

    import('gsap').then(({ default: gsap }) => {
      gsap.fromTo("#schedule-title",
        { opacity: 0, x: "100%", scale: 0.8 },
        { duration: 1.2, opacity: 1, x: 0, scale: 1, ease: "back.out(1.7)" }
      );
    });
  },
  methods: {
    formatDate(dateStr: string) {
      const local = useLoadingStore().language;
      dayjs.locale(local === "rs" ? "sr" : local);
      return dayjs(dateStr).format("LL");
    },
    async loadSchedule() {
      this.loading = true;
      try {
        // Load active timetable config
        const configs = await database.listDocuments(config.website_db, config.timetable_configs, [
          Query.equal("is_active", true),
          Query.limit(1)
        ]);

        if (configs.documents.length === 0) {
          this.loading = false;
          return;
        }

        this.activeConfig = configs.documents[0] as unknown as TimetableConfig;

        // Load all class schedules for this config
        const schedules = await database.listDocuments(config.website_db, config.timetable_classes, [
          Query.equal("config_id", this.activeConfig.$id),
          Query.limit(100)
        ]);

        this.classSchedules = schedules.documents as unknown as ClassScheduleDoc[];
      } catch (err) {
        console.error("Failed to load timetable:", err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 10px;
}
</style>
