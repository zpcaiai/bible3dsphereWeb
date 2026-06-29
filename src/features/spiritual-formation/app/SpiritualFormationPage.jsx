import { useEffect, useMemo, useState } from 'react'
import BackButton from '../../../BackButton'
import { sinPatternMap } from '../data/sinPatterns'
import { MODULE_DISCLAIMER } from '../lib/pastoralSafety'
import {
  createDailyExamenRemote,
  createGraceRecoveryRemote,
  createHolyLifeDayLogRemote,
  createThoughtCaptiveRemote,
  createTransformationPlanRemote,
  loadSpiritualFormationData,
  updateTransformationPlanRemote,
} from '../lib/apiStorage'
import {
  DEFAULT_USER_ID,
  getActiveTransformationPlan,
  listDailyExamens,
  listGraceRecoveryEntries,
  listHolyLifeDayLogs,
  listThoughtCaptiveEntries,
  listTransformationPlans,
  saveHolyLifeDayLog,
  saveDailyExamen,
  saveGraceRecoveryEntry,
  saveThoughtCaptiveEntry,
  saveTransformationPlan,
  updateTransformationPlan,
} from '../lib/storage'
import DailySpiritualScanForm from '../components/DailySpiritualScanForm'
import FruitTree from '../components/FruitTree'
import GraceRecoveryFlow from '../components/GraceRecoveryFlow'
import HolyLifeEngine from '../components/HolyLifeEngine'
import NewCreationMap from '../components/NewCreationMap'
import SinPatternLibrary from '../components/SinPatternLibrary'
import StrongholdPage from '../components/StrongholdPage'
import ThoughtCaptiveFlow from '../components/ThoughtCaptiveFlow'
import TransformationPlanDashboard from '../components/TransformationPlanDashboard'
import WeeklyReviewPanel from '../components/WeeklyReviewPanel'
import './spiritual-formation.css'

const TABS = [
  ['home', '首页'],
  ['library', '罪模式库'],
  ['stronghold', '自高之事'],
  ['holy-life', '圣洁生活'],
  ['daily', '每日扫描'],
  ['thought', '思想俘虏'],
  ['recovery', '恩典恢复'],
  ['plans', '转化计划'],
  ['fruit', '圣灵果实'],
  ['weekly', '每周回顾'],
  ['map', '新造地图'],
]

function todayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resolveUserId(user) {
  return String(user?.id || user?.userId || user?.email || DEFAULT_USER_ID)
}

