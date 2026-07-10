import { t as i18nT } from './i18n/runtime'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import BackButton from './BackButton'
import lazyWithRetry from './lazyWithRetry'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_BASE, fetchBiblicalExample, fetchBibleVideo, fetchCommunityHeatmap, fetchDailySnapshot, fetchEmotionTrajectory, fetchFaithQA, fetchFeatureDetail, fetchGuidance, fetchHistory, fetchLayout, fetchMeditationQuestions, fetchSermon, fetchStats, fetchTTS, fetchVersePrayer, runQuery, saveJournal, trackStats, updateUserProfile, fetchMyChurch, regenerateChurchCode, leaveChurch } from './api'
import ChurchOnboardingModal from './ChurchOnboardingModal'
import SOSModal, { checkSOSKeywords } from './SOSModal'
import { getToken, setCachedUser } from './auth'
import RealtimeRoot from './realtime/RealtimeRoot'
const GuardianWidget = lazyWithRetry(() => import('./components/guardian/GuardianWidget'))
import { useAuth } from './hooks/useAuth'
import { useSpeechInput } from './hooks/useSpeechInput'
import { isIosInstallable, promptInstall, subscribeToInstallPrompt } from './pwa'
import { escapeHtml } from './sanitize'
import { getOrCreateVisitorId, verseGroupsFromResult, buildComparisonRows, formatLoginTime } from './utils'
import { useEmotionStore } from './store'
import { EmotionSphereScene } from './EmotionSphereScene'
import LoginScreen from './LoginScreen'
import TranslatableParagraph from './TranslatableParagraph'
import { TTSButton, TTSFullBar } from './useGlobalAudio.jsx'
import { ttsServerParamsFor, pickVoiceFor, speechLangFor } from './voice'
import LanguageToggle from './i18n/LanguageToggle'
import GlobalToast from './components/GlobalToast'
import ConfirmDialog from './components/ConfirmDialog'
import AiStatusBanner from './components/AiStatusBanner'
import SeekersStandalonePage from './components/SeekersStandalonePage'
import DevotionTabContainer from './components/DevotionTabContainer'
import ExpansionLauncher from './expansion/ExpansionLauncher'
import VoiceHoldButton from './components/VoiceHoldButton'
import PastoralPathCard, { PASTORAL_ROUTE_TARGETS } from './components/PastoralPathCard'
import { useGuardianStore } from './components/guardian/guardianStore'

const CheckInPage = lazyWithRetry(() => import('./CheckInPage'))
const ShareWallPage = lazyWithRetry(() => import('./ShareWallPage'))
const SermonJournalPage = lazyWithRetry(() => import('./SermonJournalPage'))
const PrayerWallPage = lazyWithRetry(() => import('./PrayerWallPage'))
const EvangelismPage = lazyWithRetry(() => import('./EvangelismPage'))
const SeekersClassView = lazyWithRetry(() => import('./EvangelismPage').then(m => ({ default: m.SeekersClassView })))
const DevotionJournalPage = lazyWithRetry(() => import('./DevotionJournalPage'))
const RecycleBinPage = lazyWithRetry(() => import('./RecycleBinPage'))
const DecisionSupportPage = lazyWithRetry(() => import('./DecisionSupportPage'))
const CaregiverConsolePage = lazyWithRetry(() => import('./features/crisis-care/app/CaregiverConsolePage'))
const MirrorPage = lazyWithRetry(() => import('./MirrorPage'))
const DailySoulQuestionPage = lazyWithRetry(() => import('./DailySoulQuestionPage'))
const GrowthMapPage = lazyWithRetry(() => import('./GrowthMapPage'))
const SpiritualPartnerPage = lazyWithRetry(() => import('./SpiritualPartnerPage'))
const QuickDevotionPage = lazyWithRetry(() => import('./QuickDevotionPage'))
const BibleReadingPage = lazyWithRetry(() => import('./BibleReadingPage'))
const DailyDevotionPage = lazyWithRetry(() => import('./DailyDevotionPage'))
const SpiritualBooksPage = lazyWithRetry(() => import('./SpiritualBooksPage'))
const PersonalDevotionPage = lazyWithRetry(() => import('./PersonalDevotionPage'))
const ReadingPlanPage = lazyWithRetry(() => import('./ReadingPlanPage'))
const MemoryVersePage = lazyWithRetry(() => import('./MemoryVersePage'))
const MorningDewPage = lazyWithRetry(() => import('./MorningDewPage'))
const EngineeringPage = lazyWithRetry(() => import('./EngineeringPage'))
const BibleMapsPage = lazyWithRetry(() => import('./BibleMapsPage'))
const BibleAtlasPage = lazyWithRetry(() => import('./features/bible-map/BibleAtlasPage'))
const WorldviewPage = lazyWithRetry(() => import('./WorldviewPage'))
const CommunityPage = lazyWithRetry(() => import('./CommunityPage'))
const VoiceRoomPage = lazyWithRetry(() => import('./VoiceRoomPage'))
const CommunionPage = lazyWithRetry(() => import('./CommunionPage'))
const MccheynePage = lazyWithRetry(() => import('./MccheynePage'))
const MemoryDeckPage = lazyWithRetry(() => import('./MemoryDeckPage'))
const PersonalSearchPage = lazyWithRetry(() => import('./PersonalSearchPage'))
const BibleSearchPage = lazyWithRetry(() => import('./BibleSearchPage'))
const ExportDataPage = lazyWithRetry(() => import('./ExportDataPage'))
const SpiritualFormationPage = lazyWithRetry(() => import('./features/spiritual-formation/app/SpiritualFormationPage'))
const AttentionPage = lazyWithRetry(() => import('./features/attention/app/AttentionPage'))

