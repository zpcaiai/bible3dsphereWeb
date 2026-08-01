import { API_BASE } from '../../api'

const BASE = `${API_BASE}/v1/sunday-school/ai-formation`

async function json(response, fallback) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail
    const message = typeof detail === 'string' ? detail : detail?.message || (Array.isArray(detail) ? detail.map((item) => item.msg).join('; ') : '')
    const error = new Error(message || fallback)
    error.status = response.status
    error.detail = detail
    throw error
  }
  return data
}

export async function fetchAiFormationManifest() {
  return json(await fetch(`${BASE}/manifest`, { credentials: 'same-origin', cache: 'no-store' }), '主日学模块暂时不可用')
}

export async function saveAiFormationRecord(recordType, payload, idempotencyKey = crypto.randomUUID()) {
  return json(await fetch(`${BASE}/records`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_type: recordType, payload, idempotency_key: idempotencyKey, retention_days: 90 }),
  }), '保存失败，请稍后重试')
}

export async function fetchAiFormationSchemas(batchId) {
  return json(await fetch(`${BASE}/schemas?batch_id=${encodeURIComponent(batchId)}`, {
    credentials: 'same-origin', cache: 'no-store',
  }), '课程契约暂时不可用')
}

export async function saveAiFormationSchemaRecord(schemaName, payload, idempotencyKey = crypto.randomUUID()) {
  return json(await fetch(`${BASE}/records`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_type: schemaName, schema_name: schemaName, payload, idempotency_key: idempotencyKey, retention_days: 90 }),
  }), '保存失败，请检查必填字段')
}

export async function fetchAiFormationRecords(batchId) {
  return json(await fetch(`${BASE}/records?batch_id=${encodeURIComponent(batchId)}`, {
    credentials: 'same-origin', cache: 'no-store',
  }), '记录暂时不可用')
}

export async function updateAiFormationRecord(recordId, payload, expectedRevision) {
  return json(await fetch(`${BASE}/records/${encodeURIComponent(recordId)}`, {
    method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, expected_revision: expectedRevision }),
  }), '更新失败；记录可能已被其他请求修改')
}

export async function transitionAiFormationRecord(recordId, transition, expectedRevision) {
  return json(await fetch(`${BASE}/records/${encodeURIComponent(recordId)}/transition`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transition, expected_revision: expectedRevision }),
  }), '状态切换失败')
}

export async function deleteAiFormationRecord(recordId) {
  return json(await fetch(`${BASE}/records/${encodeURIComponent(recordId)}`, { method: 'DELETE', credentials: 'same-origin' }), '删除失败')
}

export async function fetchApprovedAiFormationContent(batchId = '', ageBand = '') {
  const query = new URLSearchParams()
  if (batchId) query.set('batch_id', batchId)
  if (ageBand) query.set('age_band', ageBand)
  const suffix = query.toString() ? `?${query}` : ''
  return json(await fetch(`${BASE}/content${suffix}`, { credentials: 'same-origin', cache: 'no-store' }), '审核内容暂时不可用')
}


export async function exportAiFormationData() {
  return json(await fetch(`${BASE}/data-rights/export`, { credentials: 'same-origin', cache: 'no-store' }), '导出失败')
}

export async function deleteAllAiFormationRecords() {
  return json(await fetch(`${BASE}/data-rights/records`, { method: 'DELETE', credentials: 'same-origin' }), '删除失败')
}

export async function fetchAiFormationReviewQueue(batchId = '') {
  const query = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : ''
  return json(await fetch(`${BASE}/content/review-queue${query}`, { credentials: 'same-origin', cache: 'no-store' }), '审核队列暂时不可用')
}

export async function fetchAiFormationContentVersion(contentId, version) {
  return json(await fetch(`${BASE}/content/${encodeURIComponent(contentId)}/versions/${encodeURIComponent(version)}`, {
    credentials: 'same-origin', cache: 'no-store',
  }), '内容版本暂时不可用')
}

export async function reviewAiFormationContent(contentId, version, review) {
  return json(await fetch(`${BASE}/content/${encodeURIComponent(contentId)}/versions/${encodeURIComponent(version)}/reviews`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review),
  }), '审核提交失败')
}

export async function publishAiFormationContent(contentId, version, contentSha256) {
  return json(await fetch(`${BASE}/content/${encodeURIComponent(contentId)}/versions/${encodeURIComponent(version)}/publish`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_sha256: contentSha256, expected_review_status: 'approved', reason_code: 'AUTHORIZED_HUMAN_PUBLICATION' }),
  }), '发布失败')
}

export async function retireAiFormationContent(contentId, version) {
  return json(await fetch(`${BASE}/content/${encodeURIComponent(contentId)}/versions/${encodeURIComponent(version)}/retire`, {
    method: 'POST', credentials: 'same-origin',
  }), '停用失败')
}

export async function fetchAiFormationCertification(filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value))
  return json(await fetch(`${BASE}/certification/status?${query}`, { credentials: 'same-origin', cache: 'no-store' }), '认证证据暂时不可用')
}

export async function fetchAiFormationScenarios() {
  return json(await fetch(`${BASE}/scenarios`, { credentials: 'same-origin', cache: 'no-store' }), '情境暂时不可用')
}

export async function startAiFormationScenario(scenarioId, idempotencyKey = crypto.randomUUID()) {
  return json(await fetch(`${BASE}/scenarios/sessions`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id: scenarioId, idempotency_key: idempotencyKey, retention_days: 30 }),
  }), '情境启动失败')
}

export async function chooseAiFormationScenario(sessionId, choice, expectedRevision) {
  return json(await fetch(`${BASE}/scenarios/sessions/${encodeURIComponent(sessionId)}/choices`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice, expected_revision: expectedRevision }),
  }), '情境选择失败')
}

export async function addAiFormationReleaseEvidence(evidence) {
  return json(await fetch(`${BASE}/certification/evidence`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evidence),
  }), '发布证据记录失败')
}

export async function createAiFormationReleaseDecision(decision) {
  return json(await fetch(`${BASE}/certification/release-decisions`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(decision),
  }), '发布决策失败')
}
