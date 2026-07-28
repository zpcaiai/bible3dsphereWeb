// GrowthTree.jsx — 圣灵果子生长树。
//
// 为什么是树而不是进度条：果子的语言本身是「生长」——不是完成度百分比，
// 而是「有没有长出来、长到什么程度」。九种果子为九根枝，操练次数决定叶与果的密度。
// 刻意不显示排名与分数：果子是圣灵的工作，不是记分板。
import { useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, FONT, STATUS, polar, CHART_SURFACE } from './chartTheme'

const LEAF = '#199e70'
const FRUIT = '#c98500'

/**
 * @param {Array<{fruit: string, label: string, count: number, note?: string}>} fruits
 */
export function GrowthTree({ fruits = [], title, subtitle, size = 320 }) {
  const [hover, setHover] = useState(null)
  if (!fruits.length) return null

  const max = Math.max(1, ...fruits.map((f) => Number(f.count) || 0))
  const cx = size / 2
  const groundY = size - 26
  const trunkTop = size * 0.42
  const n = fruits.length

  // 枝条从树干上部呈扇形展开
  const spread = 132
  const branches = fruits.map((f, i) => {
    const angle = -spread / 2 + (spread * i) / Math.max(1, n - 1)
    const strength = (Number(f.count) || 0) / max
    const len = size * (0.16 + 0.20 * strength)
    const base = [cx, trunkTop + (i % 2 === 0 ? 6 : 20)]
    const [ex, ey] = polar(base[0], base[1], len, angle)
    return { ...f, angle, strength, base, end: [ex, ey], len }
  })

  const grown = fruits.filter((f) => (Number(f.count) || 0) > 0).length
  const summary = i18nT('{title}：{items}。{grown} / {total} 种已经开始长出来。', {
    title: title || i18nT('圣灵果子树'),
    items: fruits.map((f) => `${f.label} ${f.count}`).join(i18nT('，')),
    grown,
    total: n,
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('果子'), i18nT('这段时间的操练次数')]}
      tableRows={fruits.map((f) => [f.label, String(f.count ?? 0)])}
    >
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ fontFamily: FONT }} aria-hidden="true">
          {/* 地面 */}
          <line x1={size * 0.16} y1={groundY} x2={size * 0.84} y2={groundY} stroke={INK.baseline} strokeWidth="1.5" strokeLinecap="round" />
          {/* 树干 */}
          <path
            d={`M ${cx - 9} ${groundY} Q ${cx - 5} ${(groundY + trunkTop) / 2} ${cx - 4} ${trunkTop} L ${cx + 4} ${trunkTop} Q ${cx + 5} ${(groundY + trunkTop) / 2} ${cx + 9} ${groundY} Z`}
            fill="#5a4632"
          />
          {/* 根（三条短弧，表示「不是自己长的」） */}
          {[-1, 0, 1].map((k) => (
            <path key={k} d={`M ${cx} ${groundY} Q ${cx + k * 22} ${groundY + 8} ${cx + k * 34} ${groundY + 14}`} fill="none" stroke="#4a3a2a" strokeWidth="2" strokeLinecap="round" />
          ))}

          {branches.map((b) => {
            const [ex, ey] = b.end
            const leafCount = Math.min(5, Math.round(b.strength * 5))
            const hasFruit = b.strength >= 0.6
            return (
              <g
                key={b.fruit}
                onMouseEnter={() => setHover({ ...b, x: ex, y: ey })}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={`M ${b.base[0]} ${b.base[1]} Q ${(b.base[0] + ex) / 2 + b.angle * 0.18} ${(b.base[1] + ey) / 2} ${ex} ${ey}`}
                  fill="none" stroke={b.strength > 0 ? '#6b5238' : INK.grid} strokeWidth={1.4 + b.strength * 2.2} strokeLinecap="round"
                />
                {Array.from({ length: leafCount }, (_, k) => {
                  const t = 0.45 + (k / Math.max(1, leafCount)) * 0.55
                  const lx = b.base[0] + (ex - b.base[0]) * t
                  const ly = b.base[1] + (ey - b.base[1]) * t
                  return <ellipse key={k} cx={lx} cy={ly} rx="5.5" ry="3.2" fill={LEAF} fillOpacity={0.55 + b.strength * 0.35} transform={`rotate(${b.angle} ${lx} ${ly})`} />
                })}
                {hasFruit && <circle cx={ex} cy={ey} r="5" fill={FRUIT} stroke={CHART_SURFACE} strokeWidth="2" />}
                {b.strength === 0 && <circle cx={ex} cy={ey} r="3" fill="none" stroke={INK.grid} strokeWidth="1.2" strokeDasharray="2 2" />}
              </g>
            )
          })}

          {branches.map((b) => {
            const [ex, ey] = b.end
            const outward = polar(b.base[0], b.base[1], b.len + 20, b.angle)
            const anchor = outward[0] < cx - 8 ? 'end' : outward[0] > cx + 8 ? 'start' : 'middle'
            return (
              <text key={`${b.fruit}-l`} x={outward[0]} y={outward[1]} textAnchor={anchor} dominantBaseline="middle" fontSize="10.5" fill={b.strength > 0 ? INK.secondary : INK.muted}>
                {b.label}
              </text>
            )
          })}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? `${hover.label} · ${hover.count} ${i18nT('次操练')}${hover.strength >= 0.6 ? ` · ${i18nT('结果了')}` : hover.strength > 0 ? ` · ${i18nT('长叶中')}` : ` · ${i18nT('还没发芽')}`}` : null}
        </ChartTooltip>
      </div>
      <p style={{ fontSize: 11.5, color: INK.muted, marginTop: 8, lineHeight: 1.6 }}>
        <span aria-hidden="true" style={{ display: 'inline-block', width: 9, height: 6, borderRadius: 3, background: LEAF, marginRight: 5 }} />
        {i18nT('叶＝正在操练')}
        <span aria-hidden="true" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: FRUIT, margin: '0 5px 0 14px' }} />
        {i18nT('果＝已经结出')}
        <span style={{ display: 'block', marginTop: 4, color: STATUS.good }}>{i18nT('果子是圣灵的工作，不是给自己打分的成绩单。')}</span>
      </p>
    </ChartFrame>
  )
}

export default GrowthTree
