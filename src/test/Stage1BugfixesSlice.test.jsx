import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AITutorChatPage from '../AITutorChatPage.jsx'
import SpecializedSupportWorkspace from '../components/mission-bridge/SpecializedSupportWorkspace.jsx'
import LocalLeaderWorkspace from '../components/mission-bridge/LocalLeaderWorkspace.jsx'
import { tutorApi } from '../api.js'
import * as mbApi from '../missionBridgeApi.js'
import { setRuntimeLang } from '../i18n/runtime.js'
import { mergeAutoEn } from '../i18n/translations.js'

vi.mock('../auth', () => ({
  getToken: () => 'jwt-stage1-test',
}))

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js')
  return {
    ...actual,
    tutorApi: {
      threads: vi.fn(),
      thread: vi.fn(),
      createThread: vi.fn(),
      send: vi.fn(),
    },
  }
})

vi.mock('../missionBridgeApi', () => ({
  createElderCaregiverAssessment: vi.fn(),
  createMentalHealthReminder: vi.fn(),
  createTransitionYouthProfile: vi.fn(),
  fetchAccessibilityPreferences: vi.fn(),
  fetchChurchHarmDashboard: vi.fn(),
  fetchElderCaregiverDashboard: vi.fn(),
  fetchFamilyTransitionDashboard: vi.fn(),
  fetchMentalHealthFamilyDashboard: vi.fn(),
  fetchMinistryFamilyDashboard: vi.fn(),
  fetchReentryDashboard: vi.fn(),
  fetchTransitionYouthDashboard: vi.fn(),
  requestElderCaregiverRespite: vi.fn(),
  saveAccessibilityPreferences: vi.fn(),
  saveChurchHarmProfile: vi.fn(),
  saveFamilyTransitionProfile: vi.fn(),
  saveMinistryFamilyProfile: vi.fn(),
  saveReentryProfile: vi.fn(),
  createLocalLeaderApprentice: vi.fn(),
  fetchLocalLeaderDashboard: vi.fn(),
  saveLocalLeaderObservation: vi.fn(),
  saveLocalLeaderWeeklyReview: vi.fn(),
}))

