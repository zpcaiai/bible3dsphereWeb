import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  addFormationChainEdge,
  addFormationChainNode,
  bulkDismissFormationReviews,
  createFormationChain,
  createFormationNode,
  deleteFormationChain,
  deleteFormationNode,
  duplicateFormationChain,
  getFormationContext,
  getFormationDataQuality,
  getFormationGraphStatus,
  getFormationSettings,
  getFormationState,
  listFormationChains,
  listFormationNodes,
  listFormationReviewQueue,
  removeFormationChainEdge,
  removeFormationChainNode,
  rebuildFormationState,
  reviewFormationNode,
  setFormationChainStatus,
  syncFormationChainGraph,
  updateFormationChain,
  updateFormationSettings,
} from './formationTwinApi'

const VIEWS = [
  ['current', '当前形成状态'],
  ['chains', '形成链条'],
  ['identity', '身份与信念'],
  ['desires', '渴望与担忧'],
  ['temptations', '试探与选择'],
  ['practices', '行为与结果'],
  ['grace', '恩典与恢复'],
  ['review', '待我审阅'],
  ['settings', '边界与接入'],
]

const NODE_LABELS = {
  LIFE_EVENT: '生命事件', INTERPRETATION: '当时的理解', IDENTITY_STATEMENT: '身份表达',
  BELIEF_STATEMENT: '信念表达', DESIRE: '渴望', FEAR: '担忧或害怕', EMOTION: '情绪',
  TEMPTATION: '试探处境', CHOICE: '选择', BEHAVIOR: '行为', SPIRITUAL_PRACTICE: '属灵操练',
  OUTCOME: '结果', GRACE_EVIDENCE: '恩典记号', PROTECTIVE_FACTOR: '保护因素',
  RECOVERY_RESPONSE: '恢复回应', FORMATION_DIRECTION: '可能的形成方向',
}
const SCOPE_LABELS = {
  THIS_EVENT_ONLY: '仅限这次事件', THIS_SEASON: '仅限当前阶段',
  RECURRING_CONTEXT: '在相似处境中可能重复', USER_DEFINED: '我定义的范围',
}
const SOURCE_LABELS = {
  USER_REPORT: '我主动记录', OBSERVATION: '事实观察', RULE: '规则关联',
  MODEL: '模型候选，待确认', USER_CONFIRMED: '我已确认',
}
const RELATION_LABELS = {
  PRECEDED: '先于', FOLLOWED_BY: '随后', USER_ASSOCIATED_WITH: '由我关联',
  USER_DESCRIBED_AS: '由我这样描述', OBSERVED_IN_SAME_EVENT: '记录于同一事件',
  POSSIBLY_ASSOCIATED_WITH: '可能相关，待审阅', USER_CONFIRMED_RELATION: '由我确认关联', ALTERNATIVE_TO: '另一种可能',
}
const GROUPS = {
  identity: ['IDENTITY_STATEMENT', 'BELIEF_STATEMENT', 'INTERPRETATION'],
  desires: ['DESIRE', 'FEAR'],
  temptations: ['TEMPTATION', 'CHOICE'],
  practices: ['BEHAVIOR', 'SPIRITUAL_PRACTICE', 'OUTCOME'],
  grace: ['GRACE_EVIDENCE', 'PROTECTIVE_FACTOR', 'RECOVERY_RESPONSE', 'FORMATION_DIRECTION'],
}
const PROMPTS = {
  IDENTITY_STATEMENT: '在这件事里，你怎样描述自己？', BELIEF_STATEMENT: '你当时明确相信或想到什么？',
  INTERPRETATION: '你当时怎样理解这件事？', DESIRE: '你当时最希望得到或守护什么？',
  FEAR: '你当时担心会发生什么？', TEMPTATION: '你愿意怎样描述当时的试探处境？',
  CHOICE: '你实际作了什么选择？', BEHAVIOR: '你实际做了什么？',
  SPIRITUAL_PRACTICE: '你主动进行了什么操练？', OUTCOME: '后来出现了什么可观察的结果？',
  GRACE_EVIDENCE: '这段经历中，你看见了什么恩典记号？', PROTECTIVE_FACTOR: '什么人或行动保护、支持了你？',
  RECOVERY_RESPONSE: '什么回应帮助你回到稳定或重新开始？', FORMATION_DIRECTION: '只按你自己的理解，这件事可能在塑造什么方向？',
}

