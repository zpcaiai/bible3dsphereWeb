import { API_BASE } from '../../api'

const ROOT = `${API_BASE}/v1/platform`

async function request(path, options = {}) {
  const response = await fetch(`${ROOT}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const raw = data.detail
    const detail = Array.isArray(raw)
      ? raw.map((item) => item.msg).join('；')
      : typeof raw === 'object' && raw
        ? raw.code || (raw.reason_codes || []).join('；')
        : raw
    throw new Error(detail || `请求失败（${response.status}）`)
  }
  return data
}

export function getUnifiedHome() { return request('/home') }
export function getCurrentRecommendation() { return request('/recommendations/current') }
export function decideRecommendation(id, decision, payload = {}) {
  return request(`/recommendations/${id}/${decision}`, { method: 'POST', body: JSON.stringify(payload) })
}
export function listUnifiedActions(status = '') {
  return request(`/actions${status ? `?status=${encodeURIComponent(status)}` : ''}`)
}
export function getCurrentActions() { return request('/actions/current') }
export function transitionUnifiedAction(id, transition) {
  return request(`/actions/${id}/${transition}`, { method: 'POST' })
}
export function getUnifiedTimeline(module = '') {
  return request(`/timeline${module ? `?module=${encodeURIComponent(module)}` : ''}`)
}
export function searchUnifiedData(query, modules = []) {
  const params = new URLSearchParams({ q: query })
  if (modules.length) params.set('modules', modules.join(','))
  return request(`/search?${params}`)
}
export function getContextAccessLog() { return request('/context/access-log') }
export function listContextConsents() { return request('/context/consents') }
export function setContextConsent(projectionName, payload) {
  return request(`/context/consents/${encodeURIComponent(projectionName)}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export function createDeletionManifest(payload) {
  return request('/deletions', { method: 'POST', body: JSON.stringify(payload) })
}
export function getDeletionManifest(id) { return request(`/deletions/${id}`) }
export function retryDeletionManifest(id) { return request(`/deletions/${id}/retry`, { method: 'POST' }) }
export function createRebuild(payload) { return request('/rebuilds', { method: 'POST', body: JSON.stringify(payload) }) }
export function getIntegrationHealth() { return request('/integrations/health') }

export const PLATFORM_API_ROOT = ROOT
