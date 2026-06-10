// GraphPanel — 圣经关系图谱可视化（预言→列国 / 帝国征服与更替 / 战役统帅 / 支派相邻）
// 零依赖：内置轻量力导向布局 + SVG 渲染；数据走 /api/bible-map/graph，离线回退本地图谱。
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { fetchGraph, fetchGraphNeighbors } from '../lib/dataSource'
import { t } from '../../../i18n/runtime'
import { AutoText } from '../../../autoTranslate.jsx'
import type { BibleGraph, GraphNeighbors, GraphNode } from '../domain/types'

const W = 920
const HGT = 640

const KIND_COLORS: Record<string, string> = {
  tribe: '#22c55e',
  empire: '#ef4444',
  nation: '#f59e0b',
  prophecy: '#a78bfa',
  campaign: '#38bdf8',
  commander: '#e879f9',
  person: '#f97316',
  place: '#14b8a6',
  event: '#facc15',
}
const KIND_LABELS: Record<string, string> = {
  tribe: '支派',
  empire: '帝国',
  nation: '列国',
  prophecy: '预言',
  campaign: '战役',
  commander: '统帅',
  person: '人物',
  place: '地点',
  event: '事件',
}
const EDGE_STYLES: Record<string, { color: string; dash?: string; label: string }> = {
  AGAINST: { color: '#a78bfa', dash: '5 3', label: '预言论及' },
  CONQUERED: { color: '#ef4444', label: '征服' },
  SUCCEEDED: { color: '#60a5fa', dash: '2 3', label: '帝国更替' },
  LED_BY: { color: '#38bdf8', dash: '1 3', label: '统帅' },
  NEIGHBORS: { color: '#6b7280', dash: '1 4', label: '相邻' },
  TRAVELED_TO: { color: '#14b8a6', dash: '3 3', label: '到访' },
  HAPPENED_AT: { color: '#facc15', dash: '4 2', label: '发生于' },
  FEATURES: { color: '#f97316', dash: '2 2', label: '人物' },
}

interface LaidNode extends GraphNode {
  x: number
  y: number
}

// 轻量力导向布局：库仑斥力 + 边弹簧 + 向心力，确定性（种子化），同步迭代。
function layoutGraph(graph: BibleGraph): LaidNode[] {
  const n = graph.nodes.length
  if (n === 0) return []
  // 按 kind 分组的初始环形布局，保证可重复（无随机）
  const kinds = [...new Set(graph.nodes.map((d) => d.kind))]
  const placed: LaidNode[] = graph.nodes.map((node, i) => {
    const ring = kinds.indexOf(node.kind)
    const radius = 120 + ring * 70
    const angle = (i / n) * Math.PI * 2 + ring * 0.7
    return { ...node, x: W / 2 + radius * Math.cos(angle), y: HGT / 2 + radius * Math.sin(angle) }
  })
  const idx = new Map(placed.map((d, i) => [d.id, i]))
  const k = Math.sqrt((W * HGT) / Math.max(1, n)) * 0.7
  for (let iter = 0; iter < 260; iter++) {
    const damp = 1 - iter / 260
    const fx = new Array<number>(n).fill(0)
    const fy = new Array<number>(n).fill(0)
    // 斥力
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = placed[i].x - placed[j].x
        let dy = placed[i].y - placed[j].y
        let d2 = dx * dx + dy * dy
        if (d2 < 1) { dx = 0.5; dy = 0.5; d2 = 0.5 }
        const f = (k * k) / d2
        fx[i] += dx * f * 0.02; fy[i] += dy * f * 0.02
        fx[j] -= dx * f * 0.02; fy[j] -= dy * f * 0.02
      }
    }
    // 弹簧（边）
    for (const e of graph.edges) {
      const a = idx.get(e.source); const b = idx.get(e.target)
      if (a === undefined || b === undefined) continue
      const dx = placed[b].x - placed[a].x
      const dy = placed[b].y - placed[a].y
      const d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const f = (d - k * 1.1) * 0.015
      fx[a] += (dx / d) * f * d; fy[a] += (dy / d) * f * d
      fx[b] -= (dx / d) * f * d; fy[b] -= (dy / d) * f * d
    }
    // 向心 + 应用
    for (let i = 0; i < n; i++) {
      fx[i] += (W / 2 - placed[i].x) * 0.012
      fy[i] += (HGT / 2 - placed[i].y) * 0.012
      placed[i].x += Math.max(-14, Math.min(14, fx[i])) * damp
      placed[i].y += Math.max(-14, Math.min(14, fy[i])) * damp
      placed[i].x = Math.max(30, Math.min(W - 30, placed[i].x))
      placed[i].y = Math.max(26, Math.min(HGT - 26, placed[i].y))
    }
  }
  return placed
}

