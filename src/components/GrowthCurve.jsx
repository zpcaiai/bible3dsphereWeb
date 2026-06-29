import { useEffect, useState } from 'react'
import { fetchFormationCurve, fetchMilestones } from '../api'
import { t } from '../i18n/runtime'

// 纵向成长曲线 —— 把成长事件按时间桶聚合成堆叠柱（平稳/需留意/高负荷），
// 叠加里程碑与主要成长领域。接 /api/formation/curve。
const RANGES = [
  { key: '8w', label: '近8周', days: 56, bucket: 'week' },
  { key: '12w', label: '近12周', days: 90, bucket: 'week' },
  { key: '12m', label: '近一年', days: 365, bucket: 'month' },
]
const COL = { green: '#34c759', amber: '#ffb020', red: '#ff5a5f' }
const card = {
  marginTop: 12, borderRadius: 16, padding: '14px 16px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
}

function Header({ range, setRange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#9ecbff' }}>📈 {t('成长曲线 · 纵向')}</div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)}
            style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid ' + (range === r.key ? '#9ecbff' : 'rgba(255,255,255,0.14)'),
              background: range === r.key ? 'rgba(158,203,255,0.16)' : 'transparent',
              color: range === r.key ? '#cfe6ff' : 'rgba(255,255,255,0.55)' }}>
            {t(r.label)}
          </button>
        ))}
      </div>
    </div>
  )
}

function Legend({ c, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{label}
    </span>
  )
}

export default function GrowthCurve({ token }) {
  const [range, setRange] = useState('12w')
  const [data, setData] = useState(null)
  const [miles, setMiles] = useState(0)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!token) return
    const r = RANGES.find((x) => x.key === range) || RANGES[1]
    setErr('')
    fetchFormationCurve(token, r.days, r.bucket).then(setData).catch((e) => setErr(e.message))
    fetchMilestones(token).then((d) => setMiles(((d && (d.milestones || d.items)) || []).length || 0)).catch(() => {})
  }, [token, range])

  if (!token) return null
  const series = data?.series || []
  const domains = data?.domains || []

  if (!err && data && series.length === 0) {
    return (
      <div style={card}>
        <Header range={range} setRange={setRange} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '18px 4px', lineHeight: 1.6 }}>
          {t('还没有足够的成长记录来绘制曲线。做一次诊断 / 操练 / 读经后，这里会显示你的轨迹。')}
        </div>
      </div>
    )
  }

  const W = 320, H = 110, padB = 16, padT = 6
  const maxTotal = Math.max(1, ...series.map((s) => s.total))
  const n = series.length
  const gap = n ? W / n : 0
  const bw = n ? Math.min(26, gap * 0.7) : 0

  return (
    <div style={card}>
      <Header range={range} setRange={setRange} />
      {err && <div style={{ fontSize: 12, color: '#fca5a5' }}>{err}</div>}
      {!err && (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <line x1={0} y1={H - padB} x2={W} y2={H - padB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {series.map((s, i) => {
              const x = gap * i + (gap - bw) / 2
              let yCursor = H - padB
              return [['green', s.green], ['amber', s.amber], ['red', s.red]].map(([k, v], j) => {
                if (!v) return null
                const h = (H - padB - padT) * (v / maxTotal)
                const y = yCursor - h
                yCursor = y
                return <rect key={i + '-' + j} x={x} y={y} width={bw} height={h} fill={COL[k]} rx="1.5" opacity="0.92" />
              })
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'rgba(255,255,255,0.35)', marginTop: -6 }}>
            <span>{(series[0]?.period || '').slice(0, 10)}</span>
            <span>{(series[series.length - 1]?.period || '').slice(0, 10)}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
            <Legend c={COL.green} label={t('平稳')} />
            <Legend c={COL.amber} label={t('需留意')} />
            <Legend c={COL.red} label={t('高负荷')} />
            <span style={{ marginLeft: 'auto' }}>{t('里程碑')} · {miles}</span>
          </div>
          {domains.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{t('主要成长领域')}</div>
              <div>
                {domains.slice(0, 6).map((d, i) => (
                  <span key={i} style={{ display: 'inline-block', margin: '2px 5px 0 0', padding: '2px 8px',
                    borderRadius: 999, fontSize: 10.5, background: 'rgba(140,140,255,0.16)', color: '#c7c8ff' }}>
                    {d.domain} · {d.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
