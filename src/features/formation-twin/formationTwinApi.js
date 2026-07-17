import { API_BASE } from '../../api'

const ROOT = `${API_BASE}/v1/formation-twin`

async function request(path, options = {}) {
  const response = await fetch(`${ROOT}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join('；')
      : data.detail
    throw new Error(detail || `请求失败（${response.status}）`)
  }
  return data
}

export function createFormationCheckin(payload) {
  return request('/checkins', { method: 'POST', body: JSON.stringify(payload) })
}

export function createFormationJournal(payload) {
  return request('/journals', { method: 'POST', body: JSON.stringify(payload) })
}

export function listFormationTimeline(filters = {}) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  return request(`/timeline${query.size ? `?${query}` : ''}`)
}

export function setFormationEventExcluded(eventId, excluded) {
  return request(`/life-events/${eventId}/${excluded ? 'exclude' : 'include'}`, { method: 'POST' })
}

export function deleteFormationEvent(eventId) {
  return request(`/life-events/${eventId}`, { method: 'DELETE' })
}

export function listFormationSources() {
  return request('/data-sources')
}

export function setFormationSourcePaused(source, paused) {
  return request(`/data-sources/${encodeURIComponent(source)}/${paused ? 'pause' : 'resume'}`, { method: 'PUT' })
}

export function uploadFormationVoice(file) {
  const body = new FormData()
  body.append('file', file, file.name || 'formation-voice.webm')
  body.append('consent_confirmed', 'true')
  return request('/voice-journals/upload', { method: 'POST', body })
}

export function updateFormationTranscript(voiceId, transcript) {
  return request(`/voice-journals/${voiceId}/transcript`, {
    method: 'PATCH',
    body: JSON.stringify({ transcript }),
  })
}

export function confirmFormationVoice(voiceId) {
  return request(`/voice-journals/${voiceId}/confirm`, { method: 'POST' })
}

export function deleteFormationVoice(voiceId) {
  return request(`/voice-journals/${voiceId}`, { method: 'DELETE' })
}

export function exportFormationTwinData() {
  return request('/export')
}

export function eraseFormationTwinData() {
  return request('/erase', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation: 'ERASE_FORMATION_TWIN_DATA' }),
  })
}

export function getEmotionalState(kind = 'current') { return request(`/emotional-state/${kind}`) }
export function rebuildEmotionalState() { return request('/emotional-state/rebuild', { method: 'POST' }) }
export function listEmotionObservations(sourceKind = '') { return request(`/emotion-observations${sourceKind ? `?source_kind=${sourceKind}` : ''}`) }
export function createEmotionObservation(payload) { return request('/emotion-observations', { method: 'POST', body: JSON.stringify(payload) }) }
export function deleteEmotionObservation(id) { return request(`/emotion-observations/${id}`, { method: 'DELETE' }) }
export function listEmotionCandidates() { return request('/emotion-candidates') }
export function reviewEmotionCandidate(id, action, payload = {}) { return request(`/emotion-candidates/${id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }) }
export function listEmotionalEpisodes() { return request('/emotional-episodes') }
export function createEmotionalEpisode(payload) { return request('/emotional-episodes', { method: 'POST', body: JSON.stringify(payload) }) }
export function resolveEmotionalEpisode(id) { return request(`/emotional-episodes/${id}/resolve`, { method: 'POST' }) }
export function mergeEmotionalEpisodes(id, episodeIds, title = '') { return request(`/emotional-episodes/${id}/merge`, { method: 'POST', body: JSON.stringify({ episode_ids: episodeIds, title }) }) }
export function splitEmotionalEpisode(id, lifeEventIds, title = '') { return request(`/emotional-episodes/${id}/split`, { method: 'POST', body: JSON.stringify({ life_event_ids: lifeEventIds, title }) }) }
export function deleteEmotionalEpisode(id) { return request(`/emotional-episodes/${id}`, { method: 'DELETE' }) }
export function getEmotionSettings() { return request('/emotion-settings') }
export function updateEmotionSettings(payload) { return request('/emotion-settings', { method: 'PUT', body: JSON.stringify(payload) }) }

