// Heatmap.jsx — 顺序色热力图。
// CalendarHeatmap: 365 天 / N 周的日历格（读经计划、习惯连续性）。
// MatrixHeatmap:   周 × 时段矩阵（注意力时段、试探高发时刻、日课执行）。
import { useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, MARK, FONT, sequentialColor, SEQUENTIAL, localDateKey } from './chartTheme'

function ScaleLegend({ maxLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: INK.muted }}>
      <span>{i18nT('少')}</span>
      {['rgba(255,255,255,0.05)', ...SEQUENTIAL].map((c) => (
        <span key={c} aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />
      ))}
      <span>{maxLabel || i18nT('多')}</span>
    </div>
  )
}

function buildCalendarColumns(start, todayKey, map) {
  const cols = []
  const cur = new Date(start)
  while (localDateKey(cur) <= todayKey) {
    const col = []
    for (let d = 0; d < 7; d += 1) {
      const key = localDateKey(cur)
      col.push({ key, value: map.get(key) || 0, future: key > todayKey })
      cur.setDate(cur.getDate() + 1)
    }
    cols.push(col)
  }
  return cols
}

/**
 * CalendarHeatmap
 * @param {Array<{date: string, value: number}>} data  date 为 YYYY-MM-DD
 */
export function CalendarHeatmap({ data = [], weeks = 26, title, subtitle, unit = '', cell = 12, gap = MARK.gap }) {
  const [hover, setHover] = useState(null)
  const map = new Map(data.map((d) => [String(d.date).slice(0, 10), Number(d.value) || 0]))
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0))

  const today = new Date()
  const days = weeks * 7
  const start = new Date(today)
  start.setDate(start.getDate() - days + 1)
  start.setDate(start.getDate() - start.getDay()) // 对齐到周日

  // 日期键一律用本地时区。调用方存的是本地的「今天」，若这里按 UTC 取键，
  // UTC+N 的用户整张图会错位一格，且今天会被判成未来而画不出来。
  const todayKey = localDateKey(today)
  const cols = buildCalendarColumns(start, todayKey, map)

  const width = cols.length * (cell + gap) + 22
  const height = 7 * (cell + gap) + 16
  const active = data.filter((d) => (Number(d.value) || 0) > 0).length
  const summary = i18nT('{title}：近 {weeks} 周共 {active} 天有记录，最高 {max}{unit}', {
    title: title || i18nT('日历热力图'),
    weeks,
    active,
    max,
    unit,
  })
  const WEEK = [i18nT('日'), '', i18nT('二'), '', i18nT('四'), '', i18nT('六')]

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('日期'), i18nT('数值')]}
      tableRows={data.slice(-40).map((d) => [d.date, `${d.value}${unit}`])}
    >
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', minWidth: width * 0.6, fontFamily: FONT }} aria-hidden="true">
          {WEEK.map((w, i) => (w ? (
            <text key={i} x={0} y={i * (cell + gap) + cell} fontSize="9" fill={INK.muted}>{w}</text>
          ) : null))}
          {cols.map((col, ci) => col.map((d, ri) => (
            d.future ? null : (
              <rect
                key={d.key}
                x={22 + ci * (cell + gap)} y={ri * (cell + gap) + 4}
                width={cell} height={cell} rx="3"
                fill={sequentialColor(d.value / max)}
                onMouseEnter={() => setHover({ ...d, x: 22 + ci * (cell + gap), y: ri * (cell + gap) })}
                onMouseLeave={() => setHover(null)}
              />
            )
          )))}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? `${hover.key} · ${hover.value}${unit}` : null}
        </ChartTooltip>
        <ScaleLegend maxLabel={`${max}${unit}`} />
      </div>
    </ChartFrame>
  )
}

/**
 * MatrixHeatmap
 * @param {string[]} rows  行标签（如 周一…周日）
 * @param {string[]} cols  列标签（如 0…23 时）
 * @param {number[][]} values  values[row][col]
 */
export function MatrixHeatmap({ rows = [], cols = [], values = [], title, subtitle, unit = '', cell = 20 }) {
  const [hover, setHover] = useState(null)
  const flat = values.flat().map((v) => Number(v) || 0)
  const max = Math.max(1, ...flat)
  const labelW = 40
  const width = labelW + cols.length * (cell + MARK.gap) + 6
  const height = 18 + rows.length * (cell + MARK.gap)
  const colEvery = Math.max(1, Math.ceil(cols.length / 12))

  let peak = { r: 0, c: 0, v: -1 }
  values.forEach((row, r) => (row || []).forEach((v, c) => { if ((Number(v) || 0) > peak.v) peak = { r, c, v: Number(v) || 0 } }))
  const summary = i18nT('{title}：最高点在 {row} {col}，为 {value}{unit}', {
    title: title || i18nT('热力矩阵'),
    row: rows[peak.r] || '',
    col: cols[peak.c] || '',
    value: peak.v,
    unit,
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('行'), ...cols]}
      tableRows={rows.map((r, i) => [r, ...(values[i] || []).map((v) => String(v ?? 0))])}
    >
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', minWidth: Math.min(width, 520), fontFamily: FONT }} aria-hidden="true">
          {cols.map((c, ci) => (ci % colEvery === 0 ? (
            <text key={`c${ci}`} x={labelW + ci * (cell + MARK.gap) + cell / 2} y={11} textAnchor="middle" fontSize="9" fill={INK.muted}>{c}</text>
          ) : null))}
          {rows.map((r, ri) => (
            <g key={`r${ri}`}>
              <text x={labelW - 6} y={18 + ri * (cell + MARK.gap) + cell / 2} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={INK.secondary}>{r}</text>
              {cols.map((c, ci) => {
                const v = Number(values[ri]?.[ci]) || 0
                return (
                  <rect
                    key={`${ri}-${ci}`}
                    x={labelW + ci * (cell + MARK.gap)} y={18 + ri * (cell + MARK.gap)}
                    width={cell} height={cell} rx="3"
                    fill={sequentialColor(v / max)}
                    onMouseEnter={() => setHover({ x: labelW + ci * (cell + MARK.gap), y: 18 + ri * (cell + MARK.gap), r, c, v })}
                    onMouseLeave={() => setHover(null)}
                  />
                )
              })}
            </g>
          ))}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? `${hover.r} ${hover.c} · ${hover.v}${unit}` : null}
        </ChartTooltip>
        <ScaleLegend maxLabel={`${max}${unit}`} />
      </div>
    </ChartFrame>
  )
}

export default CalendarHeatmap
