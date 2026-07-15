import { useEffect, useState, useCallback } from 'react'
import { t } from '../../../i18n/runtime'
import * as api from '../api/missionApi'
import { listMyOrganizations, createOrganization } from '../api/organizations'
import GuidedInput from '../../../components/mission-bridge/GuidedInput'
import { missionOptionLabel } from '../../../components/mission-bridge/optionLabels'

/**
 * MissionConsole — Mission OS 工作台
 * 覆盖生命周期主线：禾场情报 → 呼召辨识 → 工人准备度 → 部署财务 → Deployment Gate。
 * 每个面板接真实后端 API（/api/v1/mission/...），含 加载/空/错误/无权限 四态。
 */

// ---- 生命周期阶段（镜像 backend mission_os/pipeline.py）----
const STAGES = [
  ['field', '禾场情报', 'B2'],
  ['calling', '呼召辨识', 'B3'],
  ['readiness', '工人准备度', 'B3'],
  ['training', '装备训练', 'B4'],
  ['sending', '差派申请', 'B5'],
  ['committee', '差派委员会', 'B5'],
  ['team', '团队与伙伴', 'B5'],
  ['finance', '部署财务', 'B6'],
  ['identity', '合法身份', 'B6'],
  ['family', '家庭准备', 'B6'],
  ['compliance', '合规审核', 'B6'],
  ['vault', '证件 Vault', 'B6'],
  ['gate', '部署就绪 Gate', 'B6'],
]

const ORIENTATIONS = [
  'cross_cultural_mission', 'local_evangelism', 'diaspora_ministry', 'church_equipping',
  'bible_translation_support', 'professional_mission', 'member_care', 'prayer_and_mobilization',
  'mission_research', 'digital_mission_infrastructure', 'undetermined',
]
const FIELD_TYPES = [
  'country', 'city', 'people_group', 'diaspora_community', 'international_student_community',
  'professional_community', 'digital_community', 'ministry_network',
]
const SCENARIOS = ['baseline', 'conservative', 'support_loss', 'evacuation', 'education_cost_increase', 'currency_depreciation']
const FIELD_HARD_BLOCKS = ['no_legal_entry_path', 'no_local_partner_when_required', 'unmitigated_high_risk', 'data_quality_too_low', 'local_partner_opposed']
const GATE_HARD_BLOCKS = ['sending_decision_expired', 'financial_underfunded', 'credential_invalid', 'medical_not_cleared', 'spouse_not_consenting', 'no_emergency_plan', 'critical_finding_open']
const FIELD_NAME_OPTIONS = ['城市留学生群体', '跨文化家庭', '流动务工群体', '专业人士社群', '线上探索者社群']
const FIELD_INTEREST_OPTIONS = ['南亚留学生', '城市新移民', '跨文化家庭', '青年专业人士', '数字社群']
const CALLING_QUESTION_OPTIONS = ['我应当先倾听和学习什么？', '本地教会与伙伴如何参与辨识？', '家庭与长期委身是否预备好？', '我的恩赐如何回应真实需要？']
const TEAM_NAME_OPTIONS = ['跨文化同行团队', '城市关怀团队', '青年与学生团队', '数字宣教团队']
const PARTNER_ALIAS_OPTIONS = ['本地教会伙伴', '社区服务伙伴', '专业转介伙伴', '校园同行伙伴']
const ACTIVITY_OPTIONS = ['语言学习与文化适应', '专业工作与职场服务', '社区关怀与关系建立', '教会装备与门训支持', '研究、翻译与内容支持']
const ORG_NAME_OPTIONS = ['教会宣教部', '跨文化差派团队', '城市关怀中心', '宣教培训中心']
const PLAN_TYPES = ['foundational_formation', 'cross_cultural_preparation', 'language_and_culture', 'professional_readiness', 'member_care']
const IDENTITY_TYPES = ['employment', 'self_employment', 'business_owner', 'student', 'researcher', 'dependent', 'family_reunification', 'volunteer_where_legal', 'religious_worker_where_legal', 'retirement', 'digital_nomad_where_legal', 'professional_secondment', 'humanitarian_worker', 'local_citizen_or_permanent_resident']
const HOUSEHOLD_TYPES = ['family', 'couple', 'single_parent_family', 'single_adult', 'multigenerational_family']
const CREDENTIAL_TYPES = ['passport', 'visa', 'residence_permit', 'work_permit', 'student_permit', 'dependent_permit', 'professional_license', 'business_registration', 'tax_registration', 'driver_license', 'marriage_certificate', 'custody_document', 'vaccination_certificate', 'insurance_card', 'background_check']

