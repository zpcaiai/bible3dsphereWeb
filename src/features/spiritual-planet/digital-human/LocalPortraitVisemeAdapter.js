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
const PUNCTUATION_CHARS = new Set(Array.from('，。！？；：、,.!?;: \n\r\t—…·“”‘’"\'（）()《》【】[]'))
const BILABIAL_CHARS = new Set(Array.from('bpmBPM不把被比本白百北步部保报平怕朋破排母木目们民明美面名牧摩米马吗么慢满蒙伯彼盼凭门默'))
const ROUNDED_CHARS = new Set(Array.from('uowüUOWÜ我你主说国果过火或活多都头口走手有又友周州后候古故苦路露书树出初入如女律绿约月王往问闻文物务无五武福父夫服所罗约瑟'))
const OPEN_CHARS = new Set(Array.from('aA阿啊大他她它那哪发法拉达答杀撒玛雅亚巴爸妈家下夏话花化拿看山善战赞爱哀安暗昂邦帮当党方放刚光康浪忙旁让上伤堂望向样章长张唱常迦扫罕'))
const DENTAL_LATIN_CHARS = new Set(Array.from('ieszjqxyIESZJQXY'))

const SHAPE_PARAMS = Object.freeze({
  [VISEME_SHAPES.REST]: { viseme: VISEME_SHAPES.REST, jawOpen: 0, lipRound: 0, lipPress: 0 },
  [VISEME_SHAPES.BILABIAL]: { viseme: VISEME_SHAPES.BILABIAL, jawOpen: 0.04, lipRound: 0.05, lipPress: 0.92 },
  [VISEME_SHAPES.ROUNDED]: { viseme: VISEME_SHAPES.ROUNDED, jawOpen: 0.42, lipRound: 0.88, lipPress: 0 },
  [VISEME_SHAPES.OPEN]: { viseme: VISEME_SHAPES.OPEN, jawOpen: 0.82, lipRound: 0.15, lipPress: 0 },
  [VISEME_SHAPES.DENTAL]: { viseme: VISEME_SHAPES.DENTAL, jawOpen: 0.28, lipRound: 0.1, lipPress: 0 },
})

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
    return { ...SHAPE_PARAMS[VISEME_SHAPES.DENTAL], isPause: false }
  }
  const codePoint = ch.codePointAt(0) || 0
  const bucket = codePoint % 5
  if (bucket === 1) {
    return { viseme: VISEME_SHAPES.OPEN, jawOpen: 0.56, lipRound: 0.14, lipPress: 0, isPause: false }
  }
  if (bucket === 3) {
    return { viseme: VISEME_SHAPES.ROUNDED, jawOpen: 0.36, lipRound: 0.68, lipPress: 0, isPause: false }
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

function prefersReducedMotion() {
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  } catch {
    return false
  }
}

function computeBlinkLevel(elapsedMs) {
  // Natural expressive blink near utterance onset (40ms..200ms, peak at 120ms).
  if (elapsedMs >= 40 && elapsedMs <= 200) {
    const distance = Math.abs(elapsedMs - 120) / 80
    return Number(Math.max(0, 1 - distance).toFixed(3))
  }
  // Asymmetric periodic blinks (~3100ms and ~3700ms alternating intervals, 160ms duration).
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

function findTimelineEntry(timeline, virtualMs) {
  if (!timeline.length) return SHAPE_PARAMS[VISEME_SHAPES.REST]
  const totalMs = timeline[timeline.length - 1].endMs
  const clampedMs = totalMs > 0 ? Math.min(virtualMs, totalMs - 1) : 0
  for (let i = 0; i < timeline.length; i += 1) {
    const item = timeline[i]
    if (clampedMs >= item.startMs && clampedMs < item.endMs) {
      return item
    }
  }
  return timeline[timeline.length - 1]
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
    const reduced = prefersReducedMotion()
    const virtualMs = boundaryBaseMs + Math.max(0, elapsedMs - boundaryAtElapsedMs)
    const entry = findTimelineEntry(timeline, virtualMs)
    if (reduced) {
      onAnimationFrame({
        viseme: entry.viseme,
        jawOpen: Number(Math.min(entry.jawOpen, 0.24).toFixed(3)),
        lipRound: Number(Math.min(entry.lipRound, 0.24).toFixed(3)),
        lipPress: Number(Math.min(entry.lipPress, 0.32).toFixed(3)),
        blink: 0,
        gazeX: 0,
        gazeY: 0,
        speaking: true,
      })
      return
    }
    const { gazeX, gazeY } = computeGaze(elapsedMs)
    const blink = computeBlinkLevel(elapsedMs)
    onAnimationFrame({
      viseme: entry.viseme,
      jawOpen: entry.jawOpen,
      lipRound: entry.lipRound,
      lipPress: entry.lipPress,
      blink,
      gazeX,
      gazeY,
      speaking: true,
    })
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

function pickUtteranceVoice(synth, language) {
  const voices = synth?.getVoices?.() || []
  const normalized = String(language || 'zh-CN')
  const prefix = normalized.split('-')[0].toLowerCase()
  return voices.find((voice) => voice.lang === normalized)
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix))
    || null
}

