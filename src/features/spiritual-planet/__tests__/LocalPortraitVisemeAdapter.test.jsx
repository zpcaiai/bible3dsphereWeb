import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DIGITAL_HUMAN_STATES } from '../digital-human/DigitalHumanAdapter'
import AnimatedCharacterStage from '../digital-human/AnimatedCharacterStage'
import {
  classifySpectralVisemeFromBuffers,
  extractVisemeTimeline,
  findTimelineEntry,
  isLocalSpeechSynthesisSupported,
  LocalPortraitVisemeAdapter,
  NEUTRAL_ANIMATION_FRAME,
  VISEME_SHAPES,
} from '../digital-human/LocalPortraitVisemeAdapter'

const DAVID_PROFILE = {
  id: 'david',
  canonicalName: '大卫',
  englishName: 'David',
  avatar: {
    modelUrl: null,
    portraitUrl: 'https://cdn.holiness.uk/characters/david/v1/portrait.webp',
    version: '1',
    reviewState: 'APPROVED',
  },
  voice: {
    provider: 'azure',
    voiceId: null,
    language: 'zh-CN',
    reviewState: 'THEOLOGY_REVIEW',
  },
  recommendedQuestions: [],
  runtimeReady: false,
}

function makeResponse({ speechApproved = true, contentReviewState = 'APPROVED', spokenText = '主是我牧者，我不惧怕。' } = {}) {
  return {
    characterId: 'david',
    answerType: 'FACT',
    spokenText,
    displayText: spokenText,
    references: [{ sourceType: 'SCRIPTURE', locator: 'Psalm 23:1', claimSupport: 'DIRECT' }],
    warnings: [],
    groundingLevel: 'G5_DIRECT_SCRIPTURE',
    relatedCharacters: [],
    relatedEvents: ['psalm-23'],
    contentVersion: '1.3.0',
    contentSha256: 'b'.repeat(64),
    contentReviewState,
    speechApproved,
  }
}

