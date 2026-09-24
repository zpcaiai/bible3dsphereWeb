import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDigitalHumanLiveKitToken, createDigitalHumanTurn, getDigitalHumanCatalog, getDigitalHumanRuntime, recordDigitalHumanProviderTelemetry, resolveDigitalHumanIdentity } from './api'
import { validateCharacterProfile, validateDigitalHumanResponse } from './contracts'
import { DIGITAL_HUMAN_STATES } from './DigitalHumanAdapter'
import { LiveKitRealtimeSession, REALTIME_STATES } from './LiveKitRealtimeSession'
import { MetaPersonLiveSpeakAdapter } from './MetaPersonLiveSpeakAdapter'
import { SHARED_PREVIEW_PORTRAIT_URL, speakSharedPreviewDisclosure } from './previewAssets'
import DigitalHumanOperationsPanel from './DigitalHumanOperationsPanel'
import './digitalHuman.css'

const UI_STATES = Object.freeze({
  IDLE: 'IDLE', LISTENING: 'LISTENING', TRANSCRIBING: 'TRANSCRIBING', RETRIEVING: 'RETRIEVING',
  VERIFYING: 'VERIFYING', READY_TO_SPEAK: 'READY_TO_SPEAK', SPEAKING: 'SPEAKING', ERROR: 'ERROR',
})

const STATE_LABELS = {
  IDLE: '可以提问', LISTENING: '正在聆听', TRANSCRIBING: '正在确认语音', RETRIEVING: '正在查找相关经文',
  VERIFYING: '正在核验引用与边界', READY_TO_SPEAK: '回答已通过结构门', SPEAKING: '人物正在讲述', ERROR: '暂时无法完成',
}

