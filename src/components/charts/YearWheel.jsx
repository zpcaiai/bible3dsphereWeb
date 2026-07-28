// YearWheel.jsx — 环形年历轮盘 / 环形时刻盘。
// YearWheel:    教会年历（将临→降临→显现→大斋→复活→圣灵降临→常年期）。
// HorariumDial: 24 小时环形日课盘（修道传统的 Horarium 本来就是圆盘）。
import { useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, FONT, STATUS, arcPath, polar, seriesColor, CHART_SURFACE } from './chartTheme'

/**
 * @param {Array<{key, label, startDay, endDay, color?}>} seasons  startDay/endDay 为 0..365
 * @param {number} todayDay  今天是一年的第几天
 */
export function YearWheel({ seasons = [], todayDay = 0, title, subtitle, size = 300, onSelect, activeKey }) {
  const [hover, setHover] = useState(null)
  if (!seasons.length) return null

  const cx = size / 2; const cy = size / 2
  const rOuter = size / 2 - 30
  const rInner = rOuter - 34
  const deg = (day) => (day / 365) * 360

  const current = seasons.find((s) => todayDay >= s.startDay && todayDay <= s.endDay)
  const summary = i18nT('{title}：共 {count} 个节期，今天在「{current}」', {
    title: title || i18nT('教会年历'),
    count: seasons.length,
    current: current?.label || i18nT('常年期'),
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('节期'), i18nT('起'), i18nT('讫')]}
      tableRows={seasons.map((s) => [s.label, String(s.startDay), String(s.endDay)])}
    >
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ fontFamily: FONT }} aria-hidden="true">
          {seasons.map((s, i) => {
            const color = s.color || seriesColor(i)
            const isNow = current?.key === s.key
            const isActive = activeKey === s.key
            return (
              <g
                key={s.key}
                onMouseEnter={() => setHover({ ...s, x: polar(cx, cy, (rOuter + rInner) / 2, deg((s.startDay + s.endDay) / 2))[0], y: polar(cx, cy, (rOuter + rInner) / 2, deg((s.startDay + s.endDay) / 2))[1] })}
                onMouseLeave={() => setHover(null)}
                onClick={onSelect ? () => onSelect(s) : undefined}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              >
                <path
                  d={arcPath(cx, cy, rInner, rOuter, deg(s.startDay), deg(s.endDay))}
                  fill={color} fillOpacity={isNow || isActive ? 0.75 : 0.34}
                  stroke={CHART_SURFACE} strokeWidth="2"
                />
              </g>
            )
          })}

          {seasons.map((s, i) => {
            const mid = deg((s.startDay + s.endDay) / 2)
            const [lx, ly] = polar(cx, cy, rOuter + 15, mid)
            const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'
            const short = (s.endDay - s.startDay) < 22
            return short ? null : (
              <text key={`${s.key}-l`} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="10.5" fill={INK.secondary}>{s.label}</text>
            )
          })}

          {/* 今天的指针 */}
          <line
            x1={cx} y1={cy}
            x2={polar(cx, cy, rOuter + 4, deg(todayDay))[0]} y2={polar(cx, cy, rOuter + 4, deg(todayDay))[1]}
            stroke={STATUS.warning} strokeWidth="2" strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4" fill={STATUS.warning} />
          <text x={cx} y={cy + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill={INK.primary}>{current?.label || i18nT('常年期')}</text>
          <text x={cx} y={cy + 38} textAnchor="middle" fontSize="10" fill={INK.muted}>{i18nT('今天')}</text>
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? `${hover.label}${hover.note ? ` · ${hover.note}` : ''}` : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

/**
 * HorariumDial — 24 小时环形日课盘。
 * @param {Array<{key, label, hour: number, minute?: number, done?: boolean}>} hours
 */
export function HorariumDial({ hours = [], nowHour, title, subtitle, size = 300, onSelect }) {
  const [hover, setHover] = useState(null)
  const cx = size / 2; const cy = size / 2
  const rOuter = size / 2 - 34
  const rInner = rOuter - 26
  const deg = (h, m = 0) => ((h + m / 60) / 24) * 360
  const nowH = Number.isFinite(nowHour) ? nowHour : (typeof Date !== 'undefined' ? new Date().getHours() + new Date().getMinutes() / 60 : 0)

  const doneCount = hours.filter((h) => h.done).length
  const next = hours.find((h) => deg(h.hour, h.minute) >= deg(nowH))
  const summary = i18nT('{title}：共 {count} 个时辰，已完成 {done} 个，下一个是「{next}」', {
    title: title || i18nT('日课时刻盘'),
    count: hours.length,
    done: doneCount,
    next: next?.label || '——',
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('时辰'), i18nT('时间'), i18nT('状态')]}
      tableRows={hours.map((h) => [h.label, `${String(h.hour).padStart(2, '0')}:${String(h.minute || 0).padStart(2, '0')}`, h.done ? i18nT('已守') : i18nT('未守')])}
    >
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ fontFamily: FONT }} aria-hidden="true">
          <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke={INK.grid} strokeWidth="1" />
          <circle cx={cx} cy={cy} r={rInner} fill="none" stroke={INK.grid} strokeWidth="1" />
          {/* 夜间区（18:00 → 06:00）压暗，一眼看出昼夜 */}
          <path d={arcPath(cx, cy, rInner, rOuter, deg(18), deg(24))} fill="#0f1420" fillOpacity="0.7" />
          <path d={arcPath(cx, cy, rInner, rOuter, deg(0), deg(6))} fill="#0f1420" fillOpacity="0.7" />

          {[0, 6, 12, 18].map((h) => {
            const [x1, y1] = polar(cx, cy, rInner, deg(h))
            const [x2, y2] = polar(cx, cy, rOuter, deg(h))
            const [tx, ty] = polar(cx, cy, rOuter + 13, deg(h))
            return (
              <g key={h}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK.baseline} strokeWidth="1" />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={INK.muted}>{String(h).padStart(2, '0')}</text>
              </g>
            )
          })}

          {hours.map((h, i) => {
            const a = deg(h.hour, h.minute)
            const [x, y] = polar(cx, cy, (rInner + rOuter) / 2, a)
            const color = h.done ? STATUS.good : seriesColor(i % 8)
            return (
              <g key={h.key || h.label}
                onMouseEnter={() => setHover({ ...h, x, y })}
                onMouseLeave={() => setHover(null)}
                onClick={onSelect ? () => onSelect(h) : undefined}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              >
                <circle cx={x} cy={y} r="7" fill={color} fillOpacity={h.done ? 0.95 : 0.42} stroke={CHART_SURFACE} strokeWidth="2" />
                {h.done && <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fill="#fff">✓</text>}
              </g>
            )
          })}

          <line x1={cx} y1={cy} x2={polar(cx, cy, rOuter - 4, deg(nowH))[0]} y2={polar(cx, cy, rOuter - 4, deg(nowH))[1]} stroke={STATUS.warning} strokeWidth="2" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="3.5" fill={STATUS.warning} />
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize="12" fontWeight="700" fill={INK.primary}>{doneCount} / {hours.length}</text>
          <text x={cx} y={cy + 40} textAnchor="middle" fontSize="10" fill={INK.muted}>{i18nT('今日已守')}</text>
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? `${hover.label} · ${String(hover.hour).padStart(2, '0')}:${String(hover.minute || 0).padStart(2, '0')}${hover.done ? ` · ${i18nT('已守')}` : ''}` : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

export default YearWheel
