import { useMemo, useState } from 'react'
import { churchSeasons } from '../../data/sacramentCalendarSeed'
import { buildBaptismIdentityReflection, buildCommunionReflection, buildLordDayPreparation, buildSeasonCard, getCurrentChurchSeason } from '../../lib/sacramentCalendarEngine'
import { T } from '../../lib/localize'
import { YearWheel } from '../../../../components/charts'
import { formationExtApi } from '../../../../api'
import PlanExecutionPanel from '../../../../components/PlanExecutionPanel'
import '../../app/spiritual-formation.css'

const STORAGE_KEY = 'spiritualFormation.sacramentCalendar.prep'

const dayOfYear = (date) => Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 86400000)

// 种子数据里没有日期，只有节期本身；节期的起讫是 sacramentCalendarEngine 按复活节推算的。
// 所以这里不另写一套日期规则（那会和引擎悄悄分叉），而是把这一年逐日问一遍引擎，
// 把连续同节期的日子并成一段圆弧——引擎怎么判，轮盘就怎么画。
// 跨年的节期（圣诞期从 12/25 延到 1/5）会自然落成年头、年尾两段弧，而不是一条画错方向的长弧。
function buildSeasonArcs(year) {
  const arcs = []
  const end = new Date(year, 11, 31)
  let current = null
  for (let d = new Date(year, 0, 1); d <= end; d.setDate(d.getDate() + 1)) {
    const season = getCurrentChurchSeason(d)
    const day = Math.min(365, dayOfYear(d))
    if (!current || current.seasonKey !== season.key) {
      current = { key: `${season.key}-${day}`, seasonKey: season.key, label: season.displayNameZh, color: season.color, startDay: day, endDay: day }
      arcs.push(current)
    } else {
      current.endDay = day
    }
  }
  return arcs
}

export default function SacramentCalendarOrbit({ userId = 'local-user', token }) {
  const [tab, setTab] = useState('season')
  const [focusKey, setFocusKey] = useState('')
  const season = buildSeasonCard(new Date())
  const communion = buildCommunionReflection({})
  const baptism = buildBaptismIdentityReflection({})
  const lordDay = buildLordDayPreparation(new Date(), {})
  const today = new Date()
  const year = today.getFullYear()
  const arcs = useMemo(() => buildSeasonArcs(year), [year])

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
          {/* 教会年历是「年复一年地回来」，不是从一月排到十二月的清单。
              画成轮盘才看得见此刻站在福音故事的哪一段、离下一段还有多远。 */}
          <YearWheel
            title={T('教会年历轮盘', 'Church year wheel')}
            subtitle={T('指针是今天。整圈走完是一年——大斋、复活、五旬节年年回来，你不会永远停在同一段。', 'The hand is today. One full turn is one year: Lent, Easter and Pentecost come round again, so no season is where you stay.')}
            seasons={arcs}
            todayDay={Math.min(365, dayOfYear(today))}
            onSelect={(arc) => setFocusKey(arc.seasonKey)}
          />
          <article className="sf-card" style={{ borderColor: season.color }}>
            <h3>{season.displayNameZh}</h3>
            <p><b>福音主题：</b>{season.gospelTheme}</p>
            <div className="sf-chip-row">{season.scriptureRefs.map((ref) => <span className="sf-chip" key={ref}>{ref}</span>)}</div>
            <p className="sf-prayer">{season.prayer}</p>
            <p><b>个人操练：</b>{season.personalPractice}</p>
            <p><b>家庭/小组：</b>{season.familyOrGroupPractice}</p>
          </article>
          <PlanExecutionPanel userId={userId} planId={`church-season:${season.key}`} title="教会年历操练" actions={[{ id: 'personal', title: season.personalPractice, cadence: 'daily' }, { id: 'group', title: season.familyOrGroupPractice, cadence: 'weekly' }]} />
          <div className="sf-map-grid">{churchSeasons.map((item) => <div key={item.key} className={`sf-orbit-node ${item.key === (focusKey || season.key) ? 'high' : 'normal'}`}><strong>{item.displayNameZh}</strong><span>{item.gospelTheme}</span></div>)}</div>
        </>
      )}
      {tab === 'communion' && <><Reflection title={communion.title} items={[communion.grace, communion.unity, communion.reconciliation, communion.pastoralSupport, communion.traditionNote]} /><PlanExecutionPanel userId={userId} planId={`communion-reflection:${season.key}`} title="圣餐回应" actions={[communion.reconciliation, communion.pastoralSupport].filter(Boolean).map((title, index) => ({ id: `action-${index + 1}`, title, cadence: 'weekly' }))} /></>}
      {tab === 'baptism' && <><Reflection title={baptism.title} items={[...baptism.truths, baptism.todayQuestion, baptism.traditionNote]} /><PlanExecutionPanel userId={userId} planId={`baptism-identity:${season.key}`} title="洗礼身份回应" actions={[{ id: 'question', title: baptism.todayQuestion, cadence: 'daily' }]} /></>}
      {tab === 'lordday' && <article className="sf-card"><h3>{lordDay.title}</h3><p>{lordDay.season} · {lordDay.gospelTheme}</p><ul>{lordDay.steps.map((s) => <li key={s}>{s}</li>)}</ul><button className="sf-primary" type="button" onClick={savePrep}>保存主日预备</button><PlanExecutionPanel userId={userId} planId={`lord-day:${season.key}`} title="主日预备执行" actions={lordDay.steps.map((title, index) => ({ id: `step-${index + 1}`, title, cadence: 'weekly' }))} /></article>}
    </section>
  )
}

function Reflection({ title, items }) {
  return <article className="sf-card"><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>
}