// React Query client for HabitsPage
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function AppContent() {
  const { user, setUser, authLoading, handleLogout } = useAuth()
  const setGuardianWidgetMode = useGuardianStore((state) => state.setWidgetMode)

  const [showLogin, setShowLogin] = useState(false)
  const [showLoginOverlay, setShowLoginOverlay] = useState(false)
  const [loginOverlayMessage, setLoginOverlayMessage] = useState('')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [myChurch, setMyChurch] = useState(undefined)  // undefined=loading, null=无教会, {}=已加入
  const [churchSkipped, setChurchSkipped] = useState(false)
  const [churchCodeCopied, setChurchCodeCopied] = useState(false)
  const [churchRegenLoading, setChurchRegenLoading] = useState(false)
  const [churchLeaveLoading, setChurchLeaveLoading] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editProfileLoading, setEditProfileLoading] = useState(false)

  const {
    layoutItems,
    historyItems,
    selectedFeature,
    selectedFeatureDetail,
    queryResult,
    languageFilter,
    topFeatures,
    topVerses,
    zoomLevel,
    loading,
    error,
    setLayoutItems,
    setHistoryItems,
    setSelectedFeature,
    setSelectedFeatureDetail,
    setSphereGuidance,
    setSpheresBiblicalExample,
    setSphereLoading,
    setQueryResult,
    setLanguageFilter,
    setTopFeatures,
    setTopVerses,
    setLoading,
    setError,
    setCommunityHeatmap,
  } = useEmotionStore()

  const DEFAULT_QUERY_TEXT = '我感到很痛苦，也很想被安慰，但仍然想抓住一点盼望（也可以提问任何基督信仰的问题）'
  const [query, setQuery] = useState('')
  const [includeGuidance, setIncludeGuidance] = useState(true)
  const [rerankMode, setRerankMode] = useState('llm')
  const [rerankCandidates, setRerankCandidates] = useState(20)
  const [rerankWeight, setRerankWeight] = useState(0.3)
  const [guidance, setGuidance] = useState(null)
  const [biblicalExample, setBiblicalExample] = useState(null)
  const [sermon, setSermon] = useState(null)
  const [sermonLoading, setSermonLoading] = useState(false)
  const [faithQa, setFaithQa] = useState(null)
  const [faithQaLoading, setFaithQaLoading] = useState(false)
  const [faithQaError, setFaithQaError] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoUrl, setVideoUrl]         = useState(null)
  const [videoErr, setVideoErr]         = useState('')
  const [videoVerseInput, setVideoVerseInput] = useState('')
  const [videoInputErr, setVideoInputErr]     = useState('')
  const [savingJournal, setSavingJournal] = useState(false)
  const [dailySnapshot, setDailySnapshot] = useState(null)
  const [emotionTrajectory, setEmotionTrajectory] = useState(null)
  const [navRestore] = useState(() => {
    try {
      const ts = Number(window.sessionStorage.getItem('lang-switch') || 0)
      if (ts && Date.now() - ts < 15000) {
        const panel = window.sessionStorage.getItem('nav-activePanel')
        let mirror = null
        try { mirror = JSON.parse(window.sessionStorage.getItem('nav-mirror') || 'null') } catch { /* ignore */ }
        window.sessionStorage.removeItem('lang-switch')
        return { panel: panel || null, mirror }
      }
    } catch { /* ignore */ }
    return null
  })
  const [activePanel, setActivePanel] = useState(navRestore?.panel || 'sphere')
  useEffect(() => { try { window.sessionStorage.setItem('nav-activePanel', activePanel) } catch { /* ignore */ } }, [activePanel])
  const _mirrorRestore = (navRestore && (navRestore.panel === 'mirror' || navRestore.panel === 'mirror-graph')) ? navRestore.mirror : null
  const [pendingPanel, setPendingPanel] = useState(null)
  const [loginMessage, setLoginMessage] = useState('')
  const [formationInitialTab, setFormationInitialTab] = useState('home')
  const [attentionInitialSection, setAttentionInitialSection] = useState('dashboard')
  const [gardenClickCount, setGardenClickCount] = useState(0)
  const [sermonClickCount, setSermonClickCount] = useState(0)
  const [includeBiblicalExample, setIncludeBiblicalExample] = useState(true)
  const [comparisonMode, setComparisonMode] = useState(true)
  const [canInstall, setCanInstall] = useState(false)
  const [installMessage, setInstallMessage] = useState('')
  const [showIosInstallHint, setShowIosInstallHint] = useState(false)
  const [visitStats, setVisitStats] = useState({ page_views: 0, unique_visitors: 0 })

  // 经文祷告手风琴
  const [expandedVerseId, setExpandedVerseId] = useState(null)
  const [versePrayers, setVersePrayers] = useState({})
  const [versePrayerLoading, setVersePrayerLoading] = useState(null)
  const [meditationQuestions, setMeditationQuestions] = useState({})
  const [meditationLoading, setMeditationLoading] = useState(null)

  // TTS 播放状态: 'idle' | 'playing' | 'paused'
  const [ttsState, setTtsState] = useState('idle')

  // 语音输入相关状态（由 useSpeechInput hook 管理）
  const [isPolishing, setIsPolishing] = useState(false)
  const googleTTSAudioRef = useRef(null)  // 用于 Google Cloud TTS 播放

  // 语音输入 hook — encapsulates MediaRecorder + backend transcription + browser detection
  const {
    isRecording,
    recordingSeconds,
    recordingError,
    setRecordingError,
    speechPhase,
    isTranscribing,
    isWeChat,
    maxRecordingSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useSpeechInput({
    onTranscript: (text) => setQuery(prev => prev ? `${prev} ${text}` : text),
    onLoadingChange: setLoading,
    postProcess: async (raw) => {
      // 1. 语义标点
      const punctuated = await addSemanticPunctuation(raw)
      // 2. 双语版本
      const lang = detectTextLanguage(punctuated)
      if (lang === 'zh') {
        const en = await translateText(punctuated, 'en')
        return `${punctuated}\n\n[English] ${en}`
      }
      if (lang === 'en') {
        const zh = await translateText(punctuated, 'zh')
        return `[中文] ${zh}\n\n${punctuated}`
      }
      return punctuated
    },
  })

  // Toast 提示状态
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  // A9: SOS mode
  const [showSOS, setShowSOS] = useState(false)
  const [showQuickDevotion, setShowQuickDevotion] = useState(false)

  useEffect(() => {
    fetchLayout().then((data) => setLayoutItems(data.items || [])).catch((err) => setError(String(err)))
    fetchHistory().then((data) => setHistoryItems(data.items || [])).catch(() => {})
  }, [setLayoutItems, setHistoryItems, setError])

  useEffect(() => {
    if (user) {
      fetchDailySnapshot(getToken()).then(setDailySnapshot).catch(() => {})
      fetchEmotionTrajectory(getToken()).then(setEmotionTrajectory).catch(() => {})
      fetchMyChurch(getToken()).then(data => setMyChurch(data.church || null)).catch(() => setMyChurch(null))
    } else {
      setDailySnapshot(null)
      setEmotionTrajectory(null)
      setMyChurch(undefined)
      setChurchSkipped(false)
    }
  }, [user])

  // Community heatmap — fetch on mount and every 5 minutes (no auth required)
  useEffect(() => {
    function loadHeatmap () {
      fetchCommunityHeatmap(24, 8).then(data => {
        if (data.emotions?.length) setCommunityHeatmap(data.emotions)
      }).catch(() => {})
    }
    loadHeatmap()
    const interval = setInterval(loadHeatmap, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [setCommunityHeatmap])

  useEffect(() => {
    let cancelled = false

    async function loadVisitStats() {
      try {
        const visitorId = getOrCreateVisitorId()
        const stats = await trackStats(visitorId)
        if (!cancelled) {
          setVisitStats(stats)
        }
      } catch {
        try {
          const stats = await fetchStats()
          if (!cancelled) {
            setVisitStats(stats)
          }
        } catch {
        }
      }
    }

    loadVisitStats()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToInstallPrompt((available) => {
      setCanInstall(available)
    })
    setShowIosInstallHint(isIosInstallable())
    return unsubscribe
  }, [])

  const clusters = useMemo(() => {
    const map = new Map()
    for (const item of layoutItems) {
      const key = (item.source_keyword || 'emotion').toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
    return [...map.entries()].slice(0, 6)
  }, [layoutItems])

  const verseGroups = useMemo(() => verseGroupsFromResult(queryResult, languageFilter), [queryResult, languageFilter])
  const comparisonRows = useMemo(() => buildComparisonRows(queryResult), [queryResult])

  async function doQuery() {
    if (!query.trim()) {
      setError(i18nT('请先输入你想倾诉的内容'))
      return
    }
    setLoading(true)
    if (window.showToast) window.showToast(i18nT('🤔 正在思考…'), "loading", 30000)
    setError('')
    setInstallMessage('')
    setGuidance(null)
    setBiblicalExample(null)
    setActivePanel('garden')
    try {
      const result = await runQuery({
        query,
        topFeatures,
        topVerses,
        languageFilter,
        enableRerank: rerankMode !== 'none',
        rerankCandidates,
        rerankWeight,
        rerankMode,
      })
      setQueryResult(result)
      setLoading(false)
      if (window.hideLoadingToast) window.hideLoadingToast()
      fetchHistory().then((h) => setHistoryItems(h.items || [])).catch(() => {})
      // guidance, biblical example and sermon run in background after results are already shown
      if (includeGuidance) {
        fetchGuidance(query).then(setGuidance).catch(() => {})
      }
      if (includeBiblicalExample) {
        fetchBiblicalExample(query).then(setBiblicalExample).catch(() => {})
      }
      fetchSermon(query).then(setSermon).catch(() => {})
    } catch (err) {
      setError(String(err.message || err))
      setLoading(false)
      if (window.hideLoadingToast) window.hideLoadingToast()
    }
  }

  // 经文祷告手风琴 — 点击经文展开祷告
  async function handleVerseClick(item) {
    const verseId = item.pk_id
    if (expandedVerseId === verseId) {
      setExpandedVerseId(null)
      return
    }
    setExpandedVerseId(verseId)
    const ref = `${item.book_name} ${item.chapter}:${item.verse}`
    // 经文祷告（自动）
    if (!versePrayers[verseId]) {
      setVersePrayerLoading(verseId)
      try {
        const data = await fetchVersePrayer(ref, item.raw_text)
        setVersePrayers(prev => ({ ...prev, [verseId]: data.prayer }))
      } catch (err) {
        setVersePrayers(prev => ({ ...prev, [verseId]: `⚠️ 生成失败: ${err.message}` }))
      } finally {
        setVersePrayerLoading(null)
      }
    }
    // 默想此经文（自动，直接显示，无需再点按钮）
    if (!meditationQuestions[verseId]) {
      setMeditationLoading(verseId)
      try {
        const qs = await fetchMeditationQuestions(ref, item.raw_text)
        setMeditationQuestions(prev => ({ ...prev, [verseId]: qs }))
      } catch (err) {
        setMeditationQuestions(prev => ({ ...prev, [verseId]: [`⚠️ ${err.message}`] }))
      } finally {
        setMeditationLoading(null)
      }
    }
  }

  // 构建 TTS 播放文本
  function buildSpeakText() {
    const parts = []
    // 1. 核心情绪
    if (guidance?.core_emotions?.length) parts.push('核心情绪：' + guidance.core_emotions.join('、'))
    // 2. 心理评估
    if (guidance?.psychological_assessment) parts.push('心理评估。' + guidance.psychological_assessment)
    // 3. 属灵剖析
    if (sermon?.spiritual_diagnosis) parts.push('属灵剖析。' + sermon.spiritual_diagnosis)
    // 4. 核心需要
    if (guidance?.core_need) parts.push('核心需要：' + guidance.core_need)
    // 6. 属灵引导
    if (guidance?.spiritual_guidance) parts.push('属灵引导。' + guidance.spiritual_guidance)

    // 7. 圣经榜样
    if (biblicalExample) {
      const parts_be = ['圣经榜样']
      if (biblicalExample.person) parts_be.push('人物：' + biblicalExample.person)
      if (biblicalExample.similar_situation) parts_be.push('相似处境：' + biblicalExample.similar_situation)
      if (biblicalExample.biblical_response) parts_be.push('圣经回应：' + biblicalExample.biblical_response)
      if (biblicalExample.key_verse) parts_be.push('关键经文：' + biblicalExample.key_verse)
      parts.push(parts_be.join('。'))
    }

    // 8. 历史见证
    if (sermon?.historical_case) {
      const hc = sermon.historical_case
      parts.push('历史见证。' + [hc.person, hc.story, hc.lesson].filter(Boolean).join('。'))
    }

    // 9. 专属讲道
    if (sermon) {
      if (sermon.title) parts.push('专属讲道：' + sermon.title)
      if (sermon.theme_verse) parts.push('主题经文：' + sermon.theme_verse)
      if (sermon.introduction) parts.push('引言。' + sermon.introduction)
      sermon.sections?.forEach(s => { if (s.content) parts.push(s.heading + '。' + s.content) })
      if (sermon.application) {
        const app = Array.isArray(sermon.application) ? sermon.application.join('。') : sermon.application
        parts.push('属灵操练。' + app)
      }
      if (sermon.encouragement) parts.push('勉励与安慰。' + sermon.encouragement)
      if (sermon.prayer) parts.push('祝祷。' + sermon.prayer)
    }

    // 10. 应用建议 (Application from Biblical Example)
    if (biblicalExample?.application || guidance?.coping_suggestions?.length) {
      const parts_app = ['应用建议 (Application from Biblical Example)']
      if (guidance?.coping_suggestions?.length) {
        parts_app.push('日常应对：' + guidance.coping_suggestions.join('。'))
      }
      if (biblicalExample?.application) {
        parts_app.push('圣经操练：' + biblicalExample.application)
      }
      parts.push(parts_app.join('。'))
    }

    // 11. 结语
    if (sermon?.conclusion) parts.push('结语与盼望。' + sermon.conclusion)

    return parts.join('\n\n')
  }

  // 选择最佳语音：优先高质量女声，支持中英文
  function selectBestVoice(voices) {
    // 优先的高质量女声名单（中文+英文支持）
    const preferredVoices = [
      'Xiaoxiao',      // 微软云希 中文女声
      'Tingting',      // 苹果婷婷
      'Yaoyao',        // 苹果瑶瑶
      'Meijia',        // 苹果美佳
      'Zhiyu',         // 微软云知
      'Xiaoyi',        // 微软云忆
      'Yunyang',       // 微软云扬（男声备选）
      'Microsoft Yaoyao',
      'Microsoft Xiaoxiao',
      'Microsoft Zhiyu',
      'Ting-Ting',
      'Google 普通话',
      'Google 國語',
    ]
    
    // 首先尝试找中文女声
    for (const name of preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(name) || v.voiceURI.includes(name)
      )
      if (voice) return voice
    }
    
    // fallback: 任何中文女声
    const zhFemale = voices.find(v => 
      v.lang?.startsWith('zh') && (v.name.includes('Female') || v.name.includes('女'))
    )
    if (zhFemale) return zhFemale
    
    // fallback: 任何中文语音
    const zhVoice = voices.find(v => v.lang?.startsWith('zh'))
    if (zhVoice) return zhVoice
    
    // 最后选择默认语音
    return voices[0] || null
  }


  // 使用浏览器原生 TTS（作为 fallback）
  function speakWithNativeTTS(text) {
    if (!window.speechSynthesis) {
      (window.showToast || window.alert)(i18nT('您的浏览器不支持文字转语音功能'), 'error')
      return
    }
    
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    // 按文本实际语言挑嗓音：英文内容用英文嗓音，中文用中文女声
    utter.lang = speechLangFor(text)
    utter.rate = 0.85
    utter.pitch = 1.05

    const bestVoice = pickVoiceFor(text) || selectBestVoice(window.speechSynthesis.getVoices())
    if (bestVoice) {
      utter.voice = bestVoice
      console.log('[TTS Native] 使用语音:', bestVoice.name)
    }
    
    utter.onstart = () => setTtsState('playing')
    utter.onend = () => setTtsState('idle')
    utter.onerror = (e) => {
      console.error('[TTS Native] 播放错误:', e)
      setTtsState('idle')
    }
    window.speechSynthesis.speak(utter)
  }

  async function speakContent() {
    const text = buildSpeakText()
    if (!text.trim()) return
    
    // 暂停/继续控制
    if (ttsState === 'playing') {
      if (googleTTSAudioRef.current) {
        googleTTSAudioRef.current.pause()
      } else {
        window.speechSynthesis.pause()
      }
      setTtsState('paused')
      return
    }
    if (ttsState === 'paused') {
      if (googleTTSAudioRef.current) {
        googleTTSAudioRef.current.play()
      } else {
        window.speechSynthesis.resume()
      }
      setTtsState('playing')
      return
    }
    
    // 停止之前的播放
    stopSpeaking()
    setTtsState('playing')
    
    try {
      // 优先后端高质量 TTS（ElevenLabs/Edge Neural）；按文本语言统一选嗓音
      const [lang, voiceName] = ttsServerParamsFor(text)
      console.log('[TTS] 尝试后端 TTS...', lang, voiceName)
      const audioBlob = await fetchTTS(text, lang, voiceName)
      
      // 创建音频元素播放
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      googleTTSAudioRef.current = audio
      
      audio.onended = () => {
        setTtsState('idle')
        googleTTSAudioRef.current = null
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = (e) => {
        console.error('[TTS Google] 播放错误:', e)
        setTtsState('idle')
        googleTTSAudioRef.current = null
      }
      
      await audio.play()
      console.log('[TTS] 使用 Google Cloud TTS 播放')
      
    } catch (error) {
      console.log('[TTS] Google Cloud 失败，fallback 到浏览器原生 TTS:', error.message)
      googleTTSAudioRef.current = null
      
      // Fallback 到浏览器原生 TTS
      speakWithNativeTTS(text)
    }
  }

  function stopSpeaking() {
    // 停止 Google TTS
    if (googleTTSAudioRef.current) {
      googleTTSAudioRef.current.pause()
      googleTTSAudioRef.current.currentTime = 0
      googleTTSAudioRef.current = null
    }
    // 停止原生 TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setTtsState('idle')
  }

  // 使用后端 API 进行语义标点添加
  async function addSemanticPunctuation(text) {
    if (!text) return text
    
    console.log('[punctuation] 开始语义标点处理，原文:', text)
    try {
      const response = await fetch('/api/punctuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        console.error('[punctuation] API失败:', response.status, errBody)
        return text
      }

      const data = await response.json()
      console.log('[punctuation] API返回:', data)
      return data.text || text
    } catch (err) {
      console.error('[punctuation] 请求异常:', err)
      return text
    }
  }

  // 检测文本语言（中文或英文）
  function detectTextLanguage(text) {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
    const totalChars = text.replace(/\s/g, '').length
    if (totalChars === 0) return 'unknown'
    return (chineseChars / totalChars) > 0.3 ? 'zh' : 'en'
  }

  // 翻译文本
  async function translateText(text, targetLang) {
    if (!text.trim()) return ''
    try {
      const prompt = targetLang === 'zh'
        ? `请将以下英文翻译成自然流畅的中文，保持原有的情感和语气：\n\n${text}\n\n请直接返回翻译结果，不要添加解释。`
        : `请将以下中文翻译成自然流畅的英文，保持原有的情感和语气：\n\n${text}\n\nPlease return only the translation without explanation.`

      const response = await runQuery({ query: prompt, enableRerank: false })
      return response?.text?.trim() || text
    } catch (err) {
      console.error('翻译失败:', err)
      return text
    }
  }

  // 润色倾诉文字
  async function polishQueryText(text, onPolished) {
    if (!text.trim()) return
    setIsPolishing(true)
    try {
      const prompt = `请帮我润色以下倾心吐意的内容，使其更加真诚、流畅、有属灵深度，同时保持原有的情感和恳求。

原文：${text}

要求：
1. 添加完整的标点符号（逗号、句号、问号、感叹号等），使语句通顺易读
2. 保持原文的情感和恳求语气
3. 润色后内容要自然、有属灵深度

请直接返回润色后的内容，不要添加解释或评论。`

      const response = await runQuery({ query: prompt, enableRerank: false })
      const polished = response?.text?.trim() || text
      onPolished(polished)
    } catch (err) {
      console.error('润色失败:', err)
      setRecordingError('文字润色失败，请检查网络连接')
    } finally {
      setIsPolishing(false)
    }
  }

  // 润色祷告文字
  async function polishPrayerText(text, onPolished) {
    if (!text.trim()) return
    setIsPolishing(true)
    try {
      const prompt = `请帮我润色以下祷告内容，使其更加真诚、流畅、有属灵深度，同时保持原有的情感和恳求。润色后内容不要超过500字。

原文：${text}

要求：
1. 添加完整的标点符号（逗号、句号、问号、感叹号等），使语句通顺易读
2. 保持祷告的真诚语气和属灵深度
3. 段落分明，便于阅读

请直接返回润色后的内容，不要添加解释或评论。`

      const response = await runQuery({ query: prompt, enableRerank: false })
      const polished = response?.text?.trim() || text
      onPolished(polished)
    } catch (err) {
      console.error('润色失败:', err)
      setRecordingError('文字润色失败，请检查网络连接')
    } finally {
      setIsPolishing(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isPolishing) {
      setRecordingError('正在润色中，请稍候...')
      return
    }
    await doQuery()
  }

  async function handleInstallApp() {
    const installed = await promptInstall()
    setCanInstall(false)
    setInstallMessage(installed ? '已触发安装，你可以将应用添加到主屏幕。' : '当前浏览器没有弹出安装确认，可使用浏览器菜单手动添加到主屏幕。')
  }

  async function handleVerseTrigger(feature) {
    setSelectedFeature(feature)
    // 清空旧内容并进入加载态：等「默想经文 + 灵魂处境 + 圣经榜样」全部生成后，一次性显示，避免逐块弹出
    setSelectedFeatureDetail(null)
    setSphereGuidance(null)
    setSpheresBiblicalExample(null)
    setSphereLoading(true)
    try {
      const parts = [feature.explanation, feature.zh_label].filter(Boolean)
      const q = parts.join('，')
      const [detail, g, be] = await Promise.all([
        fetchFeatureDetail(feature.feature_key).catch(() => null),
        fetchGuidance(q).catch(() => null),
        fetchBiblicalExample(q).catch(() => null),
      ])
      // 一次性写入，弹出层内容同时呈现
      setSelectedFeatureDetail(detail)
      setSphereGuidance(g)
      setSpheresBiblicalExample(be)
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setSphereLoading(false)
    }
    // Record emotion selection to MVFE timeline (logged-in users only)
    if (user && feature.zh_label) {
      const userId = String(user.id || user.email || 'default_user')
      fetch(`${API_BASE}/mvfe/record-emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          emotion_label: feature.zh_label,
          feature_key: feature.feature_key || '',
          intensity: 0.6,
        }),
      }).catch(() => {})
    }
  }

  function exportVersesToTxt() {
    if (!queryResult?.verse_summary && !sermon) return
    const docTitle = sermon ? '属灵星球 - 专属讲道' : '属灵星球 - 求赐恩言'
    let content = `${docTitle}\n`
    content += `倾心吐意：${query}\n`
    content += `日期：${new Date().toLocaleString('zh-CN')}\n\n`

    // 添加引导信息（带小标题，与页面一致）
    if (guidance) {
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      content += `  引导信息\n`
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      if (guidance.core_emotions?.length) {
        content += `【核心情绪】\n`
        content += `${guidance.core_emotions.join('、')}\n\n`
      }
      if (guidance.psychological_assessment) {
        content += `【心理评估】\n`
        content += `${guidance.psychological_assessment}\n\n`
      }
      if (sermon?.spiritual_diagnosis) {
        content += `【属灵剖析】\n`
        content += `${sermon.spiritual_diagnosis}\n\n`
      }
      if (guidance.core_need) {
        content += `【核心需要】\n`
        content += `${guidance.core_need}\n\n`
      }
      if (guidance.spiritual_guidance) {
        content += `【属灵引导】\n`
        content += `${guidance.spiritual_guidance}\n\n`
      }
    }

    // 添加圣经例子（带小标题）
    if (biblicalExample) {
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      content += `  圣经榜样\n`
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      if (biblicalExample.person) {
        content += `人物：${biblicalExample.person}`
        if (biblicalExample.era) content += ` (${biblicalExample.era})`
        content += `\n\n`
      }
      if (biblicalExample.similar_situation) {
        content += `【相似处境】\n`
        content += `${biblicalExample.similar_situation}\n\n`
      }
      if (biblicalExample.biblical_response) {
        content += `【圣经回应】\n`
        content += `${biblicalExample.biblical_response}\n\n`
      }
      if (biblicalExample.key_verse) {
        content += `【关键经文】\n`
        content += `${biblicalExample.key_verse}\n\n`
      }
    }

    // 添加历史见证
    if (sermon?.historical_case) {
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      content += `  历史见证\n`
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      const hc = sermon.historical_case
      if (hc.person) content += `人物：${hc.person}${hc.era ? ` (${hc.era})` : ''}\n`
      if (hc.story) content += `${hc.story}\n`
      if (hc.lesson) content += `${hc.lesson}\n`
      content += `\n`
    }

    // 添加讲道内容
    if (sermon) {
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      content += `  专属讲道${sermon.title ? `：${sermon.title}` : ''}\n`
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      if (sermon.theme_verse) {
        content += `【主题经文】\n`
        content += `${sermon.theme_verse}\n\n`
      }
      if (sermon.introduction) {
        content += `【引言】\n`
        content += `${sermon.introduction}\n\n`
      }
      sermon.sections?.forEach((sec) => {
        content += `【${sec.heading}】\n`
        content += `${sec.content}\n\n`
      })
      if (sermon.application) {
        content += `【属灵操练】\n`
        const appText = Array.isArray(sermon.application)
          ? sermon.application.join('\n')
          : (typeof sermon.application === 'object' ? JSON.stringify(sermon.application, null, 2) : sermon.application)
        content += `${appText}\n\n`
      }
      if (sermon.encouragement) {
        content += `【勉励与安慰】\n`
        content += `${sermon.encouragement}\n\n`
      }
      if (sermon.prayer) {
        content += `【祝祷】\n`
        content += `${sermon.prayer}\n\n`
      }
    }

    // 添加应用建议 (合并 5 & 10)
    if (biblicalExample?.application || guidance?.coping_suggestions?.length) {
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      content += `  应用建议 (Application from Biblical Example)\n`
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      if (guidance?.coping_suggestions?.length) {
        content += `【日常应对】\n`
        content += `${guidance.coping_suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`
      }
      if (biblicalExample?.application) {
        content += `【圣经操练】\n`
        content += `${biblicalExample.application}\n\n`
      }
    }

    // 添加结语与盼望
    if (sermon?.conclusion) {
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      content += `  结语与盼望\n`
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      content += `${sermon.conclusion}\n\n`
    }

    // 添加默想经文（放到最后）
    const groups = verseGroupsFromResult(queryResult, languageFilter)
    if (groups.length > 0) {
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      content += `  默想经文\n`
      content += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      groups.forEach(group => {
        content += `─── ${group.language === 'cuv' ? '中文（和合本）' : 'English (ESV)'} ───\n\n`
        group.items.forEach(item => {
          content += `▸ ${item.book_name} ${item.chapter}:${item.verse}\n`
          content += `${item.raw_text}\n\n`
        })
      })
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // Format filename: emotions or sermon title + datetime
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const datetime = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    let filenameBase
    if (guidance?.core_emotions?.length > 0) {
      // Use emotions joined by & for "求赐恩言"
      filenameBase = guidance.core_emotions.slice(0, 3).join('&')
    } else if (sermon?.title) {
      // Use sermon title for "专属讲道"
      const titleStr = typeof sermon.title === 'string' ? sermon.title : String(sermon.title)
      filenameBase = titleStr.replace(/[\\/:*?"<>|]/g, '')
    } else {
      filenameBase = '默想经文'
    }

    a.download = `${filenameBase}_${datetime}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportVersesToPdf() {
    if (!queryResult?.verse_summary && !sermon) return

    // Format filename
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const datetime = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    let filenameBase
    if (guidance?.core_emotions?.length > 0) {
      filenameBase = guidance.core_emotions.slice(0, 3).join('&')
    } else if (sermon?.title) {
      const titleStr = typeof sermon.title === 'string' ? sermon.title : String(sermon.title)
      filenameBase = titleStr.replace(/[\\/:*?"<>|]/g, '')
    } else {
      filenameBase = '默想经文'
    }
    const filename = `${filenameBase}_${datetime}.pdf`

    // PDF constants — dynamically import heavy libraries
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ])
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pdfWidth - margin * 2
    const contentHeight = pdfHeight - margin * 2
    let currentY = margin
    pdf.setFillColor(14, 23, 38); pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')

    // Helper to render HTML block and add to PDF with page break logic
    async function addBlockToPdf(htmlContent, isFirstPage = false) {
      const container = document.createElement('div')
      container.style.cssText = `position: fixed; left: -9999px; top: 0; width: ${contentWidth * 3.78}px; background:#0e1726; padding: 10px; font-family: "Microsoft YaHei", sans-serif; line-height: 1.6; color:#e8e8e8;`
      document.body.appendChild(container)
      container.innerHTML = htmlContent

      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#0e1726'
        })

        const imgHeightMm = (canvas.height / canvas.width) * contentWidth

        // Check if need new page (if not first page and won't fit)
        if (!isFirstPage && currentY + imgHeightMm > contentHeight + margin) {
          pdf.addPage()
          pdf.setFillColor(14, 23, 38); pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')
          currentY = margin
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.92)
        pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, imgHeightMm)
        currentY += imgHeightMm + 2 // 2mm gap between blocks

        // If this block is larger than a full page, handle pagination
        if (imgHeightMm > contentHeight) {
          // Content spans multiple pages - the addImage above already clipped to first page
          // Now we need to add the rest on subsequent pages
          let remainingHeight = imgHeightMm - contentHeight
          let offset = contentHeight

          while (remainingHeight > 0) {
            pdf.addPage()
            pdf.setFillColor(14, 23, 38); pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')
            pdf.addImage(imgData, 'JPEG', margin, margin - offset, contentWidth, imgHeightMm)
            offset += contentHeight
            remainingHeight -= contentHeight
          }
          currentY = margin + (imgHeightMm % contentHeight)
        }

        document.body.removeChild(container)
        return imgHeightMm
      } catch (err) {
        document.body.removeChild(container)
        throw err
      }
    }

    try {
      // Header block
      const pdfTitle = sermon ? '属灵星球 - 专属讲道' : '属灵星球 - 求赐恩言'
      await addBlockToPdf(`
        <h1 style="font-size: 20px; color: #007aff; margin: 0 0 10px 0;">${pdfTitle}</h1>
        <div style="font-size: 12px; color:#9a9a9a; margin-bottom: 5px;">倾心吐意：${escapeHtml(query)}<br>日期：${new Date().toLocaleString('zh-CN')}</div>
      `, true)

      // Guidance block
      if (guidance) {
        let guidanceHtml = '<div style="margin: 6px 0;"><div style="font-size: 14px; font-weight: bold; color: #444; margin-bottom: 4px; border-bottom: 1px solid #2e3c52; padding-bottom: 3px;">引导信息</div><div style="background: rgba(0,122,255,0.15); padding: 10px; border-radius: 8px; border: 1px solid rgba(0,122,255,0.25); color:#f0f0f0;">'
        if (guidance.core_emotions?.length) {
          guidanceHtml += `<div style="margin-bottom:8px;"><strong style="color:#5ea0ff;">核心情绪：</strong>${guidance.core_emotions.join('、')}</div>`
        }
        if (guidance.psychological_assessment) {
          guidanceHtml += `<div style="margin:12px 0;"><strong style="color:#5ea0ff;">心理评估</strong><div style="margin-top:6px;color:rgba(255,255,255,0.88);">${guidance.psychological_assessment.replace(/\n/g, '<br>')}</div></div>`
        }
        if (sermon?.spiritual_diagnosis) {
          guidanceHtml += `<div style="margin:12px 0;"><strong style="color:#5ea0ff;">属灵剖析</strong><div style="margin-top:6px;color:rgba(255,255,255,0.88);">${sermon.spiritual_diagnosis.replace(/\n/g, '<br>')}</div></div>`
        }
        if (guidance.core_need) {
          guidanceHtml += `<div style="margin-bottom:8px;"><strong style="color:#5ea0ff;">核心需要：</strong>${guidance.core_need}</div>`
        }
        if (guidance.spiritual_guidance) {
          guidanceHtml += `<div style="margin:12px 0;"><strong style="color:#5ea0ff;">属灵引导</strong><div style="margin-top:6px;color:rgba(255,255,255,0.88);">${guidance.spiritual_guidance.replace(/\n/g, '<br>')}</div></div>`
        }
        guidanceHtml += '</div></div>'
        await addBlockToPdf(guidanceHtml)
      }

      // Biblical example block
      if (biblicalExample) {
        let exampleHtml = '<div style="margin: 6px 0;"><div style="font-size: 14px; font-weight: bold; color: #444; margin-bottom: 4px; border-bottom: 1px solid #2e3c52; padding-bottom: 3px;">圣经例子</div><div style="background: rgba(0,122,255,0.15); padding: 10px; border-radius: 8px; border: 1px solid rgba(0,122,255,0.25); color:#f0f0f0;">'
        if (biblicalExample.person) {
          exampleHtml += `<div style="margin-bottom:8px;"><strong style="color:#5ea0ff;">人物：</strong>${biblicalExample.person}${biblicalExample.era ? ` (${biblicalExample.era})` : ''}</div>`
        }
        if (biblicalExample.similar_situation) {
          exampleHtml += `<div style="margin:12px 0;"><strong style="color:#5ea0ff;">相似处境</strong><div style="margin-top:6px;">${biblicalExample.similar_situation.replace(/\n/g, '<br>')}</div></div>`
        }
        if (biblicalExample.biblical_response) {
          exampleHtml += `<div style="margin:12px 0;"><strong style="color:#5ea0ff;">圣经回应</strong><div style="margin-top:6px;">${biblicalExample.biblical_response.replace(/\n/g, '<br>')}</div></div>`
        }
        if (biblicalExample.key_verse) {
          exampleHtml += `<div style="margin:12px 0;"><strong style="color:#5ea0ff;">关键经文</strong><div style="margin-top:6px;font-style:italic;color:rgba(255,255,255,0.88);">${biblicalExample.key_verse}</div></div>`
        }
        exampleHtml += '</div></div>'
        await addBlockToPdf(exampleHtml)
      }

      // 8. Historical case block
      if (sermon?.historical_case) {
        const hc = sermon.historical_case
        const caseHtml = `<div style="margin: 6px 0; background: rgba(0,122,255,0.15); padding: 10px; border-radius: 8px; border: 1px solid rgba(0,122,255,0.25);"><div style="font-size: 14px; font-weight: bold; color: #444; margin-bottom: 4px; border-bottom: 1px solid #2e3c52; padding-bottom: 3px;">历史见证</div><strong style="color:#5ea0ff;">${hc.person || ''}${hc.era ? ` (${hc.era})` : ''}</strong><p style="color:rgba(255,255,255,0.88);margin:6px 0 0 0;">${hc.story?.replace(/\n/g, '<br>') || ''}</p>${hc.lesson ? `<p style="color:rgba(255,255,255,0.7);margin-top:6px;font-style:italic;">${hc.lesson}</p>` : ''}</div>`
        await addBlockToPdf(caseHtml)
      }

      // 9. Sermon blocks
      if (sermon) {
        // Title block
        await addBlockToPdf(`<div style="margin: 6px 0; background: rgba(88,86,214,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(88,86,214,0.35);"><div style="font-size: 16px; font-weight: bold; color: #5b21b6; margin-bottom: 4px;">专属讲道：${sermon.title || ''}</div>${sermon.theme_verse ? `<div style="font-style:italic;margin-bottom:12px;color:rgba(255,255,255,0.7);">${sermon.theme_verse}</div>` : ''}</div>`)

        if (sermon.introduction) {
          await addBlockToPdf(`<div style="margin: 6px 0; background: rgba(88,86,214,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(88,86,214,0.35);"><p style="color:#f0f0f0;margin:0;">${sermon.introduction.replace(/\n/g, '<br>')}</p></div>`)
        }

        // Each section
        if (sermon.sections) {
          for (const sec of sermon.sections) {
            const sectionHtml = `<div style="margin: 6px 0; background: rgba(88,86,214,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(88,86,214,0.35);"><strong style="color:#6d28d9;">${sec.heading}</strong><p style="color:rgba(255,255,255,0.88);margin:6px 0 0 0;">${sec.content.replace(/\n/g, '<br>')}</p></div>`
            await addBlockToPdf(sectionHtml)
          }
        }

        if (sermon.application) {
          const appHtml = Array.isArray(sermon.application)
            ? `<ol style="padding-left:20px;margin:0;">${sermon.application.map(a => `<li style="margin:4px 0;">${a}</li>`).join('')}</ol>`
            : `<p style="margin:0;">${sermon.application.replace(/\n/g, '<br>')}</p>`
          await addBlockToPdf(`<div style="margin: 6px 0; background: rgba(88,86,214,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(88,86,214,0.35);"><strong style="color:#6d28d9;">属灵操练</strong><div style="color:rgba(255,255,255,0.88);margin-top:6px;">${appHtml}</div></div>`)
        }

        if (sermon.encouragement) {
          await addBlockToPdf(`<div style="margin: 6px 0; background: rgba(88,86,214,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(88,86,214,0.35);"><strong style="color:#6d28d9;">勉励与安慰</strong><p style="color:rgba(255,255,255,0.88);margin:6px 0 0 0;">${sermon.encouragement.replace(/\n/g, '<br>')}</p></div>`)
        }
        if (sermon.prayer) {
          await addBlockToPdf(`<div style="margin: 6px 0; background: rgba(88,86,214,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(88,86,214,0.35);"><strong style="color:#6d28d9;">祝祷</strong><p style="color:rgba(255,255,255,0.88);margin:6px 0 0 0;font-style:italic;">${sermon.prayer.replace(/\n/g, '<br>')}</p></div>`)
        }
      }

      // 10. Application block (Merged)
      if (biblicalExample?.application || guidance?.coping_suggestions?.length) {
        let appHtml = `<div style="margin: 6px 0; background: rgba(0,122,255,0.15); padding: 10px; border-radius: 8px; border: 1px solid rgba(0,122,255,0.25);"><div style="font-size: 14px; font-weight: bold; color: #444; margin-bottom: 4px; border-bottom: 1px solid #2e3c52; padding-bottom: 3px;">应用建议 (Application from Biblical Example)</div>`
        if (guidance?.coping_suggestions?.length) {
          appHtml += `<div style="margin-bottom:10px;"><strong style="color:#5ea0ff;">日常应对</strong><ul style="margin:6px 0;padding-left:20px;color:rgba(255,255,255,0.88);">${guidance.coping_suggestions.map(s => `<li style="margin:4px 0;">${s}</li>`).join('')}</ul></div>`
        }
        if (biblicalExample?.application) {
          appHtml += `<div><strong style="color:#5ea0ff;">圣经操练</strong><div style="color:rgba(255,255,255,0.88);margin-top:4px;">${biblicalExample.application.replace(/\n/g, '<br>')}</div></div>`
        }
        appHtml += '</div>'
        await addBlockToPdf(appHtml)
      }

      // 11. Conclusion block
      if (sermon?.conclusion) {
        await addBlockToPdf(`<div style="margin: 6px 0; background: rgba(88,86,214,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(88,86,214,0.35);"><strong style="color:#6d28d9;">结语与盼望</strong><p style="color:rgba(255,255,255,0.88);margin:6px 0 0 0;">${sermon.conclusion.replace(/\n/g, '<br>')}</p></div>`)
      }

      // 12. Meditated Verses block
      const groups = verseGroupsFromResult(queryResult, languageFilter)
      if (groups.length > 0) {
        let versesHtml = '<div style="margin: 6px 0;"><div style="font-size: 14px; font-weight: bold; color: #444; margin-bottom: 4px; border-bottom: 1px solid #2e3c52; padding-bottom: 3px;">默想经文</div>'
        groups.forEach(group => {
          versesHtml += `<div style="margin: 8px 0 4px; font-size: 12px; color:#9a9a9a; font-weight: 600;">${group.language === 'cuv' ? '中文（和合本）' : 'English (ESV)'}</div>`
          group.items.forEach(item => {
            versesHtml += `
              <div style="margin: 6px 0; padding: 10px; background:#1a2433; border-radius: 8px; border: 1px solid #2e3c52;">
                <div style="font-size: 11px; color: #007aff; font-weight: 600;">${item.book_name} ${item.chapter}:${item.verse}</div>
                <div style="font-size: 13px; margin-top: 4px; color:#f0f0f0;">${item.raw_text}</div>
              </div>
            `
          })
        })
        versesHtml += '</div>'
        await addBlockToPdf(versesHtml)
      }

      
      // Watermark on all pages
      const totalPages = pdf.internal.getNumberOfPages()
      for (let pg = 1; pg <= totalPages; pg++) {
        pdf.setPage(pg)
        pdf.setFontSize(9)
        pdf.setTextColor(180, 180, 180)
        pdf.text('https://holiness.uk/', pdfWidth / 2, pdfHeight - 4, { align: 'center' })
      }
      pdf.save(filename)
    } catch (err) {
      console.error('PDF generation failed:', err)
      (window.showToast || window.alert)(i18nT('PDF 生成失败，请重试'), 'error')
    }
  }

  async function saveToDevotionJournal() {
    if (!user) {
      setLoginMessage('请先登录，再保存灵修日记')
      setPendingPanel('sphere')
      setShowLogin(true)
      return
    }
    if (!guidance && !sermon && !faithQa) return
    setSavingJournal(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const titleParts = []
      if (query) titleParts.push(query.slice(0, 40))
      const title = titleParts.length ? titleParts[0] : '今日灵修'

      const verses = queryResult?.verse_summary?.slice(0, 3).map(v =>
        `${v.book_name} ${v.chapter}:${v.verse} — ${v.raw_text}`
      ).join('\n') || ''

      const observation = [
        guidance?.core_emotions?.length ? `核心情绪：${guidance.core_emotions.join('、')}` : '',
        guidance?.psychological_assessment ? `心理评估：${guidance.psychological_assessment}` : '',
        sermon?.spiritual_diagnosis ? `属灵剖析：${sermon.spiritual_diagnosis}` : '',
      ].filter(Boolean).join('\n\n')

      const reflection = [
        guidance?.spiritual_guidance ? `属灵引导：\n${guidance.spiritual_guidance}` : '',
        biblicalExample?.person ? `圣经榜样（${biblicalExample.person}）：\n${biblicalExample.similar_situation || ''}` : '',
        sermon?.introduction ? `讲道引言：\n${sermon.introduction}` : '',
        faithQa?.nature_analysis ? `信仰思考：\n${faithQa.nature_analysis}` : '',
      ].filter(Boolean).join('\n\n')

      const application = [
        guidance?.coping_suggestions?.length ? `日常应对：\n${guidance.coping_suggestions.join('\n')}` : '',
        sermon?.application ? `属灵操练：\n${Array.isArray(sermon.application) ? sermon.application.join('\n') : sermon.application}` : '',
        faithQa?.action_steps?.length ? `行动建议：\n${faithQa.action_steps.join('\n')}` : '',
      ].filter(Boolean).join('\n\n')

      const prayer = [
        sermon?.prayer || '',
        faithQa?.prayer_direction ? `\n${faithQa.prayer_direction}` : '',
      ].filter(Boolean).join('\n\n')

      await saveJournal({
        date: today,
        title,
        scripture: verses,
        observation,
        reflection,
        application,
        prayer,
        mood: guidance?.core_emotions?.[0] || '',
      }, getToken())

      setToast({ message: '✅ 已存入今日灵修日记！', type: 'success' })
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setToast({ message: `❌ 保存失败：${err.message}`, type: 'error' })
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setToast(null), 3000)
    } finally {
      setSavingJournal(false)
    }
  }

  // 分享深链：/?share=book:<id> 或 /?share=hymn:<id>
  useEffect(() => {
    try {
      const pathMatch = window.location.pathname.match(/^\/attention(?:\/([^/]+))?\/?$/)
      if (pathMatch) {
        setAttentionInitialSection(pathMatch[1] || 'dashboard')
        setTimeout(() => handlePanelSwitch('attention'), 60)
        return
      }
      const sp = new URLSearchParams(window.location.search)
      const panel = sp.get('panel')
      if (panel === 'attention') {
        const attentionSection = sp.get('attentionSection') || 'dashboard'
        setAttentionInitialSection(attentionSection)
        sp.delete('panel')
        sp.delete('attentionSection')
        const nextSearch = sp.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`)
        setTimeout(() => handlePanelSwitch('attention'), 60)
        return
      }
      if (panel === 'spiritual-formation') {
        const formationTab = sp.get('formationTab')
        if (formationTab) setFormationInitialTab(formationTab)
        sp.delete('panel')
        sp.delete('formationTab')
        const nextSearch = sp.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`)
        setTimeout(() => setActivePanel(panel), 60)
        return
      }
      const share = sp.get('share')
      if (!share) return
      const [kind, id] = share.split(':')
      if (!kind || !id) return
      window.__deepLink = { kind, id }
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => {
        if (kind === 'book') setActivePanel('devotion')
        else if (kind === 'hymn') setActivePanel('prayer')
      }, 60)
    } catch { /* ignore */ }
  }, [])

  function handlePanelSwitch(panel) {
    const needsLogin = ['mydevotion', 'prayer', 'devotion', 'journal', 'evangelism', 'checkin', 'sharewall', 'innerlife', 'soul-question', 'growth-map', 'partner', 'bible-reading', 'communion', 'voice', 'attention']
    if (needsLogin.includes(panel) && !user) {
      const messages = {
        mydevotion: '登录后记录和分享你的灵修日记',
        prayer: '登录后参与代祷和分享祷告需要',
        devotion: '登录后记录你的灵修成长',
        sharewall: '登录后查看分享墙内容',
        journal: '登录后查看主日信息',
        evangelism: '登录后参与传FY事工',
        checkin: '登录后打卡记录情绪',
        innerlife: '登录后使用属灵辨识与灵镜分析',
        mirror: '登录后查看圣经人物镜鉴',
        'soul-question': '登录后开始每日灵魂一问',
        'growth-map': '登录后查看你的灵命成长图谱',
        'partner': '登录后配对属灵伙伴',
        'bible-reading': '登录后记录圣经通读进度',
        'communion': '登录后与弟兄姊妹聊天和语音通话',
        'voice': '登录后创建群并发起多人实时语音通话',
        attention: '登录后使用守心模块，保存每日注意力立约',
      }
      setLoginMessage(messages[panel])
      setPendingPanel(panel)
      setShowLogin(true)
      // 即使未登录也设置 activePanel，让页面可以渲染登录页
      setActivePanel(panel)
      return
    }
    setActivePanel(panel)
  }

  function handlePastoralRoute(route) {
    const target = PASTORAL_ROUTE_TARGETS.app[route]
    if (route === 'crisis' || target === 'sos') {
      setShowSOS(true)
      return
    }
    if (route === 'guardian') {
      setGuardianWidgetMode('expanded')
      setQuery(i18nT('请像属灵守护者一样，陪我把今天的状态带到神面前，并给我一个合乎圣经、真实可行的下一步。'))
      return
    }
    if (target === 'spiritual-formation') {
      setFormationInitialTab(route === 'waiting' ? 'cross-lament-hope' : route === 'examen' ? 'daily' : 'home')
    }
    if (target) handlePanelSwitch(target)
  }

  function handleLoginSuccess(u) {
    setUser(u)  // Update React auth state so user is recognized
    setShowLogin(false)
    setShowLoginOverlay(false)
    setLoginOverlayMessage('')
    if (pendingPanel) {
      setActivePanel(pendingPanel)
      setPendingPanel(null)
      setLoginMessage('')
    } else {
      // No need to reload since state is now properly updated
      setActivePanel('sphere')
    }
  }

  function handleNeedLogin(message) {
    setLoginOverlayMessage(message || '请先登录后再继续操作')
    setShowLoginOverlay(true)
  }

  // 内嵌登录页 — 用 renderInlineLogin() 返回 JSX，避免定义为子组件导致每次渲染 unmount
  function renderInlineLogin() {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <LoginScreen
          onLogin={handleLoginSuccess}
          onBack={() => {
            setShowLogin(false)
            setPendingPanel(null)
            setLoginMessage('')
            setActivePanel('sphere')
          }}
          message={loginMessage}
        />
      </div>
    )
  }

    // Edit Profile Modal
    if (showEditProfile && user) {
      return (
        <div className="mobile-app-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{
            width: '100%', maxWidth: '360px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '24px',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', marginBottom: '20px', textAlign: 'center' }}>
              {i18nT('✏️ 修改资料')}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{i18nT('昵称')}</label>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value.slice(0, 50))}
                placeholder={i18nT('输入昵称')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{i18nT('头像 URL (可选)')}</label>
              <input
                type="text"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowEditProfile(false)}
                disabled={editProfileLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
              <button
                onClick={async () => {
                  if (!editNickname.trim()) return
                  setEditProfileLoading(true)
                  try {
                    const token = getToken()
                    await updateUserProfile({ nickname: editNickname.trim(), avatar: editAvatar.trim() }, token)
                    // Update local user data
                    const updatedUser = { ...user, nickname: editNickname.trim(), avatar: editAvatar.trim() }
                    setCachedUser(updatedUser)
                    setUser(updatedUser)
                    setShowEditProfile(false)
                  } catch (e) {
                    (window.showToast || window.alert)('保存失败: ' + e.message, 'error')
                  } finally {
                    setEditProfileLoading(false)
                  }
                }}
                disabled={!editNickname.trim() || editProfileLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg,#007aff,#5e5ce6)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: editNickname.trim() && !editProfileLoading ? 'pointer' : 'not-allowed',
                  opacity: editNickname.trim() && !editProfileLoading ? 1 : 0.5,
                }}
              >
                {editProfileLoading ? '💾 保存中…' : '💾 保存'}
              </button>
            </div>
            {/* 我的教会 */}
            <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{i18nT('⛪ 我的教会')}</div>
              {!myChurch ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{i18nT('尚未加入教会')}</span>
                  <button
                    onClick={() => { setShowEditProfile(false); setMyChurch(null); setChurchSkipped(false) }}
                    style={{ background: '#007aff', border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                  >{i18nT('加入 / 创建')}</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{myChurch.name}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.4)', color: '#60a5fa', borderRadius: 6, padding: '1px 7px' }}>{myChurch.role === 'owner' ? '创建者' : myChurch.role === 'admin' ? '管理员' : '成员'}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{myChurch.member_count} {i18nT('人')}</span>
                  </div>
                  {(myChurch.role === 'owner' || myChurch.role === 'admin') && myChurch.join_code && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{i18nT('邀请码')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: 3, color: '#007aff' }}>{myChurch.join_code}</span>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(myChurch.join_code).then(() => { setChurchCodeCopied(true); setTimeout(() => setChurchCodeCopied(false), 2000) }) }}
                          style={{ background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.4)', borderRadius: 7, padding: '3px 10px', color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}
                        >{churchCodeCopied ? '已复制 ✓' : '复制'}</button>
                        <button
                          disabled={churchRegenLoading}
                          onClick={async () => {
                            setChurchRegenLoading(true)
                            try {
                              const d = await regenerateChurchCode(getToken())
                              setMyChurch(prev => ({ ...prev, join_code: d.join_code }))
                              window.showToast?.('邀请码已更新', 'success')
                            } catch (e) { window.showToast?.(e.message, 'error') }
                            finally { setChurchRegenLoading(false) }
                          }}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '3px 10px', color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer' }}
                        >{churchRegenLoading ? '…' : '重新生成'}</button>
                      </div>
                    </div>
                  )}
                  {myChurch.role !== 'owner' && (
                    <button
                      disabled={churchLeaveLoading}
                      onClick={async () => {
                        if (!(await window.confirmDialog?.('确定退出「' + myChurch.name + '」？'))) return
                        setChurchLeaveLoading(true)
                        try {
                          await leaveChurch(getToken())
                          setMyChurch(null)
                          window.showToast?.('已退出教会', 'info')
                        } catch (e) { window.showToast?.(e.message, 'error') }
                        finally { setChurchLeaveLoading(false) }
                      }}
                      style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 8, padding: '7px 14px', color: '#ff3b30', fontSize: 13, cursor: 'pointer', width: '100%' }}
                    >{churchLeaveLoading ? '退出中…' : '退出教会'}</button>
                  )}
                </div>
              )}
            </div>

            {/* Recycle Bin Entry */}
            <button
              onClick={() => { setShowEditProfile(false); setShowRecycleBin(true) }}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {i18nT('🗑️ 回收站')}
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{i18nT('30天内可恢复')}</span>
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="mobile-app-shell">
        <header className="mobile-topbar">
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '22px', lineHeight: 1}}>🔮</span>
            <h1 className="mobile-app-title">{i18nT('属灵星球')}</h1>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <LanguageToggle />
            {user ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname || '用户'}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#007aff,#5e5ce6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(user.nickname || '用')[0]}
                  </div>
                )}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px'}}>
                  <span style={{fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {user.nickname || '弟兄'}
                  </span>
                  {user.lastLoginAt && (
                    <span style={{fontSize: '10px', color: 'rgba(255,255,255,0.45)'}} title={i18nT('最近登录时间')}>
                      {formatLoginTime(user.lastLoginAt)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setEditNickname(user?.nickname || ''); setEditAvatar(user?.avatar || ''); setShowEditProfile(true) }}
                  title={i18nT('修改资料')}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '7px', color: 'rgba(255,255,255,0.45)',
                    fontSize: '11px', padding: '3px 8px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '7px', color: 'rgba(255,255,255,0.45)',
                    fontSize: '11px', padding: '3px 8px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  🚪
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  background: 'linear-gradient(135deg,#007aff,#5e5ce6)',
                  border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
                }}
              >
                {i18nT('🔑 登录')}
              </button>
            )}
          </div>
        </header>

        {/* 语言切换固定入口：非首页(各 page-overlay 覆盖顶栏)时浮在右上角，z 高于所有 overlay；首页已在顶栏内显示 */}
        {activePanel !== 'sphere' && (
          <div style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            right: 'calc(env(safe-area-inset-right, 0px) + 10px)',
            zIndex: 1500,
          }}>
            <LanguageToggle />
          </div>
        )}

        <section className="mobile-hero-card glass" style={{padding: '8px 14px', minHeight: 'unset'}}>
          <div className="mobile-hero-meta" style={{gap: '6px', flexWrap: 'wrap'}}>
            <div className="meta-chip">{zoomLevel === 'far' ? '🌌 远景' : zoomLevel === 'mid' ? '🔭 中景' : '🔬 近景'}</div>
            {queryResult?.query_latency_ms != null && (
              <div className="meta-chip">⚡ {queryResult.query_latency_ms} ms</div>
            )}
            {selectedFeature?.zh_label && (
              <div className="meta-chip" style={{background: 'rgba(0,122,255,0.18)', color: '#5eb0ff', borderColor: 'rgba(0,122,255,0.25)'}}>✨ {selectedFeature.zh_label}</div>
            )}
          </div>
        </section>
        <main className="mobile-app-main" style={{display: 'block'}}>
          <section className="mobile-pane mobile-sphere-pane" style={{display: 'flex'}}>
            <div className="mobile-sphere-stage">
              <EmotionSphereScene 
                onVerseTrigger={handleVerseTrigger}
                expandedVerseId={expandedVerseId}
                versePrayers={versePrayers}
                versePrayerLoading={versePrayerLoading}
                handleVerseClick={handleVerseClick}
                onSelectFeature={setSelectedFeature}
              />
            </div>

            <div className="mobile-summary-grid">
              <div className="mobile-summary-card glass accent-card">
                <div className="section-title"></div>
                <div className="feature-name">{selectedFeature?.zh_label || ''}</div>
              </div>
            </div>
          </section>

          <section className="mobile-pane" style={{display: 'block'}}>
            <div className="mobile-card-stack">

              {/* 圣经地图 / 语音通话 快捷入口（置于今日灵命快照上方）*/}
              <div style={{ display: 'flex', gap: '4px', margin: '0 0 4px' }}>
                {[
                  { icon: '🎙', label: '语音通话', panel: 'voice' },
                  { icon: '💬', label: '圣徒相通', panel: 'communion' },
                  { icon: '🕸', label: '人物图谱', panel: 'mirror-graph' },
                  { icon: '🗺', label: '圣经地图', panel: 'bible-maps' },
                  { icon: '🚶', label: '天路历程', url: 'https://pilgrims.holiness.uk/' },
                ].map((item) => (
                  <button key={item.panel || item.url}
                    onClick={() => item.url ? window.open(item.url, '_blank', 'noopener,noreferrer') : handlePanelSwitch(item.panel)}
                    style={{
                      flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(2px, 0.8vw, 6px)',
                      fontSize: 'clamp(9px, 2.3vw, 13px)', padding: 'clamp(5px, 1.5vw, 9px) clamp(1px, 0.8vw, 8px)',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px', color: 'rgba(255,255,255,0.78)', cursor: 'pointer', fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>

              {/* 今日灵命快照卡 */}
              {user && dailySnapshot && (
                <section className="mobile-card glass" style={{
                  background: 'linear-gradient(135deg, rgba(88,86,214,0.18), rgba(0,122,255,0.12))',
                  border: '1px solid rgba(88,86,214,0.3)',
                  padding: '14px 16px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(180,180,255,0.7)', letterSpacing: '0.06em', marginBottom: '10px' }}>{i18nT('今日灵命快照')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {dailySnapshot.trajectory_label && (
                      <span style={{ fontSize: '12px', background: 'rgba(88,86,214,0.25)', border: '1px solid rgba(88,86,214,0.4)', borderRadius: '20px', padding: '3px 10px', color: '#c4b5fd' }}>
                        {dailySnapshot.trajectory_icon} {dailySnapshot.trajectory_label}
                      </span>
                    )}
                    {dailySnapshot.last_emotion && (
                      <span style={{ fontSize: '12px', background: 'rgba(0,122,255,0.18)', border: '1px solid rgba(0,122,255,0.3)', borderRadius: '20px', padding: '3px 10px', color: '#5eb0ff' }}>
                        💭 {dailySnapshot.last_emotion}
                      </span>
                    )}
                    {dailySnapshot.has_devotion_today ? (
                      <span style={{ fontSize: '12px', background: 'rgba(52,199,89,0.18)', border: '1px solid rgba(52,199,89,0.3)', borderRadius: '20px', padding: '3px 10px', color: '#34c759' }}>
                        {i18nT('📔 今日已灵修')}
                      </span>
                    ) : (
                      <span
                        style={{ fontSize: '12px', background: 'rgba(255,159,64,0.18)', border: '1px solid rgba(255,159,64,0.3)', borderRadius: '20px', padding: '3px 10px', color: '#ff9f40', cursor: 'pointer' }}
                        onClick={() => handlePanelSwitch('devotion')}
                      >
                        {i18nT('📔 今日未灵修')}
                      </span>
                    )}
                    {dailySnapshot.pending_prayers > 0 && (
                      <span
                        style={{ fontSize: '12px', background: 'rgba(255,215,0,0.14)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '20px', padding: '3px 10px', color: '#ffd700', cursor: 'pointer' }}
                        onClick={() => handlePanelSwitch('prayer')}
                      >
                        🙏 {dailySnapshot.pending_prayers} {i18nT('个待代祷')}
                      </span>
                    )}
                  </div>
                  {/* 快捷入口按钮行 */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { icon: '🔍', label: '每日一问', panel: 'soul-question' },
                      { icon: '🧭', label: '世界观', panel: 'worldview' },
                      { icon: '⏱', label: '2分钟灵修', action: () => setShowQuickDevotion(true) },
                      { icon: '📊', label: '灵命图谱', panel: 'growth-map' },
                      { icon: '📈', label: '灵命成长', panel: 'engineering' },
                      { icon: '🤝', label: '属灵伙伴', panel: 'partner' },
                      { icon: '📖', label: '读经&查经', panel: 'bible-reading' },
                      { icon: '📅', label: '麦琴读经', panel: 'mccheyne' },
                      { icon: '🃏', label: '记忆卡', panel: 'memory-deck' },
                      { icon: '🗃', label: '个人检索', panel: 'personal-search' },
                      { icon: '📦', label: '导出数据', panel: 'export-data' },
                    ].map((item, i) => (
                      <button key={i}
                        onClick={() => item.action ? item.action() : handlePanelSwitch(item.panel)}
                        style={{
                          fontSize: '11px', padding: '4px 10px',
                          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '20px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                        }}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                  {/* 灵修勉励语 */}
                  <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '12px', lineHeight: 1.7, color: 'rgba(255,255,255,0.62)' }}>
                    {i18nT('稳定的灵修生活是基督徒得力的源泉，也是基督徒生命成长的秘诀。祂的儿女蒙恩的方式，就是建立敬虔的灵修习惯并坚持每日操练灵修。坚持长期主义，必做元帅的精兵。每天太阳照常升起，我们也要每天向着天国奔跑，直到太阳不再升起的日子！')}
                  </p>
                </section>
              )}

              <PastoralPathCard compact onOpen={handlePastoralRoute} />

              {/* 情感轨迹卡 — 30天心路历程摘要 */}
              {user && emotionTrajectory && emotionTrajectory.count > 0 && (
                <section className="mobile-card glass" style={{
                  background: 'linear-gradient(135deg, rgba(255,149,0,0.12), rgba(255,45,85,0.08))',
                  border: '1px solid rgba(255,149,0,0.25)',
                  padding: '14px 16px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,200,120,0.75)', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    {i18nT('🌀 近30天情感轨迹')}
                  </div>
                  {/* 主导情绪 + 心情 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {emotionTrajectory.dominant_emotion && (
                      <span style={{ fontSize: '12px', background: 'rgba(255,149,0,0.22)', border: '1px solid rgba(255,149,0,0.4)', borderRadius: '20px', padding: '3px 10px', color: '#ffb347' }}>
                        {i18nT('💛 主导情绪：')}{emotionTrajectory.dominant_emotion}
                      </span>
                    )}
                    {emotionTrajectory.dominant_mood && (
                      <span style={{ fontSize: '12px', background: 'rgba(255,45,85,0.15)', border: '1px solid rgba(255,45,85,0.3)', borderRadius: '20px', padding: '3px 10px', color: '#ff6b8a' }}>
                        {i18nT('🌡 主导心情：')}{emotionTrajectory.dominant_mood}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '3px 10px', color: 'rgba(255,255,255,0.5)' }}>
                      {i18nT('共')} {emotionTrajectory.count} {i18nT('次打卡')}
                    </span>
                  </div>
                  {/* 情绪频次迷你条形图 */}
                  {emotionTrajectory.emotion_counts && Object.keys(emotionTrajectory.emotion_counts).length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      {Object.entries(emotionTrajectory.emotion_counts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([label, count]) => {
                          const maxCount = Math.max(...Object.values(emotionTrajectory.emotion_counts))
                          const pct = Math.round((count / maxCount) * 100)
                          return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', width: '72px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                              <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ff9500, #ff6b8a)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
                              </div>
                              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', width: '16px', textAlign: 'right' }}>{count}</span>
                            </div>
                          )
                        })}
                    </div>
                  )}
                  {/* 最近轨迹点 */}
                  {emotionTrajectory.items && emotionTrajectory.items.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {emotionTrajectory.items.slice(-6).map((item, i) => (
                        item.emotion_label ? (
                          <span key={i} title={`${item.date}\n${item.scenario || ''}`} style={{ fontSize: '10px', background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.2)', borderRadius: '12px', padding: '2px 7px', color: 'rgba(255,200,120,0.7)', cursor: 'default' }}>
                            {item.emotion_label}
                          </span>
                        ) : null
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="mobile-card glass">
                <div className="section-title" style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px'}}>
                  <span>🙏</span><span>{i18nT('倾心吐意')}</span>
                </div>
                <form className="query-form" onSubmit={handleSubmit}>
                  {/* 快速提示 */}
                  <div style={{margin: '0 0 10px 0'}}>
                    <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px'}}>{i18nT('✨ 你可以这样开始：')}</div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                      {[
                        '我感到很痛苦，也很想被安慰，但仍然想抓住一点盼望',
                        '我最近感到很焦虑，不知道神是否在乎我',
                        '我在工作中遭遇不公平，很难饶恕那个人',
                        '我对祷告感到疲惫，感觉神沉默不语',
                        '我和配偶之间有很深的隔阂，不知道怎么办',
                        '我重复犯同样的罪，非常自责',
                        '我想更亲近神，但不知从哪里开始',
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setQuery(s)}
                          style={{
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.8)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            lineHeight: 1.4,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label style={{position: 'relative'}}>
                    <span style={{display: 'none'}}></span>
                    <textarea
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); if (checkSOSKeywords(e.target.value)) setShowSOS(true) }}
                      onFocus={() => {
                        // 获得焦点时如果是默认文字则清空
                        if (query === DEFAULT_QUERY_TEXT) {
                          setQuery('')
                        }
                      }}
                      placeholder={DEFAULT_QUERY_TEXT}
                      style={{minHeight: '80px'}}
                    />
                  </label>
                  {/* 按钮行：录音 + 润色 */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '12px',
                    justifyContent: 'flex-end',
                    alignItems: 'stretch',
                    flexWrap: 'wrap',
                  }}>
                    <VoiceHoldButton
                      speech={{
                        isRecording,
                        recordingSeconds,
                        maxRecordingSeconds,
                        recordingError,
                        speechPhase,
                        isTranscribing,
                        startRecording,
                        stopRecording,
                        cancelRecording,
                      }}
                      clearBeforeStart={() => {
                        if (query === DEFAULT_QUERY_TEXT) setQuery('')
                      }}
                      disabled={loading || isTranscribing}
                      variant="home"
                      showOverlay
                      style={{ flex: '1 1 190px' }}
                    />
                    {/* 润色按钮 - 微信浏览器隐藏，提示用外部浏览器 */}
                    {!isWeChat && (
                    <button
                      type="button"
                      onClick={() => { 
                        const prev = query
                        // 不清空输入框，保持原文显示，润色完成后直接替换
                        polishQueryText(prev, (text) => {
                          setQuery(text)
                          // 显示成功提示
                          setToast({ message: '✨ 文字已润色完成', type: 'success' })
                          if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
                          toastTimerRef.current = setTimeout(() => setToast(null), 3000)
                        })
                      }}
                      disabled={!query.trim() || isPolishing || loading}
                      style={{
                        padding: '0 20px',
                        height: '40px',
                        borderRadius: '20px',
                        border: 'none',
                        background: isPolishing
                          ? 'linear-gradient(135deg, #34c759, #30d158)'
                          : 'linear-gradient(135deg, #ff9500, #ff6b35)',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: (!query.trim() || isPolishing || loading) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(255, 149, 0, 0.3)',
                        opacity: (!query.trim() || isPolishing || loading) ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                      }}
                      title={i18nT('润色文字：使用AI优化表达，使其更流畅、有属灵深度')}
                    >
                      <span>{isPolishing ? '✨' : '✏️'}</span>
                      <span>{isPolishing ? '润色中…' : '润色'}</span>
                    </button>
                    )}
                    {/* 微信内置浏览器提示 */}
                    {isWeChat && (
                      <div style={{
                        padding: '8px 12px',
                        background: '#fff3cd',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#856404',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flex: 1,
                      }}>
                        <span>⚠️</span>
                        <span>{i18nT('微信内若无法唤起麦克风，请用 Safari/Chrome 打开')}</span>
                      </div>
                    )}
                  </div>
                  {recordingError && (
                    <div style={{
                      fontSize: '12px',
                      color: '#ff6b6b',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ⚠️ {recordingError}
                    </div>
                  )}

                  {/* Toast 提示 */}
                  {toast && (
                    <div style={{
                      fontSize: '12px',
                      color: toast.type === 'success' ? '#34c759' : '#ff6b6b',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      {toast.message}
                    </div>
                  )}

                  <div style={{display: 'none'}}>
                    <div className="segmented-control mobile-language-switch" style={{flex: 1}}>
                      {[
                        ['cuv', '和合本'],
                        ['esv', 'ESV'],
                      ].map(([value, label]) => (
                        <button
                          type="button"
                          key={value}
                          className={languageFilter === value ? 'segment active' : 'segment'}
                          onClick={() => setLanguageFilter(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>


                  <div style={{display: 'flex', gap: '8px', flexDirection: 'column'}}>
                    <button
                      className="primary-btn mobile-submit-btn"
                      type="submit"
                      disabled={loading}
                      style={{width: '100%'}}
                      onClick={() => {
                        const newCount = gardenClickCount + 1
                        setGardenClickCount(newCount)
                        setActivePanel('garden')
                        if (newCount > 2) {
                          setGuidance(null)
                          setBiblicalExample(null)
                          setQueryResult(null)
                          setSermon(null)
                        }
                      }}
                    >
                      {loading ? '⏳ 祷告中...' : '🌿 求赐恩言'}
                    </button>
                    {/* 从情绪/引导结果中提炼神学问题建议 */}
                    {guidance && !faithQa && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{i18nT('💡 可以这样提问：')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {[
                            guidance.core_need ? `面对"${guidance.core_need.slice(0, 20)}"，圣经如何回应？` : null,
                            guidance.core_emotions?.length ? `当我感到${guidance.core_emotions.slice(0, 2).join('、')}时，神在哪里？` : null,
                            guidance.spiritual_guidance ? '神允许痛苦存在，祂的目的是什么？' : null,
                          ].filter(Boolean).slice(0, 2).map((suggestion, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setQuery(suggestion)}
                              style={{
                                fontSize: '12px', textAlign: 'left', background: 'rgba(88,86,214,0.15)',
                                border: '1px solid rgba(88,86,214,0.3)', borderRadius: '8px',
                                color: 'rgba(200,190,255,0.9)', padding: '6px 10px', cursor: 'pointer',
                                lineHeight: 1.4,
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      className="primary-btn mobile-submit-btn"
                      type="button"
                      disabled={faithQaLoading}
                      style={{width: '100%'}}
                      onClick={async () => {
                        const q = (query || '').trim() || DEFAULT_QUERY_TEXT
                        if (!q) return
                        setFaithQa(null)
                        setFaithQaError(null)
                        setFaithQaLoading(true)
                        try {
                          const result = await fetchFaithQA(q)
                          setFaithQa(result)
                        } catch (err) {
                          setFaithQaError(String(err.message || err))
                        } finally {
                          setFaithQaLoading(false)
                        }
                      }}
                    >
                      {faithQaLoading ? '⏳ 思考中...' : '📖 提问'}
                    </button>
                    {/* 经文搜索：凭印象找经文（语义检索），置于提问按钮之下，同款蓝色 */}
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ width: '100%', marginTop: '8px' }}
                      onClick={() => handlePanelSwitch('bible-search')}
                    >
                      {i18nT('🔍 经文搜索（凭印象找经文）')}
                    </button>
                    {/* 短视频功能已隐藏 */}
                  </div>
                </form>
              </section>
              <section className="mobile-pane" style={{display: 'none'}}>
                <div className="segmented-control view-mode-toggle" style={{flex: '0 0 auto'}}>
                  <button
                      type="button"
                      className={comparisonMode ? 'segment active' : 'segment'}
                      onClick={() => setComparisonMode(true)}
                  >
                    {i18nT('中英对照')}
                  </button>
                  <button
                      type="button"
                      className={!comparisonMode ? 'segment active' : 'segment'}
                      onClick={() => setComparisonMode(false)}
                  >
                    {i18nT('分语言')}
                  </button>
                </div>
              </section>

            </div>
          </section>

          <section className="mobile-pane" style={{display: 'block', marginTop: '20px'}}>
            <div className="mobile-card-stack">

              {(guidance || biblicalExample || queryResult || sermon) && (
                <section className="result-unified-card mobile-card guidance-section">

                  {/* 整体播放 ── 读出所有当前结果 */}
                  <TTSFullBar
                    label={i18nT('整体播放')}
                    buildText={() => {
                      const parts = []
                      if (guidance?.core_emotions?.length) parts.push('核心情绪：' + guidance.core_emotions.join('、'))
                      if (guidance?.psychological_assessment) parts.push('心理评估：' + guidance.psychological_assessment)
                      if (sermon?.spiritual_diagnosis) parts.push('属灵剖析：' + sermon.spiritual_diagnosis)
                      if (guidance?.core_need) parts.push('核心需要：' + guidance.core_need)
                      if (guidance?.spiritual_guidance) parts.push('属灵引导：' + guidance.spiritual_guidance)
                      if (biblicalExample) {
                        const be = []
                        if (biblicalExample.person) be.push('人物：' + biblicalExample.person)
                        if (biblicalExample.similar_situation) be.push('相似处境：' + biblicalExample.similar_situation)
                        if (biblicalExample.biblical_response) be.push('圣经回应：' + biblicalExample.biblical_response)
                        if (biblicalExample.key_verse) be.push('关键经文：' + biblicalExample.key_verse)
                        if (be.length) parts.push('圣经榜样。' + be.join('。'))
                      }
                      if (sermon) {
                        if (sermon.title) parts.push('专属讲道：' + sermon.title)
                        if (sermon.theme_verse) parts.push('主题经文：' + sermon.theme_verse)
                        if (sermon.introduction) parts.push('引言：' + sermon.introduction)
                        sermon.sections?.forEach(s => { if (s.content) parts.push(s.heading + '：' + s.content) })
                        if (sermon.encouragement) parts.push('勉励与安慰：' + sermon.encouragement)
                        if (sermon.prayer) parts.push('祝祷：' + sermon.prayer)
                        if (sermon.conclusion) parts.push('结语：' + sermon.conclusion)
                      }
                      return parts.join(`\n\n`)
                    }}
                  />

                  <div style={{color: '#FFD700', fontWeight: 'bold'}}>

                    {/* 1. 核心情绪 */}
                    {guidance?.core_emotions?.length > 0 && (
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('核心情绪')}<TTSButton text={guidance.core_emotions.join("、")} /></div>
                        <div className="guidance-emotions">
                          {guidance.core_emotions.map((e) => (
                            <span key={e} className="emotion-tag">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. 心理评估 */}
                    {guidance?.psychological_assessment && (
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('心理评估')}<TTSButton text={guidance.psychological_assessment} /></div>
                        <TranslatableParagraph className="result-body-text">{guidance.psychological_assessment}</TranslatableParagraph>
                      </div>
                    )}

                    {/* 3. 属灵剖析 (从专属讲道提取) */}
                    {sermon?.spiritual_diagnosis && (
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('属灵剖析')}<TTSButton text={sermon.spiritual_diagnosis} /></div>
                        <TranslatableParagraph className="result-body-text">{sermon.spiritual_diagnosis}</TranslatableParagraph>
                      </div>
                    )}

                    {/* 4. 核心需要 */}
                    {guidance?.core_need && (
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('核心需要')}<TTSButton text={guidance.core_need} /></div>
                        <div className="result-core-need">{guidance.core_need}</div>
                      </div>
                    )}

                    {/* 6. 属灵引导 */}
                    {guidance?.spiritual_guidance && (
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('属灵引导')}<TTSButton text={guidance.spiritual_guidance} /></div>
                        <div className="result-spiritual-block">
                          <TranslatableParagraph>{guidance.spiritual_guidance}</TranslatableParagraph>
                        </div>
                      </div>
                    )}

                    {/* 7. 圣经榜样 (不含应用) */}
                    {biblicalExample && (
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('圣经榜样')}<TTSButton text={[biblicalExample.person,biblicalExample.similar_situation,biblicalExample.biblical_response,biblicalExample.key_verse].filter(Boolean).join("。")} /></div>
                        <div className="result-person-row">
                          <span className="result-person-name">{biblicalExample.person}</span>
                          {biblicalExample.era && <span className="result-person-era">{biblicalExample.era}</span>}
                        </div>
                        {biblicalExample.similar_situation && (
                          <>
                            <div className="result-sub-label">{i18nT('相似处境')}</div>
                            <TranslatableParagraph className="result-body-text">{biblicalExample.similar_situation}</TranslatableParagraph>
                          </>
                        )}
                        {biblicalExample.biblical_response && (
                          <>
                            <div className="result-sub-label">{i18nT('圣经回应')}</div>
                            <TranslatableParagraph className="result-body-text">{biblicalExample.biblical_response}</TranslatableParagraph>
                          </>
                        )}
                        {biblicalExample.key_verse && (
                          <>
                            <div className="result-sub-label">{i18nT('关键经文')}</div>
                            <div className="result-spiritual-block">
                              <TranslatableParagraph style={{fontStyle: 'italic', margin: 0}}>{biblicalExample.key_verse}</TranslatableParagraph>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* 8. 历史见证 (从专属讲道提取) */}
                    {sermon?.historical_case && (
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('历史见证')}<TTSButton text={[sermon.historical_case.person,sermon.historical_case.story,sermon.historical_case.lesson].filter(Boolean).join("。")} /></div>
                        <div className="result-person-row">
                          <span className="result-person-name">{sermon.historical_case.person}</span>
                          {sermon.historical_case.era && <span className="result-person-era">{sermon.historical_case.era}</span>}
                        </div>
                        <TranslatableParagraph className="result-body-text">{sermon.historical_case.story}</TranslatableParagraph>
                        {sermon.historical_case.lesson && (
                          <div className="result-core-need">{sermon.historical_case.lesson}</div>
                        )}
                      </div>
                    )}

                  {/* 9. 专属讲道 */}
                  {sermon && (
                    <>
                      <div className="result-block">
                        <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>
                        {i18nT('专属讲道：')}{sermon.title}
                        <TTSButton text={[sermon.title, sermon.theme_verse, sermon.introduction, ...(sermon.sections||[]).map(s=>s.heading+'：'+s.content), sermon.encouragement, sermon.prayer].filter(Boolean).join('\n\n')} />
                      </div>
                        {sermon.theme_verse && (
                          <div className="result-spiritual-block" style={{marginBottom: '16px'}}>
                            <TranslatableParagraph style={{margin: 0, fontStyle: 'italic'}}>{sermon.theme_verse}</TranslatableParagraph>
                          </div>
                        )}

                        {sermon.introduction && (
                          <>
                            <div className="result-sub-label">{i18nT('引言')}</div>
                            <TranslatableParagraph className="result-body-text">{sermon.introduction}</TranslatableParagraph>
                          </>
                        )}

                        {sermon.sections?.map((sec, i) => (
                          <div key={i}>
                            <div className="result-divider" />
                            <div className="sermon-section-heading">{sec.heading}</div>
                            <TranslatableParagraph className="result-body-text">{sec.content}</TranslatableParagraph>
                            {sec.supporting_verse && (
                              <div className="result-spiritual-block">
                                <TranslatableParagraph style={{margin: 0, fontStyle: 'italic', fontSize: '12px'}}>{sec.supporting_verse}</TranslatableParagraph>
                              </div>
                            )}
                          </div>
                        ))}

                        {sermon.application && (
                          <>
                            <div className="result-divider" />
                            <div className="result-sub-label">{i18nT('属灵操练')}</div>
                            <TranslatableParagraph className="result-body-text" style={{whiteSpace: 'pre-line'}}>{Array.isArray(sermon.application) ? sermon.application.join('\n') : sermon.application}</TranslatableParagraph>
                          </>
                        )}

                        {sermon.encouragement && (
                          <>
                            <div className="result-divider" />
                            <div className="result-sub-label">{i18nT('勉励与安慰')}</div>
                            <TranslatableParagraph className="result-body-text">{sermon.encouragement}</TranslatableParagraph>
                          </>
                        )}

                        {sermon.prayer && (
                          <>
                            <div className="result-divider" />
                            <div className="result-sub-label">{i18nT('祝祷')}</div>
                            <div className="result-spiritual-block">
                              <TranslatableParagraph style={{margin: 0, whiteSpace: 'pre-line'}}>{sermon.prayer}</TranslatableParagraph>
                            </div>
                          </>
                        )}

                      </div>
                    </>
                  )}

                   {/* 10. 应用建议 (合并 5 & 10) */}
                  {(biblicalExample?.application || guidance?.coping_suggestions?.length > 0) && (
                    <div className="result-block">
                      <div className="result-block-title">{i18nT('应用建议 (Application from Biblical Example)')}</div>
                      
                      {guidance?.coping_suggestions?.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <div className="result-sub-label">{i18nT('日常应对')}</div>
                          <ul className="guidance-tips" style={{ marginTop: '4px' }}>
                            {guidance.coping_suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {biblicalExample?.application && (
                        <div>
                          <div className="result-sub-label">{i18nT('圣经操练')}</div>
                          <div className="result-core-need" style={{ marginTop: '4px' }}>{biblicalExample.application}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 11. 结语与盼望 */}
                  {sermon?.conclusion && (
                    <div className="result-block">
                      <div className="result-block-title" style={{display:"flex",alignItems:"center",gap:6}}>{i18nT('结语与盼望')}<TTSButton text={sermon.conclusion} /></div>
                      <TranslatableParagraph className="result-body-text">{sermon.conclusion}</TranslatableParagraph>
                    </div>
                  )}

                  {/* 12. 默想经文 */}
                  {queryResult && (
                    <div className="result-block">
                      <div className="result-block-title result-block-title-meditation">{i18nT('默想经文')}</div>
                      {selectedFeature && (
                        <div className="result-feature-pill">
                          {selectedFeature.zh_label || `${selectedFeature.layer}:${selectedFeature.feature_id}`}
                        </div>
                      )}
                      {queryResult.rerank?.enabled && queryResult.rerank?.error && (
                        <div className="rerank-warning">{i18nT('⚠️ Rerank 降级：')}{queryResult.rerank.error}</div>
                      )}
                      <div className="verse-list">
                        {verseGroups.flatMap((group) =>
                          group.items.map((item) => (
                            <div key={item.pk_id}>
                              <div
                                className={`verse-item ${expandedVerseId === item.pk_id ? 'verse-item-expanded' : ''}`}
                                onClick={() => handleVerseClick(item)}
                                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                              >
                                <div className="verse-ref-ui" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{item.book_name} {item.chapter}:{item.verse}</span>
                                  <span style={{ fontSize: '11px', color: '#FFD700', fontWeight: 700, opacity: 0.8, transition: 'transform 0.3s', transform: expandedVerseId === item.pk_id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                </div>
                                <div className="verse-text-ui">{item.raw_text}</div>
                              </div>
                              {expandedVerseId === item.pk_id && (
                                <div style={{
                                  padding: '12px 14px',
                                  margin: '0 0 8px 0',
                                  background: 'rgba(99,179,237,0.06)',
                                  borderRadius: '0 0 10px 10px',
                                  borderLeft: '3px solid rgba(99,179,237,0.4)',
                                  animation: 'fadeIn 0.3s ease',
                                }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFD700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🙏</span> {i18nT('经文祷告')}
                                  </div>
                                  {versePrayerLoading === item.pk_id ? (
                                    <div style={{ fontSize: '13px', color: '#FFD700', fontWeight: 700, fontStyle: 'italic' }}>{i18nT('✨ 正在生成祷告...')}</div>
                                  ) : versePrayers[item.pk_id] ? (
                                    <div style={{ fontSize: '13px', color: '#FFD700', fontWeight: 700, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                      {versePrayers[item.pk_id]}
                                    </div>
                                  ) : null}

                                  {/* 默想此经文（展开即自动生成，直接显示） */}
                                  <div style={{ marginTop: '12px', borderTop: '1px solid rgba(99,179,237,0.2)', paddingTop: '10px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#63b3ed', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>🤔</span> {i18nT('默想此经文')}
                                    </div>
                                    {meditationLoading === item.pk_id ? (
                                      <div style={{ fontSize: '13px', color: '#63b3ed', fontStyle: 'italic' }}>{i18nT('✨ 正在生成默想...')}</div>
                                    ) : meditationQuestions[item.pk_id] ? (
                                      <ol style={{ margin: '0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {meditationQuestions[item.pk_id].map((q, qi) => (
                                          <li key={qi} style={{ fontSize: '13px', color: 'rgba(180,210,255,0.9)', lineHeight: 1.7 }}>{q}</li>
                                        ))}
                                      </ol>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  </div>
                </section>
              )}

              {error ? <div className="error-box">{error}</div> : null}

              {(queryResult?.verse_summary || sermon || guidance || faithQa) && (
                <div className="export-bar">
                  <button
                    className="export-btn"
                    onClick={saveToDevotionJournal}
                    disabled={savingJournal}
                    title={i18nT('存入今日灵修日记')}
                    style={{ color: '#34c759', borderColor: 'rgba(52,199,89,0.4)' }}
                  >
                    📔 {savingJournal ? '保存中...' : '存入灵修'}
                  </button>
                  <button className="export-btn" onClick={exportVersesToTxt} title={i18nT('导出TXT')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    {i18nT('导出TXT')}
                  </button>
                  <button className="export-btn" onClick={exportVersesToPdf} title={i18nT('导出PDF')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <path d="M9 15l3 3 3-3"/>
                      <path d="M12 18V9"/>
                    </svg>
                    {i18nT('导出PDF')}
                  </button>

                </div>
              )}

              {/* 信仰问答结果卡片 */}
              {faithQaError && (
                <section className="result-unified-card mobile-card guidance-section">
                  <div className="result-block-title" style={{color: '#ff6b6b'}}>{i18nT('提问失败')}</div>
                  <p className="result-body-text" style={{color: '#ff6b6b'}}>{faithQaError}</p>
                </section>
              )}
              {faithQa && (
                <section className="result-unified-card mobile-card guidance-section">
                  <div style={{color: '#FFD700', fontWeight: 'bold'}}>

                    <div className="result-block">
                      <div className="result-block-title">{i18nT('📖 信仰问答')}</div>
                      {faithQa.question_summary && (
                        <div className="result-core-need" style={{marginBottom: '4px'}}>{faithQa.question_summary}</div>
                      )}
                    </div>

                    {faithQa.nature_analysis && (
                      <div className="result-block">
                        <div className="result-block-title">{i18nT('问题本质分析')}</div>
                        <TranslatableParagraph className="result-body-text">{faithQa.nature_analysis}</TranslatableParagraph>
                      </div>
                    )}

                    {faithQa.contextual_analysis && (
                      <div className="result-block">
                        <div className="result-block-title">{i18nT('具体情景分析')}</div>
                        <TranslatableParagraph className="result-body-text">{faithQa.contextual_analysis}</TranslatableParagraph>
                      </div>
                    )}

                    {faithQa.scriptures?.length > 0 && (
                      <div className="result-block">
                        <div className="result-block-title">{i18nT('圣经中最适配的经文')}</div>
                        {faithQa.scriptures.map((s, i) => (
                          <div key={i} style={{marginBottom: '12px'}}>
                            <div className="result-sub-label">{s.reference}</div>
                            <div className="result-spiritual-block">
                              <TranslatableParagraph style={{fontStyle: 'italic', margin: '0 0 6px 0'}}>{s.text}</TranslatableParagraph>
                            </div>
                            {s.relevance && (
                              <TranslatableParagraph className="result-body-text" style={{marginTop: '4px'}}>{s.relevance}</TranslatableParagraph>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {faithQa.right_thinking && (
                      <div className="result-block">
                        <div className="result-block-title">{i18nT('如何正确思考')}</div>
                        <div className="result-spiritual-block">
                          <TranslatableParagraph style={{margin: 0}}>{faithQa.right_thinking}</TranslatableParagraph>
                        </div>
                      </div>
                    )}

                    {faithQa.action_steps?.length > 0 && (
                      <div className="result-block">
                        <div className="result-block-title">{i18nT('建议行动')}</div>
                        <ul className="guidance-tips">
                          {faithQa.action_steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {faithQa.prayer_direction && (
                      <div className="result-block">
                        <div className="result-block-title">{i18nT('祷告方向示范')}</div>
                        <div className="result-spiritual-block">
                          <TranslatableParagraph style={{margin: 0, whiteSpace: 'pre-line'}}>{faithQa.prayer_direction}</TranslatableParagraph>
                        </div>
                      </div>
                    )}

                  </div>
                </section>
              )}

              {historyItems.length > 0 && (
              <section className="mobile-card glass">
                <div className="section-title" style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px'}}>
                  <span>🕐</span><span>{i18nT('最近祷告')}</span>
                </div>
                <div className="history-list">
                  {historyItems.slice(0, 8).map((item, idx) => (
                      <button
                          key={`${item.query_text}-${idx}`}
                          className="history-item"
                          onClick={() => { setQuery(item.query_text) }}
                      >
                        <span style={{fontSize:'12px', opacity:0.4, marginRight:'6px', flexShrink:0}}>›</span>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.query_text}</span>
                      </button>
                  ))}
                </div>
              </section>
              )}

              {/*   <section className="mobile-card glass">
                <div className="section-title">球体状态</div>
                <div className="meta-card-inline">
                  <div className="meta-title">LOD</div>
                  <div className="meta-value">{zoomLevel === 'far' ? '远景：显示簇' : zoomLevel === 'mid' ? '中景：显示部分标签' : '近景：显示具体点与标签'}</div>
                </div>
                <div className="meta-card-inline">
                  <div className="meta-title">Latency</div>
                  <div className="meta-value">{queryResult?.query_latency_ms != null ? `${queryResult.query_latency_ms} ms` : '等待查询'}</div>
                </div>
              </section> */}
              <section className="mobile-card glass">
                <div className="section-title">{i18nT('安装到手机')}</div>
                <div className="muted">{i18nT('将当前页面添加到主屏幕，获得更接近原生 App 的体验。')}</div>
                {canInstall ? (
                    <button className="primary-btn install-btn" type="button" onClick={handleInstallApp}>{i18nT('📲 安装')}</button>
                ) : null}
                {!canInstall && showIosInstallHint ? (
                    <div className="install-hint">{i18nT('iPhone 请在 Safari 中点击"分享" → "添加到主屏幕"。')}</div>
                ) : null}
                {installMessage ? <div className="install-hint">{installMessage}</div> : null}
                <div className="quick-action-list" style={{marginTop: '12px'}}>
                  <button className="segment active" type="button"
                          onClick={(e) => { const c = e.currentTarget.closest('.mobile-app-shell'); (c || window).scrollTo({top: 0, behavior: 'smooth'}) }}>{i18nT('⬆️ 回顶部')}
                  </button>
                </div>
              </section>
              <section className="mobile-card glass stats-gradient">
                <div className="section-title">{i18nT('📊 访问统计')}</div>
                <div className="stats-cards">
                  <div className="stats-card">
                    <div className="stats-pulse"></div>
                    <div className="stats-icon">👁</div>
                    <div className="stats-value">{Number(visitStats?.page_views || 0).toLocaleString()}</div>
                    <div className="stats-label">{i18nT('总浏览量')}</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-icon">👤</div>
                    <div className="stats-value">{Number(visitStats?.unique_visitors || 0).toLocaleString()}</div>
                    <div className="stats-label">{i18nT('独立访客')}</div>
                  </div>
                </div>
                <div className="muted" style={{fontSize: '11px', marginTop: '10px', textAlign: 'center'}}>
                  {i18nT('实时统计 · 持久化存储')}
                </div>
              </section>
            </div>
          </section>

          {/* 站点声明页脚 */}
          <footer style={{ textAlign: 'center', padding: '18px 16px 8px', fontSize: 12,
            color: 'rgba(255,255,255,0.35)', lineHeight: 1.9 }}>
            <div>{i18nT('属灵星球 · 内容为开发者 Ethan 原创，仅供个人灵修学习，不得用于商业用途')}</div>
            <div>
              <span onClick={() => setActivePanel('about')} style={{ color: '#5ac8fa', cursor: 'pointer' }}>{i18nT('ℹ️ 关于本站')}</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <a href="mailto:zpchoney@gmail.com" style={{ color: '#5ac8fa', textDecoration: 'none' }}>zpchoney@gmail.com</a>
            </div>
          </footer>
        </main>

        <Suspense fallback={<div className="page-overlay" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'rgba(255,255,255,0.6)',fontSize:'15px'}}>{i18nT('加载中…')}</span></div>}>
        {/* 代祷墙页面 */}
        {activePanel === 'prayer' && (
          <div className="page-overlay">
            {user ? (
              <PrayerWallPage
                user={user}
                token={getToken()}
                onBack={() => setActivePanel('sphere')}
              />
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* 传FY祷告墙页面 */}
        {activePanel === 'evangelism' && (
          <div className="page-overlay">
            {user ? (
              <EvangelismPage
                user={user}
                token={getToken()}
                onBack={() => setActivePanel('sphere')}
                onPrayerWall={() => handlePanelSwitch('prayer')}
              />
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* 打卡页面覆盖层（情绪选中后从星球页进入） */}
        {activePanel === 'checkin' && (
          <div className="checkin-overlay">
            {user ? (
              <CheckInPage
                user={user}
                emotionLabel={selectedFeature?.zh_label || ''}
                emotionQuery={query}
                token={getToken()}
                onBack={() => setActivePanel('sphere')}
              />
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* 主日信息页面 */}
        {activePanel === 'journal' && (
          <div className="page-overlay">
            {user ? (
              <SermonJournalPage
                user={user}
                token={getToken()}
                onBack={() => setActivePanel('sphere')}
              />
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* 灵修页面：晨恩日新 + 灵修日记 */}
        {activePanel === 'devotion' && (
          <div className="page-overlay">
            <DevotionTabContainer
              user={user}
              token={getToken()}
              showLogin={showLogin}
              renderInlineLogin={renderInlineLogin}
              onBack={() => setActivePanel('sphere')}
            />
          </div>
        )}

        {/* 分享墙页面 */}
        {activePanel === 'sharewall' && (
          <div className="page-overlay">
            <ShareWallPage
              user={user}
              onBack={() => setActivePanel('sphere')}
            />
          </div>
        )}

        {/* 镜鉴人物 */}
        {(activePanel === 'mirror' || activePanel === 'mirror-graph') && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <MirrorPage
                user={user}
                token={getToken()}
                guidance={guidance}
                initialView={_mirrorRestore?.view || (activePanel === 'mirror-graph' ? 'graph' : 'list')}
                initialCharId={_mirrorRestore?.charId}
                initialThemeId={_mirrorRestore?.themeId}
                initialGraphFocus={_mirrorRestore?.graphFocus}
                initialReturnView={_mirrorRestore?.returnView}
                onBack={() => setActivePanel('sphere')}
              />
            </Suspense>
          </div>
        )}

        {/* 属灵辨识 + 灵镜分析（已合并） */}
        {activePanel === 'innerlife' && (
          <div className="page-overlay">
            {user ? (
              <DecisionSupportPage
                user={user}
                onBack={() => setActivePanel('sphere')}
                onNeedLogin={handleNeedLogin}
              />
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* 回收站页面 */}
        {showRecycleBin && user && (
          <div className="page-overlay" style={{ zIndex: 100 }}>
            <RecycleBinPage onBack={() => setShowRecycleBin(false)} />
          </div>
        )}

        {/* 教会引导弹窗 — 登录后无教会且未跳过时显示 */}
        {user && myChurch === null && !churchSkipped && (
          <ChurchOnboardingModal
            token={getToken()}
            onJoined={(church) => { setMyChurch(church || null); if (church) setChurchSkipped(false) }}
            onSkip={() => setChurchSkipped(true)}
          />
        )}

        {/* A1: 每日灵魂一问 */}
        {activePanel === 'soul-question' && (
          <div className="page-overlay">
            {user ? (
              <Suspense fallback={null}>
                <DailySoulQuestionPage user={user} token={getToken()} onBack={() => setActivePanel('sphere')} />
              </Suspense>
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* A2+A7: 灵命成长图谱 + 里程碑 */}
        {activePanel === 'growth-map' && (
          <div className="page-overlay">
            {user ? (
              <Suspense fallback={null}>
                <GrowthMapPage user={user} token={getToken()} onBack={() => setActivePanel('sphere')} />
              </Suspense>
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* A4+A3: 属灵伙伴 + 倒退预警 */}
        {activePanel === 'partner' && (
          <div className="page-overlay">
            {user ? (
              <Suspense fallback={null}>
                <SpiritualPartnerPage user={user} token={getToken()} onBack={() => setActivePanel('sphere')} />
              </Suspense>
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* A10: 圣经通读 */}
        {activePanel === 'bible-reading' && (
          <div className="page-overlay" style={{ zIndex: 400 }}>
            {user ? (
              <Suspense fallback={null}>
                <BibleReadingPage user={user} token={getToken()} onBack={() => setActivePanel('sphere')} />
              </Suspense>
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* 工程评测 */}
        {activePanel === 'engineering' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <EngineeringPage onBack={() => setActivePanel('sphere')} user={user} token={getToken()} />
            </Suspense>
          </div>
        )}

        {/* 圣经地图中心 */}
        {activePanel === 'bible-maps' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <BibleMapsPage onBack={() => setActivePanel('sphere')} onOpenAtlas={() => setActivePanel('bible-atlas')} />
            </Suspense>
          </div>
        )}

        {/* 圣经地图集（Mapbox + 时间轴 + 支派/预言/战役/帝国 + 3D 圣殿） */}
        {activePanel === 'bible-atlas' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <BibleAtlasPage onBack={() => setActivePanel('sphere')} />
            </Suspense>
          </div>
        )}

        {activePanel === 'worldview' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <WorldviewPage onBack={() => setActivePanel('sphere')} />
            </Suspense>
          </div>
        )}

        {/* 关于本站（自我说明 / 使用声明） */}
        {activePanel === 'about' && (
          <div className="page-overlay">
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px calc(env(safe-area-inset-bottom) + 96px)', color: 'rgba(255,255,255,0.88)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <BackButton onClick={() => setActivePanel('sphere')} />
                <h2 style={{ margin: 0, fontSize: 20 }}>{i18nT('ℹ️ 关于本站')}</h2>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 16px', lineHeight: 2, fontSize: 14 }}>
                <p style={{ margin: '0 0 10px' }}>{i18nT('属灵星球（Bible Sphere）由开发者')} <strong>Ethan</strong> {i18nT('独立设计与开发。')}</p>
                <p style={{ margin: '0 0 6px' }}>{i18nT('· 网站所有内容均为开发者所创作；')}</p>
                <p style={{ margin: '0 0 6px' }}>{i18nT('· 仅供个人灵修与学习使用，')}<strong>{i18nT('不得用于任何商业用途')}</strong>；</p>
                <p style={{ margin: '0 0 6px' }}>{i18nT('· 本站内容的最终解释权归网站开发者 Ethan 所有。')}</p>
                <p style={{ margin: '12px 0 0' }}>{i18nT('如有任何问题或建议，欢迎邮件联系：')}<a href="mailto:zpchoney@gmail.com" style={{ color: '#5ac8fa', textDecoration: 'none' }}>zpchoney@gmail.com</a></p>
              </div>
            </div>
          </div>
        )}

        {/* 在线社区 */}
        {activePanel === 'community' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <CommunityPage user={user} token={getToken()} onBack={() => setActivePanel('sphere')} />
            </Suspense>
          </div>
        )}

        {/* 语音通话 — 多人实时群语音 (LiveKit SFU) */}
        {activePanel === 'voice' && (
          <div className="page-overlay">
            {user ? (
              <Suspense fallback={null}>
                <VoiceRoomPage
                  user={user}
                  token={getToken()}
                  onBack={() => setActivePanel('sphere')}
                />
              </Suspense>
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* 圣徒相通：好友/聊天/语音通话 */}
        {activePanel === 'communion' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <CommunionPage user={user} onBack={() => setActivePanel('sphere')} />
            </Suspense>
          </div>
        )}

        {/* 麦琴读经计划 */}
        {activePanel === 'mccheyne' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <MccheynePage onBack={() => setActivePanel('sphere')} onOpenPanel={(p) => { setActivePanel(p); if (p === 'bible-reading') { try { sessionStorage.setItem('bible-reading-open', JSON.stringify({ book: 'Genesis', chapter: 1 })) } catch {} } }} />
            </Suspense>
          </div>
        )}

        {/* 经文搜索（语义检索） */}
        {activePanel === 'bible-search' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <BibleSearchPage
                onBack={() => setActivePanel('sphere')}
                onOpenMap={(panel) => setActivePanel(panel)}
              />
            </Suspense>
          </div>
        )}

        {/* 记忆卡 */}
        {activePanel === 'memory-deck' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <MemoryDeckPage onBack={() => setActivePanel('sphere')} />
            </Suspense>
          </div>
        )}

        {/* 个人检索 */}
        {activePanel === 'personal-search' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <PersonalSearchPage token={getToken()} onBack={() => setActivePanel('sphere')} onOpenPanel={(p) => setActivePanel(p)} />
            </Suspense>
          </div>
        )}

        {/* 导出数据 */}
        {activePanel === 'export-data' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <ExportDataPage onBack={() => setActivePanel('sphere')} />
            </Suspense>
          </div>
        )}

        {/* 属灵塑造 — Sin Pattern to New Creation Transformation Engine */}
        {activePanel === 'spiritual-formation' && (
          <div className="page-overlay">
            <Suspense fallback={null}>
              <SpiritualFormationPage
                user={user}
                token={getToken()}
                initialTab={formationInitialTab}
                onBack={() => setActivePanel('sphere')}
              />
            </Suspense>
          </div>
        )}

        {/* 守心 — Attention Stewardship */}
        {activePanel === 'attention' && (
          <div className="page-overlay">
            {user ? (
              <Suspense fallback={null}>
                <AttentionPage
                  user={user}
                  token={getToken()}
                  initialSection={attentionInitialSection}
                  onBack={() => {
                    try { window.history.replaceState({}, '', '/') } catch { /* ignore */ }
                    setActivePanel('sphere')
                  }}
                />
              </Suspense>
            ) : showLogin ? renderInlineLogin() : null}
          </div>
        )}

        {/* A5: 2分钟快速灵修 */}
        {showQuickDevotion && (
          <Suspense fallback={null}>
            <QuickDevotionPage
              user={user} token={getToken()}
              onBack={() => setShowQuickDevotion(false)}
              onDone={() => { setShowQuickDevotion(false); fetchDailySnapshot(getToken()).then(setDailySnapshot).catch(() => {}) }}
            />
          </Suspense>
        )}

        {/* A9: SOS 黑暗时刻模式 */}
        {showSOS && (
          <SOSModal
            onClose={() => setShowSOS(false)}
            onPrayerWall={() => { setShowSOS(false); handlePanelSwitch('prayer') }}
          />
        )}

        {/* 全局登录浮层 - 从顶部登录按钮触发 */}
        {showLogin && !user && activePanel === 'sphere' && (
          <div className="page-overlay" style={{ zIndex: 100 }}>
            {renderInlineLogin()}
          </div>
        )}
        </Suspense>

        {/* 底部 Tab Bar */}
        <nav className="mobile-bottom-nav glass">
          <button
            className={`mobile-nav-item ${activePanel === 'sphere' ? 'active' : ''}`}
            onClick={() => setActivePanel('sphere')}
          >
            <span className="mobile-nav-icon">🔮</span>
            <span className="mobile-nav-label">{i18nT('星球')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'mirror' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('mirror')}
          >
            <span className="mobile-nav-icon">🪞</span>
            <span className="mobile-nav-label">{i18nT('镜鉴')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'sharewall' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('sharewall')}
          >
            <span className="mobile-nav-icon">🌟</span>
            <span className="mobile-nav-label">{i18nT('分享')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'journal' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('journal')}
          >
            <span className="mobile-nav-icon">📖</span>
            <span className="mobile-nav-label">{i18nT('主日')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'evangelism' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('evangelism')}
          >
            <span className="mobile-nav-icon">🌍</span>
            <span className="mobile-nav-label">{i18nT('宣教')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'prayer' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('prayer')}
          >
            <span className="mobile-nav-icon">🙏</span>
            <span className="mobile-nav-label">{i18nT('代祷')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'devotion' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('devotion')}
          >
            <span className="mobile-nav-icon">📔</span>
            <span className="mobile-nav-label">{i18nT('灵修')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'innerlife' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('innerlife')}
          >
            <span className="mobile-nav-icon">⚖️</span>
            <span className="mobile-nav-label">{i18nT('心迹')}</span>
          </button>
          <button
            className={`mobile-nav-item ${activePanel === 'communion' ? 'active' : ''}`}
            onClick={() => handlePanelSwitch('communion')}
          >
            <span className="mobile-nav-icon">💬</span>
            <span className="mobile-nav-label">{i18nT('相通')}</span>
          </button>
        </nav>

        {/* 全局实时：唯一 WebSocket + 任意页面来电弹窗 */}
        <RealtimeRoot user={user} />

        {/* 属灵守护者·和平鸽精灵（右下角常驻） */}
        <Suspense fallback={null}>
          <GuardianWidget />
        </Suspense>
        <ExpansionLauncher />

        {/* 浮动登录遮罩 — 保持当前页面挂载，不清空用户输入 */}
        {showLoginOverlay && !user && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px 20px', boxSizing: 'border-box',
            overflowY: 'auto',
          }}>
            <LoginScreen
              onLogin={handleLoginSuccess}
              message={loginOverlayMessage}
              onBack={() => { setShowLoginOverlay(false); setLoginOverlayMessage('') }}
            />
          </div>
        )}
      </div>
    )
}

// ── 灵修 Tab 容器: 晨恩日新日历 + 灵修日记 ─────────────────────────────────────
export default function App() {
  if (/^\/caregiver\/?$/.test(window.location.pathname)) {
    return (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: 'rgba(255,255,255,0.4)' }}>{i18nT('加载中…')}</div>}>
          <CaregiverConsolePage />
        </Suspense>
      </QueryClientProvider>
    )
  }
  if (/^\/seekers\/?$/.test(window.location.pathname)) {
    return (
      <QueryClientProvider client={queryClient}>
        <SeekersStandalonePage />
      </QueryClientProvider>
    )
  }
  return (
    <QueryClientProvider client={queryClient}>
      <AiStatusBanner />
      <AppContent />
      <GlobalToast />
      <ConfirmDialog />
    </QueryClientProvider>
  )
}
