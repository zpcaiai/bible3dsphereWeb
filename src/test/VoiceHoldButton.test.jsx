import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import VoiceHoldButton from '../components/VoiceHoldButton'

function createSpeech(overrides = {}) {
  return {
    isRecording: false,
    recordingSeconds: 0,
    maxRecordingSeconds: 120,
    recordingError: null,
    speechPhase: 'idle',
    isTranscribing: false,
    startRecording: vi.fn().mockResolvedValue(true),
    stopRecording: vi.fn(),
    cancelRecording: vi.fn(),
    ...overrides,
  }
}

describe('VoiceHoldButton', () => {
  it('clears the transcribing hint when recognition fails', async () => {
    const speech = createSpeech()
    const { rerender } = render(
      <VoiceHoldButton
        speech={{ ...speech, speechPhase: 'transcribing', isTranscribing: true }}
      />,
    )
    expect(screen.getByText(/正在转文字|Transcribing/)).toBeTruthy()

    rerender(
      <VoiceHoldButton
        speech={{
          ...speech,
          speechPhase: 'error',
          recordingError: '未能识别到语音内容，请重试',
        }}
      />,
    )

    expect(screen.queryByText(/正在转文字|Transcribing/)).toBeNull()
    expect(screen.getByText(/松开后自动转文字|Release to transcribe/)).toBeTruthy()
  })
})
