/**
 * useSpeechInput
 *
 * Browser microphone capture + Deepgram transcription.
 *
 * 录音质量优化（针对「低声/轻声常识别不到」）：
 *  1. 显式启用 autoGainControl + 软件增益(GainNode)+ 压缩器(Compressor)，
 *     把轻声放大、把音量拉平，让识别引擎拿到足够响度。
 *  2. 自动选择浏览器支持的录音容器(webm/mp4)，修复 iOS Safari 不支持 webm 的问题。
 *  3. Deepgram 加 detect_language（中英自动识别），避免按英语硬解中文导致空结果。
 *  4. 网络/5xx 失败自动重试一次。
 */
import { useState, useRef, useCallback } from 'react'

const MAX_RECORDING_SECONDS = 120
const GAIN_BOOST = 2.2 // 软件增益倍数（轻声放大）

// 选择当前浏览器支持的录音 mimeType（iOS Safari 只支持 mp4）。
function pickMimeType () {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ]
  for (const t of candidates) {
    try { if (MediaRecorder.isTypeSupported(t)) return t } catch (_) {}
  }
  return ''
}

// Deepgram 的 Content-Type（按容器归一化）。
function contentTypeFor (mime) {
  if (!mime) return 'audio/webm'
  if (mime.includes('webm')) return 'audio/webm'
  if (mime.includes('mp4'))  return 'audio/mp4'
  if (mime.includes('aac'))  return 'audio/aac'
  if (mime.includes('ogg'))  return 'audio/ogg'
  return 'audio/webm'
}

export function useSpeechInput ({
  deepgramApiKey = '',
  onTranscript,
  onLoadingChange,
  postProcess,
} = {}) {
  // ── Browser detection ──────────────────────────────────────────────────────
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  const isWeChat  = /MicroMessenger/i.test(ua)
  const isIOS     = /iPhone|iPad|iPod/i.test(ua)
  const isSafari  = /Safari/i.test(ua) && !/Chrome/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  // ── State ──────────────────────────────────────────────────────────────────
  const [isRecording,     setIsRecording]     = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordingError,  setRecordingError]  = useState(null)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mediaRecorderRef  = useRef(null)
  const audioChunksRef    = useRef([])
  const recordingTimerRef = useRef(null)
  const audioCtxRef       = useRef(null)
  const mimeTypeRef       = useRef('')
  const recordingDelayRef = useRef(null)

  const _closeAudioCtx = useCallback(() => {
    try { audioCtxRef.current?.close() } catch (_) {}
    audioCtxRef.current = null
  }, [])

  // ── Deepgram transcription（带一次重试）─────────────────────────────────────
  const _transcribe = useCallback(async (audioBlob, contentType) => {
    onLoadingChange?.(true)
    setRecordingError('正在识别语音...')
    // detect_language=true → 中英自动识别（修复按英语硬解中文→空结果）。
    const url =
      'https://api.deepgram.com/v1/listen' +
      '?model=nova-2&detect_language=true&punctuate=true&paragraphs=true&smart_format=true'
    const doFetch = () => fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        'Content-Type': contentType || 'audio/webm',
      },
      body: audioBlob,
    })
    try {
      let res = await doFetch()
      if (!res.ok && res.status >= 500) {
        await new Promise(r => setTimeout(r, 600))
        res = await doFetch() // 瞬时 5xx 自动重试一次
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.err_msg || `语音识别失败: ${res.status}`)
      }
      const data = await res.json()
      const raw  = data.results?.channels?.[0]?.alternatives?.[0]?.transcript

      if (raw?.trim()) {
        setRecordingError('正在优化文本...')
        const processed = postProcess ? await postProcess(raw.trim()) : raw.trim()
        onTranscript?.(processed)
        setRecordingError(null)
      } else {
        setRecordingError('没听清，请离麦克风近一点、稍大声重说一次')
      }
    } catch (err) {
      // 网络异常再重试一次
      try {
        await new Promise(r => setTimeout(r, 600))
        const res2 = await doFetch()
        if (res2.ok) {
          const data2 = await res2.json()
          const raw2 = data2.results?.channels?.[0]?.alternatives?.[0]?.transcript
          if (raw2?.trim()) {
            const processed = postProcess ? await postProcess(raw2.trim()) : raw2.trim()
            onTranscript?.(processed)
            setRecordingError(null)
            return
          }
          setRecordingError('没听清，请离麦克风近一点、稍大声重说一次')
          return
        }
      } catch (_) {}
      console.error('[useSpeechInput] transcribe error:', err)
      setRecordingError(err.message || '语音识别失败，请检查网络连接')
    } finally {
      onLoadingChange?.(false)
    }
  }, [deepgramApiKey, postProcess, onTranscript, onLoadingChange])

  // ── startRecording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setRecordingError(null)
    audioChunksRef.current = []

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError('您的浏览器不支持录音功能，请使用 Chrome、Safari 或 Edge 浏览器')
      return
    }
    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost'
    ) {
      setRecordingError('录音功能需要 HTTPS 安全连接。请确保网址以 https:// 开头')
      return
    }

    try {
      // 显式开启自动增益（对轻声很关键），单声道。
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })

      // 软件增益链：source → compressor（拉平动态）→ gain（整体放大）→ dest。
      // 让低声/耳语达到识别引擎需要的响度，同时压缩器避免大声破音。
      let recordStream = stream
      try {
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC) {
          const ctx = new AC()
          if (ctx.state === 'suspended') { try { await ctx.resume() } catch (_) {} }
          const src = ctx.createMediaStreamSource(stream)
          const comp = ctx.createDynamicsCompressor()
          comp.threshold.value = -50
          comp.knee.value = 30
          comp.ratio.value = 12
          comp.attack.value = 0.003
          comp.release.value = 0.25
          const gain = ctx.createGain()
          gain.gain.value = GAIN_BOOST
          const dest = ctx.createMediaStreamDestination()
          src.connect(comp); comp.connect(gain); gain.connect(dest)
          recordStream = dest.stream
          audioCtxRef.current = ctx
        }
      } catch (_) {
        recordStream = stream // WebAudio 不可用则用原始流
      }

      const mime = pickMimeType()
      mimeTypeRef.current = mime
      const mediaRecorder = mime
        ? new MediaRecorder(recordStream, { mimeType: mime })
        : new MediaRecorder(recordStream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        clearInterval(recordingTimerRef.current)
        setRecordingSeconds(0)
        const usedMime = mediaRecorder.mimeType || mimeTypeRef.current || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: usedMime })
        await _transcribe(blob, contentTypeFor(usedMime))
        stream.getTracks().forEach(t => t.stop())
        _closeAudioCtx()
      }

      mediaRecorderRef.current = mediaRecorder
      // timeslice：定期吐数据，避免极短录音丢帧。
      mediaRecorder.start(250)
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording()             // eslint-disable-line no-use-before-define
            return MAX_RECORDING_SECONDS
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('[useSpeechInput] start error:', err)
      _closeAudioCtx()

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
      setRecordingError(errorMsg)
    }
  }, [_transcribe, _closeAudioCtx, isWeChat, isIOS, isSafari, isAndroid, ua])

  // ── stopRecording ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    clearInterval(recordingTimerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  return {
    isRecording,
    recordingSeconds,
    recordingError,
    setRecordingError,
    isWeChat,
    isIOS,
    isSafari,
    isAndroid,
    maxRecordingSeconds: MAX_RECORDING_SECONDS,
    recordingDelayRef,
    startRecording,
    stopRecording,
  }
}
