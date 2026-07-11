import { useEffect, useMemo, useState } from 'react'
import {
  acknowledgeMissionBridgePolicy, enrollMissionBridgeProgram, exitMissionBridgeProgram,
  fetchMissionBridgeDashboard, fetchMissionBridgeIncidents, fetchMissionBridgePolicy,
  fetchMissionBridgeConsents, reportMissionBridgeIncident, requestMissionBridgeDeletion,
  requestMissionBridgeExport, resolveMissionBridgeIncident, submitMissionBridgeCheckin,
  updateMissionBridgeConsent, updateMissionBridgeDetailedConsent, fetchMissionBridgeProposals,
  createMissionBridgeProposal, fetchMissionBridgeDiscoveryReport,
  pauseMissionBridgeProgram, resumeMissionBridgeProgram,
  fetchMissionBridgeJourney, createMissionBridgeGoal, confirmMissionBridgeGoal, completeMissionBridgeAction,
} from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import './missionBridge.css'
import './missionBridgeDiscovery.css'
import ProgramDesigner from './ProgramDesigner'
import './journey.css'
import TrainingConsole from './TrainingConsole'
import ContentLibrary from './ContentLibrary'
import AgentWorkbench from './AgentWorkbench'
import LocalLeaderWorkspace from './LocalLeaderWorkspace'
import AttentionPilotWorkspace from './AttentionPilotWorkspace'
import AiFaithWorkspace from './AiFaithWorkspace'
import MobileWorkerWorkspace from './MobileWorkerWorkspace'
import NightShiftWorkspace from './NightShiftWorkspace'
import MobileFamilyWorkspace from './MobileFamilyWorkspace'
import SpecializedSupportWorkspace from './SpecializedSupportWorkspace'
import OperationsConsole from './OperationsConsole'
import MissionOrganizationConsole from '../../features/mission-os/components/MissionOrganizationConsole'

const PROGRAM_META = {
  'local-leader-90': { icon: '🧭', duration: '90 天', accent: '#5ac8fa' },
  'attention-reset-30': { icon: '🌿', duration: '30 天', accent: '#34c759' },
  'ai-faith-dialogue-8': { icon: '💡', duration: '8 次讨论', accent: '#ffb347' },
}

