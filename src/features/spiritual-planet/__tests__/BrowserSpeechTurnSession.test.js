import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BROWSER_VOICE_STATES,
  BrowserSpeechTurnSession,
  isBrowserVoiceCaptureSupported,
} from '../digital-human/BrowserSpeechTurnSession'

function createMockMediaRecorderEnv({ chunks = ['fake-audio-bytes'], mimeType = 'audio/webm' } = {}) {
  const track = { stop: vi.fn() }
  const stream = { getTracks: () => [track] }
  const getUserMedia = vi.fn(() => Promise.resolve(stream))

  class FakeMediaRecorder {
    static isTypeSupported = vi.fn((type) => type === mimeType)

    constructor(mediaStream, options = {}) {
      this.stream = mediaStream
      this.mimeType = options.mimeType || mimeType
      this.state = 'inactive'
      this.ondataavailable = null
      this.onerror = null
      this.onstop = null
    }

    start() {
      this.state = 'recording'
    }

    stop() {
      if (this.state === 'inactive') return
      this.state = 'inactive'
      for (const part of chunks) {
        const blobPart = part ? new Blob([part], { type: this.mimeType }) : new Blob([], { type: this.mimeType })
        this.ondataavailable?.({ data: blobPart })
      }
      this.onstop?.()
    }
  }

  vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
  vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia } })
  return { track, stream, getUserMedia, FakeMediaRecorder }
}

describe('BrowserSpeechTurnSession', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reports unsupported in default jsdom and on non-secure origins, and supported with MediaRecorder or SpeechRecognition', () => {
    expect(isBrowserVoiceCaptureSupported()).toBe(false)

    createMockMediaRecorderEnv()
    expect(isBrowserVoiceCaptureSupported()).toBe(true)

    vi.stubGlobal('location', { protocol: 'http:', hostname: 'example.com' })
    expect(isBrowserVoiceCaptureSupported()).toBe(false)

    vi.stubGlobal('location', { protocol: 'https:', hostname: 'holiness.uk' })
    vi.stubGlobal('MediaRecorder', undefined)
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('webkitSpeechRecognition', class {})
    expect(isBrowserVoiceCaptureSupported()).toBe(true)
  })

  it('captures MediaRecorder chunks, stops microphone tracks immediately on stop, and delivers trimmed transcript without storage writes', async () => {
    const { track, getUserMedia } = createMockMediaRecorderEnv({ chunks: ['david-voice-question'] })
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const states = []
    const onFinalTranscript = vi.fn()
    const onError = vi.fn()
    let resolveTranscribe
    const transcribeBlob = vi.fn(() => new Promise((resolve) => {
      resolveTranscribe = resolve
    }))

    const session = new BrowserSpeechTurnSession({
      onStateChange: (next) => states.push(next),
      onFinalTranscript,
      onError,
      transcribeBlob,
      language: 'zh-CN',
    })

    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
    await session.startRecording()
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.RECORDING)

    const stopping = session.stopRecording()
    // Hardware mic track must stop immediately before network transcription completes.
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.TRANSCRIBING)
    expect(transcribeBlob).toHaveBeenCalledTimes(1)
    const [blobArg, optionsArg] = transcribeBlob.mock.calls[0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.size).toBeGreaterThan(0)
    expect(optionsArg).toEqual({ contentType: 'audio/webm', language: 'zh-CN' })

    resolveTranscribe({ transcript: '  你为什么没有杀扫罗？  ', provider: 'deepgram' })
    const result = await stopping
    expect(result).toBe('你为什么没有杀扫罗？')
    expect(onFinalTranscript).toHaveBeenCalledWith('你为什么没有杀扫罗？')
    expect(onError).not.toHaveBeenCalled()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
    expect(states).toEqual([
      BROWSER_VOICE_STATES.RECORDING,
      BROWSER_VOICE_STATES.TRANSCRIBING,
      BROWSER_VOICE_STATES.IDLE,
    ])
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(window.sessionStorage.length).toBe(0)
  })

  it('falls back to single-utterance SpeechRecognition when MediaRecorder is unavailable', async () => {
    let instance = null
    class FakeSpeechRecognition {
      constructor() {
        this.continuous = true
        this.interimResults = true
        this.lang = ''
        this.stop = vi.fn(() => {
          this.onresult?.({
            results: [[{ transcript: '  撒母耳为什么膏立你？ ' }]],
          })
        })
        this.start = vi.fn()
        instance = this
      }
    }
    vi.stubGlobal('MediaRecorder', undefined)
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('SpeechRecognition', FakeSpeechRecognition)

    const onFinalTranscript = vi.fn()
    const onError = vi.fn()
    const session = new BrowserSpeechTurnSession({
      onFinalTranscript,
      onError,
      language: 'zh-CN',
    })

    await session.startRecording()
    expect(instance.continuous).toBe(false)
    expect(instance.interimResults).toBe(false)
    expect(instance.lang).toBe('zh-CN')
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.RECORDING)

    const transcript = await session.stopRecording()
    expect(transcript).toBe('撒母耳为什么膏立你？')
    expect(onFinalTranscript).toHaveBeenCalledWith('撒母耳为什么膏立你？')
    expect(onError).not.toHaveBeenCalled()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
  })

  it('enforces half-duplex by auto-cancelling active capture and blocking start when avatar is speaking or beginTurn fires', async () => {
    const { track } = createMockMediaRecorderEnv()
    const onFinalTranscript = vi.fn()
    const onError = vi.fn()
    const session = new BrowserSpeechTurnSession({ onFinalTranscript, onError })

    await session.startRecording()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.RECORDING)

    session.setAvatarSpeaking(true)
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)

    await expect(session.startRecording()).rejects.toThrow(/半双工/)
    expect(onError).toHaveBeenCalledTimes(1)

    session.setAvatarSpeaking(false)
    await session.startRecording()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.RECORDING)

    session.beginTurn()
    expect(track.stop).toHaveBeenCalledTimes(2)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
    expect(onFinalTranscript).not.toHaveBeenCalled()
  })

  it('discards stale async transcription results after cancelRecording or disconnect', async () => {
    const { track } = createMockMediaRecorderEnv()
    let finishFirst
    let finishSecond
    const transcribeBlob = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { finishSecond = resolve }))
    const onFinalTranscript = vi.fn()

    const session = new BrowserSpeechTurnSession({ onFinalTranscript, transcribeBlob })

    await session.startRecording()
    const firstStop = session.stopRecording()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.TRANSCRIBING)

    session.cancelRecording()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
    finishFirst({ transcript: '已取消的旧语音' })
    await firstStop
    expect(onFinalTranscript).not.toHaveBeenCalled()

    await session.startRecording()
    const secondStop = session.stopRecording()
    session.disconnect()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.DISCONNECTED)
    finishSecond({ transcript: '已断开的旧语音' })
    await secondStop
    expect(onFinalTranscript).not.toHaveBeenCalled()
    expect(track.stop).toHaveBeenCalledTimes(2)
  })

  it('surfaces ERROR and releases tracks when transcript is empty', async () => {
    const { track } = createMockMediaRecorderEnv()
    const onFinalTranscript = vi.fn()
    const onError = vi.fn()
    const transcribeBlob = vi.fn().mockResolvedValue({ transcript: '   ' })

    const session = new BrowserSpeechTurnSession({
      onFinalTranscript,
      onError,
      transcribeBlob,
    })

    await session.startRecording()
    await session.stopRecording()

    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.ERROR)
    expect(onFinalTranscript).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('未能识别到清晰语音'),
    }))
  })
})
