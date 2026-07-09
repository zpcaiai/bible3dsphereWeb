/**
 * useSpeechInput
 *
 * Encapsulates all browser microphone + server-side transcription logic
 * that was previously inline in App.jsx.
 *
 * Usage:
 *   const speech = useSpeechInput({
 *     onTranscript: (text) => setQuery(q => q ? `${q} ${text}` : text),
 *     onLoadingChange: setLoading,
 *     postProcess: async (raw) => { /* punctuation + bilingual * / return raw },
 *   })
 *
 * Returns:
 *   isRecording, recordingSeconds, recordingError, setRecordingError,
 *   speechPhase, isTranscribing,
 *   isWeChat, isIOS, isSafari, isAndroid,
 *   maxRecordingSeconds,
 *   recordingDelayRef,
 *   startRecording(), stopRecording(), cancelRecording()
 */
import { useState, useRef, useCallback } from 'react'
import { t as i18nT } from '../i18n/runtime'
import { transcribeAudioBlob } from '../api'

const MAX_RECORDING_SECONDS = 120
const MIN_RECORDING_MS = 500
const RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
]

function pickRecordingMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  const isTypeSupported = MediaRecorder.isTypeSupported
  if (typeof isTypeSupported !== 'function') return ''
  return RECORDING_MIME_TYPES.find((type) => {
    try {
      return isTypeSupported.call(MediaRecorder, type)
    } catch {
      return false
    }
  }) || ''
}

function stopStreamTracks(stream) {
  try {
    stream?.getTracks?.().forEach((track) => track.stop())
  } catch {
    // best-effort cleanup
  }
}

