import { API_BASE } from '../../../api'
import { stopAllAudio } from '../../../useGlobalAudio'
import { DIGITAL_HUMAN_STATES, isDigitalHumanPlaybackActive } from './DigitalHumanAdapter'
import { validateDigitalHumanResponse } from './contracts'

export const VISEME_SHAPES = Object.freeze({
  REST: 'REST',
  BILABIAL: 'BILABIAL',
  ROUNDED: 'ROUNDED',
  OPEN: 'OPEN',
  DENTAL: 'DENTAL',
})

export const NEUTRAL_ANIMATION_FRAME = Object.freeze({
  viseme: VISEME_SHAPES.REST,
  jawOpen: 0,
  lipRound: 0,
  lipPress: 0,
  blink: 0,
  gazeX: 0,
  gazeY: 0,
  speaking: false,
})

const PUNCTUATION_PAUSE_MS = 180
const VOICES_CHANGED_TIMEOUT_MS = 500
const DEFAULT_START_WATCHDOG_MS = 15_000
const DEFAULT_MAX_PLAYBACK_WATCHDOG_MS = 180_000
const CHROME_KEEPALIVE_INTERVAL_MS = 10_000

const PUNCTUATION_CHARS = new Set(Array.from('，。！？；：、,.!?;: \n\r\t—…·“”‘’"\'（）()《》【】[]'))
const BILABIAL_CHARS = new Set(Array.from('bpmBPM不把被比本白百北步部保报平怕朋破排篇母木目们民明美面名牧摩米马吗么慢满蒙伯彼盼凭门默'))
const ROUNDED_CHARS = new Set(Array.from('uowüqUOWÜQ我你主说国果过火或活多都头口走手有又友周州后候古故苦路露书树出初入如女律绿约月王往问闻文物务无五武福父夫服所罗约瑟颂荣中众同共公工功龙容永用奉梦蒙忠宗崇终充'))
const OPEN_CHARS = new Set(Array.from('aAáàâä阿啊大他她它那哪发法拉达答杀撒玛雅亚巴爸妈家下夏话花化拿看山善战赞爱哀安暗昂邦帮当党方放刚光康浪忙旁让上伤堂望向样章长张唱常迦扫罕来在海开改台太代外怀快万反感敢喊难兰南谈凡盼旦但'))
const DENTAL_LATIN_CHARS = new Set(Array.from('eEiIyYsSzZcCdDtTnNlLrRfFvVjJxXgGkKhH'))

const SHAPE_PARAMS = Object.freeze({
  [VISEME_SHAPES.REST]: { viseme: VISEME_SHAPES.REST, jawOpen: 0, lipRound: 0, lipPress: 0 },
  [VISEME_SHAPES.BILABIAL]: { viseme: VISEME_SHAPES.BILABIAL, jawOpen: 0.04, lipRound: 0.05, lipPress: 0.92 },
  [VISEME_SHAPES.ROUNDED]: { viseme: VISEME_SHAPES.ROUNDED, jawOpen: 0.42, lipRound: 0.88, lipPress: 0 },
  [VISEME_SHAPES.OPEN]: { viseme: VISEME_SHAPES.OPEN, jawOpen: 0.82, lipRound: 0.15, lipPress: 0 },
  [VISEME_SHAPES.DENTAL]: { viseme: VISEME_SHAPES.DENTAL, jawOpen: 0.28, lipRound: 0.1, lipPress: 0 },
})

const PINYIN_BOUNDARIES = [
  ['阿', 'a'],
  ['八', 'b'],
  ['擦', 'c'],
  ['搭', 'd'],
  ['蛾', 'e'],
  ['发', 'f'],
  ['旮', 'g'],
  ['哈', 'h'],
  ['击', 'j'],
  ['喀', 'k'],
  ['垃', 'l'],
  ['妈', 'm'],
  ['拿', 'n'],
  ['哦', 'o'],
  ['啪', 'p'],
  ['期', 'q'],
  ['然', 'r'],
  ['撒', 's'],
  ['塌', 't'],
  ['挖', 'w'],
  ['昔', 'x'],
  ['压', 'y'],
  ['匝', 'z'],
]

