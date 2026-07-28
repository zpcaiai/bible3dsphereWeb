// useRecitation — 「跟我读 → 我复诵 → 打分」的录音闭环。
//
// 录音走 MediaRecorder（复用 recorderUtils 的增益链，轻声也能识别），
// 识别走后端 Deepgram（/api/speech/transcribe），比对走 recitationScore。
import { useCallback, useRef, useState, useEffect } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { transcribeAudioBlob } from '../../api'
import { pickMimeType, contentTypeFor, makeBoostedStream, AUDIO_CONSTRAINTS } from '../../hooks/recorderUtils'
import { scoreRecitation } from './recitationScore'

export function useRecitation({ maxSeconds = 90 } = {}) {
  const [phase, setPhase] = useState('idle') // idle | recording | scoring | done | error
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const ctxRef = useRef(null)
  const timerRef = useRef(null)
  const targetRef = useRef('')

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
    try { streamRef.current?.getTracks?.().forEach((tr) => tr.stop()) } catch { /* ignore */ }
    streamRef.current = null
    try { ctxRef.current?.close?.() } catch { /* ignore */ }
    ctxRef.current = null
    recorderRef.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const reset = useCallback(() => {
    setPhase('idle'); setSeconds(0); setResult(null); setError('')
  }, [])

  const stop = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') {
      try { rec.stop() } catch { setPhase('error') }
    }
  }, [])

  const start = useCallback(async (targetText) => {
    if (phase === 'recording') return false
    setError(''); setResult(null); setSeconds(0)
    targetRef.current = String(targetText || '')
    chunksRef.current = []

    if (typeof MediaRecorder === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setError(i18nT('当前浏览器不支持录音，换 Chrome / Safari / Edge 再试')); setPhase('error'); return false
    }
    try {
      const raw = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS })
      streamRef.current = raw
      const { stream, ctx } = makeBoostedStream(raw)
      ctxRef.current = ctx
      const mime = pickMimeType()
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      const ct = contentTypeFor(rec.mimeType || mime)

      rec.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        cleanup()
        setPhase('scoring')
        const blob = new Blob(chunksRef.current, { type: ct })
        chunksRef.current = []
        if (!blob.size) { setError(i18nT('没有录到声音，再试一次')); setPhase('error'); return }
        try {
          const data = await transcribeAudioBlob(blob, { contentType: ct })
          const spoken = (data?.transcript || '').trim()
          if (!spoken) { setError(i18nT('没听清，靠近一点再复诵一次')); setPhase('error'); return }
          setResult({ ...scoreRecitation(targetRef.current, spoken), spokenText: spoken })
          setPhase('done')
        } catch (err) {
          setError(i18nT(err?.message || '识别失败，检查一下网络'))
          setPhase('error')
        }
      }

      recorderRef.current = rec
      rec.start()
      setPhase('recording')
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= maxSeconds) { stop(); return maxSeconds }
          return s + 1
        })
      }, 1000)
      return true
    } catch (err) {
      cleanup()
      setError(i18nT(err?.name === 'NotAllowedError' ? '麦克风权限被拒绝，请在浏览器设置里允许' : '无法访问麦克风'))
      setPhase('error')
      return false
    }
  }, [phase, maxSeconds, cleanup, stop])

  return { phase, seconds, result, error, start, stop, reset, recording: phase === 'recording' }
}

export default useRecitation
