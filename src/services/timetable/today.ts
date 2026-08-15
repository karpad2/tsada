import { Databases, Permission, Query, Role } from 'appwrite'
import { appw, config } from '@/appwrite'

const database = new Databases(appw)

export const SUBSTITUTIONS_DOC_ID = 'substitutions'

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

export const MORNING_PERIODS = [
  '6:40-7:25',
  '7:30-8:15',
  '8:20-9:05',
  '9:20-10:05',
  '10:10-10:55',
  '11:00-11:40',
  '11:45-12:25',
  '12:30-13:10'
]

export const AFTERNOON_PERIODS = [
  '13:15-14:00',
  '14:05-14:50',
  '14:55-15:40',
  '15:55-16:35',
  '16:40-17:20',
  '17:25-18:05',
  '18:10-18:50',
  '18:55-19:35'
]

export interface ScheduleEntry {
  teacher: string
  room?: string
}

export interface ClassScheduleDoc {
  $id: string
  config_id: string
  class_name: string
  shift: string
  schedule: string
}

export interface TimetableConfig {
  $id: string
  name: string
  valid_from: string
  is_active: boolean
}

export interface SubstitutionEntry {
  id: string
  date: string
  absentTeacher: string
  substituteTeacher?: string
  className?: string
  period?: number
  shift?: string
  room?: string
  cancelled?: boolean
  note?: string
}

export interface SubstitutionStore {
  entries: SubstitutionEntry[]
}

export interface TodayLesson {
  period: number
  time: string
  teacher: string
  room: string
  originalTeacher: string
  originalRoom: string
  cancelled: boolean
  substituted: boolean
  roomChanged: boolean
  note: string
}

export interface TeacherLesson {
  className: string
  shift: string
  period: number
  time: string
  room: string
  teacher: string
}

export interface AbsenceCard {
  teacher: string
  substituteTeacher: string
  cancelled: boolean
  classes: string[]
  periods: number[]
  note: string
}

function norm(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function todayISO(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function weekdayNumber(dateStr: string): number | null {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = new Date(y, (m || 1) - 1, d || 1).getDay()
  return day >= 1 && day <= 5 ? day : null
}

export function periodsForShift(shift: string): string[] {
  return shift === 'afternoon' ? AFTERNOON_PERIODS : MORNING_PERIODS
}

export function parseSchedule(raw: string | unknown): Record<string, ScheduleEntry[]> {
  if (!raw) return {}
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function parseHm(hm: string, base = new Date()): Date {
  const [h, min] = hm.split(':').map((part) => Number(part))
  const next = new Date(base)
  next.setHours(h || 0, min || 0, 0, 0)
  return next
}

export function currentPeriodIndex(shift: string, now = new Date()): { current: number | null; next: number | null } {
  const slots = periodsForShift(shift)
  let next: number | null = null

  for (let i = 0; i < slots.length; i++) {
    const [start, end] = slots[i].split('-')
    const startAt = parseHm(start, now)
    const endAt = parseHm(end, now)
    if (now >= startAt && now <= endAt) {
      return { current: i + 1, next: i + 2 <= slots.length ? i + 2 : null }
    }
    if (now < startAt && next === null) next = i + 1
  }

  return { current: null, next }
}

export function newSubstitutionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyStore(): SubstitutionStore {
  return { entries: [] }
}

function parseStore(raw: string | undefined | null): SubstitutionStore {
  if (!raw) return emptyStore()
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.entries)) return emptyStore()
    return {
      entries: parsed.entries.filter((entry: SubstitutionEntry) => entry && entry.id && entry.date && entry.absentTeacher)
    }
  } catch {
    return emptyStore()
  }
}

function pruneStore(store: SubstitutionStore, keepDays = 45): SubstitutionStore {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - keepDays)
  const min = todayISO(cutoff)
  return {
    entries: store.entries.filter((entry) => entry.date >= min)
  }
}

