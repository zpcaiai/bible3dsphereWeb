import { useEffect, useMemo, useState } from 'react'
import { catechismPathways } from '../../data/creedCatechismSeed'
import { buildDoctrineFormationConnection, getDailyCatechism, listCatechismItems, markCatechismComplete, readCatechismCompleted } from '../../lib/creedCatechismEngine'
import { todayKey } from '../../lib/scriptureFormationEngine'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'
import { t as i18nT } from '../../../../i18n/runtime'
import { DirectedGraph } from '../../../../components/charts'
import { T } from '../../lib/localize'


// 「星系」在这里只能是关系图，不能是散点：creedCatechismSeed 里没有任何教义之间的显式依赖字段
// （每条只有 category / creedRefs / pathwayTags），所以不臆造「A 教义依赖 B 教义」这种神学推导，
// 只画数据里真实存在的归属关系：主题(category) → 该主题下的问答条目。
// 用有向图而不是列表，是因为分层布局能把同一主题的条目收在同一列，
// 一眼看出这条学习路径压在哪几个主题上、哪些主题只有一条问答。
function buildCatechismGraph(items, completed) {
  const categories = []
  items.forEach((item) => { if (!categories.includes(item.category)) categories.push(item.category) })
  const nodes = [
    ...categories.map((category) => ({
      id: `category:${category}`,
      label: category,
      kind: 'belief',
      note: `${items.filter((item) => item.category === category).length} ${T('条问答', 'item(s)')}`,
    })),
    ...items.map((item) => ({
      id: item.key,
      // 完成态用 grace 色位，并同时在标签上加 ✓，不单靠颜色表意
      kind: completed.includes(item.key) ? 'grace' : 'default',
      label: `${completed.includes(item.key) ? '✓ ' : ''}${item.question}`,
      note: item.shortAnswer,
    })),
  ]
  const edges = items.map((item) => ({ from: `category:${item.category}`, to: item.key }))
  return { nodes, edges }
}


export default function CreedCatechismGalaxy({ userId = 'local-user', token }) {
  const [pathway, setPathway] = useState('beginner')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState('')
  const [completed, setCompleted] = useState(() => readCatechismCompleted(userId))
  useEffect(() => {
    if (!token) return
    formationExtApi.creedState(token).then((r) => { if (r && Array.isArray(r.completed)) setCompleted(r.completed) }).catch((err) => { console.warn('[CreedCatechismGalaxy.jsx] ignored async error', err) })
  }, [token])
  const daily = useMemo(() => getDailyCatechism(todayKey(), pathway), [pathway])
  const items = useMemo(() => listCatechismItems({ pathway, query }), [pathway, query])
  const pathwayItems = useMemo(() => listCatechismItems({ pathway }), [pathway])
  const completedCount = pathwayItems.filter((item) => completed.includes(item.key)).length
  const conn = buildDoctrineFormationConnection(daily)
  const graph = useMemo(() => buildCatechismGraph(pathwayItems, completed), [pathwayItems, completed])

  function done(key) {
    setCompleted(markCatechismComplete(userId, key))
    if (token) formationExtApi.creedComplete({ item_key: key, pathway }, token).catch((err) => { console.warn('[CreedCatechismGalaxy.jsx] ignored async error', err) })
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{i18nT("信经与教理问答星系")}</h2><p>{i18nT("问题 → 经文 → 教义 → 生命应用 → 操练 → 祷告。")}</p></div>
      <div className="sf-chip-row">
        {catechismPathways.map((item) => <button key={item.key} type="button" className={`sf-chip-btn ${pathway === item.key ? 'active' : ''}`} onClick={() => setPathway(item.key)}>{item.label}</button>)}
      </div>
      <div className="sf-card" style={{ padding: 12 }}>
        <div className="sf-card-head"><b>{i18nT('当前路径进度')}</b><span>{completedCount}/{pathwayItems.length}</span></div>
        <div style={{ height: 6, overflow: 'hidden', borderRadius: 99, background: 'rgba(255,255,255,.08)' }}><div style={{ width: `${pathwayItems.length ? Math.round((completedCount / pathwayItems.length) * 100) : 0}%`, height: '100%', background: '#34c759' }} /></div>
      </div>
      <article className="sf-card">
        {graph.nodes.length ? (
          <DirectedGraph
            title={T('本路径的教义星系', 'Doctrine galaxy for this pathway')}
            subtitle={T(
              `这条路径共 ${pathwayItems.length} 条问答、覆盖 ${graph.nodes.length - pathwayItems.length} 个主题，已学 ${completedCount} 条。连线只表示「主题 → 问答」的归属，不代表教义之间的推导或依赖。`,
              `This pathway holds ${pathwayItems.length} items across ${graph.nodes.length - pathwayItems.length} topics; ${completedCount} learned. Edges only mean "topic contains item", never doctrinal dependency.`,
            )}
            nodes={graph.nodes}
            edges={graph.edges}
            onSelect={(node) => setOpen(node.id.startsWith('category:') ? '' : node.id)}
          />
        ) : (
          <p className="sf-empty">{T('这条路径下还没有问答条目。', 'No catechism items on this pathway yet.')}</p>
        )}
      </article>
      <article className="sf-card sf-flow-card">
        <div className="sf-card-head"><div><h3>{i18nT("今日一问")}</h3><p>{daily.category}</p></div><span className="sf-status">{completed.includes(daily.key) ? i18nT('已完成') : i18nT('今日')}</span></div>
        <h4>{daily.question}</h4>
        <p>{daily.shortAnswer}</p>
        <div className="sf-chip-row">{daily.scriptureRefs.map((ref) => <span className="sf-chip" key={ref}>{ref}</span>)}</div>
        <p><b>{i18nT("这如何塑造我：")}</b>{conn.formationConnection}</p>
        <p><b>{i18nT("今日操练：")}</b>{conn.practice}</p>
        <p className="sf-prayer">{conn.prayer}</p>
        {conn.caution && <p className="sf-warning">{conn.caution}</p>}
        <button className="sf-primary" type="button" onClick={() => done(daily.key)}>{i18nT("标记完成")}</button>
      </article>
      <label> {i18nT("搜索主题、问题或经文")} <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={i18nT("例如：教会、祷告、神是否爱我")}  aria-label={i18nT("例如：教会、祷告、神是否爱我")}/>
      </label>
      <div className="sf-home-grid">
        {items.map((item) => (
          <article className="sf-card" key={item.key}>
            <button className="sf-card-button" type="button" onClick={() => setOpen(open === item.key ? '' : item.key)}>
              <span><b>{item.question}</b><small>{item.category} · {item.creedRefs.join(', ')}</small></span>
              <span>{completed.includes(item.key) ? '✓' : '›'}</span>
            </button>
            {open === item.key && (
              <>
                <p>{item.expandedAnswer}</p>
                <p><b>{i18nT("操练：")}</b>{item.practice}</p>
                <p className="sf-muted">{item.commonMisunderstandings[0]}</p>
                <button type="button" onClick={() => done(item.key)}>{i18nT("标记学过")}</button>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
