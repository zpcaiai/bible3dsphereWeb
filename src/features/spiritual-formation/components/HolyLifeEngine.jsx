import { t as i18nT } from '../../../i18n/runtime'
import { useEffect, useMemo, useRef, useState } from 'react'
import { holyLifePipeline, holyLifeSkills, holyLifeSkillsById } from '../data/holyLifeSkills'
import { generateRuleOfLifeRemote } from '../lib/apiStorage'

const DEFAULT_SCORE = 50
const TIME_LABELS = {
  morning: i18nT('早晨'),
  day: i18nT('日间'),
  decision: i18nT('决定'),
  evening: i18nT('晚上'),
}

function todayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createEntry(skillId) {
  return {
    skillId,
    score: DEFAULT_SCORE,
    reflection: '',
    completed: false,
    updatedAt: new Date().toISOString(),
  }
}

function createDayLog(userId, date = todayKey()) {
  const now = new Date().toISOString()
  return {
    id: `holy_life_${userId}_${date}`,
    userId,
    date,
    intention: '',
    entries: holyLifeSkills.map((skill) => createEntry(skill.id)),
    presenceLogs: [],
    ruleOfLife: createRuleOfLife(),
    purposeReview: createPurposeReview(),
    decisionSanctificationLogs: [],
    dailyReport: '',
    tomorrowFormation: '',
    createdAt: now,
    updatedAt: now,
  }
}

function createRuleOfLife(patch = {}) {
  return {
    theme: '',
    morningPrayer: '',
    dailyPractice: '',
    decisionGuardrail: '',
    eveningExamen: '',
    generatedAt: '',
    ...patch,
  }
}

function createPurposeReview(patch = {}) {
  return {
    callingStatement: '',
    stewardshipFocus: '',
    misalignment: '',
    nextFaithfulAction: '',
    ...patch,
  }
}

function createDecisionDraft() {
  return {
    decision: '',
    motive: '',
    desireToSurrender: '',
    scriptureAnchor: '',
    obedienceStep: '',
  }
}

function clampScore(value) {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return DEFAULT_SCORE
  return Math.max(0, Math.min(100, parsed))
}

function averageScore(entries) {
  if (!entries.length) return 0
  return Math.round(entries.reduce((sum, entry) => sum + clampScore(entry.score), 0) / entries.length)
}

function summarizeDay(log) {
  const done = log.entries.filter((entry) => entry.completed).length
  const avg = averageScore(log.entries)
  const lowest = [...log.entries].sort((a, b) => a.score - b.score)[0]
  const highest = [...log.entries].sort((a, b) => b.score - a.score)[0]
  const weakest = lowest ? holyLifeSkillsById[lowest.skillId]?.shortTitle : i18nT('未记录')
  const strongest = highest ? holyLifeSkillsById[highest.skillId]?.shortTitle : i18nT('未记录')
  return {
    done,
    avg,
    strongest,
    weakest,
    completion: Math.round((done / holyLifeSkills.length) * 100),
  }
}

function buildReport(log) {
  const summary = summarizeDay(log)
  const completed = log.entries
    .filter((entry) => entry.completed)
    .map((entry) => holyLifeSkillsById[entry.skillId]?.shortTitle)
    .filter(Boolean)
    .join('、') || i18nT('尚未完成具体操练')
  return `今日圣洁生活报告：完成 ${summary.done}/${holyLifeSkills.length} 项，平均分 ${summary.avg}。较强处：${summary.strongest}。需要留意：${summary.weakest}。已操练：${completed}。`
}

function buildTomorrowFormation(log) {
  const weakest = [...log.entries].sort((a, b) => a.score - b.score)[0]
  const skill = weakest ? holyLifeSkillsById[weakest.skillId] : holyLifeSkills[0]
  return `明天优先操练「${skill.shortTitle}」：${skill.practice}`
}