// ---- styles ----
const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 12 }
const inp = { width: '100%', padding: 9, borderRadius: 9, marginBottom: 9, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: 13.5, boxSizing: 'border-box' }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '9px 16px', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13.5, background: 'linear-gradient(135deg, rgba(94,92,230,0.9), rgba(52,199,89,0.7))' }
const label = { fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '2px 0 3px' }
const pill = (color, bg) => ({ fontSize: 11, fontWeight: 700, color, background: bg, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' })

function statusPill(s) {
  const m = {
    blocked: ['#ff6b6b', 'rgba(255,107,107,0.15)'], ready_for_deployment_planning: ['#34c759', 'rgba(52,199,89,0.15)'],
    calculated: ['#8fd6ff', 'rgba(90,200,250,0.15)'], active_discernment: ['#8fd6ff', 'rgba(90,200,250,0.15)'],
  }
  const [c, b] = m[s] || ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.08)']
  return <span style={pill(c, b)}>{s}</span>
}

// ---- generic list state block ----
function StateBlock({ loading, error, empty, emptyText }) {
  if (loading) return <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{t('加载中…')}</div>
  if (error) {
    const noPerm = error.status === 401 || error.status === 403
    return (
      <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
        {noPerm
          ? t('你当前没有该组织的 Mission OS 权限，或后端未启用 mission_os。请联系组织管理员或在功能开关中启用。')
          : `${t('无法加载')}：${error.detail || error.message || t('网络错误')}`}
      </div>
    )
  }
  if (empty) return <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{emptyText || t('暂无记录')}</div>
  return null
}

function useList(fn, deps) {
  const [state, setState] = useState({ loading: true, error: null, items: [], extra: null })
  const reload = useCallback(() => {
    setState(s => ({ ...s, loading: true, error: null }))
    fn().then(d => setState({ loading: false, error: null, items: d.items || [], extra: d }))
      .catch(e => setState({ loading: false, error: e, items: [], extra: null }))
  }, deps) // eslint-disable-line
  useEffect(() => { reload() }, [reload])
  return { ...state, reload }
}

function Row({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>{children}</div>
}

function MultiSelect({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
      {options.map(o => {
        const on = value.includes(o)
        return (
          <button key={o} type="button" onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])}
            style={{ ...pill(on ? '#fff' : 'rgba(255,255,255,0.6)', on ? 'rgba(94,92,230,0.5)' : 'rgba(255,255,255,0.06)'), cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 9px' }}>
            {missionOptionLabel(o)}
          </button>
        )
      })}
    </div>
  )
}

// ============ Panels ============
function FieldsPanel({ token, org }) {
  const { loading, error, items, reload } = useList(() => api.listFields(token, org), [token, org])
  const [form, setForm] = useState({ fieldType: 'people_group', canonicalName: '', countryCode: '', sensitivityLevel: 'P1' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function submit() {
    setBusy(true); setMsg('')
    try {
      const b = { ...form, countryCode: form.countryCode || undefined }
      await api.createField(token, org, b); setForm({ ...form, canonicalName: '' }); setMsg(t('已创建禾场')); reload()
    } catch (e) { setMsg(e.detail || e.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('新建禾场')} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Skill 16</span></div>
        <div style={label}>{t('类型')}</div>
        <select style={inp} value={form.fieldType} onChange={e => setForm({ ...form, fieldType: e.target.value })}>
          {FIELD_TYPES.map(x => <option key={x} value={x}>{missionOptionLabel(x)}</option>)}
        </select>
        <div style={label}>{t('名称')}</div>
        <GuidedInput style={inp} options={FIELD_NAME_OPTIONS} value={form.canonicalName} onChange={canonicalName => setForm({ ...form, canonicalName })} placeholder={t('例如：某城市留学生群体')} aria-label={t('禾场名称')} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><div style={label}>{t('国家码(可选)')}</div><input style={inp} maxLength={2} value={form.countryCode} onChange={e => setForm({ ...form, countryCode: e.target.value.toUpperCase() })} placeholder="CN"  aria-label="CN"/></div>
          <div style={{ flex: 1 }}><div style={label}>{t('敏感级')}</div>
            <select style={inp} value={form.sensitivityLevel} onChange={e => setForm({ ...form, sensitivityLevel: e.target.value })}>{['P0', 'P1', 'P2', 'P3', 'P4'].map(x => <option key={x} value={x}>{missionOptionLabel(x)}</option>)}</select>
          </div>
        </div>
        <button style={{ ...btn, opacity: busy || !form.canonicalName ? 0.5 : 1 }} disabled={busy || !form.canonicalName} onClick={submit}>{t('创建')}</button>
        {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: '#8fd6ff' }}>{msg}</div>}
      </div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('禾场列表')}</div>
        <StateBlock loading={loading} error={error} empty={!loading && !error && items.length === 0} />
        {items.map(f => (
          <Row key={f.id}>
            <span style={{ flex: 1 }}>{f.canonicalName}</span>
            <span style={pill('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.06)')}>{f.fieldType}</span>
            <span style={pill('#8fd6ff', 'rgba(90,200,250,0.12)')}>{f.researchStatus}</span>
            <span style={pill('rgba(255,179,71,0.9)', 'rgba(255,179,71,0.12)')}>{f.sensitivityLevel}</span>
          </Row>
        ))}
      </div>
    </div>
  )
}

function CallingPanel({ token, org }) {
  const { loading, error, items, reload } = useList(() => api.listCallingJourneys(token, org), [token, org])
  const [form, setForm] = useState({ callingOrientation: 'undetermined', fieldInterest: '', primaryQuestion: '' })
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  async function submit() {
    setBusy(true); setMsg('')
    try { await api.createCallingJourney(token, org, form); setMsg(t('已开始呼召辨识旅程')); reload() }
    catch (e) { setMsg(e.detail || e.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('开始呼召辨识旅程')} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Skill 28</span></div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{t('本工具不替代教会与群体辨识，不宣告呼召。感动/异象仅作为非决定性证据记录。')}</div>
        <div style={label}>{t('呼召方向（可多次探索）')}</div>
        <select style={inp} value={form.callingOrientation} onChange={e => setForm({ ...form, callingOrientation: e.target.value })}>
          {ORIENTATIONS.map(x => <option key={x} value={x}>{missionOptionLabel(x)}</option>)}
        </select>
        <div style={label}>{t('禾场兴趣（与方向分开）')}</div>
        <GuidedInput style={inp} options={FIELD_INTEREST_OPTIONS} value={form.fieldInterest} onChange={fieldInterest => setForm({ ...form, fieldInterest })} placeholder={t('例如：南亚留学生')} aria-label={t('禾场兴趣')} />
        <div style={label}>{t('核心问题')}</div>
        <GuidedInput style={inp} options={CALLING_QUESTION_OPTIONS} value={form.primaryQuestion} onChange={primaryQuestion => setForm({ ...form, primaryQuestion })} aria-label={t('核心问题')} />
        <button style={{ ...btn, opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={submit}>{t('开始')}</button>
        {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: '#8fd6ff' }}>{msg}</div>}
      </div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('我的呼召旅程')}</div>
        <StateBlock loading={loading} error={error} empty={!loading && !error && items.length === 0} />
        {items.map(j => (
          <Row key={j.id}>
            <span style={{ flex: 1 }}>{j.fieldInterest || j.callingOrientation || t('（未定方向）')}</span>
            {statusPill(j.journeyStatus)}
          </Row>
        ))}
      </div>
    </div>
  )
}

function ReadinessPanel({ token, org }) {
  const { loading, error, items, extra, reload } = useList(() => api.listReadiness(token, org), [token, org])
  const [worker, setWorker] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  async function submit() {
    setBusy(true); setMsg('')
    try { await api.createReadiness(token, org, { workerProfileId: worker }); setMsg(t('已创建准备度评估（15 维、无属灵总分）')); reload() }
    catch (e) { setMsg(e.detail || e.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('新建准备度评估')} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Skill 34</span></div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{t('准备度不是属灵价值评分；Deployment Candidate 需人工 Panel，硬阻塞不可被高分抵消。')}</div>
        <div style={label}>{t('工人 Profile ID')}</div>
        <input style={inp} value={worker} onChange={e => setWorker(e.target.value)} placeholder="worker-profile-id"  aria-label="worker-profile-id"/>
        <button style={{ ...btn, opacity: busy || !worker ? 0.5 : 1 }} disabled={busy || !worker} onClick={submit}>{t('创建')}</button>
        {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: '#8fd6ff' }}>{msg}</div>}
        {extra?.dimensions && <div style={{ marginTop: 8, fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>{t('维度')}: {extra.dimensions.length} — {extra.dimensions.slice(0, 6).join('、')}…</div>}
      </div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('准备度评估列表')}</div>
        <StateBlock loading={loading} error={error} empty={!loading && !error && items.length === 0} />
        {items.map(a => (
          <Row key={a.id}>
            <span style={{ flex: 1 }}>{a.workerProfileId}</span>
            <span style={pill('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.06)')}>{a.assessmentStatus}</span>
            {a.readinessLevel && <span style={pill('#8fd6ff', 'rgba(90,200,250,0.12)')}>{a.readinessLevel}</span>}
          </Row>
        ))}
      </div>
    </div>
  )
}

function FinancePanel({ token, org }) {
  const { loading, error, items, reload } = useList(() => api.listFinancePlans(token, org), [token, org])
  const [form, setForm] = useState({ workerProfileId: '', baseCurrency: 'USD', householdSize: 1, highRiskField: false, hasChildren: false })
  const [scenarios, setScenarios] = useState(['baseline', 'conservative', 'support_loss'])
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  async function submit() {
    setBusy(true); setMsg('')
    try { await api.createFinancePlan(token, org, { ...form, householdSize: Number(form.householdSize), scenarioTypes: scenarios }); setMsg(t('已创建财务计划')); reload() }
    catch (e) { setMsg(e.detail || e.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('新建全周期财务计划')} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Skill 61</span></div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{t('必备 baseline+conservative+support_loss；高风险 Field 需 evacuation，家庭需教育成本。Pledge≠到账。')}</div>
        <div style={label}>{t('工人 Profile ID')}</div>
        <input style={inp} value={form.workerProfileId} onChange={e => setForm({ ...form, workerProfileId: e.target.value })} placeholder="worker-profile-id"  aria-label="worker-profile-id"/>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><div style={label}>{t('币种')}</div><select style={inp} value={form.baseCurrency} onChange={e => setForm({ ...form, baseCurrency: e.target.value })}>{['USD','CNY','EUR','GBP','HKD','SGD','JPY'].map(x=><option key={x} value={x}>{missionOptionLabel(x)}</option>)}</select></div>
          <div style={{ flex: 1 }}><div style={label}>{t('家庭人数')}</div><input style={inp} type="number" min={1} value={form.householdSize} onChange={e => setForm({ ...form, householdSize: e.target.value })} /></div>
        </div>
        <div style={{ display: 'flex', gap: 14, margin: '4px 0 9px', fontSize: 13 }}>
          <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={form.highRiskField} onChange={e => setForm({ ...form, highRiskField: e.target.checked })} /> {t('高风险 Field')}</label>
          <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={form.hasChildren} onChange={e => setForm({ ...form, hasChildren: e.target.checked })} /> {t('有子女')}</label>
        </div>
        <div style={label}>{t('预算情景')}</div>
        <MultiSelect options={SCENARIOS} value={scenarios} onChange={setScenarios} />
        <button style={{ ...btn, opacity: busy || !form.workerProfileId ? 0.5 : 1 }} disabled={busy || !form.workerProfileId} onClick={submit}>{t('创建')}</button>
        {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: '#8fd6ff' }}>{msg}</div>}
      </div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('财务计划列表')}</div>
        <StateBlock loading={loading} error={error} empty={!loading && !error && items.length === 0} />
        {items.map(p => (
          <Row key={p.id}>
            <span style={{ flex: 1 }}>{p.workerProfileId} · {p.baseCurrency}</span>
            <span style={pill('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.06)')}>{t('情景')} {p.scenarioCount}</span>
            <span style={pill('#8fd6ff', 'rgba(90,200,250,0.12)')}>{p.planStatus}</span>
          </Row>
        ))}
      </div>
    </div>
  )
}

