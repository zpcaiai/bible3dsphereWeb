import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AITutorChatPage from '../AITutorChatPage.jsx'
import SharedPrayerPage from '../SharedPrayerPage.jsx'
import SoulDashboard from '../components/SoulDashboard.jsx'
import SpecializedSupportWorkspace from '../components/mission-bridge/SpecializedSupportWorkspace.jsx'
import LocalLeaderWorkspace from '../components/mission-bridge/LocalLeaderWorkspace.jsx'
import { tutorApi } from '../api.js'
import * as mbApi from '../missionBridgeApi.js'
import { setRuntimeLang } from '../i18n/runtime.js'
import { mergeAutoEn } from '../i18n/translations.js'

let mockedAuthToken = 'jwt-stage1-test'

vi.mock('../auth', () => ({
  COOKIE_SESSION_SENTINEL: 'cookie-session',
  getToken: () => mockedAuthToken,
  getCachedUser: () => {
    try {
      const raw = localStorage.getItem('bible-sphere-user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
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
  saveLocalLeaderSession: vi.fn(),
  saveLocalLeaderReferral: vi.fn(),
  triggerMentalHealthWarnings: vi.fn(),
}))

describe('Stage 1 & Slice w4/w5: SoulDashboard, AITutorChatPage, SharedPrayerPage & MissionBridge gates', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockedAuthToken = 'jwt-stage1-test'
    setRuntimeLang('zh')
    mergeAutoEn({})
    tutorApi.threads.mockResolvedValue({ threads: [{ id: 'th-1', title: '' }] })
    tutorApi.thread.mockResolvedValue({ messages: [] })
    tutorApi.createThread.mockResolvedValue({ id: 'th-new' })
    mbApi.fetchElderCaregiverDashboard.mockResolvedValue({ aiBoundaries: ['不诊断失智'], assessments: [] })
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

  afterEach(() => {
    global.fetch = originalFetch
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

  it('preserves draft input with retry on tutorApi.send failure and restores crisis CTA when reopening a high-risk/safety thread', async () => {
    tutorApi.threads.mockResolvedValue({
      threads: [
        { id: 'th-normal', title: '日常读经', risk_level: 'low' },
        { id: 'th-crisis', title: '紧急守望', risk_level: 'high' },
      ],
    })
    tutorApi.thread.mockImplementation(async (id) => {
      if (id === 'th-crisis') {
        return {
          messages: [
            { id: 'm-safe', role: 'assistant', content: '请联系身边信任的人', message_type: 'safety' },
          ],
        }
      }
      return { messages: [] }
    })
    tutorApi.send
      .mockRejectedValueOnce(new Error('网络暂时中断'))
      .mockResolvedValueOnce({ reply: '主必扶持你。', crisis: false })

    const onOpenCrisis = vi.fn()
    render(<AITutorChatPage user={{ id: 'u1' }} onBack={() => {}} onOpenCrisis={onOpenCrisis} />)
    await waitFor(() => expect(tutorApi.threads).toHaveBeenCalled())

    const textarea = screen.getByLabelText('说点什么…')
    fireEvent.change(textarea, { target: { value: '这段话绝不能因为网络失败而丢失' } })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))

    expect(await screen.findByTestId('ai-tutor-error-banner')).toBeTruthy()
    expect(textarea.value).toBe('这段话绝不能因为网络失败而丢失')

    fireEvent.click(screen.getByTestId('ai-tutor-retry-send-btn'))
    expect(await screen.findByText('主必扶持你。')).toBeTruthy()
    expect(textarea.value).toBe('')

    // Reopen crisis thread -> crisis banner + CTA must reappear
    fireEvent.click(screen.getByRole('button', { name: /紧急守望/ }))
    const crisisCta = await screen.findByTestId('ai-tutor-open-crisis-btn')
    fireEvent.click(crisisCta)
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

  it('renders structured SoulDashboard insight, omits Bearer cookie-session on /sfds/decisions, and routes personal-search / crisis-care entries', async () => {
    mockedAuthToken = 'cookie-session'
    const capturedDecisionsHeaders = []
    global.fetch = vi.fn(async (url, init = {}) => {
      const str = String(url)
      if (str.includes('/sfds/decisions')) {
        capturedDecisionsHeaders.push(init.headers || {})
        return { ok: true, status: 200, json: async () => ({ decisions: [] }) }
      }
      if (str.includes('/habits/dashboard')) {
        return { ok: true, status: 200, json: async () => ({ current_streak: 8 }) }
      }
      if (str.includes('/crisis-care/') || str.includes('/safety-plan')) {
        return { ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ items: [], contacts: [] }) }
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ profile: { state_vector: { humility: 0.8, spiritual_clarity: 0.78 } } }),
      }
    })

    render(<SoulDashboard user={{ id: 'u-soul-1', email: 'soul@example.com' }} />)

    const insightBox = await screen.findByTestId('soul-dashboard-insight')
    expect(insightBox.textContent).toContain('谦逊与清晰')
    expect(insightBox.textContent).toContain('弥迦书 6:8')
    expect(capturedDecisionsHeaders.length).toBeGreaterThan(0)
    expect(capturedDecisionsHeaders[0].Authorization).toBeUndefined()

    expect(screen.getByTestId('soul-entry-ai-tutor')).toBeTruthy()
    expect(screen.getByTestId('soul-entry-personal-search')).toBeTruthy()
    expect(screen.getByTestId('soul-entry-spiritual-memory')).toBeTruthy()
    expect(screen.getByTestId('soul-entry-crisis-care')).toBeTruthy()

    // Click personal-search entry -> opens PersonalSearchPage
    fireEvent.click(screen.getByTestId('soul-entry-personal-search'))
    expect(await screen.findByText(/我的数据搜索/)).toBeTruthy()
  })

  it('confirms SharedPrayerPage amen only after HTTP 200, rolls back on 500, and distinguishes 404 from 503 load errors', async () => {
    let loadFailOnce = true
    let amenFailOnce = true

    global.fetch = vi.fn(async (url, init) => {
      const str = String(url)
      if (str.includes('/prayer-share/tok-retry-1/amen') && init?.method === 'POST') {
        if (amenFailOnce) {
          amenFailOnce = false
          return { ok: false, status: 500, json: async () => ({ detail: '代祷计数写入失败' }) }
        }
        return { ok: true, status: 200, json: async () => ({ ok: true, amen_count: 11 }) }
      }
      if (str.includes('/prayer-share/tok-retry-1')) {
        if (loadFailOnce) {
          loadFailOnce = false
          return { ok: false, status: 503, json: async () => ({ detail: '网关繁忙 503' }) }
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 101,
            nickname: '彼得弟兄',
            content: '求主保守宣教禾场',
            amen_count: 10,
            created_at: '2026-11-20T00:00:00Z',
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ detail: 'Not found' }) }
    })

    const { unmount } = render(<SharedPrayerPage shareToken="tok-retry-1" />)

    // Transient 503 -> retryable load error (NOT fake 404 deleted message)
    expect(await screen.findByTestId('shared-prayer-load-error')).toBeTruthy()
    expect(screen.queryByTestId('shared-prayer-not-found')).toBeNull()

    fireEvent.click(screen.getByTestId('shared-prayer-load-retry'))
    expect(await screen.findByText('求主保守宣教禾场')).toBeTruthy()

    // First amen fails with 500 -> must NOT write localStorage or mark amened
    fireEvent.click(screen.getByRole('button', { name: /同心代祷/ }))
    expect(await screen.findByTestId('shared-prayer-amen-error')).toBeTruthy()
    expect(localStorage.getItem('shared-prayer-amened-v1')).toBeNull()
    expect(screen.getByTestId('shared-prayer-amen-count').textContent).toContain('10')

    // Retry amen succeeds with 200 -> updates server amen_count=11 and persists AMENED_KEY
    fireEvent.click(screen.getByTestId('shared-prayer-amen-retry'))
    expect(await screen.findByText(/已与他同心代祷/)).toBeTruthy()
    expect(screen.getByTestId('shared-prayer-amen-count').textContent).toContain('11')
    expect(JSON.parse(localStorage.getItem('shared-prayer-amened-v1') || '[]')).toContain('tok-retry-1')
    unmount()

    // True 404 -> renders not-found state
    render(<SharedPrayerPage shareToken="tok-missing-404" />)
    expect(await screen.findByTestId('shared-prayer-not-found')).toBeTruthy()
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

    fireEvent.submit(submitBtn.closest('form'))
    expect(mbApi.createTransitionYouthProfile).not.toHaveBeenCalled()
    expect(await screen.findByText('未满18岁须先取得监护人或机构同意')).toBeTruthy()

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
