import { useEffect, useRef, useState } from 'react'
import { useGuardianStore } from './guardianStore'
import { useGuardianVoice } from './useGuardianVoice'
import { C, S } from './guardianStyles'
import './guardian.css'
import { t } from '../../i18n/runtime'
import { AutoText } from '../../autoTranslate.jsx'
import VoiceHoldButton from '../VoiceHoldButton'

const MODES = [
  { key: 'companion', label: t("陪伴") },
  { key: 'comfort', label: t("安慰") },
  { key: 'prayer', label: t("祷告") },
  { key: 'devotion', label: t("灵修") },
  { key: 'reflection', label: t("反思") },
  { key: 'idol-monitor', label: t("觉察") },
  { key: 'growth', label: t("成长") },
]

const PASTORAL_PROMPTS = [
  {
    key: 'pray',
    icon: '🙏',
    mode: 'prayer',
    label: '带我祷告',
    prompt: '请带我用一句真实的祷告，把现在的心交给神。',
  },
  {
    key: 'guilt',
    icon: '✝️',
    mode: 'comfort',
    label: '我很自责',
    prompt: '我感到自责和羞愧，请用福音陪我分辨认罪与控告。',
  },
  {
    key: 'weary',
    icon: '🕯️',
    mode: 'comfort',
    label: '我很疲惫',
    prompt: '我很疲惫，不想假装刚强，请陪我回到基督的安息。',
  },
  {
    key: 'waiting',
    icon: '🧭',
    mode: 'reflection',
    label: '我在等候',
    prompt: '我正在等候一件事，请帮助我分辨信靠与掌控。',
  },
  {
    key: 'help',
    icon: '🛟',
    mode: 'companion',
    label: '我需要帮助',
    prompt: '我现在不太安全，请先帮助我找到真实的人和安全下一步。',
  },
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
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
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

  const applyPastoralPrompt = (item) => {
    setChatMode(item.mode)
    setInput(t(item.prompt))
    setSpriteState(item.mode === 'prayer' ? 'praying' : item.mode === 'comfort' ? 'comforting' : 'listening')
  }

  const compactSelect = {
    flex: 1,
    minWidth: 0,
    height: 28,
    border: `1px solid ${C.lineSoft}`,
    borderRadius: 7,
    background: 'rgba(11,16,38,0.72)',
    color: C.text,
    padding: '0 4px',
    fontSize: 10.5,
    fontFamily: 'inherit',
  }

  const iconBtn = (active) => ({
    border: 'none', cursor: 'pointer', borderRadius: 10,
    width: 32, height: 32, flex: '0 0 32px', padding: 0, fontSize: 14, lineHeight: 1,
    background: active ? 'rgba(255,179,71,0.25)' : 'rgba(42,51,88,0.45)',
    color: active ? C.flame : C.dim,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="guardian-chat-shortcuts" style={{ display: 'flex', gap: 4, padding: '4px 6px' }}>
        <select aria-label={t("对话模式")} value={chatMode} onChange={(e) => setChatMode(e.target.value)} style={compactSelect}>
          {MODES.map((mode) => <option key={mode.key} value={mode.key}>{mode.label}</option>)}
        </select>
        <select
          aria-label={t("快速引导")}
          value=""
          onChange={(e) => {
            const item = PASTORAL_PROMPTS.find((prompt) => prompt.key === e.target.value)
            if (item) applyPastoralPrompt(item)
          }}
          style={compactSelect}
        >
          <option value="">{t("快速引导")}</option>
          {PASTORAL_PROMPTS.map((item) => <option key={item.key} value={item.key}>{item.icon} {t(item.label)}</option>)}
        </select>
      </div>

      <div className="guardian-chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex',
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
            }}><AutoText>{m.content}</AutoText></div>
          </div>
        ))}
        {sending && (
          <div style={{ fontSize: 13, color: C.dim, padding: '4px 2px' }}>{t("守护者正在轻轻回应…")}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 语音状态提示 */}
      {(voice.isRecording || voice.isTranscribing || voice.recordingError || callMode) && (
        <div style={{ padding: '0 14px 4px', fontSize: 11.5,
          color: voice.isRecording || voice.recordingError ? '#ff8a8a' : C.dim,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          {voice.isRecording && <span className="guardian-rec-dot" />}
          {voice.isRecording
            ? `${t("正在聆听…")} ${voice.recordingSeconds}s（${t("松开发送")}）`
            : voice.isTranscribing
              ? t("正在转文字…")
              : voice.recordingError || (callMode ? t("对话模式开启：说完会自动回复并继续听你说") : '')}
        </div>
      )}

      <div className="guardian-chat-composer" style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center',
        borderTop: `1px solid ${C.lineSoft}`, padding: 5 }}>
        {/* 🎤 单次语音输入 */}
        <VoiceHoldButton
          speech={voice}
          variant="guardian"
          showOverlay
          style={{ minWidth: 0, height: 40, flex: '1 1 170px', borderRadius: 20 }}
          disabled={callMode || voice.isTranscribing || sending}
          onHoldStart={() => {
            voice.stopSpeaking()
            setSpriteState('listening')
          }}
          onHoldEnd={() => setSpriteState('idle')}
          onHoldCancel={() => setSpriteState('idle')}
        />
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
          style={{ ...S.input, flex: 1, padding: '4px 12px', lineHeight: 1.3,
            flexBasis: '100%', order: -1, minHeight: 30, fontSize: 12, maxHeight: 42 }}
         aria-label={callMode ? t("对话模式中，也可以打字…") : t("说说你现在的感受…")}/>
        <button type="button" onClick={submit} disabled={sending || !input.trim()}
          style={{ ...S.primaryBtn, width: 43, height: 32, padding: 0, borderRadius: 8,
            fontSize: 11, opacity: sending || !input.trim() ? 0.4 : 1 }}>
          {t("发送")}
        </button>
      </div>
    </div>
  )
}
