import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { API_BASE } from './api'
import { getRuntimeLang } from './i18n/runtime'
import { MIRROR_CHARACTERS } from './mirrorData'
import { AutoText } from './autoTranslate'

// 圣经人物关系图谱 —— 无第三方依赖的力导向图（SVG + requestAnimationFrame）
// 数据来源：GET /api/characters/knowledge-graph

const NODE_COLORS = {
  character: '#5ac8fa',
  event: '#ff9f0a',
  place: '#34c759',
  nation: '#ff6b6b',
  group: '#bf5af2',
  theme: '#ffd60a',
  book: '#8e8e93',
}
const NODE_TYPE_LABEL = {
  all: { zh: '全部', en: 'All' },
  character: { zh: '人物', en: 'People' },
  event: { zh: '事件', en: 'Events' },
  place: { zh: '地点', en: 'Places' },
  nation: { zh: '邦国', en: 'Nations' },
  group: { zh: '群体', en: 'Groups' },
  theme: { zh: '主题', en: 'Themes' },
  book: { zh: '书卷', en: 'Books' },
}
const colorOf = (t) => NODE_COLORS[t] || '#aeaeb2'

const CARD_BY_NAME = new Map()
for (const c of MIRROR_CHARACTERS) { if (!CARD_BY_NAME.has(c.name)) CARD_BY_NAME.set(c.name, c) }
const stripParen = (x) => String(x || '').replace(/[（(][^)）]*[)）]/g, '').trim()
function resolveCard(node) {
  if (!node || (node.type && node.type !== 'character')) return null
  const cands = [node.chineseName, node.name, ...(node.aliases || [])].filter(Boolean)
  for (const nm of cands) { if (CARD_BY_NAME.has(nm)) return CARD_BY_NAME.get(nm) }
  const bases = cands.map(stripParen).filter(Boolean)
  for (const c of MIRROR_CHARACTERS) { if (bases.includes(stripParen(c.name))) return c }
  return null
}

