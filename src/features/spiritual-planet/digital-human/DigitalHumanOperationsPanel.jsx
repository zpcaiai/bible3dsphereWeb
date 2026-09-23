import { useEffect, useState } from 'react'
import { getDigitalHumanMetrics } from './api'

const value = (item, suffix = '') => item == null ? '—' : `${item}${suffix}`

export default function DigitalHumanOperationsPanel({ enabled }) {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    const refresh = () => getDigitalHumanMetrics(900)
      .then((result) => { if (active) { setMetrics(result); setError('') } })
      .catch((caught) => { if (active) setError(caught.message) })
    refresh()
    const timer = window.setInterval(refresh, 15_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [enabled])

  if (!enabled) return null
  return (
    <section className="dh-operations" aria-label="数字人运行监控">
      <header><div><span>OPERATIONS · 15 MIN</span><h3>运行监控</h3></div><small>不含原始音频、转录或问题正文</small></header>
      {error && <p role="alert">监控数据暂不可用：{error}</p>}
      {metrics && <>
        <div className="dh-metric-grid">
          <article><strong>{value(metrics.turns?.total)}</strong><span>总轮次</span></article>
          <article><strong>{value(metrics.latencyMs?.p50, ' ms')}</strong><span>P50</span></article>
          <article><strong>{value(metrics.latencyMs?.p95, ' ms')}</strong><span>P95</span></article>
          <article><strong>{value(metrics.turns?.speechReadyRatePct, '%')}</strong><span>可发声率</span></article>
          <article><strong>{value(metrics.turns?.blockedRatePct, '%')}</strong><span>安全拦截率</span></article>
        </div>
        <div className="dh-provider-grid">{Object.entries(metrics.providers || {}).map(([provider, item]) => <article key={provider}><strong>{provider}</strong><span>{item.lastState || 'UNKNOWN'} · {value(item.events)} events</span></article>)}</div>
      </>}
    </section>
  )
}