/** @implements {import('./DigitalHumanAdapter').DigitalHumanAdapter} */
export class LocalPortraitVisemeAdapter {
  constructor({
    onStateChange = () => {},
    onError = () => {},
    onAnimationFrame = () => {},
    intervalMs = 50,
    charDurationMs = 155,
  } = {}) {
    this.onStateChange = onStateChange
    this.onError = onError
    this.onAnimationFrame = onAnimationFrame
    this.intervalMs = intervalMs
    this.charDurationMs = charDurationMs
    this.state = DIGITAL_HUMAN_STATES.BOOTING
    this.initialized = false
    this.pendingCharacter = null
    this.activeCharacterId = null
    this.voiceLanguage = 'zh-CN'
    this.speechRevision = 0
    this.activeLoop = null
    this.utteranceActive = false
    this.pendingTouchText = null
  }

  async initialize() {
    if (this.initialized) return
    if (!isLocalSpeechSynthesisSupported()) {
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
  }

  async speakApproved(response) {
    const verified = validateDigitalHumanResponse(response, this.activeCharacterId)
    if (!verified.speechApproved) {
      throw new Error('Content has not passed the release gate')
    }
    if (this.state !== DIGITAL_HUMAN_STATES.READY) {
      throw new Error(`Avatar not ready: ${this.state}`)
    }
    this.startApprovedUtterance(verified.spokenText)
  }

  resumeAfterTouch() {
    if (!this.initialized || this.state !== DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH || !this.pendingTouchText) {
      return false
    }
    const text = this.pendingTouchText
    this.pendingTouchText = null
    this.startApprovedUtterance(text)
    return true
  }

  startApprovedUtterance(spokenText) {
    const synth = globalThis.speechSynthesis
    const Utterance = globalThis.SpeechSynthesisUtterance
    if (!synth || typeof synth.speak !== 'function' || typeof Utterance !== 'function') {
      this.fail('本地数字人语音无法播放，文字回答已保留。')
      return
    }

    const revision = ++this.speechRevision
    this.stopActiveSpeech({ cancelSynth: this.utteranceActive })
    this.setState(DIGITAL_HUMAN_STATES.PREPARING_SPEECH)

    const loop = createPreviewAnimationLoop(spokenText, {
      onAnimationFrame: this.onAnimationFrame,
      intervalMs: this.intervalMs,
      charDurationMs: this.charDurationMs,
    })
    this.activeLoop = loop

    const utterance = new Utterance(spokenText)
    const matchedVoice = pickUtteranceVoice(synth, this.voiceLanguage)
    utterance.voice = matchedVoice
    utterance.lang = matchedVoice?.lang || this.voiceLanguage || 'zh-CN'
    utterance.rate = 0.95
    utterance.pitch = 1

    let started = false
    utterance.onstart = () => {
      if (revision !== this.speechRevision || !this.initialized) return
      started = true
      this.pendingTouchText = null
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
      this.utteranceActive = false
      this.activeLoop = null
      this.pendingTouchText = null
      loop.stop()
      this.setState(DIGITAL_HUMAN_STATES.READY)
    }

    utterance.onerror = (event) => {
      if (revision !== this.speechRevision || !this.initialized) return
      const code = event?.error
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
      this.utteranceActive = false
      this.activeLoop = null
      loop.stop()
      const name = String(caught?.name || caught?.message || '')
      if (/NotAllowed|not-allowed/i.test(name)) {
        this.pendingTouchText = spokenText
        this.setState(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)
        return
      }
      this.fail('本地数字人语音无法播放，文字回答已保留。')
    }
  }

  stopActiveSpeech({ cancelSynth = false } = {}) {
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