function Notice({ error, message }) {
  if (error) return <div className="ft-workspace-error" role="alert">{error}</div>
  if (message) return <div className="ft-workspace-success" role="status">{message}</div>
  return null
}

function Empty({ children }) { return <div className="ft-workspace-empty">{children}</div> }

function SourceBadge({ kind }) {
  return <span className={`ft-formation-source ${String(kind || '').toLowerCase()}`}>{i18nT(SOURCE_LABELS[kind] || kind)}</span>
}

function NodeCard({ node, onDelete, compact = false }) {
  return (
    <article className={`ft-formation-node ${compact ? 'compact' : ''}`} data-source={node.source_kind}>
      <header><span>{i18nT(NODE_LABELS[node.node_type] || node.node_type)}</span><SourceBadge kind={node.source_kind} /></header>
      <p>{node.content}</p>
      <footer><span>{i18nT(SCOPE_LABELS[node.scope] || node.scope)}</span>{node.confidence !== null && node.confidence !== undefined && <span>{i18nT('候选置信度')} {Math.round(node.confidence * 100)}%</span>}{onDelete && node.source_kind === 'USER_REPORT' && <button type="button" onClick={() => onDelete(node.id)}>{i18nT('删除')}</button>}</footer>
      {node.alternatives?.length > 0 && <details><summary>{i18nT('其他可能解释')}</summary><ul>{node.alternatives.map((item) => <li key={item}>{item}</li>)}</ul></details>}
    </article>
  )
}

function CurrentView() {
  const [snapshot, setSnapshot] = useState(null)
  const [quality, setQuality] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    setError('')
    try {
      const [state, dataQuality] = await Promise.all([getFormationState('current'), getFormationDataQuality()])
      setSnapshot(state.snapshot); setQuality(dataQuality)
    } catch (caught) { setError(caught.message) }
  }, [])
  useEffect(() => { load() }, [load])
  const rebuild = async () => {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await rebuildFormationState()
      setMessage(result.status === 'DISABLED' ? i18nT('属灵形成引擎当前已关闭。') : i18nT(`已重建：${result.nodes_created || 0} 个可审阅节点，${result.chains_created || 0} 条链。`))
      await load()
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const sections = [
    ['我主动表达的', snapshot?.user_reported_items, 'user'],
    ['事实与规则关联', snapshot?.observed_relations, 'observed'],
    ['我已确认的模式', snapshot?.confirmed_patterns, 'confirmed'],
    ['等待我审阅的候选', snapshot?.pending_hypotheses, 'model'],
    ['恩典、保护与恢复', snapshot?.grace_and_recovery, 'grace'],
  ]
  return (
    <div className="ft-formation-view">
      <div className="ft-formation-head"><div><h3>{i18nT('当前形成状态')}</h3><p>{i18nT('只展示记录支持的内容；用户表达、观察、候选与确认结果彼此分开。')}</p></div><button type="button" onClick={rebuild} disabled={busy}>{busy ? i18nT('正在重建…') : i18nT('从授权事件重建')}</button></div>
      <Notice error={error} message={message} />
      {snapshot?.data_status === 'INSUFFICIENT_DATA' ? <Empty>{i18nT('当前没有可处理的授权事件。请在“生命事件”中把处理偏好设为允许分析，再重建。')}</Empty> : <>
        <div className="ft-formation-summary">
          <span>{i18nT('可用节点')} <b>{snapshot?.record_coverage?.active_nodes || 0}</b></span>
          <span>{i18nT('形成链')} <b>{snapshot?.record_coverage?.active_chains || 0}</b></span>
          <span className={quality?.quality_passed ? 'pass' : 'warn'}>{quality?.quality_passed ? i18nT('证据边界通过') : i18nT('需要检查证据边界')}</span>
        </div>
        {sections.map(([title, items, tone]) => <section className={`ft-formation-block ${tone}`} key={title}><h4>{i18nT(title)}</h4>{items?.length ? <div className="ft-formation-card-grid">{items.map((item) => <NodeCard key={item.id} node={item} compact />)}</div> : <p>{i18nT('暂无记录')}</p>}</section>)}
        {snapshot?.reflective_questions?.length > 0 && <section className="ft-formation-questions"><h4>{i18nT('可以由你思考的问题')}</h4>{snapshot.reflective_questions.map((item) => <p key={item}>“{item}”</p>)}</section>}
        <details className="ft-formation-limits"><summary>{i18nT('查看局限与边界')}</summary><ul>{snapshot?.limitations?.map((item) => <li key={item}>{item}</li>)}</ul></details>
      </>}
    </div>
  )
}

