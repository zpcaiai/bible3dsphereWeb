// useGuidedAudio — 引导式播报：分步朗读 + 可配置留白 + 可暂停 / 跳步。
//
// 与「整段朗读」（useGlobalAudio.speak）的区别：
//   Lectio、省察、呼吸、时时同在 这类操练的关键不在于「把字念完」，
//   而在于念完之后的那段**安静**。本 hook 把「说一句 → 静 N 秒 → 再说下一句」
//   变成一等公民，并在留白期间对外暴露倒计时，供呼吸圈/进度环渲染。
//
// 用法：
//   const guided = useGuidedAudio()
//   guided.start([
//     { text: '慢慢读这段经文', pauseAfter: 30, label: '读经' },
//     { text: '哪一个字停在你心里？', pauseAfter: 45, label: '默想' },
//   ], { onStep, onComplete, chimeOnStep: true })
import { useCallback, useEffect, useRef, useState } from 'react'
import { speakOnce, stopAllAudio, pauseAllAudio, resumeAllAudio } from '../../useGlobalAudio'
import { getMediaPref } from './mediaPrefs'

const TICK_MS = 200

export function useGuidedAudio({ scope = 'default' } = {}) {
  const [state, setState] = useState('idle')   // idle | speaking | waiting | paused | done
  const [index, setIndex] = useState(-1)
  const [total, setTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [currentStep, setCurrentStep] = useState(null)

  const runIdRef = useRef(0)
  const pausedRef = useRef(false)
  const skipRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; runIdRef.current += 1; stopAllAudio() }
  }, [])

  const allowed = useCallback(() => (
    scope === 'crisis' ? getMediaPref('crisisAudio') : getMediaPref('sound')
  ), [scope])

  const stop = useCallback(() => {
    runIdRef.current += 1
    pausedRef.current = false
    skipRef.current = false
    stopAllAudio()
    if (!mountedRef.current) return
    setState('idle')
    setIndex(-1)
    setRemaining(0)
    setCurrentStep(null)
  }, [])

  const pause = useCallback(() => {
    pausedRef.current = true
    pauseAllAudio()
    if (mountedRef.current) setState('paused')
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    resumeAllAudio()
    if (mountedRef.current) setState((s) => (s === 'paused' ? 'waiting' : s))
  }, [])

  const skip = useCallback(() => {
    skipRef.current = true
    stopAllAudio()
  }, [])

  /** 可被暂停打断的等待。返回 false 表示这轮播报已被取消。 */
  const waitSeconds = useCallback((seconds, myRun) => new Promise((resolve) => {
    if (seconds <= 0) { resolve(true); return }
    let left = seconds * 1000
    if (mountedRef.current) setRemaining(Math.ceil(left / 1000))
    const timer = setInterval(() => {
      if (runIdRef.current !== myRun || !mountedRef.current) {
        clearInterval(timer); resolve(false); return
      }
      if (skipRef.current) {
        skipRef.current = false
        clearInterval(timer); setRemaining(0); resolve(true); return
      }
      if (pausedRef.current) return
      left -= TICK_MS
      setRemaining(Math.max(0, Math.ceil(left / 1000)))
      if (left <= 0) { clearInterval(timer); resolve(true) }
    }, TICK_MS)
  }), [])

  /**
   * @param {Array<{text?: string, pauseAfter?: number, label?: string, onEnter?: Function}>} steps
   * @param {{onStep?: Function, onComplete?: Function, rate?: number, force?: boolean}} [opts]
   */
  const start = useCallback(async (steps, opts = {}) => {
    const list = (steps || []).filter(Boolean)
    if (!list.length) return
    if (!opts.force && !allowed()) return

    runIdRef.current += 1
    const myRun = runIdRef.current
    pausedRef.current = false
    skipRef.current = false

    if (!mountedRef.current) return
    setTotal(list.length)
    setState('speaking')

    for (let i = 0; i < list.length; i += 1) {
      if (runIdRef.current !== myRun || !mountedRef.current) return
      const step = list[i]
      setIndex(i)
      setCurrentStep(step)
      setRemaining(0)
      opts.onStep?.(step, i)
      try { step.onEnter?.(step, i) } catch { /* 单步回调出错不中断整条流程 */ }

      if (step.text) {
        setState('speaking')
        // 暂停发生在朗读中时，等待恢复后再继续下一步
        const reason = await speakOnce(step.text, { rate: opts.rate })
        if (runIdRef.current !== myRun || !mountedRef.current) return
        if (reason === 'interrupted' && !skipRef.current) return
        skipRef.current = false
      }

      const pauseAfter = Number(step.pauseAfter || 0)
      if (pauseAfter > 0) {
        setState(pausedRef.current ? 'paused' : 'waiting')
        const ok = await waitSeconds(pauseAfter, myRun)
        if (!ok || runIdRef.current !== myRun || !mountedRef.current) return
      }
    }

    if (runIdRef.current !== myRun || !mountedRef.current) return
    setState('done')
    setRemaining(0)
    opts.onComplete?.()
  }, [allowed, waitSeconds])

  return {
    state, index, total, remaining, currentStep,
    running: state === 'speaking' || state === 'waiting' || state === 'paused',
    start, stop, pause, resume, skip,
    allowed: allowed(),
  }
}

export default useGuidedAudio
