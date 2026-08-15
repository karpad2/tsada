<template>
  <section class="page-shell py-4">
    <div class="page-panel container">
      <div class="page-header-row">
        <div>
          <div class="inline-flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25">
              <i class="pi pi-users text-white text-lg"></i>
            </div>
            <h1 class="section-title !mb-0 !text-2xl">{{ $t('sub_editor') }}</h1>
          </div>
          <div class="section-accent"></div>
          <p class="page-subtitle">{{ $t('sub_editor_desc') }}</p>
        </div>
        <router-link
          to="/admin/today"
          class="px-4 py-2 rounded-full text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition"
        >
          {{ $t('today_schedule') }}
        </router-link>
      </div>

      <div v-if="error" class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 text-sm">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div class="lg:col-span-2 glass rounded-2xl p-5">
          <h2 class="page-section-title !mb-4">{{ editingId ? $t('sub_edit_entry') : $t('sub_add_entry') }}</h2>

          <div class="space-y-3">
            <label class="block">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('date') }}</span>
              <input v-model="form.date" type="date" class="field mt-1" />
            </label>

            <label class="block">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('sub_absent_teacher') }}</span>
              <input
                v-model="form.absentTeacher"
                list="teacher-list"
                class="field mt-1"
                :placeholder="$t('tt_select_teacher')"
              />
            </label>

            <label class="block">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('sub_substitute_teacher') }}</span>
              <input
                v-model="form.substituteTeacher"
                list="teacher-list"
                class="field mt-1"
                :placeholder="$t('sub_optional')"
              />
            </label>

            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('tt_class_name') }}</span>
                <select v-model="form.className" class="field mt-1">
                  <option value="">{{ $t('sub_all_classes') }}</option>
                  <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('tt_period') }}</span>
                <select v-model.number="form.period" class="field mt-1">
                  <option :value="0">{{ $t('sub_all_periods') }}</option>
                  <option v-for="n in 8" :key="n" :value="n">{{ n }}</option>
                </select>
              </label>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('sub_shift') }}</span>
                <select v-model="form.shift" class="field mt-1">
                  <option value="">{{ $t('sub_both_shifts') }}</option>
                  <option value="morning">{{ $t('tt_morning_shift') }}</option>
                  <option value="afternoon">{{ $t('tt_afternoon_shift') }}</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('tt_room_name') }}</span>
                <input
                  v-model="form.room"
                  list="room-list"
                  class="field mt-1"
                  :placeholder="$t('sub_optional')"
                />
              </label>
            </div>

            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input v-model="form.cancelled" type="checkbox" class="rounded border-gray-300" />
              {{ $t('today_cancelled') }}
            </label>

            <label class="block">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('sub_note') }}</span>
              <input v-model="form.note" type="text" class="field mt-1" :placeholder="$t('sub_optional')" />
            </label>

            <div v-if="affectedLessons.length" class="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs">
              <div class="font-semibold mb-2 text-gray-700 dark:text-gray-200">{{ $t('sub_affected') }}</div>
              <div v-for="lesson in affectedLessons" :key="lesson.className + lesson.shift + lesson.period" class="text-gray-600 dark:text-gray-300">
                {{ lesson.className }} · {{ lesson.shift === 'afternoon' ? $t('tt_afternoon_shift') : $t('tt_morning_shift') }}
                · {{ lesson.period }}. {{ $t('tt_period').toLowerCase() }}
                <span v-if="lesson.room">({{ lesson.room }})</span>
              </div>
            </div>

            <div class="flex gap-2 pt-1">
              <button
                type="button"
                class="glass-btn px-4 py-2 text-white rounded-full text-sm font-medium disabled:opacity-50"
                :disabled="saving || !form.absentTeacher"
                @click="saveEntry"
              >
                {{ saving ? $t('saving') : $t('save') }}
              </button>
              <button
                v-if="editingId"
                type="button"
                class="px-4 py-2 rounded-full text-sm border border-gray-300 dark:border-slate-600"
                @click="resetForm"
              >
                {{ $t('cancel') }}
              </button>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3 glass rounded-2xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="page-section-title !mb-0">{{ $t('sub_list') }}</h2>
            <input v-model="listDate" type="date" class="field !w-auto" />
          </div>

          <div v-if="loading" class="text-center py-10">
            <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
          </div>

          <div v-else-if="dayEntries.length === 0" class="text-center py-10 text-gray-400">
            {{ $t('sub_empty_day') }}
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="entry in dayEntries"
              :key="entry.id"
              class="rounded-xl border border-gray-200 dark:border-slate-600 p-4 flex flex-wrap items-start justify-between gap-3"
            >
              <div>
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ entry.absentTeacher }}
                  <span v-if="entry.cancelled" class="ml-2 text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    {{ $t('today_cancelled') }}
                  </span>
                  <span v-else-if="entry.substituteTeacher" class="text-emerald-600 dark:text-emerald-300 font-medium">
                    → {{ entry.substituteTeacher }}
                  </span>
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  <span v-if="entry.className">{{ entry.className }}</span>
                  <span v-else>{{ $t('sub_all_classes') }}</span>
                  ·
                  <span v-if="entry.period">{{ entry.period }}. {{ $t('tt_period').toLowerCase() }}</span>
                  <span v-else>{{ $t('sub_all_periods') }}</span>
                  <span v-if="entry.room"> · {{ $t('today_room') }}: {{ entry.room }}</span>
                  <span v-if="entry.note"> · {{ entry.note }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button type="button" class="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm" @click="editEntry(entry)">
                  {{ $t('Edit') }}
                </button>
                <button type="button" class="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm" @click="removeEntry(entry.id)">
                  {{ $t('delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <datalist id="teacher-list">
        <option v-for="teacher in teachers" :key="teacher" :value="teacher" />
      </datalist>
      <datalist id="room-list">
        <option v-for="room in rooms" :key="room" :value="room" />
      </datalist>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  deleteSubstitution,
  loadActiveTimetable,
  loadSubstitutions,
  newSubstitutionId,
  teacherLessonsOnDay,
  todayISO,
  uniqueClasses,
  uniqueRooms,
  uniqueTeachers,
  upsertSubstitution,
  weekdayNumber,
  type ClassScheduleDoc,
  type SubstitutionEntry
} from '@/services/timetable/today'

const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const listDate = ref(todayISO())
const editingId = ref('')
const entries = ref<SubstitutionEntry[]>([])
const schedules = ref<ClassScheduleDoc[]>([])

const form = reactive({
  date: todayISO(),
  absentTeacher: '',
  substituteTeacher: '',
  className: '',
  period: 0,
  shift: '',
  room: '',
  cancelled: false,
  note: ''
})

const teachers = computed(() => uniqueTeachers(schedules.value))
const classes = computed(() => uniqueClasses(schedules.value))
const rooms = computed(() => uniqueRooms(schedules.value))

const dayEntries = computed(() =>
  entries.value
    .filter((entry) => entry.date === listDate.value)
    .sort((a, b) => (a.period || 0) - (b.period || 0) || a.absentTeacher.localeCompare(b.absentTeacher, 'hu'))
)

const affectedLessons = computed(() => {
  const day = weekdayNumber(form.date)
  if (!form.absentTeacher || !day) return []
  return teacherLessonsOnDay(schedules.value, form.absentTeacher, day).filter((lesson) => {
    if (form.className && lesson.className !== form.className) return false
    if (form.shift && lesson.shift !== form.shift) return false
    if (form.period && lesson.period !== form.period) return false
    return true
  })
})

function resetForm() {
  editingId.value = ''
  form.date = listDate.value || todayISO()
  form.absentTeacher = ''
  form.substituteTeacher = ''
  form.className = ''
  form.period = 0
  form.shift = ''
  form.room = ''
  form.cancelled = false
  form.note = ''
}

function editEntry(entry: SubstitutionEntry) {
  editingId.value = entry.id
  form.date = entry.date
  form.absentTeacher = entry.absentTeacher
  form.substituteTeacher = entry.substituteTeacher || ''
  form.className = entry.className || ''
  form.period = entry.period || 0
  form.shift = entry.shift || ''
  form.room = entry.room || ''
  form.cancelled = Boolean(entry.cancelled)
  form.note = entry.note || ''
}

async function saveEntry() {
  if (!form.absentTeacher.trim()) return
  saving.value = true
  error.value = ''
  try {
    const entry: SubstitutionEntry = {
      id: editingId.value || newSubstitutionId(),
      date: form.date,
      absentTeacher: form.absentTeacher.trim(),
      substituteTeacher: form.substituteTeacher.trim(),
      className: form.className,
      period: form.period || undefined,
      shift: form.shift,
      room: form.room.trim(),
      cancelled: form.cancelled,
      note: form.note.trim()
    }
    const store = await upsertSubstitution(entry)
    entries.value = store.entries
    listDate.value = form.date
    resetForm()
  } catch (err: any) {
    error.value = err?.message || t('sub_save_error')
  } finally {
    saving.value = false
  }
}

async function removeEntry(id: string) {
  if (!confirm(t('sub_confirm_delete'))) return
  try {
    const store = await deleteSubstitution(id)
    entries.value = store.entries
    if (editingId.value === id) resetForm()
  } catch (err: any) {
    error.value = err?.message || t('sub_save_error')
  }
}

watch(listDate, (value) => {
  if (!editingId.value) form.date = value
})

onMounted(async () => {
  try {
    const [timetable, store] = await Promise.all([loadActiveTimetable(), loadSubstitutions()])
    schedules.value = timetable.schedules
    entries.value = store.entries
  } catch (err: any) {
    error.value = err?.message || t('sub_load_error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.field {
  width: 100%;
  padding: 0.55rem 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #1f2937;
}
.dark .field {
  border-color: #475569;
  background: #334155;
  color: #e2e8f0;
}
</style>
