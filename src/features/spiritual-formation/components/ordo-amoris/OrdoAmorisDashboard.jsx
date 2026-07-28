import { useEffect, useMemo, useState } from 'react'
import { buildLoveOrderMap, createOrdoAmorisRecord, createReorderingPractice, ordoAmorisCategories, routeOrdoAmorisInput } from '../../lib/ordoAmorisEngine'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'
import PlanExecutionPanel from '../../../../components/PlanExecutionPanel'
import { ConcentricRings } from '../../../../components/charts'
import { T } from '../../lib/localize'

const STORAGE_KEY = 'spiritualFormation.ordoAmoris.records'

// 「爱的次序」问的是谁在心的中心，不是谁的分数高——所以用同心圆而不是排序条：
// 半径本身就是「离中心多远」，一眼看得出受造之物有没有挤到神前面。
// loveOrderNodes 的数组顺序就是本应用采用的应然次序（buildLoveOrderMap 的 order 即索引+1），
// 因此直接按该顺序由内而外传入；actual 用「压力」而不是自评，因为压力是引擎真的算出来的量。
const PRESSURE_WEIGHT = { high: 2, medium: 1, normal: 0 }

function buildLoveOrderRings(currentKeys, records) {
  const nodes = buildLoveOrderMap(currentKeys)
  const weights = nodes.map((node) => PRESSURE_WEIGHT[node.pressure] || 0)
  records.forEach((record) => {
    // 远端历史只回传 matches，本地历史带完整 loveOrderMap；两者都用同一套确定性映射还原。
    const map = (record.loveOrderMap || []).length ? record.loveOrderMap : buildLoveOrderMap(record.matches || [])
    map.forEach((node) => {
      const index = nodes.findIndex((item) => item.key === node.key)
      if (index >= 0) weights[index] += PRESSURE_WEIGHT[node.pressure] || 0
    })
  })
  const total = weights.reduce((sum, value) => sum + value, 0)
  if (!total) return []
  return nodes.map((node, index) => ({ label: T(node.labelZh, node.labelEn), actual: weights[index] / total }))
}

function readRecords(userId) {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]').filter((item) => item.userId === userId)
  } catch {
    return []
  }
}

function writeRecord(record) {
  if (typeof window === 'undefined') return []
  const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
  const next = [record, ...all.filter((item) => item.id !== record.id)].slice(0, 60)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next.filter((item) => item.userId === record.userId)
}

export default function OrdoAmorisDashboard({ userId = 'local-user', token }) {
  const [input, setInput] = useState('我最害怕失去控制，也很怕别人不认可我。')
  const [selected, setSelected] = useState(['control'])
  const [records, setRecords] = useState(() => readRecords(userId))
  useEffect(() => {
    if (!token) return
    formationExtApi.ordoHistory(token).then((r) => {
      if (r && Array.isArray(r.items)) {
        setRecords(r.items.map((it, i) => ({ id: `remote-${i}-${it.created_at}`, userId, date: String(it.created_at || '').slice(0, 10), matches: it.matches || [], route: it.route })))
      }
    }).catch((err) => { console.warn('[OrdoAmorisDashboard.jsx] ignored async error', err) })
  }, [token, userId])
  const result = useMemo(() => routeOrdoAmorisInput(input), [input])
  const keys = selected.length ? selected : result.matches.map((item) => item.key)
  const practice = createReorderingPractice(keys[0] || 'control', input)
  const orderRings = buildLoveOrderRings(keys, records)

  function toggle(key) {
    setSelected((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key])
  }

  function save() {
    const record = createOrdoAmorisRecord(userId, input, keys)
    setRecords(writeRecord(record))
    if (token) {
      formationExtApi.ordoRecord({ input_text: input, selected_keys: keys, matches: record.matches || [], response: record.response || {}, love_order_map: record.loveOrderMap || [], route: record.route }, token).catch((err) => { console.warn('[OrdoAmorisDashboard.jsx] ignored async error', err) })
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>爱之秩序星图</h2>
        <p>受造之物是好礼物，但不是救主。这不是身份判决，而是回到基督的邀请。</p>
      </div>
      <div className="sf-card sf-flow-card">
        <label>
          此刻我最害怕失去什么？
          <textarea value={input} onChange={(event) => setInput(event.target.value)} />
        </label>
        <div className="sf-chip-row">
          {ordoAmorisCategories.map((item) => (
            <button key={item.key} type="button" className={`sf-chip-btn ${keys.includes(item.key) ? 'active' : ''}`} onClick={() => toggle(item.key)}>
              {item.displayNameZh}
            </button>
          ))}
        </div>
      </div>

      {result.route === 'crisis_care' || result.route === 'pastoral_care' ? (
        <article className="sf-card"><h3>先照顾安全</h3><p>{result.safety.message}</p></article>
      ) : result.response && (
        <><div className="sf-home-grid">
          <article className="sf-card">
            <h3>{result.response.possibleLove}</h3>
            <p>{result.response.carefulLanguage}</p>
            <p><b>好渴望：</b>{result.response.goodDesire}</p>
            <p><b>虚假应许：</b>{result.response.falsePromise}</p>
          </article>
          <article className="sf-card">
            <h3>福音重排</h3>
            <p>{result.response.gospelTruth}</p>
            <div className="sf-chip-row">{result.response.scriptureRefs.map((ref) => <span className="sf-chip" key={ref}>{ref}</span>)}</div>
            <p className="sf-prayer">{result.response.prayerPrompt}</p>
          </article>
          <article className="sf-card">
            <h3>今日操练</h3>
            <p>{practice.practice}</p>
            <p className="sf-muted">{practice.prayerPrompt}</p>
            <button className="sf-primary" type="button" onClick={save}>保存今日重排</button>
          </article>
        </div><PlanExecutionPanel userId={userId} planId={`ordo-amoris:${keys[0] || 'general'}`} title="今日爱序重排操练" actions={[{ id: 'reordering-practice', title: practice.practice, cadence: 'daily' }]} /></>
      )}

      <article className="sf-card">
        <h3>星图压力点</h3>
        {orderRings.length ? (
          <ConcentricRings
            title={T('爱的次序：谁在中心', 'Ordo amoris: who is at the centre')}
            subtitle={T('由内而外是应然的次序；环的浓淡是这些记录里它实际占去的心力。被标 ⚠ 的环，说明它实际的位置和应然不一致。', 'Inner to outer is the order things ought to have; shading is the share of heart-weight actually measured. A ring marked with a warning sits out of its proper place.')}
            rings={orderRings}
          />
        ) : (
          <p className="sf-empty">{T('还没有测到任何压力点。先选一个此刻最沉重的对象，或保存一次重排，同心圆才会有话可说。', 'No pressure measured yet. Choose what feels heaviest right now, or save one reordering, before the rings can say anything.')}</p>
        )}
        <div className="sf-map-grid">
          {buildLoveOrderMap(keys).map((node) => (
            <div key={node.key} className={`sf-orbit-node ${node.pressure}`}>
              <strong>{node.labelZh}</strong>
              <span>{node.pressure === 'high' ? '需要重新排序' : node.pressure === 'medium' ? '正在学习信靠' : '可操练顺服'}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="sf-card">
        <h3>最近 7 次</h3>
        {records.slice(0, 7).length ? <ul>{records.slice(0, 7).map((record) => <li key={record.id}>{record.date} · {(record.matches || []).join(', ') || record.route}</li>)}</ul> : <p className="sf-empty">还没有保存记录。</p>}
      </article>
    </section>
  )
}
