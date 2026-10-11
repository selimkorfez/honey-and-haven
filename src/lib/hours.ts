import type { SpecialHours } from './types'

/** Today's date in the UK as YYYY-MM-DD. */
export function ukToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const short = (iso: string) => dayFmt.format(new Date(`${iso}T12:00:00Z`))

/** "Thu 25 Dec" or "Thu 25 Dec – Sat 27 Dec" */
export function formatDays(s: Pick<SpecialHours, 'date' | 'endDate'>) {
  return s.endDate && s.endDate > s.date ? `${short(s.date)} – ${short(s.endDate)}` : short(s.date)
}

/** Special hours that haven't finished yet and start within the next `days` days. */
export function upcomingSpecialHours(list: SpecialHours[] | undefined, days = 45, now = new Date()) {
  const today = ukToday(now)
  const horizon = addDays(today, days)
  return (list ?? [])
    .filter((s) => s.date && (s.endDate && s.endDate > s.date ? s.endDate : s.date) >= today && s.date <= horizon)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** The special hours that apply today, if any. */
export function specialToday(list: SpecialHours[] | undefined, now = new Date()) {
  const today = ukToday(now)
  return (list ?? []).find((s) => s.date <= today && (s.endDate && s.endDate > s.date ? s.endDate : s.date) >= today)
}

export const specialText = (s: SpecialHours) => (s.closed ? 'Closed' : s.hours || 'Special hours')
