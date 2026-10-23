import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDigitalHumanLiveKitToken, createDigitalHumanTurn, getDigitalHumanCatalog, getDigitalHumanRuntime, recordDigitalHumanProviderTelemetry, resolveDigitalHumanIdentity } from './api'
import { validateCharacterProfile, validateDigitalHumanResponse } from './contracts'
import { DIGITAL_HUMAN_STATES } from './DigitalHumanAdapter'
import { LiveKitRealtimeSession, REALTIME_STATES } from './LiveKitRealtimeSession'
import { MetaPersonLiveSpeakAdapter } from './MetaPersonLiveSpeakAdapter'
import { SHARED_PREVIEW_PORTRAIT_URL, speakSharedPreviewDisclosure } from './previewAssets'
import DigitalHumanOperationsPanel from './DigitalHumanOperationsPanel'
import DigitalHumanStudyPanel from './DigitalHumanStudyPanel'
import DigitalHumanReadinessPanel from './DigitalHumanReadinessPanel'
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
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [previewVoicePlaying, setPreviewVoicePlaying] = useState(false)
  const [sessionRevision, setSessionRevision] = useState(0)
  const [isTurnPending, setIsTurnPending] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [isMicPending, setIsMicPending] = useState(false)
  const micTransition = useRef(false)
  const micRequestRevision = useRef(0)
  const identityLookupRevision = useRef(0)
  const sessionId = useRef(makeId('session'))
  const turnInFlight = useRef(false)
  const conversationGeneration = useRef(0)
  const turnRequest = useRef(null)
  const topicContext = useRef([])
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
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    Promise.all([getDigitalHumanCatalog({ signal: controller.signal }), getDigitalHumanRuntime({ signal: controller.signal })])
      .then(([catalogData, runtimeData]) => {
        if (!active) return
        if (!Array.isArray(catalogData?.characters) || !catalogData.characters.length || !runtimeData) {
          throw new Error('人物资料暂不可用，请重新加载。')
        }
        setCatalog(catalogData.characters.map(validateCharacterProfile))
        setCatalogMeta(catalogData)
        setRuntime(runtimeData)
      })
      .catch((caught) => {
        if (active && caught.name !== 'AbortError') setLoadError(caught.message)
        controller.abort()
      })
      .finally(() => active && setLoading(false))
    return () => { active = false; controller.abort() }
  }, [loadAttempt])

  const resetConversation = useCallback((characterId) => {
    conversationGeneration.current += 1
    identityLookupRevision.current += 1
    micRequestRevision.current += 1
    turnRequest.current?.abort()
    turnRequest.current = null
    turnInFlight.current = false
    topicContext.current = []
    stopPreviewVoice.current?.()
    stopPreviewVoice.current = null
    setPreviewVoicePlaying(false)
    setSelectedId(characterId)
    setMessages([])
    setQuestion('')
    setError('')
    setUiState(UI_STATES.IDLE)
    setIsTurnPending(false)
    micTransition.current = false
    setIsMicPending(false)
    setAvatarFailed(false)
    setIdentityCandidates([])
    setAvatarState(DIGITAL_HUMAN_STATES.BOOTING)
    setRealtimeState(REALTIME_STATES.DISCONNECTED)
    sessionId.current = makeId('session')
    setSessionRevision((value) => value + 1)
  }, [])

  useEffect(() => { resetConversation(initialCharacterId) }, [initialCharacterId, resetConversation])

  useEffect(() => () => {
    conversationGeneration.current += 1
    turnRequest.current?.abort()
    stopPreviewVoice.current?.()
  }, [])

  const submitQuestion = useCallback(async (rawQuestion) => {
    const text = rawQuestion.trim()
    if (!text || !selected || turnInFlight.current) return
    if (uiState === UI_STATES.SPEAKING || avatarAdapter.current?.getState() === DIGITAL_HUMAN_STATES.SPEAKING) {
      setError('当前采用半双工策略：请等待人物讲述结束后再提问。')
      return
    }
    turnInFlight.current = true
    micRequestRevision.current += 1
    micTransition.current = false
    setIsMicPending(false)
    setIsTurnPending(true)
    const generation = conversationGeneration.current
    const controller = new AbortController()
    const voiceSession = realtimeAdapter.current
    turnRequest.current = controller
    setError('')
    setUiState(UI_STATES.RETRIEVING)
    setMessages((items) => [...items, { id: makeId('user'), role: 'user', text }].slice(-40))
    setQuestion('')
    try {
      await voiceSession?.beginTurn()
      if (generation !== conversationGeneration.current) return
      const envelope = await createDigitalHumanTurn({
        characterId: selected.id, question: text, sessionId: sessionId.current, turnId: makeId('turn'),
        ...(topicContext.current.length ? { context: { characterId: selected.id, topicIds: topicContext.current } } : {}),
      }, { signal: controller.signal })
      if (generation !== conversationGeneration.current) return
      setUiState(UI_STATES.VERIFYING)
      const response = validateDigitalHumanResponse(envelope.response, selected.id)
      topicContext.current = (response.relatedEvents || []).filter((id) => /^[a-z0-9_-]{1,100}$/.test(id)).slice(-4)
      setMessages((items) => [...items, { id: envelope.turnId, role: 'assistant', response, traceId: envelope.traceId }].slice(-40))
      if (envelope.state === 'READY_TO_SPEAK' && response.speechApproved && avatarAdapter.current?.getState() === DIGITAL_HUMAN_STATES.READY) {
        setUiState(UI_STATES.READY_TO_SPEAK)
        await realtimeAdapter.current?.setMicrophoneEnabled(false).catch(() => {})
        if (generation !== conversationGeneration.current) return
        await avatarAdapter.current.speakApproved(response)
      } else {
        setUiState(UI_STATES.IDLE)
      }
    } catch (caught) {
      if (generation !== conversationGeneration.current || caught.name === 'AbortError') return
      setError(caught.message)
      setUiState(UI_STATES.ERROR)
    } finally {
      voiceSession?.finishTurn()
      if (generation === conversationGeneration.current) {
        turnInFlight.current = false
        turnRequest.current = null
        setIsTurnPending(false)
      }
    }
  }, [selected, uiState])

  submitRef.current = submitQuestion

  useEffect(() => {
    let active = true
    const adapter = new LiveKitRealtimeSession({
      onStateChange: (next) => {
        if (!active) return
        setRealtimeState(next)
        const mapped = { IDLE: 'READY', LISTENING: 'READY', PROCESSING: 'READY', ERROR: 'ERROR', DISCONNECTED: 'DISCONNECTED', RECOVERING: 'RECOVERING' }[next]
        if (mapped) reportProvider('livekit', mapped)
      },
      onFinalTranscript: (text) => {
        if (!active) return undefined
        setUiState(UI_STATES.TRANSCRIBING)
        return submitRef.current?.(text)
      },
    })
    realtimeAdapter.current = adapter
    return () => { active = false; adapter.disconnect().catch(() => {}) }
  }, [reportProvider, selectedId, sessionRevision])

  useEffect(() => {
    let active = true
    avatarAdapter.current?.dispose()
    avatarAdapter.current = null
    if (avatarFailed || !iframeRef.current || !runtime?.liveSpeakEnabled || !selected?.runtimeReady) return undefined
    const adapter = new MetaPersonLiveSpeakAdapter({
      iframe: iframeRef.current,
      origin: runtime.liveSpeakOrigin,
      onError: (caught) => {
        if (!active) return
        setAvatarFailed(true)
        setError(caught.message)
        setUiState(UI_STATES.ERROR)
        reportProvider('livespeak', 'FALLBACK')
      },
      onStateChange: (next) => {
        if (!active) return
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
    adapter.initialize().then(() => { if (active) return adapter.loadCharacter(selected) }).catch((caught) => { if (active) { reportProvider('livespeak', 'FALLBACK'); setAvatarFailed(true); setError(caught.message); setUiState(UI_STATES.ERROR) } })
    return () => { active = false; adapter.dispose() }
  }, [runtime, selected, reportProvider, sessionRevision, avatarFailed, loading])

  const toggleMic = async () => {
    if (!runtime?.liveKitEnabled || !selected || micTransition.current || turnInFlight.current || avatarAdapter.current?.getState() === DIGITAL_HUMAN_STATES.SPEAKING) return
    micTransition.current = true
    setIsMicPending(true)
    const generation = conversationGeneration.current
    const micRevision = ++micRequestRevision.current
    const adapter = realtimeAdapter.current
    setError('')
    try {
      if (realtimeState === REALTIME_STATES.DISCONNECTED || realtimeState === REALTIME_STATES.ERROR) {
        const access = await createDigitalHumanLiveKitToken({ characterId: selected.id, sessionId: sessionId.current })
        if (generation !== conversationGeneration.current || micRevision !== micRequestRevision.current) return
        await adapter.connect(access.token, access.url)
        if (generation !== conversationGeneration.current) { await adapter.disconnect(); return }
      }
      if (micRevision !== micRequestRevision.current || turnInFlight.current) return
      const enable = adapter.getState() !== REALTIME_STATES.LISTENING
      await adapter.setMicrophoneEnabled(enable)
      if (generation !== conversationGeneration.current || micRevision !== micRequestRevision.current) return
      setUiState(enable ? UI_STATES.LISTENING : UI_STATES.IDLE)
    } catch (caught) {
      if (generation !== conversationGeneration.current || micRevision !== micRequestRevision.current) return
      setError(caught.message)
      setUiState(UI_STATES.ERROR)
    } finally {
      if (generation === conversationGeneration.current && micRevision === micRequestRevision.current) {
        micTransition.current = false
        setIsMicPending(false)
      }
    }
  }

  const resolveSearch = async () => {
    if (!search.trim()) return
    setError('')
    const generation = conversationGeneration.current
    const lookupRevision = ++identityLookupRevision.current
    try {
      // Catalog search is intentionally context-free. A bare ambiguous name must
      // always return candidates instead of inheriting the previously selected
      // character and silently binding the next session to the wrong identity.
      const result = await resolveDigitalHumanIdentity({ surface: search.trim() })
      if (generation !== conversationGeneration.current || lookupRevision !== identityLookupRevision.current) return
      if (result.status === 'RESOLVED') {
        resetConversation(result.characterId)
        setIdentityCandidates([])
      } else if (result.status === 'AMBIGUOUS') {
        setIdentityCandidates(result.candidates)
      } else {
        setIdentityCandidates([])
        setError('没有找到对应的 Core 100 人物。')
      }
    } catch (caught) { if (generation === conversationGeneration.current && lookupRevision === identityLookupRevision.current) setError(caught.message) }
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
  if (loadError) return <section className={`dh-shell ${variant === 'embedded' ? 'dh-embedded' : ''}`} aria-label="数字人加载失败">
    <div className="dh-error" role="alert"><span>人物资料暂不可用：{loadError}</span></div>
    <button className="dh-preview-voice" type="button" onClick={() => setLoadAttempt(value => value + 1)}>重新加载人物资料</button>
  </section>

  return (
    <section className={`dh-shell ${variant === 'embedded' ? 'dh-embedded' : ''}`} aria-label={`${selected?.canonicalName || '圣经人物'}数字人`}>
      <header className="dh-intro">
        <div><span>BIBLE DIGITAL HUMAN · v{catalogMeta?.contentVersion}</span><h2>圣经人物 · 经文约束对话</h2><p>AI 只协助检索与表达，不是启示、良心、牧者或最终解释权威。</p></div>
        <div className="dh-assurance"><strong>{lockCharacter ? (selected?.canonicalName || '—') : (catalogMeta?.characterCount || catalog.length)}</strong><small>{lockCharacter ? `${selected?.englishName || selectedId} · characterId ${selectedId}` : `人物 · ${catalogMeta?.truthCaseCount || 0} Truth Cases`}</small></div>
      </header>

      <div className="dh-status" role="status"><span>{STATE_LABELS[uiState]}</span><small>内容 {runtime?.contentReviewState || 'UNKNOWN'} · RAG {runtime?.retrievalMode || 'UNKNOWN'} · Avatar {avatarState} · Realtime {realtimeState}</small></div>
      {error && <div className="dh-error" role="alert">{error}<button type="button" onClick={() => setError('')}>关闭</button></div>}
      <DigitalHumanReadinessPanel readiness={runtime?.readiness} />

      <div className={`dh-layout ${lockCharacter ? 'dh-layout-locked' : ''}`}>
        {!lockCharacter && <aside className="dh-catalog">
          <div className="dh-search"><input aria-label="搜索圣经人物" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="姓名、英文名或 characterId" /><button type="button" onClick={resolveSearch}>识别</button></div>
          {!!identityCandidates.length && <div className="dh-candidates" role="group" aria-label="请选择具体人物"><strong>这个名称对应多位人物，请明确选择：</strong>{identityCandidates.map((item) => <button type="button" key={item.characterId} onClick={() => resetConversation(item.characterId)}>{item.stableLabel}</button>)}</div>}
          <div className="dh-character-list">{filtered.map((item) => <button type="button" className={selectedId === item.id ? 'active' : ''} key={item.id} onClick={() => resetConversation(item.id)}><span>{item.canonicalName}</span><small>{item.englishName} · {item.catalogTier}</small></button>)}</div>
        </aside>}

        <div className="dh-experience">
          <section className="dh-stage">
            {runtime?.liveSpeakEnabled && selected?.runtimeReady && !avatarFailed ? <iframe key={sessionRevision} ref={iframeRef} title={`${selected.canonicalName} LiveSpeak Avatar`} src={runtime.liveSpeakEmbedUrl} allow="microphone" sandbox="allow-scripts allow-same-origin" onError={() => { setAvatarFailed(true); setError('Avatar 页面加载失败，已保留文字回答。') }} /> : <div className="dh-portrait-fallback"><img src={selected?.avatar?.portraitUrl || SHARED_PREVIEW_PORTRAIT_URL} alt={selected?.avatar?.portraitUrl ? `${selected.canonicalName}数字人艺术重建肖像` : `${selected?.canonicalName || '圣经人物'}共用3D艺术占位肖像`} /><strong>{selected?.canonicalName}</strong><small>{selected?.englishName} · 文本安全回退</small>{!selected?.avatar?.portraitUrl && <span className="dh-preview-label">共享3D艺术占位肖像 · 非历史真实肖像</span>}<p>{selected?.runtimeReady ? 'LiveSpeak 当前不可用。' : 'GLB、Voice 或内容尚未完成人工审批，因此不加载 Avatar。'}</p><button className="dh-preview-voice" type="button" onClick={togglePreviewVoice}>{previewVoicePlaying ? '停止默认预览音色' : '试听默认预览音色'}</button>{avatarFailed && <button type="button" disabled={isTurnPending} onClick={() => { setError(''); setAvatarFailed(false); setAvatarState(DIGITAL_HUMAN_STATES.BOOTING); setSessionRevision((value) => value + 1) }}>重新连接数字人</button>}</div>}
            <p className="dh-disclosure">{selected?.disclosure}</p>
          </section>

          {selected && <DigitalHumanStudyPanel key={selected.id} characterId={selected.id} onAsk={submitQuestion} onSelectCharacter={lockCharacter ? undefined : resetConversation} />}

          <section className="dh-conversation" aria-live="polite">
            {!messages.length && <div className="dh-empty"><strong>从示例问题开始</strong><div>{(selected?.recommendedQuestions || []).slice(0, 4).map((item) => <button type="button" key={item} onClick={() => submitQuestion(item)}>{item}</button>)}</div></div>}
            {messages.map((item) => item.role === 'user' ? <article className="dh-message user" key={item.id}><span>你</span><p>{item.text}</p></article> : <article className="dh-message assistant" key={item.id}><header><strong>{selected?.canonicalName}</strong><EvidenceBadge level={item.response.groundingLevel} /></header><p>{item.response.displayText}</p>{!!item.response.references.length && <ul>{item.response.references.map((ref) => <li key={`${ref.sourceType}-${ref.locator}`}>{ref.locator} · {ref.claimSupport}</li>)}</ul>}{!!item.response.relatedCharacters.length && <p className="dh-related">人物图：{item.response.relatedCharacters.map((id) => catalog.find((character) => character.id === id)?.canonicalName || id).join(' · ')}</p>}<footer>{item.response.speechApproved ? '已通过发声门' : '仅文字显示 · 内容或资产仍需人工审核'} · Trace {item.traceId.slice(0, 10)}</footer></article>)}
          </section>

          <form className="dh-composer" onSubmit={(event) => { event.preventDefault(); submitQuestion(question) }}>
            <textarea aria-label="向当前圣经人物提问" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} placeholder={`向${selected?.canonicalName || '人物'}提问；未有足够证据时系统会拒绝断言。`} />
            <div><button type="button" onClick={() => resetConversation(selectedId)}>清空本次会话</button><button type="button" onClick={toggleMic} disabled={!runtime?.liveKitEnabled || isMicPending || isTurnPending || uiState === UI_STATES.SPEAKING || realtimeState === REALTIME_STATES.PROCESSING}>{isMicPending ? '正在连接语音' : realtimeState === REALTIME_STATES.LISTENING ? '停止收音' : realtimeState === REALTIME_STATES.PROCESSING ? '正在处理语音' : '语音提问'}</button><button className="primary" type="submit" disabled={!question.trim() || isTurnPending || uiState === UI_STATES.SPEAKING}>发送并核验</button></div>
          </form>
          <p className="dh-privacy">默认不持久化原始麦克风音频或转录正文；审计仅保存人物、证据等级、引用、原因码、延迟与 Trace ID。</p>
        </div>
      </div>
      {showOperations && <DigitalHumanOperationsPanel enabled={runtime?.operationsDashboardEnabled} />}
    </section>
  )
}
