import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MissionBridgePanel from '../components/mission-bridge/MissionBridgePanel'
import * as api from '../missionBridgeApi'

vi.mock('../missionBridgeApi', () => ({
  fetchMissionBridgeCapabilities: vi.fn(),
  fetchMissionBridgeDashboard: vi.fn(),
  updateMissionBridgeConsent: vi.fn(),
  enrollMissionBridgeProgram: vi.fn(),
  exitMissionBridgeProgram: vi.fn(),
  submitMissionBridgeCheckin: vi.fn(),
  reportMissionBridgeIncident: vi.fn(),
  fetchMissionBridgePolicy: vi.fn(),
  acknowledgeMissionBridgePolicy: vi.fn(),
  fetchMissionBridgeIncidents: vi.fn(),
  resolveMissionBridgeIncident: vi.fn(),
  fetchMissionBridgeConsents: vi.fn(),
  updateMissionBridgeDetailedConsent: vi.fn(),
  requestMissionBridgeExport: vi.fn(),
  requestMissionBridgeDeletion: vi.fn(),
  fetchMissionBridgeProposals: vi.fn(),
  createMissionBridgeProposal: vi.fn(),
  fetchMissionBridgeDiscoveryReport: vi.fn(),
  validateMissionBridgeProgram: vi.fn(),
  publishMissionBridgeProgram: vi.fn(),
  pauseMissionBridgeProgram: vi.fn(),
  resumeMissionBridgeProgram: vi.fn(),
  fetchMissionBridgeJourney: vi.fn(),
  createMissionBridgeGoal: vi.fn(),
  confirmMissionBridgeGoal: vi.fn(),
  completeMissionBridgeAction: vi.fn(),
  fetchMissionBridgeTraining: vi.fn(),
  createMissionBridgeCohort: vi.fn(),
  saveMissionBridgeMentor: vi.fn(),
  assignMissionBridgeMentor: vi.fn(),
  submitMissionBridgeTrainerCandidate: vi.fn(),
  decideMissionBridgeTrainer: vi.fn(),
  fetchMissionBridgeContentLibrary: vi.fn(),
  searchMissionBridgeContent: vi.fn(),
  createMissionBridgeContent: vi.fn(),
  verifyMissionBridgeContentSource: vi.fn(),
  reviewMissionBridgeContent: vi.fn(),
  publishMissionBridgeContent: vi.fn(),
  fetchMissionBridgeAgentCatalog: vi.fn(),
  runMissionBridgeAgent: vi.fn(),
  fetchMissionBridgeAgentHistory: vi.fn(),
  reviewMissionBridgeAgentRun: vi.fn(),
  fetchLocalLeaderDashboard: vi.fn(),
  saveLocalLeaderObservation: vi.fn(),
  saveLocalLeaderWeeklyReview: vi.fn(),
  createLocalLeaderApprentice: vi.fn(),
  fetchAttentionPilotDashboard: vi.fn(),
  saveAttentionPilotTrigger: vi.fn(),
  startAttentionPilotRecovery: vi.fn(),
  fetchAiFaithDashboard: vi.fn(),
  submitAiFaithQuestion: vi.fn(),
  requestAiFaithFollowup: vi.fn(),
  saveAiFaithLearning: vi.fn(),
  fetchMobileWorkerDashboard: vi.fn(),
  updateMobileWorkerProfile: vi.fn(),
  updateMobileWorkerAudioProgress: vi.fn(),
  requestMobileWorkerCallback: vi.fn(),
  fetchNightShiftDashboard: vi.fn(),
  updateNightShiftProfile: vi.fn(),
  createNightShiftCheckin: vi.fn(),
  createNightShiftDebrief: vi.fn(),
  fetchMobileFamilyDashboard: vi.fn(),
  updateMobileFamilyHousehold: vi.fn(),
  createMobileFamilyChild: vi.fn(),
  createMobileFamilyTask: vi.fn(),
  fetchElderCaregiverDashboard: vi.fn(),
  createElderCaregiverAssessment: vi.fn(),
  requestElderCaregiverRespite: vi.fn(),
  fetchMentalHealthFamilyDashboard: vi.fn(),
  createMentalHealthReminder: vi.fn(),
  createMentalHealthWarning: vi.fn(),
  fetchAccessibilityPreferences: vi.fn(),
  saveAccessibilityPreferences: vi.fn(),
  fetchChurchHarmDashboard: vi.fn(),
  saveChurchHarmProfile: vi.fn(),
  submitChurchHarmComplaint: vi.fn(),
  fetchFamilyTransitionDashboard: vi.fn(),
  saveFamilyTransitionProfile: vi.fn(),
  saveFamilyTransitionGrief: vi.fn(),
  fetchMinistryFamilyDashboard: vi.fn(),
  saveMinistryFamilyProfile: vi.fn(),
  fetchTransitionYouthDashboard: vi.fn(),
  createTransitionYouthProfile: vi.fn(),
  fetchReentryDashboard: vi.fn(),
  saveReentryProfile: vi.fn(),
  saveReentryFaithChoice: vi.fn(),
  fetchMissionBridgeOperations: vi.fn(),
  fetchMissionBridgeParticipants: vi.fn(),
  fetchMissionBridgeOutcomes: vi.fn(),
  fetchMissionBridgeAnalyticsCatalog: vi.fn(),
}))