function NodeLibrary({ group }) {
  const nodeTypes = GROUPS[group]
  const [nodes, setNodes] = useState([])
  const [nodeType, setNodeType] = useState(nodeTypes[0])
  const [content, setContent] = useState('')
  const [scope, setScope] = useState('THIS_EVENT_ONLY')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    setError('')
    try {
      const batches = await Promise.all(nodeTypes.map((type) => listFormationNodes({ node_type: type })))
      setNodes(batches.flatMap((batch) => batch.items || []).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))))
    } catch (caught) { setError(caught.message) }
  }, [nodeTypes])
  useEffect(() => { setNodeType(nodeTypes[0]); load() }, [nodeTypes, load])
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await createFormationNode({ node_type: nodeType, content, scope }); setContent(''); setMessage(i18nT('已按你的原话保存；系统没有添加置信度或隐藏解释。')); await load() }
    catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const remove = async (id) => { try { await deleteFormationNode(id); await load() } catch (caught) { setError(caught.message) } }
  return (
    <div className="ft-formation-view">
      <div className="ft-formation-head"><div><h3>{i18nT(VIEWS.find(([key]) => key === group)?.[1] || '形成记录')}</h3><p>{i18nT('你可以主动记录；系统不会把一次经历自动定性为罪、偶像、隐藏动机或人格。')}</p></div></div>
      <form className="ft-formation-add" onSubmit={save}>
        <label>{i18nT('记录类型')}<select value={nodeType} onChange={(event) => setNodeType(event.target.value)}>{nodeTypes.map((type) => <option key={type} value={type}>{i18nT(NODE_LABELS[type])}</option>)}</select></label>
        <label className="wide">{i18nT(PROMPTS[nodeType])}<textarea required value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} /></label>
        <label>{i18nT('适用范围')}<select value={scope} onChange={(event) => setScope(event.target.value)}>{Object.entries(SCOPE_LABELS).map(([value, label]) => <option value={value} key={value}>{i18nT(label)}</option>)}</select></label>
        <button type="submit" disabled={busy || !content.trim()}>{busy ? i18nT('保存中…') : i18nT('按我的表达保存')}</button>
      </form>
      <Notice error={error} message={message} />
      {nodes.length ? <div className="ft-formation-card-grid">{nodes.map((node) => <NodeCard node={node} key={node.id} onDelete={remove} />)}</div> : <Empty>{i18nT('这里还没有记录。上面的引导问题只是邀请，不会自动生成结论。')}</Empty>}
    </div>
  )
}

