import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLang } from '../../../i18n/LanguageContext'
import { getRuntimeLang } from '../../../i18n/runtime'
import { createDigitalHumanLiveKitToken, createDigitalHumanLiveSpeakToken, createDigitalHumanTurn, getDigitalHumanCatalog, getDigitalHumanRuntime, recordDigitalHumanProviderTelemetry, resolveDigitalHumanIdentity } from './api'
import { validateCharacterProfile, validateDigitalHumanResponse } from './contracts'
import { DIGITAL_HUMAN_STATES, isDigitalHumanPlaybackActive } from './DigitalHumanAdapter'
import { BROWSER_VOICE_STATES, BrowserSpeechTurnSession, isBrowserVoiceCaptureSupported } from './BrowserSpeechTurnSession'
import { LiveKitRealtimeSession, REALTIME_STATES } from './LiveKitRealtimeSession'
import {
  createPreviewAnimationLoop,
  isLocalSpeechSynthesisSupported,
  isWebAudioVisemeSupported,
  LocalPortraitVisemeAdapter,
  NEUTRAL_ANIMATION_FRAME,
} from './LocalPortraitVisemeAdapter'
import { MetaPersonLiveSpeakAdapter } from './MetaPersonLiveSpeakAdapter'
import { SHARED_PREVIEW_VOICE_DISCLOSURE, speakSharedPreviewDisclosure } from './previewAssets'
import AnimatedCharacterStage from './AnimatedCharacterStage'
import CharacterPortrait from './CharacterPortrait'
import DigitalHumanOperationsPanel from './DigitalHumanOperationsPanel'
import DigitalHumanStudyPanel from './DigitalHumanStudyPanel'
import DigitalHumanReadinessPanel from './DigitalHumanReadinessPanel'
import './digitalHuman.css'

const UI_STATES = Object.freeze({
  IDLE: 'IDLE', LISTENING: 'LISTENING', TRANSCRIBING: 'TRANSCRIBING', RETRIEVING: 'RETRIEVING',
  VERIFYING: 'VERIFYING', READY_TO_SPEAK: 'READY_TO_SPEAK', WAITING_FOR_TOUCH: 'WAITING_FOR_TOUCH', SPEAKING: 'SPEAKING', ERROR: 'ERROR',
})

const STATE_LABELS = {
  IDLE: '可以提问',
  LISTENING: '正在聆听',
  TRANSCRIBING: '正在确认语音',
  RETRIEVING: '正在查找相关经文',
  VERIFYING: '正在核验引用与边界',
  READY_TO_SPEAK: '正在准备语音回复',
  WAITING_FOR_TOUCH: '请轻触上方数字人以播放语音',
  SPEAKING: '人物正在讲述',
  ERROR: '暂时无法完成',
}

const METAPERSON_ORIGIN = 'https://metaperson.avatarsdk.com'

