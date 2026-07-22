import { useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Line, OrbitControls, Stars } from '@react-three/drei'
import { t as i18nT } from './i18n/runtime'
import {
  fetchFormationGraphHealth,
  fetchFormationGraphEvents,
  fetchFormationGraphStats,
  fetchFormationSubgraph,
  recordFormationGraphInteraction,
} from './api'
import { buildFormationGraphScene } from './formationGraphScene'

function GraphScene({ scene, selectedId, onSelect }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 12, 10]} intensity={80} />
      <Stars radius={60} depth={25} count={600} factor={2} fade speed={0.3} />
      {scene.edges.map((edge) => (
        <Line
          key={edge.id}
          points={[edge.sourceNode.positionArray, edge.targetNode.positionArray]}
          color={edge.edge_type === 'REINFORCES' ? '#ff9f43' : '#7684a8'}
          lineWidth={Math.min(4, 1 + Number(edge.weight || 1) * 0.45)}
          transparent
          opacity={0.58}
        />
      ))}
      {scene.nodes.map((node) => {
        const selected = node.id === selectedId
        const radius = Math.min(0.72, 0.24 + Number(node.strength || 1) * 0.09)
        return (
          <mesh
            key={node.id}
            position={node.positionArray}
            scale={selected ? 1.4 : 1}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(node)
            }}
          >
            <sphereGeometry args={[radius, 24, 24]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={selected ? 0.8 : 0.25}
              roughness={0.38}
            />
          </mesh>
        )
      })}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={5} maxDistance={42} />
    </>
  )
}