function ChainsView() {
  const [chains, setChains] = useState([])
  const [nodes, setNodes] = useState([])
  const [selected, setSelected] = useState([])
  const [title, setTitle] = useState('')
  const [dragged, setDragged] = useState(null)
  const [addChoice, setAddChoice] = useState({})
  const [edgeDraft, setEdgeDraft] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { const [chainData, nodeData] = await Promise.all([listFormationChains(), listFormationNodes()]); setChains(chainData.items || []); setNodes(nodeData.items || []) }
    catch (caught) { setError(caught.message) }
  }, [])
  useEffect(() => { load() }, [load])
  const create = async (event) => {
    event.preventDefault()
    try { await createFormationChain({ title: title || '我整理的形成链', scope: 'THIS_EVENT_ONLY', node_ids: selected }); setSelected([]); setTitle(''); setMessage(i18nT('链条已保存；空缺环节保持空缺。')); await load() }
    catch (caught) { setError(caught.message) }
  }
  const action = async (id, name) => {
    try {
      if (name === 'delete') await deleteFormationChain(id)
      else if (name === 'duplicate') await duplicateFormationChain(id)
      else if (name === 'sync') await syncFormationChainGraph(id)
      else await setFormationChainStatus(id, name)
      await load()
    } catch (caught) { setError(caught.message) }
  }
  const reorder = async (chain, targetId) => {
    if (!dragged || dragged.chainId !== chain.id || dragged.nodeId === targetId) return
    const ids = chain.nodes.map((item) => item.id); const from = ids.indexOf(dragged.nodeId); const to = ids.indexOf(targetId)
    ids.splice(to, 0, ids.splice(from, 1)[0]); setDragged(null)
    try { await updateFormationChain(chain.id, { title: chain.title, scope: chain.scope, node_ids: ids }); await load() } catch (caught) { setError(caught.message) }
  }
  const addNode = async (chain) => {
    const nodeId = addChoice[chain.id]
    if (!nodeId) return
    try { await addFormationChainNode(chain.id, nodeId, chain.nodes.length); setAddChoice((values) => ({ ...values, [chain.id]: '' })); await load() } catch (caught) { setError(caught.message) }
  }
  const removeNode = async (chainId, nodeId) => { try { await removeFormationChainNode(chainId, nodeId); await load() } catch (caught) { setError(caught.message) } }
  const addEdge = async (chain) => {
    const draft = edgeDraft[chain.id] || {}
    const source = draft.source || chain.nodes[0]?.id; const target = draft.target || chain.nodes[1]?.id
    if (!source || !target || source === target) return
    try { await addFormationChainEdge(chain.id, { source_node_id: source, target_node_id: target, relation_type: draft.relation || 'USER_ASSOCIATED_WITH', sequence_order: chain.edges.length }); await load() } catch (caught) { setError(caught.message) }
  }
  const removeEdge = async (chainId, edgeId) => { try { await removeFormationChainEdge(chainId, edgeId); await load() } catch (caught) { setError(caught.message) } }
  return (
    <div className="ft-formation-view">
      <div className="ft-formation-head"><div><h3>{i18nT('形成链条')}</h3><p>{i18nT('事件 → 理解 → 身份或信念 → 渴望或担忧 → 情绪 → 选择 → 行为 → 结果。缺失的部分不会被补写。')}</p></div></div>
      <form className="ft-chain-builder" onSubmit={create}><label>{i18nT('链条标题')}<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={i18nT('例如：一次冲突后的回应')} /></label><fieldset><legend>{i18nT('选择你愿意关联的记录')}</legend><div>{nodes.slice(0, 30).map((node) => <label key={node.id}><input type="checkbox" checked={selected.includes(node.id)} onChange={() => setSelected((items) => items.includes(node.id) ? items.filter((id) => id !== node.id) : [...items, node.id])} /><span>{i18nT(NODE_LABELS[node.node_type])}</span>{node.content}</label>)}</div></fieldset><button type="submit" disabled={selected.length < 2}>{i18nT('建立可编辑链条')}</button></form>
      <Notice error={error} message={message} />
      {!chains.length ? <Empty>{i18nT('还没有形成链。你可以选择两条以上自己的记录来建立第一条。')}</Empty> : chains.map((chain) => {
        const available = nodes.filter((node) => !chain.nodes.some((item) => item.id === node.id))
        const draft = edgeDraft[chain.id] || {}
        return <article className="ft-formation-chain" key={chain.id}><header><div><h4>{chain.title || i18nT('未命名形成链')}</h4><p>{i18nT(chain.creation_method === 'RULE_ASSEMBLED' ? '系统只按同一事件建立的待审阅顺序' : '由我建立')} · {i18nT(SCOPE_LABELS[chain.scope])}</p></div><span>{chain.user_review_status}</span></header><div className="ft-chain-flow">{chain.nodes.map((node, index) => <div key={node.id} className="ft-chain-step"><div draggable onDragStart={() => setDragged({ chainId: chain.id, nodeId: node.id })} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(chain, node.id)}><small>{i18nT(NODE_LABELS[node.node_type])}</small><p>{node.content}</p><SourceBadge kind={node.source_kind} /><button type="button" onClick={() => removeNode(chain.id, node.id)}>{i18nT('从链中移除')}</button></div>{index < chain.nodes.length - 1 && <span aria-hidden="true">→</span>}</div>)}</div><p className="ft-chain-note">{i18nT('可拖动卡片调整你自己的链条顺序；顺序表示记录关联，不代表系统证明了因果。')}</p>{available.length > 0 && <div className="ft-chain-edit-row"><select aria-label={i18nT('选择要加入链条的记录')} value={addChoice[chain.id] || ''} onChange={(event) => setAddChoice((values) => ({ ...values, [chain.id]: event.target.value }))}><option value="">{i18nT('选择一条记录…')}</option>{available.map((node) => <option value={node.id} key={node.id}>{i18nT(NODE_LABELS[node.node_type])} · {node.content.slice(0, 40)}</option>)}</select><button type="button" onClick={() => addNode(chain)} disabled={!addChoice[chain.id]}>{i18nT('加入节点')}</button></div>}<section className="ft-chain-relations"><h5>{i18nT('链条关系')}</h5>{chain.edges.length ? chain.edges.map((edge) => <div key={edge.id}><span>{i18nT(RELATION_LABELS[edge.relation_type] || edge.relation_type)}</span><small>{edge.source_kind === 'RULE' ? i18nT('规则关系') : i18nT('我建立的关系')}</small><button type="button" onClick={() => removeEdge(chain.id, edge.id)}>{i18nT('删除关系')}</button></div>) : <p>{i18nT('当前没有关系；节点顺序本身不表示因果。')}</p>}{chain.nodes.length >= 2 && <div className="ft-chain-edge-form"><select aria-label={i18nT('关系起点')} value={draft.source || chain.nodes[0].id} onChange={(event) => setEdgeDraft((values) => ({ ...values, [chain.id]: { ...draft, source: event.target.value } }))}>{chain.nodes.map((node) => <option key={node.id} value={node.id}>{i18nT(NODE_LABELS[node.node_type])}</option>)}</select><select aria-label={i18nT('关系终点')} value={draft.target || chain.nodes[1].id} onChange={(event) => setEdgeDraft((values) => ({ ...values, [chain.id]: { ...draft, target: event.target.value } }))}>{chain.nodes.map((node) => <option key={node.id} value={node.id}>{i18nT(NODE_LABELS[node.node_type])}</option>)}</select><select aria-label={i18nT('关系类型')} value={draft.relation || 'USER_ASSOCIATED_WITH'} onChange={(event) => setEdgeDraft((values) => ({ ...values, [chain.id]: { ...draft, relation: event.target.value } }))}>{Object.entries(RELATION_LABELS).filter(([key]) => ['USER_ASSOCIATED_WITH', 'USER_DESCRIBED_AS', 'ALTERNATIVE_TO'].includes(key)).map(([key, label]) => <option key={key} value={key}>{i18nT(label)}</option>)}</select><button type="button" onClick={() => addEdge(chain)}>{i18nT('添加关系')}</button></div>}</section><footer><button type="button" onClick={() => action(chain.id, 'confirm')}>{i18nT('确认这条链')}</button><button type="button" onClick={() => action(chain.id, 'reject')}>{i18nT('拒绝')}</button><button type="button" onClick={() => action(chain.id, 'duplicate')}>{i18nT('复制为另一种可能')}</button>{chain.user_review_status === 'CONFIRMED' && <button type="button" onClick={() => action(chain.id, 'sync')}>{i18nT('同步可选关系图')}</button>}<button type="button" onClick={() => action(chain.id, 'delete')}>{i18nT('删除')}</button></footer></article>
      })}
    </div>
  )
}