function CompactPanel({ title, skill, note, fields, initial, listCall, createCall, renderRow }) {
  const { loading,error,items,reload }=useList(listCall,[listCall])
  const [form,setForm]=useState(initial);const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('')
  async function submit(){setBusy(true);setMsg('');try{await createCall(form);setMsg(t('已创建'));reload()}catch(e){setMsg(e.detail||e.message)}finally{setBusy(false)}}
  return <div><div style={card}><div style={{fontWeight:700,marginBottom:8}}>{t(title)} <span style={{fontSize:11,opacity:.45}}>{skill}</span></div><div style={{fontSize:12,opacity:.55,marginBottom:8}}>{t(note)}</div>{fields.map(f=><div key={f.key}><div style={label}>{t(f.label)}</div>{f.options?<GuidedInput style={inp} options={f.options} value={form[f.key]||''} onChange={value=>setForm({...form,[f.key]:value})} placeholder={f.placeholder||''} aria-label={t(f.label)}/>:f.selectOptions?<select style={inp} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} aria-label={t(f.label)}>{f.selectOptions.map(option=><option key={option} value={option}>{missionOptionLabel(option)}</option>)}</select>:<input style={inp} type={f.type||'text'} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder||''} aria-label={t(f.label)}/>}</div>)}<button style={{...btn,opacity:busy?.5:1}} disabled={busy} onClick={submit}>{t('创建')}</button>{msg&&<div style={{marginTop:8,fontSize:12.5,color:'#8fd6ff'}}>{msg}</div>}</div><div style={card}><div style={{fontWeight:700,marginBottom:4}}>{t('记录列表')}</div><StateBlock loading={loading} error={error} empty={!loading&&!error&&!items.length}/>{items.map(renderRow)}</div></div>
}

