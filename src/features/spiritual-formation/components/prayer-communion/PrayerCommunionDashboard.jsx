import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { intercessionCategories, prayerTemplates, presencePractices, psalmProfiles } from '../../data/prayerCommunionSeed'
import {
  buildPrayerDashboard,
  completeIntercessionSession,
  completePrayerSession,
  completePresenceCheckin,
  completePsalmPrayerSession,
  createDefaultPrayerRule,
  createIntercessionTarget,
  createPrayerRequest,
  createPresenceCheckin,
  createPresenceRule,
  detectOverburdeningRule,
  generateIntercessionPrompt,
  generatePresenceReflection,
  generateRuleReview,
  getTodayIntercessionPlan,
  getTodayPrayerPlan,
  markIntercessionItemPrayed,
  markPrayerRequestAnswered,
  orchestratePrayerIntent,
  recommendPresencePractice,
  recommendPsalm,
  startIntercessionSession,
  startPrayerSession,
  startPsalmPrayerSession,
  submitPsalmMovement,
} from '../../lib/prayerCommunionEngine'
import {
  loadPrayerCommunionData,
  saveIntercessionSession,
  saveIntercessionTarget,
  savePrayerRequest,
  savePrayerRule,
  savePrayerSession,
  savePresenceCheckin,
  savePresenceRule,
  savePsalmSession,
} from '../../lib/prayerCommunionStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', T('总览', 'Dashboard')],
    ['rule', T('祷告规则', 'Prayer Rule')],
    ['intercession', T('代祷', 'Intercession')],
    ['psalms', T('诗篇', 'Psalms')],
    ['presence', T('同在', 'Presence')],
  ]
  return <nav className="sf-tabs" aria-label={T('祷告与相交分区', 'Prayer Communion sections')}>{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function PrayerSessionSummary({ title, items }) {
  return (
    <article className="sf-card sf-summary-card">
      <h3>{title}</h3>
      <dl>{items.filter((item) => item.value).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value) ? item.value.join(', ') : item.value}</dd></div>)}</dl>
    </article>
  )
}

