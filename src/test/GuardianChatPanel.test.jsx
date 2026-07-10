import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import GuardianChatPanel from '../components/guardian/GuardianChatPanel'
import { useGuardianStore } from '../components/guardian/guardianStore'
import { setRuntimeLang } from '../i18n/runtime'

vi.mock('../components/guardian/useGuardianVoice', () => ({
  useGuardianVoice: () => ({
    isRecording: false,
    isTranscribing: false,
    recordingError: '',
    recordingSeconds: 0,
    speaking: false,
    speak: vi.fn(),
    stopSpeaking: vi.fn(),
    startRecording: vi.fn(async () => true),
    stopRecording: vi.fn(),
    cancelRecording: vi.fn(),
  }),
}))

vi.mock('../components/VoiceHoldButton', () => ({
  default: () => '按住说',
}))

vi.mock('../autoTranslate.jsx', () => ({
  AutoText: ({ children, text }) => text ?? children ?? null,
}))

describe('GuardianChatPanel pastoral prompts', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    useGuardianStore.setState({
      chatMode: 'companion',
      spriteState: 'idle',
      sending: false,
      messages: [{ id: 'seed', role: 'assistant', content: '你好，我是你的属灵守护者', mode: 'companion' }],
    })
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('fills a gospel prompt and switches to comfort mode for shame/self-blame', () => {
    const { container } = render(<GuardianChatPanel />)

    fireEvent.change(screen.getByLabelText('快速引导'), { target: { value: 'guilt' } })

    expect(useGuardianStore.getState().chatMode).toBe('comfort')
    expect(container.querySelector('textarea').value).toContain('分辨认罪与控告')
  })

  it('fills a prayer prompt and switches to prayer mode', () => {
    const { container } = render(<GuardianChatPanel />)

    fireEvent.change(screen.getByLabelText('快速引导'), { target: { value: 'pray' } })

    expect(useGuardianStore.getState().chatMode).toBe('prayer')
    expect(container.querySelector('textarea').value).toContain('把现在的心交给神')
  })
})
