import { useEffect, useRef, useState } from 'react'
import { useGuardianStore } from './guardianStore'
import { C, S } from './guardianStyles'

const MODES = [
  { key: 'companion', label: '陪伴' },
  { key: 'comfort', label: '安慰' },
  { key: 'prayer', label: '祷告' },
  { key: 'devotion', label: '灵修' },
  { key: 'reflection', label: '反思' },
  { key: 'idol-monitor', label: '觉察' },
  { key: 'growth', label: '成长' },
]

export default function GuardianChatPanel() {
  const { messages, sending, chatMode, setChatMode, sendMessage } = useGuardianStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  const submit = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

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
          <div style={{ fontSize: 13, color: C.dim, padding: '4px 2px' }}>守护者正在轻轻回应…</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end',
        borderTop: `1px solid ${C.lineSoft}`, padding: 12 }}>
        <textarea
          value={input} rows={1} placeholder="说说你现在的感受…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          style={{ ...S.input, flex: 1, maxHeight: 96 }}
        />
        <button type="button" onClick={submit} disabled={sending || !input.trim()}
          style={{ ...S.primaryBtn, opacity: sending || !input.trim() ? 0.4 : 1 }}>
          发送
        </button>
      </div>
    </div>
  )
}
