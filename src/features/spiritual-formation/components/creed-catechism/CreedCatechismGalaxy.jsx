import { useEffect, useMemo, useState } from 'react'
import { catechismPathways } from '../../data/creedCatechismSeed'
import { buildDoctrineFormationConnection, getDailyCatechism, listCatechismItems, markCatechismComplete, readCatechismCompleted } from '../../lib/creedCatechismEngine'
import { todayKey } from '../../lib/scriptureFormationEngine'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'
import { t as i18nT } from '../../../../i18n/runtime'


export default function CreedCatechismGalaxy({ userId = 'local-user', token }) {
  const [pathway, setPathway] = useState('beginner')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState('')
  const [completed, setCompleted] = useState(() => readCatechismCompleted(userId))
  useEffect(() => {
    if (!token) return
    formationExtApi.creedState(token).then((r) => { if (r && Array.isArray(r.completed)) setCompleted(r.completed) }).catch(() => {})
  }, [token])
  const daily = useMemo(() => getDailyCatechism(todayKey(), pathway), [pathway])
  const items = useMemo(() => listCatechismItems({ pathway, query }), [pathway, query])
  const conn = buildDoctrineFormationConnection(daily)

  function done(key) {
    setCompleted(markCatechismComplete(userId, key))
    if (token) formationExtApi.creedComplete({ item_key: key, pathway }, token).catch(() => {})
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{i18nT("信经与教理问答星系")}</h2><p>{i18nT("问题 → 经文 → 教义 → 生命应用 → 操练 → 祷告。")}</p></div>
      <div className="sf-chip-row">
        {catechismPathways.map((item) => <button key={item.key} type="button" className={`sf-chip-btn ${pathway === item.key ? 'active' : ''}`} onClick={() => setPathway(item.key)}>{item.label}</button>)}
      </div>
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
      <label> {i18nT("搜索主题、问题或经文")} <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={i18nT("例如：教会、祷告、神是否爱我")} />
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
