import { useEffect, useState } from 'react'
import { ADDICTION_DELAY_STEPS, HALT_ITEMS } from '../data/crisisContent'

/**
 * AddictionDelayFlow — 成瘾复发冲动的即时干预：HALT 检查 + 10 分钟延迟。
 * 不要求永远不犯，只把行动推迟 10 分钟。
 */
export default function AddictionDelayFlow() {
  const [halt, setHalt] = useState([])
  const [seconds, setSeconds] = useState(null)

  useEffect(() => {
    if (seconds === null || seconds <= 0) return undefined
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds])

  const mm = seconds != null ? String(Math.floor(seconds / 60)).padStart(2, '0') : '10'
  const ss = seconds != null ? String(seconds % 60).padStart(2, '0') : '00'
  const finished = seconds === 0

  return (
    <div className="cc-card">
      <h3>先别急，我们只推迟 10 分钟</h3>
      <p>你现在不用承诺永远不再犯，也不用靠意志战胜一生的问题。你只需要把这个行动延迟 10 分钟。</p>

      <h3 style={{ marginTop: 12 }}>先做 HALT 检查</h3>
      <p className="cc-muted">很多复发冲动，其实是身体在喊这四件事之一：</p>
      <div className="cc-pill-row">
        {HALT_ITEMS.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`cc-pill ${halt.includes(it.key) ? 'active' : ''}`}
            onClick={() => setHalt((h) => (h.includes(it.key) ? h.filter((x) => x !== it.key) : [...h, it.key]))}
          >
            {it.label}
          </button>
        ))}
      </div>

      <h3 style={{ marginTop: 12 }}>现在做这三步</h3>
      {ADDICTION_DELAY_STEPS.map((s, i) => (
        <p key={i}>{i + 1}. {s}</p>
      ))}

      <div style={{ textAlign: 'center', margin: '14px 0' }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: finished ? '#34c759' : '#e6edf3' }}>{mm}:{ss}</div>
        {seconds === null && (
          <button className="cc-btn full" type="button" onClick={() => setSeconds(600)} style={{ marginTop: 8 }}>开始 10 分钟倒计时</button>
        )}
        {finished && <p style={{ color: '#34c759' }}>你撑过了这 10 分钟。冲动会像浪一样退下去。要再来 10 分钟也可以。</p>}
      </div>
    </div>
  )
}