let pinyinCollator = null
function getPinyinInitial(ch) {
  try {
    if (!pinyinCollator && typeof Intl !== 'undefined' && typeof Intl.Collator === 'function') {
      pinyinCollator = new Intl.Collator('zh-Hans-u-co-pinyin')
    }
    if (!pinyinCollator) return ''
    if (pinyinCollator.compare(ch, PINYIN_BOUNDARIES[0][0]) < 0) return ''
    let lo = 0
    let hi = PINYIN_BOUNDARIES.length - 1
    let matched = ''
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (pinyinCollator.compare(ch, PINYIN_BOUNDARIES[mid][0]) >= 0) {
        matched = PINYIN_BOUNDARIES[mid][1]
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return matched
  } catch {
    return ''
  }
}

function classifyCharacterViseme(ch) {
  if (PUNCTUATION_CHARS.has(ch) || /\s/.test(ch)) {
    return { ...SHAPE_PARAMS[VISEME_SHAPES.REST], isPause: true }
  }
  if (BILABIAL_CHARS.has(ch)) {
    return { ...SHAPE_PARAMS[VISEME_SHAPES.BILABIAL], isPause: false }
  }
  if (ROUNDED_CHARS.has(ch)) {
    return { ...SHAPE_PARAMS[VISEME_SHAPES.ROUNDED], isPause: false }
  }
  if (OPEN_CHARS.has(ch)) {
    return { ...SHAPE_PARAMS[VISEME_SHAPES.OPEN], isPause: false }
  }
  if (DENTAL_LATIN_CHARS.has(ch)) {
    const isMidFrontVowel = ch === 'e' || ch === 'E'
    return {
      viseme: VISEME_SHAPES.DENTAL,
      jawOpen: isMidFrontVowel ? 0.36 : 0.28,
      lipRound: 0.1,
      lipPress: 0,
      isPause: false,
    }
  }
  if (/^\d$/.test(ch)) {
    if ('0589'.includes(ch)) return { ...SHAPE_PARAMS[VISEME_SHAPES.ROUNDED], isPause: false }
    if ('23'.includes(ch)) return { ...SHAPE_PARAMS[VISEME_SHAPES.OPEN], isPause: false }
    return { ...SHAPE_PARAMS[VISEME_SHAPES.DENTAL], isPause: false }
  }

  const initial = getPinyinInitial(ch)
  if (initial === 'b' || initial === 'p' || initial === 'm') {
    return { ...SHAPE_PARAMS[VISEME_SHAPES.BILABIAL], isPause: false }
  }
  if (initial === 'o' || initial === 'w') {
    return { ...SHAPE_PARAMS[VISEME_SHAPES.ROUNDED], isPause: false }
  }
  if (initial === 'a') {
    return { ...SHAPE_PARAMS[VISEME_SHAPES.OPEN], isPause: false }
  }
  return { ...SHAPE_PARAMS[VISEME_SHAPES.DENTAL], isPause: false }
}

export function extractVisemeTimeline(text, { charDurationMs = 155 } = {}) {
  const input = String(text || '')
  if (!input) return []
  const stepMs = Math.max(40, Number(charDurationMs) || 155)
  const timeline = []
  let charOffset = 0
  let cursorMs = 0
  let index = 0

  for (const ch of input) {
    const classified = classifyCharacterViseme(ch)
    const duration = classified.isPause ? PUNCTUATION_PAUSE_MS : stepMs
    const startMs = cursorMs
    const endMs = cursorMs + duration
    timeline.push({
      index,
      charOffset,
      startMs,
      endMs,
      viseme: classified.viseme,
      jawOpen: classified.jawOpen,
      lipRound: classified.lipRound,
      lipPress: classified.lipPress,
    })
    cursorMs = endMs
    charOffset += ch.length
    index += 1
  }

  return timeline
}

export function isLocalSpeechSynthesisSupported() {
  return typeof globalThis.speechSynthesis?.speak === 'function'
    && typeof globalThis.SpeechSynthesisUtterance === 'function'
}

export function isWebAudioVisemeSupported() {
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext
  return typeof globalThis.Audio === 'function' && typeof AudioCtx === 'function'
}

function prefersReducedMotion() {
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  } catch {
    return false
  }
}

function computeBlinkLevel(elapsedMs) {
  if (elapsedMs >= 40 && elapsedMs <= 200) {
    const distance = Math.abs(elapsedMs - 120) / 80
    return Number(Math.max(0, 1 - distance).toFixed(3))
  }
  const pairPeriod = 6800
  const phase = elapsedMs % pairPeriod
  for (const center of [3100, 6680]) {
    const delta = Math.abs(phase - center)
    if (delta <= 80) {
      return Number(Math.max(0, 1 - delta / 80).toFixed(3))
    }
  }
  return 0
}

function computeGaze(elapsedMs) {
  const rawX = Math.sin((elapsedMs + 90) / 640) * 0.62 + Math.cos((elapsedMs + 180) / 1380) * 0.24
  const rawY = Math.sin((elapsedMs + 140) / 890) * 0.34
  return {
    gazeX: Number(Math.max(-1, Math.min(1, rawX)).toFixed(3)),
    gazeY: Number(Math.max(-0.6, Math.min(0.6, rawY)).toFixed(3)),
  }
}

export function findTimelineEntry(timeline, virtualMs) {
  if (!timeline.length) return { ...SHAPE_PARAMS[VISEME_SHAPES.REST], jawOpen: 0 }
  const totalMs = timeline[timeline.length - 1].endMs
  if (virtualMs >= totalMs) {
    return {
      viseme: VISEME_SHAPES.REST,
      jawOpen: 0.06,
      lipRound: 0,
      lipPress: 0,
    }
  }
  const targetMs = Math.max(0, virtualMs)
  for (let i = 0; i < timeline.length; i += 1) {
    const item = timeline[i]
    if (targetMs >= item.startMs && targetMs < item.endMs) {
      return item
    }
  }
  return {
    viseme: VISEME_SHAPES.REST,
    jawOpen: 0.06,
    lipRound: 0,
    lipPress: 0,
  }
}

