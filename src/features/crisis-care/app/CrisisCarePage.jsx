import { useEffect, useMemo, useState } from 'react'
import { MODULE_DISCLAIMER } from '../data/crisisContent'
import { resolveRegion } from '../data/crisisResources'
import { crisisApi } from '../lib/api'
import {
  deleteGuardianLocal, loadGuardiansLocal, loadSafetyPlanLocal,
  saveSafetyPlanLocal, upsertGuardianLocal,
} from '../lib/storage'
import BreathingGuide from '../components/BreathingGuide'
import GroundingExercise from '../components/GroundingExercise'
import CrisisIntakeFlow from '../components/CrisisIntakeFlow'
import CrisisResourcePanel from '../components/CrisisResourcePanel'
import SafetyPlanEditor from '../components/SafetyPlanEditor'
import GuardianNetworkManager from '../components/GuardianNetworkManager'
import SpiritualComfortCard from '../components/SpiritualComfortCard'
import AddictionDelayFlow from '../components/AddictionDelayFlow'
import TraumaGroundingFlow from '../components/TraumaGroundingFlow'
import PostCrisisTimeline from '../components/PostCrisisTimeline'
import EmergencyEscalationPanel from '../components/EmergencyEscalationPanel'
import CollaborationConsole from '../components/CollaborationConsole'
import '../app/crisis-care.css'

const TABS = [
  ['entry', '撑不住了'],
  ['stabilize', '稳一稳'],
  ['resources', '求助热线'],
  ['safetyplan', '安全计划'],
  ['guardians', '守护人'],
  ['comfort', '属灵安慰'],
  ['addiction', '成瘾冲动'],
  ['trauma', '创伤稳定'],
  ['recovery', '危机后'],
  ['collab', '协作'],
]

function detectRegion() {
  if (typeof navigator !== 'undefined') return resolveRegion(navigator.language || 'zh-TW')
  return 'TW'
}

export default function CrisisCarePage({ user, token, initialTab = 'entry', onOpenLibrary }) {
  const authed = !!token
  const userId = String(user?.id || user?.userId || user?.email || 'local-user')
  const [tab, setTab] = useState(initialTab)
  const [regionCode] = useState(detectRegion)
  const [plan, setPlan] = useState(null)
  const [guardians, setGuardians] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [emergency, setEmergency] = useState(null)
  const [notifyMsg, setNotifyMsg] = useState('')

  // local-first load
  useEffect(() => {
    setPlan(loadSafetyPlanLocal())
    setGuardians(loadGuardiansLocal())
  }, [])

  // remote sync when authenticated (best-effort; local stays usable on failure)
  useEffect(() => {
    if (!authed) return undefined
    let cancelled = false
    Promise.allSettled([crisisApi.getSafetyPlan(), crisisApi.listGuardians()]).then(([p, g]) => {
      if (cancelled) return
      if (p.status === 'fulfilled' && p.value?.plan) { setPlan(p.value.plan); saveSafetyPlanLocal(p.value.plan) }
      if (g.status === 'fulfilled' && Array.isArray(g.value?.items) && g.value.items.length) setGuardians(g.value.items)
    })
    return () => { cancelled = true }
  }, [authed])

  const canNotify = useMemo(() => guardians.some((x) => x.consentEnabled), [guardians])

  async function handleSavePlan(next) {
    saveSafetyPlanLocal(next)
    setPlan(next)
    if (!authed) return
    setSyncing(true)
    try {
      const res = await crisisApi.saveSafetyPlan(next)
      if (res?.plan) { setPlan(res.plan); saveSafetyPlanLocal(res.plan) }
    } catch { /* keep local */ } finally { setSyncing(false) }
  }

  async function handleAddGuardian(g) {
    const next = upsertGuardianLocal(g)
    setGuardians(next)
    if (!authed) return
    try {
      const res = await crisisApi.addGuardian(g)
      if (res?.guardian) { const reloaded = await crisisApi.listGuardians(); setGuardians(reloaded.items || next) }
    } catch { /* keep local */ }
  }

  async function handleDeleteGuardian(id) {
    setGuardians(deleteGuardianLocal(id))
    if (!authed || String(id).startsWith('local-')) return
    try { await crisisApi.deleteGuardian(id) } catch { /* keep local */ }
  }

  async function handleNotifyGuardians() {
    if (!authed) { setNotifyMsg('请先登录并添加已授权的守护人。'); setTab('guardians'); return }
    try {
      const res = await crisisApi.escalate('red', regionCode, true)
      setEmergency(res?.emergency || null)
      const n = res?.guardiansNotified || []
      if (!n.length) {
        setNotifyMsg('你还没有已授权的守护人。先去添加并勾选授权，或直接拨打热线。')
        setTab('guardians')
      } else if (res?.anyDelivered) {
        setNotifyMsg(`已通过短信提醒 ${n.length} 位守护人。`)
        setTab('guardians')
      } else if (res?.channelConfigured === false) {
        setNotifyMsg(`已记录提醒 ${n.length} 位守护人（短信通道未配置）。请直接拨打热线或自行联系。`)
        setTab('guardians')
      } else {
        setNotifyMsg(`已尝试提醒 ${n.length} 位守护人，但发送未成功。请直接联系或拨打热线。`)
        setTab('guardians')
      }
    } catch {
      setNotifyMsg('提醒发送失败，请直接拨打热线或自行联系守护人。')
      setTab('guardians')
    }
  }

  return (
    <main className="cc-page">
      <p className="cc-disclaimer">{MODULE_DISCLAIMER}</p>

      <nav className="cc-tabs" aria-label="危机守护">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === 'entry' && (
        <CrisisIntakeFlow regionCode={regionCode} onNavigate={setTab} canNotify={canNotify} onNotifyGuardians={handleNotifyGuardians} />
      )}

      {tab === 'stabilize' && (
        <>
          <div className="cc-card"><h3>跟我一起呼吸</h3><BreathingGuide targetCycles={5} /></div>
          <div className="cc-card"><h3>5-4-3-2-1 着陆</h3><GroundingExercise /></div>
        </>
      )}

      {tab === 'resources' && (
        <div className="cc-card"><h3>危机热线与紧急资源</h3><CrisisResourcePanel defaultRegion={regionCode} /></div>
      )}

      {tab === 'safetyplan' && (
        <SafetyPlanEditor plan={plan} regionCode={regionCode} onSave={handleSavePlan} syncing={syncing} />
      )}

      {tab === 'guardians' && (
        <>
          {emergency && <EmergencyEscalationPanel emergency={emergency} regionCode={regionCode} />}
          {notifyMsg && <p className="cc-toast" style={{ padding: '0 4px' }}>{notifyMsg}</p>}
          <GuardianNetworkManager guardians={guardians} onAdd={handleAddGuardian} onDelete={handleDeleteGuardian} />
          {!authed && <p className="cc-muted" style={{ padding: '0 4px' }}>未登录时，守护人只保存在本机。登录后会安全地同步。</p>}
        </>
      )}

      {tab === 'comfort' && <SpiritualComfortCard />}
      {tab === 'addiction' && <AddictionDelayFlow />}
      {tab === 'trauma' && <TraumaGroundingFlow />}
      {tab === 'recovery' && <PostCrisisTimeline userId={userId} token={token} onOpenLibrary={onOpenLibrary} />}
      {tab === 'collab' && <CollaborationConsole authed={authed} />}
    </main>
  )
}
