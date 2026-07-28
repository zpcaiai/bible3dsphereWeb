// TrendLine.jsx — 时序趋势线 / 面积图（单系列或多系列）。
// 适用：情绪轨迹、周回顾、注意力趋势、危机后恢复曲线、习惯完成度。
import { useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, MARK, CHART_SURFACE, FONT, seriesColor, smoothPath, niceTicks } from './chartTheme'

export function TrendLine({
  labels = [],                 // x 轴标签
  series = [],                 // [{ name, values: number[] }]
  height = 180,
  width = 520,
  title, subtitle, yUnit = '',
  area = true, smooth = true,
  band,                        // 可选 { from: number[], to: number[], label } 用于置信/参考带
}) {
  const [hoverIdx, setHoverIdx] = useState(null)

  const padL = 34; const padR = 14; const padT = 12; const padB = 26
  const innerW = width - padL - padR
  const innerH = height - padT - padB

  const maxVal = useMemo(() => {
    const all = series.flatMap((s) => s.values || []).concat(band?.to || [])
    return Math.max(1, ...all.map((v) => Number(v) || 0))
  }, [series, band])

  const ticks = niceTicks(maxVal, 3)
  const scaleY = (v) => padT + innerH - (Math.max(0, Number(v) || 0) / (ticks[ticks.length - 1] || 1)) * innerH
  const scaleX = (i) => padL + (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW)

  const legend = series.length > 1 ? series.map((s, i) => ({ label: s.name, color: seriesColor(i), shape: 'line' })) : []
  const tableColumns = [i18nT('时间'), ...series.map((s) => s.name)]
  const tableRows = labels.map((l, i) => [l, ...series.map((s) => String(s.values?.[i] ?? '—'))])
  const summary = i18nT('{title}：{series}', {
    title: title || i18nT('趋势'),
    series: series.map((s) => i18nT('{name} 从 {from} 到 {to}', {
      name: s.name,
      from: s.values?.[0] ?? '—',
      to: s.values?.[s.values.length - 1] ?? '—',
    })).join(i18nT('；')),
  })

  const labelEvery = Math.max(1, Math.ceil(labels.length / 6))

  return (
    <ChartFrame title={title} subtitle={subtitle} summary={summary} legend={legend} tableColumns={tableColumns} tableRows={tableRows}>
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', fontFamily: FONT }} aria-hidden="true"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const rel = ((e.clientX - rect.left) / rect.width) * width
            const i = Math.round(((rel - padL) / innerW) * (labels.length - 1))
            setHoverIdx(Math.max(0, Math.min(labels.length - 1, i)))
          }}
        >
          {ticks.map((tv) => (
            <g key={tv}>
              <line x1={padL} y1={scaleY(tv)} x2={width - padR} y2={scaleY(tv)} stroke={INK.grid} strokeWidth="1" />
              <text x={padL - 6} y={scaleY(tv)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={INK.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>{tv}</text>
            </g>
          ))}

          {band?.from && (
            <path
              d={`${smoothPath(band.from.map((v, i) => [scaleX(i), scaleY(v)]))} L ${scaleX(band.to.length - 1)} ${scaleY(band.to[band.to.length - 1])} ${band.to.slice().reverse().map((v, k) => `L ${scaleX(band.to.length - 1 - k)} ${scaleY(v)}`).join(' ')} Z`}
              fill={INK.baseline} fillOpacity="0.35" stroke="none"
            />
          )}

          {series.map((s, si) => {
            const color = seriesColor(si)
            const pts = (s.values || []).map((v, i) => [scaleX(i), scaleY(v)])
            if (!pts.length) return null
            const line = smooth ? smoothPath(pts) : pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ')
            return (
              <g key={s.name}>
                {area && (
                  <path d={`${line} L ${pts[pts.length - 1][0]} ${padT + innerH} L ${pts[0][0]} ${padT + innerH} Z`} fill={color} fillOpacity={MARK.areaOpacity} stroke="none" />
                )}
                <path d={line} fill="none" stroke={color} strokeWidth={MARK.lineWidth} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={MARK.markerR} fill={color} stroke={CHART_SURFACE} strokeWidth={MARK.ringWidth} />
                {series.length === 1 && (
                  <text x={pts[pts.length - 1][0] - 6} y={pts[pts.length - 1][1] - 10} textAnchor="end" fontSize="11" fill={INK.secondary} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {s.values[s.values.length - 1]}{yUnit}
                  </text>
                )}
              </g>
            )
          })}

          {hoverIdx != null && labels[hoverIdx] != null && (
            <line x1={scaleX(hoverIdx)} y1={padT} x2={scaleX(hoverIdx)} y2={padT + innerH} stroke={INK.baseline} strokeWidth="1" />
          )}

          <line x1={padL} y1={padT + innerH} x2={width - padR} y2={padT + innerH} stroke={INK.baseline} strokeWidth="1" />
          {labels.map((l, i) => (i % labelEvery === 0 ? (
            <text key={`${l}-${i}`} x={scaleX(i)} y={height - 8} textAnchor="middle" fontSize="10" fill={INK.muted}>{l}</text>
          ) : null))}
        </svg>

        <ChartTooltip
          visible={hoverIdx != null && labels[hoverIdx] != null}
          x={`${((scaleX(hoverIdx ?? 0)) / width) * 100}%`}
          y={0}
        >
          {hoverIdx != null ? (
            <>
              <div style={{ color: INK.muted, marginBottom: 2 }}>{labels[hoverIdx]}</div>
              {series.map((s, si) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: seriesColor(si) }} />
                  {s.name} {s.values?.[hoverIdx] ?? '—'}{yUnit}
                </div>
              ))}
            </>
          ) : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

export default TrendLine
