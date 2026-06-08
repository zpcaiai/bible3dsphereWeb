import { useEffect, useRef, useState } from 'react'
import { useGuardianStore } from './guardianStore'
import { useGuardianVoice } from './useGuardianVoice'
import { C, S } from './guardianStyles'
import './guardian.css'
import { t } from '../../i18n/runtime'

const MODES = [
  { key: 'companion', label: t("陪伴") },
  { key: 'comfort', label: t("安慰") },
  { key: 'prayer', label: t("祷告") },
  { key: 'devotion', label: t("灵修") },
  { key: 'reflection', label: t("反思") },
  { key: 'idol-monitor', label: t("觉察") },
  { key: 'growth', label: t("成长") },
]

export default function GuardianChatPanel() {
  const { messages, sending, chatMode, setChatMode, sendMessage, setSpriteState } = useGuardianStore()
  const [input, setInput] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(false)   // 🔊 自动朗读回复
  const [callMode, setCallMode] = useState(false)      // 📞 连续语音对话
  const bottomRef = useRef(null)
  const lastSpokenRef = useRef(null)
  const callModeRef = useRef(false)
  callModeRef.current = callMode

  const voice = useGuardianVoice({
    onTranscript: (text) => {
      const t = (text || '').trim()
      if (!t) return
      if (callModeRef.current) {
        sendMessage(t)                       // 对话模式：识别后直接发送
      } else {
        setInput((i) => (i ? `${i} ${t}` : t))  // 普通模式：填入输入框
      }
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  // 新的守护者回复 → 自动朗读；对话模式下读完自动开麦，形成对话循环
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return
    if (lastSpokenRef.current === last.id) return
    if (!autoSpeak && !callMode) return
    lastSpokenRef.current = last.id
    setSpriteState('comforting')
    voice.speak(last.content, {
      onEnd: () => {
        setSpriteState('idle')
        if (callModeRef.current && !voice.isRecording) {
          setSpriteState('listening')
          voice.startRecording()
        }
      },
    })
  }, [messages, autoSpeak, callMode])  // eslint-disable-line react-hooks/exhaustive-deps

  // 微信式按住说话：按下开麦、松开发送（对话模式由 📞 控制，长按无效）
  const startMicHold = () => {
    if (callMode) return
    voice.stopSpeaking()
    setSpriteState('listening')
    voice.startRecording()
  }
  const endMicHold = () => {
    if (callMode) return
    if (voice.isRecording) {
      voice.stopRecording()
      setSpriteState('idle')
    }
  }

  const toggleCallMode = () => {
    if (callMode) {
      setCallMode(false)
      voice.stopSpeaking()
      if (voice.isRecording) voice.stopRecording()
      setSpriteState('idle')
    } else {
      setCallMode(true)
      setAutoSpeak(true)
      setSpriteState('listening')
      voice.startRecording()
    }
  }

  const submit = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  const iconBtn = (active) => ({
    border: 'none', cursor: 'pointer', borderRadius: 10,
    padding: '8px 10px', fontSize: 15, lineHeight: 1,
    background: active ? 'rgba(255,179,71,0.25)' : 'rgba(42,51,88,0.45)',
    color: active ? C.flame : C.dim,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '4px 12px 8px' }}>
        {MODES.map((m) => (
          <button key={m.key} type="button" style={S.chip(chatMode === m.key)}
            onClick={() => setChatMode(m.key)}>{m.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex',
        flexDirection: 'column', gap: 10 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6,
              padding: '8px 12px', borderRadius: 16,
              borderBottomRightRadius: m.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
              background: m.role === 'user' ? 'rgba(255,179,71,0.92)' : 'rgba(42,51,88,0.5)',
              color: m.role === 'user' ? '#1a1200' : C.text,
            }}>{m.content}</div>
          </div>
        ))}
        {sending && (
          <div style={{ fontSize: 13, color: C.dim, padding: '4px 2px' }}>{t("守护者正在轻轻回应…")}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 语音状态提示 */}
      {(voice.isRecording || voice.recordingError || callMode) && (
        <div style={{ padding: '0 14px 4px', fontSize: 11.5,
          color: voice.isRecording ? '#ff8a8a' : C.dim,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          {voice.isRecording && <span className="guardian-rec-dot" />}
          {voice.isRecording
            ? `正在聆听… ${voice.recordingSeconds}s（松开发送）`
            : voice.recordingError || (callMode ? t("对话模式开启：说完会自动回复并继续听你说") : '')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end',
        borderTop: `1px solid ${C.lineSoft}`, padding: 12 }}>
        {/* 🎤 单次语音输入 */}
        <button type="button"
          onMouseDown={startMicHold}
          onMouseUp={endMicHold}
          onMouseLeave={endMicHold}
          onTouchStart={(e) => { e.preventDefault(); startMicHold() }}
          onTouchEnd={(e) => { e.preventDefault(); endMicHold() }}
          title={voice.isRecording ? t("松开发送") : t("按住说话")}
          style={iconBtn(voice.isRecording)}
          className={voice.isRecording ? 'guardian-rec-pulse' : ''}>
          🎤
        </button>
        {/* 📞 连续语音对话 */}
        <button type="button" onClick={toggleCallMode}
          title={callMode ? t("结束语音对话") : t("开始语音对话（自动朗读+自动聆听）")}
          style={iconBtn(callMode)}>
          {callMode ? '🔴' : '📞'}
        </button>
        {/* 🔊 朗读回复 */}
        <button type="button"
          onClick={() => {
            if (autoSpeak) { setAutoSpeak(false); voice.stopSpeaking() }
            else setAutoSpeak(true)
          }}
          title={autoSpeak ? t("关闭自动朗读") : t("自动朗读守护者的回复")}
          style={iconBtn(autoSpeak || voice.speaking)}>
          {autoSpeak ? '🔊' : '🔇'}
        </button>

        <textarea
          value={input} rows={1} placeholder={callMode ? t("对话模式中，也可以打字…") : t("说说你现在的感受…")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          style={{ ...S.input, flex: 1, maxHeight: 96 }}
        />
        <button type="button" onClick={submit} disabled={sending || !input.trim()}
          style={{ ...S.primaryBtn, opacity: sending || !input.trim() ? 0.4 : 1 }}>
          {t("发送")}
        </button>
      </div>
    </div>
  )
}
