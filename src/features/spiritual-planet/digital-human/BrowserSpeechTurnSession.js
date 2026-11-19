import { transcribeAudioBlob } from '../../../api'

export const BROWSER_VOICE_STATES = Object.freeze({
  DISCONNECTED: 'DISCONNECTED',
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  TRANSCRIBING: 'TRANSCRIBING',
  ERROR: 'ERROR',
})

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
]

function hasMediaRecorderCapture() {
  return typeof globalThis.MediaRecorder !== 'undefined'
    && typeof globalThis.navigator?.mediaDevices?.getUserMedia === 'function'
}

function getSpeechRecognitionConstructor() {
  return globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null
}

export function isBrowserVoiceCaptureSupported() {
  if (typeof window === 'undefined' || !window.location) return false
  const { protocol, hostname } = window.location
  const isSecureOrigin = protocol === 'https:'
    || hostname === 'localhost'
    || hostname === '127.0.0.1'
  if (!isSecureOrigin) return false
  return hasMediaRecorderCapture() || Boolean(getSpeechRecognitionConstructor())
}

function selectSupportedMimeType() {
  if (typeof globalThis.MediaRecorder?.isTypeSupported !== 'function') return ''
  return PREFERRED_MIME_TYPES.find((item) => globalThis.MediaRecorder.isTypeSupported(item)) || ''
}

export class BrowserSpeechTurnSession {
  constructor({
    onStateChange = () => {},
    onFinalTranscript = () => {},
    onError = () => {},
    transcribeBlob = transcribeAudioBlob,
    language = 'zh-CN',
  } = {}) {
    this.onStateChange = onStateChange
    this.onFinalTranscript = onFinalTranscript
    this.onError = onError
    this.transcribeBlob = transcribeBlob
    this.language = language
    this.state = BROWSER_VOICE_STATES.IDLE
    this.avatarSpeaking = false
    this.disposed = false
    this.captureRevision = 0
    this.stream = null
    this.recorder = null
    this.recognition = null
    this.chunks = []
    this.stopPromise = null
    this.resolveStop = null
  }

  getState() {
    return this.state
  }

  setState(next) {
    if (this.state === next) return
    this.state = next
    this.onStateChange(next)
  }

  releaseStream(targetStream = this.stream) {
    if (targetStream === this.stream) {
      this.stream = null
    }
    const tracks = targetStream?.getTracks?.() || []
    for (const track of tracks) {
      try {
        track.stop?.()
      } catch {
        // Ignore individual track teardown errors during cleanup.
      }
    }
  }

  abortActiveResources() {
    const recorder = this.recorder
    this.recorder = null
    this.chunks = []
    if (recorder) {
      recorder.ondataavailable = null
      recorder.onerror = null
      recorder.onstop = null
      if (recorder.state && recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          // Recorder may already be inactive.
        }
      }
    }