function buildRuleOfLife(log) {
  const summary = summarizeDay(log)
  const weakest = [...log.entries].sort((a, b) => a.score - b.score)[0]
  const focusSkill = weakest ? holyLifeSkillsById[weakest.skillId] : holyLifeSkillsById.purpose_reset
  const intention = log.intention.trim() || i18nT('今天把普通生活献给神')
  return createRuleOfLife({
    theme: `${focusSkill.shortTitle}：${focusSkill.metric}`,
    morningPrayer: `主啊，${intention}。求你洁净我的动机，使今天的时间、言语和选择都归向你。`,
    dailyPractice: focusSkill.practice,
    decisionGuardrail: `今天每个重要决定先问：这是否出于爱、真理、谦卑，并能使我更忠心？当前需警醒：${summary.weakest}。`,
    eveningExamen: '今晚回看：我在哪些普通时刻记得神？哪里只是追随自己？明天一步顺服是什么？',
    generatedAt: new Date().toISOString(),
  })
}

function buildPurposeReview(log) {
  const purpose = log.entries.find((entry) => entry.skillId === 'purpose_reset')
  const charity = log.entries.find((entry) => entry.skillId === 'charity_practice')
  return createPurposeReview({
    callingStatement: log.intention.trim() || '在神面前忠心管理今天所托付的人、事、时间与机会。',
    stewardshipFocus: purpose?.reflection || '把最普通的职责当作今日敬拜的场所。',
    misalignment: charity?.completed ? '警醒不要把善行变成自我证明。' : '留意只完成任务，却没有真实地爱人。',
    nextFaithfulAction: buildTomorrowFormation(log),
  })
}

function ensureEntries(log) {
  const existing = new Map((log.entries || []).map((entry) => [entry.skillId, entry]))
  return {
    ...log,
    entries: holyLifeSkills.map((skill) => existing.get(skill.id) || createEntry(skill.id)),
    presenceLogs: Array.isArray(log.presenceLogs) ? log.presenceLogs : [],
    ruleOfLife: createRuleOfLife(log.ruleOfLife || {}),
    purposeReview: createPurposeReview(log.purposeReview || {}),
    decisionSanctificationLogs: Array.isArray(log.decisionSanctificationLogs) ? log.decisionSanctificationLogs : [],
    intention: log.intention || '',
    dailyReport: log.dailyReport || '',
    tomorrowFormation: log.tomorrowFormation || '',
  }
}

