import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import FormationTwinReflections from '../FormationTwinReflections'
import {
  blockReflectionQuestion,
  decideInterventionProposal,
  generateDailyReflection,
  requestSmallerIntervention,
  skipReflectionQuestion,
  updateReflectionSettings,
} from '../formationTwinApi'

vi.mock('../formationTwinApi', () => ({
  acceptInterventionProposal: vi.fn(async () => ({ ok: true })),
  answerReflectionQuestion: vi.fn(async () => ({ ok: true })),
  blockReflectionQuestion: vi.fn(async () => ({ ok: true })),
  completeWeeklyReflection: vi.fn(async () => ({ ok: true })),
  decideInterventionProposal: vi.fn(async () => ({ ok: true })),
  generateDailyReflection: vi.fn(async () => ({ ok: true })),
  generateWeeklyReflection: vi.fn(async () => ({ ok: true })),
  getCurrentDailyReflection: vi.fn(async () => daily),
  getCurrentWeeklyReflection: vi.fn(async () => ({ review: null })),
  getInterventionPreferences: vi.fn(async () => ({ learned_preferences: [] })),
  getReflectionSettings: vi.fn(async () => ({ settings: settings })),
  listInterventions: vi.fn(async () => ({ interventions: [] })),
  modifyInterventionProposal: vi.fn(async () => ({ ok: true })),
  requestAlternativeIntervention: vi.fn(async () => ({ ok: true })),
  requestSmallerIntervention: vi.fn(async () => ({ ok: true })),
  resetInterventionPreferences: vi.fn(async () => ({ ok: true })),
  saveInterventionEffectReview: vi.fn(async () => ({ ok: true })),
  skipReflectionQuestion: vi.fn(async () => ({ ok: true })),
  skipWeeklyReflection: vi.fn(async () => ({ ok: true })),
  updateInterventionExecution: vi.fn(async () => ({ ok: true })),
  updateInterventionPreferences: vi.fn(async () => ({ ok: true })),
  updateReflectionSettings: vi.fn(async () => ({ ok: true })),
}))

const settings = {
  daily_mirror_mode: 'ON_DEMAND', weekly_review_enabled: true, effect_review_enabled: true,
  cross_module_routing_enabled: false, preference_learning_enabled: true, interventions_paused: false,
  maximum_action_minutes: 10,
  quiet_hours_json: { start: '22:00', end: '07:00', timezone: 'Asia/Shanghai' },
}

const daily = {
  mirror: {
    id: 'mirror-1', headline: '高压力下出现了一个新的回应',
    mirror_text: '你今天记录了较高压力和较低精力，也主动联系了同事。',
    source_references_json: [{ reference_type: 'REFLECTION_CONTEXT', reference_id: 'context-1' }],
    limitations_json: ['只反映已有记录。'],
  },
  question: { id: 'question-1', question_text: '是什么帮助你今天选择联系同事？' },
  proposal: {
    id: 'proposal-1', title: '提前结束今天的工作', description: '今晚提前20分钟停止工作。',
    rationale: '符合当前容量。', intervention_type: 'REST', estimated_duration_minutes: 1,
    target_module: 'REST', one_time: true, reminder_enabled: false,
  },
}

describe('FormationTwinReflections', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('shows one mirror, one question and one optional action without scoring', async () => {
    render(<FormationTwinReflections user={{ id: 'u-1' }} />)
    expect(await screen.findByText('高压力下出现了一个新的回应')).toBeTruthy()
    expect(screen.getByText('是什么帮助你今天选择联系同事？')).toBeTruthy()
    expect(screen.getByText('提前结束今天的工作')).toBeTruthy()
    expect(screen.getByText('这是一项可选建议，不是命令。完成并不等于成长，未完成也不等于失败。')).toBeTruthy()
    expect(document.body.textContent).not.toContain('属灵执行力')
    expect(document.body.textContent).not.toContain('成长积分')
  })

  it('exposes the required internal information architecture routes', () => {
    render(<FormationTwinReflections user={{ id: 'u-1' }} />)
    const routes = Array.from(document.querySelectorAll('.ft-reflection-tabs [data-route]')).map((node) => node.dataset.route)
    expect(routes).toEqual([
      '/formation-twin/reflection/today', '/formation-twin/reflection/weekly',
      '/formation-twin/actions/current', '/formation-twin/actions/history',
      '/formation-twin/effect-reviews', '/formation-twin/reflection-settings',
    ])
  })

  it('offers smaller and no-action decisions before any target write', async () => {
    render(<FormationTwinReflections user={{ id: 'u-1' }} />)
    await screen.findByText('提前结束今天的工作')
    fireEvent.click(screen.getByRole('tab', { name: '当前行动' }))
    fireEvent.click(screen.getByRole('button', { name: '再小一点' }))
    await waitFor(() => expect(requestSmallerIntervention).toHaveBeenCalledWith('proposal-1'))
    fireEvent.click(screen.getByRole('button', { name: '今天不行动' }))
    await waitFor(() => expect(decideInterventionProposal).toHaveBeenCalledWith('proposal-1', 'no-action'))
  })

  it('respects question skip and do-not-ask choices', async () => {
    render(<FormationTwinReflections user={{ id: 'u-1' }} />)
    await screen.findByText('是什么帮助你今天选择联系同事？')
    fireEvent.click(screen.getByRole('button', { name: '跳过' }))
    await waitFor(() => expect(skipReflectionQuestion).toHaveBeenCalledWith('question-1'))
    fireEvent.click(screen.getByRole('button', { name: '不再问类似问题' }))
    await waitFor(() => expect(blockReflectionQuestion).toHaveBeenCalledWith('question-1'))
  })

  it('keeps reminders off by default and saves quiet hours explicitly', async () => {
    render(<FormationTwinReflections user={{ id: 'u-1' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '偏好与节奏' }))
    await screen.findByText('默认按需生成、无主动每日推送、通知内容脱敏')
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    await waitFor(() => expect(updateReflectionSettings).toHaveBeenCalledWith(expect.objectContaining({
      daily_mirror_mode: 'ON_DEMAND',
      quiet_hours: { start: '22:00', end: '07:00', timezone: 'Asia/Shanghai' },
    })))
  })

  it('hands elevated safety results to the existing crisis entry', async () => {
    const onSafety = vi.fn()
    generateDailyReflection.mockResolvedValueOnce({ ok: true, status: 'CRISIS_ROUTED', crisis_first: true })
    render(<FormationTwinReflections user={{ id: 'u-1' }} onSafety={onSafety} />)
    fireEvent.click(screen.getByRole('button', { name: '生成今日镜像' }))
    await waitFor(() => expect(onSafety).toHaveBeenCalledTimes(1))
  })
})
