import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { beliefDomains, gospelFrameTemplates, idolCategories } from '../../data/worldviewFormationSeed'
import {
  addCounselInput,
  addDecisionOption,
  buildWorldviewDashboard,
  confirmBeliefObservation,
  confirmIdolObservation,
  createBeliefDiagnosticSession,
  createBeliefObservation,
  createGospelReframingSession,
  createIdolObservation,
  createDecisionSession,
  detectIdols,
  diagnoseBeliefs,
  generateBeliefPatternReview,
  generateDecisionSummary,
  generateFullReframing,
  generateIdolPatternReview,
  oneShotDiscernment,
  orchestrateWorldviewIntent,
  recommendSurrenderPractices,
  recommendValueWeights,
  runMotiveCheck,
  scoreDecisionOptions,
} from '../../lib/worldviewFormationEngine'
import {
  loadWorldviewFormationData,
  saveBeliefObservation,
  saveBeliefPattern,
  saveBeliefReview,
  saveBeliefSession,
  saveCounselInput,
  saveDecisionOption,
  saveDecisionSession,
  saveDecisionSummary,
  saveGospelAction,
  saveGospelSession,
  saveIdolObservation,
  saveIdolPattern,
  saveIdolReview,
  saveMotiveCheck,
  saveValueWeight,
} from '../../lib/worldviewFormationStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['beliefs', 'Beliefs'],
    ['idols', 'Idols'],
    ['reframing', 'Reframing'],
    ['discernment', 'Discernment'],
  ]
  return <nav className="sf-tabs" aria-label="Worldview Formation sections">{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function Notice({ text }) {
  if (!text) return null
  const warning = /crisis|danger|abuse|unsafe|medical|legal|qualified|coercion|risk/i.test(text)
  return <p className={warning ? 'sf-warning' : 'sf-success'}>{text}</p>
}

function SummaryCard({ title, items }) {
  return (
    <article className="sf-card sf-summary-card">
      <h3>{title}</h3>
      <dl>{items.filter((item) => item.value !== undefined && item.value !== null && item.value !== '').map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value) ? item.value.join(', ') : item.value}</dd></div>)}</dl>
    </article>
  )
}

