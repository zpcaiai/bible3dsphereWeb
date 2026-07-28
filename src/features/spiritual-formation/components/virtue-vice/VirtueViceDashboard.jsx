import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { fruitDimensions, temptationTypes, vices, virtues } from '../../data/virtueViceSeed'
import {
  buildVirtueViceDashboard,
  calculateFruitTrends,
  createFruitAssessment,
  createFruitFeedbackRequest,
  createTemptationCheckin,
  createTemptationPlan,
  createViceObservation,
  createVirtueFocus,
  detectVices,
  generateFruitInsight,
  generateVirtueReflection,
  logVirtuePractice,
  orchestrateVirtueViceIntent,
  realTimeResistance,
  recommendVirtues,
  reviewTemptationFailure,
  suggestVirtuePractices,
} from '../../lib/virtueViceEngine'
import {
  loadVirtueViceData,
  saveFailureReview,
  saveFruitAssessment,
  saveFruitFeedbackRequest,
  saveTemptationCheckin,
  saveTemptationPlan,
  saveViceObservation,
  saveVicePattern,
  saveVirtueFocus,
  saveVirtueLog,
} from '../../lib/virtueViceStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'
import { BarSeries, Radar } from '../../../../components/charts'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', T('总览', 'Dashboard')],
    ['virtues', T('德性', 'Virtues')],
    ['vices', T('罪性', 'Vices')],
    ['temptation', T('试探', 'Temptation')],
    ['fruit', T('果子', 'Fruit')],
  ]
  return <nav className="sf-tabs" aria-label={T('德性与罪性分区', 'Virtue Vice sections')}>{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function SummaryCard({ title, items }) {
  return (
    <article className="sf-card sf-summary-card">
      <h3>{title}</h3>
      <dl>{items.filter((item) => item.value !== undefined && item.value !== null && item.value !== '').map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value) ? item.value.join(', ') : item.value}</dd></div>)}</dl>
    </article>
  )
}

