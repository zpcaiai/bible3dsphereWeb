// Radar.jsx — 多维状态雷达图。
// 适用：德性/恶习对峙、恩赐画像、灵命体检、九标记、塑造维度。
// 两个系列时用「对峙」模式（例如 德性 vs 恶习），身份靠图例 + 直接标注，不靠颜色。
import { useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, MARK, CHART_SURFACE, seriesColor, polar } from './chartTheme'

export function Radar({
  axes = [],                 // [{ key, label }]
  series = [],               // [{ name, values: {key: 0..1 | 0..max} }]
  max = 1,
  size = 260,
  title, subtitle, rings = 4,
}) {
  const [hover, setHover] = useState(null)
  const n = axes.length
  if (!n) return null

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 34
  const step = 360 / n

  const ringPolys = Array.from({ length: rings }, (_, i) => {
    const rr = (r * (i + 1)) / rings
    return axes.map((_, k) => polar(cx, cy, rr, k * step).join(',')).join(' ')
  })

  const norm = (v) => Math.max(0, Math.min(1, (Number(v) || 0) / (max || 1)))

  const legend = series.map((s, i) => ({ label: s.name, color: seriesColor(i) }))
  const tableColumns = [i18nT('维度'), ...series.map((s) => s.name)]
  const tableRows = axes.map((a) => [a.label, ...series.map((s) => String(s.values?.[a.key] ?? 0))])

  const summary = i18nT('{title}：{items}', {
    title: title || i18nT('雷达图'),
    items: axes.map((a) => `${a.label} ${series.map((s) => s.values?.[a.key] ?? 0).join('/')}`).join(i18nT('，')),
  })

  return (
    <ChartFrame title={title} subtitle={subtitle} summary={summary} legend={legend} tableColumns={tableColumns} tableRows={tableRows}>
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }} aria-hidden="true">
          {ringPolys.map((pts, i) => (
            <polygon key={i} points={pts} fill="none" stroke={INK.grid} strokeWidth="1" />
          ))}
          {axes.map((a, i) => {
            const [x, y] = polar(cx, cy, r, i * step)
            return <line key={a.key} x1={cx} y1={cy} x2={x} y2={y} stroke={INK.grid} strokeWidth="1" />
          })}

          {series.map((s, si) => {
            const color = seriesColor(si)
            const pts = axes.map((a, i) => polar(cx, cy, r * norm(s.values?.[a.key]), i * step))
            return (
              <g key={s.name}>
                <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={color} fillOpacity={MARK.areaOpacity} stroke={color} strokeWidth={MARK.lineWidth} strokeLinejoin="round" />
                {pts.map(([x, y], i) => (
                  <circle
                    key={axes[i].key}
                    cx={x} cy={y} r={MARK.markerR}
                    fill={color} stroke={CHART_SURFACE} strokeWidth={MARK.ringWidth}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHover({ x, y, axis: axes[i].label, name: s.name, value: s.values?.[axes[i].key] ?? 0 })}
                    onMouseLeave={() => setHover(null)}
                  />
                ))}
              </g>
            )
          })}

          {axes.map((a, i) => {
            const [x, y] = polar(cx, cy, r + 18, i * step)
            const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end'
            return (
              <text key={a.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="11" fill={INK.secondary}>
                {a.label}
              </text>
            )
          })}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? `${hover.axis} · ${hover.name} ${hover.value}` : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

export default Radar