export function BeliefDiagnosticPanel({ userId, data, onRefresh }) {
  const [text, setText] = useState('I feel anxious when I am not productive, as if rest makes me worthless.')
  const [analysis, setAnalysis] = useState(null)
  const [notice, setNotice] = useState('')

  function diagnose() {
    const result = diagnoseBeliefs(userId, text)
    if (result.routed) {
      setNotice(result.guidance.message)
      setAnalysis(null)
      return
    }
    setAnalysis(result.analysis)
    setNotice(result.guidance.message)
  }

  function confirm() {
    const session = createBeliefDiagnosticSession(userId, { triggerContext: text, presentingIssue: text })
    const result = createBeliefObservation(userId, { sessionId: session.id, situation: text, sourceType: 'manual' })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    const confirmed = confirmBeliefObservation(result.observation)
    saveBeliefSession({ ...session, status: 'completed', completedAt: new Date().toISOString() })
    saveBeliefObservation(confirmed)
    saveBeliefPattern(result.pattern)
    const review = generateBeliefPatternReview(userId, result.pattern, [...data.beliefObservations, confirmed])
    saveBeliefReview(review)
    setNotice('Belief observation confirmed and pattern updated.')
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('底层信念诊断', 'Belief Diagnostic')}</h2><p>{'event -> emotion -> interpretation -> belief -> desire -> behavior -> fruit.'}</p></div>
      <article className="sf-card sf-flow-card">
        <label>Situation, emotion, or recurring struggle<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
        <button className="sf-primary" type="button" onClick={diagnose}>Diagnose Possible Belief</button>
      </article>
      {analysis && (
        <article className="sf-card sf-flow-card">
          <h3>Diagnostic Result</h3>
          <p><b>Presenting issue:</b> {analysis.presentingIssue}</p>
          <div className="sf-chip-row">{analysis.surfaceEmotions.map((emotion) => <span className="sf-chip" key={emotion}>{emotion}</span>)}</div>
          {analysis.possibleBeliefs.map((belief) => <div className="sf-insight-row" key={belief.belief}><b>{belief.domain} · {belief.distortionType}</b><p>{belief.belief}</p><p>{analysis.gospelTruthNeeded.join(' ')}</p><span>{Math.round(belief.confidence * 100)}% possible</span></div>)}
          <button type="button" onClick={confirm}>Confirm and Save Observation</button>
        </article>
      )}
      <div className="sf-home-grid">
        <SummaryCard title="Belief Patterns" items={[{ label: 'Active', value: String(data.beliefPatterns.length) }, { label: 'Latest', value: data.beliefPatterns[0]?.title || 'None' }]} />
        <article className="sf-card"><h3>Domains</h3><div className="sf-chip-row">{beliefDomains.map((domain) => <span className="sf-chip" key={domain.key}>{domain.displayName}</span>)}</div></article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export function IdolMappingPanel({ userId, data, onRefresh }) {
  const [text, setText] = useState('I become angry and anxious when my plan is interrupted because I must control the outcome.')
  const [analysis, setAnalysis] = useState(null)
  const [notice, setNotice] = useState('')

  function detect() {
    const result = detectIdols(userId, text)
    if (result.routed) {
      setNotice(result.guidance.message)
      setAnalysis(null)
      return
    }
    setAnalysis(result.analysis)
    setNotice(result.guidance.message)
  }

  function confirm() {
    const result = createIdolObservation(userId, { triggeringEvent: text, blockedDesire: text, sourceType: 'manual' })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    const confirmed = confirmIdolObservation(result.observation)
    saveIdolObservation(confirmed)
    saveIdolPattern(result.pattern)
    const review = generateIdolPatternReview(userId, result.pattern, [...data.idolObservations, confirmed])
    saveIdolReview(review)
    setNotice('Idol observation confirmed and surrender practice suggested.')
    onRefresh()
  }

  const primaryKey = analysis?.possibleIdols?.[0]?.idolKey
  const practices = primaryKey ? recommendSurrenderPractices(primaryKey) : []
  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('偶像地图', 'Idol Mapping')}</h2><p>{'desire -> promise -> fear -> sacrifice -> fruit -> gospel counter-truth -> surrender practice.'}</p></div>
      <article className="sf-card sf-flow-card">
        <label>Recurring anxiety, anger, desire, or conflict<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
        <button className="sf-primary" type="button" onClick={detect}>Detect Possible Idol</button>
      </article>
      {analysis && (
        <article className="sf-card sf-flow-card">
          <h3>Idol Detection Result</h3>
          {analysis.normalDesireNotice && <p>{analysis.normalDesireNotice}</p>}
          {analysis.possibleIdols?.map((idol) => <div className="sf-insight-row" key={idol.idolKey}><b>{idol.idolKey}</b><p>{idol.possiblePromise}</p><p>Fear: {idol.possibleFear}</p><span>{Math.round(idol.confidence * 100)}% possible</span></div>)}
          <p>{analysis.gospelCounterTruth}</p>
          {practices.map((practice) => <article className="sf-prayer" key={practice.id}><b>{practice.title}</b><p>{practice.instructions}</p><span>{practice.practiceType} · {practice.durationMinutes} min</span></article>)}
          {analysis.possibleIdols?.length > 0 && <button type="button" onClick={confirm}>Confirm and Save Idol Pattern</button>}
        </article>
      )}
      <div className="sf-home-grid">
        <SummaryCard title="Idol Patterns" items={[{ label: 'Active', value: String(data.idolPatterns.length) }, { label: 'Latest', value: data.idolPatterns[0]?.title || 'None' }]} />
        <article className="sf-card"><h3>Categories</h3><div className="sf-chip-row">{idolCategories.map((idol) => <span className="sf-chip" key={idol.key}>{idol.displayName}</span>)}</div></article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export function GospelReframingPanel({ userId, data, onRefresh }) {
  const [situation, setSituation] = useState('I failed at work and feel worthless.')
  const [originalInterpretation, setOriginalInterpretation] = useState('My failure proves I am not enough.')
  const [reframing, setReframing] = useState(null)
  const [notice, setNotice] = useState('')

  function generate() {
    const result = generateFullReframing(userId, situation, { originalInterpretation })
    if (result.routed) {
      setNotice(result.guidance.message)
      setReframing(null)
      return
    }
    setReframing(result.reframing)
    setNotice(result.guidance.message)
  }

  function saveSession() {
    const result = createGospelReframingSession(userId, { originalSituation: situation, originalInterpretation })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    saveGospelSession(result.session)
    result.actions.forEach(saveGospelAction)
    setNotice('Gospel reframing session and response actions saved.')
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('福音重构', 'Gospel Reframing')}</h2><p>Creation, Fall, Redemption, Restoration. Lament is allowed; cheap positivity is not.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <label>Situation<textarea value={situation} onChange={(event) => setSituation(event.target.value)} /></label>
          <label>Original interpretation<textarea value={originalInterpretation} onChange={(event) => setOriginalInterpretation(event.target.value)} /></label>
          <button className="sf-primary" type="button" onClick={generate}>Generate Gospel Reframing</button>
        </article>
        <article className="sf-card"><h3>Frame Templates</h3><div className="sf-chip-row">{gospelFrameTemplates.slice(0, 16).map((template) => <span className="sf-chip" key={template.key}>{template.situationType}</span>)}</div></article>
      </div>
      {reframing && (
        <article className="sf-card sf-flow-card">
          <h3>{reframing.situationType} frame</h3>
          {['creation', 'fall', 'redemption', 'restoration'].map((stage) => <div className="sf-insight-row" key={stage}><b>{stage}</b><p>{reframing[stage].truth}</p><p>{reframing[stage].question || reframing[stage].diagnosis || reframing[stage].invitation || reframing[stage].nextAction}</p></div>)}
          <SummaryCard title="Reframed Belief" items={[{ label: 'Old', value: reframing.originalInterpretation }, { label: 'New', value: reframing.reframedBelief }, { label: 'Cautions', value: reframing.cautions }]} />
          {reframing.responseActions.map((action) => <article className="sf-prayer" key={action.id}><b>{action.actionType}</b><p>{action.description}</p></article>)}
          <button type="button" onClick={saveSession}>Save Reframing Session</button>
        </article>
      )}
      <SummaryCard title="Reframing History" items={[{ label: 'Sessions', value: String(data.gospelSessions.length) }, { label: 'Response actions', value: String(data.gospelActions.length) }]} />
      <Notice text={notice} />
    </section>
  )
}