describe('Stage 1 Slices s2 + s3: AITutor crisis jump & i18n, MissionBridge minor consent & double-submit gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRuntimeLang('zh')
    mergeAutoEn({})
    tutorApi.threads.mockResolvedValue({ threads: [{ id: 'th-1', title: '' }] })
    tutorApi.thread.mockResolvedValue({ messages: [] })
    tutorApi.createThread.mockResolvedValue({ id: 'th-new' })
    mbApi.fetchElderCaregiverDashboard.mockResolvedValue({ aiBoundaries: ['不诊断失智'] })
    mbApi.fetchTransitionYouthDashboard.mockResolvedValue({
      enabled: true,
      prohibited: ['私下接送'],
    })
    mbApi.fetchLocalLeaderDashboard.mockResolvedValue({
      weeks: [{ week: 1, title: '带领者身份、呼召与边界' }],
      reviews: [{ week: 1 }],
      apprentices: [],
    })
  })

  it('renders an actionable crisis jump button in AITutorChatPage and invokes onOpenCrisis', async () => {
    tutorApi.send.mockResolvedValue({
      reply: '你现在的生命安全最重要，请立刻寻求真人帮助。',
      crisis: true,
      route: null,
    })
    const onOpenCrisis = vi.fn()

    render(<AITutorChatPage user={{ id: 'u1' }} onBack={() => {}} onOpenCrisis={onOpenCrisis} />)
    await waitFor(() => expect(tutorApi.threads).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText('说点什么…'), {
      target: { value: '我撑不下去了' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))

    const jumpBtn = await screen.findByTestId('ai-tutor-open-crisis-btn')
    expect(screen.getByTestId('ai-tutor-crisis-banner')).toBeTruthy()
    fireEvent.click(jumpBtn)
    expect(onOpenCrisis).toHaveBeenCalledTimes(1)
  })

  it('translates AITutorChatPage thread fallback, send button, and crisis CTA in English mode', async () => {
    setRuntimeLang('en')
    mergeAutoEn({})
    tutorApi.send.mockResolvedValue({
      reply: 'Please reach out to a real person right now.',
      crisis: true,
      route: null,
    })

    render(<AITutorChatPage user={{ id: 'u1' }} onBack={() => {}} onOpenCrisis={() => {}} />)
    expect(await screen.findByRole('button', { name: 'Conversation' })).toBeTruthy()
    const sendBtn = screen.getByRole('button', { name: 'Send' })
    expect(sendBtn).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I cannot go on' } })
    fireEvent.click(sendBtn)
    expect(await screen.findByRole('button', { name: 'Open Care & Crisis Center' })).toBeTruthy()
  })

  it('enforces guardian/agency consent for under-18 youth profiles in SpecializedSupportWorkspace', async () => {
    mbApi.createTransitionYouthProfile.mockResolvedValue({ ok: true })

    render(<SpecializedSupportWorkspace token="tok-1" />)
    fireEvent.click(screen.getByRole('button', { name: '过渡青年' }))

    const contactInput = await screen.findByLabelText('紧急联系人')
    fireEvent.change(contactInput, { target: { value: '社工张老师 1380000' } })

    const ageInput = screen.getByLabelText('16–25岁成年过渡支持')
    fireEvent.change(ageInput, { target: { value: '16' } })

    const submitBtn = screen.getByRole('button', { name: '建立档案' })
    expect(submitBtn.disabled).toBe(true)

    // Even direct form submit must be deterministically rejected without consent
    fireEvent.submit(submitBtn.closest('form'))
    expect(mbApi.createTransitionYouthProfile).not.toHaveBeenCalled()
    expect(await screen.findByText('未满18岁须先取得监护人或机构同意')).toBeTruthy()

    // Grant guardian/agency consent -> allowed
    fireEvent.click(screen.getByRole('checkbox'))
    expect(submitBtn.disabled).toBe(false)
    fireEvent.submit(submitBtn.closest('form'))

    await waitFor(() =>
      expect(mbApi.createTransitionYouthProfile).toHaveBeenCalledWith('tok-1', {
        age: 16,
        guardianOrAgencyConsent: true,
        emergencyContact: '社工张老师 1380000',
      }),
    )
    expect(await screen.findByText('过渡支持档案已建立')).toBeTruthy()
  })

  it('prevents concurrent double-submissions in SpecializedSupportWorkspace and LocalLeaderWorkspace', async () => {
    let resolveAssessment
    mbApi.createElderCaregiverAssessment.mockImplementation(
      () => new Promise((res) => { resolveAssessment = res }),
    )

    const { unmount } = render(<SpecializedSupportWorkspace token="tok-1" />)
    const saveElderBtn = await screen.findByRole('button', { name: '保存并获得支持分流' })
    const elderForm = saveElderBtn.closest('form')

    fireEvent.submit(elderForm)
    fireEvent.submit(elderForm)
    expect(mbApi.createElderCaregiverAssessment).toHaveBeenCalledTimes(1)
    expect(saveElderBtn.disabled).toBe(true)

    resolveAssessment({ ok: true })
    expect(await screen.findByText('照护压力评估已保存')).toBeTruthy()
    expect(saveElderBtn.disabled).toBe(false)
    unmount()

    let resolveObs
    mbApi.saveLocalLeaderObservation.mockImplementation(
      () => new Promise((res) => { resolveObs = res }),
    )

    render(<LocalLeaderWorkspace token="tok-1" />)
    expect(await screen.findByText('✓ 已复盘')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '经文观察' }))
    const saveObsBtn = await screen.findByRole('button', { name: '保存观察' })
    const obsForm = saveObsBtn.closest('form')

    fireEvent.submit(obsForm)
    fireEvent.submit(obsForm)
    expect(mbApi.saveLocalLeaderObservation).toHaveBeenCalledTimes(1)
    expect(saveObsBtn.disabled).toBe(true)

    resolveObs({ ok: true })
    expect(await screen.findByText('经文观察已保存')).toBeTruthy()
    expect(saveObsBtn.disabled).toBe(false)
  })
})
