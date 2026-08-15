<template>
  <section class="page-shell">
    <div class="page-panel container">
      <div class="page-header">
        <div class="inline-flex items-center gap-3 mb-2">
          <div class="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25">
            <i class="pi pi-map-marker text-white text-lg"></i>
          </div>
          <div>
            <h1 class="section-title !mb-0">{{ $t('today_schedule') }}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ formattedDate }}</p>
          </div>
        </div>
        <div class="section-accent"></div>
        <p class="page-subtitle">{{ $t('today_subtitle') }}</p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>

      <div v-else-if="!activeConfig" class="text-center py-16">
        <i class="pi pi-calendar-times text-6xl text-gray-300 mb-4"></i>
        <p class="text-xl text-gray-500">{{ $t('tt_no_schedule') }}</p>
        <router-link to="/about/class-schedule" class="inline-block mt-4 text-sky-600 hover:underline">
          {{ $t('class_schedule') }}
        </router-link>
      </div>

      <div v-else class="space-y-6 pb-8">
        <div class="flex flex-wrap gap-3 items-center">
          <select
            v-model="selectedClass"
            class="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-amber-500 min-w-[200px]"
          >
            <option value="">{{ $t('tt_select_class') }}</option>
            <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
          </select>

          <div v-if="availableShifts.length > 1" class="flex gap-2">
            <button
              v-for="shift in availableShifts"
              :key="shift"
              type="button"
              @click="selectedShift = shift"
              :class="selectedShift === shift
                ? (shift === 'morning' ? 'bg-yellow-500 text-white' : 'bg-indigo-500 text-white')
                : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200'"
              class="px-4 py-2 rounded-lg font-medium transition-all text-sm"
            >
              <i :class="shift === 'morning' ? 'pi pi-sun' : 'pi pi-moon'" class="mr-1"></i>
              {{ shift === 'morning' ? $t('tt_morning_shift') : $t('tt_afternoon_shift') }}
            </button>
          </div>
        </div>

        <div v-if="absences.length" class="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/30 p-4">
          <h2 class="font-semibold text-rose-800 dark:text-rose-200 mb-3 flex items-center gap-2">
            <i class="pi pi-user-minus"></i>
            {{ $t('today_who_is_absent') }}
          </h2>
          <div class="space-y-2">
            <div
              v-for="item in absences"
              :key="item.teacher + item.substituteTeacher + item.cancelled"
              class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-rose-900 dark:text-rose-100"
            >
              <span class="font-semibold">{{ item.teacher }}</span>
              <span v-if="item.cancelled" class="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs">
                {{ $t('today_cancelled') }}
              </span>
              <span v-else-if="item.substituteTeacher" class="text-emerald-700 dark:text-emerald-300">
                → {{ item.substituteTeacher }}
              </span>
              <span v-else class="text-rose-600 dark:text-rose-300">
                {{ $t('today_no_substitute') }}
              </span>
              <span v-if="item.classes.length" class="text-gray-500 dark:text-gray-400">
                ({{ item.classes.join(', ') }}{{ item.periods.length ? ' · ' + item.periods.join(', ') + '.' : '' }})
              </span>
              <span v-if="item.note" class="text-gray-500 italic">{{ item.note }}</span>
            </div>
          </div>
        </div>

        <div v-else class="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <i class="pi pi-check-circle mr-1"></i>
          {{ $t('today_no_absences') }}
        </div>

        <div v-if="isWeekend" class="text-center py-10 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
          <i class="pi pi-calendar text-4xl text-gray-300 mb-3"></i>
          <p class="text-lg text-gray-500">{{ $t('today_weekend') }}</p>
        </div>

        <div v-else-if="!selectedClass" class="text-center py-8 text-gray-500">
          {{ $t('today_pick_class') }}
        </div>

        <div v-else-if="!hasAnyLesson" class="text-center py-8 text-gray-500">
          {{ $t('today_no_lessons') }}
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="lesson in visibleLessons"
            :key="lesson.period"
            class="rounded-2xl border p-4 transition-all"
            :class="lessonCardClass(lesson)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                :class="lesson.cancelled ? 'bg-gray-400' : 'bg-gradient-to-br from-sky-500 to-blue-600'"
              >
                {{ lesson.period }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-xs text-gray-500">{{ lesson.time }}</span>
                  <span
                    v-if="periodState.current === lesson.period"
                    class="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-semibold"
                  >
                    {{ $t('today_now') }}
                  </span>
                  <span
                    v-else-if="periodState.next === lesson.period"
                    class="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200 text-[11px] font-semibold"
                  >
                    {{ $t('today_next') }}
                  </span>
                  <span
                    v-if="lesson.cancelled"
                    class="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-semibold"
                  >
                    {{ $t('today_cancelled') }}
                  </span>
                  <span
                    v-else-if="lesson.substituted"
                    class="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[11px] font-semibold"
                  >
                    {{ $t('today_substituted') }}
                  </span>
                </div>

                <div class="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                  <template v-if="lesson.cancelled">
                    <span class="line-through text-gray-400 font-medium">{{ lesson.originalTeacher }}</span>
                  </template>
                  <template v-else-if="lesson.substituted">
                    <span class="line-through text-gray-400 font-medium mr-2">{{ lesson.originalTeacher }}</span>
                    <span>{{ lesson.teacher }}</span>
                  </template>
                  <template v-else>
                    {{ lesson.teacher }}
                  </template>
                </div>

                <div class="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium"
                    :class="lesson.roomChanged
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'"
                  >
                    <i class="pi pi-building text-xs"></i>
                    <template v-if="lesson.room">
                      {{ $t('today_room') }}: {{ lesson.room }}
                    </template>
                    <template v-else>{{ $t('today_no_room') }}</template>
                    <span v-if="lesson.roomChanged && lesson.originalRoom" class="line-through opacity-60 ml-1">
                      {{ lesson.originalRoom }}
                    </span>
                  </span>
                  <span v-if="lesson.note" class="text-gray-500 italic">{{ lesson.note }}</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import dayjs from '@/utils/dayjs'
import { useLoadingStore } from '@/stores/loading'
import {
  absencesForDate,
  applySubstitutions,
  classShifts,
  currentPeriodIndex,
  lessonsForClass,
  loadActiveTimetable,
  loadSubstitutions,
  preferredShift,
  todayISO,
  uniqueClasses,
  weekdayNumber,
  type AbsenceCard,
  type ClassScheduleDoc,
  type SubstitutionEntry,
  type TimetableConfig,
  type TodayLesson
} from '@/services/timetable/today'

const CLASS_KEY = 'tsada.today.class'
const SHIFT_KEY = 'tsada.today.shift'

const loadingStore = useLoadingStore()

const loading = ref(true)
const now = ref(new Date())
const selectedClass = ref('')
const selectedShift = ref('morning')
const activeConfig = ref<TimetableConfig | null>(null)
const schedules = ref<ClassScheduleDoc[]>([])
const substitutions = ref<SubstitutionEntry[]>([])

let ticker: number | undefined

const dateStr = computed(() => todayISO(now.value))
const dayNum = computed(() => weekdayNumber(dateStr.value))
const isWeekend = computed(() => dayNum.value === null)
const classes = computed(() => uniqueClasses(schedules.value))
const availableShifts = computed(() => classShifts(schedules.value, selectedClass.value))

const formattedDate = computed(() => {
  const lang = loadingStore.language === 'rs' ? 'sr' : loadingStore.language
  dayjs.locale(lang || 'hu')
  return dayjs(dateStr.value).format('dddd, LL')
})

const periodState = computed(() => currentPeriodIndex(selectedShift.value, now.value))

const lessons = computed<TodayLesson[]>(() => {
  if (!selectedClass.value || !dayNum.value) return []
  const base = lessonsForClass(schedules.value, selectedClass.value, selectedShift.value, dayNum.value)
  return applySubstitutions(base, substitutions.value, selectedClass.value, selectedShift.value, dateStr.value)
})

const visibleLessons = computed(() => lessons.value.filter((lesson) => lesson.originalTeacher || lesson.teacher))
const hasAnyLesson = computed(() => visibleLessons.value.length > 0)

const absences = computed<AbsenceCard[]>(() =>
  absencesForDate(substitutions.value, dateStr.value, schedules.value, dayNum.value)
)

function lessonCardClass(lesson: TodayLesson): string {
  if (lesson.cancelled) return 'border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 opacity-80'
  if (periodState.value.current === lesson.period) return 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 shadow-md'
  if (lesson.substituted || lesson.roomChanged) return 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10'
  return 'border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40'
}

watch(selectedClass, (value) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(CLASS_KEY, value)
  const shifts = classShifts(schedules.value, value)
  if (!shifts.includes(selectedShift.value)) {
    selectedShift.value = preferredShift(value, schedules.value, now.value)
  }
})

watch(selectedShift, (value) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(SHIFT_KEY, value)
})

onMounted(async () => {
  ticker = window.setInterval(() => {
    now.value = new Date()
  }, 30000)

  try {
    const [timetable, store] = await Promise.all([loadActiveTimetable(), loadSubstitutions()])
    activeConfig.value = timetable.config
    schedules.value = timetable.schedules
    substitutions.value = store.entries

    const savedClass = localStorage.getItem(CLASS_KEY) || ''
    const savedShift = localStorage.getItem(SHIFT_KEY) || ''
    if (savedClass && uniqueClasses(timetable.schedules).includes(savedClass)) {
      selectedClass.value = savedClass
    }
    const shifts = classShifts(timetable.schedules, selectedClass.value)
    selectedShift.value = shifts.includes(savedShift)
      ? savedShift
      : preferredShift(selectedClass.value, timetable.schedules)
  } catch (error) {
    console.error('Failed to load today schedule:', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (ticker) window.clearInterval(ticker)
})
</script>