export default function HolyLifeEngine({ userId, token, initialTodayLog, history = [], summaryStats, onSave }) {
  const [log, setLog] = useState(() => ensureEntries(initialTodayLog || createDayLog(userId)))
  const [activeTime, setActiveTime] = useState('morning')
  const [saveState, setSaveState] = useState(initialTodayLog ? 'synced' : 'idle')
  const [dirty, setDirty] = useState(false)
  const [presenceDraft, setPresenceDraft] = useState('')
  const [decisionDraft, setDecisionDraft] = useState(() => createDecisionDraft())
  const hydratedKeyRef = useRef(initialTodayLog ? `${initialTodayLog.id}:${initialTodayLog.updatedAt || ''}` : '')
  const summary = useMemo(() => summarizeDay(log), [log])
  const recent = useMemo(() => history.filter((item) => item.id !== log.id).slice(0, 14), [history, log.id])
  const visibleSkills = holyLifeSkills.filter((skill) => activeTime === 'all' || skill.time === activeTime)
  const saveLabel = {
    idle: '保存今日',
    saving: '保存中…',
    synced: '已同步',
    local: '已本地保存',
    error: '保存失败',
  }[saveState] || '保存今日'

  useEffect(() => {
    if (!initialTodayLog || dirty) return
    const key = `${initialTodayLog.id}:${initialTodayLog.updatedAt || ''}`
    if (key && key !== hydratedKeyRef.current) {
      hydratedKeyRef.current = key
      setLog(ensureEntries(initialTodayLog))
      setSaveState('synced')
    }
  }, [initialTodayLog, dirty])

  useEffect(() => {
    if (!dirty) return undefined
    const warnBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty])

  function updateLog(updater) {
    setDirty(true)
    setSaveState('idle')
    setLog((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }

  function updateEntry(skillId, patch) {
    updateLog((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) => entry.skillId === skillId ? { ...entry, ...patch, updatedAt: new Date().toISOString() } : entry),
    }))
  }

  function applySuggestion(skillId, text) {
    const entry = log.entries.find((item) => item.skillId === skillId)
    const next = entry?.reflection ? `${entry.reflection}；${text}` : text
    updateEntry(skillId, { reflection: next })
  }

  function addPresencePause() {
    const reflection = presenceDraft.trim() || '暂停 30 秒：Observe / Repent / Return'
    updateLog((prev) => ({
      ...prev,
      presenceLogs: [{ id: uid('presence'), createdAt: new Date().toISOString(), reflection }, ...prev.presenceLogs].slice(0, 12),
    }))
    setPresenceDraft('')
    const presence = log.entries.find((entry) => entry.skillId === 'presence_of_god')
    if (presence && !presence.completed) updateEntry('presence_of_god', { completed: true, score: Math.max(presence.score, 70), reflection })
  }

  async function generateRuleOfLife() {
    const snapshot = log
    let rule = buildRuleOfLife(snapshot) // local fallback
    if (token) {
      try {
        const remote = await generateRuleOfLifeRemote(
          { intention: snapshot.intention, entries: snapshot.entries.map((e) => ({ skillId: e.skillId, score: e.score })) },
          token,
        )
        if (remote && remote.morningPrayer) rule = { ...rule, ...remote }
      } catch {
        // keep local fallback
      }
    }
    updateLog((prev) => ({ ...prev, ruleOfLife: rule, purposeReview: buildPurposeReview(prev) }))
  }

  function updatePurposeReview(field, value) {
    updateLog((prev) => ({ ...prev, purposeReview: { ...createPurposeReview(prev.purposeReview), [field]: value } }))
  }

  function addDecisionLog() {
    const hasContent = Object.values(decisionDraft).some((value) => value.trim())
    if (!hasContent) return
    const nextDecision = {
      id: uid('decision'),
      createdAt: new Date().toISOString(),
      decision: decisionDraft.decision.trim(),
      motive: decisionDraft.motive.trim(),
      desireToSurrender: decisionDraft.desireToSurrender.trim(),
      scriptureAnchor: decisionDraft.scriptureAnchor.trim() || '罗马书 12:1-2',
      obedienceStep: decisionDraft.obedienceStep.trim(),
    }
    updateLog((prev) => ({
      ...prev,
      decisionSanctificationLogs: [nextDecision, ...(prev.decisionSanctificationLogs || [])].slice(0, 20),
    }))
    setDecisionDraft(createDecisionDraft())
    const decision = log.entries.find((entry) => entry.skillId === 'intention_inspector')
    if (decision && !decision.completed) updateEntry('intention_inspector', { completed: true, score: Math.max(decision.score, 70), reflection: nextDecision.motive || nextDecision.decision })
  }

  async function save() {
    const next = {
      ...log,
      ruleOfLife: log.ruleOfLife?.generatedAt ? log.ruleOfLife : buildRuleOfLife(log),
      purposeReview: log.purposeReview?.callingStatement ? log.purposeReview : buildPurposeReview(log),
      dailyReport: log.dailyReport || buildReport(log),
      tomorrowFormation: log.tomorrowFormation || buildTomorrowFormation(log),
      updatedAt: new Date().toISOString(),
    }
    setLog(next)
    setSaveState('saving')
    try {
      const result = await onSave(next)
      if (result?.__localOnly) {
        setSaveState('local')
      } else {
        if (result) {
          setLog(ensureEntries(result))
          hydratedKeyRef.current = `${result.id}:${result.updatedAt || ''}`
        }
        setSaveState('synced')
      }
      setDirty(false)
    } catch {
      setSaveState('error')
    }
  }

  function generateReport() {
    updateLog((prev) => ({
      ...prev,
      dailyReport: buildReport(prev),
      tomorrowFormation: buildTomorrowFormation(prev),
    }))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading holy-life-heading">
        <div>
          <h2>{i18nT('圣洁生活引擎')}</h2>
          <p>{i18nT('基于 William Law 的 Daily Practice Layer：不是增加任务，而是把普通生活重新带回敬拜。')}</p>
        </div>
        <button className="sf-primary holy-life-save" type="button" onClick={save} disabled={saveState === 'saving'}>{saveLabel}</button>
      </div>

      <div className="holy-life-summary">
        <article className="sf-card">
          <h3>{i18nT('今日进度')}</h3>
          <div className="holy-life-score">{summary.done}/{holyLifeSkills.length}</div>
          <div className="sf-progress"><i style={{ width: `${summary.completion}%` }} /></div>
          <p>{i18nT('完成率')} {summary.completion}%</p>
        </article>
        <article className="sf-card">
          <h3>{i18nT('平均形成分')}</h3>
          <div className="holy-life-score">{summary.avg}</div>
          <div className="sf-progress"><i style={{ width: `${summary.avg}%` }} /></div>
          <p>{i18nT('较强：')}{summary.strongest} {i18nT('· 留意：')}{summary.weakest}</p>
        </article>
        <article className="sf-card">
          <h3>{i18nT('同在暂停')}</h3>
          <div className="holy-life-score">{log.presenceLogs.length}</div>
          <p>{i18nT('目标不是频率本身，而是日间真实归回。')}</p>
        </article>
        {summaryStats && (
          <article className="sf-card">
            <h3>{i18nT('近')} {summaryStats.days || 30} {i18nT('天趋势')}</h3>
            <div className="holy-life-score">{summaryStats.averageScore || 0}</div>
            <p>{summaryStats.logCount || 0} {i18nT('天记录 ·')} {summaryStats.presencePauseCount || 0} {i18nT('次同在暂停 ·')} {summaryStats.decisionLogCount || 0} {i18nT('个成圣决定')}</p>
          </article>
        )}
      </div>

      <div className="sf-card holy-life-intention">
        <label>{i18nT('今日奉献意向')}
          <textarea value={log.intention} onChange={(event) => updateLog((prev) => ({ ...prev, intention: event.target.value }))} placeholder={i18nT('今天我愿意在哪个具体领域承认：每一分钟都属于神？')}  aria-label={i18nT('今天我愿意在哪个具体领域承认：每一分钟都属于神？')}/>
        </label>
      </div>

      <div className="sf-card">
        <h3>Daily Pipeline</h3>
        <div className="holy-life-pipeline">
          {holyLifePipeline.map((step, index) => <span key={step}>{index + 1}. {step}</span>)}
        </div>
      </div>

      <div className="holy-life-report-grid">
        <article className="sf-card holy-life-rule">
          <div className="holy-life-card-head">
            <div>
              <h3>Daily Rule of Life</h3>
              <p>{i18nT(log.ruleOfLife?.theme || '从今日意向与最低形成分生成一条日规。')}</p>
            </div>
            <button className="sf-primary" type="button" onClick={generateRuleOfLife}>{i18nT('生成日规')}</button>
          </div>
          <div className="holy-life-rule-list">
            <p><b>{i18nT('晨祷')}</b>{i18nT(log.ruleOfLife?.morningPrayer || '尚未生成。')}</p>
            <p><b>{i18nT('日间操练')}</b>{i18nT(log.ruleOfLife?.dailyPractice || '尚未生成。')}</p>
            <p><b>{i18nT('决策护栏')}</b>{i18nT(log.ruleOfLife?.decisionGuardrail || '尚未生成。')}</p>
            <p><b>{i18nT('晚间省察')}</b>{i18nT(log.ruleOfLife?.eveningExamen || '尚未生成。')}</p>
          </div>
        </article>
        <article className="sf-card holy-life-purpose">
          <h3>Purpose Review</h3>
          <label>{i18nT('今日呼召陈述')}
            <textarea value={log.purposeReview?.callingStatement || ''} onChange={(event) => updatePurposeReview('callingStatement', event.target.value)} placeholder={i18nT('今天神托付我的中心责任是什么？')}  aria-label={i18nT('今天神托付我的中心责任是什么？')}/>
          </label>
          <label>{i18nT('管家职分焦点')}
            <textarea value={log.purposeReview?.stewardshipFocus || ''} onChange={(event) => updatePurposeReview('stewardshipFocus', event.target.value)} placeholder={i18nT('时间、关系、工作、身体或资源中，哪个领域需要忠心？')}  aria-label={i18nT('时间、关系、工作、身体或资源中，哪个领域需要忠心？')}/>
          </label>
          <label>{i18nT('偏离警戒')}
            <textarea value={log.purposeReview?.misalignment || ''} onChange={(event) => updatePurposeReview('misalignment', event.target.value)} placeholder={i18nT('今天最容易把目的从神转向自己的地方是什么？')}  aria-label={i18nT('今天最容易把目的从神转向自己的地方是什么？')}/>
          </label>
          <label>{i18nT('下一步忠心')}
            <textarea value={log.purposeReview?.nextFaithfulAction || ''} onChange={(event) => updatePurposeReview('nextFaithfulAction', event.target.value)} placeholder={i18nT('一个可以执行的顺服动作。')}  aria-label={i18nT('一个可以执行的顺服动作。')}/>
          </label>
        </article>
      </div>

      <div className="sf-card holy-life-presence">
        <div>
          <h3>{i18nT('30 秒神同在练习')}</h3>
          <p>{i18nT('暂停。观察此刻的心。必要时悔改。重新开始。')}</p>
        </div>
        <div>
          <textarea value={presenceDraft} onChange={(event) => setPresenceDraft(event.target.value)} placeholder={i18nT('此刻我归回神的一句话...')}  aria-label={i18nT('此刻我归回神的一句话...')}/>
          <button className="sf-primary" type="button" onClick={addPresencePause}>{i18nT('记录一次暂停')}</button>
        </div>
      </div>

      <div className="sf-tabs holy-life-filter" aria-label="Holy life skill time filters">
        {[
          ['morning', '早晨'],
          ['day', '日间'],
          ['decision', '决定'],
          ['evening', '晚上'],
          ['all', '全部'],
        ].map(([id, label]) => (
          <button key={id} className={activeTime === id ? 'active' : ''} type="button" onClick={() => setActiveTime(id)}>{i18nT(label)}</button>
        ))}
      </div>

      <div className="holy-life-grid">
        {visibleSkills.map((skill) => {
          const entry = log.entries.find((item) => item.skillId === skill.id) || createEntry(skill.id)
          return (
            <article className={`sf-card holy-life-skill ${entry.completed ? 'is-complete' : ''}`} key={skill.id}>
              <div className="holy-life-card-head">
                <div>
                  <span className="sf-card-short">{TIME_LABELS[skill.time]}</span>
                  <h3>{i18nT(skill.shortTitle)}</h3>
                  <p>{i18nT(skill.title)} · {skill.metric}</p>
                </div>
                <label className="holy-life-toggle">
                  <input type="checkbox" checked={entry.completed} onChange={(event) => updateEntry(skill.id, { completed: event.target.checked })} />
                  {i18nT('完成')}
                </label>
              </div>
              <p>{i18nT(skill.purpose)}</p>
              <div className="holy-life-practice">{i18nT(skill.practice)}</div>
              <label>{i18nT(skill.prompt)}
                <textarea value={entry.reflection} onChange={(event) => updateEntry(skill.id, { reflection: event.target.value })} placeholder={i18nT(skill.placeholder)}  aria-label={i18nT(skill.placeholder)}/>
              </label>
              <div className="sf-chip-row">
                {skill.suggestions.map((suggestion) => (
                  <button className="sf-chip-btn" key={suggestion} type="button" onClick={() => applySuggestion(skill.id, suggestion)}>{i18nT(suggestion)}</button>
                ))}
              </div>
              <label className="holy-life-range">
                <span>{skill.metric}</span>
                <b>{entry.score}</b>
                <input type="range" min="0" max="100" step="5" value={entry.score} onChange={(event) => updateEntry(skill.id, { score: clampScore(event.target.value) })} />
              </label>
            </article>
          )
        })}
      </div>

      <div className="sf-card holy-life-decision">
        <div className="holy-life-card-head">
          <div>
            <h3>Decision Sanctification</h3>
            <p>{i18nT('把重要决定带到动机、省察、经文与顺服行动里。')}</p>
          </div>
          <button className="sf-primary" type="button" onClick={addDecisionLog}>{i18nT('记录决定')}</button>
        </div>
        <div className="holy-life-decision-grid">
          <label>{i18nT('决定')}
            <textarea value={decisionDraft.decision} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, decision: event.target.value }))} placeholder={i18nT('我要做的决定是什么？')}  aria-label={i18nT('我要做的决定是什么？')}/>
          </label>
          <label>{i18nT('动机省察')}
            <textarea value={decisionDraft.motive} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, motive: event.target.value }))} placeholder={i18nT('这是出于爱、真理、谦卑，还是恐惧、骄傲、逃避？')}  aria-label={i18nT('这是出于爱、真理、谦卑，还是恐惧、骄傲、逃避？')}/>
          </label>
          <label>{i18nT('愿意交托的欲望')}
            <textarea value={decisionDraft.desireToSurrender} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, desireToSurrender: event.target.value }))} placeholder={i18nT('若神引导不同，我愿意放下什么？')}  aria-label={i18nT('若神引导不同，我愿意放下什么？')}/>
          </label>
          <label>{i18nT('经文锚点')}
            <textarea value={decisionDraft.scriptureAnchor} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, scriptureAnchor: event.target.value }))} placeholder={i18nT('罗马书 12:1-2')}  aria-label={i18nT('罗马书 12:1-2')}/>
          </label>
          <label>{i18nT('顺服行动')}
            <textarea value={decisionDraft.obedienceStep} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, obedienceStep: event.target.value }))} placeholder={i18nT('下一步可执行的忠心是什么？')}  aria-label={i18nT('下一步可执行的忠心是什么？')}/>
          </label>
        </div>
        {(log.decisionSanctificationLogs || []).length ? (
          <div className="holy-life-decision-list">
            {(log.decisionSanctificationLogs || []).slice(0, 6).map((item) => (
              <div key={item.id}>
                <strong>{item.decision || '未命名决定'}</strong>
                <span>{item.scriptureAnchor}</span>
                <p>{item.obedienceStep || item.motive || '已记录。'}</p>
              </div>
            ))}
          </div>
        ) : <p className="sf-empty">{i18nT('还没有记录需要成圣辨识的决定。')}</p>}
      </div>

      <div className="holy-life-report-grid">
        <article className="sf-card">
          <h3>Daily Holiness Report</h3>
          <textarea value={log.dailyReport} onChange={(event) => updateLog((prev) => ({ ...prev, dailyReport: event.target.value }))} placeholder={i18nT('点击生成，或手动记录今天的圣洁生活报告。')}  aria-label={i18nT('点击生成，或手动记录今天的圣洁生活报告。')}/>
          <button className="sf-primary" type="button" onClick={generateReport}>{i18nT('生成今日报告')}</button>
        </article>
        <article className="sf-card">
          <h3>Tomorrow Formation</h3>
          <textarea value={log.tomorrowFormation} onChange={(event) => updateLog((prev) => ({ ...prev, tomorrowFormation: event.target.value }))} placeholder={i18nT('明天最重要的一步顺服是什么？')}  aria-label={i18nT('明天最重要的一步顺服是什么？')}/>
        </article>
      </div>

      <div className="sf-card">
        <h3>{i18nT('最近 14 天')}</h3>
        {recent.length ? (
          <div className="holy-life-history">
            {recent.map((item) => {
              const itemSummary = summarizeDay(ensureEntries(item))
              return (
                <div key={item.id}>
                  <strong>{item.date}</strong>
                  <span>{itemSummary.done}/{holyLifeSkills.length}</span>
                  <i><b style={{ width: `${itemSummary.avg}%` }} /></i>
                  <em>{itemSummary.avg}</em>
                </div>
              )
            })}
          </div>
        ) : <p className="sf-empty">{i18nT('还没有历史记录。保存今日后，这里会显示趋势。')}</p>}
      </div>
    </section>
  )
}
