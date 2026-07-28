// BarSeries.jsx — 条形 / 柱状图（水平优先，标签更好读）。
// 适用：恩赐排序、情绪分布、模式计数、注意力五类分布、小组对比。
import { useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, MARK, FONT, seriesColor, barPathHorizontal, barPathVertical, niceTicks } from './chartTheme'

/** 水平条形：一个系列，按值排序，值标注在条尾。 */
export function BarSeries({
  items = [],              // [{ label, value, color? }]
  title, subtitle, unit = '',
  width = 520, rowHeight = 30, maxBar = MARK.barMax,
  colorMode = 'single',    // 'single' | 'categorical'
}) {
  const [hover, setHover] = useState(null)
  if (!items.length) return null

  const labelW = 96
  const padR = 52
  const innerW = width - labelW - padR
  const height = items.length * rowHeight + 8
  const max = Math.max(1, ...items.map((d) => Number(d.value) || 0))
  const barH = Math.min(maxBar, rowHeight - MARK.gap * 2 - 8)

  const summary = i18nT('{title}：{items}', {
    title: title || i18nT('分布'),
    items: items.map((d) => `${d.label} ${d.value}${unit}`).join(i18nT('，')),
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('项目'), i18nT('数值')]}
      tableRows={items.map((d) => [d.label, `${d.value}${unit}`])}
    >
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', fontFamily: FONT }} aria-hidden="true">
          {items.map((d, i) => {
            const y = i * rowHeight + 4
            const w = Math.max(2, ((Number(d.value) || 0) / max) * innerW)
            const color = d.color || (colorMode === 'categorical' ? seriesColor(i) : seriesColor(0))
            return (
              <g
                key={`${d.label}-${i}`}
                onMouseEnter={() => setHover({ i, label: d.label, value: d.value })}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'default' }}
              >
                <rect x={0} y={y} width={width} height={rowHeight - MARK.gap} fill="transparent" />
                <text x={labelW - 8} y={y + (rowHeight - MARK.gap) / 2} textAnchor="end" dominantBaseline="middle" fontSize="12" fill={INK.secondary}>
                  {d.label}
                </text>
                <path d={barPathHorizontal(labelW, y + ((rowHeight - MARK.gap) - barH) / 2, w, barH)} fill={color} />
                <text
                  x={labelW + w + 8} y={y + (rowHeight - MARK.gap) / 2}
                  dominantBaseline="middle" fontSize="12" fill={INK.primary}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {d.value}{unit}
                </text>
              </g>
            )
          })}
        </svg>
        <ChartTooltip visible={!!hover} x="50%" y={(hover?.i ?? 0) * rowHeight}>
          {hover ? `${hover.label} · ${hover.value}${unit}` : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

/** 垂直柱状：适合时间序列的离散计数（如每周完成次数）。 */
export function ColumnSeries({
  labels = [], values = [], title, subtitle, unit = '',
  width = 520, height = 170, color,
}) {
  const [hover, setHover] = useState(null)
  const padL = 30; const padR = 10; const padT = 12; const padB = 24
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const ticks = niceTicks(Math.max(1, ...values.map((v) => Number(v) || 0)), 3)
  const top = ticks[ticks.length - 1] || 1
  const slot = innerW / Math.max(1, labels.length)
  const barW = Math.min(MARK.barMax, slot - MARK.gap * 2)
  const c = color || seriesColor(0)

  const summary = i18nT('{title}：{items}', {
    title: title || i18nT('柱状图'),
    items: labels.map((l, i) => `${l} ${values[i] ?? 0}${unit}`).join(i18nT('，')),
  })
  const labelEvery = Math.max(1, Math.ceil(labels.length / 8))

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('时间'), i18nT('数值')]}
      tableRows={labels.map((l, i) => [l, `${values[i] ?? 0}${unit}`])}
    >
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', fontFamily: FONT }} aria-hidden="true">
          {ticks.map((tv) => {
            const y = padT + innerH - (tv / top) * innerH
            return (
              <g key={tv}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke={INK.grid} strokeWidth="1" />
                <text x={padL - 5} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={INK.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>{tv}</text>
              </g>
            )
          })}
          {labels.map((l, i) => {
            const v = Number(values[i]) || 0
            const h = (v / top) * innerH
            const x = padL + i * slot + (slot - barW) / 2
            return (
              <g key={`${l}-${i}`} onMouseEnter={() => setHover({ i, l, v })} onMouseLeave={() => setHover(null)}>
                {h > 0 && <path d={barPathVertical(x, padT + innerH - h, barW, h)} fill={c} />}
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={height - 7} textAnchor="middle" fontSize="10" fill={INK.muted}>{l}</text>
                )}
              </g>
            )
          })}
          <line x1={padL} y1={padT + innerH} x2={width - padR} y2={padT + innerH} stroke={INK.baseline} strokeWidth="1" />
        </svg>
        <ChartTooltip visible={!!hover} x={`${(((hover?.i ?? 0) + 0.5) * slot + padL) / width * 100}%`} y={0}>
          {hover ? `${hover.l} · ${hover.v}${unit}` : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

export default BarSeries
