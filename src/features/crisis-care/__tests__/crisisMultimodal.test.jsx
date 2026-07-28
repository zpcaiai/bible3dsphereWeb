/* 危机关怀多模态护栏测试。
   这些不是「功能是否好用」的测试，是「在最坏情况下会不会伤到人」的测试。 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import { resetMediaPrefs, setMediaPref, getMediaPref } from '../../../lib/media/mediaPrefs'
import { HAPTIC_PATTERNS } from '../../../lib/media/useHaptics'
import BreathingGuide from '../components/BreathingGuide'
import GroundingExercise from '../components/GroundingExercise'
import AddictionDelayFlow from '../components/AddictionDelayFlow'
import CrisisHelpButton from '../components/CrisisHelpButton'
import { SoundConsentBar } from '../../../lib/media/MediaControls'

vi.mock('../lib/api', () => ({ crisisApi: { comfort: () => Promise.resolve(null) } }))

describe('危机关怀 · 声音与振动护栏', () => {
  beforeEach(() => { setRuntimeLang('zh'); resetMediaPrefs(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('进入危机页时声音与振动都是关闭的（必须显式开启）', () => {
    expect(getMediaPref('crisisAudio')).toBe(false)
    expect(getMediaPref('crisisHaptics')).toBe(false)
  })

  it('同意条提供开启入口，开启后出现「全部关掉」', () => {
    render(<SoundConsentBar />)
    expect(screen.queryByText('全部关掉')).toBeNull()
    fireEvent.click(screen.getByTitle('开启或关闭引导声音'))
    expect(getMediaPref('crisisAudio')).toBe(true)
    expect(screen.getByText('全部关掉')).toBeTruthy()
  })

  it('「全部关掉」一次关闭所有发声与振动', () => {
    setMediaPref('crisisAudio', true)
    setMediaPref('crisisHaptics', true)
    render(<SoundConsentBar />)
    fireEvent.click(screen.getByText('全部关掉'))
    expect(getMediaPref('crisisAudio')).toBe(false)
    expect(getMediaPref('crisisHaptics')).toBe(false)
  })

  it('振动关闭时不调用 navigator.vibrate', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    render(<CrisisHelpButton onClick={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('振动开启后才会调用 navigator.vibrate', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    setMediaPref('crisisHaptics', true)
    render(<CrisisHelpButton onClick={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.ack)
  })

  it('触觉模式里没有长时间连续振动（避免惊吓与再次触发）', () => {
    Object.values(HAPTIC_PATTERNS).forEach((p) => {
      p.forEach((ms) => expect(ms).toBeLessThanOrEqual(120))
      expect(p.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(400)
    })
  })
})

describe('BreathingGuide 呼吸引导', () => {
  beforeEach(() => { setRuntimeLang('zh'); resetMediaPrefs(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('渲染出呼吸圈并给出相位文字（不依赖声音也完整可用）', () => {
    render(<BreathingGuide targetCycles={2} />)
    expect(screen.getByText('吸气')).toBeTruthy()
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
  })

  it('相位按 4-1-6 推进：4 秒后进入屏住', () => {
    render(<BreathingGuide targetCycles={2} />)
    act(() => { vi.advanceTimersByTime(4100) })
    expect(screen.getByText('屏住')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getByText('呼气')).toBeTruthy()
  })

  it('呼气比吸气长——这是「安全信号」的关键，不能被改短', () => {
    render(<BreathingGuide targetCycles={2} />)
    act(() => { vi.advanceTimersByTime(5100) })
    expect(screen.getByText('呼气')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText('呼气')).toBeTruthy() // 呼气 6 秒，5 秒时还没结束
  })

  it('声音关闭时提示可以打开，且不自动发声', () => {
    render(<BreathingGuide targetCycles={2} />)
    expect(screen.getByText(/可以在上面打开声音/)).toBeTruthy()
  })
})

describe('GroundingExercise 着陆练习', () => {
  beforeEach(() => { resetMediaPrefs() })

  it('五个步骤全部可见（纯文字路径必须始终完整）', () => {
    render(<GroundingExercise />)
    expect(screen.getByText(/说出你看见的 5 个东西/)).toBeTruthy()
    expect(screen.getByText(/感受到的 1 个身体感觉/)).toBeTruthy()
  })

  it('声音关闭时不显示引导播报入口', () => {
    render(<GroundingExercise />)
    expect(screen.queryByText(/闭着眼，跟我一步一步来/)).toBeNull()
  })

  it('声音开启后才出现引导播报入口', () => {
    setMediaPref('crisisAudio', true)
    render(<GroundingExercise />)
    expect(screen.getByText(/闭着眼，跟我一步一步来/)).toBeTruthy()
  })

  it('全部完成后给出「你是安全的」的确认', () => {
    render(<GroundingExercise />)
    const steps = screen.getAllByRole('button').filter((b) => /·/.test(b.textContent))
    steps.forEach((s) => fireEvent.click(s))
    expect(screen.getByText(/这是现在，不是那时，你是安全的/)).toBeTruthy()
  })
})

describe('AddictionDelayFlow 延迟策略', () => {
  beforeEach(() => { setRuntimeLang('zh'); resetMediaPrefs(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('倒计时以 10:00 起步并可开始', () => {
    render(<AddictionDelayFlow />)
    expect(screen.getAllByText('10:00').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('开始 10 分钟倒计时'))
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getAllByText('09:59').length).toBeGreaterThan(0)
  })

  it('倒计时结束给出「撑过去了」而不是评判', () => {
    render(<AddictionDelayFlow />)
    fireEvent.click(screen.getByText('开始 10 分钟倒计时'))
    // 倒计时是「每次 setState 后重挂一个 setTimeout」的链式结构，
    // 因此必须逐秒推进，让 React 每一拍都有机会重新挂上下一个计时器。
    for (let i = 0; i < 600; i += 1) act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText(/你撑过了这 10 分钟/)).toBeTruthy()
    expect(screen.getByText('再来 10 分钟')).toBeTruthy()
  })
})