export default function FormationGraph3D({ userId, token, onNeedLogin }) {
  const [payload, setPayload] = useState({ nodes: [], edges: [], stats: {} })
  const [stats, setStats] = useState({})
  const [health, setHealth] = useState({})
  const [events, setEvents] = useState([])
  const [depth, setDepth] = useState(2)
  const [focusNode, setFocusNode] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const scene = useMemo(() => buildFormationGraphScene(payload), [payload])
  const selectedEdges = useMemo(() => {
    if (!selected) return []
    return scene.edges.filter(
      (edge) => edge.source === selected.id || edge.target === selected.id,
    )
  }, [scene, selected])

  const loadGraph = useCallback(async (nextFocus = focusNode) => {
    if (!userId) {
      return
    }
    setLoading(true)
    setError('')
    try {
      const [graph, graphStats, graphHealth, graphEvents] = await Promise.all([
        fetchFormationSubgraph(String(userId), {
          focusNode: nextFocus,
          depth,
          maxNodes: 240,
        }, token),
        fetchFormationGraphStats(String(userId), token).catch(() => ({})),
        fetchFormationGraphHealth(String(userId), token).catch(() => ({})),
        fetchFormationGraphEvents(String(userId), token, 8).catch(() => ({ items: [] })),
      ])
      setPayload(graph)
      setStats(graphStats)
      setHealth(graphHealth)
      setEvents(graphEvents.items || [])
      setFocusNode(graph.focus_node || nextFocus || '')
      const nextScene = buildFormationGraphScene(graph)
      setSelected(nextScene.byId.get(graph.focus_node) || nextScene.nodes[0] || null)
    } catch (loadError) {
      setError(loadError.message || i18nT('形成图谱加载失败'))
    } finally {
      setLoading(false)
    }
  }, [depth, focusNode, token, userId])

  useEffect(() => {
    loadGraph('')
    // A depth/user/token change intentionally refreshes from the strongest node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth, userId, token])

  const selectNode = async (node) => {
    const previous = selected
    setSelected(node)
    if (!previous || previous.id === node.id) return
    const connectingEdge = scene.edges.find(
      (edge) => (
        (edge.source === previous.id && edge.target === node.id)
        || (edge.target === previous.id && edge.source === node.id)
      ),
    )
    if (connectingEdge) {
      recordFormationGraphInteraction(
        String(userId), connectingEdge.source, connectingEdge.target, 'click', token,
      ).catch(() => {})
    }
  }

  if (!userId) {
    return (
      <section style={styles.notice}>
        <h2>{i18nT('形成图谱')}</h2>
        <p>{i18nT('登录后可查看你的情绪、渴望、行为、结果与信念之间的历史连接。')}</p>
        <button style={styles.button} onClick={() => onNeedLogin?.()}>{i18nT('登录')}</button>
      </section>
    )
  }

  return (
    <section style={styles.shell} aria-label={i18nT('个人灵性形成关系图')}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>{i18nT('形成图谱')}</h2>
          <p style={styles.subtitle}>{i18nT('按需呈现焦点附近的关系；节点位置由后端预计算。')}</p>
        </div>
        <div style={styles.controls}>
          <label>
            {i18nT('关系深度')}
            <select value={depth} onChange={(event) => setDepth(Number(event.target.value))} style={styles.select}>
              <option value={1}>1-hop</option>
              <option value={2}>2-hop</option>
              <option value={3}>3-hop</option>
            </select>
          </label>
          <button style={styles.button} onClick={() => loadGraph(focusNode)} disabled={loading}>
            {loading ? i18nT('加载中…') : i18nT('刷新图谱')}
          </button>
        </div>
      </header>

      <div style={styles.badges}>
        <span>{i18nT('节点')} {stats.node_count ?? scene.nodes.length}</span>
        <span>{i18nT('关系')} {stats.edge_count ?? scene.edges.length}</span>
        <span>{i18nT('循环')} {stats.loop_count ?? 0}</span>
        <span>{i18nT('历史事件')} {stats.event_count ?? 0}</span>
        <span>{i18nT('坐标覆盖')} {Math.round(Number(stats.position_coverage || 0) * 100)}%</span>
        <span style={{ color: health.status === 'healthy' ? '#57d68d' : '#ffc766' }}>
          {i18nT('数据健康')} {health.status || 'unknown'}
        </span>
      </div>

      {error && <div role="alert" style={styles.error}>{error}</div>}
      {!loading && !error && scene.nodes.length === 0 && (
        <div style={styles.notice}>
          <p>{i18nT('还没有形成关系数据。完成一次心迹辨识后，这里会开始积累可追溯的关系。')}</p>
        </div>
      )}

      {scene.nodes.length > 0 && (
        <div className="formation-graph-layout" style={styles.layout}>
          <div className="formation-graph-canvas" style={styles.canvasWrap} data-testid="formation-graph-canvas">
            <Canvas camera={{ position: [0, 4, 16], fov: 52 }} dpr={[1, 1.5]}>
              <GraphScene scene={scene} selectedId={selected?.id} onSelect={selectNode} />
            </Canvas>
          </div>
          <aside style={styles.panel}>
            <div style={styles.selectedType}>{selected?.node_type || i18nT('节点')}</div>
            <h3 style={styles.selectedName}>{selected?.node_name || i18nT('请选择节点')}</h3>
            <button
              style={styles.button}
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                setFocusNode(selected.id)
                loadGraph(selected.id)
              }}
            >
              {i18nT('以此为焦点展开')}
            </button>
            <h4>{i18nT('直接关系')}</h4>
            <div style={styles.edgeList}>
              {selectedEdges.length === 0 && <span style={styles.muted}>{i18nT('当前子图内没有直接关系')}</span>}
              {selectedEdges.map((edge) => {
                const other = edge.source === selected?.id ? edge.targetNode : edge.sourceNode
                return (
                  <button key={edge.id} style={styles.edgeButton} onClick={() => selectNode(other)}>
                    <strong>{edge.edge_type}</strong>
                    <span>{other.node_name}</span>
                    <small>{i18nT('权重')} {Number(edge.weight || 1).toFixed(2)}</small>
                  </button>
                )
              })}
            </div>
            <p style={styles.disclaimer}>{i18nT('图谱展示可能的形成动态，不定义你的身份，也不替代祷告、经文与可信群体。')}</p>
            <h4>{i18nT('最近形成记录')}</h4>
            <div style={styles.edgeList}>
              {events.length === 0 && <span style={styles.muted}>{i18nT('暂无历史记录')}</span>}
              {events.slice(0, 5).map((event) => (
                <div key={event.event_id} style={styles.historyItem}>
                  <span>{[event.emotion, event.desire, event.behavior, event.outcome].filter(Boolean).join(' → ')}</span>
                  <small>{event.status} · {event.observed_at ? new Date(event.observed_at).toLocaleDateString() : ''}</small>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
      <style>{`
        @media (max-width: 760px) {
          .formation-graph-layout { grid-template-columns: minmax(0, 1fr) !important; }
          .formation-graph-canvas { min-height: 420px !important; }
        }
      `}</style>
    </section>
  )
}

const styles = {
  shell: { padding: '16px', color: '#eef3ff', background: '#0d1117', minHeight: '620px' },
  header: { display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  title: { margin: 0, fontSize: '22px' },
  subtitle: { margin: '6px 0 0', color: 'rgba(238,243,255,.62)', fontSize: '13px' },
  controls: { display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' },
  select: { marginLeft: '6px', padding: '7px', borderRadius: '8px', background: '#192131', color: '#fff', border: '1px solid #33415c' },
  button: { padding: '8px 12px', borderRadius: '9px', border: '1px solid rgba(87,214,141,.45)', background: 'rgba(87,214,141,.14)', color: '#80e2aa', cursor: 'pointer' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '14px 0' },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)', gap: '12px' },
  canvasWrap: { minHeight: '520px', borderRadius: '16px', overflow: 'hidden', background: 'radial-gradient(circle at 50% 45%, #1b2946 0%, #090d15 70%)', border: '1px solid rgba(255,255,255,.1)' },
  panel: { padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)' },
  selectedType: { color: '#80e2aa', fontSize: '11px', textTransform: 'uppercase' },
  selectedName: { margin: '6px 0 12px', overflowWrap: 'anywhere' },
  edgeList: { display: 'grid', gap: '7px', maxHeight: '310px', overflowY: 'auto' },
  edgeButton: { display: 'grid', gridTemplateColumns: '1fr', gap: '2px', textAlign: 'left', padding: '9px', borderRadius: '9px', border: '1px solid rgba(255,255,255,.08)', background: '#151c28', color: '#e7ecf8', cursor: 'pointer' },
  historyItem: { display: 'grid', gap: '3px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,.035)', color: '#dce5f7', fontSize: '11px', overflowWrap: 'anywhere' },
  muted: { color: 'rgba(255,255,255,.45)', fontSize: '12px' },
  disclaimer: { marginTop: '18px', fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,.45)' },
  error: { padding: '12px', borderRadius: '10px', background: 'rgba(255,92,92,.13)', color: '#ff9d9d' },
  notice: { margin: '18px', padding: '24px', borderRadius: '14px', background: 'rgba(255,255,255,.05)', color: '#e7ecf8' },
}
