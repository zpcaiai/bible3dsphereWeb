import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import FormationTwinMaturity from '../FormationTwinMaturity'
import { isRenderableStage, REQUIRED_STAGE_FIELDS } from '../emotionalMaturityApi'
import {
  eraseMaturityData,
  getConsentScopes,
  getGrowthRoute,
  getNextAssessmentItem,
  getProfile,
  grantConsent,
  runTriage,
  scoreAssessment,
  submitAssessmentIntake,
  submitAssessmentResponse,
} from '../emotionalMaturityApi'

/**
 * 这一屏最容易出错的不是取不到数据，而是把「当前一段时间的表现」渲染成「我的等级」。
 * 所以测试盯的主要是三件事：标签与免责声明确实来自契约、缺字段的阶段不渲染、
 * 分流判定不安全时评估内容整体让位给安全入口。
 */

const contract = {
  contract_version: 'emd-display-contract-1.0',
  profile: 'PILOT',
  required_fields_per_stage: ['stage', 'context', 'timeframe', 'confidence'],
  required_labels: ['exploratory', '非临床', '个人反思用途', '试点版本'],
  disclaimers: [
    '阶段不是分数，不能相加，也不能与其他用户比较。',
    '阶段描述的是当前一段时间的表现，不是你这个人。',
    '情感成熟不等于属灵成熟，本系统不评估救恩、圣灵同在或神的评价。',
  ],
  forbidden_visualisations: ['PROGRESS_BAR', 'GAUGE', 'RADAR_SCORE', 'LEADERBOARD', 'PERCENTILE_BADGE'],
  confidence_vocabulary: {
    INSUFFICIENT: '证据不足，只作参考',
    PROVISIONAL: '初步印象，可能会变',
    MODERATE: '有一定证据支持',
    HIGHER: '多次、多情境证据一致',
  },
}

const capabilities = {
  profile: 'PILOT', sharing_allowed: false, group_features_allowed: false,
  max_certifiable_level: 'RESTRICTED_PILOT',
}

const scopes = {
  scopes: {
    EMD_SELF_ASSESSMENT: '进行一次性的私人情感成熟度自评',
    EMD_BEHAVIOR_EVIDENCE: '记录并使用最近真实行为作为证据',
  },
  granted_scopes: ['EMD_SELF_ASSESSMENT'],
  withheld_scopes: { EMD_PASTORAL_SHARE: '试点档未认证第三方分享，因此不提供该同意项' },
}

const goodStage = {
  dimension_code: 'D9', dimension_name: '冲突、脆弱表达与关系修复',
  stage: 'E3', stage_label: '在熟悉场景中能自己采取不同做法',
  context: '与同事的冲突', timeframe: '最近 30 天',
  confidence: 'MODERATE', confidence_label: '有一定证据支持',
  evidence_count: 4, score: null,
}

vi.mock('../emotionalMaturityApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getDisplayContract: vi.fn(async () => contract),
    getPilotCapabilities: vi.fn(async () => capabilities),
    getConsentScopes: vi.fn(async () => scopes),
    getProfile: vi.fn(async () => ({ profile: { emd_profile_id: 'profile-1', dimensions: [goodStage] } })),
    getGrowthRoute: vi.fn(async () => ({ route: { assignments: [] } })),
    runTriage: vi.fn(async () => ({ assessment_allowed: true, safety_level: 'NONE' })),
    submitAssessmentIntake: vi.fn(async () => ({ status: 'READY' })),
    getNextAssessmentItem: vi.fn(async () => ({ decision: 'stop' })),
    submitAssessmentResponse: vi.fn(async () => ({ raw_text_stored: false })),
    scoreAssessment: vi.fn(async () => ({ emd_profile_id: 'profile-2' })),
    createGrowthRoute: vi.fn(async () => ({ assignments: [] })),
    grantConsent: vi.fn(async () => ({ decision: 'GRANTED', session_id: 'session-1', granted_scopes: ['EMD_SELF_ASSESSMENT'] })),
    withdrawConsent: vi.fn(async () => ({ ok: true })),
    eraseMaturityData: vi.fn(async () => ({
      receipt: { user_message: '你的情感成熟度数据已删除。备份副本会在备份保留期内自然过期。' },
    })),
  }
})

beforeEach(() => { setRuntimeLang('zh') })
afterEach(() => { cleanup(); vi.clearAllMocks(); setRuntimeLang('zh') })