function TrainingPanel({token,org}){return <CompactPanel title="创建个性化装备计划" skill="Skill 37" note="训练由准备度缺口驱动；课程不能单独解除硬阻塞。" fields={[{key:'workerProfileId',label:'工人 Profile ID'},{key:'planType',label:'计划类型',selectOptions:PLAN_TYPES}]} initial={{workerProfileId:'',planType:'foundational_formation',durationMonths:12,gaps:[]}} listCall={useCallback(()=>api.listTrainingPlans(token,org),[token,org])} createCall={b=>api.createTrainingPlan(token,org,b)} renderRow={p=><Row key={p.id}><span style={{flex:1}}>{p.workerProfileId} · {p.planType}</span>{statusPill(p.planStatus)}</Row>}/>}

function SendingPanel({token,org}){return <CompactPanel title="创建候选人差派申请" skill="Skill 52" note="创建草稿不等于通过；提交、委员会决定与 Deployment Gate 均为独立人工阶段。" fields={[{key:'workerProfileId',label:'工人 Profile ID'},{key:'targetFieldId',label:'目标禾场 ID'},{key:'targetRoleId',label:'目标角色 ID'}]} initial={{workerProfileId:'',targetFieldId:'',targetRoleId:''}} listCall={useCallback(()=>api.listSendingApplications(token,org),[token,org])} createCall={b=>api.createSendingApplication(token,org,b)} renderRow={a=><Row key={a.id}><span style={{flex:1}}>{a.workerProfileId} · {a.targetFieldId||t('未定禾场')}</span>{statusPill(a.applicationStatus)}</Row>}/>}

