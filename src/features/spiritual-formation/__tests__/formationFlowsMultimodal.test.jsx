import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'

// 语音、TTS 与后端全部打桩：这些测试要守的是「什么时候允许发声 / 什么时候允许落盘」，
// 不是浏览器的录音能力。
const audioMocks = vi.hoisted(() => ({ speakOnce: vi.fn(async () => 'ended'), stopAllAudio: vi.fn() }))

vi.mock('../../../useGlobalAudio', async () => {
  const actual = await vi.importActual('../../../useGlobalAudio')
  return { ...actual, speakOnce: audioMocks.speakOnce, stopAllAudio: audioMocks.stopAllAudio }
})

let speechOptions = null
vi.mock('../../../hooks/useSpeechInput', () => ({
  useSpeechInput: (opts) => {
    speechOptions = opts
    return {
      isRecording: false,
      recordingSeconds: 0,
      recordingError: null,
      setRecordingError: () => {},
      speechPhase: 'idle',
      isTranscribing: false,
      isWeChat: false,
      isIOS: false,
      isSafari: false,
      isAndroid: false,
      maxRecordingSeconds: 120,
      recordingDelayRef: { current: null },
      startRecording: async () => true,
      stopRecording: () => {},
      cancelRecording: () => {},
    }
  },
}))

vi.mock('../../../api', () => ({
  transcribeAudioBlob: vi.fn(async () => ({ transcript: 'hello' })),
  translateTexts: vi.fn(async (texts) => texts.map(() => 'x')),
  fetchTTS: vi.fn(async () => new Blob()),
}))

import GraceRecoveryFlow from '../components/GraceRecoveryFlow'
import DailySpiritualScanForm from '../components/DailySpiritualScanForm'
import ThoughtCaptiveFlow from '../components/ThoughtCaptiveFlow'
import HolyLifeEngine from '../components/HolyLifeEngine'
import RepentancePathView from '../components/RepentancePathView'
import { GRACE_RECOVERY_STATEMENT } from '../lib/pastoralSafety'
import { REPENTANCE_PATHS_KEY } from '../lib/repentancePathStore'
import { setMediaPref } from '../../../lib/media/mediaPrefs'

describe('formation flows · charts and multimodal guardrails', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    setMediaPref('sound', true)
    audioMocks.speakOnce.mockClear()
    window.localStorage.removeItem(REPENTANCE_PATHS_KEY)
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('never speaks the absolution on its own, and speaks it verbatim when asked', async () => {
    const { container, unmount } = render(<GraceRecoveryFlow userId="u1" onSave={() => {}} />)
    expect(audioMocks.speakOnce).not.toHaveBeenCalled()

    const listen = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('念给我听'))
    expect(listen).toBeTruthy()
    await act(async () => { fireEvent.click(listen) })
    expect(audioMocks.speakOnce).toHaveBeenCalledWith(GRACE_RECOVERY_STATEMENT, { rate: 0.82 })
    unmount()
  })

  it('hides the listen button when the sound preference is off', () => {
    setMediaPref('sound', false)
    const { container } = render(<GraceRecoveryFlow userId="u1" onSave={() => {}} />)
    expect([...container.querySelectorAll('button')].some((b) => b.textContent.includes('念给我听'))).toBe(false)
    expect(container.textContent).toContain('声音是关着的')
    setMediaPref('sound', true)
  })

  it('advances the recovery milestone from what the user actually wrote', () => {
    const { container } = render(<GraceRecoveryFlow userId="u1" onSave={() => {}} />)
    expect(container.textContent).toContain('第 1 站')
    fireEvent.change(container.querySelector('textarea'), { target: { value: 'I lost my temper.' } })
    expect(container.textContent).toContain('第 2 站')
    expect(container.textContent).toContain('I lost my temper.')
  })

  it('puts the transcript into the chosen field and never saves it', () => {
    const onSave = vi.fn()
    const { container } = render(<DailySpiritualScanForm userId="u1" onSave={onSave} />)

    act(() => { speechOptions.onTranscript('今天我又逃避了') })
    act(() => { speechOptions.onTranscript('后来才发现是怕被看见') })
    const behavior = [...container.querySelectorAll('textarea')].find((t) => t.value.includes('今天我又逃避了'))
    expect(behavior.value).toBe('今天我又逃避了 后来才发现是怕被看见')

    const target = [...container.querySelectorAll('select')].find((s) => s.value === 'behaviorDescription')
    fireEvent.change(target, { target: { value: 'confession' } })
    act(() => { speechOptions.onTranscript('主啊，我承认。') })
    expect([...container.querySelectorAll('textarea')].some((t) => t.value === '主啊，我承认。')).toBe(true)

    expect(onSave).not.toHaveBeenCalled()
  })

  it('tracks the thought-captive chain by the fields that are filled', () => {
    const { container } = render(<ThoughtCaptiveFlow userId="u1" onSave={() => {}} />)
    expect(container.textContent).toContain('第 1 步')
    fireEvent.change(container.querySelector('textarea'), { target: { value: '他一定觉得我很失败' } })
    // 第 2 步「命名」预选了模式，所以填完第 1 步就直接推进到第 3 步「揭露」
    expect(container.textContent).toContain('第 3 步')
  })

  it('folds the repentance path into its stages once the path is begun', () => {
    const { container } = render(<RepentancePathView strongholdCode="self_sovereignty" userId="test-user" />)
    expect(container.textContent).not.toContain('这条路会经过的阶段')

    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent.includes('开始悔改路径')))
    expect(container.textContent).toContain('这条路会经过的阶段')
    // 7 天路径 = STAGE_TEMPLATE 的七个阶段，一天一站
    expect(container.textContent).toContain('7 个阶段')
    expect(container.textContent).toContain('看见')
    expect(container.textContent).toContain('回顾果子')
  })

  it('refuses to draw the holy-life radar from untouched default scores', () => {
    const { container } = render(<HolyLifeEngine userId="u1" history={[]} onSave={async (x) => x} />)
    expect(container.textContent).toContain('没有形状可画')

    const checkbox = container.querySelector('.holy-life-toggle input[type="checkbox"]')
    fireEvent.click(checkbox)
    expect(container.textContent).not.toContain('没有形状可画')
    expect(screen.getAllByText('一天四段的形状').length).toBeGreaterThan(0)
  })
})
