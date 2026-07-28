// Sankey.jsx — 流向图（两段或多段）。
// 适用：注意力从哪里流向哪里、祷告类型分布、时间去向、模式→后果的量级流转。
import { useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, FONT, MARK, seriesColor, CHART_SURFACE } from './chartTheme'

/**
 * @param {Array<{id, label, layer: number}>} nodes
 * @param {Array<{from, to, value}>} links
 */
export function Sankey({ nodes = [], links = [], title, subtitle, width = 540, height = 240, unit = '' }) {
  const [hover, setHover] = useState(null)

  const model = useMemo(() => {
    if (!nodes.length) return null
    const byLayer = new Map()
    nodes.forEach((n) => {
      const arr = byLayer.get(n.layer) || []
      arr.push(n)
      byLayer.set(n.layer, arr)
    })
    const layers = [...byLayer.keys()].sort((a, b) => a - b)
    const totals = new Map(nodes.map((n) => [n.id, 0]))
    links.forEach((l) => {
      totals.set(l.from, (totals.get(l.from) || 0) + (Number(l.value) || 0))
      totals.set(l.to, (totals.get(l.to) || 0) + (Number(l.value) || 0))
    })
    const layerTotal = layers.map((L) => (byLayer.get(L) || []).reduce((s, n) => s + (totals.get(n.id) || 0), 0))
    const maxTotal = Math.max(1, ...layerTotal)
    return { byLayer, layers, totals, maxTotal }
  }, [nodes, links])

  if (!model) return null

  const nodeW = 14
  const padT = 12; const padB = 12
  const innerH = height - padT - padB
  const colX = (li) => (model.layers.length <= 1 ? width / 2 : (li / (model.layers.length - 1)) * (width - nodeW))

  // 每层内按顺序堆叠
  const geom = new Map()
  model.layers.forEach((L, li) => {
    const arr = model.byLayer.get(L) || []
    const sum = arr.reduce((s, n) => s + (model.totals.get(n.id) || 0), 0) || 1
    const gapTotal = MARK.gap * Math.max(0, arr.length - 1) * 2
    let y = padT
    arr.forEach((n) => {
      const h = Math.max(4, ((model.totals.get(n.id) || 0) / sum) * (innerH - gapTotal))
      geom.set(n.id, { x: colX(li), y, h, layerIndex: li, label: n.label })
      y += h + MARK.gap * 2
    })
  })

  // 每个节点的出/入游标
  const outCur = new Map(); const inCur = new Map()
  const ribbons = links.map((l, k) => {
    const a = geom.get(l.from); const b = geom.get(l.to)
    if (!a || !b) return null
    const totalA = model.totals.get(l.from) || 1
    const totalB = model.totals.get(l.to) || 1
    const ha = ((Number(l.value) || 0) / totalA) * a.h
    const hb = ((Number(l.value) || 0) / totalB) * b.h
    const y1 = a.y + (outCur.get(l.from) || 0); outCur.set(l.from, (outCur.get(l.from) || 0) + ha)
    const y2 = b.y + (inCur.get(l.to) || 0); inCur.set(l.to, (inCur.get(l.to) || 0) + hb)
    const x1 = a.x + nodeW; const x2 = b.x
    const mx = (x1 + x2) / 2
    return {
      k,
      d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2} L ${x2} ${y2 + hb} C ${mx} ${y2 + hb}, ${mx} ${y1 + ha}, ${x1} ${y1 + ha} Z`,
      color: seriesColor(a.layerIndex === 0 ? (nodes.findIndex((n) => n.id === l.from) % 8) : 0),
      value: l.value, from: a.label, to: b.label, cx: mx, cy: (y1 + y2) / 2,
    }
  }).filter(Boolean)

  const summary = i18nT('{title}：{items}', {
    title: title || i18nT('流向图'),
    items: links.map((l) => `${geom.get(l.from)?.label || l.from} → ${geom.get(l.to)?.label || l.to} ${l.value}${unit}`).join(i18nT('，')),
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('从'), i18nT('到'), i18nT('数值')]}
      tableRows={links.map((l) => [geom.get(l.from)?.label || l.from, geom.get(l.to)?.label || l.to, `${l.value}${unit}`])}
    >
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', fontFamily: FONT }} aria-hidden="true">
          {ribbons.map((r) => (
            <path
              key={r.k} d={r.d} fill={r.color} fillOpacity={hover?.k === r.k ? 0.5 : 0.22}
              onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}
            />
          ))}
          {[...geom.entries()].map(([id, g], i) => (
            <g key={id}>
              <rect x={g.x} y={g.y} width={nodeW} height={g.h} rx="3" fill={seriesColor(i % 8)} stroke={CHART_SURFACE} strokeWidth={MARK.ringWidth} />
              <text
                x={g.layerIndex === model.layers.length - 1 ? g.x - 6 : g.x + nodeW + 6}
                y={g.y + g.h / 2} dominantBaseline="middle"
                textAnchor={g.layerIndex === model.layers.length - 1 ? 'end' : 'start'}
                fontSize="11" fill={INK.secondary}
              >
                {g.label}
              </text>
            </g>
          ))}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.cx} y={hover?.cy}>
          {hover ? `${hover.from} → ${hover.to} · ${hover.value}${unit}` : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

export default Sankey
