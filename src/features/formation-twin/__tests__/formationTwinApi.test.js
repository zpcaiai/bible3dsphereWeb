import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createFormationCheckin,
  getFormationContext,
  listFormationTimeline,
  rebuildFormationState,
  reviewFormationNode,
  updateFormationSettings,
  uploadFormationVoice,
  getCurrentFormationPatterns,
  listFormationPatternCandidates,
  reviewFormationPattern,
  createLifeSeason,
  rebuildFormationPatterns,
  eraseLongTermFormationState,
  generateDailyReflection,
  answerReflectionQuestion,
  requestSmallerIntervention,
  acceptInterventionProposal,
  saveInterventionEffectReview,
  updateReflectionSettings,
  createTemptationCycle,
  recalculateProtection,
  markProtectionWarning,
  acceptProtectionAction,
  startProtectionRecovery,
  updateProtectionSettings,
} from '../formationTwinApi'

describe('formationTwinApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the versioned same-origin endpoint and session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await createFormationCheckin({ client_event_id: 'checkin-1' })
    await listFormationTimeline({ limit: 25, status: 'ACCEPTED' })

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/formation-twin/checkins', expect.objectContaining({
      method: 'POST', credentials: 'same-origin',
    }))
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/formation-twin/timeline?limit=25&status=ACCEPTED')
  })

  it('does not force a JSON content type for voice form data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)
    await uploadFormationVoice(new File(['audio'], 'voice.webm', { type: 'audio/webm' }))
    const options = fetchMock.mock.calls[0][1]
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.headers['Content-Type']).toBeUndefined()
  })

  it('uses the Batch 4 rebuild, review, consent, and context contracts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await rebuildFormationState()
    await reviewFormationNode('node-1', 'partially-confirm', { content: '我认可的表达', scope: 'THIS_EVENT_ONLY' })
    await updateFormationSettings({ prayer_context_consent: true })
    await getFormationContext('prayer')

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/formation-twin/formation-state/rebuild',
      '/api/v1/formation-twin/formation-nodes/node-1/partially-confirm',
      '/api/v1/formation-twin/formation-settings',
      '/api/v1/formation-twin/formation-context/prayer',
    ])
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'POST', credentials: 'same-origin' }))
    expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining({ method: 'PUT', credentials: 'same-origin' }))
  })

  it('uses the Batch 5 pattern, season, rebuild, and scoped erasure contracts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await getCurrentFormationPatterns()
    await listFormationPatternCandidates()
    await reviewFormationPattern('pattern-1', 'narrow-scope', { scope: { scope_kind: 'CURRENT_CONTEXT_ONLY' } })
    await createLifeSeason({ title: '项目交付期' })
    await rebuildFormationPatterns()
    await eraseLongTermFormationState()

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/formation-twin/patterns/current',
      '/api/v1/formation-twin/patterns/candidates',
      '/api/v1/formation-twin/patterns/pattern-1/narrow-scope',
      '/api/v1/formation-twin/life-seasons',
      '/api/v1/formation-twin/patterns/rebuild',
      '/api/v1/formation-twin/long-term-state',
    ])
    expect(JSON.parse(fetchMock.mock.calls[5][1].body)).toEqual({ confirmation: 'ERASE_LONG_TERM_FORMATION_MODEL' })
  })

  it('uses the Batch 6 reflection, decision, routing, effect, and settings contracts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await generateDailyReflection({ user_selected_mode: 'MICRO_ONLY' })
    await answerReflectionQuestion('question-1', { answer_text: '先休息', processing_preference: 'STORE_ONLY' })
    await requestSmallerIntervention('proposal-1')
    await acceptInterventionProposal('proposal-2', { allow_cross_module_write: true })
    await saveInterventionEffectReview('execution-1', { execution_status: 'COMPLETED', helpfulness: 'HELPFUL' })
    await updateReflectionSettings({ daily_mirror_mode: 'ON_DEMAND', effect_review_enabled: false })

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/formation-twin/reflections/daily/generate',
      '/api/v1/formation-twin/reflection-questions/question-1/answer',
      '/api/v1/formation-twin/interventions/proposals/proposal-1/smaller',
      '/api/v1/formation-twin/interventions/proposals/proposal-2/accept',
      '/api/v1/formation-twin/interventions/execution-1/effect-review',
      '/api/v1/formation-twin/reflection-settings',
    ])
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ user_selected_mode: 'MICRO_ONLY' })
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ allow_cross_module_write: true })
  })

  it('uses the Batch 7 cycle, warning, protection, recovery, and privacy contracts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await createTemptationCycle({ title: '有限循环', user_confirmed: true })
    await recalculateProtection({ explicit_urge: true, user_requested_help: true })
    await markProtectionWarning('warning-1', 'inaccurate')
    await acceptProtectionAction('action-1', { user_confirmed: true, execution_mode: 'REMINDER_ONLY' })
    await startProtectionRecovery({ event_type: 'USER_REQUESTED_RECOVERY' })
    await updateProtectionSettings({ warnings_enabled: true, passive_metadata_enabled: false })

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/formation-twin/temptation-cycles',
      '/api/v1/formation-twin/protection/current/recalculate',
      '/api/v1/formation-twin/protection/warnings/warning-1/inaccurate',
      '/api/v1/formation-twin/protection/actions/action-1/accept',
      '/api/v1/formation-twin/recovery/start',
      '/api/v1/formation-twin/protection/settings',
    ])
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ user_confirmed: true, execution_mode: 'REMINDER_ONLY' })
  })
})