export async function loadActiveTimetable(): Promise<{
  config: TimetableConfig | null
  schedules: ClassScheduleDoc[]
}> {
  const configs = await database.listDocuments(config.website_db, config.timetable_configs, [
    Query.equal('is_active', true),
    Query.limit(1)
  ])

  if (configs.documents.length === 0) {
    return { config: null, schedules: [] }
  }

  const active = configs.documents[0] as unknown as TimetableConfig
  const schedules = await database.listDocuments(config.website_db, config.timetable_classes, [
    Query.equal('config_id', active.$id),
    Query.limit(100)
  ])

  return {
    config: active,
    schedules: schedules.documents as unknown as ClassScheduleDoc[]
  }
}

export function uniqueClasses(schedules: ClassScheduleDoc[]): string[] {
  const names = new Set<string>()
  schedules.forEach((doc) => {
    if (doc.class_name) names.add(doc.class_name)
  })
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'hu'))
}

export function uniqueTeachers(schedules: ClassScheduleDoc[]): string[] {
  const names = new Set<string>()
  schedules.forEach((doc) => {
    const schedule = parseSchedule(doc.schedule)
    for (const day of Object.values(schedule)) {
      for (const entry of day || []) {
        if (entry?.teacher) names.add(entry.teacher)
      }
    }
  })
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'hu'))
}

export function uniqueRooms(schedules: ClassScheduleDoc[]): string[] {
  const names = new Set<string>()
  schedules.forEach((doc) => {
    const schedule = parseSchedule(doc.schedule)
    for (const day of Object.values(schedule)) {
      for (const entry of day || []) {
        if (entry?.room) names.add(entry.room)
      }
    }
  })
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'hu'))
}

export function classShifts(schedules: ClassScheduleDoc[], className: string): string[] {
  const shifts = schedules
    .filter((doc) => doc.class_name === className)
    .map((doc) => doc.shift)
    .filter(Boolean)
  return Array.from(new Set(shifts))
}

export function teacherLessonsOnDay(
  schedules: ClassScheduleDoc[],
  teacher: string,
  dayNum: number
): TeacherLesson[] {
  const wanted = norm(teacher)
  if (!wanted || !dayNum) return []
  const dayKey = String(dayNum)
  const lessons: TeacherLesson[] = []

  schedules.forEach((doc) => {
    const schedule = parseSchedule(doc.schedule)
    const entries = schedule[dayKey] || []
    entries.forEach((entry, idx) => {
      if (norm(entry?.teacher) !== wanted) return
      lessons.push({
        className: doc.class_name,
        shift: doc.shift,
        period: idx + 1,
        time: periodsForShift(doc.shift)[idx] || '',
        room: entry.room || '',
        teacher: entry.teacher
      })
    })
  })

  return lessons.sort((a, b) => a.shift.localeCompare(b.shift) || a.period - b.period || a.className.localeCompare(b.className, 'hu'))
}

export function lessonsForClass(
  schedules: ClassScheduleDoc[],
  className: string,
  shift: string,
  dayNum: number
): TodayLesson[] {
  const doc = schedules.find((item) => item.class_name === className && item.shift === shift)
  if (!doc || !dayNum) return []

  const entries = parseSchedule(doc.schedule)[String(dayNum)] || []
  const times = periodsForShift(shift)

  return Array.from({ length: 8 }, (_, idx) => {
    const cell = entries[idx]
    return {
      period: idx + 1,
      time: times[idx] || '',
      teacher: cell?.teacher || '',
      room: cell?.room || '',
      originalTeacher: cell?.teacher || '',
      originalRoom: cell?.room || '',
      cancelled: false,
      substituted: false,
      roomChanged: false,
      note: ''
    }
  })
}

function entryMatchesLesson(entry: SubstitutionEntry, lesson: TodayLesson, className: string, shift: string): boolean {
  if (norm(entry.absentTeacher) !== norm(lesson.originalTeacher || lesson.teacher)) return false
  if (entry.className && norm(entry.className) !== norm(className)) return false
  if (entry.shift && entry.shift !== shift) return false
  if (entry.period && entry.period !== lesson.period) return false
  return Boolean(lesson.originalTeacher || lesson.teacher)
}

