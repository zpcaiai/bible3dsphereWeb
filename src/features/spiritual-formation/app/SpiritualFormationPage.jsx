import { useMemo, useState } from 'react'
import BackButton from '../../../BackButton'
import { sinPatternMap } from '../data/sinPatterns'
import { MODULE_DISCLAIMER } from '../lib/pastoralSafety'
import {
  DEFAULT_USER_ID,
  getActiveTransformationPlan,
  listDailyExamens,
  listGraceRecoveryEntries,
  listThoughtCaptiveEntries,
  listTransformationPlans,
  saveDailyExamen,
  saveGraceRecoveryEntry,
  saveThoughtCaptiveEntry,
  saveTransformationPlan,
  updateTransformationPlan,
} from '../lib/storage'
import DailySpiritualScanForm from '../components/DailySpiritualScanForm'
import FruitTree from '../components/FruitTree'
import GraceRecoveryFlow from '../components/GraceRecoveryFlow'
import NewCreationMap from '../components/NewCreationMap'
import ThoughtCaptiveFlow from '../components/ThoughtCaptiveFlow'
import TransformationPlanDashboard from '../components/TransformationPlanDashboard'
import WeeklyReviewPanel from '../components/WeeklyReviewPanel'
import './spiritual-formation.css'

const TABS = [
  ['home', '首页'],
  ['daily', '每日扫描'],
  ['thought', '思想俘虏'],
  ['recovery', '恩典恢复'],
  ['plans', '转化计划'],
  ['fruit', '圣灵果实'],
  ['weekly', '每周回顾'],
  ['map', '新造地图'],
]

function resolveUserId(user) {
  return String(user?.id || user?.userId || user?.email || DEFAULT_USER_ID)
}

export default function SpiritualFormationPage({ user, onBack }) {
  const userId = resolveUserId(user)
  const [tab, setTab] = useState('home')
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useMemo(() => ({
    dailyExamens: listDailyExamens(userId),
    thoughtEntries: listThoughtCaptiveEntries(userId),
    graceRecoveryEntries: listGraceRecoveryEntries(userId),
    plans: listTransformationPlans(userId),
    activePlan: getActiveTransformationPlan(userId),
  }), [userId, refreshKey])

  function refresh() {
    setRefreshKey((value) => value + 1)
  }

  function saveAndRefresh(fn, value) {
    fn(value)
    refresh()
  }

  return (
    <main className="sf-page">
      <header className="sf-header">
        <BackButton onClick={onBack} />
        <div>
          <h1>Sin Pattern to New Creation Transformation Engine</h1>
          <p>Bring the old patterns into the light. Return to Christ. Walk by the Spirit. Practice the new life.</p>
        </div>
      </header>

      <nav className="sf-tabs" aria-label="Spiritual formation sections">
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} type="button" onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === 'home' && (
        <section className="sf-home">
          <div className="sf-intro">
            <h2>Return to Christ, then walk in concrete obedience.</h2>
            <p>{MODULE_DISCLAIMER}</p>
          </div>
          <div className="sf-action-grid">
            {[
              ['daily', 'Start Daily Scan', 'Name emotion, trigger, lie, confession, and obedience.'],
              ['thought', 'Take a Thought Captive', 'Catch a thought and answer it with gospel truth.'],
              ['recovery', 'I Fell and Need Grace Recovery', 'Come into the light without hiding or despair.'],
              ['plans', 'Create Transformation Plan', 'Choose a 7-day, 30-day, 90-day, or 1-year plan.'],
              ['fruit', 'View Fruit Tree', 'See where you are asking the Spirit to form fruit.'],
              ['weekly', 'View Weekly Review', 'Summarize patterns, triggers, lies, fruits, and next practices.'],
            ].map(([id, title, copy]) => (
              <button className="sf-action" key={id} type="button" onClick={() => setTab(id)}>
                <strong>{title}</strong>
                <span>{copy}</span>
              </button>
            ))}
          </div>

          <div className="sf-home-grid">
            <article className="sf-card">
              <h3>Current active plan</h3>
              {data.activePlan ? (
                <>
                  <p><b>{data.activePlan.title}</b></p>
                  <p>{sinPatternMap[data.activePlan.primarySinPattern].name} · {data.activePlan.intensity}</p>
                  <button type="button" onClick={() => setTab('plans')}>Open plan</button>
                </>
              ) : <p className="sf-empty">No active plan yet. Create one when you are ready for a concrete rhythm.</p>}
            </article>
            <article className="sf-card">
              <h3>Recent Daily Examen</h3>
              {data.dailyExamens[0] ? (
                <>
                  <p>{new Date(data.dailyExamens[0].date).toLocaleDateString()} · {data.dailyExamens[0].strongestEmotion}</p>
                  <p>{data.dailyExamens[0].obedienceAction}</p>
                </>
              ) : <p className="sf-empty">No entries yet. Begin with a simple daily scan.</p>}
            </article>
          </div>
        </section>
      )}

      {tab === 'daily' && <DailySpiritualScanForm userId={userId} onSave={(entry) => saveAndRefresh(saveDailyExamen, entry)} />}
      {tab === 'thought' && <ThoughtCaptiveFlow userId={userId} onSave={(entry) => saveAndRefresh(saveThoughtCaptiveEntry, entry)} />}
      {tab === 'recovery' && <GraceRecoveryFlow userId={userId} onSave={(entry) => saveAndRefresh(saveGraceRecoveryEntry, entry)} />}
      {tab === 'plans' && <TransformationPlanDashboard userId={userId} plans={data.plans} onSave={(plan) => saveAndRefresh(saveTransformationPlan, plan)} onUpdate={(plan) => saveAndRefresh(updateTransformationPlan, plan)} />}
      {tab === 'fruit' && <FruitTree dailyExamens={data.dailyExamens} thoughtEntries={data.thoughtEntries} graceRecoveryEntries={data.graceRecoveryEntries} />}
      {tab === 'weekly' && <WeeklyReviewPanel userId={userId} dailyExamens={data.dailyExamens} thoughtEntries={data.thoughtEntries} graceRecoveryEntries={data.graceRecoveryEntries} />}
      {tab === 'map' && <NewCreationMap dailyExamens={data.dailyExamens} thoughtEntries={data.thoughtEntries} graceRecoveryEntries={data.graceRecoveryEntries} />}
    </main>
  )
}