export default function RelationshipGraphView({ token, onBack, initialFocus = '', onOpenChar, onFocusChange }) {
  const en = getRuntimeLang() === 'en'
  const [raw, setRaw] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focusInput, setFocusInput] = useState(initialFocus)
  const [focus, setFocus] = useState(initialFocus)
  const [depth, setDepth] = useState(1)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const wrapRef = useRef(null)
  const [size, setSize] = useState({ w: 900, h: 620 })
  const simRef = useRef({ nodes: [], edges: [], byId: new Map() })
  const viewRef = useRef({ x: 0, y: 0, k: 1 })
  const [, force] = useState(0)
  const rerender = useCallback(() => force((n) => (n + 1) % 1000000), [])

  // ---- fetch ----
  useEffect(() => {
    let alive = true
    setLoading(true); setError('')
    const params = new URLSearchParams()
    if (focus) { params.set('focus', focus); params.set('depth', String(depth)) }
    if (typeFilter !== 'all') params.set('node_type', typeFilter)
    params.set('limit', focus ? '260' : '180')
    fetch(`${API_BASE}/characters/knowledge-graph?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((j) => {
        if (!alive) return
        const data = j?.data || j || {}
        setRaw({ nodes: data.nodes || [], edges: data.edges || [] })
        setSelected(null)
        setLoading(false)
      })
      .catch((e) => { if (alive) { setError(String(e.message || e)); setLoading(false) } })
    return () => { alive = false }
  }, [focus, depth, typeFilter, token])

  // ---- container size ----
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setSize({ w: Math.max(320, el.clientWidth), h: Math.max(420, el.clientHeight) })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- build & simulate ----
  useEffect(() => {
    const W = size.w, H = size.h
    const byId = new Map()
    const nodes = raw.nodes.map((n, i) => {
      const ang = (i / Math.max(1, raw.nodes.length)) * Math.PI * 2
      const node = {
        ...n,
        x: W / 2 + Math.cos(ang) * (120 + (i % 7) * 18),
        y: H / 2 + Math.sin(ang) * (120 + (i % 5) * 18),
        vx: 0, vy: 0, r: Math.min(16, 4 + Math.sqrt((n.degree || 1)) * 1.7), fixed: false,
      }
      byId.set(n.id, node)
      return node
    })
    const edges = raw.edges
      .map((e) => ({ ...e, s: byId.get(e.source), t: byId.get(e.target) }))
      .filter((e) => e.s && e.t)
    simRef.current = { nodes, edges, byId }

    // auto-fit view on first layout of this dataset
    viewRef.current = { x: 0, y: 0, k: 1 }

    let alpha = 1
    let raf
    const tick = () => {
      const { nodes: ns, edges: es } = simRef.current
      const n = ns.length
      if (!n) return
      // repulsion (O(n^2), fine for <=280 nodes)
      for (let i = 0; i < n; i++) {
        const a = ns[i]
        for (let j = i + 1; j < n; j++) {
          const b = ns[j]
          let dx = a.x - b.x, dy = a.y - b.y
          let d2 = dx * dx + dy * dy
          if (d2 < 0.01) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = dx * dx + dy * dy + 0.01 }
          const dist = Math.sqrt(d2)
          const rep = Math.min(2600 / d2, 40)
          const fx = (dx / dist) * rep, fy = (dy / dist) * rep
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
        }
      }
      // spring along edges
      for (const e of es) {
        const a = e.s, b = e.t
        let dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const ideal = 78
        const f = (dist - ideal) * 0.018
        const fx = (dx / dist) * f, fy = (dy / dist) * f
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
      }
      // gravity to center + integrate
      const cx = W / 2, cy = H / 2
      for (const p of ns) {
        if (p.fixed) { p.vx = 0; p.vy = 0; continue }
        p.vx += (cx - p.x) * 0.012
        p.vy += (cy - p.y) * 0.012
        p.vx *= 0.86; p.vy *= 0.86
        p.x += p.vx * alpha
        p.y += p.vy * alpha
      }
      alpha *= 0.985
      rerender()
      if (alpha > 0.03) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, size.w, size.h])

  // ---- pointer interactions (pan / zoom / drag node) ----
  const drag = useRef(null)
  const toWorld = (clientX, clientY) => {
    const rect = wrapRef.current.getBoundingClientRect()
    const v = viewRef.current
    return { x: (clientX - rect.left - v.x) / v.k, y: (clientY - rect.top - v.y) / v.k }
  }
  const onPointerDown = (e, node) => {
    e.stopPropagation()
    const p = toWorld(e.clientX, e.clientY)
    drag.current = { node, kind: 'node', dx: node.x - p.x, dy: node.y - p.y }
    node.fixed = true
    setSelected(node)
    try { e.target.setPointerCapture?.(e.pointerId) } catch {}
  }
  const onBgPointerDown = (e) => {
    drag.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: viewRef.current.x, oy: viewRef.current.y }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    if (d.kind === 'node') {
      const p = toWorld(e.clientX, e.clientY)
      d.node.x = p.x + d.dx; d.node.y = p.y + d.dy; d.node.vx = 0; d.node.vy = 0
      rerender()
    } else if (d.kind === 'pan') {
      viewRef.current.x = d.ox + (e.clientX - d.sx)
      viewRef.current.y = d.oy + (e.clientY - d.sy)
      rerender()
    }
  }
  const onPointerUp = () => {
    if (drag.current?.kind === 'node' && drag.current.node) drag.current.node.fixed = false
    drag.current = null
  }
  const onWheel = (e) => {
    e.preventDefault()
    const v = viewRef.current
    const rect = wrapRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const k = Math.min(3, Math.max(0.25, v.k * factor))
    v.x = mx - (mx - v.x) * (k / v.k)
    v.y = my - (my - v.y) * (k / v.k)
    v.k = k
    rerender()
  }

  const fitView = useCallback(() => {
    const ns = simRef.current.nodes
    if (!ns.length) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of ns) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y) }
    const pad = 60
    const k = Math.min(2, Math.max(0.3, Math.min((size.w - pad) / (maxX - minX || 1), (size.h - pad) / (maxY - minY || 1))))
    viewRef.current = { k, x: size.w / 2 - ((minX + maxX) / 2) * k, y: size.h / 2 - ((minY + maxY) / 2) * k }
    rerender()
  }, [size.w, size.h, rerender])

  const submitFocus = (val) => { const v = val.trim(); setFocus(v); if (onFocusChange) onFocusChange(v) }

  const { nodes, edges } = simRef.current
  const selId = selected?.id
  const adj = useMemo(() => {
    if (!selId) return null
    const set = new Set()
    const rels = []
    for (const e of raw.edges) {
      if (e.source === selId || e.target === selId) {
        const otherId = e.source === selId ? e.target : e.source
        set.add(otherId)
        rels.push({ id: e.id, label: (en && e.labelEn) ? e.labelEn : (e.label || e.type), otherName: e.source === selId ? e.targetName : e.sourceName, otherType: e.source === selId ? e.targetType : e.sourceType, dir: e.source === selId ? 'out' : 'in' })
      }
    }
    return { set, rels }
  }, [selId, raw.edges, en])

  const selCard = selected ? resolveCard(selected) : null
  const v = viewRef.current
  const labelCut = nodes.length > 120 ? 4 : 2
  const nm = (node) => { if (!en) return node.chineseName || node.name; const cc = resolveCard(node); return (cc && cc.en) || node.englishName || node.nameEn || node.name }

  return (
    <div style={{ padding: '16px 16px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={onBack} aria-label={en ? 'Back' : '返回'} title={en ? 'Back' : '返回'} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff',
          width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 19, color: '#fff' }}>{en ? 'Relationship Graph' : '关系图谱'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); submitFocus(focusInput) }} style={{ display: 'flex', gap: 6, flex: 1, minWidth: 180 }}>
          <input value={focusInput} onChange={(e) => setFocusInput(e.target.value)} placeholder={en ? 'Focus on a person (e.g. David)' : '聚焦某人物（如 大卫）'}
            style={{ flex: 1, minWidth: 120, padding: '7px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, outline: 'none' }} />
          <button type="submit" style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#007aff', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{en ? 'Focus' : '聚焦'}</button>
          {focus && <button type="button" onClick={() => { setFocusInput(''); submitFocus('') }} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' }}>{en ? 'Clear' : '全部'}</button>}
          {focus && (
            <select value={depth} onChange={(e) => setDepth(Number(e.target.value))} title={en ? 'Expansion hops' : '展开层数'}
              style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(30,30,40,0.9)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              <option value={1}>{en ? '1 hop' : '直接关系'}</option>
              <option value={2}>{en ? '2 hops' : '2层'}</option>
              <option value={3}>{en ? '3 hops' : '3层'}</option>
            </select>
          )}
        </form>
      </div>

      {/* Type filter + legend + controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.keys(NODE_TYPE_LABEL).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 16, cursor: 'pointer',
            fontSize: 12, border: '1px solid ' + (typeFilter === t ? 'rgba(0,122,255,0.6)' : 'rgba(255,255,255,0.12)'),
            background: typeFilter === t ? 'rgba(0,122,255,0.22)' : 'rgba(255,255,255,0.05)', color: '#fff',
          }}>
            {t !== 'all' && <span style={{ width: 9, height: 9, borderRadius: '50%', background: colorOf(t), display: 'inline-block' }} />}
            {en ? NODE_TYPE_LABEL[t].en : NODE_TYPE_LABEL[t].zh}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={fitView} style={{ padding: '5px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', fontSize: 12, cursor: 'pointer' }}>{en ? 'Fit' : '适应'}</button>
      </div>

      {/* Canvas */}
      <div ref={wrapRef} style={{ position: 'relative', flex: 1, minHeight: 420, borderRadius: 14, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, rgba(40,40,60,0.45), rgba(10,10,18,0.6))', border: '1px solid rgba(255,255,255,0.08)', touchAction: 'none' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{en ? 'Loading graph…' : '加载图谱中…'}</div>}
        {error && !loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b', fontSize: 13, padding: 20, textAlign: 'center' }}>{(en ? 'Failed to load: ' : '加载失败：') + error}</div>}
        {!loading && !error && nodes.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{en ? 'No data' : '暂无数据'}</div>}
        {!loading && !error && nodes.length > 0 && edges.length === 0 && (
          <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', maxWidth: 470, pointerEvents: 'none', textAlign: 'center', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 16px', color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 1.7 }}>
            {en
              ? 'The graph currently maps relationships between people. This node has no links yet — try focusing on a person (e.g. David, Paul, Moses).'
              : '关系图谱目前主要收录「人物」之间的关系；该节点暂无关系连线。试试聚焦某个人物（如 大卫、保罗、摩西）。'}
          </div>
        )}

        <svg width={size.w} height={size.h} style={{ display: 'block', cursor: drag.current?.kind === 'pan' ? 'grabbing' : 'grab' }}
          onPointerDown={onBgPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}>
          <g transform={`translate(${v.x},${v.y}) scale(${v.k})`}>
            {edges.map((e) => {
              const hot = selId && (e.source === selId || e.target === selId)
              return <line key={e.id} x1={e.s.x} y1={e.s.y} x2={e.t.x} y2={e.t.y}
                stroke={hot ? 'rgba(0,180,255,0.75)' : 'rgba(255,255,255,0.10)'} strokeWidth={hot ? 1.6 : 0.8} />
            })}
            {nodes.map((node) => {
              const isSel = node.id === selId
              const dim = selId && !isSel && !(adj && adj.set.has(node.id))
              const showLabel = isSel || (adj && adj.set.has(node.id)) || (node.degree || 0) >= labelCut || node.type !== 'character'
              return (
                <g key={node.id} transform={`translate(${node.x},${node.y})`} style={{ cursor: 'pointer', opacity: dim ? 0.25 : 1 }}
                  onPointerDown={(ev) => onPointerDown(ev, node)}>
                  <circle r={node.r} fill={colorOf(node.type)} stroke={isSel ? '#fff' : 'rgba(0,0,0,0.35)'} strokeWidth={isSel ? 2 : 1} />
                  {showLabel && (
                    <text x={node.r + 3} y={4} fontSize={isSel ? 12 : 10} fill={isSel ? '#fff' : 'rgba(255,255,255,0.78)'}
                      style={{ pointerEvents: 'none', userSelect: 'none', paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 2.4 }}>{nm(node)}</text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* hint */}
        {!loading && !error && nodes.length > 0 && (
          <div style={{ position: 'absolute', left: 10, bottom: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>
            {en ? 'Drag to pan · scroll to zoom · tap a node' : '拖拽平移 · 滚轮缩放 · 点节点查看'} · {nodes.length} {en ? 'nodes' : '节点'} / {edges.length} {en ? 'links' : '关系'}
          </div>
        )}

        {/* selected node panel */}
        {selected && (
          <div style={{ position: 'absolute', top: 10, right: 10, width: 248, maxHeight: 'calc(100% - 20px)', overflow: 'auto',
            background: 'rgba(20,20,30,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                {selCard && onOpenChar ? (
                  <div onClick={() => onOpenChar(selCard)} title={en ? 'Open mirror card' : '查看镜鉴卡片'}
                    style={{ fontSize: 16, fontWeight: 700, color: '#9ecbff', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>{nm(selected)}</div>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{nm(selected)}</div>
                )}
                <div style={{ fontSize: 11, color: colorOf(selected.type), marginTop: 2 }}>
                  {(en ? NODE_TYPE_LABEL[selected.type]?.en : NODE_TYPE_LABEL[selected.type]?.zh) || selected.type}
                  {selected.importanceLevel ? ` · ${selected.importanceLevel}` : ''}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            {selected.summary && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 1.5 }}><AutoText>{String(selected.summary).slice(0, 160)}</AutoText></div>}
            {selCard && onOpenChar && (
              <button onClick={() => onOpenChar(selCard)} style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 8, border: 'none', background: 'rgba(52,199,89,0.28)', color: '#7ee2a0', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{en ? 'Open mirror card →' : '查看镜鉴卡片 →'}</button>
            )}
            <button onClick={() => { setFocusInput(selected.name); submitFocus(selected.name) }} style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 8, border: 'none', background: 'rgba(0,122,255,0.25)', color: '#9ecbff', fontSize: 12, cursor: 'pointer' }}>{en ? 'Focus this node' : '以此为中心展开'}</button>
            {adj && adj.rels.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{en ? 'Relationships' : '关系'} ({adj.rels.length})</div>
                {adj.rels.slice(0, 40).map((r) => {
                  const rc = r.otherType === 'character' ? resolveCard({ name: r.otherName, type: 'character' }) : null
                  return (
                  <div key={r.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', padding: '3px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>{r.dir === 'out' ? '→ ' : '← '}</span>
                    <span style={{ color: '#9ecbff' }}><AutoText>{r.label}</AutoText></span> · {(rc && onOpenChar)
                      ? <span onClick={() => onOpenChar(rc)} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>{en && rc ? rc.en : r.otherName}</span>
                      : <AutoText>{r.otherName}</AutoText>}
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