export function getFormationState(kind = 'current') { return request(`/formation-state/${kind}`) }
export function rebuildFormationState() { return request('/formation-state/rebuild', { method: 'POST' }) }
export function listFormationNodes(filters = {}) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value) })
  return request(`/formation-nodes${query.size ? `?${query}` : ''}`)
}
export function createFormationNode(payload) { return request('/formation-nodes', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateFormationNode(id, payload) { return request(`/formation-nodes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteFormationNode(id) { return request(`/formation-nodes/${id}`, { method: 'DELETE' }) }
export function reviewFormationNode(id, action, payload = {}) { return request(`/formation-nodes/${id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }) }
export function listFormationReviewQueue() { return request('/formation-review-queue') }
export function bulkDismissFormationReviews(nodeIds) { return request('/formation-review-queue/bulk-dismiss', { method: 'POST', body: JSON.stringify({ node_ids: nodeIds }) }) }
export function listFormationChains() { return request('/formation-chains') }
export function createFormationChain(payload) { return request('/formation-chains', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateFormationChain(id, payload) { return request(`/formation-chains/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteFormationChain(id) { return request(`/formation-chains/${id}`, { method: 'DELETE' }) }
export function addFormationChainNode(id, nodeId, sequenceOrder) { return request(`/formation-chains/${id}/nodes`, { method: 'POST', body: JSON.stringify({ node_id: nodeId, sequence_order: sequenceOrder }) }) }
export function removeFormationChainNode(id, nodeId) { return request(`/formation-chains/${id}/nodes/${nodeId}`, { method: 'DELETE' }) }
export function addFormationChainEdge(id, payload) { return request(`/formation-chains/${id}/edges`, { method: 'POST', body: JSON.stringify(payload) }) }
export function removeFormationChainEdge(id, edgeId) { return request(`/formation-chains/${id}/edges/${edgeId}`, { method: 'DELETE' }) }
export function setFormationChainStatus(id, action) { return request(`/formation-chains/${id}/${action}`, { method: 'POST' }) }
export function duplicateFormationChain(id) { return request(`/formation-chains/${id}/duplicate-alternative`, { method: 'POST' }) }
export function syncFormationChainGraph(id) { return request(`/formation-chains/${id}/sync-graph`, { method: 'POST' }) }
export function getFormationSettings() { return request('/formation-settings') }
export function updateFormationSettings(payload) { return request('/formation-settings', { method: 'PUT', body: JSON.stringify(payload) }) }
export function getFormationContext(target) { return request(`/formation-context/${target}`) }
export function getFormationGraphStatus() { return request('/formation-graph/status') }
export function getFormationDataQuality() { return request('/formation-state/data-quality') }

export function getPatternSettings() { return request('/pattern-settings') }
export function updatePatternSettings(payload) { return request('/pattern-settings', { method: 'PUT', body: JSON.stringify(payload) }) }
export function listEventClusters() { return request('/event-clusters') }
export function createEventCluster(payload) { return request('/event-clusters', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateEventCluster(id, payload) { return request(`/event-clusters/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteEventCluster(id) { return request(`/event-clusters/${id}`, { method: 'DELETE' }) }
export function listFormationPatterns(status = '') { return request(`/patterns${status ? `?lifecycle_status=${encodeURIComponent(status)}` : ''}`) }
export function getCurrentFormationPatterns() { return request('/patterns/current') }
export function listFormationPatternCandidates() { return request('/patterns/candidates') }
export function getFormationPattern(id) { return request(`/patterns/${id}`) }
export function updateFormationPattern(id, payload) { return request(`/patterns/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteFormationPattern(id) { return request(`/patterns/${id}`, { method: 'DELETE' }) }
export function reviewFormationPattern(id, action, payload = {}) { return request(`/patterns/${id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }) }
export function getFormationPatternEvidence(id) { return request(`/patterns/${id}/evidence`) }
export function reviewFormationPatternEvidence(patternId, evidenceId, action) { return request(`/patterns/${patternId}/evidence/${evidenceId}/${action}`, { method: 'POST' }) }
export function addFormationCounterevidence(id, payload) { return request(`/patterns/${id}/counterevidence`, { method: 'POST', body: JSON.stringify(payload) }) }
export function listFormationTrajectories() { return request('/trajectories') }
export function getFormationTrajectory(id) { return request(`/trajectories/${id}`) }
export function confirmFormationTrajectory(id) { return request(`/trajectories/${id}/confirm`, { method: 'POST' }) }
export function correctFormationTrajectory(id, payload) { return request(`/trajectories/${id}/correct`, { method: 'POST', body: JSON.stringify(payload) }) }
export function listLifeSeasons() { return request('/life-seasons') }
export function createLifeSeason(payload) { return request('/life-seasons', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateLifeSeason(id, payload) { return request(`/life-seasons/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteLifeSeason(id) { return request(`/life-seasons/${id}`, { method: 'DELETE' }) }
export function setLifeSeasonActive(id, active) { return request(`/life-seasons/${id}/${active ? 'reopen' : 'close'}`, { method: 'POST' }) }
export function requestLifeSeasonReview(id) { return request(`/life-seasons/${id}/review`, { method: 'POST' }) }
export function listPatternReviews() { return request('/pattern-reviews') }
export function generatePatternReview(reviewType = 'MONTHLY_FORMATION_REVIEW') { return request(`/pattern-reviews/generate?review_type=${encodeURIComponent(reviewType)}`, { method: 'POST' }) }
export function completePatternReview(id, payload = {}) { return request(`/pattern-reviews/${id}/complete`, { method: 'POST', body: JSON.stringify(payload) }) }
export function skipPatternReview(id) { return request(`/pattern-reviews/${id}/skip`, { method: 'POST' }) }
export function rebuildFormationPatterns(reason = 'USER_REQUEST') { return request('/patterns/rebuild', { method: 'POST', body: JSON.stringify({ reason }) }) }
export function getFormationPatternRebuild(id) { return request(`/patterns/rebuild/${id}`) }
export function getLongTermFormationState() { return request('/long-term-state/current') }
export function getLongTermFormationContext() { return request('/long-term-context/formation-engine') }
export function getFormationPatternDataQuality() { return request('/patterns/data-quality') }
export function listInterpretationPreferences() { return request('/interpretation-preferences') }
export function revokeInterpretationPreference(id) { return request(`/interpretation-preferences/${id}`, { method: 'DELETE' }) }
export function eraseLongTermFormationState() { return request('/long-term-state', { method: 'DELETE', body: JSON.stringify({ confirmation: 'ERASE_LONG_TERM_FORMATION_MODEL' }) }) }

// Batch 6 — reflection mirrors and consent-gated micro interventions.
export function getCurrentDailyReflection() { return request('/reflections/daily/current') }
export function generateDailyReflection(payload = {}) { return request('/reflections/daily/generate', { method: 'POST', body: JSON.stringify(payload) }) }
export function getDailyReflection(id) { return request(`/reflections/daily/${id}`) }
export function correctDailyReflection(id, payload) { return request(`/reflections/daily/${id}/correct`, { method: 'POST', body: JSON.stringify(payload) }) }
export function dismissDailyReflection(id) { return request(`/reflections/daily/${id}/dismiss`, { method: 'POST' }) }

export function getCurrentWeeklyReflection() { return request('/reflections/weekly/current') }
export function generateWeeklyReflection(payload = {}) { return request('/reflections/weekly/generate', { method: 'POST', body: JSON.stringify(payload) }) }
export function getWeeklyReflection(id) { return request(`/reflections/weekly/${id}`) }
export function completeWeeklyReflection(id) { return request(`/reflections/weekly/${id}/complete`, { method: 'POST' }) }
export function skipWeeklyReflection(id) { return request(`/reflections/weekly/${id}/skip`, { method: 'POST' }) }
export function correctWeeklyReflection(id, payload) { return request(`/reflections/weekly/${id}/correct`, { method: 'POST', body: JSON.stringify(payload) }) }

export function getReflectionQuestion(id) { return request(`/reflection-questions/${id}`) }
export function answerReflectionQuestion(id, payload) { return request(`/reflection-questions/${id}/answer`, { method: 'POST', body: JSON.stringify(payload) }) }
export function skipReflectionQuestion(id) { return request(`/reflection-questions/${id}/skip`, { method: 'POST' }) }
export function blockReflectionQuestion(id) { return request(`/reflection-questions/${id}/do-not-ask-again`, { method: 'POST' }) }

export function getCurrentInterventionProposal() { return request('/interventions/proposals/current') }
export function getInterventionProposal(id) { return request(`/interventions/proposals/${id}`) }
export function acceptInterventionProposal(id, payload = {}) { return request(`/interventions/proposals/${id}/accept`, { method: 'POST', body: JSON.stringify(payload) }) }
export function modifyInterventionProposal(id, payload) { return request(`/interventions/proposals/${id}/modify`, { method: 'POST', body: JSON.stringify(payload) }) }
export function requestAlternativeIntervention(id) { return request(`/interventions/proposals/${id}/alternative`, { method: 'POST' }) }
export function requestSmallerIntervention(id) { return request(`/interventions/proposals/${id}/smaller`, { method: 'POST' }) }
export function decideInterventionProposal(id, decision, payload = {}) { return request(`/interventions/proposals/${id}/${decision}`, { method: 'POST', body: JSON.stringify(payload) }) }

export function listInterventions() { return request('/interventions') }
export function getIntervention(id) { return request(`/interventions/${id}`) }
export function updateInterventionExecution(id, action) { return request(`/interventions/${id}/${action}`, { method: 'POST' }) }
export function getInterventionEffectReview(id) { return request(`/interventions/${id}/effect-review`) }
export function saveInterventionEffectReview(id, payload) { return request(`/interventions/${id}/effect-review`, { method: 'POST', body: JSON.stringify(payload) }) }
export function deleteInterventionEffectReview(id) { return request(`/interventions/${id}/effect-review`, { method: 'DELETE' }) }

export function getInterventionPreferences() { return request('/intervention-preferences') }
export function updateInterventionPreferences(payload) { return request('/intervention-preferences', { method: 'PATCH', body: JSON.stringify(payload) }) }
export function resetInterventionPreferences() { return request('/intervention-preferences/reset', { method: 'POST' }) }
export function getReflectionSettings() { return request('/reflection-settings') }
export function updateReflectionSettings(payload) { return request('/reflection-settings', { method: 'PATCH', body: JSON.stringify(payload) }) }
export function getReflectionDataQuality() { return request('/reflections/data-quality') }

// Batch 7 — user-confirmed temptation cycles, early protection and recovery.
export function listTemptationCycles() { return request('/temptation-cycles') }
export function createTemptationCycle(payload) { return request('/temptation-cycles', { method: 'POST', body: JSON.stringify(payload) }) }
export function getTemptationCycle(id) { return request(`/temptation-cycles/${id}`) }
export function updateTemptationCycle(id, payload) { return request(`/temptation-cycles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteTemptationCycle(id) { return request(`/temptation-cycles/${id}`, { method: 'DELETE' }) }
export function updateTemptationCycleStatus(id, action) { return request(`/temptation-cycles/${id}/${action}`, { method: 'POST' }) }

export function getCurrentProtection() { return request('/protection/current') }
export function recalculateProtection(payload = {}) { return request('/protection/current/recalculate', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateProtectionStatus(payload) { return request('/protection/current/status-update', { method: 'POST', body: JSON.stringify(payload) }) }
export function listProtectionWarnings() { return request('/protection/warnings') }
export function acknowledgeProtectionWarning(id) { return request(`/protection/warnings/${id}/acknowledge`, { method: 'POST' }) }
export function markProtectionWarning(id, action, payload = {}) { return request(`/protection/warnings/${id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }) }
export function snoozeProtectionWarning(id, duration) { return request(`/protection/warnings/${id}/snooze`, { method: 'POST', body: JSON.stringify({ duration }) }) }

export function acceptProtectionAction(id, payload = {}) { return request(`/protection/actions/${id}/accept`, { method: 'POST', body: JSON.stringify(payload) }) }
export function requestSmallerProtectionAction(id) { return request(`/protection/actions/${id}/smaller`, { method: 'POST' }) }
export function requestAlternativeProtectionAction(id) { return request(`/protection/actions/${id}/alternative`, { method: 'POST' }) }
export function updateProtectionAction(id, action) { return request(`/protection/actions/${id}/${action}`, { method: 'POST' }) }

export function listProtectionPlans() { return request('/protection-plans') }
export function createProtectionPlan(payload) { return request('/protection-plans', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateProtectionPlan(id, payload) { return request(`/protection-plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteProtectionPlan(id) { return request(`/protection-plans/${id}`, { method: 'DELETE' }) }
export function updateProtectionPlanStatus(id, action) { return request(`/protection-plans/${id}/${action}`, { method: 'POST' }) }
export function shareProtectionPlan(id, payload) { return request(`/protection-plans/${id}/share`, { method: 'POST', body: JSON.stringify(payload) }) }

export function listProtectionContacts() { return request('/protection/support-contacts') }
export function createProtectionContact(payload) { return request('/protection/support-contacts', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateProtectionContact(id, payload) { return request(`/protection/support-contacts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteProtectionContact(id) { return request(`/protection/support-contacts/${id}`, { method: 'DELETE' }) }
export function draftProtectionMessage(id, payload = {}) { return request(`/protection/support-contacts/${id}/draft-message`, { method: 'POST', body: JSON.stringify(payload) }) }

export function startProtectionRecovery(payload) { return request('/recovery/start', { method: 'POST', body: JSON.stringify(payload) }) }
export function getCurrentProtectionRecovery() { return request('/recovery/current') }
export function updateRecoverySafety(safety_status) { return request('/recovery/current/safety-status', { method: 'POST', body: JSON.stringify({ safety_status }) }) }
export function updateRecoveryBehaviorStopped(stopped) { return request('/recovery/current/behavior-stopped', { method: 'POST', body: JSON.stringify({ stopped }) }) }
export function chooseRecoveryAction(action) { return request('/recovery/current/choose-action', { method: 'POST', body: JSON.stringify({ action }) }) }
export function stabilizeRecovery() { return request('/recovery/current/stabilized', { method: 'POST' }) }
export function deferRecoveryReview() { return request('/recovery/current/defer-review', { method: 'POST' }) }

export function getProtectionSettings() { return request('/protection/settings') }
export function updateProtectionSettings(payload) { return request('/protection/settings', { method: 'PATCH', body: JSON.stringify(payload) }) }
export function setAllProtectionWarningsPaused(paused) { return request(`/protection/settings/${paused ? 'pause-all' : 'resume-all'}`, { method: 'POST' }) }
export function resetProtectionLearning() { return request('/protection/settings/reset-learning', { method: 'POST' }) }
export function eraseProtectionData() { return request('/protection/data', { method: 'DELETE' }) }
export function getProtectionDataQuality() { return request('/protection/data-quality') }
