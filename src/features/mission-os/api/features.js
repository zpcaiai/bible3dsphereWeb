import { API_BASE } from '../../../api'

async function request(path, token, options = {}) {
  // CSRF: Bearer-token auth only (Authorization header) — cookies are not used, so `credentials:'include'` was removed to shrink the CSRF surface.
  const response = await fetch(`${API_BASE}/v1/mission/features${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.detail || 'Mission OS Feature Flags 暂时不可用')
    error.status = response.status
    throw error
  }
  return data
}

export const fetchMissionFeatures = (token) => request('', token)
export const setMissionFeatureOverride = (token, key, body) => request(`/${encodeURIComponent(key)}/overrides`, token, { method: 'PUT', body: JSON.stringify(body) })