export function classifySpectralVisemeFromBuffers(timeDomainData, frequencyData, sampleRate = 48000, fftSize = 256) {
  let sumSq = 0
  const tdLen = timeDomainData?.length || 0
  for (let i = 0; i < tdLen; i += 1) {
    const centered = ((timeDomainData[i] ?? 128) - 128) / 128
    sumSq += centered * centered
  }
  const rms = tdLen > 0 ? Math.sqrt(sumSq / tdLen) : 0
  const rawJaw = Math.min(1, Number((rms * 3.1).toFixed(3)))

  const binCount = frequencyData?.length || 0
  const hzPerBin = (sampleRate > 0 ? sampleRate : 48000) / (fftSize > 0 ? fftSize : 256)
  let lowSum = 0
  let lowBins = 0
  let midSum = 0
  let midBins = 0
  let highSum = 0
  let highBins = 0

  for (let bin = 1; bin < binCount; bin += 1) {
    const freqHz = bin * hzPerBin
    const amp = (frequencyData[bin] || 0) / 255
    const energy = amp * amp
    if (freqHz < 500) {
      lowSum += energy
      lowBins += 1
    } else if (freqHz <= 2200) {
      midSum += energy
      midBins += 1
    } else {
      highSum += energy
      highBins += 1
    }
  }

  const lowMean = lowBins > 0 ? lowSum / lowBins : 0
  const midMean = midBins > 0 ? midSum / midBins : 0
  const highMean = highBins > 0 ? highSum / highBins : 0
  const totalMean = lowMean + midMean + highMean

  if (rms < 0.018 || totalMean <= 1e-6) {
    return {
      viseme: VISEME_SHAPES.REST,
      jawOpen: Number(Math.min(0.04, rawJaw).toFixed(3)),
      lipRound: 0,
      lipPress: 0,
    }
  }

  const lowRatio = lowMean / totalMean
  const midRatio = midMean / totalMean
  const highRatio = highMean / totalMean

  if (highRatio >= 0.38) {
    return {
      viseme: VISEME_SHAPES.DENTAL,
      jawOpen: Number(Math.max(0.16, Math.min(0.46, rawJaw)).toFixed(3)),
      lipRound: 0.1,
      lipPress: 0,
    }
  }
  if (lowRatio >= 0.62 && rawJaw < 0.26) {
    return {
      viseme: VISEME_SHAPES.BILABIAL,
      jawOpen: Number(Math.min(0.1, rawJaw).toFixed(3)),
      lipRound: 0.06,
      lipPress: 0.9,
    }
  }
  if (lowRatio >= 0.44 && highRatio < 0.22) {
    return {
      viseme: VISEME_SHAPES.ROUNDED,
      jawOpen: Number(Math.max(0.26, Math.min(0.68, rawJaw)).toFixed(3)),
      lipRound: 0.86,
      lipPress: 0,
    }
  }
  if (midRatio >= 0.34 || rawJaw >= 0.36) {
    return {
      viseme: VISEME_SHAPES.OPEN,
      jawOpen: Number(Math.max(0.4, rawJaw).toFixed(3)),
      lipRound: 0.15,
      lipPress: 0,
    }
  }
  return {
    viseme: VISEME_SHAPES.DENTAL,
    jawOpen: Number(Math.max(0.18, rawJaw).toFixed(3)),
    lipRound: 0.12,
    lipPress: 0,
  }
}

function buildSpeakingFrame(shape, elapsedMs) {
  const reduced = prefersReducedMotion()
  if (reduced) {
    return {
      viseme: shape.viseme,
      jawOpen: Number(Math.min(shape.jawOpen, 0.24).toFixed(3)),
      lipRound: Number(Math.min(shape.lipRound, 0.24).toFixed(3)),
      lipPress: Number(Math.min(shape.lipPress, 0.32).toFixed(3)),
      blink: 0,
      gazeX: 0,
      gazeY: 0,
      speaking: true,
    }
  }
  const { gazeX, gazeY } = computeGaze(elapsedMs)
  const blink = computeBlinkLevel(elapsedMs)
  return {
    viseme: shape.viseme,
    jawOpen: shape.jawOpen,
    lipRound: shape.lipRound,
    lipPress: shape.lipPress,
    blink,
    gazeX,
    gazeY,
    speaking: true,
  }
}

export function createPreviewAnimationLoop(
  text,
  { onAnimationFrame = () => {}, intervalMs = 50, charDurationMs = 155 } = {},
) {
  const timeline = extractVisemeTimeline(text, { charDurationMs })
  const tickMs = Math.max(20, Number(intervalMs) || 50)
  let timer = null
  let active = false
  let elapsedMs = 0
  let boundaryBaseMs = 0
  let boundaryAtElapsedMs = 0

  const emitStep = () => {
    if (!active) return
    const virtualMs = boundaryBaseMs + Math.max(0, elapsedMs - boundaryAtElapsedMs)
    const entry = findTimelineEntry(timeline, virtualMs)
    onAnimationFrame(buildSpeakingFrame(entry, elapsedMs))
  }

  return {
    start() {
      if (active) return
      active = true
      elapsedMs = 0
      boundaryBaseMs = 0
      boundaryAtElapsedMs = 0
      emitStep()
      timer = setInterval(() => {
        elapsedMs += tickMs
        emitStep()
      }, tickMs)
    },
    onBoundary(charIndex) {
      if (!active || typeof charIndex !== 'number' || charIndex < 0) return
      let matched = null
      for (const item of timeline) {
        if (item.charOffset <= charIndex) matched = item
        else break
      }
      if (matched) {
        boundaryBaseMs = matched.startMs
        boundaryAtElapsedMs = elapsedMs
        emitStep()
      }
    },
    stop() {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
      active = false
      onAnimationFrame({ ...NEUTRAL_ANIMATION_FRAME })
    },
  }
}