export function useSpeechInput ({
  onTranscript,
  onLoadingChange,
  postProcess,
} = {}) {
  // ── Browser detection (stable across renders) ──────────────────────────────
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  const isWeChat  = /MicroMessenger/i.test(ua)
  const isIOS     = /iPhone|iPad|iPod/i.test(ua)
  const isSafari  = /Safari/i.test(ua) && !/Chrome/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  // ── State ──────────────────────────────────────────────────────────────────
  const [isRecording,     setIsRecording]     = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordingError,  setRecordingError]  = useState(null)
  const [speechPhase, setSpeechPhase] = useState('idle')

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mediaRecorderRef  = useRef(null)
  const streamRef = useRef(null)
  const audioChunksRef    = useRef([])
  const recordingTimerRef = useRef(null)
  const recordingStartedAtRef = useRef(0)
  const shouldTranscribeRef = useRef(true)
  /** Long-press delay handle — exposed so callers can cancel it on mouseLeave */
  const recordingDelayRef = useRef(null)

  // ── Internal: backend speech transcription ───────────────────────────────
  const _transcribe = useCallback(async (audioBlob, contentType) => {
    onLoadingChange?.(true)
    setSpeechPhase('transcribing')
    setRecordingError(null)
    try {
      const data = await transcribeAudioBlob(audioBlob, { contentType })
      const raw = data.transcript

      if (raw?.trim()) {
        setSpeechPhase('processing')
        const processed = postProcess
          ? await postProcess(raw.trim())
          : raw.trim()
        onTranscript?.(processed)
        setRecordingError(null)
        setSpeechPhase('idle')
      } else {
        setRecordingError(i18nT('未能识别到语音内容，请重试'))
        setSpeechPhase('error')
      }
    } catch (err) {
      console.error('[useSpeechInput] transcribe error:', err)
      setRecordingError(i18nT(err.message || '语音识别失败，请检查网络连接'))
      setSpeechPhase('error')
    } finally {
      onLoadingChange?.(false)
    }
  }, [postProcess, onTranscript, onLoadingChange])

  // ── stopRecording ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(({ discard = false } = {}) => {
    clearInterval(recordingTimerRef.current)
    recordingTimerRef.current = null
    shouldTranscribeRef.current = !discard

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        setSpeechPhase(discard ? 'idle' : 'error')
      }
    } else {
      stopStreamTracks(streamRef.current)
      streamRef.current = null
      if (discard) {
        setRecordingError(null)
        setSpeechPhase('idle')
      }
    }
    setIsRecording(false)
  }, [])

  const cancelRecording = useCallback(() => {
    stopRecording({ discard: true })
  }, [stopRecording])

  // ── startRecording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isRecording || mediaRecorderRef.current?.state === 'recording') return true

    setRecordingError(null)
    setSpeechPhase('idle')
    audioChunksRef.current = []
    shouldTranscribeRef.current = true

    if (typeof MediaRecorder === 'undefined') {
      setRecordingError(i18nT('您的浏览器不支持录音功能，请使用 Chrome、Safari 或 Edge 浏览器'))
      setSpeechPhase('error')
      return false
    }
    const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : null
    if (!mediaDevices?.getUserMedia) {
      setRecordingError(i18nT('您的浏览器不支持录音功能，请使用 Chrome、Safari 或 Edge 浏览器'))
      setSpeechPhase('error')
      return false
    }
    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost'
    ) {
      setRecordingError(i18nT('录音功能需要 HTTPS 安全连接。请确保网址以 https:// 开头'))
      setSpeechPhase('error')
      return false
    }

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      const pickedMimeType = pickRecordingMimeType()
      const options = pickedMimeType ? { mimeType: pickedMimeType } : undefined
      let mediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream, options)
      } catch (err) {
        if (!options) throw err
        mediaRecorder = new MediaRecorder(stream)
      }
      const contentType = mediaRecorder.mimeType || pickedMimeType || 'audio/webm'

      mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
        setRecordingSeconds(0)
        setIsRecording(false)
        mediaRecorderRef.current = null
        stopStreamTracks(streamRef.current || stream)
        streamRef.current = null

        const chunks = audioChunksRef.current
        audioChunksRef.current = []

        if (!shouldTranscribeRef.current) {
          setRecordingError(null)
          setSpeechPhase('idle')
          return
        }

        if (Date.now() - recordingStartedAtRef.current < MIN_RECORDING_MS) {
          setRecordingError(i18nT('录音太短，请按住说完一句话再松开。'))
          setSpeechPhase('error')
          return
        }

        const blob = new Blob(chunks, { type: contentType })
        if (!blob.size) {
          setRecordingError(i18nT('未能识别到语音内容，请重试'))
          setSpeechPhase('error')
          return
        }

        await _transcribe(blob, contentType)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      recordingStartedAtRef.current = Date.now()
      setIsRecording(true)
      setRecordingSeconds(0)
      setSpeechPhase('recording')

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording()
            return MAX_RECORDING_SECONDS
          }
          return prev + 1
        })
      }, 1000)
      return true
    } catch (err) {
      console.error('[useSpeechInput] start error:', err)
      stopStreamTracks(streamRef.current)
      streamRef.current = null
      mediaRecorderRef.current = null

      let errorMsg = '无法访问麦克风'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        if (isWeChat) {
          errorMsg = '【微信限制】请点击右上角「···」→「在Safari/浏览器中打开」'
        } else if (isIOS && isSafari) {
          errorMsg = '【iOS Safari】设置：①打开「设置」→「Safari」→「麦克风」→开启 ②或刷新页面在弹窗中点击「允许」'
        } else if (isIOS && /Chrome|CriOS/i.test(ua)) {
          errorMsg = '【iOS Chrome】打开「设置」→「Chrome」→开启「麦克风」权限'
        } else if (isAndroid) {
          errorMsg = '【Android】点击地址栏左侧「ⓘ」图标，找到麦克风选项并允许'
        } else {
          errorMsg = '【权限被拒绝】刷新页面，在弹窗中点击「允许」，或检查浏览器设置中的麦克风权限'
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = '【未找到麦克风】请检查麦克风已连接且系统已授权'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = '【麦克风被占用】请关闭微信语音通话、会议等应用'
      } else if (err.name === 'SecurityError') {
        errorMsg = '【安全限制】录音功能必须使用 HTTPS。请确保网址以 https:// 开头'
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMsg = '【连接不安全】录音需要 HTTPS 加密连接'
      } else if (err.message?.toLowerCase().includes('permission')) {
        if (isWeChat) {
          errorMsg = '【微信限制】请点击右上角「···」→「在Safari/浏览器中打开」后使用录音'
        } else if (isIOS) {
          errorMsg = '【iOS设置】打开「设置」→「隐私与安全性」→「麦克风」→找到浏览器并开启'
        } else {
          errorMsg = '【权限被拒绝】请刷新页面，在弹出的权限请求中点击「允许」'
        }
      }

      setRecordingError(i18nT(errorMsg))
      setSpeechPhase('error')
      return false
    }
  }, [_transcribe, isRecording, isWeChat, isIOS, isSafari, isAndroid, ua, stopRecording])

  return {
    // State
    isRecording,
    recordingSeconds,
    recordingError,
    setRecordingError,
    speechPhase,
    isTranscribing: speechPhase === 'transcribing' || speechPhase === 'processing',
    // Browser flags
    isWeChat,
    isIOS,
    isSafari,
    isAndroid,
    // Constants
    maxRecordingSeconds: MAX_RECORDING_SECONDS,
    // Refs
    recordingDelayRef,
    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