const dashboard = {
  programs: [
    { id: 'local-leader-90', title: '基层小组长 90 天装备', description: '带领者装备', definition: { steps: 13 } },
    { id: 'attention-reset-30', title: '青年注意力重建 30 天', description: '注意力重建', definition: { steps: 30 } },
    { id: 'ai-faith-dialogue-8', title: 'AI 时代信仰探索 8 次讨论', description: '信仰探索', definition: { steps: 8 } },
  ],
  enrollments: [],
  consents: {},
}

describe('MissionBridgePanel', () => {
  beforeEach(() => {
    api.fetchMissionBridgeCapabilities.mockResolvedValue({ level: 'admin', tabs: ['programs','journey','specialized-directory','content','safety','privacy','leader','training','agents','organizations','discovery','designer','operations','incidents'] })
    api.fetchMissionBridgeDashboard.mockResolvedValue(dashboard)
    api.fetchMissionBridgePolicy.mockResolvedValue({ acknowledged: true, policy: { version: '1.0.0' } })
    api.fetchMissionBridgeIncidents.mockRejectedValue(new Error('forbidden'))
    api.fetchMissionBridgeConsents.mockResolvedValue({ items: [] })
    api.fetchMissionBridgeProposals.mockRejectedValue(new Error('forbidden'))
    api.fetchMissionBridgeJourney.mockResolvedValue({ goals: [], carePlans: [], strengths: [] })
    api.fetchMissionBridgeContentLibrary.mockResolvedValue({ items: [] })
    api.fetchMissionBridgeAgentCatalog.mockResolvedValue({ agents: [] })
    api.fetchMissionBridgeAgentHistory.mockResolvedValue({ items: [] })
    api.fetchLocalLeaderDashboard.mockResolvedValue({ weeks: [{ week: 1, title: '带领者身份、呼召与边界' }], reviews: [], apprentices: [] })
    api.fetchAttentionPilotDashboard.mockResolvedValue({ flow: ['触发识别','环境改造','失败恢复'], metrics: {}, privacyRules: ['不保存具体搜索词'] })
    api.fetchAiFaithDashboard.mockResolvedValue({ sessions: [{ number: 1, title: 'AI能否理解，还是只是在预测？' }], viewpoints: [], boundaries: ['公平呈现重要反对意见'] })
    api.fetchMobileWorkerDashboard.mockResolvedValue({ drivingMode: false, audio: [], safety: ['行驶中禁止文本输入'] })
    api.fetchNightShiftDashboard.mockResolvedValue({ cadence: '按班次记录，不按自然日计算连续签到', metrics: {}, features: ['夜班前3分钟预备'] })
    api.fetchMobileFamilyDashboard.mockResolvedValue({ modules: ['夫妻关系','儿童阅读','信仰探索'], boundaries: ['儿童不得被单独营销或邀请'], children: [], tasks: [] })
    api.fetchElderCaregiverDashboard.mockResolvedValue({ project: '照护者也需要被照护', aiBoundaries: ['不诊断失智'], features: ['志愿者短时支持'], assessments: [] })
    api.fetchMentalHealthFamilyDashboard.mockResolvedValue({ rules: ['永远不建议停药'], features: [], reminders: [] })
    api.fetchAccessibilityPreferences.mockResolvedValue({ preferences: { highContrast: false, fontScale: 1, plainLanguage: false, lowBandwidth: false, preferredFormat: 'standard_text' }, formats: ['standard_text','audio_only'], standards: ['WCAG 2.2 AA'] })
    api.fetchChurchHarmDashboard.mockResolvedValue({ principles: ['不首先劝回原教会'], stages: [{ number: 1, title: '安全和倾听' }] })
    api.fetchFamilyTransitionDashboard.mockResolvedValue({ pathways: [{ key: 'single_parent', title: '单亲家庭支持' }], principle: '不以再婚作为默认目标' })
    api.fetchMinistryFamilyDashboard.mockResolvedValue({ principles: ['牧者不能查询配偶或子女记录'], features: [] })
    api.fetchTransitionYouthDashboard.mockResolvedValue({ enabled: false, prohibited: ['私下接送'] })
    api.fetchReentryDashboard.mockResolvedValue({ privacy: ['不使用AI预测再犯罪风险'], features: [] })
    api.updateMissionBridgeConsent.mockResolvedValue({ ok: true })
    api.reportMissionBridgeIncident.mockResolvedValue({ ok: true })
  })

  it('shows only the three approved MVP pilots and requires voluntary consent', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('基层小组长 90 天装备')
    expect(screen.getByText('青年注意力重建 30 天')).toBeTruthy()
    expect(screen.getByText('AI 时代信仰探索 8 次讨论')).toBeTruthy()
    expect(screen.getAllByText('自愿加入').every((button) => button.disabled)).toBe(true)

    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(api.updateMissionBridgeConsent).toHaveBeenCalledWith('token', 'program_participation', true))
  })

  it('provides a human escalation safety form', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('安全求助'))
    expect(screen.getByText(/紧急危险请先联系/)).toBeTruthy()
    expect(screen.getByText('提交安全求助')).toBeTruthy()
  })

  it('provides a published-only trusted content search', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('可信资料'))
    expect(await screen.findByText('可信资料检索')).toBeTruthy()
    expect(screen.getByText('暂时没有已发布资料')).toBeTruthy()
  })

  it('keeps AI assistance closed until explicit consent', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('AI 辅助'))
    expect(screen.getByText('AI 辅助默认关闭')).toBeTruthy()
    expect(screen.getByText('前往隐私与同意')).toBeTruthy()
  })

  it('opens the local leader twelve-week workspace', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('带领者工作台'))
    expect(await screen.findByText('12周路径')).toBeTruthy()
    expect(screen.getByText('带领者身份、呼召与边界')).toBeTruthy()
  })

  it('opens the private attention recovery flow', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('专项支持'))
    fireEvent.click(await screen.findByText('注意力30天'))
    expect(await screen.findByText('30天流程')).toBeTruthy()
    expect(screen.getByText(/不保存具体搜索词/)).toBeTruthy()
  })

  it('opens the balanced AI faith discussion path', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('专项支持'))
    fireEvent.click(await screen.findByText('AI信仰探索'))
    expect(await screen.findByText('AI能否理解，还是只是在预测？')).toBeTruthy()
    expect(screen.getByText(/公平呈现重要反对意见/)).toBeTruthy()
    expect(screen.getByText('匿名提问')).toBeTruthy()
  })

  it('supports a driver-safe audio-only mode', async () => {
    api.updateMobileWorkerProfile.mockResolvedValue({ ok: true })
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('专项支持'))
    fireEvent.click(await screen.findByText('司机同行'))
    expect(await screen.findByText(/行驶中禁止文本输入/)).toBeTruthy()
    fireEvent.click(screen.getByText('正在驾驶'))
    await waitFor(() => expect(api.updateMobileWorkerProfile).toHaveBeenCalled())
  })

  it('uses shift cadence rather than daily streaks', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('专项支持'))
    fireEvent.click(await screen.findByText('夜班同行'))
    expect(await screen.findByText('按班次记录，不按自然日计算连续签到')).toBeTruthy()
    expect(screen.getByText('班前3分钟')).toBeTruthy()
  })

  it('keeps children separated and out of marketing flows', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('专项支持'))
    fireEvent.click(await screen.findByText('流动家庭'))
    expect(await screen.findByText(/儿童不得被单独营销或邀请/)).toBeTruthy()
    expect(screen.getByText('儿童阅读')).toBeTruthy()
  })

  it('offers caregiver support without diagnosis', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('专项支持'))
    fireEvent.click(await screen.findByText('更多专项支持'))
    expect(await screen.findByText(/不诊断失智/)).toBeTruthy()
    expect(screen.getByText('照护压力自评')).toBeTruthy()
  })

  it('keeps transition youth disabled without a qualified partner', async () => {
    render(<MissionBridgePanel token="token" />)
    await screen.findByText('邻舍之桥')
    fireEvent.click(screen.getByText('专项支持'))
    fireEvent.click(await screen.findByText('更多专项支持'))
    fireEvent.click(await screen.findByText('过渡青年'))
    expect(await screen.findByText(/尚未建立有效的儿童福利/)).toBeTruthy()
  })
})
