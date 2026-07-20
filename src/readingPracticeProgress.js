const STORAGE_PREFIX = 'devotion-reading-practice:v1:'
const INDEX_PREFIX = 'devotion-reading-practice-index:v1:'

function safePart(value) {
  return encodeURIComponent(String(value || 'guest'))
}

export function readingPracticeIdentity(user) {
  return user?.email || user?.id || user?.userId || 'guest'
}

export function readingPracticeKey(identity, planId, dayKey) {
  return `${STORAGE_PREFIX}${safePart(identity)}:${safePart(planId)}:${safePart(dayKey)}`
}

function readingPracticeIndexKey(identity, planId) {
  return `${INDEX_PREFIX}${safePart(identity)}:${safePart(planId)}`
}

export function emptyReadingPracticeRecord(planId, dayKey) {
  return {
    planId,
    dayKey,
    checkedStepIds: [],
    insight: '',
    action: '',
    totalSteps: 0,
    completedAt: null,
    updatedAt: null,
  }
}

export function readReadingPracticeRecord(storage, identity, planId, dayKey) {
  const empty = emptyReadingPracticeRecord(planId, dayKey)
  if (!storage || !planId || !dayKey) return empty
  try {
    const value = JSON.parse(storage.getItem(readingPracticeKey(identity, planId, dayKey)) || 'null')
    if (!value || typeof value !== 'object') return empty
    return {
      ...empty,
      ...value,
      checkedStepIds: Array.isArray(value.checkedStepIds) ? value.checkedStepIds : [],
    }
  } catch {
    return empty
  }
}

export function writeReadingPracticeRecord(storage, identity, record) {
  if (!storage || !record?.planId || !record?.dayKey) return record
  const next = { ...record, updatedAt: new Date().toISOString() }
  try {
    storage.setItem(readingPracticeKey(identity, next.planId, next.dayKey), JSON.stringify(next))
    const indexKey = readingPracticeIndexKey(identity, next.planId)
    const existing = JSON.parse(storage.getItem(indexKey) || '[]')
    const dayKeys = Array.isArray(existing) ? existing.filter((item) => item !== next.dayKey) : []
    storage.setItem(indexKey, JSON.stringify([next.dayKey, ...dayKeys].slice(0, 30)))
  } catch { /* device-local progress is best effort */ }
  return next
}

export function listReadingPracticeRecords(storage, identity, planId, limit = 7) {
  if (!storage) return []
  try {
    const dayKeys = JSON.parse(storage.getItem(readingPracticeIndexKey(identity, planId)) || '[]')
    if (!Array.isArray(dayKeys)) return []
    return dayKeys
      .map((dayKey) => readReadingPracticeRecord(storage, identity, planId, dayKey))
      .filter((record) => record.dayKey && record.updatedAt)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, limit)
  } catch {
    return []
  }
}

export function readingPracticePercent(record, totalSteps) {
  if (!totalSteps) return 0
  const completedSteps = Math.min(new Set(record?.checkedStepIds || []).size, totalSteps)
  const completedResponses = Number(Boolean(record?.insight?.trim())) + Number(Boolean(record?.action?.trim()))
  return Math.round((completedSteps + completedResponses) / (totalSteps + 2) * 100)
}
