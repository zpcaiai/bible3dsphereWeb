// Mission OS API client — talks to the Batch 1-6 backend endpoints
// (`/api/v1/mission/...`). Org-scoped; Bearer token auth.
import { API_BASE } from '../../../api'

const realToken = (token) => (token && token !== 'cookie-session' ? token : null)

async function request(path, token, options = {}) {
  // Auth: HttpOnly session cookie (same-origin, primary) + in-memory Bearer fallback.
  const bearer = realToken(token)
  const res = await fetch(`${API_BASE}/v1/mission${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : ''
    const err = new Error(detail || 'Mission OS 服务暂时不可用')
    err.status = res.status
    err.detail = detail
    throw err
  }
  return data
}

const qs = (obj) => Object.entries(obj)
  .filter(([, v]) => v !== undefined && v !== null && v !== '')
  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')

// ---- Fields (Batch 2) ----
export const listFields = (token, org) => request(`/fields?${qs({ organizationId: org })}`, token)
export const createField = (token, org, body) =>
  request('/fields', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const assessField = (token, org, fieldId, body) =>
  request(`/fields/${fieldId}/assess`, token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })

// ---- Calling (Batch 3) ----
export const listCallingJourneys = (token, org) => request(`/calling-journeys?${qs({ organizationId: org })}`, token)
export const createCallingJourney = (token, org, body) =>
  request('/calling-journeys', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })

// ---- Readiness (Batch 3) ----
export const listReadiness = (token, org) => request(`/readiness-assessments?${qs({ organizationId: org })}`, token)
export const createReadiness = (token, org, body) =>
  request('/readiness-assessments', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })

// ---- Training (Batch 4) ----
export const listTrainingPlans = (token, org) => request(`/training-plans?${qs({ organizationId: org })}`, token)
export const createTrainingPlan = (token, org, body) =>
  request('/training-plans', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })

// ---- Sending / teams / local partners (Batch 5) ----
export const listSendingApplications = (token, org) => request(`/sending/applications?${qs({ organizationId: org })}`, token)
export const createSendingApplication = (token, org, body) =>
  request('/sending/applications', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const listCommitteeDecisions = (token, org) => request(`/sending/committee-decisions?${qs({ organizationId: org })}`, token)
export const createCommitteeDecision = (token, org, body) =>
  request('/sending/committee-decisions', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const listTeams = (token, org) => request(`/teams?${qs({ organizationId: org })}`, token)
export const createTeam = (token, org, body) =>
  request('/teams', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const listPartners = (token, org) => request(`/local-partners?${qs({ organizationId: org })}`, token)
export const createPartner = (token, org, body) =>
  request('/local-partners', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })

// ---- Legal identity / family (Batch 6) ----
export const listIdentityPaths = (token, org) => request(`/legal-identity-paths?${qs({ organizationId: org })}`, token)
export const createIdentityPath = (token, org, body) =>
  request('/legal-identity-paths', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const listFamilyPlans = (token, org) => request(`/family-readiness-plans?${qs({ organizationId: org })}`, token)
export const createFamilyPlan = (token, org, body) =>
  request('/family-readiness-plans', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const listComplianceCases = (token, org) => request(`/compliance-cases?${qs({ organizationId: org })}`, token)
export const createComplianceCase = (token, org, body) =>
  request('/compliance-cases', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const addCredential = (token, org, body) =>
  request('/credentials', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
export const openVaultSession = (token, org, purpose = 'credential_download') =>
  request('/credentials/vault-session', token, { method: 'POST', body: JSON.stringify({ organizationId: org, purpose }) })
export const downloadCredentialFile = (token, org, credentialId, secureSessionId) =>
  request(`/credentials/${credentialId}/secure-file?${qs({ organizationId: org, secureSessionId })}`, token)

// ---- Finance (Batch 6) ----
export const listFinancePlans = (token, org) => request(`/financial-plans?${qs({ organizationId: org })}`, token)
export const createFinancePlan = (token, org, body) =>
  request('/financial-plans', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })

// ---- Deployment Readiness Gate (Batch 6) ----
export const listGates = (token, org) => request(`/deployment-readiness-gates?${qs({ organizationId: org })}`, token)
export const runGate = (token, org, body) =>
  request('/deployment-readiness-gates/run', token, { method: 'POST', body: JSON.stringify({ organizationId: org, ...body }) })
