import { useEffect, useRef, useState } from 'react'

/**
 * BreathingGuide — 4-1-6 呼吸引导（吸气4秒 / 停1秒 / 呼气6秒，共11秒一轮）。
 * 与 CSS @keyframes cc-breathe 同步。呼气比吸气长，告诉身体「现在是安全的」。
 */
const PHASES = [
  { label: '吸气', secs: 4 },
  { label: '屏住', secs: 1 },
  { label: '呼气', secs: 6 },
]

export default function BreathingGuide({ targetCycles = 5 }) {
  const [running, setRunning] = useState(true)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [cycles, setCycles] = useState(0)
  const tick = useRef(null)

  useEffect(() => {
    if (!running) return undefined
    let i = phaseIdx
    function next() {
      const cur = PHASES[i]
      tick.current = setTimeout(() => {
        i = (i + 1) % PHASES.length
        if (i === 0) setCycles((c) => c + 1)
        setPhaseIdx(i)
        next()
      }, cur.secs * 1000)
    }
    next()
    return () => clearTimeout(tick.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const done = cycles >= targetCycles

  return (
    <div className={`cc-breath-wrap ${running ? '' : 'cc-breath-paused'}`}>
      <div className="cc-breath-circle">{PHASES[phaseIdx].label}</div>
      <p className="cc-muted" style={{ textAlign: 'center', margin: 0 }}>
        {done
          ? `做完了 ${cycles} 轮。如果还需要，就再陪自己几轮。`
          : `第 ${cycles + 1} / ${targetCycles} 轮 · 吸气 4 秒，停 1 秒，呼气 6 秒`}
      </p>
      <div className="cc-choice" style={{ width: '100%' }}>
        <button className="cc-btn secondary" type="button" onClick={() => setRunning((r) => !r)}>
          {running ? '暂停' : '继续'}
        </button>
        <button className="cc-btn ghost" type="button" onClick={() => { setCycles(0); setPhaseIdx(0); setRunning(true) }}>
          重新开始
        </button>
      </div>
    </div>
  )
}