describe('LocalPortraitVisemeAdapter & AnimatedCharacterStage', () => {
  let lastUtterance = null

  beforeEach(() => {
    vi.useFakeTimers()
    lastUtterance = null
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) {
        this.text = text
      }
    })
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      speaking: true,
      paused: false,
      getVoices: vi.fn(() => [{ lang: 'zh-CN', name: 'Chinese Voice' }]),
      speak: vi.fn((utterance) => {
        lastUtterance = utterance
        utterance.onstart?.()
      }),
    })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('deterministically extracts phonetic visemes without modulo hacks and decays to REST (0.06) past timeline end', () => {
    const timeline = extractVisemeTimeline('母牧，主说，大他！')
    const byChar = Object.fromEntries(Array.from('母牧，主说，大他！').map((ch, idx) => [ch, timeline[idx]]))

    expect(byChar['母'].viseme).toBe(VISEME_SHAPES.BILABIAL)
    expect(byChar['母'].lipPress).toBeCloseTo(0.92, 2)
    expect(byChar['牧'].viseme).toBe(VISEME_SHAPES.BILABIAL)
    expect(byChar['，'].viseme).toBe(VISEME_SHAPES.REST)
    expect(byChar['，'].endMs - byChar['，'].startMs).toBe(180)
    expect(byChar['主'].viseme).toBe(VISEME_SHAPES.ROUNDED)
    expect(byChar['主'].lipRound).toBeCloseTo(0.88, 2)
    expect(byChar['说'].viseme).toBe(VISEME_SHAPES.ROUNDED)
    expect(byChar['大'].viseme).toBe(VISEME_SHAPES.OPEN)
    expect(byChar['大'].jawOpen).toBeCloseTo(0.82, 2)
    expect(byChar['他'].viseme).toBe(VISEME_SHAPES.OPEN)
    expect(byChar['！'].viseme).toBe(VISEME_SHAPES.REST)

    const openOnly = extractVisemeTimeline('大爱')
    const totalEndMs = openOnly[openOnly.length - 1].endMs
    const postEnd = findTimelineEntry(openOnly, totalEndMs + 250)
    expect(postEnd).toEqual({
      viseme: VISEME_SHAPES.REST,
      jawOpen: 0.06,
      lipRound: 0,
      lipPress: 0,
    })

    const general = extractVisemeTimeline('希伯来诗篇颂赞')
    expect(new Set(general.map((item) => item.viseme)).size).toBeGreaterThanOrEqual(3)
  })

  it('strictly blocks unapproved THEOLOGY_REVIEW responses at the speakApproved gate', async () => {
    expect(isLocalSpeechSynthesisSupported()).toBe(true)
    const adapter = new LocalPortraitVisemeAdapter()
    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)

    const unapproved = makeResponse({ speechApproved: false, contentReviewState: 'THEOLOGY_REVIEW' })
    await expect(adapter.speakApproved(unapproved)).rejects.toThrow('Content has not passed the release gate')
    expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled()
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)
    adapter.dispose()
  })

  it('drives real-time WebAudio AnalyserNode (fftSize=256) spectral lip-sync from /api/tts and coordinates stopAllAudio()', async () => {
    let activeAudio = null
    let currentTimeSample = new Uint8Array(256).fill(128)
    let currentFreqSample = new Uint8Array(128).fill(0)

    class FakeAudio {
      constructor(src) {
        this.src = src
        this.play = vi.fn(() => Promise.resolve())
        this.pause = vi.fn()
        activeAudio = this
      }
    }

    class FakeAudioContext {
      constructor() {
        this.sampleRate = 48000
        this.state = 'running'
        this.destination = {}
        this.resume = vi.fn(() => Promise.resolve())
        this.close = vi.fn(() => Promise.resolve())
      }
      createMediaElementSource() {
        return { connect: vi.fn(), disconnect: vi.fn() }
      }
      createAnalyser() {
        return {
          fftSize: 256,
          frequencyBinCount: 128,
          smoothingTimeConstant: 0.65,
          connect: vi.fn(),
          disconnect: vi.fn(),
          getByteTimeDomainData: (arr) => arr.set(currentTimeSample),
          getByteFrequencyData: (arr) => arr.set(currentFreqSample),
        }
      }
    }

    vi.stubGlobal('Audio', FakeAudio)
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(() => cb(performance.now()), 20))
    vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id))

    const frames = []
    const synthesizeAudio = vi.fn(async () => new Blob(['fake-mp3-bytes'], { type: 'audio/mpeg' }))
    const adapter = new LocalPortraitVisemeAdapter({
      synthesizeAudio,
      onAnimationFrame: (f) => frames.push(f),
    })

    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)

    // Mid-band vowel dominance (500..2200Hz -> bins 3..11 at 187.5Hz/bin) + strong RMS -> OPEN
    currentTimeSample = new Uint8Array(256).map((_, i) => (i % 2 === 0 ? 195 : 61))
    currentFreqSample = new Uint8Array(128)
    for (let b = 4; b <= 9; b += 1) currentFreqSample[b] = 240

    await adapter.speakApproved(makeResponse({ spokenText: '阿爸父啊' }))
    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled()
    expect(synthesizeAudio).toHaveBeenCalledTimes(1)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.SPEAKING)
    expect(frames.some((f) => f.viseme === VISEME_SHAPES.OPEN && f.jawOpen > 0.4)).toBe(true)

    // High-band sibilant dominance (>2200Hz -> bins 14..40) -> DENTAL
    currentTimeSample = new Uint8Array(256).map((_, i) => (i % 2 === 0 ? 156 : 100))
    currentFreqSample = new Uint8Array(128)
    for (let b = 15; b <= 32; b += 1) currentFreqSample[b] = 230
    vi.advanceTimersByTime(40)
    expect(frames.some((f) => f.viseme === VISEME_SHAPES.DENTAL)).toBe(true)

    // Low-band (<500Hz -> bins 1..2) low-amplitude occlusion -> BILABIAL
    currentTimeSample = new Uint8Array(256).map((_, i) => (i % 2 === 0 ? 136 : 120))
    currentFreqSample = new Uint8Array(128)
    currentFreqSample[1] = 220
    currentFreqSample[2] = 210
    vi.advanceTimersByTime(40)
    expect(frames.some((f) => f.viseme === VISEME_SHAPES.BILABIAL)).toBe(true)

    // Direct check on ROUNDED spectral profile
    const roundedTime = new Uint8Array(256).map((_, i) => (i % 2 === 0 ? 168 : 88))
    const roundedFreq = new Uint8Array(128)
    roundedFreq[1] = 240
    roundedFreq[2] = 235
    roundedFreq[4] = 150
    expect(classifySpectralVisemeFromBuffers(roundedTime, roundedFreq, 48000, 256).viseme).toBe(VISEME_SHAPES.ROUNDED)

    activeAudio.onended?.()
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)
    expect(frames[frames.length - 1]).toEqual(NEUTRAL_ANIMATION_FRAME)
    adapter.dispose()
  })

  it('recovers WebAudio autoplay NotAllowedError via WAITING_FOR_TOUCH and resumeAfterGesture()', async () => {
    let shouldBlock = true
    let resumeCtxSpy = null

    class BlockedAudio {
      constructor() {
        this.play = vi.fn(() => {
          if (shouldBlock) {
            shouldBlock = false
            const err = new Error('play() failed because the user did not interact')
            err.name = 'NotAllowedError'
            return Promise.reject(err)
          }
          return Promise.resolve()
        })
        this.pause = vi.fn()
      }
    }

    class SuspendedAudioContext {
      constructor() {
        this.sampleRate = 48000
        this.state = 'suspended'
        this.destination = {}
        this.resume = vi.fn(async () => { this.state = 'running' })
        this.close = vi.fn()
        resumeCtxSpy = this.resume
      }
      createMediaElementSource() {
        return { connect: vi.fn(), disconnect: vi.fn() }
      }
      createAnalyser() {
        return {
          fftSize: 256,
          frequencyBinCount: 128,
          connect: vi.fn(),
          disconnect: vi.fn(),
          getByteTimeDomainData: (arr) => arr.fill(128),
          getByteFrequencyData: (arr) => arr.fill(0),
        }
      }
    }

    vi.stubGlobal('Audio', BlockedAudio)
    vi.stubGlobal('AudioContext', SuspendedAudioContext)

    const adapter = new LocalPortraitVisemeAdapter({
      synthesizeAudio: async () => new Blob(['tts-bytes'], { type: 'audio/mpeg' }),
    })
    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)

    await adapter.speakApproved(makeResponse({ spokenText: '诗篇二十三篇。' }))
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)

    const resumed = await adapter.resumeAfterGesture()
    expect(resumed).toBe(true)
    expect(resumeCtxSpy).toHaveBeenCalled()
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.SPEAKING)
    adapter.dispose()
  })

  it('awaits voiceschanged (500ms bounded), keeps Chrome >12s utterances alive, and recovers from dropped TTS events via watchdogs', async () => {
    let voices = []
    let voicesChangedHandler = null
    globalThis.speechSynthesis.getVoices = vi.fn(() => voices)
    globalThis.speechSynthesis.addEventListener = vi.fn((evt, cb) => {
      if (evt === 'voiceschanged') voicesChangedHandler = cb
    })
    globalThis.speechSynthesis.removeEventListener = vi.fn()

    const adapter = new LocalPortraitVisemeAdapter({
      startWatchdogMs: 15_000,
      maxPlaybackWatchdogMs: 180_000,
      keepaliveIntervalMs: 10_000,
    })
    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)

    const speakPromise = adapter.speakApproved(makeResponse({ spokenText: '牧者主说大爱。' }))
    voices = [{ lang: 'zh-CN', name: 'Mandarin Voice' }]
    voicesChangedHandler?.()
    await speakPromise

    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.SPEAKING)
    expect(lastUtterance.voice?.name).toBe('Mandarin Voice')

    // Chrome >12s pause/resume keepalive
    vi.advanceTimersByTime(12_500)
    expect(globalThis.speechSynthesis.pause).toHaveBeenCalled()
    expect(globalThis.speechSynthesis.resume).toHaveBeenCalled()

    // Max playback watchdog (180s) unlocks half-duplex state if onend is dropped
    vi.advanceTimersByTime(180_000)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)

    // Start watchdog (15s) unlocks if onstart never fires
    globalThis.speechSynthesis.speak = vi.fn(() => { /* dropped onstart */ })
    await adapter.speakApproved(makeResponse({ spokenText: '等候耶和华。' }))
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.PREPARING_SPEECH)
    vi.advanceTimersByTime(15_000)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)
    adapter.dispose()
  })

  it('transitions to WAITING_FOR_TOUCH on speechSynthesis autoplay block and replays via resumeAfterTouch', async () => {
    let blockedOnce = true
    globalThis.speechSynthesis.speak = vi.fn((utterance) => {
      lastUtterance = utterance
      if (blockedOnce) {
        blockedOnce = false
        utterance.onerror?.({ error: 'not-allowed' })
      } else {
        utterance.onstart?.()
      }
    })

    const adapter = new LocalPortraitVisemeAdapter()
    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)

    await adapter.speakApproved(makeResponse({ spokenText: '大卫诗篇。' }))
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)

    expect(adapter.resumeAfterTouch()).toBe(true)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.SPEAKING)
    lastUtterance.onend?.()
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)
    adapter.dispose()
  })

  it('suppresses eye blink, gaze, and portrait transform when prefers-reduced-motion is enabled', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const frames = []
    const adapter = new LocalPortraitVisemeAdapter({
      onAnimationFrame: (frame) => frames.push(frame),
      intervalMs: 50,
    })
    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)
    await adapter.speakApproved(makeResponse({ spokenText: '牧者主说大爱。' }))

    vi.advanceTimersByTime(300)
    const speakingFrames = frames.filter((f) => f.speaking)
    expect(speakingFrames.length).toBeGreaterThan(2)
    expect(speakingFrames.every((f) => f.blink === 0 && f.gazeX === 0 && f.gazeY === 0)).toBe(true)
    expect(speakingFrames.every((f) => f.jawOpen <= 0.24)).toBe(true)
    adapter.dispose()
  })

  it('renders AnimatedCharacterStage with anatomical upper-eye/lower-jaw layers, live waveform, single workspace img, and zero cy=230 eyeballs', () => {
    const onStageTouch = vi.fn()
    const { rerender, container } = render(
      <AnimatedCharacterStage
        characterId="david"
        name="大卫"
        avatar={DAVID_PROFILE.avatar}
        size={320}
        frame={{
          viseme: VISEME_SHAPES.ROUNDED,
          jawOpen: 0.42,
          lipRound: 0.88,
          lipPress: 0,
          blink: 0.9,
          gazeX: 0.35,
          gazeY: -0.15,
          speaking: true,
        }}
        onStageTouch={onStageTouch}
      />,
    )

    const stage = screen.getByTestId('dh-animated-stage')
    expect(stage.dataset.speaking).toBe('true')
    expect(stage.dataset.viseme).toBe('ROUNDED')
    expect(stage.dataset.eyeBlinking).toBe('true')
    expect(stage.style.maxWidth).toBe('100%')
    expect(screen.getByTestId('dh-animated-rig').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByTestId('dh-rig-mouth').dataset.viseme).toBe('ROUNDED')
    expect(screen.getByTestId('dh-voice-waveform')).toBeTruthy()
    expect(document.querySelectorAll('img[data-portrait-context="workspace"]')).toHaveLength(1)

    // Verify zero collinear cy=230 eyeballs/mouth HUD pill
    const cy230Elements = container.querySelectorAll('[cy="230"]')
    expect(cy230Elements).toHaveLength(0)

    fireEvent.click(stage)
    expect(onStageTouch).toHaveBeenCalledTimes(1)

    rerender(
      <AnimatedCharacterStage
        characterId="david"
        name="大卫"
        avatar={DAVID_PROFILE.avatar}
        size={390}
        frame={NEUTRAL_ANIMATION_FRAME}
      />,
    )
    expect(stage.dataset.speaking).toBe('false')
    expect(stage.dataset.viseme).toBe('REST')
    expect(stage.dataset.eyeBlinking).toBe('false')
  })
})