describe('FormationTwinMaturity', () => {
  it('访客不读取任何个人数据', async () => {
    render(<FormationTwinMaturity user={null} />)
    expect(await screen.findByText(/登录后才会读取/)).toBeTruthy()
    expect(screen.queryByTestId('emd-stage-card')).toBeNull()
  })

  it('试点标签来自契约而不是前端硬写', async () => {
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    await waitFor(() => expect(screen.getAllByTestId('emd-label').length).toBe(4))
    expect(screen.getByText('exploratory')).toBeTruthy()
    expect(screen.getByText('非临床')).toBeTruthy()
  })

  it('契约里的三条免责声明逐字渲染', async () => {
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    const list = await screen.findByTestId('emd-disclaimers')
    contract.disclaimers.forEach((line) => expect(list.textContent).toContain(line))
  })

  it('阶段与情境、时间范围、置信度同时出现', async () => {
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    const card = await screen.findByTestId('emd-stage-card')
    expect(card.textContent).toContain('与同事的冲突')
    expect(card.textContent).toContain('最近 30 天')
    expect(card.textContent).toContain('有一定证据支持')
  })

  it('阶段卡片里不出现任何分数、百分比或排名', async () => {
    // 检查范围必须限定在「系统在陈述什么」，不能整页扫：
    // 免责声明里就写着「不生成总分、百分位或与他人的排名」，
    // 整页匹配会把这句话本身当成违规——和后端 validate_ui_payload
    // 区分「系统的断言」与「回显用户原话」是同一个道理。
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    const card = await screen.findByTestId('emd-stage-card')
    expect(card.textContent).not.toMatch(/\d+\s*分(?!享)/)
    expect(card.textContent).not.toMatch(/\d+\s*%/)
    expect(card.textContent).not.toContain('排名')
    expect(card.textContent).not.toContain('总分')
  })

  it('禁用图形一个都不用', async () => {
    // 契约点名禁掉进度条、仪表盘、雷达图、排行榜、百分位徽章。
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    await screen.findByTestId('emd-stage-card')
    const section = screen.getByTestId('emd-section')
    expect(section.querySelectorAll('progress, meter').length).toBe(0)
    expect(section.querySelectorAll('[role="progressbar"], [role="meter"]').length).toBe(0)
    expect(section.querySelectorAll('svg circle[stroke-dasharray]').length).toBe(0)
  })

  it('缺字段的阶段不渲染，而不是渲染一半', async () => {
    getProfile.mockResolvedValueOnce({
      profile: { dimensions: [{ ...goodStage, context: '' }, { ...goodStage, dimension_code: 'D2' }] },
    })
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    await waitFor(() => expect(screen.getAllByTestId('emd-stage-card').length).toBe(1))
  })

  it('带 score 的条目一律不渲染', () => {
    expect(isRenderableStage({ ...goodStage, score: 72 })).toBe(false)
    expect(isRenderableStage(goodStage)).toBe(true)
    REQUIRED_STAGE_FIELDS.forEach((field) => {
      expect(isRenderableStage({ ...goodStage, [field]: '' })).toBe(false)
    })
  })

  it('分流判定不安全时，评估内容整体让位给安全入口', async () => {
    runTriage.mockResolvedValueOnce({ assessment_allowed: false, safety_level: 'IMMINENT' })
    const onSafety = vi.fn()
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} onSafety={onSafety} />)
    await screen.findByTestId('emd-stage-card')

    fireEvent.change(screen.getByLabelText(/用几句话说说最近的状态/), { target: { value: '我不想活了' } })
    fireEvent.click(screen.getByText('完成安全分流并开始自评'))

    await waitFor(() => expect(screen.getByTestId('emd-safety-block')).toBeTruthy())
    expect(screen.queryByTestId('emd-stage-card')).toBeNull()
    expect(onSafety).toHaveBeenCalled()
    expect(runTriage).toHaveBeenCalledWith({ session_id: 'session-1', free_text: '我不想活了' })
  })

  it('未授权时不能启动，并可显式授权后再进入分流', async () => {
    getConsentScopes.mockResolvedValueOnce({ ...scopes, granted_scopes: [] })
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    const start = await screen.findByRole('button', { name: '完成安全分流并开始自评' })
    expect(start.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '授权私人自评' }))
    await waitFor(() => expect(grantConsent).toHaveBeenCalledWith({
      requested_scopes: ['EMD_SELF_ASSESSMENT'],
      granted_scopes: ['EMD_SELF_ASSESSMENT'],
      user_acknowledged_limits: true,
    }))
    await waitFor(() => expect(start.disabled).toBe(false))
  })

  it('安全分流后执行可跳过题目，并从真实后端响应生成阶段描述', async () => {
    getNextAssessmentItem
      .mockResolvedValueOnce({
        decision: 'ask_item',
        rendered_item: {
          item_id: 'D2-SR-001', dimension_code: 'D2', item_type: 'SR',
          item_type_label: '自我描述', rendered_text: '情绪上来时，我通常能注意到。',
          response_mode: 'likert', skippable: true, skip_note: '跳过不会被解读为回避。',
        },
      })
      .mockResolvedValueOnce({ decision: 'stop' })
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    fireEvent.click(await screen.findByRole('button', { name: '完成安全分流并开始自评' }))
    expect(await screen.findByTestId('emd-assessment-item')).toBeTruthy()
    const questionHeading = screen.getByRole('heading', { name: '情绪上来时，我通常能注意到。' })
    expect(document.activeElement).toBe(questionHeading)
    expect(screen.getByText(/第 1 题，最多 6 题/)).toBeTruthy()
    fireEvent.click(screen.getByLabelText(/^3/))
    fireEvent.click(screen.getByRole('button', { name: '保存并继续' }))
    await waitFor(() => expect(submitAssessmentResponse).toHaveBeenCalledWith(expect.objectContaining({
      session_id: 'session-1', item_id: 'D2-SR-001', raw_response: '3', source_type: 'self_report',
    })))
    await waitFor(() => expect(scoreAssessment).toHaveBeenCalledWith(expect.objectContaining({ session_id: 'session-1' })))
    expect(submitAssessmentIntake).toHaveBeenCalledWith({ session_id: 'session-1', submitted: {} })
    expect(await screen.findByTestId('emd-assessment-complete')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '完成安全分流并开始自评' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '开始一次新的私人自评' }))
    expect(screen.getByRole('button', { name: '完成安全分流并开始自评' })).toBeTruthy()
  })

  it('试点期被关掉的同意项要说明原因，而不是悄悄消失', async () => {
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    const withheld = await screen.findByTestId('emd-withheld')
    expect(withheld.textContent).toContain('试点档未认证第三方分享')
  })

  it('试点期明确写出不向任何第三方分享', async () => {
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    expect((await screen.findByTestId('emd-sharing-off')).textContent).toContain('不向任何第三方分享')
  })

  it('没有证据时不虚构结论', async () => {
    getProfile.mockResolvedValueOnce({ profile: { dimensions: [] } })
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    expect((await screen.findByTestId('emd-empty')).textContent).toContain('不会为了填满页面而虚构')
  })

  it('可选的历史路由加载失败时仍保留阶段描述和新的自评入口', async () => {
    getGrowthRoute.mockRejectedValueOnce(new Error('route unavailable'))
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    expect(await screen.findByTestId('emd-stage-card')).toBeTruthy()
    expect(screen.getByText(/已有阶段描述或下一步暂时无法加载/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '完成安全分流并开始自评' })).toBeTruthy()
  })

  it('真实行为题需要可见确认且把发生状态提交给服务器', async () => {
    getConsentScopes.mockResolvedValueOnce({
      ...scopes,
      granted_scopes: ['EMD_SELF_ASSESSMENT', 'EMD_BEHAVIOR_EVIDENCE'],
    })
    getNextAssessmentItem
      .mockResolvedValueOnce({
        decision: 'ask_item',
        rendered_item: {
          item_id: 'D2-BE-001', dimension_code: 'D2', item_type: 'BE',
          item_type_label: '最近真实行为事件', rendered_text: '最近一次情绪上来时，你实际做了什么？',
          response_mode: 'open_text', skip_note: '可以跳过。',
        },
      })
      .mockResolvedValueOnce({ decision: 'stop' })
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    fireEvent.click(await screen.findByRole('button', { name: '完成安全分流并开始自评' }))
    fireEvent.change(await screen.findByLabelText('你的回答（可跳过）'), { target: { value: '我先暂停，再说明我的感受。' } })
    const save = screen.getByRole('button', { name: '保存并继续' })
    expect(save.disabled).toBe(true)
    fireEvent.click(screen.getByLabelText(/我确认回答描述的是最近真实发生的事/))
    expect(save.disabled).toBe(false)
    fireEvent.click(save)
    await waitFor(() => expect(submitAssessmentResponse).toHaveBeenCalledWith(expect.objectContaining({
      item_id: 'D2-BE-001', source_type: 'recent_behavior', occurred_in_real_life: true,
    })))
  })

  it('删除后回执如实提到备份保留期', async () => {
    render(<FormationTwinMaturity user={{ email: 'a@b.c' }} />)
    await screen.findByTestId('emd-stage-card')
    fireEvent.click(screen.getByText('删除这一部分数据'))
    expect(eraseMaturityData).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认永久删除' }))
    await waitFor(() => expect(eraseMaturityData).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByTestId('emd-stage-card')).toBeNull())
    expect(screen.getByRole('status').textContent).toContain('备份保留期')
  })
})
