import { API_BASE } from '../../../api'

const realToken = (token) => (token && token !== 'cookie-session' ? token : null)

async function request(path, token, options = {}) {
  // Auth: HttpOnly session cookie (same-origin, primary) + in-memory Bearer fallback.
  const bearer = realToken(token)
  const response = await fetch(`${API_BASE}/v1/mission/features${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
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