export function VirtueDashboard({ userId, focuses, logs, onSaveFocus, onSaveLog }) {
  const [contextText, setContextText] = useState('I keep reacting with anger in family conflict')
  const [selectedVirtue, setSelectedVirtue] = useState('patience')
  const [activeFocus, setActiveFocus] = useState(focuses.find((focus) => focus.status === 'active') || null)
  const [selectedPracticeId, setSelectedPracticeId] = useState('')
  const [reflection, setReflection] = useState('')
  const [notice, setNotice] = useState('')
  const recommendations = recommendVirtues(contextText)
  const practices = activeFocus ? suggestVirtuePractices(activeFocus) : []

  function createFocus() {
    const focus = createVirtueFocus(userId, selectedVirtue, { focusReason: contextText, baselineSelfScore: 5 })
    onSaveFocus(focus)
    setActiveFocus(focus)
    setSelectedPracticeId('')
    setNotice(T('德性焦点已创建。', 'Virtue focus created.'))
  }

  function logPractice() {
    const practice = practices.find((item) => item.id === selectedPracticeId) || practices[0]
    const result = logVirtuePractice(userId, activeFocus, practice, {
      userReflection: reflection,
      graceNoticed: 'I noticed one small grace to practice.',
      nextStep: 'Repeat this practice tomorrow.',
    })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveLog(result.log)
    setReflection('')
    setNotice(result.guidance.message)
  }

  const virtueReflection = activeFocus ? generateVirtueReflection(userId, activeFocus, logs) : null
  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('德性塑造', 'Virtue Formation')}</h2><p>{T('由恩典驱动的焦点、操练、记录与反思。', 'Grace-driven focus, practices, logs, and reflection.')}</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>{T('推荐德性', 'Recommend Virtues')}</h3>
          <label>{T('处境', 'Context')}<textarea value={contextText} onChange={(event) => setContextText(event.target.value)} /></label>
          <div className="sf-chip-row">{recommendations.map((virtue) => <button key={virtue.key} className={`sf-chip-btn ${selectedVirtue === virtue.key ? 'active' : ''}`} type="button" onClick={() => setSelectedVirtue(virtue.key)}>{virtue.displayName}</button>)}</div>
          <button className="sf-primary" type="button" onClick={createFocus}>{T('创建德性焦点', 'Create Virtue Focus')}</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>{T('当前焦点', 'Active Focus')}</h3>
          {activeFocus ? (
            <>
              <p><b>{activeFocus.virtue.displayName}</b></p>
              <p>{activeFocus.focusReason}</p>
              <label>{T('操练', 'Practice')}<select value={selectedPracticeId} onChange={(event) => setSelectedPracticeId(event.target.value)}><option value="">{T('选择操练', 'Choose practice')}</option>{practices.map((practice) => <option key={practice.id} value={practice.id}>{practice.title}</option>)}</select></label>
              {practices[0] && <VirtuePracticeCard practice={practices.find((item) => item.id === selectedPracticeId) || practices[0]} />}
              <label>{T('反思', 'Reflection')}<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} /></label>
              <button className="sf-primary" type="button" onClick={logPractice}>{T('记录操练', 'Log Practice')}</button>
            </>
          ) : <p className="sf-empty">{T('创建一个德性焦点来开始。', 'Create a virtue focus to begin.')}</p>}
        </article>
      </div>
      {virtueReflection && <SummaryCard title={T('德性反思', 'Virtue Reflection')} items={[{ label: T('摘要', 'Summary'), value: virtueReflection.summary }, { label: T('成长证据', 'Growth evidence'), value: virtueReflection.growthEvidence }, { label: T('调整', 'Adjustments'), value: virtueReflection.suggestedAdjustments }]} />}
      {notice && <p className={notice.includes('shame') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

function VirtuePracticeCard({ practice }) {
  return <article className="sf-prayer"><b>{practice.title}</b><p>{practice.instructions}</p><span>{practice.practiceType} · {practice.durationMinutes || 5} min</span></article>
}

export function VicePatternAnalyzer({ userId, observations, patterns, onSaveObservation, onSavePattern }) {
  const [text, setText] = useState('I replied harshly because I needed to control the conversation')
  const [analysis, setAnalysis] = useState(null)
  const [notice, setNotice] = useState('')

  function analyze() {
    const result = detectVices(text, { source: 'manual' })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    setAnalysis(result.analysis)
    setNotice(result.guidance.message)
  }

  function save() {
    const result = createViceObservation(userId, { situationSummary: text, behavior: text, contextLabel: 'manual', emotionBefore: ['pressure'] })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveObservation(result.observation)
    onSavePattern(result.pattern)
    setAnalysis(detectVices(text).analysis)
    setNotice(T('观察已保存。这只是一个可能的模式，不是你的身份。', 'Observation saved. This is a possible pattern, not your identity.'))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('罪性模式识别', 'Vice Pattern Detection')}</h2><p>{T('不带羞耻和身份标签地察觉可能重复出现的模式。', 'Notice possible recurring patterns without shame or identity labels.')}</p></div>
      <article className="sf-card sf-flow-card">
        <label>{T('处境', 'Situation')}<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
        <button className="sf-primary" type="button" onClick={analyze}>{T('分析模式', 'Analyze Pattern')}</button>
        {analysis && (
          <div className="sf-success">
            <b>{analysis.toneWarning}</b>
            <p>{analysis.surfaceBehavior}</p>
            <p>{T('可能的罪性：', 'Possible vices: ')}{analysis.possibleVices.map((item) => `${item.viceKey} (${Math.round(item.confidence * 100)}%)`).join(', ')}</p>
            <p>{T('相反的德性：', 'Opposite virtues: ')}{analysis.oppositeVirtues.join(', ')}</p>
            <p>{analysis.suggestedNextStep}</p>
            <button type="button" onClick={save}>{T('确认并保存观察', 'Confirm and Save Observation')}</button>
          </div>
        )}
      </article>
      <div className="sf-home-grid">
        <SummaryCard title={T('需要留意的模式', 'Watch Patterns')} items={[{ label: T('模式', 'Patterns'), value: patterns.map((pattern) => pattern.title) }, { label: T('观察', 'Observations'), value: String(observations.length) }]} />
        <article className="sf-card"><h3>{T('罪性种子库', 'Seed Vices')}</h3><div className="sf-chip-row">{vices.map((vice) => <span className="sf-chip" key={vice.key}>{vice.displayName}</span>)}</div></article>
      </div>
      {notice && <p className={notice.includes('shame') || notice.includes('crisis') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

export function TemptationResistancePlan({ userId, plans, checkins, onSavePlan, onSaveCheckin, onSaveFailureReview }) {
  const [typeKey, setTypeKey] = useState('anger')
  const [text, setText] = useState('I am tempted right now to answer in anger')
  const [intensity, setIntensity] = useState(6)
  const [response, setResponse] = useState(null)
  const [activePlan, setActivePlan] = useState(plans.find((plan) => plan.status === 'active') || null)
  const [notice, setNotice] = useState('')

  function createPlan() {
    const plan = createTemptationPlan(userId, typeKey)
    onSavePlan(plan)
    setActivePlan(plan)
    setNotice('Temptation plan created.')
  }

  function resist() {
    const result = realTimeResistance(userId, text, { intensity })
    if (result.routed) {
      setNotice(result.response.message)
      return
    }
    setResponse(result.response)
  }

  function logOutcome(outcome = 'resisted') {
    const plan = activePlan || createTemptationPlan(userId, typeKey)
    if (!activePlan) onSavePlan(plan)
    const result = createTemptationCheckin(userId, plan, { triggerText: text, temptationIntensityBefore: intensity, outcome })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveCheckin(result.checkin)
    if (outcome === 'failed') {
      const review = reviewTemptationFailure(userId, result.checkin, { whatHappened: text, shameLevel: 5 })
      onSaveFailureReview(review)
      setNotice(T('失败回顾已创建。请温柔地转向认罪，并调整一个触发点。', 'Failure review created. Route gently to confession and adjust one trigger.'))
    } else {
      setNotice(T('试探打卡已保存。', 'Temptation check-in saved.'))
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('试探抵抗', 'Temptation Resistance')}</h2><p>{T('试探不是身份。尽早选择逃避、替换和支持。', 'Temptation is not identity. Choose escape, replacement, and support early.')}</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>{T('创建计划', 'Create Plan')}</h3>
          <label>{T('类型', 'Type')}<select value={typeKey} onChange={(event) => setTypeKey(event.target.value)}>{temptationTypes.map((type) => <option key={type.key} value={type.key}>{type.displayName}</option>)}</select></label>
          <button className="sf-primary" type="button" onClick={createPlan}>{T('创建试探抵抗计划', 'Create Temptation Plan')}</button>
          {activePlan && <SummaryCard title={activePlan.title} items={[{ label: T('警讯', 'Warning signs'), value: activePlan.earlyWarningSigns }, { label: T('逃避路径', 'Escape'), value: activePlan.escapeActions }, { label: T('替换行动', 'Replacement'), value: activePlan.replacementActions }]} />}
        </article>
        <article className="sf-card sf-flow-card">
          <h3>{T('实时抵抗', 'Real-time resistance')}</h3>
          <label>{T('试探时刻', 'Temptation moment')}<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
          <label>{T('强度：', 'Intensity: ')}{intensity}<input type="range" min="0" max="10" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label>
          <button className="sf-primary" type="button" onClick={resist}>{T('获取抵抗引导', 'Get Resistance Guidance')}</button>
          {response && <div className="sf-success"><b>{response.message}</b><p>{response.firstStep}</p><p>{T('逃避：', 'Escape: ')}{response.escapeActions.join(', ')}</p><p>{T('替换：', 'Replacement: ')}{response.replacementActions.join(', ')}</p><p>{response.accountabilitySuggestion}</p></div>}
          <div className="sf-plan-actions"><button type="button" onClick={() => logOutcome('resisted')}>{T('记录已抵抗', 'Log Resisted')}</button><button type="button" onClick={() => logOutcome('failed')}>{T('记录失败回顾', 'Log Failure Review')}</button></div>
        </article>
      </div>
      <SummaryCard title={T('试探摘要', 'Temptation Summary')} items={[{ label: T('计划', 'Plans'), value: String(plans.length) }, { label: T('打卡', 'Check-ins'), value: String(checkins.length) }]} />
      {notice && <p className={notice.includes('Failure') || notice.includes('crisis') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

// 德性与罪性从来不是两张互不相干的表：每个德性在种子库里都写着它的对头罪性（oppositeVices）。
// 只有把「我在操练什么」和「什么正在反复发生」叠在同一组轴上，这场对峙才有形状可看；
// 拆成两张图，人只会看自己愿意看的那一张。
const CONTRAST_MIN_AXES = 3

function buildVirtueViceContrast({ focuses = [], virtueLogs = [], observations = [] }) {
  const virtueKeyByFocusId = Object.fromEntries(focuses.map((focus) => [focus.id, focus.virtueKey]))
  const practiceCounts = {}
  virtueLogs.forEach((log) => {
    const key = virtueKeyByFocusId[log.virtueFocusId]
    if (key) practiceCounts[key] = (practiceCounts[key] || 0) + 1
  })
  // 只数观察本身。模式（patterns）是同一次观察派生出来的，一起数会把一件事算两遍。
  const viceCounts = {}
  observations.forEach((observation) => {
    const keys = [...(observation.userNamedVices || []), ...(observation.aiSuggestedVices || [])]
    Array.from(new Set(keys)).forEach((viceKey) => { viceCounts[viceKey] = (viceCounts[viceKey] || 0) + 1 })
  })
  const focusedKeys = new Set(focuses.map((focus) => focus.virtueKey))
  const rows = virtues.map((virtue) => ({
    key: virtue.key,
    label: virtue.displayName,
    practice: practiceCounts[virtue.key] || 0,
    vice: (virtue.oppositeVices || []).reduce((sum, viceKey) => sum + (viceCounts[viceKey] || 0), 0),
  })).filter((row) => focusedKeys.has(row.key) || row.practice > 0 || row.vice > 0)
  return { rows, max: Math.max(1, ...rows.map((row) => Math.max(row.practice, row.vice))) }
}

function VirtueViceContrast({ data }) {
  const { rows, max } = useMemo(() => buildVirtueViceContrast(data), [data])
  const practiceName = T('德性操练', 'Virtue practice')
  const viceName = T('对头罪性', 'Opposing vice')
  const title = T('德性与罪性对峙', 'Virtue and vice contrast')
  const subtitle = T('看两个形状的落差：操练在哪一条轴上落后于对头罪性出现的次数，那里就是这一季的战场。', 'Watch the gap between the two shapes: where practice lags behind the opposing vice is this season battleground.')

  if (!rows.length) {
    return (
      <article className="sf-card">
        <h3>{title}</h3>
        <p className="sf-empty">{T('还没有可以对峙的数据。先创建一个德性焦点、记录一次操练，或保存一次罪性观察。', 'No contrast data yet. Create a virtue focus, log one practice, or save one vice observation first.')}</p>
      </article>
    )
  }

  // 少于三个轴时雷达会退化成一条线，读不出「形状」；此时排序条更诚实。
  if (rows.length < CONTRAST_MIN_AXES) {
    return (
      <BarSeries
        title={title}
        subtitle={subtitle}
        items={rows.flatMap((row) => [
          { label: `${row.label} · ${practiceName}`, value: row.practice },
          { label: `${row.label} · ${viceName}`, value: row.vice },
        ])}
        unit={T(' 次', '')}
      />
    )
  }

  return (
    <Radar
      title={title}
      subtitle={subtitle}
      axes={rows.map((row) => ({ key: row.key, label: row.label }))}
      series={[
        { name: practiceName, values: Object.fromEntries(rows.map((row) => [row.key, row.practice])) },
        { name: viceName, values: Object.fromEntries(rows.map((row) => [row.key, row.vice])) },
      ]}
      max={max}
    />
  )
}

export function FruitOfSpiritTracker({ userId, assessments, feedbackRequests, onSaveAssessment, onSaveFeedback }) {
  const [scores, setScores] = useState(() => Object.fromEntries(fruitDimensions.map((dimension) => [dimension.key, 5])))
  const [evidence, setEvidence] = useState('')
  const [notice, setNotice] = useState('')
  const trends = calculateFruitTrends(userId, assessments)
  const insight = generateFruitInsight(userId, assessments)
  // 上一次「已保存」的评估（trend.latestScore）；滑杆上的 scores 还没入库，两者叠在一起才看得出方向。
  const savedScores = Object.fromEntries(trends.filter((trend) => trend.latestScore != null).map((trend) => [trend.fruitKey, trend.latestScore]))
  const fruitSeries = [{ name: T('本次自评', 'This self-assessment'), values: scores }]
  if (Object.keys(savedScores).length) fruitSeries.push({ name: T('上次已保存', 'Last saved assessment'), values: savedScores })

  function saveAssessment() {
    const result = createFruitAssessment(userId, {
      scores,
      evidence: Object.fromEntries(fruitDimensions.map((dimension) => [dimension.key, evidence])),
      contextLabel: 'overall',
      notes: 'Weekly self-reflection indicator.',
    })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveAssessment(result.assessment)
    setNotice(result.guidance.message)
  }

  function draftFeedback() {
    const request = createFruitFeedbackRequest(userId, { recipientLabel: 'mentor', requestedDimensions: ['love', 'patience', 'self_control'] })
    onSaveFeedback(request)
    setNotice(T('反馈请求草稿已创建。', 'Feedback request drafted.'))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('圣灵果子追踪', 'Fruit of the Spirit Tracker')}</h2><p>{T('谦卑的长期指标，不是属灵排名。', 'Humble long-term indicators, not spiritual ranking.')}</p></div>
      <article className="sf-card sf-flow-card">
        <h3>{T('自我评估', 'Self Assessment')}</h3>
        <div className="sf-home-grid">{fruitDimensions.map((dimension) => <label key={dimension.key}>{dimension.displayName}: {scores[dimension.key]}<input type="range" min="1" max="10" value={scores[dimension.key]} onChange={(event) => setScores({ ...scores, [dimension.key]: Number(event.target.value) })} /></label>)}</div>
        {/* 九个果子是一个整体的形状，不是九个孤立的数字：滑杆只能一格一格读，
            雷达一次把凹进去的方向显出来；叠上一次已保存的评估，才分得清是长了还是退了。 */}
        <Radar
          title={T('圣灵果子九维形状', 'Nine-dimension fruit shape')}
          subtitle={T('看凹进去的方向，不看总分——那里是这一季最需要恩典的地方，不是排名。', 'Read the dents, not the total: that is where grace is most needed this season, and it is not a ranking.')}
          axes={fruitDimensions.map((dimension) => ({ key: dimension.key, label: dimension.displayName }))}
          series={fruitSeries}
          max={10}
        />
        <label>{T('证据', 'Evidence')}<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder={T('哪里看见了果子，或哪里感到抗拒？', 'Where did fruit appear or feel resisted?')}  aria-label={T('哪里看见了果子，或哪里感到抗拒？', 'Where did fruit appear or feel resisted?')}/></label>
        <button className="sf-primary" type="button" onClick={saveAssessment}>{T('保存果子评估', 'Save Fruit Assessment')}</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title={T('果子成长洞察', 'Fruit Growth Insight')} items={[{ label: T('摘要', 'Summary'), value: insight.summary }, { label: T('要培养的德性', 'Virtues to cultivate'), value: insight.relatedVirtuesToCultivate }, { label: T('需留意的罪性', 'Vices to watch'), value: insight.relatedVicesToWatch }, { label: T('操练', 'Practices'), value: insight.recommendedPractices }]} />
        <article className="sf-card"><h3>{T('果子趋势', 'Fruit Trends')}</h3>{trends.map((trend) => <div className="sf-insight-row" key={trend.fruitKey}><b>{trend.displayName}</b><p>{T('最新', 'Latest')} {trend.latestScore || '—'} · {T('平均', 'avg')} {trend.averageScore || '—'} · {T('变化', 'delta')} {trend.delta}</p><span>{trend.suggestedPractice}</span></div>)}</article>
        <article className="sf-card sf-flow-card"><h3>{T('反馈请求', 'Feedback Request')}</h3><p>{T('请一位可信信徒给你一个鼓励和一个成长方向。', 'Ask a trusted believer for one encouragement and one growth area.')}</p><button type="button" onClick={draftFeedback}>{T('草拟反馈请求', 'Draft Feedback Request')}</button><p className="sf-muted">{feedbackRequests.length} {T('份草稿', 'draft(s)')}</p></article>
      </div>
      {notice && <p className={notice.includes('shame') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

export default function VirtueViceDashboard({ userId }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [intentText, setIntentText] = useState('I keep losing patience with my family')
  const [route, setRoute] = useState(null)
  const data = useMemo(() => loadVirtueViceData(userId), [userId, refreshKey])
  const dashboard = useMemo(() => buildVirtueViceDashboard({ userId, ...data }), [userId, data])

  function refresh() {
    setRefreshKey((value) => value + 1)
  }

  function saveAndRefresh(fn, value) {
    fn(value)
    refresh()
  }

  return (
    <section className="sf-section virtue-vice">
      <div className="sf-section-heading"><h2>{T('德性与罪性塑造系统', 'Virtue & Vice Formation OS')}</h2><p>{MODULE_DISCLAIMER}</p></div>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && (
        <>
          <div className="sf-home-grid">
            <article className="sf-card"><h3>{T('当前德性焦点', 'Active Virtue Focus')}</h3><p>{dashboard.today.activeVirtueFocuses[0]?.virtue.displayName || T('暂无当前焦点', 'No active focus')}</p><button type="button" onClick={() => setTab('virtues')}>{T('打开德性', 'Open Virtues')}</button></article>
            <article className="sf-card"><h3>{T('需要留意的模式', 'Watch Patterns')}</h3><p>{dashboard.today.activeVicePatterns.length} {T('个模式', 'pattern(s)')}</p><button type="button" onClick={() => setTab('vices')}>{T('分析模式', 'Analyze Pattern')}</button></article>
            <article className="sf-card"><h3>{T('试探计划', 'Temptation Plans')}</h3><p>{dashboard.today.activeTemptationPlans.length} {T('个进行中计划', 'active plan(s)')}</p><button type="button" onClick={() => setTab('temptation')}>{T('打开抵抗', 'Open Resistance')}</button></article>
            <article className="sf-card"><h3>{T('果子快照', 'Fruit Snapshot')}</h3><p>{dashboard.today.fruitAssessmentDue ? T('需要评估', 'Assessment due') : T('今日已完成评估', 'Assessment complete today')}</p><button type="button" onClick={() => setTab('fruit')}>{T('打开果子追踪', 'Open Fruit Tracker')}</button></article>
          </div>
          <VirtueViceContrast data={data} />
          <article className="sf-card sf-flow-card">
            <h3>{T('德性/罪性编排器', 'Virtue/Vice Orchestrator')}</h3>
            <label>{T('意向', 'Intent')}<textarea value={intentText} onChange={(event) => setIntentText(event.target.value)} /></label>
            <button type="button" onClick={() => setRoute(orchestrateVirtueViceIntent(userId, intentText, { emotion: 'anger', lifeContext: 'family' }))}>{T('路由意向', 'Route Intent')}</button>
            {route && <p className={route.route === 'crisis_care' ? 'sf-warning' : 'sf-success'}>{route.route}: {route.message}</p>}
          </article>
          <SummaryCard title={T('每周塑造回顾', 'Weekly Formation Review')} items={[{ label: T('德性记录', 'Virtue logs'), value: String(dashboard.weeklySummary.virtuePracticesLogged) }, { label: T('罪性观察', 'Vice observations'), value: String(dashboard.weeklySummary.viceObservationsLogged) }, { label: T('试探打卡', 'Temptation check-ins'), value: String(dashboard.weeklySummary.temptationCheckins) }, { label: T('抵抗成功', 'Resistance success'), value: String(dashboard.weeklySummary.resistanceSuccessCount) }, { label: T('果子评估', 'Fruit assessments'), value: String(dashboard.weeklySummary.fruitAssessmentsCompleted) }]} />
          <article className="sf-card"><h3>{T('今日操练', 'Today’s Practice')}</h3><p>{dashboard.today.recommendedPractice.title}</p><p>{dashboard.today.recommendedPractice.instructions}</p></article>
        </>
      )}
      {tab === 'virtues' && <VirtueDashboard userId={userId} focuses={data.focuses} logs={data.virtueLogs} onSaveFocus={(focus) => saveAndRefresh(saveVirtueFocus, focus)} onSaveLog={(log) => saveAndRefresh(saveVirtueLog, log)} />}
      {tab === 'vices' && <VicePatternAnalyzer userId={userId} observations={data.observations} patterns={data.patterns} onSaveObservation={(observation) => saveAndRefresh(saveViceObservation, observation)} onSavePattern={(pattern) => saveAndRefresh(saveVicePattern, pattern)} />}
      {tab === 'temptation' && <TemptationResistancePlan userId={userId} plans={data.temptationPlans} checkins={data.temptationCheckins} onSavePlan={(plan) => saveAndRefresh(saveTemptationPlan, plan)} onSaveCheckin={(checkin) => saveAndRefresh(saveTemptationCheckin, checkin)} onSaveFailureReview={(review) => saveAndRefresh(saveFailureReview, review)} />}
      {tab === 'fruit' && <FruitOfSpiritTracker userId={userId} assessments={data.fruitAssessments} feedbackRequests={data.feedbackRequests} onSaveAssessment={(assessment) => saveAndRefresh(saveFruitAssessment, assessment)} onSaveFeedback={(request) => saveAndRefresh(saveFruitFeedbackRequest, request)} />}
      <article className="sf-card"><h3>{T('塑造种子库', 'Seed Formation Library')}</h3><div className="sf-chip-row">{virtues.map((virtue) => <span className="sf-chip" key={virtue.key}>{virtue.displayName}</span>)}</div><div className="sf-chip-row">{fruitDimensions.map((fruit) => <span className="sf-chip" key={fruit.key}>{fruit.displayName}</span>)}</div></article>
    </section>
  )
}