export function DecisionDiscernmentPanel({ userId, data, onRefresh }) {
  const [decisionText, setDecisionText] = useState('Should I accept this new job?')
  const [optionDraft, setOptionDraft] = useState('Accept the job')
  const [session, setSession] = useState(data.decisionSessions[0] || null)
  const [summary, setSummary] = useState(null)
  const [notice, setNotice] = useState('')
  const options = session ? data.decisionOptions.filter((option) => option.sessionId === session.id) : []
  const valueWeights = session ? data.valueWeights.filter((weight) => weight.sessionId === session.id) : []
  const scores = session ? scoreDecisionOptions(userId, session, options, valueWeights) : []

  function oneShot() {
    const result = oneShotDiscernment(userId, decisionText, ['Accept the job', 'Stay in current role', 'Delay and negotiate'], { hasCounsel: false })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    setSummary(result.discernment)
    setNotice(result.guidance.message)
  }

  function createSession() {
    const next = createDecisionSession(userId, { decisionTitle: decisionText, decisionQuestion: decisionText })
    saveDecisionSession(next)
    recommendValueWeights(userId, next).forEach(saveValueWeight)
    const motive = runMotiveCheck(userId, next, decisionText)
    saveMotiveCheck(motive)
    setSession(next)
    setNotice('Decision session created. This is wisdom practice, not private revelation.')
    onRefresh()
  }

  function addOption() {
    if (!session) return
    const option = addDecisionOption(userId, session, { label: optionDraft })
    saveDecisionOption(option)
    setOptionDraft('')
    onRefresh()
  }

  function addCounselAndSummarize() {
    if (!session) return
    const counsel = addCounselInput(userId, session, { counselSourceType: 'mentor', summary: 'Ask one mature believer and one relevant professional contact.' })
    saveCounselInput(counsel)
    const nextSummary = generateDecisionSummary(userId, session, options, data.motiveChecks.filter((check) => check.sessionId === session.id), valueWeights, [...data.counselInputs, counsel])
    saveDecisionSummary(nextSummary)
    setNotice(nextSummary.recommendedPath)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('决策分辨', 'Decision Discernment')}</h2><p>Clarify options, facts, motives, values, counsel, prayer, timing, risks, and long-term fruit. This is not divination.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Decision question<textarea value={decisionText} onChange={(event) => setDecisionText(event.target.value)} /></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={oneShot}>One-shot Discernment</button><button type="button" onClick={createSession}>Create Decision Session</button></div>
      </article>
      {summary && <SummaryCard title="Wisdom Path Summary" items={[{ label: 'Question', value: summary.decisionQuestion }, { label: 'Facts needed', value: summary.factsNeeded }, { label: 'Value priorities', value: summary.valuePriorities }, { label: 'Recommended path', value: summary.recommendedPath }, { label: 'Cautions', value: summary.cautions }]} />}
      {session && (
        <div className="sf-home-grid">
          <article className="sf-card sf-flow-card">
            <h3>Options</h3>
            <label>Option<input value={optionDraft} onChange={(event) => setOptionDraft(event.target.value)} /></label>
            <button type="button" onClick={addOption}>Add Option</button>
            {options.map((option) => <div className="sf-insight-row" key={option.id}><b>{option.label}</b><p>{option.description || 'Score after values and counsel are reviewed.'}</p></div>)}
          </article>
          <article className="sf-card sf-flow-card">
            <h3>Value scoring</h3>
            {scores.length ? scores.map((score) => <div className="sf-insight-row" key={score.optionId}><b>{score.label}</b><p>{score.evidence}</p><span>{score.score} / 10</span></div>) : <p className="sf-empty">Add options to score by weighted values.</p>}
            <button type="button" onClick={addCounselAndSummarize}>Add Counsel and Summarize</button>
          </article>
        </div>
      )}
      <SummaryCard title="Decision History" items={[{ label: 'Sessions', value: String(data.decisionSessions.length) }, { label: 'Summaries', value: String(data.decisionSummaries.length) }]} />
      <Notice text={notice} />
    </section>
  )
}