function ReviewView() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState([])
  const [edits, setEdits] = useState({})
  const [error, setError] = useState('')
  const load = useCallback(async () => { try { setItems((await listFormationReviewQueue()).items || []) } catch (caught) { setError(caught.message) } }, [])
  useEffect(() => { load() }, [load])
  const act = async (item, action) => {
    try { await reviewFormationNode(item.id, action, { content: edits[item.id] || undefined, scope: item.scope }); await load() } catch (caught) { setError(caught.message) }
  }
  const dismissAll = async () => { try { await bulkDismissFormationReviews(selected); setSelected([]); await load() } catch (caught) { setError(caught.message) } }
  return <div className="ft-formation-view"><div className="ft-formation-head"><div><h3>{i18nT('待我审阅')}</h3><p>{i18nT('候选不是事实。你可以确认、修改后部分确认、拒绝或批量忽略；不操作也不会进入其他模块。')}</p></div>{selected.length > 0 && <button type="button" onClick={dismissAll}>{i18nT(`忽略所选 ${selected.length} 项`)}</button>}</div><Notice error={error} />{!items.length ? <Empty>{i18nT('当前没有待审阅候选。模型推断默认关闭。')}</Empty> : items.map((item) => <article className="ft-review-card" key={item.id}><label className="ft-review-select"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected((values) => values.includes(item.id) ? values.filter((id) => id !== item.id) : [...values, item.id])} />{i18nT('选择')}</label><NodeCard node={item} /><label>{i18nT('如果只部分符合，请先改成你认可的表达')}<textarea value={edits[item.id] || ''} onChange={(event) => setEdits((values) => ({ ...values, [item.id]: event.target.value }))} placeholder={item.content} /></label><div><button type="button" onClick={() => act(item, 'confirm')}>{i18nT('确认')}</button><button type="button" disabled={!edits[item.id]?.trim()} onClick={() => act(item, 'partially-confirm')}>{i18nT('修改后部分确认')}</button><button type="button" onClick={() => act(item, 'reject')}>{i18nT('拒绝')}</button><button type="button" onClick={() => act(item, 'dismiss')}>{i18nT('忽略')}</button></div></article>)}</div>
}

