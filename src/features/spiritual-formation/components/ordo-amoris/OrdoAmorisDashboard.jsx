import { useEffect, useMemo, useState } from 'react'
import { buildLoveOrderMap, createOrdoAmorisRecord, createReorderingPractice, ordoAmorisCategories, routeOrdoAmorisInput } from '../../lib/ordoAmorisEngine'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'
import PlanExecutionPanel from '../../../../components/PlanExecutionPanel'

const STORAGE_KEY = 'spiritualFormation.ordoAmoris.records'

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
