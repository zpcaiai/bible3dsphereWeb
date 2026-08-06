import { API_BASE } from '../../api'

const ROOT = `${API_BASE}/v1/formation-twin/emotional-maturity`

async function request(path, options = {}) {
  const hasJsonBody = options.body !== undefined
    && !(typeof FormData !== 'undefined' && options.body instanceof FormData)
  const response = await fetch(`${ROOT}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item?.msg || item?.message || String(item)).join('；')
      : typeof data.detail === 'object' && data.detail !== null
        ? data.detail.message || data.detail.msg || JSON.stringify(data.detail)
        : data.detail
    const error = new Error(detail || `请求失败（${response.status}）`)
    error.status = response.status
    throw error
  }
  return data
}

// ── 展示契约 ────────────────────────────────────────────────────────────────
// 后端提供必填字段、禁用词与禁用图形，前端按它渲染，而不是各写一份。
// 契约变了前端会立刻跟上；前端擅自造出分数感，validate 会当场拒绝。
export function getDisplayContract() { return request('/display-contract') }
export function validateDisplayPayload(payload) {
  return request('/display-contract/validate', { method: 'POST', body: JSON.stringify(payload) })
}

// ── 试点能力与同意 ──────────────────────────────────────────────────────────
export function getPilotCapabilities() { return request('/pilot-capabilities') }
export function getConsentScopes() { return request('/consent-scopes') }
export function grantConsent(payload) {
  return request('/consent', { method: 'POST', body: JSON.stringify(payload) })
}
export function withdrawConsent(consentScope) {
  return request('/consent/withdraw', { method: 'POST', body: JSON.stringify({ consent_scope: consentScope }) })
}

// ── 安全分流与画像 ──────────────────────────────────────────────────────────
export function runTriage(payload) {
  return request('/triage', { method: 'POST', body: JSON.stringify(payload) })
}
export function submitAssessmentIntake(payload) {
  return request('/intake', { method: 'POST', body: JSON.stringify(payload) })
}
export function getNextAssessmentItem(payload) {
  return request('/items/next', { method: 'POST', body: JSON.stringify(payload) })
}
export function submitAssessmentResponse(payload) {
  return request('/responses', { method: 'POST', body: JSON.stringify(payload) })
}
export function scoreAssessment(payload) {
  return request('/score', { method: 'POST', body: JSON.stringify(payload) })
}
export function getProfile() { return request('/profile') }
// GET 只读取最近一次已保存路由；POST 才会生成新路由，避免页面加载产生副作用。
export function getGrowthRoute() { return request('/route') }
export function createGrowthRoute(emdProfileId, maxDimensions = 2) {
  return request('/route', {
    method: 'POST',
    body: JSON.stringify({ emd_profile_id: emdProfileId, max_dimensions: maxDimensions }),
  })
}

// ── 个人权利 ────────────────────────────────────────────────────────────────
export function getDeletionPlan() { return request('/deletion-plan') }
export function eraseMaturityData() { return request('/data', { method: 'DELETE' }) }

/**
 * 阶段展示所需的四个字段，少一个就会被读成分数。
 * 与后端 REQUIRED_DISPLAY_FIELDS 同名，契约测试盯着两者一致。
 */
export const REQUIRED_STAGE_FIELDS = ['stage', 'context', 'timeframe', 'confidence']

/**
 * 前端侧的最后一道：只要缺字段或出现分数感，就不渲染，而不是渲染一半。
 * 真正的判断在后端（validate_ui_payload），这里只挡住明显不该出门的东西。
 */
export function isRenderableStage(entry) {
  if (!entry || typeof entry !== 'object') return false
  if (entry.score !== null && entry.score !== undefined) return false
  return REQUIRED_STAGE_FIELDS.every((field) => {
    const value = entry[field]
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  })
}
