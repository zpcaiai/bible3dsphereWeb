// DirectedGraph.jsx — 2D 有向关系图 / 因果链路图（确定性分层布局，无力导向）。
//
// 为什么不用 3D 图谱：坚固营垒的「触发 → 谎言 → 情绪 → 行为 → 后果 → 强化」
// 是一条有方向、会闭环的链路。段落文字读不出「循环」，3D 又太重且不稳定。
// 分层布局每次渲染位置一致，用户能形成空间记忆。
//
// 任意两节点都可能相邻，因此配色只用经全对校验的前 3 个色位 + 状态色。
import { useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { ChartFrame, ChartTooltip } from './ChartFrame'
import { INK, FONT, STATUS, CATEGORICAL_ALLPAIRS, CHART_SURFACE } from './chartTheme'

/** 最长路径分层；参与环的边被标记为 back edge。 */
function layout(nodes, edges) {
  const idx = new Map(nodes.map((n, i) => [n.id, i]))
  const adj = nodes.map(() => [])
  const indeg = nodes.map(() => 0)
  const valid = []
  edges.forEach((e) => {
    const a = idx.get(e.from); const b = idx.get(e.to)
    if (a == null || b == null) return
    valid.push({ ...e, a, b })
    adj[a].push(b)
    indeg[b] += 1
  })

  // Kahn 拓扑排序；剩下的节点即在环上
  const layer = nodes.map(() => 0)
  const deg = indeg.slice()
  const queue = nodes.map((_, i) => i).filter((i) => deg[i] === 0)
  const seen = new Set(queue)
  while (queue.length) {
    const u = queue.shift()
    adj[u].forEach((v) => {
      layer[v] = Math.max(layer[v], layer[u] + 1)
      deg[v] -= 1
      if (deg[v] === 0 && !seen.has(v)) { seen.add(v); queue.push(v) }
    })
  }
  // 环上的节点：按其在输入中的顺序顺延，保证仍然向右推进
  nodes.forEach((_, i) => { if (!seen.has(i)) layer[i] = Math.max(layer[i], i) })

  const back = new Set()
  valid.forEach((e, k) => { if (layer[e.b] <= layer[e.a]) back.add(k) })

  return { layer, valid, back, idx }
}

/**
 * @param {Array<{id, label, kind?: 'trigger'|'belief'|'emotion'|'behavior'|'consequence'|'default', note?}>} nodes
 * @param {Array<{from, to, label?}>} edges
 */
export function DirectedGraph({
  nodes = [], edges = [], title, subtitle,
  width = 560, nodeW = 108, nodeH = 42, gapX = 46, gapY = 16, onSelect,
}) {
  const [hover, setHover] = useState(null)
  const { layer, valid, back } = useMemo(() => layout(nodes, edges), [nodes, edges])
  if (!nodes.length) return null

  const KIND_COLOR = {
    trigger: CATEGORICAL_ALLPAIRS[1],
    belief: CATEGORICAL_ALLPAIRS[0],
    emotion: CATEGORICAL_ALLPAIRS[2],
    behavior: STATUS.serious,
    consequence: STATUS.critical,
    grace: STATUS.good,
    default: CATEGORICAL_ALLPAIRS[0],
  }

  const layers = []
  nodes.forEach((n, i) => {
    const L = layer[i]
    if (!layers[L]) layers[L] = []
    layers[L].push({ ...n, i })
  })
  const cols = layers.filter(Boolean)
  const maxRows = Math.max(1, ...cols.map((c) => c.length))
  const height = maxRows * (nodeH + gapY) + 30
  const totalW = Math.max(width, cols.length * (nodeW + gapX) + gapX)

  const pos = new Map()
  cols.forEach((col, ci) => {
    col.forEach((n, ri) => {
      const x = gapX / 2 + ci * (nodeW + gapX)
      const y = 14 + ri * (nodeH + gapY) + ((maxRows - col.length) * (nodeH + gapY)) / 2
      pos.set(n.i, { x, y })
    })
  })

  const hasCycle = back.size > 0
  const summary = i18nT('{title}：{nodes} 个节点、{links} 条连线{cycle}。{paths}', {
    title: title || i18nT('链路图'),
    nodes: nodes.length,
    links: valid.length,
    cycle: hasCycle ? i18nT('，其中 {count} 条构成强化循环', { count: back.size }) : '',
    paths: valid.map((e) => `${nodes[e.a]?.label} → ${nodes[e.b]?.label}`).join(i18nT('；')),
  })

  return (
    <ChartFrame
      title={title} subtitle={subtitle} summary={summary}
      tableColumns={[i18nT('从'), i18nT('到'), i18nT('关系')]}
      tableRows={valid.map((e, k) => [nodes[e.a]?.label || '', nodes[e.b]?.label || '', (e.label || '') + (back.has(k) ? ` (${i18nT('回环')})` : '')])}
    >
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${totalW} ${height}`} width="100%" style={{ display: 'block', minWidth: Math.min(totalW, 520), fontFamily: FONT }} aria-hidden="true">
          <defs>
            <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={INK.baseline} />
            </marker>
            <marker id="dg-arrow-back" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={STATUS.critical} />
            </marker>
          </defs>

          {valid.map((e, k) => {
            const p1 = pos.get(e.a); const p2 = pos.get(e.b)
            if (!p1 || !p2) return null
            const isBack = back.has(k)
            const x1 = p1.x + nodeW; const y1 = p1.y + nodeH / 2
            const x2 = p2.x; const y2 = p2.y + nodeH / 2
            const d = isBack
              ? `M ${p1.x} ${p1.y + nodeH / 2} C ${p1.x - 40} ${p1.y - 26}, ${p2.x + nodeW + 40} ${p2.y - 26}, ${p2.x + nodeW} ${p2.y + nodeH / 2}`
              : `M ${x1} ${y1} C ${x1 + gapX / 2} ${y1}, ${x2 - gapX / 2} ${y2}, ${x2} ${y2}`
            return (
              <g key={k}>
                <path
                  d={d} fill="none"
                  stroke={isBack ? STATUS.critical : INK.baseline}
                  strokeWidth={isBack ? 2 : 1.6}
                  strokeDasharray={isBack ? '5 4' : 'none'}
                  markerEnd={isBack ? 'url(#dg-arrow-back)' : 'url(#dg-arrow)'}
                />
                {e.label && !isBack && (
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5} textAnchor="middle" fontSize="9.5" fill={INK.muted}>{e.label}</text>
                )}
              </g>
            )
          })}

          {nodes.map((n, i) => {
            const p = pos.get(i)
            if (!p) return null
            const color = KIND_COLOR[n.kind] || KIND_COLOR.default
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHover({ ...n, x: p.x + nodeW / 2, y: p.y })}
                onMouseLeave={() => setHover(null)}
                onClick={onSelect ? () => onSelect(n) : undefined}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              >
                <rect x={p.x} y={p.y} width={nodeW} height={nodeH} rx="9" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="1.4" />
                <rect x={p.x} y={p.y} width="4" height={nodeH} rx="2" fill={color} />
                <text x={p.x + nodeW / 2 + 2} y={p.y + nodeH / 2 + 4} textAnchor="middle" fontSize="11.5" fill={INK.primary}>
                  {String(n.label).length > 9 ? `${String(n.label).slice(0, 9)}…` : n.label}
                </text>
              </g>
            )
          })}
        </svg>
        <ChartTooltip visible={!!hover} x={hover?.x} y={hover?.y}>
          {hover ? <><div>{hover.label}</div>{hover.note && <div style={{ color: INK.muted, maxWidth: 220, whiteSpace: 'normal' }}>{hover.note}</div>}</> : null}
        </ChartTooltip>
      </div>
      {hasCycle && (
        <p style={{ fontSize: 11.5, color: INK.secondary, marginTop: 8, lineHeight: 1.6 }}>
          <span aria-hidden="true" style={{ display: 'inline-block', width: 16, height: 0, borderTop: `2px dashed ${STATUS.critical}`, marginRight: 6, verticalAlign: 'middle' }} />
          {i18nT('虚线是回环：后果又反过来喂养了最初的触发。看见这个循环，就已经站在循环外面了。')}
        </p>
      )}
    </ChartFrame>
  )
}

export default DirectedGraph
