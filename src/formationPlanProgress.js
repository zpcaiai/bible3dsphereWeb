const EXECUTION_PREFIX = 'spiritual-formation-plan-executions:v1:'
const REVIEW_PREFIX = 'spiritual-formation-plan-reviews:v1:'

function safePart(value) {
  return encodeURIComponent(String(value || 'guest'))
}
function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value || 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function mondayKey(date) {
  const value = new Date(date)
  value.setHours(12, 0, 0, 0)
  const day = value.getDay() || 7
  value.setDate(value.getDate() - day + 1)
  return localDateKey(value)
}

export function planExecutionIdentity(user) {
  if (typeof user === 'string') return user || 'guest'
  return user?.email || user?.id || user?.userId || 'guest'
}

export function localDateKey(date = new Date()) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function normalizePlanActions(actions = [], defaultCadence = 'once') {
  return actions
    .map((action, index) => {
      if (typeof action === 'string') {
        return { id: `action-${index + 1}`, title: action, cadence: defaultCadence }
      }
      const title = action?.title || action?.name || action?.description || action?.practice || ''
      if (!title) return null
      return {
        ...action,
        id: String(action.id || action.key || `action-${index + 1}`),
        title,
        cadence: action.cadence || defaultCadence,
      }
    })
    .filter(Boolean)
}

export function planActionPeriodKey(action, date = new Date()) {
  if (action?.cadence === 'daily') return localDateKey(date)
  if (action?.cadence === 'weekly') return `week:${mondayKey(date)}`
  return 'once'
}

function executionStorageKey(identity, planId) {
  return `${EXECUTION_PREFIX}${safePart(identity)}:${safePart(planId)}`
}

function reviewStorageKey(identity, planId) {
  return `${REVIEW_PREFIX}${safePart(identity)}:${safePart(planId)}`
}

export function listPlanExecutions(storage, identity, planId) {
  if (!storage || !planId) return []
  const records = safeParse(storage.getItem(executionStorageKey(identity, planId)), [])
  return Array.isArray(records) ? records : []
}

export function readPlanExecution(storage, identity, planId, action, date = new Date()) {
  const periodKey = planActionPeriodKey(action, date)
  return listPlanExecutions(storage, identity, planId)
    .find((record) => record.actionId === String(action.id) && record.periodKey === periodKey) || null
}

export function writePlanExecution(storage, identity, planId, action, patch = {}, date = new Date()) {
  if (!storage || !planId || !action?.id) return null
  const now = new Date().toISOString()
  const periodKey = planActionPeriodKey(action, date)
  const records = listPlanExecutions(storage, identity, planId)
  const previous = records.find((record) => record.actionId === String(action.id) && record.periodKey === periodKey)
  const next = {
    id: `${planId}:${action.id}:${periodKey}`,
    userId: String(identity || 'guest'),
    planId: String(planId),
    planTitle: patch.planTitle || previous?.planTitle || '',
    actionId: String(action.id),
    actionTitle: action.title,
    cadence: action.cadence || 'once',
    periodKey,
    date: localDateKey(date),
    status: patch.status || previous?.status || 'planned',
    reflection: patch.reflection ?? previous?.reflection ?? '',
    evidence: patch.evidence ?? previous?.evidence ?? '',
    completedAt: (patch.status || previous?.status) === 'completed' ? (previous?.completedAt || now) : null,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  }
  const updated = [next, ...records.filter((record) => record.id !== next.id)]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 600)
  try { storage.setItem(executionStorageKey(identity, planId), JSON.stringify(updated)) } catch { /* device-local fallback */ }
  return next
}

export function listPlanReviews(storage, identity, planId) {
  if (!storage || !planId) return []
  const reviews = safeParse(storage.getItem(reviewStorageKey(identity, planId)), [])
  return Array.isArray(reviews) ? reviews : []
}

export function writePlanReview(storage, identity, planId, text, date = new Date()) {
  if (!storage || !planId || !String(text || '').trim()) return null
  const weekKey = mondayKey(date)
  const now = new Date().toISOString()
  const reviews = listPlanReviews(storage, identity, planId)
  const previous = reviews.find((review) => review.weekKey === weekKey)
  const next = {
    id: `${planId}:review:${weekKey}`,
    userId: String(identity || 'guest'),
    planId: String(planId),
    weekKey,
    text: String(text).trim(),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  }
  const updated = [next, ...reviews.filter((review) => review.id !== next.id)].slice(0, 52)
  try { storage.setItem(reviewStorageKey(identity, planId), JSON.stringify(updated)) } catch { /* device-local fallback */ }
  return next
}

export function planExecutionSummary(storage, identity, planId, actions = [], date = new Date()) {
  const normalized = normalizePlanActions(actions)
  const records = listPlanExecutions(storage, identity, planId)
  const current = normalized.map((action) => ({
    action,
    record: records.find((record) => record.actionId === action.id && record.periodKey === planActionPeriodKey(action, date)) || null,
  }))
  const completed = current.filter((item) => item.record?.status === 'completed').length
  const blocked = current.filter((item) => item.record?.status === 'blocked').length
  const recentCutoff = new Date(date)
  recentCutoff.setHours(0, 0, 0, 0)
  recentCutoff.setDate(recentCutoff.getDate() - 6)
  const recentCompleted = records.filter((record) => record.status === 'completed' && new Date(`${record.date}T12:00:00`) >= recentCutoff).length
  return {
    total: normalized.length,
    completed,
    blocked,
    percent: normalized.length ? Math.round((completed / normalized.length) * 100) : 0,
    totalCheckins: records.filter((record) => record.status === 'completed').length,
    recentCompleted,
    current,
  }
}
