import { t as i18nT } from './i18n/runtime'
/** AITutorChatPage — AI 属灵导师对话 (B10)。危机优先安全门;记忆接地;工具非牧者。 */
import { useEffect, useState, useRef, useCallback } from 'react'
import BackButton from './BackButton'
import { COOKIE_SESSION_SENTINEL, tutorApi } from './api'
import * as authModule from './auth'
import { speakOnce, stopAllAudio } from './useGlobalAudio'
import { useMediaPrefs } from './lib/media/useMediaPrefs'
import { CardActions } from './lib/media/CardActions'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(139,92,246,0.6))' }
const ghost = { cursor: 'pointer', borderRadius: 10, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', background: 'transparent', fontSize: 12 }

function readCachedUserFallback() {
  try {
    const raw = localStorage.getItem('bible-sphere-user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readOptionalExport(ns, exportName) {
  return ns && exportName in ns ? ns[exportName] : undefined
}

function resolveSessionContext(userProp) {
  const getTokenFn = readOptionalExport(authModule, 'getToken')
  const token = (typeof getTokenFn === 'function' ? getTokenFn() : '') || ''
  const sentinel = COOKIE_SESSION_SENTINEL || 'cookie-session'
  if (token && token !== sentinel) {
    return { isAuthenticated: true, token }
  }
  const getCurrentUserFn = readOptionalExport(authModule, 'getCurrentUser')
  const getCachedUserFn = readOptionalExport(authModule, 'getCachedUser')
  const isAuthenticatedFn = readOptionalExport(authModule, 'isAuthenticated')
  const hasRealTokenFn = readOptionalExport(authModule, 'hasRealToken')

  const currentUser = userProp
    || (typeof getCurrentUserFn === 'function' ? getCurrentUserFn() : null)
    || (typeof getCachedUserFn === 'function' ? getCachedUserFn() : null)
    || readCachedUserFallback()
  const authenticated = Boolean(
    (typeof isAuthenticatedFn === 'function' && isAuthenticatedFn())
      || (typeof hasRealTokenFn === 'function' && hasRealTokenFn())
      || currentUser,
  )
  return {
    isAuthenticated: authenticated,
    token: authenticated ? (token || sentinel) : '',
  }
}

function AnswerActions({ answer, question, soundOn }) {
  const [speaking, setSpeaking] = useState(false)

  const readAloud = useCallback(async () => {
    if (speaking) { stopAllAudio(); setSpeaking(false); return }
    const text = String(answer || '').trim()
    if (!text) return
    setSpeaking(true)
    try { await speakOnce(text, { rate: 0.92 }) } finally { setSpeaking(false) }
  }, [answer, speaking])

  const buildSpec = useCallback(() => {
    const paras = String(answer || '').split(/\n+/).map((s) => s.trim()).filter(Boolean)
    return {
      badge: i18nT('属灵导师对话 · 摘录'),
      title: String(question || '').slice(0, 40) || i18nT('一段解释'),
      sections: [{ heading: i18nT('导师这样说'), items: paras.slice(0, 6), emphasis: true }],
      footer: i18nT('这是 AI 的整理,不是牧者的判断。带着它去问一个真实的人。'),
    }
  }, [answer, question])

  return (
    <div style={{ marginTop: 6 }}>
      {soundOn && (
        <button type="button" style={{ ...ghost, padding: '4px 9px', fontSize: 11.5 }} onClick={readAloud}>
          {speaking ? `⏹ ${i18nT('停止朗读')}` : `🔊 ${i18nT('念给我听')}`}
        </button>
      )}
      <CardActions buildSpec={buildSpec} filename="tutor-answer-card.png" label="把这个解释做成一张卡" templates={['calm', 'ink', 'olive']} />
    </div>
  )
}

export default function AITutorChatPage({ user, onBack, onOpenCrisis }) {
  const [threads, setThreads] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [failedDraft, setFailedDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [crisis, setCrisis] = useState(null)
  const busyRef = useRef(false)
  const endRef = useRef(null)
  const { prefs } = useMediaPrefs()

  const openThread = useCallback(async (id, threadMeta = null, knownThreads = null) => {
    const session = resolveSessionContext(user)
    if (!session.isAuthenticated) return
    setActive(id)
    setError('')
    setCrisis(null)
    try {
      const d = await tutorApi.thread(id, session.token)
      const loadedMessages = Array.isArray(d?.messages) ? d.messages : []
      setMessages(loadedMessages)
      const list = knownThreads || threads
      const matchedThread = threadMeta || d?.thread || list.find((th) => th.id === id)
      const isHighRisk = matchedThread?.risk_level === 'high' || d?.risk_level === 'high'
      const hasSafetyMsg = loadedMessages.some((m) => m?.message_type === 'safety')
      if (isHighRisk || hasSafetyMsg) {
        setCrisis(d?.route || { triggered: true })
      }
    } catch (e) {
      setError(e?.message || i18nT('加载对话失败，请稍后重试'))
    }
  }, [threads, user])

  const loadThreads = useCallback(async () => {
    const session = resolveSessionContext(user)
    if (!session.isAuthenticated) return
    try {
      const d = await tutorApi.threads(session.token)
      const list = Array.isArray(d?.threads) ? d.threads : []
      setThreads(list)
      if (!active && list.length > 0) {
        await openThread(list[0].id, list[0], list)
      }
    } catch (e) {
      setError(e?.message || i18nT('加载对话列表失败'))
    }
  }, [active, openThread, user])

  useEffect(() => {
    void loadThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => () => stopAllAudio(), [])
  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: 'smooth' }) }, [messages])

  async function newThread() {
    const session = resolveSessionContext(user)
    if (!session.isAuthenticated) {
      setError(i18nT('请先登录后再开启属灵导师对话'))
      return
    }
    try {
      const d = await tutorApi.createThread({ title: i18nT('新的对话') }, session.token)
      setActive(d.id)
      setMessages([])
      setCrisis(null)
      setFailedDraft('')
      setError('')
      const listRes = await tutorApi.threads(session.token)
      setThreads(Array.isArray(listRes?.threads) ? listRes.threads : [])
    } catch (e) {
      setError(e?.message || i18nT('创建对话失败'))
    }
  }

  async function sendText(rawText) {
    const text = String(rawText ?? input).trim()
    if (!text || busy || busyRef.current) return
    const session = resolveSessionContext(user)
    if (!session.isAuthenticated) {
      setError(i18nT('请先登录后再发送消息'))
      return
    }

    busyRef.current = true
    setBusy(true)
    setError('')
    setFailedDraft('')

    const tempUserId = `u_${Date.now()}`
    setMessages((m) => [...m, { id: tempUserId, role: 'user', content: text, message_type: 'chat' }])
    setInput('')

    try {
      let tid = active
      if (!tid) {
        const c = await tutorApi.createThread({ title: text.slice(0, 20) }, session.token)
        tid = c.id
        setActive(tid)
        tutorApi.threads(session.token).then((res) => {
          if (Array.isArray(res?.threads)) setThreads(res.threads)
        }).catch(() => {})
      }
      const d = await tutorApi.send(tid, { content: text }, session.token)
      setMessages((m) => [
        ...m,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: d.reply,
          message_type: d.crisis ? 'safety' : 'chat',
          used_memory: d.used_memory,
          route_module: d.route ? d.route.module : '',
        },
      ])
      if (d.crisis) {
        setCrisis(d.route || { triggered: true })
      }
    } catch (e) {
      setMessages((m) => m.filter((item) => item.id !== tempUserId))
      setInput((prev) => prev || text)
      setFailedDraft(text)
      setError(e?.message || i18nT('发送失败，你的内容已保留，请重试。'))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🕊️ 属灵导师对话')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>{i18nT('AI 是陪伴的工具,不能替代圣灵、牧者或辅导师 · 危机会优先引导你寻求真实的人')}</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button type="button" style={btn} onClick={newThread}>{i18nT('＋ 新对话')}</button>
        {threads.map(th => (
          <button type="button" key={th.id} style={{ ...ghost, ...(th.id === active ? { borderColor: 'rgba(125,211,252,0.7)', color: '#fff' } : {}) }} onClick={() => openThread(th.id, th)}>
            {th.title || i18nT('对话')}{th.risk_level === 'high' ? ' ⚠️' : ''}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" data-testid="ai-tutor-error-banner" style={{ ...card, color: '#ffb4b4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span>{error}</span>
          {(failedDraft || input.trim()) && (
            <button
              type="button"
              data-testid="ai-tutor-retry-send-btn"
              disabled={busy}
              onClick={() => void sendText(input.trim() || failedDraft)}
              style={{ ...ghost, color: '#fff', borderColor: 'rgba(255,180,180,0.5)', flexShrink: 0 }}
            >
              {i18nT('重试发送')}
            </button>
          )}
        </div>
      )}
      {crisis && (
        <div role="alert" data-testid="ai-tutor-crisis-banner" style={{ ...card, borderColor: 'rgba(255,120,120,0.5)', background: 'rgba(255,80,80,0.08)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{i18nT('需要的是真实的人,不是 AI')}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{i18nT('请前往「关怀与危机」入口,或联系信任的牧者 / 专业辅导。若有立即危险,请联系当地紧急服务。')}</div>
          {onOpenCrisis && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                data-testid="ai-tutor-open-crisis-btn"
                onClick={onOpenCrisis}
                style={{ ...btn, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {i18nT('前往「关怀与危机」中心')}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ ...card, minHeight: 240, maxHeight: 420, overflowY: 'auto' }}>
        {messages.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{i18nT('把你心里真实的处境说出来吧。例如:「我最近祷告很枯干,该怎么办?」')}</div>}
        {messages.map((m, mi) => (
          <div key={m.id} style={{ marginBottom: 12, textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <div style={{ display: 'inline-block', maxWidth: '88%', textAlign: 'left', borderRadius: 12, padding: '8px 12px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7,
              background: m.role === 'user' ? 'rgba(125,211,252,0.16)' : (m.message_type === 'safety' ? 'rgba(255,80,80,0.12)' : 'rgba(255,255,255,0.06)'),
              border: m.message_type === 'safety' ? '1px solid rgba(255,120,120,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
              {m.content}
            </div>
            {m.role === 'assistant' && m.used_memory ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{i18nT('· 参考了你的记忆库')}</div> : null}
            {m.role === 'assistant' && m.message_type !== 'safety' && m.content ? (
              <AnswerActions
                answer={m.content}
                question={[...messages].slice(0, mi).reverse().find((x) => x.role === 'user')?.content || ''}
                soundOn={prefs.sound}
              />
            ) : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} placeholder={i18nT('说点什么…')}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void sendText() }}
          style={{ flex: 1, resize: 'none', borderRadius: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14 }} aria-label={i18nT('说点什么…')}/>
        <button type="button" style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void sendText()}>{busy ? '…' : i18nT('发送')}</button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{i18nT('⌘/Ctrl + Enter 发送 · 记忆共享可在「属灵记忆库」开关')}</div>
    </div>
  )
}
