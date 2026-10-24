import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DigitalHumanWorkspace from '../digital-human/DigitalHumanWorkspace'
import MirrorPage from '../../../MirrorPage'
import { setRuntimeLang } from '../../../i18n/runtime'
import { getArtisticPortrait } from '../digital-human/portraitCatalog'
import { LiveKitRealtimeSession } from '../digital-human/LiveKitRealtimeSession'
import {
  getDigitalHumanCatalog,
  getDigitalHumanRuntime,
  createDigitalHumanTurn,
  createDigitalHumanLiveKitToken,
  resolveDigitalHumanIdentity,
} from '../digital-human/api'

vi.mock('../digital-human/api', () => ({
  createDigitalHumanLiveKitToken: vi.fn(),
  createDigitalHumanTurn: vi.fn(),
  getDigitalHumanCatalog: vi.fn(),
  getDigitalHumanRuntime: vi.fn(),
  recordDigitalHumanProviderTelemetry: vi.fn(() => Promise.resolve()),
  resolveDigitalHumanIdentity: vi.fn(),
  getDigitalHumanStudy: vi.fn(),
}))

const DAVID = {
  id: 'david',
  canonicalName: '大卫',
  englishName: 'David',
  catalogTier: 'deep-alpha',
  avatar: {
    modelUrl: null,
    portraitUrl: 'https://cdn.holiness.uk/characters/david/v1/portrait.webp',
    version: '1',
    framing: 'bust',
    reviewState: 'APPROVED',
  },
  voice: { provider: 'azure', voiceId: null, language: 'zh-CN', reviewState: 'THEOLOGY_REVIEW' },
  recommendedQuestions: ['你为什么没有杀扫罗？'],
  disclosure: '教育性艺术重建，不代表真实历史肖像或原声。',
  runtimeReady: false,
}