function SettingsView() {
  const [settings, setSettings] = useState(null)
  const [graph, setGraph] = useState(null)
  const [contexts, setContexts] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const load = useCallback(async () => { try { const [data, status] = await Promise.all([getFormationSettings(), getFormationGraphStatus()]); setSettings(data.settings); setGraph(status) } catch (caught) { setError(caught.message) } }, [])
  useEffect(() => { load() }, [load])
  const save = async () => { try { const data = await updateFormationSettings(settings); setSettings(data.settings); setMessage(i18nT('边界设置已保存。新接入不会自动触发祷告、习惯或注意力干预。')) } catch (caught) { setError(caught.message) } }
  const preview = async (target) => {
    try {
      const context = await getFormationContext(target)
      setContexts((current) => ({ ...current, [target]: context }))
    } catch (caught) { setError(caught.message) }
  }
  if (!settings) return <div className="ft-formation-view"><Notice error={error} /><p className="ft-muted">{i18nT('正在加载边界设置…')}</p></div>
  const toggles = [
    ['spiritual_engine_enabled', '启用属灵形成快照', '关闭后保留记录，但不再重建。'],
    ['formation_chain_enabled', '启用形成链条', '只连接同一事件中的已有节点，不补全缺失环节。'],
    ['belief_hypothesis_enabled', '允许模型提出待审阅候选', '默认关闭；必须同时选择已配置模型提供方。'],
    ['graph_enabled', '允许同步已确认链条到关系图', '默认关闭；图中只有 ID、类型、审阅状态和内容哈希。'],
    ['formation_context_consent', '允许形成模块读取白名单摘要', '不含全文或未确认的深层候选。'],
    ['prayer_context_consent', '允许祷告模块读取白名单摘要', '只含用户确认的祷告相关上下文。'],
    ['habit_context_consent', '允许习惯模块读取白名单摘要', '只含确认的操练与保护因素。'],
    ['attention_context_consent', '允许注意力模块读取白名单摘要', '只含确认且限定范围的上下文。'],
  ]
  return <div className="ft-formation-view"><div className="ft-formation-head"><div><h3>{i18nT('边界与模块接入')}</h3><p>{i18nT('每个出口单独授权；危机记录、全文和未确认假设不会进入接入摘要。')}</p></div></div><Notice error={error} message={message} /><div className="ft-settings-list">{toggles.map(([key, label, note]) => <label key={key}><input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.checked }))} /><span><strong>{i18nT(label)}</strong><small>{i18nT(note)}</small></span></label>)}</div>{settings.belief_hypothesis_enabled && <label className="ft-provider-policy">{i18nT('模型提供方策略')}<select value={settings.provider_policy} onChange={(event) => setSettings((current) => ({ ...current, provider_policy: event.target.value }))}><option value="DISABLED">{i18nT('禁用')}</option><option value="CONFIGURED_PROVIDER">{i18nT('使用系统已配置的提供方')}</option></select></label>}<button className="ft-submit" type="button" onClick={save}>{i18nT('保存边界设置')}</button><section className="ft-integration-status"><h4>{i18nT('可选关系图')}</h4><p>{i18nT('状态')}：{graph?.status || '—'} · {i18nT('核心功能不依赖 Neo4j')}</p></section><section className="ft-context-preview"><h4>{i18nT('检查各模块实际可见内容')}</h4>{['formation', 'prayer', 'habit', 'attention'].map((target) => <div key={target}><button type="button" onClick={() => preview(target)}>{i18nT(`预览 ${target} 摘要`)}</button>{contexts[target] && <pre>{JSON.stringify(contexts[target], null, 2)}</pre>}</div>)}</section></div>
}

export default function FormationTwinFormation() {
  const [view, setView] = useState('current')
  const content = useMemo(() => {
    if (view === 'current') return <CurrentView />
    if (view === 'chains') return <ChainsView />
    if (view === 'review') return <ReviewView />
    if (view === 'settings') return <SettingsView />
    return <NodeLibrary group={view} />
  }, [view])
  return <div className="ft-formation"><div className="ft-formation-tabs" role="tablist" aria-label={i18nT('属灵形成孪生视图')}>{VIEWS.map(([key, label]) => <button type="button" role="tab" aria-selected={view === key} key={key} onClick={() => setView(key)}>{i18nT(label)}</button>)}</div>{content}</div>
}
