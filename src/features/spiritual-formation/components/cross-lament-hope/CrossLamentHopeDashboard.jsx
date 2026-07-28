import { useEffect, useMemo, useState } from 'react'
import { buildLamentFrame, crossLamentHopeCategories } from '../../lib/crossLamentHopeEngine'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'
import PlanExecutionPanel from '../../../../components/PlanExecutionPanel'
import { MilestoneTrack } from '../../../../components/charts'
import { T } from '../../lib/localize'

const STORAGE_KEY = 'spiritualFormation.crossLamentHope.records'

// 哀歌的三段式（下降 → 转折 → 盼望）在这里只能画成旅程站点，不能画成 TrendLine：
// buildLamentFrame 返回的全是文字段落（heardPain / christNear / psalmPrayer / nextSmallStep…），
// 没有任何逐段的强度数值，画折线等于编数据。
// 站点顺序本身承载那条弧线：先允许下降（说出痛苦、允许哀歌），
// 中间是转折（基督亲近软弱、向神哀告），最后才是盼望（一个小忠心、真人支持）——
// 盼望排在最后，正是为了不让人跳过前面。
function buildLamentStops(frame) {
  return [
    { key: 'heard', label: T('说出痛苦', 'Name the pain'), note: frame.heardPain },
    { key: 'permission', label: T('允许哀歌', 'Lament allowed'), note: frame.permissionToLament },
    { key: 'christ', label: T('基督亲近软弱', 'Christ near in weakness'), note: `${frame.christNear}（${frame.scripture}）` },
    { key: 'psalm', label: T('向神哀告', 'Cry out to God'), note: frame.psalmPrayer },
    { key: 'step', label: T('今天一个小忠心', 'One small faithfulness today'), note: frame.nextSmallStep },
    { key: 'support', label: T('真人支持', 'Human support'), note: frame.supportPrompt },
  ]
}

function readRecords(userId) {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]').filter((item) => item.userId === userId) } catch { return [] }
}

export default function CrossLamentHopeDashboard({ userId = 'local-user', token }) {
  const [text, setText] = useState('我祷告很久没有回应，心里很疲惫。')
  const [category, setCategory] = useState('')
  const [intensity, setIntensity] = useState('moderate')
  const [records, setRecords] = useState(() => readRecords(userId))
  const [stopIndex, setStopIndex] = useState(0)
  useEffect(() => {
    if (!token) return
    formationExtApi.lamentHistory(token).then((r) => {
      if (r && Array.isArray(r.items)) setRecords(r.items.map((it, i) => ({ id: `remote-${i}-${it.created_at}`, userId, categoryKey: it.category_key, createdAt: String(it.created_at || '') })))
    }).catch((err) => { console.warn('[CrossLamentHopeDashboard.jsx] ignored async error', err) })
  }, [token, userId])
  const frame = useMemo(() => buildLamentFrame(text, category || null, { intensity, capacity: intensity === 'heavy' ? 'low' : 'normal' }), [text, category, intensity])

  function save() {
    if (typeof window === 'undefined' || frame.route !== 'cross_lament_hope') return
    let all = []
    try { all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') } catch { all = [] }
    const record = { id: frame.id, userId, text, categoryKey: frame.categoryKey, createdAt: new Date().toISOString() }
    const next = [record, ...all].slice(0, 60)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setRecords(next.filter((item) => item.userId === userId))
    if (token) formationExtApi.lamentSave({ category_key: frame.categoryKey, input_text: text, frame, route: frame.route }, token).catch((err) => { console.warn('[CrossLamentHopeDashboard.jsx] ignored async error', err) })
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>十架、哀歌与盼望</h2><p>痛苦可以被带到神面前，不需要先包装成正确答案。</p></div>
      <article className="sf-card sf-flow-card">
        <label>把痛苦诚实写下来<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
        <div className="sf-chip-row">
          {crossLamentHopeCategories.map((item) => <button key={item.key} type="button" className={`sf-chip-btn ${category === item.key ? 'active' : ''}`} onClick={() => setCategory(item.key)}>{item.displayNameZh}</button>)}
        </div>
        <label>强度<select value={intensity} onChange={(event) => setIntensity(event.target.value)}><option value="low">轻</option><option value="moderate">中</option><option value="heavy">重</option></select></label>
      </article>
      {frame.route === 'crisis_or_professional_support' ? (
        <article className="sf-card"><h3>先照顾安全</h3><p>{frame.safety.message}</p></article>
      ) : (
        <><div className="sf-home-grid">
          <article className="sf-card"><h3>我听见的痛苦</h3><p>{frame.heardPain}</p><p>{frame.permissionToLament}</p></article>
          <article className="sf-card"><h3>基督亲近软弱</h3><p>{frame.christNear}</p><span className="sf-chip">{frame.scripture}</span></article>
          <article className="sf-card"><h3>可以这样哀告</h3><p className="sf-prayer">{frame.psalmPrayer}</p></article>
          <article className="sf-card"><h3>不需要急着做</h3><ul>{frame.notToRush.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article className="sf-card"><h3>今天一个小行动</h3><p>{frame.nextSmallStep}</p><button className="sf-primary" type="button" onClick={save}>保存这次哀歌</button></article>
          <article className="sf-card"><h3>真人支持</h3><p>{frame.supportPrompt}</p></article>
        </div><article className="sf-card">
          <MilestoneTrack
            title={T('这次哀歌的形状：下降 → 转折 → 盼望', 'Shape of this lament: descent, turn, hope')}
            subtitle={T('六站全部取自本次生成的哀歌框架文本。点一站表示「我此刻在这里」——停在前面几站不是退步，哀歌本来就允许停留。', 'All six stops come from the lament frame generated above. Tap a stop to mark where you are now; staying early is not regression.')}
            stops={buildLamentStops(frame)}
            currentIndex={stopIndex}
            onSelect={(stop, index) => setStopIndex(index)}
          />
        </article><PlanExecutionPanel userId={userId} planId={`cross-lament:${frame.categoryKey}`} title="今日哀歌回应" actions={[{ id: 'small-step', title: frame.nextSmallStep, cadence: 'daily' }]} /></>
      )}
      <article className="sf-card"><h3>最近记录</h3>{records.slice(0, 7).length ? <ul>{records.slice(0, 7).map((r) => <li key={r.id}>{r.createdAt.slice(0, 10)} · {r.categoryKey}</li>)}</ul> : <p className="sf-empty">还没有保存记录。</p>}</article>
    </section>
  )
}
