/**
 * useVoiceNote —— 「录一段 → 回放确认 → 转写 → 提交」的共享语音便条录音器。
 *
 * 为什么不直接复用 useSpeechInput：那个 hook 把录音当输入法用，转写完就把 Blob 丢掉；
 * 而语音留言 / 口述见证要求「文字必须与音频同在」——用户得先回放确认自己说了什么，
 * 转写结果还要能手动订正后再提交，所以这里必须把 Blob 与 objectURL 保留到提交为止。
 *
 * 录音链路复用 recorderUtils（pickMimeType / makeBoostedStream / AUDIO_CONSTRAINTS），
 * 转写复用后端已有的 Deepgram 代理 transcribeAudioBlob（/api/speech/transcribe）。
 *
 * phase: 'idle' | 'recording' | 'transcribing' | 'ready' | 'error'
 *   ready 时 transcript 可能为空字符串（没听清）——调用方必须要求用户补齐文字后才允许提交，
 *   文字不是可选项：它是聋人可读性与全文搜索的唯一依据。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { t as i18nT } from '../i18n/runtime'
import { transcribeAudioBlob } from '../api'
import { AUDIO_CONSTRAINTS, contentTypeFor, makeBoostedStream, pickMimeType } from './recorderUtils'

function stopTracks (stream) {
  try { stream?.getTracks?.().forEach((track) => track.stop()) } catch { /* best effort */ }
}

// 浏览器/环境是否具备录音条件。不具备时调用方应当**完全隐藏**语音入口，
// 而不是给一个点了报错的按钮——纯文字通道必须始终可用。
export function isVoiceNoteSupported () {
  if (typeof window === 'undefined') return false
  if (typeof MediaRecorder === 'undefined') return false
  if (!navigator?.mediaDevices?.getUserMedia) return false
  // getUserMedia 在非安全上下文里必然失败，提前判掉省一次弹窗。
  return window.isSecureContext !== false
    || window.location.hostname === 'localhost'
}

// 麦克风失败原因要说人话：绝大多数是微信内置浏览器或没给权限。
function micErrorMessage (err) {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || /permission/i.test(err?.message || '')) {
    if (/MicroMessenger/i.test(ua)) return i18nT('微信内置浏览器不能录音，请点右上角「···」→「在浏览器中打开」')
    return i18nT('麦克风权限被拒绝，你仍可以直接打字。要用语音请在浏览器设置里允许麦克风')
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return i18nT('没有找到麦克风，你仍可以直接打字')
  if (name === 'NotReadableError' || name === 'TrackStartError') return i18nT('麦克风被其它应用占用了，请先关闭通话或会议')
  if (name === 'SecurityError') return i18nT('录音需要 HTTPS 安全连接')
  return i18nT('无法开始录音，你仍可以直接打字')
}

