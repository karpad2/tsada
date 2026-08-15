import { describe, expect, it } from 'vitest'
import {
  applySubstitutions,
  lessonsForClass,
  todayISO,
  weekdayNumber,
  type ClassScheduleDoc,
  type SubstitutionEntry
} from '@/services/timetable/today'
import { inspectDocument as inspectContent, type AuditSource } from '@/services/content/audit'

const schedule: ClassScheduleDoc = {
  $id: 'c1',
  config_id: 'cfg',
  class_name: 'I-1',
  shift: 'morning',
  schedule: JSON.stringify({
    '5': [
      { teacher: 'Kovács János', room: '12' },
      { teacher: 'Nagy Péter', room: '3' }
    ]
  })
}

describe('today schedule overlay', () => {
  it('builds Friday lessons for a class', () => {
    const lessons = lessonsForClass([schedule], 'I-1', 'morning', 5)
    expect(lessons[0].teacher).toBe('Kovács János')
    expect(lessons[0].room).toBe('12')
    expect(lessons[1].teacher).toBe('Nagy Péter')
  })

  it('replaces teacher and room for the matching period', () => {
    const base = lessonsForClass([schedule], 'I-1', 'morning', 5)
    const entries: SubstitutionEntry[] = [
      {
        id: '1',
        date: '2026-08-14',
        absentTeacher: 'Kovács János',
        substituteTeacher: 'Szabó Anna',
        room: '21'
      }
    ]
    const next = applySubstitutions(base, entries, 'I-1', 'morning', '2026-08-14')
    expect(next[0].substituted).toBe(true)
    expect(next[0].teacher).toBe('Szabó Anna')
    expect(next[0].originalTeacher).toBe('Kovács János')
    expect(next[0].room).toBe('21')
    expect(next[0].roomChanged).toBe(true)
    expect(next[1].substituted).toBe(false)
  })

  it('marks a cancelled lesson', () => {
    const base = lessonsForClass([schedule], 'I-1', 'morning', 5)
    const next = applySubstitutions(
      base,
      [{ id: '2', date: '2026-08-14', absentTeacher: 'Nagy Péter', cancelled: true, period: 2 }],
      'I-1',
      'morning',
      '2026-08-14'
    )
    expect(next[1].cancelled).toBe(true)
    expect(next[0].cancelled).toBe(false)
  })

  it('maps weekday numbers', () => {
    expect(weekdayNumber('2026-08-14')).toBe(5)
    expect(weekdayNumber('2026-08-15')).toBeNull()
    expect(todayISO(new Date(2026, 7, 14))).toBe('2026-08-14')
  })
})

describe('content audit', () => {
  const source: AuditSource = {
    key: 'pages',
    labelKey: 'audit_source_pages',
    collection: 'x',
    editPath: (id) => `/admin/edit/about/${id}`,
    titleFields: { hu: 'title_hu', rs: 'title_rs', en: 'title_en' },
    bodyFields: { hu: 'text_hu', rs: 'text_rs', en: 'text_en' }
  }

  it('flags missing HU/RS as critical and EN as optional', () => {
    const finding = inspectContent(
      {
        $id: '1',
        title_hu: 'Cím',
        text_hu: 'Szöveg',
        title_rs: '',
        text_rs: '',
        title_en: '',
        text_en: ''
      },
      source
    )
    expect(finding.severity).toBe('critical')
    expect(finding.missingTitles).toContain('rs')
    expect(finding.missingTitles).toContain('en')
  })

  it('treats only missing English as optional', () => {
    const finding = inspectContent(
      {
        $id: '2',
        title_hu: 'Cím',
        text_hu: 'Szöveg',
        title_rs: 'Naslov',
        text_rs: 'Tekst',
        title_en: '',
        text_en: ''
      },
      source
    )
    expect(finding.severity).toBe('optional')
    expect(finding.missingTitles).toEqual(['en'])
  })
})