function CommitteePanel({token,org}){const data=useList(()=>api.listCommitteeDecisions(token,org),[token,org]);return <div><div style={card}><div style={{fontWeight:700,marginBottom:8}}>{t('差派委员会审核队列')} <span style={{fontSize:11,opacity:.45}}>Skill 53</span></div><div style={{fontSize:12,opacity:.55}}>{t('最终决定要求多方 quorum、禁止自审、AI 无投票权；配偶或本地伙伴反对与未解除硬阻塞均不可被覆盖。')}</div></div><div style={card}><StateBlock loading={data.loading} error={data.error} empty={!data.loading&&!data.error&&!data.items.length}/>{data.items.map(d=><Row key={d.id}><span style={{flex:1}}>{d.applicationId}</span>{statusPill(d.decisionType)}<span style={pill('#8fd6ff','rgba(90,200,250,.12)')}>{d.unlocks}</span></Row>)}</div></div>}

function TeamPanel({token,org}){const teams=useList(()=>api.listTeams(token,org),[token,org]);const partners=useList(()=>api.listPartners(token,org),[token,org]);const [name,setName]=useState('');const [alias,setAlias]=useState('');return <div><div style={card}><div style={{fontWeight:700,marginBottom:8}}>{t('团队与本地伙伴')} <span style={{fontSize:11,opacity:.45}}>Skill 54–59</span></div><GuidedInput style={inp} options={TEAM_NAME_OPTIONS} value={name} onChange={setName} placeholder={t('团队名称')} aria-label={t('团队名称')}/><button style={btn} onClick={async()=>{await api.createTeam(token,org,{name});setName('');teams.reload()}}>{t('创建团队')}</button><div style={{height:12}}/><GuidedInput style={inp} options={PARTNER_ALIAS_OPTIONS} value={alias} onChange={setAlias} placeholder={t('伙伴内部别名（敏感信息不公开）')} aria-label={t('伙伴内部别名（敏感信息不公开）')}/><button style={btn} onClick={async()=>{await api.createPartner(token,org,{internalAlias:alias});setAlias('');partners.reload()}}>{t('登记伙伴')}</button></div><div style={card}><StateBlock loading={teams.loading} error={teams.error} empty={!teams.loading&&!teams.items.length}/>{teams.items.map(x=><Row key={x.id}><span style={{flex:1}}>{x.name}</span>{statusPill(x.teamStatus)}</Row>)}{partners.items.map(x=><Row key={x.id}><span style={{flex:1}}>{x.internalAlias}</span>{statusPill(x.profileStatus)}</Row>)}</div></div>}

function IdentityPanel({token,org}){return <CompactPanel title="建立合法身份路径" skill="Skill 65–69" note="申报活动必须与真实活动一致；普通字段只展示脱敏信息，家庭意见独立保密。" fields={[{key:'workerProfileId',label:'工人 Profile ID'},{key:'identityType',label:'合法身份类型',selectOptions:IDENTITY_TYPES},{key:'declaredActivity',label:'申报活动',options:ACTIVITY_OPTIONS},{key:'actualActivity',label:'真实活动',options:ACTIVITY_OPTIONS}]} initial={{workerProfileId:'',identityType:'employment',declaredActivity:'',actualActivity:'',intent:'real'}} listCall={useCallback(()=>api.listIdentityPaths(token,org),[token,org])} createCall={b=>api.createIdentityPath(token,org,b)} renderRow={p=><Row key={p.id}><span style={{flex:1}}>{p.workerProfileId} · {p.identityType}</span>{statusPill(p.pathStatus)}</Row>}/>}