function pickUtteranceVoice(voices, language) {
  const list = Array.isArray(voices) ? voices : []
  const normalized = String(language || 'zh-CN')
  const prefix = normalized.split('-')[0].toLowerCase()
  return list.find((voice) => voice.lang === normalized)
    || list.find((voice) => voice.lang?.toLowerCase().startsWith(prefix))
    || null
}

function waitForVoicesBounded(synth, timeoutMs = VOICES_CHANGED_TIMEOUT_MS) {
  const existing = synth?.getVoices?.() || []
  if (existing.length > 0) {
    return Promise.resolve(existing)
  }
  return new Promise((resolve) => {
    let settled = false
    let timer = null
    const finish = () => {
      if (settled) return
      settled = true
      if (timer !== null) clearTimeout(timer)
      if (typeof synth?.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', onVoicesChanged)
      } else if (synth && synth.onvoiceschanged === onVoicesChanged) {
        synth.onvoiceschanged = null
      }
      resolve(synth?.getVoices?.() || [])
    }
    const onVoicesChanged = () => finish()
    if (typeof synth?.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', onVoicesChanged)
    } else if (synth) {
      synth.onvoiceschanged = onVoicesChanged
    }
    timer = setTimeout(finish, timeoutMs)
  })
}

async function defaultSynthesizeTtsAudio(text, { language = 'zh-CN', voiceId = null, signal } = {}) {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error('FETCH_UNAVAILABLE')
  }
  const normalizedLang = String(language || 'zh-CN')
  const defaultVoice = normalizedLang.toLowerCase().startsWith('en')
    ? 'en-US-AriaNeural'
    : 'zh-CN-XiaoxiaoNeural'
  const response = await globalThis.fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      text,
      language_code: normalizedLang,
      voice_name: voiceId || defaultVoice,
    }),
    ...(signal ? { signal } : {}),
  })
  if (!response || !response.ok) {
    const err = new Error(`TTS_HTTP_${response?.status || 0}`)
    err.status = response?.status || 0
    throw err
  }
  return response.blob()
}

function isNotAllowedPlaybackError(err) {
  if (!err) return false
  const name = String(err.name || '')
  const msg = String(err.message || err || '')
  return name === 'NotAllowedError' || /NotAllowed|not-allowed|user gesture|interact/i.test(`${name} ${msg}`)
}

function isBlobLike(value) {
  if (!value || typeof value !== 'object') return false
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true
  return typeof value.size === 'number' && typeof value.type === 'string'
}

async function resolveBlobPlayableUrl(blob) {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      return { url: URL.createObjectURL(blob), ownedObjectUrl: true }
    } catch {
      // Cross-realm Blob in jsdom/Node: fall through to data URI encoding.
    }
  }
  try {
    const buf = typeof blob.arrayBuffer === 'function'
      ? await blob.arrayBuffer()
      : await new Response(blob).arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i])
    }
    const b64 = typeof globalThis.btoa === 'function' ? globalThis.btoa(binary) : ''
    return { url: `data:${blob.type || 'audio/mpeg'};base64,${b64}`, ownedObjectUrl: false }
  } catch {
    return { url: `data:${blob.type || 'audio/mpeg'};base64,`, ownedObjectUrl: false }
  }
}

/** @implements {import('./DigitalHumanAdapter').DigitalHumanAdapter} */
export class LocalPortraitVisemeAdapter {
  constructor({
    onStateChange = () => {},
    onError = () => {},
    onAnimationFrame = () => {},
    synthesizeAudio = defaultSynthesizeTtsAudio,
    intervalMs = 50,
    charDurationMs = 155,
    startWatchdogMs = DEFAULT_START_WATCHDOG_MS,
    maxPlaybackWatchdogMs = DEFAULT_MAX_PLAYBACK_WATCHDOG_MS,
    keepaliveIntervalMs = CHROME_KEEPALIVE_INTERVAL_MS,
  } = {}) {
    this.onStateChange = onStateChange
    this.onError = onError
    this.onAnimationFrame = onAnimationFrame
    this.synthesizeAudio = synthesizeAudio
    this.intervalMs = intervalMs
    this.charDurationMs = charDurationMs
    this.startWatchdogMs = startWatchdogMs
    this.maxPlaybackWatchdogMs = maxPlaybackWatchdogMs
    this.keepaliveIntervalMs = keepaliveIntervalMs
    this.state = DIGITAL_HUMAN_STATES.BOOTING
    this.initialized = false
    this.pendingCharacter = null
    this.activeCharacterId = null
    this.voiceLanguage = 'zh-CN'
    this.voiceId = null
    this.speechRevision = 0
    this.activeLoop = null
    this.utteranceActive = false
    this.pendingTouchText = null
    this.pendingWebAudioSession = null
    this.activeWebAudioCleanup = null
    this.activeSynthAbort = null
    this.startWatchdogTimer = null
    this.maxPlaybackWatchdogTimer = null
    this.keepaliveTimer = null
  }

