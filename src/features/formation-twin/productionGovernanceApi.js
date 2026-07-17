import { API_BASE } from '../../api'

const SCENARIO_ROOT = `${API_BASE}/v1/formation-twin`
const GOVERNANCE_ROOT = `${API_BASE}/v1/governance`
const COMPLIANCE_ROOT = `${API_BASE}/v1/compliance`

async function request(root, path, options = {}) {
  const response = await fetch(`${root}${path}`, {
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
        ? raw.code || raw.message || (raw.blockers || raw.reason_codes || []).join('；')
        : raw
    throw new Error(detail || `请求失败（${response.status}）`)
  }
  return data
}

const scenarioRequest = (path, options) => request(SCENARIO_ROOT, path, options)
const governanceRequest = (path, options) => request(GOVERNANCE_ROOT, path, options)
const complianceRequest = (path, options) => request(COMPLIANCE_ROOT, path, options)

export function listFormationScenarios() { return scenarioRequest('/scenarios') }
export function createFormationScenario(payload) { return scenarioRequest('/scenarios', { method: 'POST', body: JSON.stringify(payload) }) }
export function getFormationScenario(id) { return scenarioRequest(`/scenarios/${id}`) }
export function updateFormationScenario(id, payload) { return scenarioRequest(`/scenarios/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteFormationScenario(id) { return scenarioRequest(`/scenarios/${id}`, { method: 'DELETE' }) }
export function regenerateFormationScenario(id) { return scenarioRequest(`/scenarios/${id}/generate`, { method: 'POST' }) }
export function addFormationScenarioBranch(id, payload) { return scenarioRequest(`/scenarios/${id}/add-branch`, { method: 'POST', body: JSON.stringify(payload) }) }
export function convertScenarioToProposal(id, branchId) { return scenarioRequest(`/scenarios/${id}/convert-to-proposal`, { method: 'POST', body: JSON.stringify({ branch_id: branchId, user_confirmed_conversion: true }) }) }
export function markFormationScenarioInaccurate(id) { return scenarioRequest(`/scenarios/${id}/mark-inaccurate`, { method: 'POST' }) }

export function getComplianceDataMap() { return complianceRequest('/data-map') }
export function getProcessingActivities() { return complianceRequest('/processing-activities') }
export function listApprovedThirdParties() { return complianceRequest('/third-parties') }
export function getGovernedSystemStatus() { return complianceRequest('/system-status') }
export function createComplianceRequest(type, scope = {}) {
  const path = { EXPORT_DATA: 'export', DELETE_DATA: 'delete', RESTRICT_PROCESSING: 'restrict', OBJECT_TO_MODEL_PROCESSING: 'object-to-profiling' }[type]
  if (!path) throw new Error('Unsupported compliance request')
  return complianceRequest(`/requests/${path}`, { method: 'POST', body: JSON.stringify(scope) })
}
export function getComplianceRequest(id) { return complianceRequest(`/requests/${id}`) }

export function listGovernanceReleases() { return governanceRequest('/releases') }
export function getGovernanceRelease(id) { return governanceRequest(`/releases/${id}`) }
export function transitionGovernanceRelease(id, action) { return governanceRequest(`/releases/${id}/${action}`, { method: 'POST' }) }
export function listEvaluationDatasets() { return governanceRequest('/evaluation-datasets') }
export function listEvaluationRuns() { return governanceRequest('/evaluation-runs') }
export function getGovernanceRedTeam() { return governanceRequest('/evaluations/red-team') }
export function listGovernedComponents() { return governanceRequest('/components') }
export function getGovernanceDataQuality() { return governanceRequest('/data-quality') }
export function listGovernanceDataQualityIssues() { return governanceRequest('/data-quality/issues') }
export function remediateGovernanceIssue(id) { return governanceRequest(`/data-quality/issues/${id}/remediate`, { method: 'POST' }) }
export function listGovernanceKillSwitches() { return governanceRequest('/kill-switches') }
export function setGovernanceKillSwitch(id, active, reasonCode) { return governanceRequest(`/kill-switches/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'POST', body: JSON.stringify({ reason_code: reasonCode }) }) }
export function listGovernanceIncidents() { return governanceRequest('/incidents') }
export function getGovernanceSlo() { return governanceRequest('/slo') }

export const PRODUCTION_GOVERNANCE_API_ROOTS = { SCENARIO_ROOT, GOVERNANCE_ROOT, COMPLIANCE_ROOT }
