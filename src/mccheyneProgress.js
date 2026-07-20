import { localDateKey, planExecutionIdentity } from './formationPlanProgress'

const LEGACY_KEY = 'mccheyne-done-v1'
const KEY_PREFIX = 'mccheyne-done-v2:'

function parse(value) {
  try {
    const result = JSON.parse(value || '{}')
    return result && typeof result === 'object' ? result : {}
  } catch {
    return {}
  }
}

export function mccheyneIdentity(user) {
  return planExecutionIdentity(user)
}

export function mccheyneDayKey(date = new Date()) {
  return localDateKey(date)
}

export function readMccheyneProgress(storage, user) {
  if (!storage) return {}
  const key = `${KEY_PREFIX}${encodeURIComponent(mccheyneIdentity(user))}`
  const current = parse(storage.getItem(key))
  if (Object.keys(current).length) return current
  const legacy = parse(storage.getItem(LEGACY_KEY))
  if (Object.keys(legacy).length) {
    try { storage.setItem(key, JSON.stringify(legacy)) } catch { /* device-local fallback */ }
  }
  return legacy
}

export function toggleMccheyneSlot(storage, user, date, slot) {
  const identity = mccheyneIdentity(user)
  const key = `${KEY_PREFIX}${encodeURIComponent(identity)}`
  const progress = readMccheyneProgress(storage, identity)
  const dayKey = mccheyneDayKey(date)
  const today = progress[dayKey] || []
  const next = {
    ...progress,
    [dayKey]: today.includes(slot) ? today.filter((item) => item !== slot) : [...today, slot],
  }
  try { storage?.setItem(key, JSON.stringify(next)) } catch { /* device-local fallback */ }
  return next
}

export function mccheyneStreak(progress, date = new Date()) {
  let count = 0
  const cursor = new Date(date)
  cursor.setHours(12, 0, 0, 0)
  for (let index = 0; index < 366; index += 1) {
    const key = mccheyneDayKey(cursor)
    if ((progress[key] || []).length === 4) count += 1
    else if (index > 0) break
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}