  async initialize() {
    if (this.initialized) return
    if (!isLocalSpeechSynthesisSupported() && !isWebAudioVisemeSupported()) {
      this.fail('当前浏览器不支持本地语音播报，已保留文字回答。')
      throw new Error('Local speech synthesis is unavailable')
    }
    this.initialized = true
    this.setState(DIGITAL_HUMAN_STATES.MODEL_AWAITING)
    if (this.pendingCharacter) {
      await this.activateCharacter(this.pendingCharacter)
    }
  }

  async loadCharacter(character) {
    if (!character || typeof character !== 'object' || !/^[a-z0-9_-]+$/.test(character.id || '')) {
      throw new Error('人物配置无效')
    }
    this.pendingCharacter = character
    this.setVoice(character)
    if (this.initialized && this.state === DIGITAL_HUMAN_STATES.MODEL_AWAITING) {
      await this.activateCharacter(character)
    }
  }

  async activateCharacter(character) {
    this.setState(DIGITAL_HUMAN_STATES.LOADING_MODEL)
    this.activeCharacterId = character.id
    this.onAnimationFrame({ ...NEUTRAL_ANIMATION_FRAME })
    this.setState(DIGITAL_HUMAN_STATES.READY)
  }

  setVoice(character) {
    if (character?.voice?.language) {
      this.voiceLanguage = character.voice.language
    }
    this.voiceId = character?.voice?.voiceId || null
  }

  async speakApproved(turn) {
    if (turn?.speechApproved !== true) {
      throw new Error('Content has not passed the release gate')
    }
    const verified = validateDigitalHumanResponse(turn, this.activeCharacterId)
    if (verified.speechApproved !== true) {
      throw new Error('Content has not passed the release gate')
    }
    if (this.state !== DIGITAL_HUMAN_STATES.READY) {
      throw new Error(`Avatar not ready: ${this.state}`)
    }
    await this.startApprovedSpeechPipeline(verified.spokenText)
  }

  async resumeAfterGesture() {
    if (!this.initialized || this.state !== DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH) {
      return false
    }
    if (this.pendingWebAudioSession) {
      const pending = this.pendingWebAudioSession
      this.pendingWebAudioSession = null
      return this.activateWebAudioPlayback(pending)
    }
    if (this.pendingTouchText) {
      const text = this.pendingTouchText
      this.pendingTouchText = null
      await this.startFallbackSpeechSynthesis(text, ++this.speechRevision)
      return true
    }
    return false
  }

  resumeAfterTouch() {
    if (!this.initialized || this.state !== DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH) {
      return false
    }
    if (this.pendingWebAudioSession) {
      void this.resumeAfterGesture()
      return true
    }
    if (this.pendingTouchText) {
      const text = this.pendingTouchText
      this.pendingTouchText = null
      const synth = globalThis.speechSynthesis
      const voices = synth?.getVoices?.() || []
      if (voices.length > 0) {
        this.launchUtteranceWithVoices(text, voices, ++this.speechRevision)
      } else {
        void this.startFallbackSpeechSynthesis(text, ++this.speechRevision)
      }
      return true
    }
    return false
  }

  clearWatchdogs() {
    if (this.startWatchdogTimer !== null) {
      clearTimeout(this.startWatchdogTimer)
      this.startWatchdogTimer = null
    }
    if (this.maxPlaybackWatchdogTimer !== null) {
      clearTimeout(this.maxPlaybackWatchdogTimer)
      this.maxPlaybackWatchdogTimer = null
    }
    if (this.keepaliveTimer !== null) {
      clearInterval(this.keepaliveTimer)
      this.keepaliveTimer = null
    }
  }

  armStartWatchdog(revision, onTimeout) {
    if (this.startWatchdogTimer !== null) clearTimeout(this.startWatchdogTimer)
    this.startWatchdogTimer = setTimeout(() => {
      this.startWatchdogTimer = null
      if (revision !== this.speechRevision || !this.initialized) return
      onTimeout()
    }, this.startWatchdogMs)
  }

  armMaxPlaybackWatchdog(revision, onTimeout) {
    if (this.maxPlaybackWatchdogTimer !== null) clearTimeout(this.maxPlaybackWatchdogTimer)
    this.maxPlaybackWatchdogTimer = setTimeout(() => {
      this.maxPlaybackWatchdogTimer = null
      if (revision !== this.speechRevision || !this.initialized) return
      onTimeout()
    }, this.maxPlaybackWatchdogMs)
  }