export default function WorldviewFormationDashboard({ userId = 'local-user' }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [intent, setIntent] = useState('I feel worthless when I fail at work and I do not know whether to change jobs.')
  const data = useMemo(() => loadWorldviewFormationData(userId), [userId, refreshKey])
  const dashboard = useMemo(() => buildWorldviewDashboard({ userId, ...data }), [userId, data])
  const route = orchestrateWorldviewIntent(userId, intent, {})
  const refresh = () => setRefreshKey((value) => value + 1)

  return (
    <section className="sf-module">
      <div className="sf-section-heading">
        <h2>Worldview Formation OS Expansion / 世界观塑造系统扩展</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && (
        <section className="sf-section">
          <div className="sf-home-grid">
            <SummaryCard title="Belief Patterns" items={[{ label: 'Active', value: String(dashboard.today.activeBeliefPatterns.length) }, { label: 'Recommended', value: dashboard.today.recommendedWorldviewPractice.title }]} />
            <SummaryCard title="Idol Map" items={[{ label: 'Active', value: String(dashboard.today.activeIdolPatterns.length) }, { label: 'Insight', value: dashboard.formationInsights.map((item) => item.summary) }]} />
            <SummaryCard title="Worldview Weekly" items={[{ label: 'Belief observations', value: String(dashboard.weeklySummary.beliefObservationsCreated) }, { label: 'Idol observations', value: String(dashboard.weeklySummary.idolObservationsCreated) }, { label: 'Reframes completed', value: String(dashboard.weeklySummary.reframingSessionsCompleted) }, { label: 'Decision sessions', value: String(dashboard.weeklySummary.decisionSessionsUpdated) }]} />
          </div>
          <article className="sf-card sf-flow-card">
            <h3>Worldview Orchestrator</h3>
            <label>Intent<textarea value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
            <p><b>{route.route}</b>: {route.message}</p>
            <span className="sf-status">{route.nextEndpoint}</span>
          </article>
        </section>
      )}
      {tab === 'beliefs' && <BeliefDiagnosticPanel userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'idols' && <IdolMappingPanel userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'reframing' && <GospelReframingPanel userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'discernment' && <DecisionDiscernmentPanel userId={userId} data={data} onRefresh={refresh} />}
    </section>
  )
}
