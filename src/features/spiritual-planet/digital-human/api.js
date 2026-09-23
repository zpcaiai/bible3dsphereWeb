import { API_BASE } from '../../../api'

const ROOT = `${API_BASE}/v1/digital-human`

async function request(path, options = {}) {
  const response = await fetch(`${ROOT}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `请求失败（${response.status}）`)
  return data
}

export const getDigitalHumanCatalog = () => request('/catalog')
export const getDigitalHumanRuntime = () => request('/runtime')
export const createDigitalHumanTurn = (payload) => request('/turns', { method: 'POST', body: JSON.stringify(payload) })
export const createDigitalHumanLiveKitToken = (payload) => request('/livekit/token', { method: 'POST', body: JSON.stringify(payload) })
export const resolveDigitalHumanIdentity = (payload) => request('/identity/resolve', { method: 'POST', body: JSON.stringify(payload) })
export const getDigitalHumanMetrics = (windowSeconds = 900) => request(`/operations/metrics?window_seconds=${encodeURIComponent(windowSeconds)}`)
export const recordDigitalHumanProviderTelemetry = (payload) => request('/telemetry/provider', { method: 'POST', body: JSON.stringify(payload) })
