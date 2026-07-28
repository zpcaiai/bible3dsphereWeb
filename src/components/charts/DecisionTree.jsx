// DecisionTree.jsx — 决策 / 推演分支树（自左向右，确定性布局）。
// 适用：DecisionSupport 的方案权衡、Formation Twin 的「如果这样选 → 可能走向」。
import { useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, FONT, STATUS, CATEGORICAL_ALLPAIRS } from './chartTheme'

function flatten(node, depth, rows, parent) {
  const self = { ...node, depth, parent, children: node.children || [] }
  const at = rows.length
  rows.push(self)
  self.childIdx = self.children.map((c) => flatten(c, depth + 1, rows, at))
  return at
}

/**
 * @param {{label, note?, tone?, children?: []}} root
 */
export function DecisionTree({ root, title, subtitle, nodeW = 132, nodeH = 44, gapX = 40, gapY = 12, onSelect }) {
  const [hover, setHover] = useState(null)

  const { rows, depthMax } = useMemo(() => {
    if (!root) return { rows: [], depthMax: 0 }
    const r = []
    flatten(root, 0, r, null)
    return { rows: r, depthMax: Math.max(...r.map((n) => n.depth)) }
  }, [root])

  if (!rows.length) return null

  // 叶子按顺序占用行，父节点取子节点行的中位
  let leafRow = 0
  const rowOf = new Array(rows.length).fill(0)
  const assign = (i) => {
    const n = rows[i]
    if (!n.childIdx.length) { rowOf[i] = leafRow; leafRow += 1; return rowOf[i] }
    const kids = n.childIdx.map(assign)
    rowOf[i] = (kids[0] + kids[kids.length - 1]) / 2
    return rowOf[i]
  }
  assign(0)

  const totalRows = leafRow || 1
  const height = totalRows * (nodeH + gapY) + 20
  const width = (depthMax + 1) * (nodeW + gapX) + gapX

  const TONE = {
    good: STATUS.good, risk: STATUS.serious, danger: STATUS.critical,
    neutral: CATEGORICAL_ALLPAIRS[0], option: CATEGORICAL_ALLPAIRS[1],
  }

  const posOf = (i) => ({
    x: gapX / 2 + rows[i].depth * (nodeW + gapX),
    y: 10 + rowOf[i] * (nodeH + gapY),
  })

  const leaves = rows.filter((n) => !n.childIdx.length)
  const summary = i18nT('{title}：从「{root}」出发，共 {count} 个可能走向：{leaves}', {
    title: title || i18nT('分支树'),
    root: rows[0].label,
    count: leaves.length,
    leaves: leaves.map((l) => l.label).join(i18nT('、')),
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('层级'), i18nT('节点'), i18nT('说明')]}
      tableRows={rows.map((n) => [String(n.depth + 1), n.label, n.note || '—'])}
    >
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', minWidth: Math.min(width, 520), fontFamily: FONT }} aria-hidden="true">
          {rows.map((n, i) => n.childIdx.map((c) => {
            const p = posOf(i); const q = posOf(c)
            const x1 = p.x + nodeW; const y1 = p.y + nodeH / 2
            const x2 = q.x; const y2 = q.y + nodeH / 2
            return (
              <path
                key={`${i}-${c}`}
                d={`M ${x1} ${y1} C ${x1 + gapX / 2} ${y1}, ${x2 - gapX / 2} ${y2}, ${x2} ${y2}`}
                fill="none" stroke={INK.baseline} strokeWidth="1.6"
              />
            )
          }))}

          {rows.map((n, i) => {
            const p = posOf(i)
            const color = TONE[n.tone] || TONE.neutral
            const text = String(n.label)
            return (
              <g
                key={i}
                onMouseEnter={() => setHover({ ...n, x: p.x + nodeW / 2, y: p.y })}
                onMouseLeave={() => setHover(null)}
                onClick={onSelect ? () => onSelect(n) : undefined}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              >
                <rect x={p.x} y={p.y} width={nodeW} height={nodeH} rx="9" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.3" />
                <text x={p.x + 10} y={p.y + (n.note ? 19 : nodeH / 2 + 4)} fontSize="11.5" fill={INK.primary}>
                  {text.length > 11 ? `${text.slice(0, 11)}…` : text}
                </text>
                {n.note && (
                  <text x={p.x + 10} y={p.y + 33} fontSize="10" fill={INK.muted}>
                    {String(n.note).length > 13 ? `${String(n.note).slice(0, 13)}…` : n.note}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? <><div>{hover.label}</div>{hover.note && <div style={{ color: INK.muted, maxWidth: 230, whiteSpace: 'normal' }}>{hover.note}</div>}</> : null}
        </ChartTooltip>
      </div>
    </ChartFrame>
  )
}

export default DecisionTree