function makeId(prefix) {
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`
  return `${prefix}_${value.replaceAll('-', '')}`
}

function EvidenceBadge({ level }) {
  return <span className={`dh-grounding ${level === 'G0_UNSUPPORTED' ? 'blocked' : ''}`}>{level}</span>
}

export default function DigitalHumanWorkspace({
  initialCharacterId = 'david',
  lockCharacter = false,
  showOperations = true,
  variant = 'full',
}) {
  const [catalog, setCatalog] = useState([])
  const [catalogMeta, setCatalogMeta] = useState(null)
  const [runtime, setRuntime] = useState(null)
  const [selectedId, setSelectedId] = useState(initialCharacterId)
  const [search, setSearch] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [uiState, setUiState] = useState(UI_STATES.IDLE)
  const [avatarState, setAvatarState] = useState(DIGITAL_HUMAN_STATES.BOOTING)
  const [realtimeState, setRealtimeState] = useState(REALTIME_STATES.DISCONNECTED)
  const [error, setError] = useState('')
  const [identityCandidates, setIdentityCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewVoicePlaying, setPreviewVoicePlaying] = useState(false)
  const sessionId = useRef(makeId('session'))
  const turnInFlight = useRef(false)
  const iframeRef = useRef(null)
  const avatarAdapter = useRef(null)
  const realtimeAdapter = useRef(null)
  const stopPreviewVoice = useRef(null)
  const submitRef = useRef(null)
  const reportProvider = useCallback((provider, state, latencyMs = 0) => {
    recordDigitalHumanProviderTelemetry({ provider, state, latencyMs }).catch(() => {})
  }, [])

  const selected = useMemo(() => catalog.find((item) => item.id === selectedId) || null, [catalog, selectedId])
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return catalog
    return catalog.filter((item) => `${item.canonicalName} ${item.englishName} ${item.id}`.toLowerCase().includes(needle))
  }, [catalog, search])

  useEffect(() => {
    let active = true
    Promise.all([getDigitalHumanCatalog(), getDigitalHumanRuntime()])
      .then(([catalogData, runtimeData]) => {
        if (!active) return
        setCatalog((catalogData.characters || []).map(validateCharacterProfile))
        setCatalogMeta(catalogData)
        setRuntime(runtimeData)
      })
      .catch((caught) => active && setError(caught.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    setSelectedId(initialCharacterId)
    setMessages([])
    sessionId.current = makeId('session')
  }, [initialCharacterId])

  useEffect(() => () => stopPreviewVoice.current?.(), [])

  const submitQuestion = useCallback(async (rawQuestion) => {
    const text = rawQuestion.trim()
    if (!text || !selected || turnInFlight.current) return
    if (uiState === UI_STATES.SPEAKING) {
      setError('当前采用半双工策略：请等待人物讲述结束后再提问。')
      return
    }
    turnInFlight.current = true
    setError('')
    setUiState(UI_STATES.RETRIEVING)
    setMessages((items) => [...items, { id: makeId('user'), role: 'user', text }])
    setQuestion('')
    try {
      const envelope = await createDigitalHumanTurn({
        characterId: selected.id, question: text, sessionId: sessionId.current, turnId: makeId('turn'),
      })
      setUiState(UI_STATES.VERIFYING)
      const response = validateDigitalHumanResponse(envelope.response, selected.id)
      setMessages((items) => [...items, { id: envelope.turnId, role: 'assistant', response, traceId: envelope.traceId }])
      if (envelope.state === 'READY_TO_SPEAK' && response.speechApproved && avatarAdapter.current?.getState() === DIGITAL_HUMAN_STATES.READY) {
        setUiState(UI_STATES.READY_TO_SPEAK)
        await realtimeAdapter.current?.setMicrophoneEnabled(false).catch(() => {})
        await avatarAdapter.current.speakApproved(response)
      } else {
        setUiState(UI_STATES.IDLE)
      }
    } catch (caught) {
      setError(caught.message)
      setUiState(UI_STATES.ERROR)
    } finally {
      turnInFlight.current = false
    }
  }, [selected, uiState])

  submitRef.current = submitQuestion

  useEffect(() => {
    const adapter = new LiveKitRealtimeSession({
      onStateChange: (next) => {
        setRealtimeState(next)
        const mapped = { IDLE: 'READY', LISTENING: 'READY', PROCESSING: 'READY', ERROR: 'ERROR', DISCONNECTED: 'DISCONNECTED', RECOVERING: 'RECOVERING' }[next]
        if (mapped) reportProvider('livekit', mapped)
      },
      onFinalTranscript: (text) => {
        setUiState(UI_STATES.TRANSCRIBING)
        return submitRef.current?.(text)
      },
    })
    realtimeAdapter.current = adapter
    return () => { adapter.disconnect().catch(() => {}) }
  }, [reportProvider])

  useEffect(() => {
    avatarAdapter.current?.dispose()
    avatarAdapter.current = null
    if (!iframeRef.current || !runtime?.liveSpeakEnabled || !selected?.runtimeReady) return undefined
    const adapter = new MetaPersonLiveSpeakAdapter({
      iframe: iframeRef.current,
      origin: runtime.liveSpeakOrigin,
      onStateChange: (next) => {
        setAvatarState(next)
        const speaking = next === DIGITAL_HUMAN_STATES.SPEAKING
        realtimeAdapter.current?.setAvatarSpeaking(speaking)
        if (speaking) setUiState(UI_STATES.SPEAKING)
        else if (next === DIGITAL_HUMAN_STATES.READY) setUiState(UI_STATES.IDLE)
        const mapped = { ready: 'READY', error: 'ERROR', disposed: 'DISCONNECTED' }[next]
        if (mapped) reportProvider('livespeak', mapped)
      },
    })
    avatarAdapter.current = adapter
    adapter.initialize().then(() => adapter.loadCharacter(selected)).catch((caught) => { reportProvider('livespeak', 'FALLBACK'); setError(caught.message) })
    return () => adapter.dispose()
  }, [runtime, selected, reportProvider])

  const toggleMic = async () => {
    if (!runtime?.liveKitEnabled || !selected) return
    setError('')
    try {
      if (realtimeState === REALTIME_STATES.DISCONNECTED || realtimeState === REALTIME_STATES.ERROR) {
        const access = await createDigitalHumanLiveKitToken({ characterId: selected.id, sessionId: sessionId.current })
        await realtimeAdapter.current.connect(access.token, access.url)
      }
      const enable = realtimeAdapter.current.getState() !== REALTIME_STATES.LISTENING
      await realtimeAdapter.current.setMicrophoneEnabled(enable)
      setUiState(enable ? UI_STATES.LISTENING : UI_STATES.IDLE)
    } catch (caught) {
      setError(caught.message)
      setUiState(UI_STATES.ERROR)
    }
  }

  const resolveSearch = async () => {
    if (!search.trim()) return
    setError('')
    try {
      // Catalog search is intentionally context-free. A bare ambiguous name must
      // always return candidates instead of inheriting the previously selected
      // character and silently binding the next session to the wrong identity.
      const result = await resolveDigitalHumanIdentity({ surface: search.trim() })
      if (result.status === 'RESOLVED') {
        setSelectedId(result.characterId)
        setIdentityCandidates([])
      } else if (result.status === 'AMBIGUOUS') {
        setIdentityCandidates(result.candidates)
      } else {
        setIdentityCandidates([])
        setError('没有找到对应的 Core 100 人物。')
      }
    } catch (caught) { setError(caught.message) }
  }

  const togglePreviewVoice = () => {
    if (previewVoicePlaying) {
      stopPreviewVoice.current?.()
      stopPreviewVoice.current = null
      setPreviewVoicePlaying(false)
      return
    }
    setError('')
    try {
      setPreviewVoicePlaying(true)
      stopPreviewVoice.current = speakSharedPreviewDisclosure({
        onEnd: () => {
          stopPreviewVoice.current = null
          setPreviewVoicePlaying(false)
        },
      })
    } catch (caught) {
      setPreviewVoicePlaying(false)
      setError(caught.message)
    }
  }

  if (loading) return <section className={`dh-shell ${variant === 'embedded' ? 'dh-embedded' : ''}`}><p role="status">正在加载 100 人经文约束目录…</p></section>

  return (
    <section className={`dh-shell ${variant === 'embedded' ? 'dh-embedded' : ''}`} aria-label={`${selected?.canonicalName || '圣经人物'}数字人`}>
      <header className="dh-intro">
        <div><span>BIBLE DIGITAL HUMAN · v{catalogMeta?.contentVersion}</span><h2>圣经人物 · 经文约束对话</h2><p>AI 只协助检索与表达，不是启示、良心、牧者或最终解释权威。</p></div>
        <div className="dh-assurance"><strong>{lockCharacter ? (selected?.canonicalName || '—') : (catalogMeta?.characterCount || catalog.length)}</strong><small>{lockCharacter ? `${selected?.englishName || selectedId} · characterId ${selectedId}` : `人物 · ${catalogMeta?.truthCaseCount || 0} Truth Cases`}</small></div>
      </header>

      <div className="dh-status" role="status"><span>{STATE_LABELS[uiState]}</span><small>内容 {runtime?.contentReviewState || 'UNKNOWN'} · RAG {runtime?.retrievalMode || 'UNKNOWN'} · Avatar {avatarState} · Realtime {realtimeState}</small></div>
      {error && <div className="dh-error" role="alert">{error}<button type="button" onClick={() => { setError(''); setUiState(UI_STATES.IDLE) }}>关闭</button></div>}

      <div className={`dh-layout ${lockCharacter ? 'dh-layout-locked' : ''}`}>
        {!lockCharacter && <aside className="dh-catalog">
          <div className="dh-search"><input aria-label="搜索圣经人物" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="姓名、英文名或 characterId" /><button type="button" onClick={resolveSearch}>识别</button></div>
          {!!identityCandidates.length && <div className="dh-candidates" role="group" aria-label="请选择具体人物"><strong>这个名称对应多位人物，请明确选择：</strong>{identityCandidates.map((item) => <button type="button" key={item.characterId} onClick={() => { setSelectedId(item.characterId); setIdentityCandidates([]) }}>{item.stableLabel}</button>)}</div>}
          <div className="dh-character-list">{filtered.map((item) => <button type="button" className={selectedId === item.id ? 'active' : ''} key={item.id} onClick={() => { setSelectedId(item.id); setMessages([]); sessionId.current = makeId('session') }}><span>{item.canonicalName}</span><small>{item.englishName} · {item.catalogTier}</small></button>)}</div>
        </aside>}

        <div className="dh-experience">
          <section className="dh-stage">
            {runtime?.liveSpeakEnabled && selected?.runtimeReady ? <iframe ref={iframeRef} title={`${selected.canonicalName} LiveSpeak Avatar`} src={runtime.liveSpeakEmbedUrl} allow="microphone" sandbox="allow-scripts allow-same-origin" /> : <div className="dh-portrait-fallback"><img src={selected?.avatar?.portraitUrl || SHARED_PREVIEW_PORTRAIT_URL} alt={selected?.avatar?.portraitUrl ? `${selected.canonicalName}数字人艺术重建肖像` : `${selected?.canonicalName || '圣经人物'}共用3D艺术占位肖像`} /><strong>{selected?.canonicalName}</strong><small>{selected?.englishName} · 文本安全回退</small>{!selected?.avatar?.portraitUrl && <span className="dh-preview-label">共享3D艺术占位肖像 · 非历史真实肖像</span>}<p>{selected?.runtimeReady ? 'LiveSpeak 当前不可用。' : 'GLB、Voice 或内容尚未完成人工审批，因此不加载 Avatar。'}</p><button className="dh-preview-voice" type="button" onClick={togglePreviewVoice}>{previewVoicePlaying ? '停止默认预览音色' : '试听默认预览音色'}</button></div>}
            <p className="dh-disclosure">{selected?.disclosure}</p>
          </section>

          <section className="dh-conversation" aria-live="polite">
            {!messages.length && <div className="dh-empty"><strong>从已审核问题开始</strong><div>{(selected?.recommendedQuestions || []).slice(0, 4).map((item) => <button type="button" key={item} onClick={() => submitQuestion(item)}>{item}</button>)}</div></div>}
            {messages.map((item) => item.role === 'user' ? <article className="dh-message user" key={item.id}><span>你</span><p>{item.text}</p></article> : <article className="dh-message assistant" key={item.id}><header><strong>{selected?.canonicalName}</strong><EvidenceBadge level={item.response.groundingLevel} /></header><p>{item.response.displayText}</p>{!!item.response.references.length && <ul>{item.response.references.map((ref) => <li key={`${ref.sourceType}-${ref.locator}`}>{ref.locator} · {ref.claimSupport}</li>)}</ul>}{!!item.response.relatedCharacters.length && <p className="dh-related">人物图：{item.response.relatedCharacters.map((id) => catalog.find((character) => character.id === id)?.canonicalName || id).join(' · ')}</p>}<footer>{item.response.speechApproved ? '已通过发声门' : '仅文字显示 · 内容或资产仍需人工审核'} · Trace {item.traceId.slice(0, 10)}</footer></article>)}
          </section>

          <form className="dh-composer" onSubmit={(event) => { event.preventDefault(); submitQuestion(question) }}>
            <textarea aria-label="向当前圣经人物提问" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} placeholder={`向${selected?.canonicalName || '人物'}提问；未有足够证据时系统会拒绝断言。`} />
            <div><button type="button" onClick={toggleMic} disabled={!runtime?.liveKitEnabled || uiState === UI_STATES.SPEAKING || realtimeState === REALTIME_STATES.PROCESSING}>{realtimeState === REALTIME_STATES.LISTENING ? '停止收音' : realtimeState === REALTIME_STATES.PROCESSING ? '正在处理语音' : '语音提问'}</button><button className="primary" type="submit" disabled={!question.trim() || turnInFlight.current || uiState === UI_STATES.SPEAKING}>发送并核验</button></div>
          </form>
          <p className="dh-privacy">默认不持久化原始麦克风音频或转录正文；审计仅保存人物、证据等级、引用、原因码、延迟与 Trace ID。</p>
        </div>
      </div>
      {showOperations && <DigitalHumanOperationsPanel enabled={runtime?.operationsDashboardEnabled} />}
    </section>
  )
}
