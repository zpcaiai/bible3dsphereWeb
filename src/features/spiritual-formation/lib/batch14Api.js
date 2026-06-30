import { API_BASE } from '../../../api'

let authToken = ''

const RECORD_MAP = {
  scripture: {
    lectio_sessions: 'scriptureFormation.lectioSessions',
    memory_items: 'scriptureFormation.memoryItems',
    examen_sessions: 'scriptureFormation.examenSessions',
    confession_sessions: 'scriptureFormation.confessionSessions',
  },
  virtue_vice: {
    focuses: 'virtueVice.focuses',
    virtue_logs: 'virtueVice.virtueLogs',
    observations: 'virtueVice.observations',
    patterns: 'virtueVice.patterns',
    temptation_plans: 'virtueVice.temptationPlans',
    temptation_checkins: 'virtueVice.temptationCheckins',
    failure_reviews: 'virtueVice.failureReviews',
    fruit_assessments: 'virtueVice.fruitAssessments',
    feedback_requests: 'virtueVice.feedbackRequests',
  },
  holy_habit: {
    rule_profiles: 'holyHabit.ruleProfiles',
    commitments: 'holyHabit.ruleCommitments',
    rule_checkins: 'holyHabit.ruleCheckins',
    rule_reviews: 'holyHabit.ruleReviews',
    habit_plans: 'holyHabit.habitPlans',
    habit_checkins: 'holyHabit.habitCheckins',
    habit_reviews: 'holyHabit.habitReviews',
    sabbath_plans: 'holyHabit.sabbathPlans',
    sabbath_sessions: 'holyHabit.sabbathSessions',
    rest_audits: 'holyHabit.restAudits',
    sabbath_reviews: 'holyHabit.sabbathReviews',
    boundary_rules: 'holyHabit.boundaryRules',
    fasting_plans: 'holyHabit.fastingPlans',
    fasting_checkins: 'holyHabit.fastingCheckins',
    fasting_reviews: 'holyHabit.fastingReviews',
    simplicity_audits: 'holyHabit.simplicityAudits',
    simplicity_actions: 'holyHabit.simplicityActions',
  },
}

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readList(key) {
  if (!hasStorage()) return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeList(key, items) {
  if (!hasStorage()) return
  window.localStorage.setItem(key, JSON.stringify(items))
}

function mergeLocal(key, incoming) {
  const local = readList(key)
  const byId = new Map(local.map((item) => [item.id, item]))
  for (const item of incoming) byId.set(item.id, { ...(byId.get(item.id) || {}), ...item })
  writeList(key, Array.from(byId.values()))
}

async function requestJson(path, init = {}) {
  if (!authToken) throw new Error('No auth token')
  const res = await fetch(`${API_BASE}/spiritual-formation/batch1-4${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(init.headers || {}),
    },
  })
  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : null
  if (!res.ok) throw new Error(data?.detail || data?.error || 'Batch 1-4 API request failed')
  return data
}

export function setBatch14AuthToken(token) {
  authToken = token || ''
}

export function hasBatch14AuthToken() {
  return Boolean(authToken)
}

export function syncBatch14Record(domain, recordType, payload) {
  if (!authToken || !payload?.id) return
  requestJson(`/records/${domain}/${recordType}`, {
    method: 'POST',
    body: JSON.stringify({
      id: payload.id,
      payload,
      occurred_on: payload.date || payload.sessionDate || payload.checkinDate || '',
      status: payload.status || payload.stage || 'active',
    }),
  }).catch((error) => {
    if (import.meta.env.DEV) console.warn('[batch1-4-sync] save failed', domain, recordType, error?.message)
  })
}

export async function hydrateBatch14LocalCaches(token) {
  setBatch14AuthToken(token)
  if (!authToken || !hasStorage()) return { ok: false, hydrated: 0 }
  let hydrated = 0
  for (const [domain, types] of Object.entries(RECORD_MAP)) {
    for (const [recordType, storageKey] of Object.entries(types)) {
      try {
        const data = await requestJson(`/records/${domain}/${recordType}?limit=500`)
        const payloads = (data.items || []).map((record) => record.payload).filter(Boolean)
        if (payloads.length) {
          mergeLocal(storageKey, payloads)
          hydrated += payloads.length
        }
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[batch1-4-sync] hydrate failed', domain, recordType, error?.message)
      }
    }
  }
  return { ok: true, hydrated }
}

export { RECORD_MAP as BATCH14_RECORD_MAP }