interface Props {
  onBack?: () => void
}

export function GraphPanel({ onBack }: Props) {
  const [graph, setGraph] = useState<BibleGraph | null>(null)
  const [selected, setSelected] = useState<GraphNeighbors | null>(null)
  const [kindFilter, setKindFilter] = useState<string | null>(null)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: W, h: HGT })
  const [manualPos, setManualPos] = useState<Record<string, { x: number; y: number }>>({})
  const [drag, setDrag] = useState<null | { type: 'pan'; sx: number; sy: number; ox: number; oy: number } | { type: 'node'; id: string }>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    let alive = true
    void fetchGraph().then((g) => { if (alive) setGraph(g) })
    return () => { alive = false }
  }, [])

  const laid = useMemo(() => {
    const base = graph ? layoutGraph(graph) : []
    return base.map((n) => (manualPos[n.id] ? { ...n, ...manualPos[n.id] } : n))
  }, [graph, manualPos])
  const nodeById = useMemo(() => new Map(laid.map((d) => [d.id, d])), [laid])

  const neighborIds = useMemo(() => {
    if (!selected) return null
    return new Set([selected.node.id, ...selected.neighbors.map((x) => x.node.id)])
  }, [selected])

  const visibleKind = (kind: string): boolean => kindFilter === null || kindFilter === kind

  function svgPoint(e: ReactPointerEvent<SVGSVGElement> | ReactPointerEvent<SVGGElement> | ReactWheelEvent<SVGSVGElement>): { x: number; y: number } {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const r = svg.getBoundingClientRect()
    return {
      x: viewBox.x + ((e.clientX - r.left) / Math.max(1, r.width)) * viewBox.w,
      y: viewBox.y + ((e.clientY - r.top) / Math.max(1, r.height)) * viewBox.h,
    }
  }

  function zoomAt(e: ReactWheelEvent<SVGSVGElement>): void {
    e.preventDefault()
    const p = svgPoint(e)
    const factor = e.deltaY > 0 ? 1.12 : 0.88
    const nw = Math.max(220, Math.min(W * 2.8, viewBox.w * factor))
    const nh = Math.max(150, Math.min(HGT * 2.8, viewBox.h * factor))
    setViewBox({
      x: p.x - ((p.x - viewBox.x) / viewBox.w) * nw,
      y: p.y - ((p.y - viewBox.y) / viewBox.h) * nh,
      w: nw,
      h: nh,
    })
  }

  function resetView(): void {
    setViewBox({ x: 0, y: 0, w: W, h: HGT })
    setManualPos({})
  }

  async function onNodeClick(node: GraphNode): Promise<void> {
    const detail = await fetchGraphNeighbors(node.id)
    setSelected(detail ?? { node, neighbors: [], source: 'local' })
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3 lg:flex-row">
      {/* 图谱画布 */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        {!graph && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            {t('图谱加载中…')}
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="h-full w-full touch-none"
          role="img"
          aria-label={t('圣经关系图谱')}
          onWheel={zoomAt}
          onPointerDown={(e) => {
            if (e.target === svgRef.current) {
              ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
              setDrag({ type: 'pan', sx: e.clientX, sy: e.clientY, ox: viewBox.x, oy: viewBox.y })
            }
          }}
          onPointerMove={(e) => {
            if (!drag) return
            if (drag.type === 'pan') {
              const svg = svgRef.current
              const r = svg?.getBoundingClientRect()
              const scaleX = viewBox.w / Math.max(1, r?.width ?? 1)
              const scaleY = viewBox.h / Math.max(1, r?.height ?? 1)
              setViewBox((v) => ({ ...v, x: drag.ox - (e.clientX - drag.sx) * scaleX, y: drag.oy - (e.clientY - drag.sy) * scaleY }))
            } else {
              const p = svgPoint(e)
              setManualPos((cur) => ({ ...cur, [drag.id]: p }))
            }
          }}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
        >
          {/* 边 */}
          {graph?.edges.map((e, i) => {
            const a = nodeById.get(e.source)
            const b = nodeById.get(e.target)
            if (!a || !b || !visibleKind(a.kind) || !visibleKind(b.kind)) return null
            const st = EDGE_STYLES[e.type] ?? { color: '#6b7280', label: e.type }
            const dim = neighborIds !== null && !(neighborIds.has(a.id) && neighborIds.has(b.id))
            return (
              <line
                key={`${e.source}-${e.target}-${i}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={st.color}
                strokeWidth={dim ? 0.8 : 1.8}
                strokeDasharray={st.dash}
                opacity={dim ? 0.15 : 0.75}
              />
            )
          })}
          {/* 节点 */}
          {laid.map((d) => {
            if (!visibleKind(d.kind)) return null
            const isSel = selected?.node.id === d.id
            const dim = neighborIds !== null && !neighborIds.has(d.id)
            const r = d.kind === 'empire' ? 11 : d.kind === 'prophecy' ? 6 : 8
            return (
              <g
                key={d.id}
                transform={`translate(${d.x},${d.y})`}
                opacity={dim ? 0.22 : 1}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  ;(e.currentTarget as SVGGElement).setPointerCapture(e.pointerId)
                  setDrag({ type: 'node', id: d.id })
                }}
                onClick={() => { void onNodeClick(d) }}
              >
                <circle
                  r={r}
                  fill={KIND_COLORS[d.kind] ?? '#9ca3af'}
                  stroke={isSel ? '#fbbf24' : '#0b1220'}
                  strokeWidth={isSel ? 3 : 1.5}
                />
                <text
                  y={-r - 4}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#e5e7eb"
                  stroke="#0b1220"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {d.label}
                </text>
              </g>
            )
          })}
        </svg>
        {/* 图例 + 筛选 */}
        <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/60 p-2 backdrop-blur">
          <div className="mb-1 text-[10px] text-gray-400">{t('节点（点击筛选）')}</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(KIND_LABELS).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setKindFilter(kindFilter === kind ? null : kind)}
                className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] transition ${
                  kindFilter === kind ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: KIND_COLORS[kind] }} />
                <AutoText>{label}</AutoText>
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
            {Object.entries(EDGE_STYLES).map(([type, st]) => (
              <span key={type} className="flex items-center gap-1 text-[10px] text-gray-400">
                <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={st.color} strokeWidth="2" strokeDasharray={st.dash} /></svg>
                <AutoText>{st.label}</AutoText>
              </span>
            ))}
          </div>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute right-3 top-3 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-sm text-gray-200 backdrop-blur hover:bg-white/10"
          >
            {t('‹ 返回地图')}
          </button>
        )}
        <button
          type="button"
          onClick={resetView}
          className="absolute right-3 bottom-3 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-xs text-gray-200 backdrop-blur hover:bg-white/10"
        >
          {t('复位视图')}
        </button>
      </div>

      {/* 选中节点详情 */}
      <aside className="w-full shrink-0 lg:w-80">
        {selected ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: KIND_COLORS[selected.node.kind] ?? '#9ca3af' }} />
              <h3 className="text-base font-bold text-white"><AutoText>{selected.node.label}</AutoText></h3>
              <span className="text-[11px] text-gray-400"><AutoText>{KIND_LABELS[selected.node.kind] ?? selected.node.kind}</AutoText></span>
            </div>
            {selected.neighbors.length === 0 ? (
              <p className="text-sm text-gray-400">{t('暂无关联记录')}</p>
            ) : (
              <ul className="space-y-1.5">
                {selected.neighbors.map((x, i) => {
                  const st = EDGE_STYLES[x.type] ?? { color: '#6b7280', label: x.type }
                  return (
                    <li key={`${x.node.id}-${i}`}>
                      <button
                        type="button"
                        onClick={() => { void onNodeClick(x.node) }}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm transition hover:bg-white/10"
                      >
                        <span className="mr-1.5 rounded px-1 py-0.5 text-[10px] font-semibold" style={{ background: `${st.color}26`, color: st.color }}>
                          {x.direction === 'out' ? '→' : '←'} <AutoText>{st.label}</AutoText>
                        </span>
                        <span className="text-gray-100"><AutoText>{x.node.label}</AutoText></span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-3 text-[10px] text-gray-500">
              {selected.source === 'local' ? t('数据：内置图谱（离线）') : t('数据：后端图谱服务')}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-gray-400">
            <div className="mb-1 text-base">🕸 {t('圣经关系图谱')}</div>
            {t('点击任意节点查看其关联：先知预言所论及的列国、帝国的征服与更替、战役与统帅、支派相邻关系。')}
          </div>
        )}
      </aside>
    </div>
  )
}