export function useVoiceNote ({ maxSeconds = 90, minSeconds = 1 } = {}) {
  const [supported] = useState(isVoiceNoteSupported)
  const [phase, setPhase] = useState('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [duration, setDuration] = useState(0)

  const recorderRef = useRef(null)
  const rawStreamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const discardRef = useRef(false)
  const blobRef = useRef(null)
  const contentTypeRef = useRef('audio/webm')
  const urlRef = useRef('')
  // 上限/下限放进 ref：定时器与 onstop 是闭包里跑的，直接读 props 会读到旧值。
  const maxRef = useRef(maxSeconds)
  const minRef = useRef(minSeconds)
  maxRef.current = maxSeconds
  minRef.current = minSeconds

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  // 放开麦克风与 WebAudio 上下文。makeBoostedStream 录的是 dest.stream，
  // 但真正占着麦克风的是原始流，两个都要停，否则浏览器一直亮着录音红点。
  const releaseHardware = useCallback(() => {
    stopTracks(rawStreamRef.current)
    rawStreamRef.current = null
    try { audioCtxRef.current?.close?.() } catch { /* best effort */ }
    audioCtxRef.current = null
  }, [])

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      try { URL.revokeObjectURL(urlRef.current) } catch { /* best effort */ }
      urlRef.current = ''
    }
  }, [])

  const runTranscribe = useCallback(async (blob, contentType) => {
    setPhase('transcribing')
    try {
      const data = await transcribeAudioBlob(blob, { contentType })
      const text = (data?.transcript || '').trim()
      setTranscript(text)
      setPhase('ready')
      // 转写为空不是致命错误：音频还在，让用户自己补上文字即可提交。
      setError(text ? '' : i18nT('没听清这段话，请手动补上文字再发送'))
    } catch (err) {
      console.warn('[useVoiceNote] transcribe failed', err)
      setPhase('ready')
      setError(i18nT('语音转文字失败，可以重试或手动补上文字'))
    }
  }, [])

  const cleanupAll = useCallback(() => {
    clearTimer()
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
    } catch { /* best effort */ }
    recorderRef.current = null
    releaseHardware()
    revokeUrl()
  }, [clearTimer, releaseHardware, revokeUrl])

  useEffect(() => cleanupAll, [cleanupAll])

  const start = useCallback(async () => {
    if (phase === 'recording' || phase === 'transcribing') return false
    if (!supported) {
      setError(i18nT('这个浏览器不支持录音，你仍可以直接打字'))
      setPhase('error')
      return false
    }
    setError('')
    setTranscript('')
    setDuration(0)
    setSeconds(0)
    revokeUrl()
    setAudioUrl('')
    blobRef.current = null
    chunksRef.current = []
    discardRef.current = false

    let rawStream
    try {
      rawStream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS })
    } catch (err) {
      setError(micErrorMessage(err))
      setPhase('error')
      return false
    }
    rawStreamRef.current = rawStream

    const { stream: boosted, ctx } = makeBoostedStream(rawStream)
    audioCtxRef.current = ctx
    const mime = pickMimeType()
    let recorder
    try {
      recorder = mime ? new MediaRecorder(boosted, { mimeType: mime }) : new MediaRecorder(boosted)
    } catch (mimeErr) {
      // 某些浏览器声称支持某容器但构造时仍然抛错，退回让浏览器自选容器。
      console.warn('[useVoiceNote] mimeType rejected, falling back', mimeErr)
      try { recorder = new MediaRecorder(boosted) } catch (err2) {
        console.warn('[useVoiceNote] MediaRecorder unavailable', err2)
        releaseHardware()
        setError(i18nT('这个浏览器不支持录音，你仍可以直接打字'))
        setPhase('error')
        return false
      }
    }
    const contentType = contentTypeFor(recorder.mimeType || mime)
    contentTypeRef.current = contentType

    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      clearTimer()
      const elapsedMs = Date.now() - startedAtRef.current
      releaseHardware()
      recorderRef.current = null
      const chunks = chunksRef.current
      chunksRef.current = []
      setSeconds(0)

      if (discardRef.current) { setPhase('idle'); return }

      const blob = new Blob(chunks, { type: recorder.mimeType || contentType })
      if (!blob.size || elapsedMs < minRef.current * 1000) {
        setError(minRef.current > 1
          ? i18nT('录得太短了，至少要说满 {n} 秒', { n: minRef.current })
          : i18nT('录得太短了，请说完一句话再停止'))
        setPhase('error')
        return
      }
      blobRef.current = blob
      const url = URL.createObjectURL(blob)
      revokeUrl()
      urlRef.current = url
      setAudioUrl(url)
      setDuration(Math.round(elapsedMs / 1000))
      await runTranscribe(blob, contentType)
    }

    recorderRef.current = recorder
    try {
      recorder.start()
    } catch (err) {
      console.warn('[useVoiceNote] recorder.start failed', err)
      releaseHardware()
      recorderRef.current = null
      setError(i18nT('无法开始录音，你仍可以直接打字'))
      setPhase('error')
      return false
    }
    startedAtRef.current = Date.now()
    setPhase('recording')
    // 用「开始时刻」算秒数而不是累加计数：标签页被挂起时计时器会漏拍，
    // 而 onstop 是按真实时长判断的，两边必须用同一个时间基准。
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setSeconds(Math.min(elapsed, maxRef.current))
      // 到上限自动收工：语音便条是短消息，不给用户录出一段没人听的长录音。
      if (elapsed >= maxRef.current) {
        try { recorderRef.current?.stop?.() } catch { /* best effort */ }
      }
    }, 250)
    return true
  }, [clearTimer, phase, releaseHardware, revokeUrl, runTranscribe, supported])

  const stop = useCallback(() => {
    discardRef.current = false
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop() } catch { /* onstop 不会来了，兜底收摊 */ clearTimer(); releaseHardware(); setPhase('idle') }
    }
  }, [clearTimer, releaseHardware])

  const cancel = useCallback(() => {
    discardRef.current = true
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); return } catch { /* 落到下面统一收摊 */ }
    }
    clearTimer()
    releaseHardware()
    recorderRef.current = null
    revokeUrl()
    setAudioUrl('')
    blobRef.current = null
    setTranscript('')
    setSeconds(0)
    setDuration(0)
    setError('')
    setPhase('idle')
  }, [clearTimer, releaseHardware, revokeUrl])

  const reset = useCallback(() => {
    discardRef.current = true
    cancel()
  }, [cancel])

  const retryTranscribe = useCallback(() => {
    const blob = blobRef.current
    if (!blob) return
    runTranscribe(blob, contentTypeRef.current)
  }, [runTranscribe])

  return {
    supported,
    phase,
    seconds,
    duration,
    error,
    transcript,
    setTranscript,
    audioUrl,
    maxSeconds,
    minSeconds,
    start,
    stop,
    cancel,
    reset,
    retryTranscribe,
  }
}

export default useVoiceNote