  recoverFromWatchdog(revision) {
    if (revision !== this.speechRevision || !this.initialized) return
    this.stopActiveSpeech({ cancelSynth: true })
    this.onAnimationFrame({ ...NEUTRAL_ANIMATION_FRAME })
    this.setState(DIGITAL_HUMAN_STATES.READY)
  }

  async startApprovedSpeechPipeline(spokenText) {
    const revision = ++this.speechRevision
    this.stopActiveSpeech({ cancelSynth: this.utteranceActive })
    try {
      stopAllAudio()
    } catch {
      // Global audio singleton cleanup is best-effort.
    }
    this.setState(DIGITAL_HUMAN_STATES.PREPARING_SPEECH)

    if (isWebAudioVisemeSupported() && typeof this.synthesizeAudio === 'function') {
      const synthController = typeof AbortController !== 'undefined' ? new AbortController() : null
      this.activeSynthAbort = synthController
      try {
        const ttsPayload = await this.synthesizeAudio(spokenText, {
          language: this.voiceLanguage,
          voiceId: this.voiceId,
          signal: synthController?.signal,
        })
        if (this.activeSynthAbort === synthController) {
          this.activeSynthAbort = null
        }
        if (revision !== this.speechRevision || !this.initialized) return
        if (ttsPayload) {
          const handled = await this.startWebAudioPipeline(spokenText, ttsPayload, revision)
          if (handled) return
        }
      } catch {
        if (this.activeSynthAbort === synthController) {
          this.activeSynthAbort = null
        }
        if (revision !== this.speechRevision || !this.initialized) return
        // Fall through cleanly to local speechSynthesis when /api/tts is unavailable (502/503/offline).
      }
    }

    await this.startFallbackSpeechSynthesis(spokenText, revision)
  }

  async startWebAudioPipeline(spokenText, ttsPayload, revision) {
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext
    const AudioCtor = globalThis.Audio
    if (typeof AudioCtx !== 'function' || typeof AudioCtor !== 'function') {
      return false
    }

    let audioUrl = ''
    let ownedObjectUrl = false
    if (typeof ttsPayload === 'string') {
      audioUrl = ttsPayload
    } else if (isBlobLike(ttsPayload)) {
      if (!ttsPayload.size) return false
      const resolved = await resolveBlobPlayableUrl(ttsPayload)
      audioUrl = resolved.url
      ownedObjectUrl = resolved.ownedObjectUrl
    } else if (typeof ttsPayload === 'object' && ttsPayload !== null) {
      if (typeof ttsPayload.audioUrl === 'string') {
        audioUrl = ttsPayload.audioUrl
      } else if (isBlobLike(ttsPayload.blob) && ttsPayload.blob.size > 0) {
        const resolved = await resolveBlobPlayableUrl(ttsPayload.blob)
        audioUrl = resolved.url
        ownedObjectUrl = resolved.ownedObjectUrl
      }
    }
    if (!audioUrl) return false

    let audioCtx = null
    let audio = null
    try {
      audio = new AudioCtor(audioUrl)
      audio.crossOrigin = 'anonymous'
      audio.preload = 'auto'
      audioCtx = new AudioCtx()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.65
      const sourceNode = audioCtx.createMediaElementSource(audio)
      sourceNode.connect(analyser)
      analyser.connect(audioCtx.destination)

      const session = {
        spokenText,
        revision,
        audio,
        audioCtx,
        analyser,
        sourceNode,
        audioUrl,
        ownedObjectUrl,
      }
      return await this.activateWebAudioPlayback(session)
    } catch (caught) {
      if (ownedObjectUrl && audioUrl) {
        try { URL.revokeObjectURL(audioUrl) } catch { /* ignore */ }
      }
      try { audioCtx?.close?.() } catch { /* ignore */ }
      if (isNotAllowedPlaybackError(caught)) {
        this.pendingTouchText = spokenText
        this.setState(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)
        return true
      }
      return false
    }
  }