describe('DigitalHumanWorkspace embedded character mode', () => {
  beforeEach(() => {
    createDigitalHumanTurn.mockReset()
    createDigitalHumanLiveKitToken.mockReset()
    resolveDigitalHumanIdentity.mockReset()
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) { this.text = text }
    })
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: vi.fn(() => [{ lang: 'zh-CN', name: 'Default Chinese' }]),
      speak: vi.fn((utterance) => utterance.onstart?.()),
    })
    getDigitalHumanCatalog.mockResolvedValue({
      characters: [DAVID], characterCount: 100, truthCaseCount: 532, contentVersion: '1.3.0',
    })
    getDigitalHumanRuntime.mockResolvedValue({
      liveKitEnabled: false,
      liveSpeakEnabled: false,
      contentReviewState: 'THEOLOGY_REVIEW',
      retrievalMode: 'LEXICAL_GRAPH_DEGRADED',
      operationsDashboardEnabled: true,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('binds the mirror experience to David and shows an approved portrait fallback', async () => {
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} variant="embedded" />)

    await waitFor(() => expect(screen.getByRole('region', { name: '大卫数字人' })).toBeTruthy())
    expect(screen.getByRole('img', { name: '大卫数字人艺术重建肖像' }).getAttribute('src')).toContain('/david/')
    expect(screen.getByText(/GLB、Voice 或内容尚未完成人工审批/)).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: '搜索圣经人物' })).toBeNull()
    expect(document.body.textContent).not.toContain('运行监控')
  })

  it('keeps a failed initialization out of the conversation UI and reloads both real request paths on retry', async () => {
    getDigitalHumanCatalog.mockRejectedValueOnce(new Error('Failed to fetch'))
    render(<DigitalHumanWorkspace showOperations={false} />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: '向当前圣经人物提问' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '重新加载人物资料' }))
    await screen.findByRole('region', { name: '大卫数字人' })
    expect(getDigitalHumanCatalog).toHaveBeenCalledTimes(2)
    expect(getDigitalHumanRuntime).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('cancels both initialization requests when the workspace unmounts', async () => {
    getDigitalHumanCatalog.mockImplementationOnce(() => new Promise(() => {}))
    getDigitalHumanRuntime.mockImplementationOnce(() => new Promise(() => {}))
    const { unmount } = render(<DigitalHumanWorkspace showOperations={false} />)
    const catalogSignal = getDigitalHumanCatalog.mock.calls[0][0]?.signal
    const runtimeSignal = getDigitalHumanRuntime.mock.calls[0][0]?.signal
    expect(catalogSignal).toBeInstanceOf(AbortSignal)
    expect(runtimeSignal).toBe(catalogSignal)
    unmount()
    expect(catalogSignal.aborted).toBe(true)
  })

  it('uses this character artistic portrait and speaks only the fixed voice disclosure', async () => {
    getDigitalHumanCatalog.mockResolvedValue({
      characters: [{ ...DAVID, avatar: { ...DAVID.avatar, portraitUrl: null, reviewState: 'THEOLOGY_REVIEW' } }],
      characterCount: 100,
      truthCaseCount: 532,
      contentVersion: '1.3.0',
    })

    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} variant="embedded" />)

    const portrait = await screen.findByRole('img', { name: '大卫艺术重建肖像' })
    expect(portrait.getAttribute('src')).toBe(getArtisticPortrait('david').url)
    expect(portrait.dataset.portraitCharacterId).toBe('david')
    expect(screen.getByText('艺术重建 · 非历史真实肖像 · 待人工审核')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '试听默认预览音色' }))
    expect(globalThis.speechSynthesis.speak).toHaveBeenCalledTimes(1)
    const utterance = globalThis.speechSynthesis.speak.mock.calls[0][0]
    expect(utterance.text).toBe('这是默认预览音色，只用于确认声音播放功能，不代表任何圣经人物的真实声音。')
    expect(utterance.text).not.toContain('大卫')
  })

  it.each([
    [11, 'joseph', '约瑟', 'Joseph'],
    [99, 'joseph_of_nazareth', '约瑟（拿撒勒）', 'Joseph of Nazareth'],
    [466, 'joseph_arimathea', '亚利马太的约瑟', 'Joseph of Arimathea'],
  ])('binds actual Mirror and workspace portraits to numeric identity %s without same-name substitution', async (mirrorId, characterId, canonicalName, englishName) => {
    setRuntimeLang('zh')
    getDigitalHumanCatalog.mockResolvedValueOnce({
      characters: [{ ...DAVID, id: characterId, canonicalName, englishName, recommendedQuestions: [], avatar: { ...DAVID.avatar, portraitUrl: null, reviewState: 'THEOLOGY_REVIEW' } }],
      characterCount: 100, truthCaseCount: 532, contentVersion: '1.3.0',
    })
    render(<MirrorPage initialView="character" initialCharId={mirrorId} onBack={() => {}} />)
    await screen.findByRole('region', { name: `${canonicalName}数字人`, exact: true }, { timeout: 5000 })
    const portraits = ['mirror', 'workspace'].map((context) => document.querySelector(`img[data-portrait-context="${context}"]`))
    for (const portrait of portraits) {
      expect(portrait).not.toBeNull()
      expect(portrait.dataset.portraitCharacterId).toBe(characterId)
      expect(portrait.dataset.reviewState).toBe('PREVIEW_ONLY')
      expect(portrait.getAttribute('src')).toBe(getArtisticPortrait(characterId).url)
    }
    expect(portraits[0].getAttribute('src')).toBe(portraits[1].getAttribute('src'))
    expect(document.querySelectorAll('img[src*="shared-preview"]').length).toBe(0)
  })

  const envelope = (text, characterId = 'david') => ({
    turnId: `turn_${text}`, traceId: 'trace_actual', state: 'TEXT_ONLY',
    response: {
      characterId, answerType: 'FACT', spokenText: text, displayText: text,
      references: [{ sourceType: 'SCRIPTURE', locator: '1 Samuel 17', claimSupport: 'CONTEXT_ONLY' }],
      warnings: [], groundingLevel: 'G1_INTERPRETIVE_POSSIBILITY', relatedCharacters: [], relatedEvents: ['david-goliath'],
      contentVersion: '1.3.0', contentSha256: 'a'.repeat(64), contentReviewState: 'THEOLOGY_REVIEW', speechApproved: false,
    },
  })

  it('allows validated text turns while runtime metadata remains pending, with provider controls closed', async () => {
    let finishRuntime
    getDigitalHumanRuntime.mockImplementationOnce(() => new Promise(resolve => { finishRuntime = resolve }))
    createDigitalHumanTurn.mockResolvedValueOnce(envelope('目录就绪后的文字证据'))
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const input = await screen.findByRole('textbox', { name: '向当前圣经人物提问' })
    expect(screen.getByLabelText('数字人运行状态核对')).toBeTruthy()
    expect(screen.getByRole('button', { name: '语音提问' }).disabled).toBe(true)
    expect(document.querySelector('iframe')).toBeNull()
    fireEvent.change(input, { target: { value: '你如何面对歌利亚？' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await screen.findByText('目录就绪后的文字证据')
    expect(createDigitalHumanLiveKitToken).not.toHaveBeenCalled()
    await act(async () => finishRuntime({ liveKitEnabled: false, liveSpeakEnabled: false, contentReviewState: 'THEOLOGY_REVIEW' }))
    await waitFor(() => expect(screen.queryByLabelText('数字人运行状态核对')).toBeNull())
  })

  it('keeps text available after runtime failure and permits an explicit metadata retry', async () => {
    let finishRetry
    getDigitalHumanRuntime.mockRejectedValueOnce(new Error('runtime network unavailable'))
      .mockImplementationOnce(() => new Promise(resolve => { finishRetry = resolve }))
    getDigitalHumanCatalog.mockImplementation(() => getDigitalHumanCatalog.mock.calls.length === 1
      ? Promise.resolve({ characters: [DAVID] })
      : Promise.reject(new Error('catalog must not be requested again')))
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const input = await screen.findByRole('textbox', { name: '向当前圣经人物提问' })
    expect(screen.getByRole('button', { name: '语音提问' }).disabled).toBe(true)
    expect(screen.getByText(/runtime network unavailable/)).toBeTruthy()
    fireEvent.change(input, { target: { value: '保留尚未发送的问题' } })
    fireEvent.click(screen.getByRole('button', { name: '重新核对运行状态' }))
    expect(screen.getByRole('textbox', { name: '向当前圣经人物提问' })).toBe(input)
    expect(input.value).toBe('保留尚未发送的问题')
    expect(getDigitalHumanCatalog).toHaveBeenCalledTimes(1)
    expect(getDigitalHumanRuntime).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: '语音提问' }).disabled).toBe(true)
    await act(async () => finishRetry({ liveKitEnabled: false, liveSpeakEnabled: false }))
    await waitFor(() => expect(screen.queryByLabelText('数字人运行状态核对')).toBeNull())
    expect(screen.getByRole('textbox', { name: '向当前圣经人物提问' })).toBe(input)
  })

  it('retains a failed question and explicitly retries without duplicating the user message', async () => {
    createDigitalHumanTurn.mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValueOnce(envelope('重试后的证据'))
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const input = await screen.findByRole('textbox', { name: '向当前圣经人物提问' })
    fireEvent.change(input, { target: { value: '你为什么没有杀扫罗？' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await screen.findByRole('alert')
    expect(input.value).toBe('你为什么没有杀扫罗？')
    fireEvent.click(screen.getByRole('button', { name: '重试上次提问' }))
    await screen.findByText('重试后的证据')
    expect(createDigitalHumanTurn).toHaveBeenCalledTimes(2)
    const [first, retry] = createDigitalHumanTurn.mock.calls.map(([payload]) => payload)
    expect(retry.question).toBe(first.question)
    expect(retry.sessionId).toBe(first.sessionId)
    expect(retry.turnId).not.toBe(first.turnId)
    expect(document.querySelectorAll('.dh-message.user')).toHaveLength(1)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('button', { name: '重试上次提问' })).toBeNull()
  })

  it('preserves a newer draft during failure and retry and prevents double retry submissions', async () => {
    let fail, finish
    createDigitalHumanTurn.mockImplementationOnce(() => new Promise((resolve, reject) => { fail = reject }))
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const input = await screen.findByRole('textbox', { name: '向当前圣经人物提问' })
    fireEvent.change(input, { target: { value: '第一个问题' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await waitFor(() => expect(createDigitalHumanTurn).toHaveBeenCalledTimes(1))
    fireEvent.change(input, { target: { value: '正在编写的下一题' } })
    await act(async () => fail(new Error('network failure')))
    const retry = await screen.findByRole('button', { name: '重试上次提问' })
    expect(input.value).toBe('正在编写的下一题')
    fireEvent.click(retry)
    fireEvent.click(retry)
    await waitFor(() => expect(createDigitalHumanTurn).toHaveBeenCalledTimes(2))
    expect(createDigitalHumanTurn.mock.calls[1][0].question).toBe('第一个问题')
    expect(input.value).toBe('正在编写的下一题')
    await act(async () => finish(envelope('第一个问题的真实结构回答')))
    expect(input.value).toBe('正在编写的下一题')
    expect(document.querySelectorAll('.dh-message.user')).toHaveLength(1)
  })

  it('drops failed retry state and draft on explicit clear or character switch', async () => {
    createDigitalHumanTurn.mockRejectedValue(new Error('Failed to fetch'))
    const paul = { ...DAVID, id: 'paul', canonicalName: '保罗', englishName: 'Paul' }
    getDigitalHumanCatalog.mockResolvedValue({ characters: [DAVID, paul], contentVersion: '1.3.0' })
    const { rerender } = render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const input = await screen.findByRole('textbox', { name: '向当前圣经人物提问' })
    for (const question of ['清空前的问题', '切换前的问题']) {
      fireEvent.change(input, { target: { value: question } })
      fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
      await screen.findByRole('button', { name: '重试上次提问' })
      if (question === '清空前的问题') fireEvent.click(screen.getByRole('button', { name: '清空本次会话' }))
    }
    rerender(<DigitalHumanWorkspace initialCharacterId="paul" lockCharacter showOperations={false} />)
    await screen.findByRole('region', { name: '保罗数字人' })
    expect(input.value).toBe('')
    expect(screen.queryByRole('button', { name: '重试上次提问' })).toBeNull()
    expect(document.querySelectorAll('.dh-message')).toHaveLength(0)
  })

  it('carries only bounded topic ids into a followup and clears them on reset', async () => {
    let sequence = 0
    createDigitalHumanTurn.mockImplementation(async () => ({ ...envelope('已有证据'), turnId: `turn_${++sequence}` }))
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const input = await screen.findByRole('textbox', { name: '向当前圣经人物提问' })
    fireEvent.change(input, { target: { value: '歌利亚' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await screen.findByText('已有证据')
    fireEvent.change(input, { target: { value: '相关经文呢？' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await waitFor(() => expect(createDigitalHumanTurn).toHaveBeenCalledTimes(2))
    expect(createDigitalHumanTurn.mock.calls[1][0].context).toEqual({ characterId: 'david', topicIds: ['david-goliath'] })
    expect(createDigitalHumanTurn.mock.calls[1][0]).not.toHaveProperty('history')
    fireEvent.click(screen.getByRole('button', { name: '清空本次会话' }))
    expect(screen.queryByText('已有证据')).toBeNull()
    fireEvent.change(input, { target: { value: '新的问题' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await waitFor(() => expect(createDigitalHumanTurn).toHaveBeenCalledTimes(3))
    expect(createDigitalHumanTurn.mock.calls[2][0]).not.toHaveProperty('context')
    expect(createDigitalHumanTurn.mock.calls[2][0].sessionId).not.toBe(createDigitalHumanTurn.mock.calls[0][0].sessionId)
  })

  it('aborts and discards old responses after a character switch', async () => {
    let finish
    createDigitalHumanTurn.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const paul = { ...DAVID, id: 'paul', canonicalName: '保罗', englishName: 'Paul' }
    getDigitalHumanCatalog.mockResolvedValue({ characters: [DAVID, paul], contentVersion: '1.3.0' })
    const { rerender } = render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const input = await screen.findByRole('textbox', { name: '向当前圣经人物提问' })
    fireEvent.change(input, { target: { value: '歌利亚' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await waitFor(() => expect(createDigitalHumanTurn).toHaveBeenCalledTimes(1))
    const signal = createDigitalHumanTurn.mock.calls[0][1].signal
    rerender(<DigitalHumanWorkspace initialCharacterId="paul" lockCharacter showOperations={false} />)
    await screen.findByRole('region', { name: '保罗数字人' })
    expect(signal.aborted).toBe(true)
    await act(async () => finish(envelope('这是迟到的大卫回答')))
    await waitFor(() => expect(screen.queryByText('这是迟到的大卫回答')).toBeNull())
    expect(screen.queryByText('歌利亚')).toBeNull()
  })

  it('falls back to text on avatar error and retries only after an explicit action', async () => {
    const approved = { ...DAVID, runtimeReady: true, avatar: { ...DAVID.avatar, modelUrl: 'https://cdn.holiness.uk/david/model.glb', reviewState: 'APPROVED' }, voice: { ...DAVID.voice, voiceId: 'approved-voice', reviewState: 'APPROVED' } }
    getDigitalHumanCatalog.mockResolvedValue({ characters: [approved], contentVersion: '1.3.0' })
    getDigitalHumanRuntime.mockResolvedValue({ liveSpeakEnabled: true, liveSpeakOrigin: 'https://metaperson.avatarsdk.com', liveSpeakEmbedUrl: 'https://metaperson.avatarsdk.com/livespeak', liveKitEnabled: false })
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const iframe = await screen.findByTitle('大卫 LiveSpeak Avatar')
    fireEvent(window, new MessageEvent('message', { origin: 'https://metaperson.avatarsdk.com', source: iframe.contentWindow, data: { source: 'livespeak', eventName: 'avatar_state_changed', avatarState: 'Error' } }))
    const retry = await screen.findByRole('button', { name: '重新连接数字人' })
    expect(screen.queryByTitle('大卫 LiveSpeak Avatar')).toBeNull()
    expect(screen.getByRole('textbox', { name: '向当前圣经人物提问' })).toBeTruthy()
    fireEvent.click(retry)
    expect(await screen.findByTitle('大卫 LiveSpeak Avatar')).toBeTruthy()
  })

  it('shows the real functional denominator without equating configuration with certification', async () => {
    getDigitalHumanRuntime.mockResolvedValue({ readiness: {
      characterCount: 100, truthCaseCount: 532, preparedAnswerCount: 5, preparedAnswerCharacterCount: 4,
      validatedAssetCharacterCount: 0, runtimeReadyCharacterCount: 0,
      requirements: [{ code: 'REAL_VOICE_JOURNEY', label: '真实设备语音与口型播放验收', state: 'NOT_VERIFIED' }],
    } })
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    await screen.findByText('数字人可用范围与待办')
    expect(screen.getByText('目录 100 人 · 研读主题 532 · 完整预设回答 5 条（覆盖 4 人）')).toBeTruthy()
    expect(screen.getByText('真实设备语音与口型播放验收：尚未验证')).toBeTruthy()
    expect(screen.getByText(/尚不支持开放式生成对话/)).toBeTruthy()
  })

  it('stops capture before posting text and cancels a late microphone token intent', async () => {
    const begin = vi.spyOn(LiveKitRealtimeSession.prototype, 'beginTurn')
    const connect = vi.spyOn(LiveKitRealtimeSession.prototype, 'connect')
    let finishToken
    createDigitalHumanLiveKitToken.mockImplementation(() => new Promise((resolve) => { finishToken = resolve }))
    createDigitalHumanTurn.mockResolvedValue(envelope('安全文字'))
    getDigitalHumanRuntime.mockResolvedValue({ liveKitEnabled: true, liveSpeakEnabled: false })
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    fireEvent.click(await screen.findByRole('button', { name: '语音提问' }))
    await waitFor(() => expect(createDigitalHumanLiveKitToken).toHaveBeenCalledTimes(1))
    const input = screen.getByRole('textbox', { name: '向当前圣经人物提问' })
    fireEvent.change(input, { target: { value: '歌利亚' } })
    fireEvent.click(screen.getByRole('button', { name: '发送并核验' }))
    await screen.findByText('安全文字')
    expect(begin.mock.invocationCallOrder[0]).toBeLessThan(createDigitalHumanTurn.mock.invocationCallOrder[0])
    await act(async () => finishToken({ token: 'test', url: 'wss://unused.example.test' }))
    expect(connect).not.toHaveBeenCalled()
  })

  it('ignores an identity lookup that returns after the user selects another character', async () => {
    let finish
    resolveDigitalHumanIdentity.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    getDigitalHumanCatalog.mockResolvedValue({ characters: [DAVID, { ...DAVID, id: 'paul', canonicalName: '保罗', englishName: 'Paul' }], contentVersion: '1.3.0' })
    render(<DigitalHumanWorkspace initialCharacterId="david" showOperations={false} />)
    const search = await screen.findByRole('textbox', { name: '搜索圣经人物' })
    fireEvent.change(search, { target: { value: '大卫' } })
    fireEvent.click(screen.getByRole('button', { name: '识别' }))
    fireEvent.change(search, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /保罗.*Paul/ }))
    await screen.findByRole('region', { name: '保罗数字人' })
    await act(async () => finish({ status: 'RESOLVED', characterId: 'david' }))
    expect(screen.getByRole('region', { name: '保罗数字人' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: '大卫数字人' })).toBeNull()
  })

  it('closing an error cannot unlock a still-speaking avatar', async () => {
    const approved = { ...DAVID, runtimeReady: true, avatar: { ...DAVID.avatar, modelUrl: 'https://cdn.holiness.uk/david/model.glb', reviewState: 'APPROVED' }, voice: { ...DAVID.voice, voiceId: 'approved-voice', reviewState: 'APPROVED' } }
    getDigitalHumanCatalog.mockResolvedValue({ characters: [approved], contentVersion: '1.3.0' })
    getDigitalHumanRuntime.mockResolvedValue({ liveSpeakEnabled: true, liveSpeakOrigin: 'https://metaperson.avatarsdk.com', liveSpeakEmbedUrl: 'https://metaperson.avatarsdk.com/livespeak', liveKitEnabled: false })
    const answer = envelope('批准的测试文本')
    answer.state = 'READY_TO_SPEAK'
    answer.response.speechApproved = true
    answer.response.contentReviewState = 'APPROVED'
    createDigitalHumanTurn.mockResolvedValue(answer)
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} />)
    const iframe = await screen.findByTitle('大卫 LiveSpeak Avatar')
    const emit = (avatarState) => fireEvent(window, new MessageEvent('message', { origin: 'https://metaperson.avatarsdk.com', source: iframe.contentWindow, data: { source: 'livespeak', eventName: 'avatar_state_changed', avatarState } }))
    emit('ModelAwaiting')
    emit('Ready')
    const input = screen.getByRole('textbox', { name: '向当前圣经人物提问' })
    fireEvent.change(input, { target: { value: '歌利亚' } })
    fireEvent.submit(input.closest('form'))
    await screen.findByText('人物正在讲述')
    fireEvent.change(input, { target: { value: '另一个问题' } })
    fireEvent.submit(input.closest('form'))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(screen.getByText('人物正在讲述')).toBeTruthy()
    fireEvent.submit(input.closest('form'))
    expect(createDigitalHumanTurn).toHaveBeenCalledTimes(1)
  })
})