function makeId(prefix) {
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`
  return `${prefix}_${value.replaceAll('-', '')}`
}

function EvidenceBadge({ level }) {
  return <span className={`dh-grounding ${level === 'G0_UNSUPPORTED' ? 'blocked' : ''}`}>{level}</span>
}

function voiceUnavailableReason(runtime, loadError, t) {
  if (!runtime) return loadError ? t('暂时无法读取语音状态，请重新核对。') : t('正在核对语音服务。')
  const requirements = Array.isArray(runtime.readiness?.requirements) ? runtime.readiness.requirements : []
  const missing = requirements.filter(({ state }) => state === 'MISSING')
  const hasMissingLiveKit = missing.some(({ code }) => code === 'LIVEKIT_PROJECT')
  const hasMissingStt = missing.some(({ code }) => code === 'STT_WORKER')
  if (hasMissingLiveKit && hasMissingStt) {
    return t('实时语音项目尚未配置；语音转写服务尚未声明就绪。可先用文字提问。')
  }
  if (hasMissingLiveKit) {
    return t('实时语音项目尚未配置。可先用文字提问。')
  }
  if (hasMissingStt) {
    return t('语音转写服务尚未声明就绪。可先用文字提问。')
  }
  return t('语音提问暂不可用，可先用文字提问。')
}

export default function DigitalHumanWorkspace({
  initialCharacterId = 'david',
  lockCharacter = false,
  showOperations = true,
  variant = 'full',
}) {
  const { lang, t } = useLang()
  const runtimeLang = getRuntimeLang() || lang
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
  const [browserVoiceState, setBrowserVoiceState] = useState(BROWSER_VOICE_STATES.IDLE)
  const [animationFrame, setAnimationFrame] = useState(NEUTRAL_ANIMATION_FRAME)
  const [error, setError] = useState('')
  const [failedTurn, setFailedTurn] = useState(null)
  const [identityCandidates, setIdentityCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [runtimeLoadError, setRuntimeLoadError] = useState('')
  const [previewVoicePlaying, setPreviewVoicePlaying] = useState(false)
  const [sessionRevision, setSessionRevision] = useState(0)
  const [isTurnPending, setIsTurnPending] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [isMicPending, setIsMicPending] = useState(false)
  const voiceNoticeId = useId()
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
  const browserVoiceAdapter = useRef(null)
  const stopPreviewVoice = useRef(null)
  const previewLoopRef = useRef(null)
  const submitRef = useRef(null)
  const runtimeRequestRevision = useRef(0)
  const runtimeRetryRequest = useRef(null)
  const reportProvider = useCallback((provider, state, latencyMs = 0) => {
    recordDigitalHumanProviderTelemetry({ provider, state, latencyMs }).catch(() => {})
  }, [])

  const selected = useMemo(() => catalog.find((item) => item.id === selectedId) || null, [catalog, selectedId])
  const speechLanguage = runtimeLang === 'en' ? 'en-US' : (selected?.voice?.language || 'zh-CN')
  const displayCharacterName = selected?.canonicalName ? t(selected.canonicalName) : t('圣经人物')
  const regionLabel = `${displayCharacterName}${t('数字人')}`
  const voiceEnabled = runtime?.liveKitEnabled === true
  const browserVoiceSupported = isBrowserVoiceCaptureSupported()
  const liveSpeakAvailable = Boolean(runtime?.liveSpeakEnabled && selected?.runtimeReady && selected.voice.provider === 'azure')
  const localAvatarAvailable = !liveSpeakAvailable && Boolean(selected && (isLocalSpeechSynthesisSupported() || isWebAudioVisemeSupported()))
  const avatarAvailable = liveSpeakAvailable || localAvatarAvailable
  const liveSpeakOrigin = runtime?.liveSpeakOrigin
  const playbackActive = avatarAvailable && !avatarFailed && isDigitalHumanPlaybackActive(avatarState)
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return catalog
    return catalog.filter((item) => `${item.canonicalName} ${item.englishName} ${item.id}`.toLowerCase().includes(needle))
  }, [catalog, search])

  const stopPreviewPlayback = useCallback(() => {
    if (previewLoopRef.current) {
      previewLoopRef.current.stop()
      previewLoopRef.current = null
    }
    if (stopPreviewVoice.current) {
      stopPreviewVoice.current()
      stopPreviewVoice.current = null
    }
    setPreviewVoicePlaying(false)
  }, [])

  const loadRuntime = useCallback((signal) => {
    const revision = ++runtimeRequestRevision.current
    setRuntime(null)
    setRuntimeLoadError('')
    return getDigitalHumanRuntime({ signal })
      .then((runtimeData) => {
        if (signal.aborted || revision !== runtimeRequestRevision.current) return
        if (!runtimeData || typeof runtimeData !== 'object') throw new Error(t('运行状态资料暂不可用，请重新核对。'))
        setRuntime(runtimeData)
      })
      .catch((caught) => {
        if (!signal.aborted && revision === runtimeRequestRevision.current && caught.name !== 'AbortError') setRuntimeLoadError(caught.message)
      })
  }, [t])

  const retryRuntime = useCallback(() => {
    runtimeRetryRequest.current?.abort()
    const controller = new AbortController()
    runtimeRetryRequest.current = controller
    void loadRuntime(controller.signal)
  }, [loadRuntime])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    runtimeRetryRequest.current?.abort()
    runtimeRetryRequest.current = null
    getDigitalHumanCatalog({ signal: controller.signal })
      .then((catalogData) => {
        if (!active) return
        if (!Array.isArray(catalogData?.characters) || !catalogData.characters.length) {
          throw new Error(t('人物资料暂不可用，请重新加载。'))
        }
        setCatalog(catalogData.characters.map(validateCharacterProfile))
        setCatalogMeta(catalogData)
      })
      .catch((caught) => {
        if (active && caught.name !== 'AbortError') setLoadError(caught.message)
        controller.abort()
      })
      .finally(() => active && setLoading(false))
    void loadRuntime(controller.signal)
    return () => {
      active = false
      controller.abort()
      runtimeRetryRequest.current?.abort()
      runtimeRequestRevision.current += 1
    }
  }, [loadAttempt, loadRuntime, t])

  const resetConversation = useCallback((characterId) => {
    conversationGeneration.current += 1
    identityLookupRevision.current += 1
    micRequestRevision.current += 1
    turnRequest.current?.abort()
    turnRequest.current = null
    turnInFlight.current = false
    topicContext.current = []
    browserVoiceAdapter.current?.cancelRecording()
    stopPreviewPlayback()
    setAnimationFrame(NEUTRAL_ANIMATION_FRAME)
    setSelectedId(characterId)
    setMessages([])
    setQuestion('')
    setError('')
    setFailedTurn(null)
    setUiState(UI_STATES.IDLE)
    setIsTurnPending(false)
    micTransition.current = false
    setIsMicPending(false)
    setAvatarFailed(false)
    setIdentityCandidates([])
    setAvatarState(DIGITAL_HUMAN_STATES.BOOTING)
    setRealtimeState(REALTIME_STATES.DISCONNECTED)
    setBrowserVoiceState(isBrowserVoiceCaptureSupported() ? BROWSER_VOICE_STATES.IDLE : BROWSER_VOICE_STATES.DISCONNECTED)
    sessionId.current = makeId('session')
    setSessionRevision((value) => value + 1)
  }, [stopPreviewPlayback])

  useEffect(() => { resetConversation(initialCharacterId) }, [initialCharacterId, resetConversation])

  useEffect(() => () => {
    conversationGeneration.current += 1
    turnRequest.current?.abort()
    browserVoiceAdapter.current?.disconnect()
    previewLoopRef.current?.stop()
    stopPreviewVoice.current?.()
  }, [])

  const submitQuestion = useCallback(async (rawQuestion, retryOf = null) => {
    const text = rawQuestion.trim()
    if (!text || !selected || turnInFlight.current) return
    const previous = retryOf || (failedTurn?.text === text ? failedTurn : null)
    const isRetry = previous?.characterId === selected.id
      && previous.generation === conversationGeneration.current && previous.sessionId === sessionId.current
    if (retryOf && !isRetry) return
    if (isDigitalHumanPlaybackActive(avatarAdapter.current?.getState())) {
      setError(t('当前采用半双工策略：请等待人物讲述结束后再提问。'))
      return
    }
    turnInFlight.current = true
    micRequestRevision.current += 1
    micTransition.current = false
    setIsMicPending(false)
    setIsTurnPending(true)
    stopPreviewPlayback()
    browserVoiceAdapter.current?.beginTurn()
    const generation = conversationGeneration.current
    const requestSession = sessionId.current
    const userMessageId = isRetry ? previous.userMessageId : makeId('user')
    const controller = new AbortController()
    const voiceSession = realtimeAdapter.current
    turnRequest.current = controller
    setError('')
    setFailedTurn(null)
    setUiState(UI_STATES.RETRIEVING)
    if (!isRetry) setMessages((items) => [...items, { id: userMessageId, role: 'user', text }].slice(-40))
    setQuestion(current => isRetry && current.trim() !== text ? current : '')
    let responseCommitted = false
    try {
      await voiceSession?.beginTurn()
      if (generation !== conversationGeneration.current) return
      const envelope = await createDigitalHumanTurn({
        characterId: selected.id, question: text, sessionId: requestSession, turnId: makeId('turn'),
        ...(topicContext.current.length ? { context: { characterId: selected.id, topicIds: topicContext.current } } : {}),
      }, { signal: controller.signal })
      if (generation !== conversationGeneration.current) return
      setUiState(UI_STATES.VERIFYING)
      const response = validateDigitalHumanResponse(envelope.response, selected.id)
      topicContext.current = (response.relatedEvents || []).filter((id) => /^[a-z0-9_-]{1,100}$/.test(id)).slice(-4)
      const canSpeak = envelope.state === 'READY_TO_SPEAK' && response.speechApproved
      setMessages((items) => [...items, { id: envelope.turnId, role: 'assistant', response, traceId: envelope.traceId, canSpeak }].slice(-40))
      responseCommitted = true
      const avatar = avatarAdapter.current
      if (canSpeak && avatar?.getState() === DIGITAL_HUMAN_STATES.READY) {
        await avatar.speakApproved(response)
      } else {
        setUiState(UI_STATES.IDLE)
      }
    } catch (caught) {
      if (generation !== conversationGeneration.current || controller.signal.aborted) return
      setError(caught.message || t('请求未完成，请重试。'))
      if (!responseCommitted) {
        setFailedTurn({ text, characterId: selected.id, sessionId: requestSession, generation, userMessageId })
        setQuestion(current => current || text)
      }
      setUiState(UI_STATES.ERROR)
    } finally {
      voiceSession?.finishTurn()
      if (generation === conversationGeneration.current) {
        turnInFlight.current = false
        turnRequest.current = null
        setIsTurnPending(false)
      }
    }
  }, [selected, failedTurn, stopPreviewPlayback, t])

  submitRef.current = submitQuestion

  const replayReply = async (item) => {
    const avatar = avatarAdapter.current
    if (!item.canSpeak || item.response.characterId !== selectedId || micTransition.current ||
        turnInFlight.current || avatar?.getState() !== DIGITAL_HUMAN_STATES.READY) return
    const generation = conversationGeneration.current
    const voiceSession = realtimeAdapter.current
    stopPreviewPlayback()
    browserVoiceAdapter.current?.beginTurn()
    turnInFlight.current = true
    setIsTurnPending(true)
    setError('')
    try {
      await voiceSession?.beginTurn()
      if (generation !== conversationGeneration.current || avatar !== avatarAdapter.current) return
      await avatar.speakApproved(item.response)
    } catch (caught) {
      if (generation === conversationGeneration.current) setError(caught.message)
    } finally {
      voiceSession?.finishTurn()
      if (generation === conversationGeneration.current) {
        turnInFlight.current = false
        setIsTurnPending(false)
      }
    }
  }

  useEffect(() => {
    let active = true
    const adapter = new LiveKitRealtimeSession({
      onStateChange: (next) => {
        if (!active) return
        setRealtimeState(next)
        if ([REALTIME_STATES.RECOVERING, REALTIME_STATES.DISCONNECTED, REALTIME_STATES.ERROR].includes(next)) {
          setUiState((current) => current === UI_STATES.LISTENING
            ? (next === REALTIME_STATES.ERROR ? UI_STATES.ERROR : UI_STATES.IDLE)
            : current)
        }
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
    if (!browserVoiceSupported) {
      browserVoiceAdapter.current = null
      setBrowserVoiceState(BROWSER_VOICE_STATES.DISCONNECTED)
      return undefined
    }
    let active = true
    const session = new BrowserSpeechTurnSession({
      language: speechLanguage,
      onStateChange: (next) => {
        if (!active) return
        setBrowserVoiceState(next)
        if (next === BROWSER_VOICE_STATES.RECORDING) {
          setUiState(UI_STATES.LISTENING)
        } else if (next === BROWSER_VOICE_STATES.TRANSCRIBING) {
          setUiState(UI_STATES.TRANSCRIBING)
        } else if (next === BROWSER_VOICE_STATES.IDLE) {
          setUiState((current) => (
            current === UI_STATES.LISTENING || current === UI_STATES.TRANSCRIBING
              ? UI_STATES.IDLE
              : current
          ))
        }
      },
      onFinalTranscript: (text) => {
        if (!active) return undefined
        return submitRef.current?.(text)
      },
      onError: (caught) => {
        if (!active) return
        setError(caught.message || t('语音录入未完成，请重试或改用文字提问。'))
        setUiState(UI_STATES.ERROR)
      },
    })
    browserVoiceAdapter.current = session
    setBrowserVoiceState(session.getState())
    return () => {
      active = false
      session.disconnect()
      if (browserVoiceAdapter.current === session) {
        browserVoiceAdapter.current = null
      }
    }
  }, [browserVoiceSupported, selectedId, speechLanguage, sessionRevision, t])

  useEffect(() => {
    let active = true
    avatarAdapter.current?.dispose()
    avatarAdapter.current = null
    if (avatarFailed || !avatarAvailable || !selected) return undefined
    if (liveSpeakAvailable && !iframeRef.current) return undefined

    setAvatarState(DIGITAL_HUMAN_STATES.BOOTING)
    const handleAvatarStateChange = (next, isLiveSpeak) => {
      if (!active) return
      setAvatarState(next)
      const playback = isDigitalHumanPlaybackActive(next)
      realtimeAdapter.current?.setAvatarSpeaking(playback)
      if (playback) {
        browserVoiceAdapter.current?.muteForAvatarSpeech?.()
      } else {
        browserVoiceAdapter.current?.setAvatarSpeaking(false)
      }
      if (next === DIGITAL_HUMAN_STATES.PREPARING_SPEECH) setUiState(UI_STATES.READY_TO_SPEAK)
      else if (next === DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH) setUiState(UI_STATES.WAITING_FOR_TOUCH)
      else if (next === DIGITAL_HUMAN_STATES.SPEAKING) setUiState(UI_STATES.SPEAKING)
      else if (next === DIGITAL_HUMAN_STATES.READY) {
        setUiState((current) => [UI_STATES.READY_TO_SPEAK, UI_STATES.WAITING_FOR_TOUCH, UI_STATES.SPEAKING].includes(current) ? UI_STATES.IDLE : current)
      }
      if (isLiveSpeak) {
        const mapped = { ready: 'READY', error: 'ERROR', disposed: 'DISCONNECTED' }[next]
        if (mapped) reportProvider('livespeak', mapped)
      }
    }

    const adapter = liveSpeakAvailable
      ? new MetaPersonLiveSpeakAdapter({
          iframe: iframeRef.current,
          origin: liveSpeakOrigin,
          requestAccessToken: liveSpeakOrigin === METAPERSON_ORIGIN
            ? async (signal) => (await createDigitalHumanLiveSpeakToken(selected.id, { signal })).accessToken
            : undefined,
          onError: (caught) => {
            if (!active) return
            setAvatarFailed(true)
            setError(caught.message)
            setUiState(UI_STATES.ERROR)
            reportProvider('livespeak', 'FALLBACK')
          },
          onStateChange: (next) => handleAvatarStateChange(next, true),
        })
      : new LocalPortraitVisemeAdapter({
          onAnimationFrame: (frame) => {
            if (active) setAnimationFrame(frame)
          },
          onError: (caught) => {
            if (!active) return
            setAvatarFailed(true)
            setAnimationFrame(NEUTRAL_ANIMATION_FRAME)
            setError(caught.message)
            setUiState(UI_STATES.ERROR)
          },
          onStateChange: (next) => handleAvatarStateChange(next, false),
        })

    avatarAdapter.current = adapter
    adapter.initialize()
      .then(() => { if (active) return adapter.loadCharacter(selected) })
      .catch((caught) => {
        if (!active) return
        if (liveSpeakAvailable) reportProvider('livespeak', 'FALLBACK')
        setAvatarFailed(true)
        setAnimationFrame(NEUTRAL_ANIMATION_FRAME)
        setError(caught.message)
        setUiState(UI_STATES.ERROR)
      })

    return () => {
      active = false
      if (isDigitalHumanPlaybackActive(adapter.getState())) {
        realtimeAdapter.current?.setAvatarSpeaking(false)
        browserVoiceAdapter.current?.setAvatarSpeaking(false)
        setUiState((current) => [UI_STATES.READY_TO_SPEAK, UI_STATES.WAITING_FOR_TOUCH, UI_STATES.SPEAKING].includes(current) ? UI_STATES.IDLE : current)
      }
      adapter.dispose()
      if (avatarAdapter.current === adapter) avatarAdapter.current = null
    }
  }, [liveSpeakAvailable, liveSpeakOrigin, localAvatarAvailable, avatarAvailable, selected, reportProvider, sessionRevision, avatarFailed, loading])

  const handleStageTouch = () => {
    if (avatarState === DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH) {
      avatarAdapter.current?.resumeAfterTouch?.()
    }
  }

  const toggleMic = async () => {
    if (!voiceEnabled || !selected || micTransition.current || turnInFlight.current ||
        isDigitalHumanPlaybackActive(avatarAdapter.current?.getState()) ||
        browserVoiceState === BROWSER_VOICE_STATES.RECORDING ||
        browserVoiceState === BROWSER_VOICE_STATES.TRANSCRIBING ||
        realtimeState === REALTIME_STATES.RECOVERING) return
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
      if (enable) stopPreviewPlayback()
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

  const toggleBrowserVoice = async () => {
    const session = browserVoiceAdapter.current
    if (!browserVoiceSupported || !session || !selected || isTurnPending || turnInFlight.current ||
        playbackActive || isMicPending || realtimeState === REALTIME_STATES.LISTENING ||
        browserVoiceState === BROWSER_VOICE_STATES.TRANSCRIBING) return
    if (browserVoiceState === BROWSER_VOICE_STATES.RECORDING) {
      await session.stopRecording()
      return
    }
    stopPreviewPlayback()
    setError('')
    try {
      await session.startRecording()
    } catch {
      // Error message and state are handled through session.onError.
    }
  }

  const cancelBrowserVoice = () => {
    browserVoiceAdapter.current?.cancelRecording()
  }

  const resolveSearch = async () => {
    if (!search.trim()) return
    setError('')
    const generation = conversationGeneration.current
    const lookupRevision = ++identityLookupRevision.current
    try {
      const result = await resolveDigitalHumanIdentity({ surface: search.trim() })
      if (generation !== conversationGeneration.current || lookupRevision !== identityLookupRevision.current) return
      if (result.status === 'RESOLVED') {
        resetConversation(result.characterId)
        setIdentityCandidates([])
      } else if (result.status === 'AMBIGUOUS') {
        setIdentityCandidates(result.candidates)
      } else {
        setIdentityCandidates([])
        setError(t('没有找到对应的 Core 100 人物。'))
      }
    } catch (caught) { if (generation === conversationGeneration.current && lookupRevision === identityLookupRevision.current) setError(caught.message) }
  }

  const togglePreviewVoice = () => {
    if (micTransition.current || playbackActive ||
        realtimeAdapter.current?.getState() === REALTIME_STATES.LISTENING ||
        browserVoiceState === BROWSER_VOICE_STATES.RECORDING ||
        browserVoiceState === BROWSER_VOICE_STATES.TRANSCRIBING) return
    if (previewVoicePlaying) {
      stopPreviewPlayback()
      return
    }
    setError('')
    try {
      setPreviewVoicePlaying(true)
      const loop = createPreviewAnimationLoop(SHARED_PREVIEW_VOICE_DISCLOSURE, {
        onAnimationFrame: setAnimationFrame,
      })
      previewLoopRef.current = loop
      stopPreviewVoice.current = speakSharedPreviewDisclosure({
        onStart: () => {
          if (previewLoopRef.current === loop) loop.start()
        },
        onEnd: () => {
          if (previewLoopRef.current === loop) {
            loop.stop()
            previewLoopRef.current = null
          }
          stopPreviewVoice.current = null
          setPreviewVoicePlaying(false)
        },
      })
    } catch (caught) {
      if (previewLoopRef.current) {
        previewLoopRef.current.stop()
        previewLoopRef.current = null
      }
      setPreviewVoicePlaying(false)
      setError(caught.message)
    }
  }

  if (loading) return <section className={`dh-shell ${variant === 'embedded' ? 'dh-embedded' : ''}`}><p role="status">{t('正在加载 100 人经文约束目录…')}</p></section>
  if (loadError) return <section className={`dh-shell ${variant === 'embedded' ? 'dh-embedded' : ''}`} aria-label={t('数字人加载失败')}>
    <div className="dh-error" role="alert"><span>{t('人物资料暂不可用：')}{loadError}</span></div>
    <button className="dh-preview-voice" type="button" onClick={() => setLoadAttempt(value => value + 1)}>{t('重新加载人物资料')}</button>
  </section>

  return (
    <section className={`dh-shell ${variant === 'embedded' ? 'dh-embedded' : ''}`} aria-label={regionLabel}>
      <header className="dh-intro">
        <div><span>BIBLE DIGITAL HUMAN · v{catalogMeta?.contentVersion}</span><h2>{t('圣经人物 · 经文约束对话')}</h2><p>{t('AI 只协助检索与表达，不是启示、良心、牧者或最终解释权威。')}</p></div>
        <div className="dh-assurance"><strong>{lockCharacter ? (displayCharacterName || '—') : (catalogMeta?.characterCount || catalog.length)}</strong><small>{lockCharacter ? `${selected?.englishName || selectedId} · characterId ${selectedId}` : `${t('人物')} · ${catalogMeta?.truthCaseCount || 0} Truth Cases`}</small></div>
      </header>

      <div className="dh-status" role="status"><span>{t(STATE_LABELS[uiState])}</span><small>{t('内容')} {runtime?.contentReviewState || catalogMeta?.contentReviewState || 'UNKNOWN'} · RAG {runtime?.retrievalMode || 'UNKNOWN'} · Avatar {avatarState} · Realtime {realtimeState}</small></div>
      {!runtime && <div className="dh-study" role={runtimeLoadError ? 'alert' : 'status'} aria-label={t('数字人运行状态核对')}>
        <p>{runtimeLoadError ? `${t('运行状态暂不可用：')}${runtimeLoadError}` : t('语音、Avatar 和运行配置仍在核对；可先使用经文约束文字提问。')}</p>
      </div>}
      {error && <div className="dh-error" role="alert"><span>{error}</span>{failedTurn && <button type="button" disabled={isTurnPending || playbackActive} onClick={() => submitQuestion(failedTurn.text, failedTurn)}>{t('重试上次提问')}</button>}<button type="button" onClick={() => setError('')}>{t('关闭')}</button></div>}
      <DigitalHumanReadinessPanel readiness={runtime?.readiness} />

      <div className={`dh-layout ${lockCharacter ? 'dh-layout-locked' : ''}`}>
        {!lockCharacter && <aside className="dh-catalog">
          <div className="dh-search"><input aria-label={t('搜索圣经人物')} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('姓名、英文名或 characterId')} /><button type="button" onClick={resolveSearch}>{t('识别')}</button></div>
          {!!identityCandidates.length && <div className="dh-candidates" role="group" aria-label={t('请选择具体人物')}><strong>{t('这个名称对应多位人物，请明确选择：')}</strong>{identityCandidates.map((item) => <button type="button" key={item.characterId} onClick={() => resetConversation(item.characterId)}>{item.stableLabel}</button>)}</div>}
          <div className="dh-character-list">{filtered.map((item) => <button type="button" className={selectedId === item.id ? 'active' : ''} key={item.id} onClick={() => resetConversation(item.id)}><CharacterPortrait characterId={item.id} name={item.canonicalName} avatar={item.avatar} size={40} context="catalog" /><span>{t(item.canonicalName)}</span><small>{item.englishName} · {item.catalogTier}</small></button>)}</div>
        </aside>}

        <div className="dh-experience">
          <section className="dh-stage">
            {liveSpeakAvailable && !avatarFailed ? <iframe key={sessionRevision} ref={iframeRef} title={`${selected.canonicalName} LiveSpeak Avatar`} src={runtime.liveSpeakEmbedUrl} allow="autoplay" sandbox="allow-scripts allow-same-origin" onError={() => { setAvatarFailed(true); setAvatarState(DIGITAL_HUMAN_STATES.ERROR); setError(t('Avatar 页面加载失败，已保留文字回答。')) }} /> : <div className="dh-portrait-fallback" style={{ gridTemplateColumns: 'minmax(0,1fr)', justifyItems: 'center' }}><AnimatedCharacterStage characterId={selected?.id || selectedId} name={selected?.canonicalName} avatar={selected?.avatar} size={256} frame={animationFrame} onStageTouch={handleStageTouch} /><strong>{displayCharacterName}</strong><small>{selected?.englishName} · {t('文本安全回退')}</small><p>{selected?.runtimeReady ? t('LiveSpeak 当前不可用。') : t('GLB、Voice 或内容尚未完成人工审批，因此不加载 Avatar。')}</p><button className="dh-preview-voice" type="button" onClick={togglePreviewVoice}>{previewVoicePlaying ? t('停止默认预览音色') : t('试听默认预览音色')}</button>{avatarFailed && <button type="button" disabled={isTurnPending} onClick={() => { setError(''); setAvatarFailed(false); setAvatarState(DIGITAL_HUMAN_STATES.BOOTING); setSessionRevision((value) => value + 1) }}>{t('重新连接数字人')}</button>}</div>}
            {avatarState === DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH && <p>{t('手机需要轻触数字人画面后才能播放。')}</p>}
            <p className="dh-disclosure">{selected?.disclosure ? t(selected.disclosure) : ''}</p>
          </section>

          {selected && <DigitalHumanStudyPanel key={selected.id} characterId={selected.id} onAsk={submitQuestion} onSelectCharacter={lockCharacter ? undefined : resetConversation} />}

          <section className="dh-conversation" aria-live="polite">
            {!messages.length && <div className="dh-empty"><strong>{t('从示例问题开始')}</strong><div>{(selected?.recommendedQuestions || []).slice(0, 4).map((item) => <button type="button" key={item} onClick={() => submitQuestion(item)}>{t(item)}</button>)}</div></div>}
            {messages.map((item) => item.role === 'user' ? <article className="dh-message user" key={item.id}><span>{t('你')}</span><p>{item.text}</p></article> : <article className="dh-message assistant" key={item.id}><header><strong>{displayCharacterName}</strong><EvidenceBadge level={item.response.groundingLevel} /></header><p>{item.response.displayText}</p>{!!item.response.references.length && <ul>{item.response.references.map((ref) => <li key={`${ref.sourceType}-${ref.locator}`}>{ref.locator} · {ref.claimSupport}</li>)}</ul>}{!!item.response.relatedCharacters.length && <p className="dh-related">{t('人物图：')}{item.response.relatedCharacters.map((id) => catalog.find((character) => character.id === id)?.canonicalName || id).join(' · ')}</p>}<footer>{item.canSpeak ? t('已通过发声门') : t('仅文字显示 · 内容或资产仍需人工审核')} · Trace {item.traceId.slice(0, 10)}{item.canSpeak && avatarAvailable && !avatarFailed && <button type="button" disabled={avatarState !== DIGITAL_HUMAN_STATES.READY || isTurnPending || isMicPending || realtimeState === REALTIME_STATES.LISTENING || browserVoiceState === BROWSER_VOICE_STATES.RECORDING || browserVoiceState === BROWSER_VOICE_STATES.TRANSCRIBING} onClick={() => replayReply(item)}>{t('播放语音回复')}</button>}</footer></article>)}
          </section>

          <form className="dh-composer" onSubmit={(event) => { event.preventDefault(); submitQuestion(question) }}>
            <textarea aria-label={t('向当前圣经人物提问')} value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} placeholder={`${t('向')}${displayCharacterName}${t('提问；未有足够证据时系统会拒绝断言。')}`} />
            <div><button type="button" onClick={() => resetConversation(selectedId)}>{t('清空本次会话')}</button><button type="button" onClick={toggleMic} aria-describedby={voiceEnabled ? undefined : voiceNoticeId} disabled={!voiceEnabled || isMicPending || isTurnPending || playbackActive || browserVoiceState === BROWSER_VOICE_STATES.RECORDING || browserVoiceState === BROWSER_VOICE_STATES.TRANSCRIBING || [REALTIME_STATES.PROCESSING, REALTIME_STATES.RECOVERING].includes(realtimeState)}>{isMicPending ? t('正在连接语音') : realtimeState === REALTIME_STATES.LISTENING ? t('停止收音') : realtimeState === REALTIME_STATES.PROCESSING ? t('正在处理语音') : realtimeState === REALTIME_STATES.RECOVERING ? t('语音正在重连') : t('语音提问')}</button>{browserVoiceSupported && <><button type="button" className={browserVoiceState === BROWSER_VOICE_STATES.RECORDING ? 'recording' : undefined} onClick={toggleBrowserVoice} disabled={isTurnPending || playbackActive || isMicPending || realtimeState === REALTIME_STATES.LISTENING || browserVoiceState === BROWSER_VOICE_STATES.TRANSCRIBING}>{browserVoiceState === BROWSER_VOICE_STATES.RECORDING ? t('结束录音并发送') : browserVoiceState === BROWSER_VOICE_STATES.TRANSCRIBING ? t('正在转写语音') : t('录音转写提问')}</button>{browserVoiceState === BROWSER_VOICE_STATES.RECORDING && <button type="button" onClick={cancelBrowserVoice}>{t('取消录音')}</button>}</>}<button className="primary" type="submit" disabled={!question.trim() || isTurnPending || playbackActive}>{t('发送并核验')}</button></div>
            {!voiceEnabled && <>
              <p id={voiceNoticeId} className="dh-privacy" role="status">{voiceUnavailableReason(runtime, runtimeLoadError, t)}</p>
              {(runtime || runtimeLoadError) && <div><button type="button" onClick={retryRuntime} disabled={isTurnPending || playbackActive}>{t('重新核对运行状态')}</button></div>}
            </>}
          </form>
          <p className="dh-privacy">{t('默认不持久化原始麦克风音频或转录正文；审计仅保存人物、证据等级、引用、原因码、延迟与 Trace ID。')}</p>
        </div>
      </div>
      {showOperations && <DigitalHumanOperationsPanel enabled={runtime?.operationsDashboardEnabled} />}
    </section>
  )
}