export default function SpiritualFormationPage({ user, token, onBack, initialTab = 'home' }) {
  const userId = resolveUserId(user)
  const [tab, setTab] = useState(initialTab)
  const [refreshKey, setRefreshKey] = useState(0)
  const [remoteData, setRemoteData] = useState(null)
  const [syncState, setSyncState] = useState(token ? 'syncing' : 'local')
  const [syncError, setSyncError] = useState('')
  const localData = useMemo(() => ({
    dailyExamens: listDailyExamens(userId),
    thoughtEntries: listThoughtCaptiveEntries(userId),
    graceRecoveryEntries: listGraceRecoveryEntries(userId),
    holyLifeDayLogs: listHolyLifeDayLogs(userId),
    plans: listTransformationPlans(userId),
    activePlan: getActiveTransformationPlan(userId),
  }), [userId, refreshKey])
  const data = { ...localData, ...(remoteData || {}), holyLifeDayLogs: remoteData?.holyLifeDayLogs || localData.holyLifeDayLogs }

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setRemoteData(null)
      setSyncState('local')
      setSyncError('')
      return
    }
    setSyncState('syncing')
    loadSpiritualFormationData(token)
      .then((loaded) => {
        if (cancelled) return
        setRemoteData(loaded)
        setSyncState('synced')
        setSyncError('')
      })
      .catch((error) => {
        if (cancelled) return
        setRemoteData(null)
        setSyncState('local')
        setSyncError(error?.message || '后端暂不可用，已使用本地记录')
      })
    return () => { cancelled = true }
  }, [token, refreshKey])

  function refresh() {
    setRefreshKey((value) => value + 1)
  }

  async function reloadRemote() {
    if (!token) return
    const loaded = await loadSpiritualFormationData(token)
    setRemoteData(loaded)
    setSyncState('synced')
    setSyncError('')
  }

  async function saveAndRefresh(localFn, remoteFn, value) {
    localFn(value)
    refresh()
    if (!token || !remoteFn) return { __localOnly: true, dayLog: value }
    try {
      setSyncState('syncing')
      const saved = await remoteFn(value, token)
      await reloadRemote()
      return saved || value
    } catch (error) {
      setSyncState('local')
      setSyncError(error?.message || '后端保存失败，已保留本地记录')
      return { __localOnly: true, dayLog: value }
    }
  }

  return (
    <main className="sf-page">
      <header className="sf-header">
        <BackButton onClick={onBack} />
        <div>
          <h1>Sin Pattern to New Creation Transformation Engine</h1>
          <p>Bring the old patterns into the light. Return to Christ. Walk by the Spirit. Practice the new life.</p>
          <p className="sf-sync-state">
            {syncState === 'synced' ? '已同步到后端数据库' : syncState === 'syncing' ? '正在同步后端数据库…' : '本地记录模式'}
            {syncError ? ` · ${syncError}` : ''}
          </p>
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
              ['holy-life', 'Holy Life Engine', 'Practice consecration, purpose, presence, speech, charity, examen, and eternal perspective.'],
              ['thought', 'Take a Thought Captive', 'Catch a thought and answer it with gospel truth.'],
              ['recovery', 'I Fell and Need Grace Recovery', 'Come into the light without hiding or despair.'],
              ['plans', 'Create Transformation Plan', 'Choose a 7-day, 30-day, 90-day, or 1-year plan.'],
              ['fruit', 'View Fruit Tree', 'See where you are asking the Spirit to form fruit.'],
              ['stronghold', 'Examine a Stronghold (自高之事)', 'Browse the ontology or run a self-scan toward a gospel reframe.'],
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
            <article className="sf-card">
              <h3>Holy Life Today</h3>
              {data.holyLifeDayLogs?.[0] ? (
                <>
                  <p>{data.holyLifeDayLogs[0].date}</p>
                  <p>{data.holyLifeDayLogs[0].dailyReport || data.holyLifeDayLogs[0].tomorrowFormation || '今日圣洁生活操练已开始。'}</p>
                  <button type="button" onClick={() => setTab('holy-life')}>Open engine</button>
                </>
              ) : <p className="sf-empty">No holy life entry yet. Begin with morning consecration or one 30-second presence pause.</p>}
            </article>
          </div>
        </section>
      )}

      {tab === 'library' && <SinPatternLibrary />}
      {tab === 'stronghold' && <StrongholdPage userId={userId} token={token} />}
      {tab === 'holy-life' && <HolyLifeEngine userId={userId} initialTodayLog={data.holyLifeDayLogs?.find((entry) => entry.date === todayKey())} history={data.holyLifeDayLogs || []} summaryStats={data.holyLifeSummary} onSave={(entry) => saveAndRefresh(saveHolyLifeDayLog, createHolyLifeDayLogRemote, entry)} />}
      {tab === 'daily' && <DailySpiritualScanForm userId={userId} onSave={(entry) => saveAndRefresh(saveDailyExamen, createDailyExamenRemote, entry)} />}
      {tab === 'thought' && <ThoughtCaptiveFlow userId={userId} onSave={(entry) => saveAndRefresh(saveThoughtCaptiveEntry, createThoughtCaptiveRemote, entry)} />}
      {tab === 'recovery' && <GraceRecoveryFlow userId={userId} onSave={(entry) => saveAndRefresh(saveGraceRecoveryEntry, createGraceRecoveryRemote, entry)} />}
      {tab === 'plans' && <TransformationPlanDashboard userId={userId} plans={data.plans} onSave={(plan) => saveAndRefresh(saveTransformationPlan, createTransformationPlanRemote, plan)} onUpdate={(plan) => saveAndRefresh(updateTransformationPlan, updateTransformationPlanRemote, plan)} />}
      {tab === 'fruit' && <FruitTree dailyExamens={data.dailyExamens} thoughtEntries={data.thoughtEntries} graceRecoveryEntries={data.graceRecoveryEntries} />}
      {tab === 'weekly' && <WeeklyReviewPanel userId={userId} dailyExamens={data.dailyExamens} thoughtEntries={data.thoughtEntries} graceRecoveryEntries={data.graceRecoveryEntries} />}
      {tab === 'map' && <NewCreationMap dailyExamens={data.dailyExamens} thoughtEntries={data.thoughtEntries} graceRecoveryEntries={data.graceRecoveryEntries} />}
    </main>
  )
}
