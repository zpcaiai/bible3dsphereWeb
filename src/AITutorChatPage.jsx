import { t as i18nT } from './i18n/runtime'
/** AITutorChatPage — AI 属灵导师对话 (B10)。危机优先安全门;记忆接地;工具非牧者。 */
import { useEffect, useState, useRef } from 'react'
import BackButton from './BackButton'
import { tutorApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(139,92,246,0.6))' }
const ghost = { cursor: 'pointer', borderRadius: 10, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', background: 'transparent', fontSize: 12 }

export default function AITutorChatPage({ user, onBack }) {
  const [threads, setThreads] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [crisis, setCrisis] = useState(null)
  const endRef = useRef(null)

  useEffect(() => { loadThreads() }, [])
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadThreads() {
    const t = getToken(); if (!t) return
    try {
      const d = await tutorApi.threads(t)
      setThreads(d.threads || [])
      if (!active && d.threads && d.threads.length) openThread(d.threads[0].id)
    } catch (e) { setError(e.message) }
  }
  async function openThread(id) {
    const t = getToken(); if (!t) return
    setActive(id); setCrisis(null)
    try { const d = await tutorApi.thread(id, t); setMessages(d.messages || []) }
    catch (e) { setError(e.message) }
  }
  async function newThread() {
    const t = getToken(); if (!t) return
    try { const d = await tutorApi.createThread({ title: '新的对话' }, t); setActive(d.id); setMessages([]); loadThreads() }
    catch (e) { setError(e.message) }
  }
  async function send() {
    const text = input.trim(); if (!text || busy) return
    const t = getToken(); if (!t) return
    setBusy(true); setError(''); setCrisis(null)
    setMessages(m => [...m, { id: 'u' + Date.now(), role: 'user', content: text, message_type: 'chat' }])
    setInput('')
    try {
      let tid = active
      if (!tid) { const c = await tutorApi.createThread({ title: text.slice(0, 20) }, t); tid = c.id; setActive(tid); loadThreads() }
      const d = await tutorApi.send(tid, { content: text }, t)
      setMessages(m => [...m, { id: 'a' + Date.now(), role: 'assistant', content: d.reply, message_type: d.crisis ? 'safety' : 'chat', used_memory: d.used_memory, route_module: d.route ? d.route.module : '' }])
      if (d.crisis) setCrisis(d.route || { endpoint: '/api/crisis' })
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🕊️ 属灵导师对话')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>{i18nT('AI 是陪伴的工具,不能替代圣灵、牧者或辅导师 · 危机会优先引导你寻求真实的人')}</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button style={btn} onClick={newThread}>{i18nT('＋ 新对话')}</button>
        {threads.map(th => (
          <button key={th.id} style={{ ...ghost, ...(th.id === active ? { borderColor: 'rgba(125,211,252,0.7)', color: '#fff' } : {}) }} onClick={() => openThread(th.id)}>
            {th.title || '对话'}{th.risk_level === 'high' ? ' ⚠️' : ''}
          </button>
        ))}
      </div>

      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}
      {crisis && (
        <div style={{ ...card, borderColor: 'rgba(255,120,120,0.5)', background: 'rgba(255,80,80,0.08)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{i18nT('需要的是真实的人,不是 AI')}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{i18nT('请前往「关怀与危机」入口,或联系信任的牧者 / 专业辅导。若有立即危险,请联系当地紧急服务。')}</div>
        </div>
      )}

      <div style={{ ...card, minHeight: 240, maxHeight: 420, overflowY: 'auto' }}>
        {messages.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{i18nT('把你心里真实的处境说出来吧。例如:「我最近祷告很枯干,该怎么办?」')}</div>}
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 12, textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <div style={{ display: 'inline-block', maxWidth: '88%', textAlign: 'left', borderRadius: 12, padding: '8px 12px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7,
              background: m.role === 'user' ? 'rgba(125,211,252,0.16)' : (m.message_type === 'safety' ? 'rgba(255,80,80,0.12)' : 'rgba(255,255,255,0.06)'),
              border: m.message_type === 'safety' ? '1px solid rgba(255,120,120,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
              {m.content}
            </div>
            {m.role === 'assistant' && m.used_memory ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{i18nT('· 参考了你的记忆库')}</div> : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} placeholder={i18nT('说点什么…')}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }}
          style={{ flex: 1, resize: 'none', borderRadius: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14 }} />
        <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={send}>{busy ? '…' : '发送'}</button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{i18nT('⌘/Ctrl + Enter 发送 · 记忆共享可在「属灵记忆库」开关')}</div>
    </div>
  )
}