    const recognition = this.recognition
    this.recognition = null
    if (recognition) {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        if (typeof recognition.abort === 'function') recognition.abort()
        else recognition.stop?.()
      } catch {
        // Ignore recognition abort errors during teardown.
      }
    }

    this.releaseStream()
    if (this.resolveStop) {
      const resolve = this.resolveStop
      this.resolveStop = null
      this.stopPromise = null
      resolve(null)
    }
  }

  fail(messageOrError) {
    const error = messageOrError instanceof Error ? messageOrError : new Error(String(messageOrError))
    this.abortActiveResources()
    if (!this.disposed) {
      this.setState(BROWSER_VOICE_STATES.ERROR)
    }
    this.onError(error)
    return error
  }

  async startRecording() {
    if (this.disposed) {
      const err = new Error('语音录入会话已关闭。')
      this.onError(err)
      throw err
    }
    if (this.avatarSpeaking) {
      const err = new Error('当前采用半双工策略：请等待人物讲述结束后再提问。')
      this.onError(err)
      throw err
    }
    if (!isBrowserVoiceCaptureSupported()) {
      const err = this.fail('当前浏览器环境不支持语音录入，请改用文字提问。')
      throw err
    }
    if (this.state === BROWSER_VOICE_STATES.RECORDING || this.state === BROWSER_VOICE_STATES.TRANSCRIBING) {
      return
    }

    const revision = ++this.captureRevision
    this.abortActiveResources()

    if (hasMediaRecorderCapture()) {
      await this.startMediaRecorderCapture(revision)
      return
    }

    this.startSpeechRecognitionCapture(revision)
  }

  async startMediaRecorderCapture(revision) {
    let stream
    try {
      stream = await globalThis.navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (caught) {
      if (revision !== this.captureRevision || this.disposed || this.avatarSpeaking) return
      const err = this.fail(caught?.message || '无法访问麦克风，请检查浏览器麦克风权限。')
      throw err
    }

    if (revision !== this.captureRevision || this.disposed || this.avatarSpeaking) {
      this.releaseStream(stream)
      return
    }

    this.stream = stream
    this.chunks = []
    const preferredMimeType = selectSupportedMimeType()
    let recorder
    try {
      recorder = preferredMimeType
        ? new globalThis.MediaRecorder(stream, { mimeType: preferredMimeType })
        : new globalThis.MediaRecorder(stream)
    } catch (caught) {
      this.releaseStream(stream)
      const err = this.fail(caught?.message || '无法初始化浏览器录音器。')
      throw err
    }

    this.recorder = recorder
    this.stopPromise = new Promise((resolve) => {
      this.resolveStop = resolve
    })

    recorder.ondataavailable = (event) => {
      if (revision !== this.captureRevision || this.disposed) return
      if (event?.data && event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    recorder.onerror = (event) => {
      if (revision !== this.captureRevision || this.disposed) return
      this.captureRevision += 1
      this.fail(event?.error?.message || '录音过程中发生错误，请重试或改用文字提问。')
    }

    recorder.onstop = () => {
      const finalize = this.resolveStop
      this.resolveStop = null
      this.stopPromise = null
      const recordedChunks = this.chunks
      this.chunks = []
      this.recorder = null
      // Release hardware microphone tracks immediately before network transcription.
      this.releaseStream(stream)

      if (revision !== this.captureRevision || this.disposed || this.avatarSpeaking) {
        finalize?.(null)
        return
      }

      const contentType = recorder.mimeType || recordedChunks[0]?.type || preferredMimeType || 'audio/webm'
      const blob = new Blob(recordedChunks, { type: contentType })
      if (!blob.size) {
        this.fail('未能采集到有效语音，请重试或改用文字提问。')
        finalize?.(null)
        return
      }

      this.setState(BROWSER_VOICE_STATES.TRANSCRIBING)
      void (async () => {
        try {
          const result = await this.transcribeBlob(blob, { contentType, language: this.language })
          if (revision !== this.captureRevision || this.disposed || this.avatarSpeaking) {
            finalize?.(null)
            return
          }
          const transcript = String(result?.transcript || '').trim()
          if (!transcript) {
            this.fail('未能识别到清晰语音，请重试或改用文字提问。')
            finalize?.(null)
            return
          }
          this.setState(BROWSER_VOICE_STATES.IDLE)
          await this.onFinalTranscript(transcript)
          finalize?.(transcript)
        } catch (caught) {
          if (revision === this.captureRevision && !this.disposed && !this.avatarSpeaking) {
            this.fail(caught?.message || '语音转写失败，请重试或改用文字提问。')
          }
          finalize?.(null)
        }
      })()
    }

    try {
      recorder.start()
      this.setState(BROWSER_VOICE_STATES.RECORDING)
    } catch (caught) {
      this.abortActiveResources()
      const err = this.fail(caught?.message || '无法启动录音，请重试。')
      throw err
    }
  }

  startSpeechRecognitionCapture(revision) {
    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition) {
      const err = this.fail('当前浏览器不支持语音识别，请改用文字提问。')
      throw err
    }

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = this.language

    let settled = false
    this.recognition = recognition
    this.stopPromise = new Promise((resolve) => {
      this.resolveStop = resolve
    })

    const finishStop = (value = null) => {
      if (this.resolveStop) {
        const resolve = this.resolveStop
        this.resolveStop = null
        this.stopPromise = null
        resolve(value)
      }
    }

    recognition.onresult = (event) => {
      if (settled || revision !== this.captureRevision || this.disposed || this.avatarSpeaking) return
      settled = true
      this.recognition = null
      const segments = Array.from(event?.results || [])
        .map((item) => item?.[0]?.transcript || '')
        .join(' ')
        .trim()
      try {
        recognition.stop?.()
      } catch {
        // Ignore stop errors after final result.
      }
      if (!segments) {
        this.fail('未能识别到清晰语音，请重试或改用文字提问。')
        finishStop(null)
        return
      }
      this.setState(BROWSER_VOICE_STATES.TRANSCRIBING)
      Promise.resolve()
        .then(async () => {
          if (revision !== this.captureRevision || this.disposed || this.avatarSpeaking) return null
          this.setState(BROWSER_VOICE_STATES.IDLE)
          await this.onFinalTranscript(segments)
          return segments
        })
        .catch((caught) => {
          if (revision !== this.captureRevision || this.disposed || this.avatarSpeaking) return null
          this.fail(caught?.message || '处理语音识别结果失败。')
          return null
        })
        .then((value) => finishStop(value))
    }

    recognition.onerror = (event) => {
      if (settled || revision !== this.captureRevision || this.disposed) return
      settled = true
      this.captureRevision += 1
      const code = event?.error
      const message = code === 'not-allowed' || code === 'service-not-allowed'
        ? '麦克风或语音识别权限未开启，请检查浏览器设置。'
        : code === 'no-speech'
          ? '未能识别到清晰语音，请重试或改用文字提问。'
          : '语音识别未完成，请重试或改用文字提问。'
      this.fail(message)
      finishStop(null)
    }

    recognition.onend = () => {
      if (settled || revision !== this.captureRevision || this.disposed) return
      settled = true
      this.recognition = null
      this.fail('未能识别到清晰语音，请重试或改用文字提问。')
      finishStop(null)
    }

    try {
      recognition.start()
      this.setState(BROWSER_VOICE_STATES.RECORDING)
    } catch (caught) {
      settled = true
      const err = this.fail(caught?.message || '无法启动语音识别，请重试。')
      throw err
    }
  }

  async stopRecording() {
    if (this.disposed || this.state !== BROWSER_VOICE_STATES.RECORDING) {
      return this.stopPromise || null
    }
    const pending = this.stopPromise
    if (this.recorder) {
      try {
        if (this.recorder.state !== 'inactive') {
          this.recorder.stop()
        }
      } catch (caught) {
        this.fail(caught?.message || '结束录音失败，请重试。')
        return null
      }
      return pending
    }
    if (this.recognition) {
      this.setState(BROWSER_VOICE_STATES.TRANSCRIBING)
      try {
        this.recognition.stop()
      } catch (caught) {
        this.fail(caught?.message || '结束语音识别失败，请重试。')
        return null
      }
      return pending
    }
    return null
  }

  cancelRecording() {
    this.captureRevision += 1
    this.abortActiveResources()
    if (!this.disposed && this.state !== BROWSER_VOICE_STATES.DISCONNECTED) {
      this.setState(BROWSER_VOICE_STATES.IDLE)
    }
  }

  beginTurn() {
    this.cancelRecording()
  }

  setAvatarSpeaking(speaking) {
    const next = Boolean(speaking)
    if (this.avatarSpeaking === next) return
    this.avatarSpeaking = next
    if (next) {
      this.cancelRecording()
    }
  }

  disconnect() {
    this.disposed = true
    this.avatarSpeaking = false
    this.captureRevision += 1
    this.abortActiveResources()
    this.setState(BROWSER_VOICE_STATES.DISCONNECTED)
  }
}
