import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BROWSER_VOICE_STATES,
  BrowserSpeechTurnSession,
  DEFAULT_MAX_AUDIO_BLOB_BYTES,
  DEFAULT_MAX_RECORDING_DURATION_MS,
  DEFAULT_RECORDING_TIMESLICE_MS,
  isBrowserVoiceCaptureSupported,
  PREFERRED_MIME_TYPES,
} from '../digital-human/BrowserSpeechTurnSession'

function createMockMediaRecorderEnv({
  chunks = ['fake-audio-bytes'],
  mimeType = 'audio/webm',
  supportedMimeTypes = [mimeType],
} = {}) {
  const track = { stop: vi.fn() }
  const stream = { getTracks: () => [track] }
  const getUserMedia = vi.fn(() => Promise.resolve(stream))
  let lastRecorder = null

  class FakeMediaRecorder {
    static isTypeSupported = vi.fn((type) => supportedMimeTypes.includes(type))

    constructor(mediaStream, options = {}) {
      this.stream = mediaStream
      this.mimeType = options.mimeType || mimeType
      this.state = 'inactive'
      this.ondataavailable = null
      this.onerror = null
      this.onstop = null
      this.startTimeslice = undefined
      lastRecorder = this
    }

    start(timeslice) {
      this.state = 'recording'
      this.startTimeslice = timeslice
    }

    stop() {
      if (this.state === 'inactive') return
      this.state = 'inactive'
      for (const part of chunks) {
        const blobPart = part instanceof Blob
          ? part
          : (part ? new Blob([part], { type: this.mimeType }) : new Blob([], { type: this.mimeType }))
        this.ondataavailable?.({ data: blobPart })
      }
      this.onstop?.()
    }
  }

  vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
  vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia } })
  return { track, stream, getUserMedia, FakeMediaRecorder, getLastRecorder: () => lastRecorder }
}

describe('BrowserSpeechTurnSession', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('negotiates expanded PREFERRED_MIME_TYPES including opus, mp4a, and ogg codecs', () => {
    expect(PREFERRED_MIME_TYPES).toEqual(expect.arrayContaining([
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ]))
    expect(DEFAULT_RECORDING_TIMESLICE_MS).toBe(250)
    expect(DEFAULT_MAX_RECORDING_DURATION_MS).toBe(60_000)
    expect(DEFAULT_MAX_AUDIO_BLOB_BYTES).toBe(10 * 1024 * 1024)
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

  it('starts MediaRecorder with 250ms timeslice, passes AbortSignal to transcribeBlob, and delivers trimmed transcript', async () => {
    const { track, getUserMedia, getLastRecorder } = createMockMediaRecorderEnv({
      chunks: ['david-voice-question'],
      mimeType: 'audio/mp4;codecs=mp4a.40.2',
      supportedMimeTypes: ['audio/mp4;codecs=mp4a.40.2'],
    })
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
      language: 'en-US',
    })

    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
    await session.startRecording()
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(getLastRecorder().startTimeslice).toBe(250)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.RECORDING)

    const stopping = session.stopRecording()
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.TRANSCRIBING)
    expect(transcribeBlob).toHaveBeenCalledTimes(1)
    const [blobArg, optionsArg] = transcribeBlob.mock.calls[0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.size).toBeGreaterThan(0)
    expect(optionsArg.contentType).toBe('audio/mp4;codecs=mp4a.40.2')
    expect(optionsArg.language).toBe('en-US')
    expect(optionsArg.signal).toBeInstanceOf(AbortSignal)
    expect(optionsArg.signal.aborted).toBe(false)

    resolveTranscribe({ transcript: '  Why did you spare Saul?  ', provider: 'deepgram' })
    const result = await stopping
    expect(result).toBe('Why did you spare Saul?')
    expect(onFinalTranscript).toHaveBeenCalledWith('Why did you spare Saul?')
    expect(onError).not.toHaveBeenCalled()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
    expect(states).toEqual([
      BROWSER_VOICE_STATES.RECORDING,
      BROWSER_VOICE_STATES.TRANSCRIBING,
      BROWSER_VOICE_STATES.IDLE,
    ])
    expect(setItemSpy).not.toHaveBeenCalled()
  })

  it('auto-stops recording cleanly when maxDurationMs (60s) is reached', async () => {
    vi.useFakeTimers()
    const { track } = createMockMediaRecorderEnv({ chunks: ['auto-stopped-chunk'] })
    const transcribeBlob = vi.fn().mockResolvedValue({ transcript: '自动结束录音文本' })
    const onFinalTranscript = vi.fn()

    const session = new BrowserSpeechTurnSession({
      transcribeBlob,
      onFinalTranscript,
      maxDurationMs: 60_000,
    })

    await session.startRecording()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.RECORDING)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(transcribeBlob).toHaveBeenCalledTimes(1)
    expect(onFinalTranscript).toHaveBeenCalledWith('自动结束录音文本')
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
  })

  it('rejects audio blobs > 10MB before uploading to transcribeBlob', async () => {
    const oversizedChunk = new Uint8Array(10 * 1024 * 1024 + 64)
    const { track } = createMockMediaRecorderEnv({
      chunks: [new Blob([oversizedChunk], { type: 'audio/webm' })],
    })
    const transcribeBlob = vi.fn()
    const onError = vi.fn()

    const session = new BrowserSpeechTurnSession({
      transcribeBlob,
      onError,
    })

    await session.startRecording()
    await session.stopRecording()

    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(transcribeBlob).not.toHaveBeenCalled()
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.ERROR)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('10MB'),
    }))
  })

  it('aborts in-flight transcribeBlob AbortSignal immediately on cancelRecording(), muteForAvatarSpeech(), and disconnect()', async () => {
    createMockMediaRecorderEnv()
    const signals = []
    const transcribeBlob = vi.fn((_blob, opts) => {
      signals.push(opts.signal)
      return new Promise(() => {})
    })
    const onFinalTranscript = vi.fn()

    const session = new BrowserSpeechTurnSession({ onFinalTranscript, transcribeBlob })

    // 1. cancelRecording() aborts in-flight transcription
    await session.startRecording()
    void session.stopRecording()
    expect(signals).toHaveLength(1)
    expect(signals[0].aborted).toBe(false)
    session.cancelRecording()
    expect(signals[0].aborted).toBe(true)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)

    // 2. muteForAvatarSpeech() aborts in-flight transcription
    await session.startRecording()
    void session.stopRecording()
    expect(signals).toHaveLength(2)
    expect(signals[1].aborted).toBe(false)
    session.muteForAvatarSpeech()
    expect(signals[1].aborted).toBe(true)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.IDLE)
    session.setAvatarSpeaking(false)

    // 3. disconnect() aborts in-flight transcription
    await session.startRecording()
    void session.stopRecording()
    expect(signals).toHaveLength(3)
    expect(signals[2].aborted).toBe(false)
    session.disconnect()
    expect(signals[2].aborted).toBe(true)
    expect(session.getState()).toBe(BROWSER_VOICE_STATES.DISCONNECTED)
    expect(onFinalTranscript).not.toHaveBeenCalled()
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
