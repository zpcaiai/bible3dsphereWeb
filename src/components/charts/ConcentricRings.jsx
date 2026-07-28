// ConcentricRings.jsx — 同心圆「次序」图。
// 专为「爱的次序 Ordo Amoris」而作：神 / 家人 / 邻舍 / 事工 / 自我 本应有固定次序，
// 用同心圆表达「谁在中心」最直观；当实际投入与应然次序错位时高亮该环。
import { useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, FONT, STATUS, seriesColor } from './chartTheme'

/**
 * @param {Array<{label, actual: number, expectedRank: number, note?: string}>} rings
 *        rings 按「应然次序」由内而外传入；actual 为实际投入占比 0..1
 */
export function ConcentricRings({ rings = [], size = 300, title, subtitle }) {
  const [hover, setHover] = useState(null)
  if (!rings.length) return null

  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 8
  const band = maxR / rings.length

  // 实际次序 = 按 actual 降序的排名；与应然次序不一致即为「错序」
  const actualRank = [...rings]
    .map((r, i) => ({ i, actual: Number(r.actual) || 0 }))
    .sort((a, b) => b.actual - a.actual)
    .reduce((acc, r, rank) => { acc[r.i] = rank; return acc }, {})

  const misordered = rings.filter((_, i) => actualRank[i] !== i)
  const summary = i18nT('{title}：{items}。{order}', {
    title: title || i18nT('爱的次序'),
    items: rings.map((r) => i18nT('{label} 实际占比 {pct}%', {
      label: r.label,
      pct: Math.round((r.actual || 0) * 100),
    })).join(i18nT('，')),
    order: misordered.length
      ? i18nT('{items} 与应然次序不一致。', { items: misordered.map((r) => r.label).join(i18nT('、')) })
      : i18nT('次序与应然一致。'),
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('对象'), i18nT('应然次序'), i18nT('实际占比'), i18nT('实际排名')]}
      tableRows={rings.map((r, i) => [r.label, String(i + 1), `${Math.round((r.actual || 0) * 100)}%`, String(actualRank[i] + 1)])}
    >
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ fontFamily: FONT }} aria-hidden="true">
          {rings.slice().reverse().map((r, revIdx) => {
            const i = rings.length - 1 - revIdx
            const outer = band * (i + 1)
            const off = actualRank[i] !== i
            const color = off ? STATUS.warning : seriesColor(i)
            const intensity = 0.12 + (Number(r.actual) || 0) * 0.4
            return (
              <g key={r.label}
                onMouseEnter={() => setHover({ ...r, rank: actualRank[i] + 1, expected: i + 1, off, x: cx, y: cy - outer + band / 2 })}
                onMouseLeave={() => setHover(null)}
              >
                <circle cx={cx} cy={cy} r={outer} fill={color} fillOpacity={intensity} stroke={color} strokeOpacity={off ? 0.85 : 0.4} strokeWidth={off ? 2 : 1} />
              </g>
            )
          })}
          {rings.map((r, i) => {
            const outer = band * (i + 1)
            return (
              <text key={r.label} x={cx} y={cy - outer + band / 2 + 4} textAnchor="middle" fontSize="11" fill={INK.primary}>
                {r.label}
                {actualRank[i] !== i ? ' ⚠' : ''}
              </text>
            )
          })}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? `${hover.label} · ${i18nT('应然第')}${hover.expected} / ${i18nT('实际第')}${hover.rank}${hover.off ? ` · ${i18nT('错序')}` : ''}` : null}
        </ChartTooltip>
      </div>
      {misordered.length > 0 && (
        <p style={{ fontSize: 12, color: INK.secondary, marginTop: 10, lineHeight: 1.6 }}>
          <span aria-hidden="true">⚠ </span>
          {i18nT('这些环与应然次序不一致：')}{misordered.map((r) => r.label).join(i18nT('、'))}
          {i18nT('。次序错位不是罪的判决，是一个可以带到神面前的观察。')}
        </p>
      )}
    </ChartFrame>
  )
}

export default ConcentricRings