function FamilyPanel({token,org}){return <CompactPanel title="建立家庭准备度计划" skill="Skill 69" note="配偶拥有独立表达、撤回与隐私权；不支持不得被改写为候选人的失败。" fields={[{key:'workerProfileId',label:'工人 Profile ID'},{key:'householdType',label:'家庭类型',selectOptions:HOUSEHOLD_TYPES},{key:'sendingJourneyId',label:'Sending Journey ID'},{key:'targetFieldId',label:'目标禾场 ID'},{key:'intendedMoveDate',label:'预期迁移日期（YYYY-MM-DD）',type:'date'}]} initial={{workerProfileId:'',householdType:'family',sendingJourneyId:'',targetFieldId:'',intendedMoveDate:''}} listCall={useCallback(()=>api.listFamilyPlans(token,org),[token,org])} createCall={b=>api.createFamilyPlan(token,org,b)} renderRow={p=><Row key={p.id}><span style={{flex:1}}>{p.householdId} · {p.targetFieldId||t('未定禾场')}</span>{statusPill(p.planStatus)}</Row>}/>}

function CompliancePanel({token,org}){return <CompactPanel title="创建多领域合规审核" skill="Skill 67" note="移民、税务、雇佣与跨境数据分别由合格专业人员审查；系统不替代法律意见。" fields={[{key:'sendingJourneyId',label:'Sending Journey ID'},{key:'targetFieldId',label:'目标禾场 ID'},{key:'activityScope',label:'真实活动范围',options:ACTIVITY_OPTIONS}]} initial={{sendingJourneyId:'',targetFieldId:'',activityScope:'',domains:['immigration','tax','employment','data_transfer']}} listCall={useCallback(()=>api.listComplianceCases(token,org),[token,org])} createCall={b=>api.createComplianceCase(token,org,b)} renderRow={p=><Row key={p.id}><span style={{flex:1}}>{p.activityScope} · {p.domainCount} {t('领域')}</span>{statusPill(p.caseStatus)}</Row>}/>}

function VaultPanel({token,org}) {
  const [form,setForm]=useState({portfolioId:'',credentialType:'passport',identifier:'',secureFileBase64:null,secureFileName:null,secureFileMediaType:'application/octet-stream'})
  const [credential,setCredential]=useState(null);const [session,setSession]=useState('');const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false)
  async function chooseFile(e){const file=e.target.files?.[0];if(!file)return;if(file.size>10*1024*1024){setMsg(t('文件不能超过 10 MiB'));return}const value=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});setForm({...form,secureFileBase64:value,secureFileName:file.name,secureFileMediaType:file.type||'application/octet-stream'})}
  async function save(){setBusy(true);setMsg('');try{const r=await api.addCredential(token,org,form);setCredential(r);setForm({...form,identifier:''});setMsg(t('证件号和文件已使用 AES-256-GCM 加密保存'))}catch(e){setMsg(e.detail||e.message)}finally{setBusy(false)}}
  async function stepUp(){try{const r=await api.openVaultSession(token,org);setSession(r.secureSessionId);setMsg(t('二次认证安全会话已开启，有效期 10 分钟'))}catch(e){setMsg(e.detail||e.message)}}
  async function download(){try{const r=await api.downloadCredentialFile(token,org,credential.credentialId,session);const bytes=Uint8Array.from(atob(r.contentBase64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:r.mediaType}));const a=document.createElement('a');a.href=url;a.download=r.fileName;a.click();URL.revokeObjectURL(url);setMsg(t('安全文件下载已审计'))}catch(e){setMsg(e.detail||e.message)}}
  return <div><div style={card}><div style={{fontWeight:700,marginBottom:8}}>{t('加密证件 Vault')} <span style={{fontSize:11,opacity:.45}}>Skill 65 / 15</span></div><div style={{fontSize:12,opacity:.55,marginBottom:8}}>{t('原始证件号与文件只以密文保存；下载要求最近 10 分钟真实 MFA，并写入不可变审计。')}</div><div><div style={label}>{t('Credential Portfolio ID')}</div><input style={inp} value={form.portfolioId} onChange={e=>setForm({...form,portfolioId:e.target.value})}/></div><div><div style={label}>{t('证件类型')}</div><select style={inp} value={form.credentialType} onChange={e=>setForm({...form,credentialType:e.target.value})}>{CREDENTIAL_TYPES.map(type=><option key={type} value={type}>{missionOptionLabel(type)}</option>)}</select></div><div><div style={label}>{t('证件号（保存后仅显示掩码）')}</div><input style={inp} type="password" value={form.identifier} onChange={e=>setForm({...form,identifier:e.target.value})}/></div><input type="file" onChange={chooseFile} style={{marginBottom:10,color:'rgba(255,255,255,.7)'}}/><br/><button style={{...btn,opacity:busy?.5:1}} disabled={busy||!form.portfolioId||!form.identifier} onClick={save}>{t('加密保存')}</button>{credential&&<div style={{marginTop:10,fontSize:13}}>{t('掩码')}: {credential.maskedIdentifier} · {credential.secureFileStored?t('已存安全文件'):t('无文件')}</div>}{msg&&<div style={{marginTop:8,fontSize:12.5,color:'#8fd6ff'}}>{msg}</div>}</div>{credential?.secureFileStored&&<div style={card}><div style={{fontWeight:700,marginBottom:8}}>{t('Step-up 安全下载')}</div><button style={btn} onClick={stepUp}>{t('验证近期 MFA 并开启会话')}</button>{session&&<button style={{...btn,marginLeft:8}} onClick={download}>{t('下载并记录审计')}</button>}</div>}</div>
}