export default function MissionBridgePanel({ token, organizationId }) {
  const [data, setData] = useState(null)
  const [policy, setPolicy] = useState(null)
  const [adminIncidents, setAdminIncidents] = useState(null)
  const [privacyConsents, setPrivacyConsents] = useState([])
  const [proposals, setProposals] = useState(null)
  const [discoveryReport, setDiscoveryReport] = useState(null)
  const [proposal, setProposal] = useState({ title:'',groupDescription:'',needClaimedBy:'',communitySelfDescription:'',existingResources:[],entryChannels:[],potentialRisks:[],capabilityGaps:[] })
  const [journey,setJourney]=useState({goals:[],carePlans:[],strengths:[]})
  const [newGoal,setNewGoal]=useState({title:'',successDescription:''})
  const [view, setView] = useState('programs')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [goal, setGoal] = useState({})
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [checkin, setCheckin] = useState({ wellbeing: 3, reflection: '', needsSupport: false })
  const [incident, setIncident] = useState({ riskLevel: 'L1', category: '需要关怀', summary: '', immediateDanger: false, locationScope: 'undisclosed' })

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [dashboard, policyData] = await Promise.all([fetchMissionBridgeDashboard(token), fetchMissionBridgePolicy(token)])
      setData(dashboard); setPolicy(policyData)
      fetchMissionBridgeIncidents(token).then((result) => setAdminIncidents(result.items)).catch(() => setAdminIncidents(null))
      fetchMissionBridgeConsents(token).then((result) => setPrivacyConsents(result.items)).catch(() => setPrivacyConsents([]))
      fetchMissionBridgeProposals(token).then((result) => setProposals(result.items)).catch(() => setProposals(null))
      fetchMissionBridgeJourney(token).then(setJourney).catch(()=>setJourney({goals:[],carePlans:[],strengths:[]}))
    }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const active = useMemo(() => (data?.enrollments || []).filter((item) => item.status === 'active'), [data])
  const consent = Boolean(data?.consents?.program_participation?.granted)

  const run = async (key, action, success) => {
    setBusy(key); setError(''); setNotice('')
    try { await action(); setNotice(success); await load() }
    catch (err) { setError(err.message) }
    finally { setBusy('') }
  }

  if (loading && !data) return <section className="mb-shell"><div className="mb-state">{t('正在加载邻舍之桥…')}</div></section>

  return (
    <section className="mb-shell" aria-label={t('MissionBridge 邻舍之桥')}>
      <header className="mb-hero">
        <div><span className="mb-kicker">MISSIONBRIDGE</span><h2>{t('邻舍之桥')}</h2><p>{t('从真实需要出发，以自愿、尊重和专业边界连接关怀、信仰探索与本地带领者成长。')}</p></div>
        <span className="mb-safety">🛡 {t('安全优先')}</span>
      </header>

      <div className="mb-principles">
        <span>✓ {t('关怀不以宗教参与为条件')}</span><span>✓ {t('随时退出且不受惩罚')}</span><span>✓ {t('高风险事件由真人接管')}</span>
      </div>

      {policy && !policy.acknowledged && <div className="mb-policy"><div><strong>{t('安全政策确认')} · v{policy.policy.version}</strong><p>{t('我了解高风险事件需要真人和专业机构介入，平台不能承诺绝对保密。')}</p></div><button type="button" disabled={busy === 'policy'} onClick={() => run('policy', () => acknowledgeMissionBridgePolicy(token), '安全政策确认已记录')}>{t('阅读并确认')}</button></div>}

      <nav className="mb-tabs" aria-label={t('邻舍之桥功能')}>
        {[['programs','项目'],['journey','我的旅程'],...(organizationId ? [['organizations','宣教组织']] : []),['leader','带领者工作台'],['attention-pilot','注意力30天'],['ai-faith','AI信仰探索'],['mobile-worker','司机同行'],['night-shift','夜班同行'],['mobile-family','流动家庭'],['specialized','专项支持'],['content','可信资料'],['agents','AI 辅助'],['safety','安全求助'],['privacy','隐私与同意'],...(proposals ? [['discovery','群体发现'],['designer','项目设计'],['training','导师小组'],['operations','运营后台']] : []),...(adminIncidents ? [['incidents','事件处理']] : [])].map(([key,label]) => <button type="button" key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{t(label)}</button>)}
      </nav>

      {error && <div className="mb-alert error" role="alert">{error}</div>}
      {notice && <div className="mb-alert success" role="status">{notice}</div>}

      {view === 'programs' && <>
        <label className="mb-consent"><input type="checkbox" checked={consent} onChange={(event) => { const checked = event.target.checked; run('consent', () => updateMissionBridgeConsent(token, 'program_participation', checked), checked ? '已记录自愿参与确认' : '已撤回参与同意，已有一般关怀不受影响') }} />
          <span><strong>{t('我自愿选择项目')}</strong><small>{t('我了解项目的信仰性质，可以暂停或退出；这不会影响我获得一般关怀。')}</small></span>
        </label>
        <div className="mb-program-grid">
          {(data?.programs || []).map((program) => {
            const meta = PROGRAM_META[program.id] || { icon: '🌍', duration: `${program.definition?.durationWeeks || ''} 周`, accent: '#5ac8fa' }
            const enrolled = active.find((item) => item.programId === program.id)
            const paused = (data?.enrollments || []).find((item) => item.programId === program.id && item.status === 'paused')
            return <article className="mb-program" key={program.id} style={{ '--mb-accent': meta.accent }}>
              <div className="mb-program-top"><span>{meta.icon}</span><small>{meta.duration}</small></div>
              <h3>{t(program.title)}</h3><p>{t(program.description)}</p>
              <div className="mb-guardrail">🛡 {t('自愿参与 · 专业转介 · 无羞耻驱动')}</div>
              {enrolled ? <button type="button" onClick={() => setView('journey')}>{t('继续旅程')} →</button> : paused ? <button type="button" onClick={() => run(`resume-${paused.id}`, () => resumeMissionBridgeProgram(token,paused.id), '项目已恢复')}>{t('恢复项目')}</button> : <>
                <input value={goal[program.id] || ''} maxLength={500} onChange={(e) => setGoal((old) => ({ ...old, [program.id]: e.target.value }))} placeholder={t('写下你希望共同实现的一个目标')}  aria-label={t('写下你希望共同实现的一个目标')}/>
                <button type="button" disabled={!consent || (goal[program.id] || '').trim().length < 2 || busy === program.id} onClick={() => run(program.id, () => enrollMissionBridgeProgram(token, program.id, goal[program.id].trim()), '项目已加入，你仍可随时暂停或退出')}>{busy === program.id ? t('加入中…') : t('自愿加入')}</button>
              </>}
            </article>
          })}
        </div>
      </>}

      {view === 'journey' && <div className="mb-journeys">
        <form className="mb-goal-form" onSubmit={event=>{event.preventDefault();run('goal',()=>createMissionBridgeGoal(token,newGoal),'目标草案已保存，请确认后生效')}}><h3>{t('共同制定目标')}</h3><input required minLength={3} value={newGoal.title} onChange={e=>setNewGoal({...newGoal,title:e.target.value})} placeholder={t('我希望实现什么？')} aria-label={t('我希望实现什么？')}/><input required minLength={5} value={newGoal.successDescription} onChange={e=>setNewGoal({...newGoal,successDescription:e.target.value})} placeholder={t('怎样算取得真实进展？')} aria-label={t('怎样算取得真实进展？')}/><button type="submit">{t('保存目标草案')}</button></form>
        {journey.goals.map(goal=><article className="mb-goal" key={goal.id}><div><strong>{goal.title}</strong><span>{goal.successDescription}</span></div>{!goal.confirmed&&<button type="button" onClick={()=>run(`confirm-${goal.id}`,()=>confirmMissionBridgeGoal(token,goal.id),'目标已由你确认')}>{t('确认目标')}</button>}</article>)}
        {journey.carePlans.map(plan=><article className="mb-care-plan" key={plan.id}><h3>{plan.title}</h3><p>{plan.rationale}</p>{plan.actions.map(action=><div key={action.id}><span><strong>{action.title}</strong><small>{t('建议原因')}：{action.suggestionReason}</small></span>{action.status!=='completed'&&<button type="button" onClick={()=>run(`action-${action.id}`,()=>completeMissionBridgeAction(token,action.id),'行动已完成')}>✓</button>}</div>)}</article>)}
        {!active.length ? <div className="mb-state">{t('尚未加入项目。先在“项目”中选择适合你的路径。')}</div> : active.map((item) => {
          const program = data.programs.find((p) => p.id === item.programId)
          const total = Number(program?.definition?.steps || 1); const progress = Math.min(100, Math.round(item.currentStep / total * 100))
          return <article className="mb-journey" key={item.id}><div className="mb-journey-title"><div><h3>{t(program?.title || item.programId)}</h3><p>{t('共同目标')}：{item.goal}</p></div><strong>{progress}%</strong></div>
            <div className="mb-progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="mb-checkin"><label>{t('本周状态')}<select value={checkin.wellbeing} onChange={(e) => setCheckin({ ...checkin, wellbeing: Number(e.target.value) })}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select></label>
              <textarea value={checkin.reflection} onChange={(e) => setCheckin({ ...checkin, reflection: e.target.value })} placeholder={t('这一周有什么真实进展或困难？')} maxLength={2000}  aria-label={t('这一周有什么真实进展或困难？')}/>
              <label className="mb-inline"><input type="checkbox" checked={checkin.needsSupport} onChange={(e) => setCheckin({ ...checkin, needsSupport: e.target.checked })} />{t('我希望真人同工跟进')}</label>
              <div className="mb-actions"><button type="button" onClick={() => run(`checkin-${item.id}`, () => submitMissionBridgeCheckin(token, item.id, checkin), '签到已保存')}>{t('保存签到')}</button><button className="secondary" type="button" onClick={() => run(`pause-${item.id}`, () => pauseMissionBridgeProgram(token,item.id), '项目已暂停，可在项目列表恢复')}>{t('暂停')}</button><button className="secondary" type="button" onClick={() => run(`exit-${item.id}`, () => exitMissionBridgeProgram(token, item.id), '已退出项目，一般关怀权限保持不变')}>{t('退出项目')}</button></div>
            </div>
          </article>
        })}
      </div>}

      {view === 'safety' && <div className="mb-incident">
        <div className="mb-alert warning"><strong>{t('紧急危险请先联系当地紧急服务或身边可信任的人。')}</strong><span>{t('AI不能替代医疗、法律、儿童保护或危机专业人员。')}</span></div>
        <label>{t('风险等级')}<select value={incident.riskLevel} onChange={(e) => setIncident({ ...incident, riskLevel: e.target.value })}><option value="L1">L1 · {t('需要支持')}</option><option value="L2">L2 · {t('需要专业升级')}</option><option value="L3">L3 · {t('即时危险')}</option></select></label>
        <label>{t('类别')}<input value={incident.category} onChange={(e) => setIncident({ ...incident, category: e.target.value })} /></label>
        <label>{t('最少必要说明')}<textarea value={incident.summary} onChange={(e) => setIncident({ ...incident, summary: e.target.value })} maxLength={2000} placeholder={t('请勿填写不必要的身份、住址或家庭敏感信息')}  aria-label={t('请勿填写不必要的身份、住址或家庭敏感信息')}/></label>
        <label className="mb-inline"><input type="checkbox" checked={incident.immediateDanger} onChange={(e) => setIncident({ ...incident, immediateDanger: e.target.checked, riskLevel: e.target.checked ? 'L3' : incident.riskLevel })} />{t('目前存在即时生命或身体危险')}</label>
        <button type="button" disabled={incident.summary.trim().length < 4 || busy === 'incident'} onClick={() => run('incident', () => reportMissionBridgeIncident(token, incident), '安全事件已记录；L2/L3 将进入真人升级流程')}>{t('提交安全求助')}</button>
      </div>}

      {view === 'incidents' && <div className="mb-incident-list">
        {!adminIncidents?.length ? <div className="mb-state">{t('当前没有待处理安全事件')}</div> : adminIncidents.map((item) => <article key={item.id} className={`mb-incident-row risk-${item.riskLevel}`}><div><strong>{item.riskLevel} · {item.category}</strong><span>{item.status} · {new Date(item.createdAt).toLocaleString()}</span></div>{item.status !== 'resolved' && <button type="button" onClick={() => { const note=window.prompt(t('请输入真人跟进与外部转介记录（至少 8 个字）')); if (note?.trim().length >= 8) run(`resolve-${item.id}`, () => resolveMissionBridgeIncident(token,item.id,note.trim()), '事件已由授权人员标记为解决') }}>{t('记录处理结果')}</button>}</article>)}
      </div>}

      {view === 'privacy' && <div className="mb-privacy">
        <div className="mb-alert warning">{t('每项同意独立设置，不会一次全部勾选。撤回 AI 或录音同意后，后续内容立即停止进入对应流程。')}</div>
        {privacyConsents.map((item) => <label key={item.consentType} className="mb-consent-row"><input type="checkbox" checked={item.granted} onChange={(event) => run(`privacy-${item.consentType}`, () => updateMissionBridgeDetailedConsent(token,item.consentType,event.target.checked), event.target.checked ? '同意已记录' : '同意已撤回并立即生效')} /><span><strong>{item.purpose}</strong><small>{item.dataCategories.join('、')} · {item.retentionDays} {t('天')}</small></span></label>)}
        <div className="mb-actions"><button type="button" onClick={() => run('export', () => requestMissionBridgeExport(token), '数据导出申请已提交')}>{t('申请导出我的数据')}</button><button type="button" className="secondary" onClick={() => { if (window.confirm(t('确认提交数据删除申请？必要安全记录将依法保留。'))) run('delete', () => requestMissionBridgeDeletion(token), '删除申请已提交') }}>{t('申请删除数据')}</button></div>
      </div>}

      {view === 'discovery' && <div className="mb-discovery">
        <div className="mb-alert warning">{t('先倾听群体本人，再设计项目。“未信”本身不能被定义为社会问题。AI 主题必须由研究员确认。')}</div>
        <div className="mb-discovery-grid"><form onSubmit={(event) => { event.preventDefault(); run('proposal', () => createMissionBridgeProposal(token,proposal), '群体提案已创建，下一步请完成 10–20 次访谈') }}><h3>{t('新建群体提案')}</h3>
          <label>{t('群体名称')}<input required minLength={3} value={proposal.title} onChange={(e) => setProposal({...proposal,title:e.target.value})} /></label>
          <label>{t('群体是谁')}<textarea required minLength={10} value={proposal.groupDescription} onChange={(e) => setProposal({...proposal,groupDescription:e.target.value})} /></label>
          <label>{t('谁认为他们有需要')}<input required value={proposal.needClaimedBy} onChange={(e) => setProposal({...proposal,needClaimedBy:e.target.value})} /></label>
          <label>{t('群体自己如何描述需要')}<textarea required value={proposal.communitySelfDescription} onChange={(e) => setProposal({...proposal,communitySelfDescription:e.target.value})} /></label>
          <button type="submit">{t('建立发现计划')}</button></form>
          <div><h3>{t('发现项目')}</h3>{!proposals?.length ? <div className="mb-state">{t('还没有群体提案')}</div> : proposals.map((item) => <button type="button" className="mb-proposal" key={item.id} onClick={async () => { try { setDiscoveryReport(await fetchMissionBridgeDiscoveryReport(token,item.id)) } catch (err) { setError(err.message) } }}><strong>{item.title}</strong><span>{item.status}</span></button>)}</div></div>
        {discoveryReport && <article className="mb-report"><h3>{discoveryReport.proposal.title}</h3><p>{discoveryReport.proposal.communityVoice}</p><div><strong>{discoveryReport.interviews.total}</strong>{t('次访谈')} · <strong>{Math.round(discoveryReport.interviews.communityMemberRatio*100)}%</strong>{t('来自群体成员')}</div><p>{discoveryReport.readyForPilot ? t('已具备小规模试点条件') : t('尚未达到 10 次访谈或缺少已确认需求')}</p></article>}
      </div>}
      {view === 'designer' && <ProgramDesigner token={token} onPublished={load} />}
      {view === 'training' && <TrainingConsole token={token} programs={data?.programs || []} />}
      {view === 'content' && <ContentLibrary token={token} canManage={Boolean(proposals)} />}
      {view === 'agents' && <AgentWorkbench token={token} aiConsented={Boolean(privacyConsents.find((item) => item.consentType === 'ai_assistance')?.granted)} onOpenPrivacy={() => setView('privacy')} />}
      {view === 'organizations' && <MissionOrganizationConsole token={token} organizationId={organizationId} />}
      {view === 'leader' && <LocalLeaderWorkspace token={token} />}
      {view === 'attention-pilot' && <AttentionPilotWorkspace token={token} />}
      {view === 'ai-faith' && <AiFaithWorkspace token={token} />}
      {view === 'mobile-worker' && <MobileWorkerWorkspace token={token} />}
      {view === 'night-shift' && <NightShiftWorkspace token={token} />}
      {view === 'mobile-family' && <MobileFamilyWorkspace token={token} />}
      {view === 'specialized' && <SpecializedSupportWorkspace token={token} />}
      {view === 'operations' && <OperationsConsole token={token} />}
    </section>
  )
}
