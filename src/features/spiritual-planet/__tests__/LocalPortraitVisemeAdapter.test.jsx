import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DIGITAL_HUMAN_STATES } from '../digital-human/DigitalHumanAdapter'
import AnimatedCharacterStage from '../digital-human/AnimatedCharacterStage'
import {
  extractVisemeTimeline,
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
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) {
        this.text = text
      }
    })
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
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

  it('deterministically extracts phonetic visemes for bilabial, rounded, open, dental, and punctuation pauses', () => {
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

    // Remaining CJK characters articulate deterministically without freezing.
    const general = extractVisemeTimeline('希伯来诗篇颂赞')
    expect(new Set(general.map((item) => item.viseme)).size).toBeGreaterThanOrEqual(2)
  })

  it('strictly blocks unapproved THEOLOGY_REVIEW responses at the speakApproved gate', async () => {
    expect(isLocalSpeechSynthesisSupported()).toBe(true)
    const adapter = new LocalPortraitVisemeAdapter()
    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)
    expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled()

    const unapproved = makeResponse({ speechApproved: false, contentReviewState: 'THEOLOGY_REVIEW' })
    await expect(adapter.speakApproved(unapproved)).rejects.toThrow('Content has not passed the release gate')
    expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled()
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)
    adapter.dispose()
  })

  it('speaks approved responses, drives viseme transitions plus eye blink and gaze, and resets to neutral on end', async () => {
    const states = []
    const frames = []
    const adapter = new LocalPortraitVisemeAdapter({
      onStateChange: (next) => states.push(next),
      onAnimationFrame: (frame) => frames.push(frame),
      intervalMs: 50,
      charDurationMs: 150,
    })

    await adapter.initialize()
    await adapter.loadCharacter(DAVID_PROFILE)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)

    const approved = makeResponse({ spokenText: '牧者主说大爱。' })
    await adapter.speakApproved(approved)
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.SPEAKING)
    expect(globalThis.speechSynthesis.speak).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(650)
    // Utterance boundary event anchors directly onto '大' (charIndex 4).
    lastUtterance.onboundary?.({ charIndex: 4 })
    vi.advanceTimersByTime(100)

    const speakingFrames = frames.filter((f) => f.speaking)
    expect(speakingFrames.length).toBeGreaterThan(4)
    const observedVisemes = new Set(speakingFrames.map((f) => f.viseme))
    expect(observedVisemes.has(VISEME_SHAPES.BILABIAL)).toBe(true)
    expect(observedVisemes.has(VISEME_SHAPES.ROUNDED)).toBe(true)
    expect(observedVisemes.has(VISEME_SHAPES.OPEN)).toBe(true)
    expect(speakingFrames.some((f) => f.blink > 0.5)).toBe(true)
    expect(speakingFrames.some((f) => Math.abs(f.gazeX) > 0 && Math.abs(f.gazeY) > 0)).toBe(true)

    lastUtterance.onend?.()
    expect(adapter.getState()).toBe(DIGITAL_HUMAN_STATES.READY)
    expect(frames[frames.length - 1]).toEqual(NEUTRAL_ANIMATION_FRAME)
    expect(states).toContain(DIGITAL_HUMAN_STATES.PREPARING_SPEECH)
    expect(states).toContain(DIGITAL_HUMAN_STATES.SPEAKING)
    adapter.dispose()
  })

  it('transitions to WAITING_FOR_TOUCH on autoplay block and replays within user gesture via resumeAfterTouch', async () => {
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

  it('suppresses eye blink and gaze motion when prefers-reduced-motion is enabled', async () => {
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

  it('renders AnimatedCharacterStage with exact 1 workspace portrait image and live SVG rig attributes', () => {
    const onStageTouch = vi.fn()
    const { rerender } = render(
      <AnimatedCharacterStage
        characterId="david"
        name="大卫"
        avatar={DAVID_PROFILE.avatar}
        size={256}
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
    expect(screen.getByTestId('dh-animated-rig').getAttribute('aria-hidden')).toBe('true')
    expect(document.querySelectorAll('img[data-portrait-context="workspace"]')).toHaveLength(1)

    fireEvent.click(stage)
    expect(onStageTouch).toHaveBeenCalledTimes(1)

    rerender(
      <AnimatedCharacterStage
        characterId="david"
        name="大卫"
        avatar={DAVID_PROFILE.avatar}
        size={256}
        frame={NEUTRAL_ANIMATION_FRAME}
      />,
    )
    expect(stage.dataset.speaking).toBe('false')
    expect(stage.dataset.viseme).toBe('REST')
    expect(stage.dataset.eyeBlinking).toBe('false')
  })
})
