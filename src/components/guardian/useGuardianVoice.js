// 守护者语音能力：STT（复用全站 useSpeechInput/后端转写）+ TTS（后端高质量 Neural 优先，浏览器原生兜底）
// 支持「对话模式」：守护者说完后自动开麦，形成连续语音对话循环。
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpeechInput } from '../../hooks/useSpeechInput'
import { pickVoiceFor, speechLangFor, ttsServerParamsFor } from '../../voice'
import { fetchTTS } from '../../api'

// 与 App.jsx 同一偏好序列：温柔的中文女声
const PREFERRED_VOICES = [
  'Tingting', '婷婷', 'Microsoft Xiaoxiao', 'Microsoft Yaoyao',
  'Microsoft Zhiyu', 'Ting-Ting', 'Google 普通话', 'Google 國語',
]

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || []
  for (const name of PREFERRED_VOICES) {
    const v = voices.find((x) => x.name?.includes(name) || x.voiceURI?.includes(name))
    if (v) return v
  }
  return (
    voices.find((v) => v.lang?.startsWith('zh') && (v.name.includes('Female') || v.name.includes('女'))) ||
    voices.find((v) => v.lang?.startsWith('zh')) ||
    voices[0] || null
  )
}

/** 朗读前清理：去 emoji / 括号符号 / markdown 残留，保留语句本身 */
export function cleanForSpeech(text) {
  return (text || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/[（）()【】「」*#`]/g, '')
    .replace(/\n+/g, '。')
    .replace(/。+/g, '。')
    .trim()
}

export function useGuardianVoice({ onTranscript } = {}) {
  const [speaking, setSpeaking] = useState(false)
  const onSpeechEndRef = useRef(null)
  const audioRef = useRef(null)   // 后端 TTS 的 <audio> 元素
  const genRef = useRef(0)        // 每次 speak() 自增，作废上一段在途请求

  const speech = useSpeechInput({
    onTranscript: (t) => onTranscript?.(t),
  })

  // 部分浏览器 voices 异步加载
  useEffect(() => {
    window.speechSynthesis?.getVoices?.()
  }, [])

  const stopSpeaking = useCallback(() => {
    genRef.current += 1                 // 作废在途的后端请求
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null }
    } catch { /* noop */ }
    try { window.speechSynthesis?.cancel() } catch { /* noop */ }
    setSpeaking(false)
    onSpeechEndRef.current = null
  }, [])

  const speak = useCallback((text, { onEnd } = {}) => {
    const cleaned = cleanForSpeech(text)
    if (!cleaned) { onEnd?.(); return }

    // 先停掉当前正在播放的（原生 + 后端音频）
    try { window.speechSynthesis?.cancel() } catch { /* noop */ }
    if (audioRef.current) { try { audioRef.current.pause() } catch { /* noop */ } audioRef.current = null }

    onSpeechEndRef.current = onEnd || null
    const myGen = ++genRef.current
    setSpeaking(true)

    const finish = () => {
      if (genRef.current !== myGen) return   // 已被新的 speak()/stop 取代
      setSpeaking(false)
      const cb = onSpeechEndRef.current
      onSpeechEndRef.current = null
      cb?.()                                 // 对话模式：说完自动开麦
    }

    // 浏览器原生兜底（后端不可用时）
    const nativeSpeak = () => {
      const synth = window.speechSynthesis
      if (!synth) { finish(); return }
      synth.cancel()
      const utter = new SpeechSynthesisUtterance(cleaned)
      const voice = pickVoiceFor(cleaned) || pickVoice()
      if (voice) utter.voice = voice
      utter.lang = speechLangFor(cleaned) || voice?.lang || 'zh-CN'
      utter.rate = 0.95   // 慢一点，温柔陪伴的节奏
      utter.pitch = 1.05
      utter.onend = finish
      utter.onerror = finish
      synth.speak(utter)
    }

    // 优先后端高质量 TTS（ElevenLabs/Edge Neural），失败回退浏览器原生
    const [langCode, voiceName] = ttsServerParamsFor(cleaned)
    fetchTTS(cleaned, langCode, voiceName)
      .then((blob) => {
        if (genRef.current !== myGen) return  // 已被取代/停止
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          if (audioRef.current === audio) audioRef.current = null
          try { URL.revokeObjectURL(url) } catch { /* noop */ }
          finish()
        }
        audio.onerror = () => {
          if (audioRef.current === audio) audioRef.current = null
          finish()
        }
        audio.play().catch(() => { audioRef.current = null; nativeSpeak() })
      })
      .catch(() => { if (genRef.current === myGen) nativeSpeak() })
  }, [])

  useEffect(() => stopSpeaking, [stopSpeaking])  // 卸载时停止朗读

  return {
    // STT
    isRecording: speech.isRecording,
    recordingSeconds: speech.recordingSeconds,
    recordingError: speech.recordingError,
    speechPhase: speech.speechPhase,
    isTranscribing: speech.isTranscribing,
    maxRecordingSeconds: speech.maxRecordingSeconds,
    startRecording: speech.startRecording,
    stopRecording: speech.stopRecording,
    cancelRecording: speech.cancelRecording,
    // TTS
    speaking,
    speak,
    stopSpeaking,
  }
}