function GatePanel({ token, org }) {
  const { loading, error, items, reload } = useList(() => api.listGates(token, org), [token, org])
  const [form, setForm] = useState({ sendingJourneyId: '', candidateId: '', isPanel: false })
  const [blocks, setBlocks] = useState([])
  const [busy, setBusy] = useState(false); const [result, setResult] = useState(null); const [msg, setMsg] = useState('')
  async function submit() {
    setBusy(true); setMsg(''); setResult(null)
    try { const r = await api.runGate(token, org, { ...form, hardBlocks: blocks }); setResult(r); reload() }
    catch (e) { setMsg(e.detail || e.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('运行 Deployment Readiness Gate')} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Skill 71</span></div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{t('聚合全部 Batch 6 条件；硬阻塞不可绕过、需人工 Panel、禁 AI/自审。Ready 仅解锁部署规划（终态），不等于已出发。')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><div style={label}>{t('Sending Journey ID')}</div><input style={inp} value={form.sendingJourneyId} onChange={e => setForm({ ...form, sendingJourneyId: e.target.value })} /></div>
          <div style={{ flex: 1 }}><div style={label}>{t('候选人 ID')}</div><input style={inp} value={form.candidateId} onChange={e => setForm({ ...form, candidateId: e.target.value })} /></div>
        </div>
        <label style={{ cursor: 'pointer', fontSize: 13, display: 'block', margin: '2px 0 9px' }}>
          <input type="checkbox" checked={form.isPanel} onChange={e => setForm({ ...form, isPanel: e.target.checked })} /> {t('由人工 Panel 决定（否则不予放行）')}
        </label>
        <div style={label}>{t('硬阻塞（勾选表示存在，将阻断放行）')}</div>
        <MultiSelect options={GATE_HARD_BLOCKS} value={blocks} onChange={setBlocks} />
        <button style={{ ...btn, opacity: busy || !form.sendingJourneyId || !form.candidateId ? 0.5 : 1 }} disabled={busy || !form.sendingJourneyId || !form.candidateId} onClick={submit}>{t('运行 Gate')}</button>
        {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: '#ff9f9f' }}>{msg}</div>}
        {result && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: result.status === 'ready_for_deployment_planning' ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{statusPill(result.status)}<span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>{t('解锁')}: {result.unlocks}</span></div>
            {result.blockingFindings?.length > 0 && <div style={{ marginTop: 6, fontSize: 12.5, color: '#ff9f9f' }}>{t('阻塞项')}: {result.blockingFindings.join('、')}</div>}
            <div style={{ marginTop: 6, fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>{t('activatesDeployment')}: {String(result.activatesDeployment)}（{t('Ready 不激活部署')}）</div>
          </div>
        )}
      </div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('Gate 历史')}</div>
        <StateBlock loading={loading} error={error} empty={!loading && !error && items.length === 0} />
        {items.map(g => (
          <Row key={g.id}>
            <span style={{ flex: 1 }}>{g.sendingJourneyId}</span>
            {statusPill(g.gateStatus)}
            <span style={pill('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.06)')}>{g.unlocks}</span>
          </Row>
        ))}
      </div>
    </div>
  )
}

const PANELS = {
  field: FieldsPanel, calling: CallingPanel, readiness: ReadinessPanel, training: TrainingPanel,
  sending: SendingPanel, committee: CommitteePanel, team: TeamPanel, finance: FinancePanel, identity: IdentityPanel, family: FamilyPanel,
  compliance: CompliancePanel, vault: VaultPanel, gate: GatePanel,
}

const ORG_STORE_KEY = 'mission-os-selected-org'
const ORG_TYPES = [['church', '教会'], ['mission_agency', '差会'], ['team', '团队'], ['training_provider', '培训机构']]

