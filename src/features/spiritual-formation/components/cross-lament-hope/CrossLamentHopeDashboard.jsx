import { useEffect, useMemo, useState } from 'react'
import { buildLamentFrame, crossLamentHopeCategories } from '../../lib/crossLamentHopeEngine'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'

const STORAGE_KEY = 'spiritualFormation.crossLamentHope.records'

function readRecords(userId) {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]').filter((item) => item.userId === userId) } catch { return [] }
}

export default function CrossLamentHopeDashboard({ userId = 'local-user', token }) {
  const [text, setText] = useState('我祷告很久没有回应，心里很疲惫。')
  const [category, setCategory] = useState('')
  const [intensity, setIntensity] = useState('moderate')
  const [records, setRecords] = useState(() => readRecords(userId))
  useEffect(() => {
    if (!token) return
    formationExtApi.lamentHistory(token).then((r) => {
      if (r && Array.isArray(r.items)) setRecords(r.items.map((it, i) => ({ id: `remote-${i}-${it.created_at}`, userId, categoryKey: it.category_key, createdAt: String(it.created_at || '') })))
    }).catch(() => {})
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
    if (token) formationExtApi.lamentSave({ category_key: frame.categoryKey, input_text: text, frame, route: frame.route }, token).catch(() => {})
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
        <div className="sf-home-grid">
          <article className="sf-card"><h3>我听见的痛苦</h3><p>{frame.heardPain}</p><p>{frame.permissionToLament}</p></article>
          <article className="sf-card"><h3>基督亲近软弱</h3><p>{frame.christNear}</p><span className="sf-chip">{frame.scripture}</span></article>
          <article className="sf-card"><h3>可以这样哀告</h3><p className="sf-prayer">{frame.psalmPrayer}</p></article>
          <article className="sf-card"><h3>不需要急着做</h3><ul>{frame.notToRush.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article className="sf-card"><h3>今天一个小行动</h3><p>{frame.nextSmallStep}</p><button className="sf-primary" type="button" onClick={save}>保存这次哀歌</button></article>
          <article className="sf-card"><h3>真人支持</h3><p>{frame.supportPrompt}</p></article>
        </div>
      )}
      <article className="sf-card"><h3>最近记录</h3>{records.slice(0, 7).length ? <ul>{records.slice(0, 7).map((r) => <li key={r.id}>{r.createdAt.slice(0, 10)} · {r.categoryKey}</li>)}</ul> : <p className="sf-empty">还没有保存记录。</p>}</article>
    </section>
  )
}
