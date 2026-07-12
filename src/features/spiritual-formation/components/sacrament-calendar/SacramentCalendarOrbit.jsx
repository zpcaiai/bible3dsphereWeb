import { useState } from 'react'
import { churchSeasons } from '../../data/sacramentCalendarSeed'
import { buildBaptismIdentityReflection, buildCommunionReflection, buildLordDayPreparation, buildSeasonCard } from '../../lib/sacramentCalendarEngine'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'

const STORAGE_KEY = 'spiritualFormation.sacramentCalendar.prep'

export default function SacramentCalendarOrbit({ userId = 'local-user', token }) {
  const [tab, setTab] = useState('season')
  const season = buildSeasonCard(new Date())
  const communion = buildCommunionReflection({})
  const baptism = buildBaptismIdentityReflection({})
  const lordDay = buildLordDayPreparation(new Date(), {})

  function savePrep() {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, lordDay, savedAt: new Date().toISOString() }))
    if (token) formationExtApi.lordDaySave({ season_key: season.key, prep: lordDay }, token).catch((err) => { console.warn('[SacramentCalendarOrbit.jsx] ignored async error', err) })
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>圣礼与教会年历星轨</h2><p>个人灵修被带回基督身体、主日敬拜和福音故事。</p></div>
      <div className="sf-chip-row">
        {['season', 'communion', 'baptism', 'lordday'].map((key) => <button key={key} className={`sf-chip-btn ${tab === key ? 'active' : ''}`} type="button" onClick={() => setTab(key)}>{key}</button>)}
      </div>
      {tab === 'season' && (
        <>
          <article className="sf-card" style={{ borderColor: season.color }}>
            <h3>{season.displayNameZh}</h3>
            <p><b>福音主题：</b>{season.gospelTheme}</p>
            <div className="sf-chip-row">{season.scriptureRefs.map((ref) => <span className="sf-chip" key={ref}>{ref}</span>)}</div>
            <p className="sf-prayer">{season.prayer}</p>
            <p><b>个人操练：</b>{season.personalPractice}</p>
            <p><b>家庭/小组：</b>{season.familyOrGroupPractice}</p>
          </article>
          <div className="sf-map-grid">{churchSeasons.map((item) => <div key={item.key} className={`sf-orbit-node ${item.key === season.key ? 'high' : 'normal'}`}><strong>{item.displayNameZh}</strong><span>{item.gospelTheme}</span></div>)}</div>
        </>
      )}
      {tab === 'communion' && <Reflection title={communion.title} items={[communion.grace, communion.unity, communion.reconciliation, communion.pastoralSupport, communion.traditionNote]} />}
      {tab === 'baptism' && <Reflection title={baptism.title} items={[...baptism.truths, baptism.todayQuestion, baptism.traditionNote]} />}
      {tab === 'lordday' && <article className="sf-card"><h3>{lordDay.title}</h3><p>{lordDay.season} · {lordDay.gospelTheme}</p><ul>{lordDay.steps.map((s) => <li key={s}>{s}</li>)}</ul><button className="sf-primary" type="button" onClick={savePrep}>保存主日预备</button></article>}
    </section>
  )
}

function Reflection({ title, items }) {
  return <article className="sf-card"><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>
}
