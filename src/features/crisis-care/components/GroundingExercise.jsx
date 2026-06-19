import { useState } from 'react'

/**
 * GroundingExercise — 5-4-3-2-1 着陆练习。逐步把注意力带回此刻。
 * 用于解离、惊恐、创伤触发时的稳定，不分析原因、不逼回忆。
 */
const STEPS = [
  { n: 5, sense: '看见', hint: '说出你看见的 5 个东西' },
  { n: 4, sense: '摸到', hint: '摸到的 4 个东西' },
  { n: 3, sense: '听见', hint: '听见的 3 个声音' },
  { n: 2, sense: '闻到', hint: '闻到的 2 个气味' },
  { n: 1, sense: '感受', hint: '感受到的 1 个身体感觉' },
]

export default function GroundingExercise() {
  const [done, setDone] = useState([])

  function toggle(i) {
    setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))
  }

  return (
    <div>
      <p className="cc-muted">不用做得完美，只要慢慢把自己带回此刻。</p>
      {STEPS.map((s, i) => (
        <div
          key={s.n}
          className={`cc-step ${done.includes(i) ? 'done' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => toggle(i)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(i)}
          style={{ cursor: 'pointer' }}
        >
          <b>{s.n}</b> · {s.sense} — {s.hint}
        </div>
      ))}
      {done.length === STEPS.length && (
        <p style={{ color: '#34c759' }}>你已经把自己带回到现在了。这是现在，不是那时，你是安全的。</p>
      )}
    </div>
  )
}
