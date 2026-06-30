import { t as i18nT } from './i18n/runtime'
/** FormationChartsPage — 成长可视化 (B11)。纯 SVG 热力图 + 周趋势,接 /analytics/series。
 *  恩典优先:这是属灵操练的迹象图,不是成绩单。无第三方图表库依赖。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { analyticsApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const chip = (on) => ({ cursor: 'pointer', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid ' + (on ? 'rgba(125,211,252,0.7)' : 'rgba(255,255,255,0.15)'), color: '#fff', background: on ? 'rgba(125,211,252,0.18)' : 'transparent' })
const DOW = ['日', '一', '二', '三', '四', '五', '六']

export default function FormationChartsPage({ user, onBack }) {
  const [days, setDays] = useState(84)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { load(days) }, [days])
  async function load(d) {
    const t = getToken(); if (!t) return
    setError('')
    try { setData(await analyticsApi.series(d, t)) } catch (e) { setError(e.message) }
  }

  const wrap = { maxWidth: 680, margin: '0 auto', padding: 16, color: '#fff' }
  const daily = (data && data.daily) || []
  const weekly = (data && data.weekly) || []
  const cats = (data && data.by_category) || []
  const maxDaily = (data && data.max_daily) || 0
  const total = (data && data.total) || 0

  // ---- heatmap layout (GitHub 风格:列=周,行=周日..周六) ----
  const CELL = 13, GAP = 3
  let col = 0
  const cells = daily.map((d, i) => {
    if (i > 0 && d.dow === 0) col += 1
    return { date: d.date, count: d.count, col, row: d.dow }
  })
  const cols = cells.length ? cells[cells.length - 1].col + 1 : 1
  const hmW = cols * (CELL + GAP)
  const hmH = 7 * (CELL + GAP)
  const colorFor = (c) => {
    if (!c) return 'rgba(255,255,255,0.06)'
    const r = maxDaily ? c / maxDaily : 0
    const a = 0.25 + 0.6 * Math.min(1, r)
    return 'rgba(52,199,89,' + a.toFixed(2) + ')'
  }

  // ---- weekly trend area ----
  const W = 600, H = 130, pad = 10
  const maxW = Math.max(1, ...weekly.map(w => w.count))
  const pts = weekly.map((w, i) => {
    const x = weekly.length > 1 ? pad + i * (W - 2 * pad) / (weekly.length - 1) : W / 2
    const y = H - pad - (w.count / maxW) * (H - 2 * pad)
    return [x, y]
  })
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = pts.length ? line + ' L ' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - pad) + ' L ' + pts[0][0].toFixed(1) + ' ' + (H - pad) + ' Z' : ''
  const maxCat = Math.max(1, ...cats.map(c => c.count))

  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('📈 成长可视化')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>{i18nT('属灵操练的迹象图,不是成绩单 · 空白的日子常是恩典的邀请')}</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[28, 84, 180].map(d => <button key={d} style={chip(days === d)} onClick={() => setDays(d)}>{d} {i18nT('天')}</button>)}
      </div>

      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {data && total === 0 && (
        <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {i18nT('这段时间还没有记录。这不是定罪——也许今天就从一处经文、一句诚实的祷告开始。')}
        </div>
      )}

      {data && total > 0 && (
        <>
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('操练热力图 · 近')} {days} {i18nT('天')}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: hmH, fontSize: 9, color: 'rgba(255,255,255,0.4)', paddingTop: 1 }}>
                {DOW.map((d, i) => <div key={i} style={{ height: CELL, lineHeight: CELL + 'px' }}>{i % 2 ? d : ''}</div>)}
              </div>
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <svg width={hmW} height={hmH} style={{ display: 'block' }}>
                  {cells.map(c => (
                    <rect key={c.date} x={c.col * (CELL + GAP)} y={c.row * (CELL + GAP)} width={CELL} height={CELL} rx={3} fill={colorFor(c.count)}>
                      <title>{c.date}:{c.count} {i18nT('次')}</title>
                    </rect>
                  ))}
                </svg>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
              <span>{i18nT('少')}</span>
              {[0, 0.3, 0.6, 1].map((r, i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 3, background: r ? 'rgba(52,199,89,' + (0.25 + 0.6 * r).toFixed(2) + ')' : 'rgba(255,255,255,0.06)' }} />)}
              <span>{i18nT('多')}</span>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('每周趋势')}</div>
            <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="grad-trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(125,211,252,0.45)" />
                  <stop offset="100%" stopColor="rgba(125,211,252,0.02)" />
                </linearGradient>
              </defs>
              {area && <path d={area} fill="url(#grad-trend)" />}
              {line && <path d={line} fill="none" stroke="rgba(125,211,252,0.9)" strokeWidth="2" />}
              {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="#7dd3fc" />)}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              <span>{weekly.length ? weekly[0].label : ''}</span>
              <span>{weekly.length ? weekly[weekly.length - 1].label : ''}</span>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{i18nT('各操练分布')}</div>
            {cats.filter(c => c.count > 0).map(c => (
              <div key={c.source} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>
                  <span>{c.label}</span><span>{c.count}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: 8, borderRadius: 999, width: (100 * c.count / maxCat).toFixed(1) + '%', background: 'linear-gradient(90deg, rgba(125,211,252,0.85), rgba(139,92,246,0.7))' }} />
                </div>
              </div>
            ))}
            {cats.filter(c => c.count > 0).length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{i18nT('暂无分布数据。')}</div>}
          </div>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{data.note}</div>
        </>
      )}
    </div>
  )
}