  async activateWebAudioPlayback(session) {
    const { revision, audio, audioCtx, analyser, sourceNode, audioUrl, ownedObjectUrl, spokenText } = session
    if (revision !== this.speechRevision || !this.initialized) {
      this.cleanupWebAudioSession(session)
      return true
    }

    let samplingActive = false
    let rafId = null
    let intervalId = null
    let elapsedMs = 0
    const tickMs = Math.max(20, Number(this.intervalMs) || 40)
    const timeDomain = new Uint8Array(analyser.fftSize || 256)
    const freqDomain = new Uint8Array(analyser.frequencyBinCount || 128)

    const stopSampling = () => {
      samplingActive = false
      if (rafId !== null && typeof globalThis.cancelAnimationFrame === 'function') {
        globalThis.cancelAnimationFrame(rafId)
        rafId = null
      }
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const teardown = () => {
      stopSampling()
      this.clearWatchdogs()
      audio.onended = null
      audio.onerror = null
      try { audio.pause?.() } catch { /* ignore */ }
      try { sourceNode?.disconnect?.() } catch { /* ignore */ }
      try { analyser?.disconnect?.() } catch { /* ignore */ }
      try { audioCtx?.close?.() } catch { /* ignore */ }
      if (ownedObjectUrl && audioUrl) {
        try { URL.revokeObjectURL(audioUrl) } catch { /* ignore */ }
      }
      if (this.activeWebAudioCleanup === teardown) {
        this.activeWebAudioCleanup = null
      }
    }

    this.activeWebAudioCleanup = teardown

    const sampleFrame = () => {
      if (!samplingActive || revision !== this.speechRevision || !this.initialized) return
      analyser.getByteTimeDomainData(timeDomain)
      analyser.getByteFrequencyData(freqDomain)
      const shape = classifySpectralVisemeFromBuffers(
        timeDomain,
        freqDomain,
        audioCtx.sampleRate || 48000,
        analyser.fftSize || 256,
      )
      this.onAnimationFrame(buildSpeakingFrame(shape, elapsedMs))
    }

    const startSampler = () => {
      if (samplingActive) return
      samplingActive = true
      elapsedMs = 0
      sampleFrame()
      if (typeof globalThis.requestAnimationFrame === 'function') {
        let lastTs = null
        const step = (ts) => {
          if (!samplingActive) return
          if (lastTs === null) lastTs = ts
          const dt = Math.max(16, ts - lastTs)
          lastTs = ts
          elapsedMs += dt
          sampleFrame()
          rafId = globalThis.requestAnimationFrame(step)
        }
        rafId = globalThis.requestAnimationFrame(step)
      } else {
        intervalId = setInterval(() => {
          elapsedMs += tickMs
          sampleFrame()
        }, tickMs)
      }
    }

    audio.onended = () => {
      if (revision !== this.speechRevision || !this.initialized) return
      teardown()
      this.onAnimationFrame({ ...NEUTRAL_ANIMATION_FRAME })
      this.setState(DIGITAL_HUMAN_STATES.READY)
    }

    audio.onerror = () => {
      if (revision !== this.speechRevision || !this.initialized) return
      teardown()
      if (isLocalSpeechSynthesisSupported()) {
        void this.startFallbackSpeechSynthesis(spokenText, revision)
      } else {
        this.fail('本地数字人语音无法播放，文字回答已保留。')
      }
    }

    this.armStartWatchdog(revision, () => this.recoverFromWatchdog(revision))

    try {
      if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        await audioCtx.resume()
      }
      const playResult = audio.play?.()
      if (playResult && typeof playResult.then === 'function') {
        await playResult
      }
      if (revision !== this.speechRevision || !this.initialized) {
        teardown()
        return true
      }
      if (this.startWatchdogTimer !== null) {
        clearTimeout(this.startWatchdogTimer)
        this.startWatchdogTimer = null
      }
      this.armMaxPlaybackWatchdog(revision, () => this.recoverFromWatchdog(revision))
      this.pendingTouchText = null
      this.setState(DIGITAL_HUMAN_STATES.SPEAKING)
      startSampler()
      return true
    } catch (caught) {
      if (this.startWatchdogTimer !== null) {
        clearTimeout(this.startWatchdogTimer)
        this.startWatchdogTimer = null
      }
      if (isNotAllowedPlaybackError(caught)) {
        this.activeWebAudioCleanup = null
        audio.onended = null
        audio.onerror = null
        this.pendingWebAudioSession = session
        this.setState(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)
        return true
      }
      teardown()
      return false
    }
  }

  cleanupWebAudioSession(session) {
    if (!session) return
    try { session.audio?.pause?.() } catch { /* ignore */ }
    try { session.sourceNode?.disconnect?.() } catch { /* ignore */ }
    try { session.analyser?.disconnect?.() } catch { /* ignore */ }
    try { session.audioCtx?.close?.() } catch { /* ignore */ }
    if (session.ownedObjectUrl && session.audioUrl) {
      try { URL.revokeObjectURL(session.audioUrl) } catch { /* ignore */ }
    }
  }

  async startFallbackSpeechSynthesis(spokenText, revision) {
    const synth = globalThis.speechSynthesis
    const Utterance = globalThis.SpeechSynthesisUtterance
    if (!synth || typeof synth.speak !== 'function' || typeof Utterance !== 'function') {
      this.fail('本地数字人语音无法播放，文字回答已保留。')
      return
    }

    const existingVoices = synth.getVoices?.() || []
    let voices = existingVoices
    if (voices.length === 0) {
      voices = await waitForVoicesBounded(synth, VOICES_CHANGED_TIMEOUT_MS)
      if (revision !== this.speechRevision || !this.initialized) return
    }

    this.launchUtteranceWithVoices(spokenText, voices, revision)
  }