export function PrayerRuleCard({ userId, rules, sessions, onSaveRule, onSaveSession }) {
  const [activeSession, setActiveSession] = useState(null)
  const [form, setForm] = useState({ prayerText: '', gratitude: '', confession: '', petition: '', graceReceived: '', obediencePrompt: '' })
  const [notice, setNotice] = useState('')
  const plan = getTodayPrayerPlan(userId, rules, sessions)
  const review = generateRuleReview(userId, plan.activeRule, sessions)

  function ensureRule() {
    const rule = createDefaultPrayerRule(userId)
    onSaveRule(rule)
    setNotice(T('已创建默认祷告规则。', 'Default prayer rule created.'))
  }

  function start(slot) {
    const session = startPrayerSession(userId, plan.activeRule, slot)
    onSaveSession(session)
    setActiveSession(session)
    setForm({ prayerText: slot.template.body, gratitude: '', confession: '', petition: '', graceReceived: '', obediencePrompt: '' })
  }

  function complete() {
    const result = completePrayerSession(activeSession, {
      prayerText: form.prayerText,
      gratitudeItems: splitList(form.gratitude),
      confessionItems: splitList(form.confession),
      petitions: splitList(form.petition),
      graceReceived: form.graceReceived,
      obediencePrompt: form.obediencePrompt,
      durationMinutes: activeSession.durationMinutes,
    })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveSession(result.session)
    setActiveSession(result.session)
    setNotice(result.guidance.message)
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('固定祷告规则', 'Prayer Rule')}</h2><p>{T('建立小而稳定的每日相交节奏，而不是表现系统。', 'Build a small daily rhythm of communion, not a performance system.')}</p></div>
      {!rules.find((rule) => rule.active) && <button className="sf-primary" type="button" onClick={ensureRule}>{T('创建入门祷告规则', 'Create Beginner Prayer Rule')}</button>}
      <div className="sf-home-grid">
        {plan.slots.map((slot) => (
          <article className="sf-card sf-flow-card" key={slot.id}>
            <div className="sf-card-head"><h3>{slot.displayName}</h3><span className={slot.session?.status === 'completed' ? 'sf-status completed' : 'sf-status'}>{slot.session?.status || `${slot.durationMinutes} min`}</span></div>
            <p>{slot.template.body}</p>
            <button type="button" onClick={() => start(slot)}>{T('开始祷告时段', 'Start Prayer Session')}</button>
          </article>
        ))}
      </div>
      {activeSession?.status !== 'completed' && activeSession && (
        <article className="sf-card sf-flow-card">
          <h3>{T('祷告时段', 'Prayer Session')}</h3>
          <label>{T('祷告文本', 'Prayer text')}<textarea value={form.prayerText} onChange={(event) => setForm({ ...form, prayerText: event.target.value })} /></label>
          <label>{T('感恩', 'Gratitude')}<textarea value={form.gratitude} onChange={(event) => setForm({ ...form, gratitude: event.target.value })} placeholder={T('每行一个，或用逗号分隔。', 'One per line or comma separated.')} /></label>
          <label>{T('认罪', 'Confession')}<textarea value={form.confession} onChange={(event) => setForm({ ...form, confession: event.target.value })} /></label>
          <label>{T('祈求', 'Petitions')}<textarea value={form.petition} onChange={(event) => setForm({ ...form, petition: event.target.value })} /></label>
          <label>{T('领受的恩典', 'Grace received')}<textarea value={form.graceReceived} onChange={(event) => setForm({ ...form, graceReceived: event.target.value })} /></label>
          <label>{T('下一步行动', 'One next action')}<textarea value={form.obediencePrompt} onChange={(event) => setForm({ ...form, obediencePrompt: event.target.value })} /></label>
          <button className="sf-primary" type="button" onClick={complete}>{T('完成祷告时段', 'Complete Prayer Session')}</button>
        </article>
      )}
      {activeSession?.status === 'completed' && <PrayerSessionSummary title={T('祷告时段摘要', 'Prayer Session Summary')} items={[{ label: T('摘要', 'Summary'), value: activeSession.summary }, { label: T('领受的恩典', 'Grace received'), value: activeSession.graceReceived }, { label: T('下一步行动', 'Next action'), value: activeSession.nextAction }]} />}
      <PrayerSessionSummary title={T('每周祷告回顾', 'Weekly Prayer Review')} items={[{ label: T('已完成时段', 'Completed sessions'), value: String(review.completedSessionsCount) }, { label: T('稳定度', 'Consistency'), value: `${Math.round(review.consistencyScore * 100)}%` }, { label: T('调整建议', 'Adjustments'), value: review.adjustmentSuggestions }]} />
      {notice && <p className={notice.includes('urgent') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

export function IntercessionList({ userId, targets, requests, onSaveTarget, onSaveRequest, onSaveSession }) {
  const [targetForm, setTargetForm] = useState({ displayName: '', targetType: 'person', relationship: '', notes: '' })
  const [requestForm, setRequestForm] = useState({ title: '', description: '', category: 'wisdom', urgency: 'normal', privacyLevel: 'private', targetId: '' })
  const [session, setSession] = useState(null)
  const [notice, setNotice] = useState('')
  const todayPlan = getTodayIntercessionPlan(userId, requests)
  const answered = requests.filter((request) => request.status === 'answered')

  function addTarget() {
    const target = createIntercessionTarget(userId, targetForm)
    onSaveTarget(target)
    setTargetForm({ displayName: '', targetType: 'person', relationship: '', notes: '' })
  }

  function addRequest() {
    const result = createPrayerRequest(userId, requestForm)
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveRequest(result.request)
    setNotice(result.request.privacyWarning || result.guidance.samplePrayer)
    setRequestForm({ title: '', description: '', category: 'wisdom', urgency: 'normal', privacyLevel: 'private', targetId: '' })
  }

  function startSession() {
    const next = startIntercessionSession(userId, todayPlan)
    onSaveSession(next)
    setSession(next)
  }

  function markPrayed(item) {
    const result = markIntercessionItemPrayed(session, item.id, { prayerText: generateIntercessionPrompt(item.request).samplePrayer, burdenLevelAfter: 4 })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveSession(result.session)
    setSession(result.session)
  }

  function completeSession() {
    const next = completeIntercessionSession(session)
    onSaveSession(next)
    setSession(next)
    setNotice(T('代祷时段已完成。', 'Intercession session completed.'))
  }

  function markAnswered(request) {
    onSaveRequest(markPrayerRequestAnswered(request, T('已怀着感恩记录蒙应允的祷告。', 'Answered prayer recorded with gratitude.')))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('代祷追踪', 'Intercession')}</h2><p>{T('以智慧、隐私、爱、恒心和具体跟进来代祷。', 'Pray with wisdom, privacy, love, perseverance, and concrete follow-up.')}</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>{T('添加代祷对象', 'Add target')}</h3>
          <label>{T('名称', 'Name')}<input value={targetForm.displayName} onChange={(event) => setTargetForm({ ...targetForm, displayName: event.target.value })} /></label>
          <label>{T('类型', 'Type')}<select value={targetForm.targetType} onChange={(event) => setTargetForm({ ...targetForm, targetType: event.target.value })}><option>person</option><option>family</option><option>church</option><option>city</option><option>nation</option><option>mission</option><option>personal</option></select></label>
          <label>{T('关系', 'Relationship')}<input value={targetForm.relationship} onChange={(event) => setTargetForm({ ...targetForm, relationship: event.target.value })} /></label>
          <button type="button" onClick={addTarget}>{T('添加对象', 'Add Target')}</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>{T('添加祷告事项', 'Add prayer request')}</h3>
          <label>{T('对象', 'Target')}<select value={requestForm.targetId} onChange={(event) => setRequestForm({ ...requestForm, targetId: event.target.value })}><option value="">{T('无对象', 'No target')}</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.displayName}</option>)}</select></label>
          <label>{T('标题', 'Title')}<input value={requestForm.title} onChange={(event) => setRequestForm({ ...requestForm, title: event.target.value })} /></label>
          <label>{T('描述', 'Description')}<textarea value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} /></label>
          <label>{T('类别', 'Category')}<select value={requestForm.category} onChange={(event) => setRequestForm({ ...requestForm, category: event.target.value })}>{intercessionCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>{T('紧急程度', 'Urgency')}<select value={requestForm.urgency} onChange={(event) => setRequestForm({ ...requestForm, urgency: event.target.value })}><option>low</option><option>normal</option><option>high</option><option>urgent</option></select></label>
          <button type="button" onClick={addRequest}>{T('创建事项', 'Create Request')}</button>
        </article>
      </div>
      <article className="sf-card sf-flow-card">
        <div className="sf-card-head"><h3>{T('今日代祷计划', 'Today’s Intercession Plan')}</h3><button type="button" onClick={startSession}>{T('开始代祷时段', 'Start Intercession Session')}</button></div>
        {todayPlan.length ? todayPlan.map((request) => <IntercessionRequestCard key={request.id} request={request} onAnswered={() => markAnswered(request)} />) : <p className="sf-empty">{T('暂无到期的代祷事项。可在上方添加。', 'No active requests due. Add one above.')}</p>}
      </article>
      {session && (
        <article className="sf-card sf-flow-card">
          <h3>{T('代祷时段', 'Intercession Session')}</h3>
          {session.items.map((item) => <div className="sf-insight-row" key={item.id}><b>{item.request.title}</b><p>{generateIntercessionPrompt(item.request).samplePrayer}</p><button type="button" onClick={() => markPrayed(item)}>{item.prayed ? T('已祷告', 'Prayed') : T('标记已祷告', 'Mark Prayed')}</button></div>)}
          <button className="sf-primary" type="button" onClick={completeSession}>{T('完成代祷时段', 'Complete Intercession Session')}</button>
        </article>
      )}
      <AnsweredPrayerTimeline requests={answered} />
      {notice && <p className={notice.includes('urgent') || notice.includes('sensitive') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

function IntercessionRequestCard({ request, onAnswered }) {
  const prompt = generateIntercessionPrompt(request)
  return <div className="sf-insight-row"><b>{request.title}</b><p>{prompt.prayerDirection}</p><span>{request.category} · {request.urgency}</span>{request.privacyWarning && <p className="sf-warning">{request.privacyWarning}</p>}<button type="button" onClick={onAnswered}>{T('标记蒙应允', 'Mark Answered')}</button></div>
}

function AnsweredPrayerTimeline({ requests }) {
  return <article className="sf-card"><h3>{T('蒙应允祷告时间线', 'Answered Prayer Timeline')}</h3>{requests.length ? requests.map((request) => <div className="sf-insight-row" key={request.id}><b>{request.title}</b><p>{request.answeredSummary}</p><span>{request.answeredAt ? new Date(request.answeredAt).toLocaleDateString() : T('已应允', 'answered')}</span></div>) : <p className="sf-empty">{T('蒙应允的祷告会显示在这里。', 'Answered prayers will appear here.')}</p>}</article>
}

export function PsalmPrayerGuide({ userId, sessions, onSaveSession }) {
  const [emotion, setEmotion] = useState('anxiety')
  const [mode, setMode] = useState('trust')
  const [selectedPsalm, setSelectedPsalm] = useState(23)
  const [session, setSession] = useState(sessions.find((item) => !item.completedAt) || null)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const recommendations = recommendPsalm(emotion, mode)
  const activeMovement = session?.movements?.[session.activeMovementIndex]

  function start() {
    const next = startPsalmPrayerSession(userId, selectedPsalm, mode, [emotion])
    onSaveSession(next)
    setSession(next)
    setDraft('')
  }

  function submit() {
    const result = submitPsalmMovement(session, activeMovement.movementKey, draft)
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    const next = result.session.activeMovementIndex >= result.session.movements.length ? completePsalmPrayerSession(result.session) : result.session
    onSaveSession(next)
    setSession(next)
    setDraft('')
    if (next.completedAt) setNotice(T('诗篇祷告已完成。', 'Psalm prayer completed.'))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('诗篇祷告', 'Psalm Prayer')}</h2><p>{T('操练赞美、哀歌、认罪、感恩、信靠与盼望，不强迫积极。', 'Pray praise, lament, confession, thanksgiving, trust, and hope without forced positivity.')}</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>{T('推荐一篇诗篇', 'Recommend a Psalm')}</h3>
          <label>{T('情绪或需要', 'Emotion or need')}<input value={emotion} onChange={(event) => setEmotion(event.target.value)} /></label>
          <label>{T('模式', 'Mode')}<select value={mode} onChange={(event) => setMode(event.target.value)}><option>guided</option><option>lament</option><option>praise</option><option>confession</option><option>thanksgiving</option><option>trust</option><option>free_prayer</option></select></label>
          <div className="sf-chip-row">{recommendations.map((psalm) => <button className={`sf-chip-btn ${selectedPsalm === psalm.psalmNumber ? 'active' : ''}`} type="button" key={psalm.id} onClick={() => setSelectedPsalm(psalm.psalmNumber)}>Psalm {psalm.psalmNumber}</button>)}</div>
          <button className="sf-primary" type="button" onClick={start}>{T('开始诗篇祷告', 'Start Psalm Prayer')}</button>
        </article>
        <PsalmTextDisplay psalm={psalmProfiles.find((item) => item.psalmNumber === Number(selectedPsalm))} />
      </div>
      {session && !session.completedAt && activeMovement && (
        <article className="sf-card sf-flow-card">
          <div className="sf-stage-pills">{session.movements.map((movement, index) => <span className={index === session.activeMovementIndex ? 'active' : ''} key={movement.id}>{movement.movementKey.replace(/_/g, ' ')}</span>)}</div>
          <h3>{activeMovement.movementKey.replace(/_/g, ' ')}</h3>
          <p>{activeMovement.aiGuidance}</p>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={T('写下一段真实、由诗篇塑造的祷告。', 'Write an honest Psalm-shaped prayer.')} />
          <button className="sf-primary" type="button" onClick={submit}>{T('保存这一段', 'Save Movement')}</button>
        </article>
      )}
      {session?.completedAt && <PrayerSessionSummary title={T('诗篇祷告摘要', 'Psalm Prayer Summary')} items={[{ label: T('诗篇', 'Psalm'), value: `Psalm ${session.psalmNumber}` }, { label: T('模式', 'Mode'), value: session.selectedMode }, { label: T('摘要', 'Summary'), value: session.summary }]} />}
      {notice && <p className={notice.includes('urgent') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

function PsalmTextDisplay({ psalm }) {
  if (!psalm) return null
  return <article className="sf-card"><h3>{T('诗篇', 'Psalm')} {psalm.psalmNumber}: {psalm.title}</h3><p>{psalm.text}</p><div className="sf-chip-row">{psalm.dominantEmotions.map((emotion) => <span className="sf-chip" key={emotion}>{emotion}</span>)}</div>{psalm.cautionNotes && <p className="sf-warning">{psalm.cautionNotes}</p>}</article>
}

export function PracticingPresenceCheckIn({ userId, checkins, rules, onSaveCheckin, onSaveRule }) {
  const [contextLabel, setContextLabel] = useState('work')
  const [emotionalState, setEmotionalState] = useState('anxiety')
  const [awarenessBefore, setAwarenessBefore] = useState(4)
  const [awarenessAfter, setAwarenessAfter] = useState(6)
  const [activeCheckin, setActiveCheckin] = useState(null)
  const [shortPrayer, setShortPrayer] = useState('')
  const [returnAction, setReturnAction] = useState('')
  const [notice, setNotice] = useState('')
  const recommendation = recommendPresencePractice(contextLabel, emotionalState)
  const reflection = generatePresenceReflection(userId, checkins)
  const overburdened = detectOverburdeningRule(rules)

  function start() {
    const result = createPresenceCheckin(userId, { contextLabel, emotionalState, awarenessBefore, practice: recommendation })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveCheckin(result.checkin)
    setActiveCheckin(result.checkin)
    setShortPrayer(result.checkin.practice.description)
  }

  function complete() {
    const result = completePresenceCheckin(activeCheckin, { awarenessAfter, shortPrayer, returnAction })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveCheckin(result.checkin)
    setActiveCheckin(result.checkin)
    setNotice(result.guidance.message)
  }

  function addRule() {
    const rule = createPresenceRule(userId, { title: `${contextLabel} presence pause`, triggerConfig: { contexts: [contextLabel] }, practiceId: recommendation.id })
    onSaveRule(rule)
    setNotice(T('同在规则已创建。', 'Presence rule created.'))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('操练与神同在', 'Practicing Presence')}</h2><p>{T('在工作、冲突、疲惫、通勤和试探中，用短小、具体的方式归回神。', 'Short, embodied returns to God in ordinary work, conflict, fatigue, commute, and temptation.')}</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>{T('此刻与神同在', 'Presence Now')}</h3>
          <label>{T('情境', 'Context')}<select value={contextLabel} onChange={(event) => setContextLabel(event.target.value)}><option>work</option><option>coding</option><option>commute</option><option>conflict</option><option>family</option><option>temptation</option><option>fatigue</option><option>boredom</option></select></label>
          <label>{T('情绪', 'Emotion')}<input value={emotionalState} onChange={(event) => setEmotionalState(event.target.value)} /></label>
          <label>{T('开始前觉察度：', 'Awareness before: ')}{awarenessBefore}<input type="range" min="0" max="10" value={awarenessBefore} onChange={(event) => setAwarenessBefore(Number(event.target.value))} /></label>
          <PresencePracticeCard practice={recommendation} />
          <button className="sf-primary" type="button" onClick={start}>{T('开始同在打卡', 'Start Presence Check-In')}</button>
          <button type="button" onClick={addRule}>{T('创建同在规则', 'Create Presence Rule')}</button>
          {overburdened && <p className="sf-warning">{overburdened}</p>}
        </article>
        <article className="sf-card sf-flow-card">
          <h3>{T('完成打卡', 'Complete Check-In')}</h3>
          {activeCheckin ? (
            <>
              <label>{T('结束后觉察度：', 'Awareness after: ')}{awarenessAfter}<input type="range" min="0" max="10" value={awarenessAfter} onChange={(event) => setAwarenessAfter(Number(event.target.value))} /></label>
              <label>{T('短祷', 'Short prayer')}<textarea value={shortPrayer} onChange={(event) => setShortPrayer(event.target.value)} /></label>
              <label>{T('归回行动', 'Return action')}<textarea value={returnAction} onChange={(event) => setReturnAction(event.target.value)} /></label>
              <button className="sf-primary" type="button" onClick={complete}>{T('完成打卡', 'Complete Check-In')}</button>
            </>
          ) : <p className="sf-empty">{T('请先开始一次同在打卡。', 'Start a presence check-in first.')}</p>}
        </article>
      </div>
      <PrayerSessionSummary title={T('同在操练回顾', 'Presence Reflection')} items={[{ label: T('打卡总数', 'Total check-ins'), value: String(reflection.totalCheckins) }, { label: T('摘要', 'Summary'), value: reflection.summary }, { label: T('下一步调整', 'Next adjustment'), value: reflection.nextAdjustment }]} />
      {notice && <p className={notice.includes('urgent') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

function PresencePracticeCard({ practice }) {
  return <article className="sf-prayer"><b>{practice.title}</b><p>{practice.description}</p><span>{practice.durationSeconds} {T('秒', 'seconds')}</span></article>
}

export default function PrayerCommunionDashboard({ userId }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useMemo(() => loadPrayerCommunionData(userId), [userId, refreshKey])
  const dashboard = useMemo(() => buildPrayerDashboard({ userId, ...data }), [userId, data])
  const [intentText, setIntentText] = useState('I feel anxious before work and want to pray')
  const [route, setRoute] = useState(null)

  function refresh() {
    setRefreshKey((value) => value + 1)
  }

  function saveAndRefresh(fn, value) {
    fn(value)
    refresh()
  }

  function ensureDefaultRule() {
    if (!data.rules.some((rule) => rule.active)) saveAndRefresh(savePrayerRule, createDefaultPrayerRule(userId))
  }

  return (
    <section className="sf-section prayer-communion">
      <div className="sf-section-heading">
        <h2>{T('祷告与神相交系统', 'Prayer & Communion OS')}</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && (
        <>
          <div className="sf-home-grid">
            <article className="sf-card"><h3>{T('今日祷告节奏', 'Today’s Prayer Rhythm')}</h3><p>{dashboard.today.activePrayerRule.title}</p><p>{dashboard.today.completedPrayerSessions}/{dashboard.today.prayerSlots.length} {T('已完成', 'completed')}</p><button type="button" onClick={() => { ensureDefaultRule(); setTab('rule') }}>{T('打开祷告规则', 'Open Prayer Rule')}</button></article>
            <article className="sf-card"><h3>{T('到期代祷', 'Intercession Due')}</h3><p>{dashboard.today.intercessionDueCount} {T('项到期', 'request(s) due')}</p><button type="button" onClick={() => setTab('intercession')}>{T('打开代祷', 'Open Intercession')}</button></article>
            <article className="sf-card"><h3>{T('推荐诗篇', 'Recommended Psalm')}</h3><p>{T('诗篇', 'Psalm')} {dashboard.today.recommendedPsalm.psalmNumber}: {dashboard.today.recommendedPsalm.title}</p><button type="button" onClick={() => setTab('psalms')}>{T('用诗篇祷告', 'Pray Psalm')}</button></article>
            <article className="sf-card"><h3>{T('此刻操练同在', 'Practice Presence Now')}</h3><p>{dashboard.today.presenceRecommendation.title}</p><button type="button" onClick={() => setTab('presence')}>{T('开始打卡', 'Start Check-In')}</button></article>
          </div>
          <article className="sf-card sf-flow-card">
            <h3>{T('祷告编排器', 'Prayer Orchestrator')}</h3>
            <label>{T('意向', 'Intent')}<textarea value={intentText} onChange={(event) => setIntentText(event.target.value)} /></label>
            <button type="button" onClick={() => setRoute(orchestratePrayerIntent(userId, intentText, { emotion: 'anxiety', lifeContext: 'work' }))}>{T('路由意向', 'Route Intent')}</button>
            {route && <p className={route.route === 'crisis_care' ? 'sf-warning' : 'sf-success'}>{route.route}: {route.message}</p>}
          </article>
          <PrayerSessionSummary title={T('每周祷告回顾', 'Weekly Prayer Review')} items={[{ label: T('祷告时段', 'Prayer sessions'), value: String(dashboard.weeklySummary.prayerSessionsCompleted) }, { label: T('蒙应允祷告', 'Answered prayers'), value: String(dashboard.weeklySummary.answeredPrayersCount) }, { label: T('诗篇时段', 'Psalm sessions'), value: String(dashboard.weeklySummary.psalmPrayerSessions) }, { label: T('同在打卡', 'Presence check-ins'), value: String(dashboard.weeklySummary.presenceCheckins) }, { label: T('洞察', 'Insights'), value: dashboard.formationInsights }]} />
          <AnsweredPrayerTimeline requests={data.prayerRequests.filter((request) => request.status === 'answered')} />
        </>
      )}
      {tab === 'rule' && <PrayerRuleCard userId={userId} rules={data.rules} sessions={data.prayerSessions} onSaveRule={(rule) => saveAndRefresh(savePrayerRule, rule)} onSaveSession={(session) => saveAndRefresh(savePrayerSession, session)} />}
      {tab === 'intercession' && <IntercessionList userId={userId} targets={data.intercessionTargets} requests={data.prayerRequests} onSaveTarget={(target) => saveAndRefresh(saveIntercessionTarget, target)} onSaveRequest={(request) => saveAndRefresh(savePrayerRequest, request)} onSaveSession={(session) => saveAndRefresh(saveIntercessionSession, session)} />}
      {tab === 'psalms' && <PsalmPrayerGuide userId={userId} sessions={data.psalmSessions} onSaveSession={(session) => saveAndRefresh(savePsalmSession, session)} />}
      {tab === 'presence' && <PracticingPresenceCheckIn userId={userId} checkins={data.presenceCheckins} rules={data.presenceRules} onSaveCheckin={(checkin) => saveAndRefresh(savePresenceCheckin, checkin)} onSaveRule={(rule) => saveAndRefresh(savePresenceRule, rule)} />}
      <article className="sf-card"><h3>{T('祷告模板', 'Prayer templates')}</h3><div className="sf-chip-row">{prayerTemplates.map((template) => <span className="sf-chip" key={template.id}>{template.title}</span>)}</div><div className="sf-chip-row">{presencePractices.slice(0, 5).map((practice) => <span className="sf-chip" key={practice.id}>{practice.title}</span>)}</div></article>
    </section>
  )
}

function splitList(value = '') {
  return String(value).split(/\n|,/).map((item) => item.trim()).filter(Boolean)
}
