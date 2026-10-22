import { API_BASE } from '../../../api'

const ROOT = `${API_BASE}/v1/digital-human`

async function request(path, options = {}) {
  const { signal, timeoutMs = 30_000, ...fetchOptions } = options
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (signal?.aborted) cancel()
  else signal?.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  try {
    const response = await fetch(`${ROOT}${path}`, {
      credentials: 'same-origin', ...fetchOptions, signal: controller.signal,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `请求失败（${response.status}）`)
    return data
  } catch (error) {
    if (timedOut) throw new Error('请求超时，请稍后重试；本次未确认完成。')
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}

export const getDigitalHumanCatalog = () => request('/catalog')
export const getDigitalHumanRuntime = () => request('/runtime')
export const createDigitalHumanTurn = (payload, options = {}) => request('/turns', { ...options, method: 'POST', body: JSON.stringify(payload) })
export const getDigitalHumanStudy = (characterId, options = {}) => request(`/characters/${encodeURIComponent(characterId)}/study`, options)
export const createDigitalHumanLiveKitToken = (payload) => request('/livekit/token', { method: 'POST', body: JSON.stringify(payload) })
export const resolveDigitalHumanIdentity = (payload) => request('/identity/resolve', { method: 'POST', body: JSON.stringify(payload) })
export const getDigitalHumanMetrics = (windowSeconds = 900) => request(`/operations/metrics?window_seconds=${encodeURIComponent(windowSeconds)}`)
export const recordDigitalHumanProviderTelemetry = (payload) => request('/telemetry/provider', { method: 'POST', body: JSON.stringify(payload) })