  launchUtteranceWithVoices(spokenText, voices, revision) {
    const synth = globalThis.speechSynthesis
    const Utterance = globalThis.SpeechSynthesisUtterance
    if (!synth || typeof synth.speak !== 'function' || typeof Utterance !== 'function') {
      this.fail('本地数字人语音无法播放，文字回答已保留。')
      return
    }

    if (this.state !== DIGITAL_HUMAN_STATES.PREPARING_SPEECH) {
      this.setState(DIGITAL_HUMAN_STATES.PREPARING_SPEECH)
    }

    const loop = createPreviewAnimationLoop(spokenText, {
      onAnimationFrame: this.onAnimationFrame,
      intervalMs: this.intervalMs,
      charDurationMs: this.charDurationMs,
    })
    this.activeLoop = loop

    const utterance = new Utterance(spokenText)
    const matchedVoice = pickUtteranceVoice(voices, this.voiceLanguage)
    utterance.voice = matchedVoice
    utterance.lang = matchedVoice?.lang || this.voiceLanguage || 'zh-CN'
    utterance.rate = 0.95
    utterance.pitch = 1

    let started = false
    this.armStartWatchdog(revision, () => this.recoverFromWatchdog(revision))

    utterance.onstart = () => {
      if (revision !== this.speechRevision || !this.initialized) return
      started = true
      this.pendingTouchText = null
      if (this.startWatchdogTimer !== null) {
        clearTimeout(this.startWatchdogTimer)
        this.startWatchdogTimer = null
      }
      this.armMaxPlaybackWatchdog(revision, () => this.recoverFromWatchdog(revision))
      if (this.keepaliveTimer !== null) clearInterval(this.keepaliveTimer)
      if (this.keepaliveIntervalMs > 0) {
        this.keepaliveTimer = setInterval(() => {
          if (revision !== this.speechRevision || !this.utteranceActive) return
          if (synth.speaking && !synth.paused) {
            try {
              synth.pause?.()
              synth.resume?.()
            } catch {
              // Ignore browser engines that disallow mid-utterance pause/resume.
            }
          }
        }, this.keepaliveIntervalMs)
      }
      this.setState(DIGITAL_HUMAN_STATES.SPEAKING)
      loop.start()
    }

    utterance.onboundary = (event) => {
      if (revision !== this.speechRevision || !this.initialized) return
      if (typeof event?.charIndex === 'number') {
        loop.onBoundary(event.charIndex)
      }
    }

    utterance.onend = () => {
      if (revision !== this.speechRevision || !this.initialized) return
      this.clearWatchdogs()
      this.utteranceActive = false
      this.activeLoop = null
      this.pendingTouchText = null
      loop.stop()
      this.setState(DIGITAL_HUMAN_STATES.READY)
    }

    utterance.onerror = (event) => {
      if (revision !== this.speechRevision || !this.initialized) return
      const code = event?.error
      this.clearWatchdogs()
      this.utteranceActive = false
      this.activeLoop = null
      loop.stop()
      if (code === 'canceled' || code === 'interrupted') {
        if (isDigitalHumanPlaybackActive(this.state)) {
          this.setState(DIGITAL_HUMAN_STATES.READY)
        }
        return
      }
      if (!started && (code === 'not-allowed' || code === 'audio-busy')) {
        this.pendingTouchText = spokenText
        this.setState(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)
        return
      }
      this.pendingTouchText = null
      this.fail('本地数字人语音无法播放，文字回答已保留。')
    }

    try {
      this.utteranceActive = true
      synth.speak(utterance)
    } catch (caught) {
      this.clearWatchdogs()
      this.utteranceActive = false
      this.activeLoop = null
      loop.stop()
      if (isNotAllowedPlaybackError(caught)) {
        this.pendingTouchText = spokenText
        this.setState(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)
        return
      }
      this.fail('本地数字人语音无法播放，文字回答已保留。')
    }
  }

  stopActiveSpeech({ cancelSynth = false } = {}) {
    this.clearWatchdogs()
    if (this.activeSynthAbort) {
      try { this.activeSynthAbort.abort() } catch { /* ignore */ }
      this.activeSynthAbort = null
    }
    if (this.activeWebAudioCleanup) {
      const cleanup = this.activeWebAudioCleanup
      this.activeWebAudioCleanup = null
      cleanup()
    }
    if (this.pendingWebAudioSession) {
      this.cleanupWebAudioSession(this.pendingWebAudioSession)
      this.pendingWebAudioSession = null
    }
    if (this.activeLoop) {
      this.activeLoop.stop()
      this.activeLoop = null
    }
    if (cancelSynth && this.utteranceActive) {
      this.utteranceActive = false
      globalThis.speechSynthesis?.cancel?.()
    } else {
      this.utteranceActive = false
    }
  }

  fail(message) {
    this.speechRevision += 1
    this.pendingTouchText = null
    this.stopActiveSpeech({ cancelSynth: true })
    this.onAnimationFrame({ ...NEUTRAL_ANIMATION_FRAME })
    this.setState(DIGITAL_HUMAN_STATES.ERROR)
    this.onError(new Error(message))
  }

  getState() {
    return this.state
  }

  dispose() {
    this.speechRevision += 1
    this.pendingTouchText = null
    this.stopActiveSpeech({ cancelSynth: true })
    this.initialized = false
    this.pendingCharacter = null
    this.activeCharacterId = null
    this.onAnimationFrame({ ...NEUTRAL_ANIMATION_FRAME })
    this.setState(DIGITAL_HUMAN_STATES.DISPOSED)
  }

  setState(next) {
    if (this.state === next) return
    this.state = next
    this.onStateChange(next)
  }
}
