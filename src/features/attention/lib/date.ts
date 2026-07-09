import { ATTENTION_REMINDERS } from './constants'

export const DEFAULT_ATTENTION_TIMEZONE = 'Asia/Taipei'

export function getUserLocalDate(user?: { timezone?: string } | null, now = new Date()): string {
  const timeZone = user?.timezone || DEFAULT_ATTENTION_TIMEZONE
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function stableAttentionReminder(localDate: string): string {
  const digits = localDate.replace(/\D/g, '')
  const value = Number(digits || 0)
  return ATTENTION_REMINDERS[value % ATTENTION_REMINDERS.length]
}
