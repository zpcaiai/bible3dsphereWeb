// Timeline.jsx — 时间轴 + 强度带。
// 适用：坚固营垒强度演变、危机后恢复、天路里程碑、圣殿/耶路撒冷年代。
import { useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, FONT, MARK, STATUS, seriesColor, sequentialColor, smoothPath, CHART_SURFACE } from './chartTheme'

/**
 * @param {Array<{date, label, value?, severity?, note?}>} events
 * @param {boolean} withBand  是否把 value 画成强度带（0..max）
 */
export function Timeline({ events = [], title, subtitle, width = 540, height = 150, withBand = true, unit = '', valueLabel }) {
  const [hover, setHover] = useState(null)
  if (!events.length) return null
  const localizedValueLabel = valueLabel || i18nT('强度')

  const sorted = [...events].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const padL = 16; const padR = 16; const padT = 14; const padB = 34
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const max = Math.max(1, ...sorted.map((e) => Number(e.value) || 0))
  const x = (i) => padL + (sorted.length <= 1 ? innerW / 2 : (i / (sorted.length - 1)) * innerW)
  const y = (v) => padT + innerH - ((Number(v) || 0) / max) * innerH

  const pts = sorted.map((e, i) => [x(i), y(e.value)])
  const first = sorted[0]; const last = sorted[sorted.length - 1]
  const dir = (Number(last.value) || 0) - (Number(first.value) || 0)
  const summary = i18nT('{title}：{count} 个节点，从 {from} 到 {to}，{label}{direction} {delta}{unit}', {
    title: title || i18nT('时间轴'),
    count: sorted.length,
    from: first.date,
    to: last.date,
    label: localizedValueLabel,
    direction: dir > 0 ? i18nT('上升') : dir < 0 ? i18nT('下降') : i18nT('持平'),
    delta: Math.abs(dir),
    unit,
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('日期'), i18nT('事件'), localizedValueLabel]}
      tableRows={sorted.map((e) => [e.date, e.label || '—', `${e.value ?? '—'}${unit}`])}
    >
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', fontFamily: FONT }} aria-hidden="true">
          {withBand && pts.length > 1 && (
            <>
              <path
                d={`${smoothPath(pts)} L ${pts[pts.length - 1][0]} ${padT + innerH} L ${pts[0][0]} ${padT + innerH} Z`}
                fill={seriesColor(0)} fillOpacity={MARK.areaOpacity}
              />
              <path d={smoothPath(pts)} fill="none" stroke={seriesColor(0)} strokeWidth={MARK.lineWidth} strokeLinecap="round" />
            </>
          )}
          <line x1={padL} y1={padT + innerH} x2={width - padR} y2={padT + innerH} stroke={INK.baseline} strokeWidth="1" />
          {sorted.map((e, i) => {
            const cy = withBand ? y(e.value) : padT + innerH
            const color = e.severity ? STATUS[e.severity] : sequentialColor((Number(e.value) || 0) / max)
            return (
              <g key={`${e.date}-${i}`} onMouseEnter={() => setHover({ ...e, x: x(i), y: cy })} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
                <circle cx={x(i)} cy={cy} r={MARK.markerR + 1} fill={color} stroke={CHART_SURFACE} strokeWidth={MARK.ringWidth} />
                <line x1={x(i)} y1={cy} x2={x(i)} y2={padT + innerH} stroke={INK.grid} strokeWidth="1" />
              </g>
            )
          })}
          <text x={padL} y={height - 10} fontSize="10" fill={INK.muted}>{first.date}</text>
          <text x={width - padR} y={height - 10} textAnchor="end" fontSize="10" fill={INK.muted}>{last.date}</text>
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? (
            <>
              <div style={{ color: INK.muted }}>{hover.date}</div>
              <div>{hover.label}{hover.value != null ? ` · ${localizedValueLabel} ${hover.value}${unit}` : ''}</div>
            </>
          ) : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

/** MilestoneTrack — 旅程/关卡式里程碑（天路历程、门训路径）。 */
export function MilestoneTrack({ stops = [], currentIndex = 0, title, subtitle, onSelect }) {
  const summary = i18nT('{title}：共 {count} 站，当前在第 {current} 站「{label}」', {
    title: title || i18nT('旅程'),
    count: stops.length,
    current: currentIndex + 1,
    label: stops[currentIndex]?.label || '',
  })
  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('站'), i18nT('名称'), i18nT('状态')]}
      tableRows={stops.map((s, i) => [String(i + 1), s.label, i < currentIndex ? i18nT('已过') : i === currentIndex ? i18nT('当前') : i18nT('未到')])}
    >
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, fontFamily: FONT }}>
        {stops.map((s, i) => {
          const past = i < currentIndex
          const now = i === currentIndex
          const color = now ? seriesColor(0) : past ? STATUS.good : INK.baseline
          return (
            <li key={s.key || s.label} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: now ? 16 : 11, height: now ? 16 : 11, borderRadius: '50%',
                    background: color, marginTop: 5, flexShrink: 0,
                    boxShadow: now ? `0 0 0 4px ${color}33` : 'none',
                  }}
                />
                {i < stops.length - 1 && <span aria-hidden="true" style={{ width: 2, flex: 1, minHeight: 26, background: past ? STATUS.good : INK.grid }} />}
              </div>
              <div
                style={{ paddingBottom: 14, cursor: onSelect ? 'pointer' : 'default' }}
                onClick={onSelect ? () => onSelect(s, i) : undefined}
                onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s, i) } } : undefined}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
              >
                <div style={{ fontSize: 13.5, fontWeight: now ? 700 : 600, color: now ? INK.primary : past ? INK.secondary : INK.muted }}>
                  {s.label}{now ? ` · ${i18nT('你在这里')}` : ''}
                </div>
                {s.note && <div style={{ fontSize: 12, color: INK.muted, marginTop: 2, lineHeight: 1.55 }}>{s.note}</div>}
              </div>
            </li>
          )
        })}
      </ol>
    </ChartFrame>
  )
}

export default Timeline