function OrgGate({ token, orgs, loading, error, onSelect, onCreated, reload }) {
  const [name, setName] = useState('')
  const [orgType, setOrgType] = useState('church')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function create() {
    setBusy(true); setMsg('')
    try {
      const r = await createOrganization(token, { name: name.trim(), organization_type: orgType })
      setName(''); setMsg(t('组织已创建'))
      onCreated(r.organization_id)
    } catch (e) { setMsg(e.detail || e.message) } finally { setBusy(false) }
  }
  return (
    <div style={{ padding: 18 }}>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t('选择组织上下文')}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 10 }}>
          {t('Mission OS 工作台按组织（教会 / 差会 / 团队）隔离数据。请选择你所属的组织，或创建一个新组织。')}
        </div>
        <StateBlock loading={loading} error={error} empty={!loading && !error && orgs.length === 0} emptyText={t('你还不属于任何组织，请在下方创建')} />
        {orgs.map((o) => (
          <Row key={o.id}>
            <span style={{ flex: 1 }}>{o.name}</span>
            <span style={pill('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.06)')}>{o.organization_type}</span>
            <span style={pill('#8fd6ff', 'rgba(90,200,250,0.12)')}>{o.my_role}</span>
            <button style={{ ...btn, padding: '6px 12px' }} onClick={() => onSelect(o.id)}>{t('进入')}</button>
          </Row>
        ))}
      </div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('创建新组织')}</div>
        <div style={label}>{t('组织名称')}</div>
        <GuidedInput style={inp} options={ORG_NAME_OPTIONS} value={name} onChange={setName} placeholder={t('例如：恩典教会宣教部')} aria-label={t('组织名称')} />
        <div style={label}>{t('组织类型')}</div>
        <select style={inp} value={orgType} onChange={(e) => setOrgType(e.target.value)}>
          {ORG_TYPES.map(([v, zh]) => <option key={v} value={v}>{t(zh)}</option>)}
        </select>
        <button style={{ ...btn, opacity: busy || name.trim().length < 2 ? 0.5 : 1 }} disabled={busy || name.trim().length < 2} onClick={create}>{busy ? t('创建中…') : t('创建组织')}</button>
        {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: '#8fd6ff' }}>{msg}</div>}
        <div style={{ marginTop: 8 }}>
          <button style={{ ...btn, background: 'rgba(255,255,255,0.08)' }} onClick={reload}>{t('刷新组织列表')}</button>
        </div>
      </div>
    </div>
  )
}

export default function MissionConsole({ token, organizationId, initialPanel = 'field' }) {
  const [active, setActive] = useState(() => PANELS[initialPanel] ? initialPanel : 'field')
  const [org, setOrg] = useState(() => {
    try { return organizationId || localStorage.getItem(ORG_STORE_KEY) || '' } catch { return organizationId || '' }
  })
  const [orgs, setOrgs] = useState([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [orgsError, setOrgsError] = useState(null)
  const loadOrgs = useCallback(() => {
    if (!token) return
    setOrgsLoading(true); setOrgsError(null)
    listMyOrganizations(token)
      .then((r) => { setOrgs(r.organizations || []); setOrgsLoading(false) })
      .catch((e) => { setOrgsError(e); setOrgsLoading(false) })
  }, [token])
  useEffect(() => { loadOrgs() }, [loadOrgs])
  useEffect(() => {
    if (PANELS[initialPanel]) setActive(initialPanel)
  }, [initialPanel])
  const selectOrg = (id) => {
    setOrg(id)
    try { localStorage.setItem(ORG_STORE_KEY, id) } catch { /* storage may be disabled */ }
  }
  if (!token) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{t('请先登录以使用 Mission OS 工作台。')}</div>
  }
  if (!org) {
    return <OrgGate token={token} orgs={orgs} loading={orgsLoading} error={orgsError} onSelect={selectOrg} onCreated={selectOrg} reload={loadOrgs} />
  }
  const currentOrg = orgs.find((o) => o.id === org)
  const Panel = PANELS[active]
  return (
    <div style={{ padding: '4px 2px 40px' }}>
      {/* 组织上下文 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0 10px', fontSize: 12.5 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('组织')}:</span>
        <strong style={{ color: '#8fd6ff' }}>{currentOrg?.name || org}</strong>
        <button
          style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          onClick={() => { setOrg(''); try { localStorage.removeItem(ORG_STORE_KEY) } catch { /* noop */ } }}
        >{t('切换组织')}</button>
      </div>
      {/* 生命周期主线 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 12px' }}>
        {STAGES.map((s, i) => (
          <button key={s[0]} onClick={() => setActive(s[0])}
            style={{
              cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '7px 11px', whiteSpace: 'nowrap',
              background: active === s[0] ? 'rgba(94,92,230,0.28)' : 'rgba(255,255,255,0.05)',
              color: active === s[0] ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 12.5, fontWeight: 600,
            }}>
            <span style={{ opacity: 0.5, marginRight: 4 }}>{i + 1}</span>{t(s[1])}<span style={{ opacity: 0.4, marginLeft: 5, fontSize: 10 }}>{s[2]}</span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', margin: '0 2px 12px', lineHeight: 1.5 }}>
        {t('主线：禾场情报 → 呼召辨识 → 准备度 → 装备训练 → 差派与团队 → 财务/身份/家庭 → Deployment Gate。上游未达标不能进下游；任何自动阶段都不会把工人标记为「已出发」。')}
      </div>
      <Panel token={token} org={org} />
    </div>
  )
}