export function applySubstitutions(
  lessons: TodayLesson[],
  entries: SubstitutionEntry[],
  className: string,
  shift: string,
  date: string
): TodayLesson[] {
  const dayEntries = entries.filter((entry) => entry.date === date)
  if (!dayEntries.length) return lessons

  return lessons.map((lesson) => {
    if (!lesson.originalTeacher) return lesson
    const match = dayEntries.find((entry) => entryMatchesLesson(entry, lesson, className, shift))
    if (!match) return lesson

    const next: TodayLesson = { ...lesson, note: match.note || '' }
    if (match.cancelled) {
      next.cancelled = true
    }
    if (match.substituteTeacher) {
      next.teacher = match.substituteTeacher
      next.substituted = true
    }
    if (match.room) {
      next.room = match.room
      next.roomChanged = match.room !== lesson.originalRoom
    }
    return next
  })
}

export function absencesForDate(
  entries: SubstitutionEntry[],
  date: string,
  schedules: ClassScheduleDoc[],
  dayNum: number | null
): AbsenceCard[] {
  const dayEntries = entries.filter((entry) => entry.date === date)
  const grouped = new Map<string, AbsenceCard>()

  dayEntries.forEach((entry) => {
    const key = `${norm(entry.absentTeacher)}|${norm(entry.substituteTeacher)}|${entry.cancelled ? '1' : '0'}`
    const existing = grouped.get(key)
    const classes = new Set(existing?.classes || [])
    const periods = new Set(existing?.periods || [])

    if (entry.className) classes.add(entry.className)
    if (entry.period) periods.add(entry.period)

    if (!entry.className && dayNum) {
      teacherLessonsOnDay(schedules, entry.absentTeacher, dayNum).forEach((lesson) => {
        if (entry.shift && entry.shift !== lesson.shift) return
        if (entry.period && entry.period !== lesson.period) return
        classes.add(lesson.className)
        periods.add(lesson.period)
      })
    }

    grouped.set(key, {
      teacher: entry.absentTeacher,
      substituteTeacher: entry.substituteTeacher || existing?.substituteTeacher || '',
      cancelled: Boolean(entry.cancelled),
      classes: Array.from(classes).sort((a, b) => a.localeCompare(b, 'hu')),
      periods: Array.from(periods).sort((a, b) => a - b),
      note: entry.note || existing?.note || ''
    })
  })

  return Array.from(grouped.values()).sort((a, b) => a.teacher.localeCompare(b.teacher, 'hu'))
}

export async function loadSubstitutions(): Promise<SubstitutionStore> {
  try {
    const doc = await database.getDocument(config.website_db, config.general_settings, SUBSTITUTIONS_DOC_ID)
    return parseStore(doc.setting_data)
  } catch (error: any) {
    if (error?.code === 404) return emptyStore()
    console.error('Failed to load substitutions:', error)
    return emptyStore()
  }
}

export async function saveSubstitutions(store: SubstitutionStore): Promise<void> {
  const cleaned = pruneStore(store)
  const payload = {
    setting_status: true,
    setting_data: JSON.stringify(cleaned)
  }

  try {
    await database.updateDocument(
      config.website_db,
      config.general_settings,
      SUBSTITUTIONS_DOC_ID,
      payload
    )
    return
  } catch (error: any) {
    if (error?.code !== 404) throw error
  }

  await database.createDocument(
    config.website_db,
    config.general_settings,
    SUBSTITUTIONS_DOC_ID,
    payload,
    [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  )
}

export async function upsertSubstitution(entry: SubstitutionEntry): Promise<SubstitutionStore> {
  const store = await loadSubstitutions()
  const index = store.entries.findIndex((item) => item.id === entry.id)
  if (index >= 0) store.entries[index] = entry
  else store.entries.unshift(entry)
  await saveSubstitutions(store)
  return store
}

export async function deleteSubstitution(id: string): Promise<SubstitutionStore> {
  const store = await loadSubstitutions()
  store.entries = store.entries.filter((item) => item.id !== id)
  await saveSubstitutions(store)
  return store
}

export function preferredShift(className: string, schedules: ClassScheduleDoc[], now = new Date()): string {
  const available = classShifts(schedules, className)
  if (available.length === 1) return available[0]
  if (available.includes('afternoon') && now.getHours() >= 13) return 'afternoon'
  if (available.includes('morning')) return 'morning'
  return available[0] || 'morning'
}
