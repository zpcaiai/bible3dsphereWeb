/**
 * Tests for useSpeechInput hook.
 * Uses vi.stubGlobal to mock navigator APIs and fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechInput } from '../hooks/useSpeechInput'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMediaRecorderMock () {
  const mock = {
    start: vi.fn(),
    stop: vi.fn(),
    state: 'inactive',
    ondataavailable: null,
    onstop: null,
  }
  mock.start.mockImplementation(() => { mock.state = 'recording' })
  mock.stop.mockImplementation(() => {
    mock.state = 'inactive'
    mock.onstop?.()
  })
  return mock
}

function makeStreamMock () {
  return { getTracks: () => [{ stop: vi.fn() }] }
}

function makeAudioChunk () {
  return new Blob(['audio'], { type: 'audio/webm' })
}

function makeTranscribeResponse (transcript) {
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({
      ok: true,
      transcript,
      detected_language: 'zh',
      provider: 'deepgram',
    }),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSpeechInput', () => {
  let mediaRecorderMock
  let streamMock

  beforeEach(() => {
    vi.useFakeTimers()
    mediaRecorderMock = makeMediaRecorderMock()
    streamMock = makeStreamMock()

    vi.stubGlobal('MediaRecorder', vi.fn(() => mediaRecorderMock))

    vi.stubGlobal('navigator', {
      userAgent: 'TestBrowser/1.0',
      mediaDevices: {
        getUserMedia: vi.fn(async () => streamMock),
      },
    })

    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:', hostname: 'test.local' },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('initial state: not recording, no error, 0 seconds', () => {
    const { result } = renderHook(() => useSpeechInput({}))
    expect(result.current.isRecording).toBe(false)
    expect(result.current.recordingSeconds).toBe(0)
    expect(result.current.recordingError).toBeNull()
  })

  it('browser detection — isWeChat true when UA contains MicroMessenger', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 MicroMessenger/8.0' })
    const { result } = renderHook(() => useSpeechInput({}))
    expect(result.current.isWeChat).toBe(true)
  })

  it('startRecording sets isRecording = true', async () => {
    const { result } = renderHook(() => useSpeechInput({}))

    await act(async () => { await result.current.startRecording() })

    expect(result.current.isRecording).toBe(true)
    expect(mediaRecorderMock.start).toHaveBeenCalledOnce()
  })

  it('stopRecording sets isRecording = false', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => makeTranscribeResponse('')))
    const { result } = renderHook(() => useSpeechInput({}))

    await act(async () => { await result.current.startRecording() })
    expect(result.current.isRecording).toBe(true)

    await act(async () => { result.current.stopRecording() })
    await act(async () => {})
    expect(result.current.isRecording).toBe(false)
  })

  it('timer increments recordingSeconds each second', async () => {
    const { result } = renderHook(() => useSpeechInput({}))

    await act(async () => { await result.current.startRecording() })

    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.recordingSeconds).toBe(3)
  })

  it('shows backend configuration error after transcription returns 503', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Speech transcription is not configured' }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const { result } = renderHook(() => useSpeechInput({}))

      await act(async () => { await result.current.startRecording() })
      act(() => { mediaRecorderMock.ondataavailable?.({ data: makeAudioChunk() }) })
      await act(async () => { result.current.stopRecording() })
      await act(async () => {})

      expect(result.current.isRecording).toBe(false)
      expect(result.current.recordingError).toContain('DEEPGRAM_API_KEY')
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
      expect(fetchMock).toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })

  it('onTranscript called with Deepgram result after stop', async () => {
    const onTranscript = vi.fn()
    const fakeFetch = vi.fn(async () => makeTranscribeResponse('我感到很平安'))
    vi.stubGlobal('fetch', fakeFetch)

    const { result } = renderHook(() =>
      useSpeechInput({ onTranscript })
    )

    await act(async () => { await result.current.startRecording() })
    // Simulate data + stop
    act(() => { mediaRecorderMock.ondataavailable?.({ data: makeAudioChunk() }) })
    await act(async () => { result.current.stopRecording() })

    // Let async work settle
    await act(async () => {})

    expect(onTranscript).toHaveBeenCalledWith('我感到很平安')
  })

  it('sets recordingError when getUserMedia is denied', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('navigator', {
      userAgent: 'TestBrowser',
      mediaDevices: {
        getUserMedia: vi.fn(async () => {
          const err = new Error('denied')
          err.name = 'NotAllowedError'
          throw err
        }),
      },
    })

    try {
      const { result } = renderHook(() => useSpeechInput({}))
      await act(async () => { await result.current.startRecording() })

      expect(result.current.recordingError).toContain('权限被拒绝')
    } finally {
      consoleError.mockRestore()
    }
  })

  it('postProcess callback transforms transcript before onTranscript', async () => {
    const onTranscript = vi.fn()
    const postProcess = vi.fn(async (raw) => `[processed] ${raw}`)
    vi.stubGlobal('fetch', vi.fn(async () => makeTranscribeResponse('hello world')))

    const { result } = renderHook(() =>
      useSpeechInput({ onTranscript, postProcess })
    )

    await act(async () => { await result.current.startRecording() })
    act(() => { mediaRecorderMock.ondataavailable?.({ data: makeAudioChunk() }) })
    await act(async () => { result.current.stopRecording() })
    await act(async () => {})

    expect(postProcess).toHaveBeenCalledWith('hello world')
    expect(onTranscript).toHaveBeenCalledWith('[processed] hello world')
  })

  it('maxRecordingSeconds is 120', () => {
    const { result } = renderHook(() => useSpeechInput({}))
    expect(result.current.maxRecordingSeconds).toBe(120)
  })
})
