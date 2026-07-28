// RingProgress.jsx — 环形进度 / 计量表 / 数据磁贴。
// 适用：日课完成度、禁食时长、危机延迟倒计时、周回顾完成率、风险等级。
import { t as i18nT } from '../../i18n/runtime'
import { INK, FONT, STATUS, seriesColor, MARK } from './chartTheme'

/** 单个环形进度。severity 决定填充色（保留状态色，永不当作系列色用）。 */
export function RingProgress({
  value = 0, max = 100, size = 108, stroke = 9,
  label, sublabel, severity, color, unit = '%',
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const fill = color || (severity ? STATUS[severity] : seriesColor(0))
  const display = unit === '%' ? Math.round(pct * 100) : value

  return (
    <div style={{ display: 'grid', placeItems: 'center', fontFamily: FONT }} role="img" aria-label={`${label || ''} ${display}${unit}`}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={INK.grid} strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fill} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 420ms ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: size > 90 ? 22 : 17, fontWeight: 700, color: INK.primary }}>{display}{unit}</div>
          {sublabel && <div style={{ fontSize: 10.5, color: INK.muted, marginTop: 1 }}>{sublabel}</div>}
        </div>
      </div>
      {label && <div style={{ fontSize: 12, color: INK.secondary, marginTop: 6, textAlign: 'center' }}>{label}</div>}
    </div>
  )
}

/**
 * Meter — 横向计量条。填充携带严重度，未填充轨道为同色系更浅一档，
 * 让状态在整条上都读得出来。
 */
export function Meter({ value = 0, max = 100, label, severity, color, unit = '', height = 8, hint }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const fill = color || (severity ? STATUS[severity] : seriesColor(0))
  return (
    <div style={{ fontFamily: FONT }}>
      {(label || value != null) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: INK.secondary }}>{label}</span>
          <span style={{ fontSize: 12, color: INK.primary, fontVariantNumeric: 'tabular-nums' }}>{value}{unit}</span>
        </div>
      )}
      <div
        role="img" aria-label={`${label || ''} ${value}${unit}`}
        style={{ height, borderRadius: height / 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}
      >
        <div style={{ width: `${pct * 100}%`, height: '100%', background: fill, borderRadius: height / 2, transition: 'width 420ms ease' }} />
      </div>
      {hint && <div style={{ fontSize: 11, color: INK.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

/** StatTile — 数字磁贴（label / value / delta / 迷你趋势）。 */
export function StatTile({ label, value, unit = '', delta, deltaPeriod, upIsGood = true, spark = [], hero = false }) {
  const dv = Number(delta)
  const hasDelta = Number.isFinite(dv) && dv !== 0
  const good = upIsGood ? dv > 0 : dv < 0
  const deltaColor = hasDelta ? (good ? STATUS.good : STATUS.critical) : INK.muted

  const w = 96; const h = 26
  const max = Math.max(1, ...spark.map((v) => Math.abs(Number(v) || 0)))
  const pts = spark.map((v, i) => [
    (i / Math.max(1, spark.length - 1)) * w,
    h - ((Number(v) || 0) / max) * (h - 3) - 1.5,
  ])

  return (
    <div style={{ fontFamily: FONT, minWidth: 108 }}>
      <div style={{ fontSize: 12, color: INK.muted }}>{label}</div>
      <div style={{ fontSize: hero ? 48 : 24, fontWeight: 600, color: INK.primary, lineHeight: 1.15 }}>
        {value}<span style={{ fontSize: hero ? 20 : 13, color: INK.secondary, marginLeft: 2 }}>{unit}</span>
      </div>
      {hasDelta && (
        <div style={{ fontSize: 11.5, color: deltaColor, display: 'flex', alignItems: 'center', gap: 3 }}>
          <span aria-hidden="true">{dv > 0 ? '▲' : '▼'}</span>
          {Math.abs(dv)}{unit}
          {deltaPeriod && <span style={{ color: INK.muted }}> {i18nT('对比')}{deltaPeriod}</span>}
        </div>
      )}
      {spark.length > 1 && (
        <svg width={w} height={h} style={{ marginTop: 4, display: 'block' }} aria-hidden="true">
          <path
            d={pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ')}
            fill="none" stroke={INK.baseline} strokeWidth={MARK.lineWidth} strokeLinecap="round"
          />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={seriesColor(0)} />
        </svg>
      )}
    </div>
  )
}

export default RingProgress
