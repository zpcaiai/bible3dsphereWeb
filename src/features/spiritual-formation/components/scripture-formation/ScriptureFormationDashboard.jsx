import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { gospelAssuranceTexts, memoryVerses } from '../../data/scriptureFormationSeed'
import {
  CONFESSION_STAGES,
  EXAMEN_STAGES,
  LECTIO_STAGES,
  buildDashboard,
  completeConfessionSession,
  completeExamenSession,
  completeLectioSession,
  confessionPrompt,
  createConfessionSession,
  createExamenSession,
  createLectioSession,
  createMemoryItem,
  dueMemoryItems,
  examenPrompt,
  generateGospelAssurance,
  getDailyPassage,
  guidanceForLectioStage,
  recommendedMemoryVerses,
  reviewMemoryItem,
  submitConfessionStage,
  submitExamenStage,
  submitLectioStage,
  todayKey,
  updateRepentanceAction,
} from '../../lib/scriptureFormationEngine'
import { loadScriptureFormationData, saveConfessionSession, saveExamenSession, saveLectioSession, saveMemoryItem } from '../../lib/scriptureFormationStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function StagePills({ stages, active }) {
  return (
    <div className="sf-stage-pills">
      {stages.map((stage) => (
        <span key={stage} className={stage === active ? 'active' : ''}>{stage.replace(/_/g, ' ')}</span>
      ))}
    </div>
  )
}

export function PassageDisplay({ passage }) {
  return (
    <article className="sf-card sf-passage-card">
      <div className="sf-card-head">
        <div>
          <h3>{passage.reference}</h3>
          <p>{passage.translation} · {passage.difficultyLevel}</p>
        </div>
        <span className="sf-status">{passage.formationTags?.[0] || 'scripture'}</span>
      </div>
      <p className="sf-scripture-text">{passage.text}</p>
      <div className="sf-chip-row">{passage.themeTags.map((tag) => <span className="sf-chip" key={tag}>{tag}</span>)}</div>
    </article>
  )
}

export function FormationSessionSummary({ title, items }) {
  return (
    <article className="sf-card sf-summary-card">
      <h3>{title}</h3>
      <dl>
        {items.filter((item) => item.value).map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{Array.isArray(item.value) ? item.value.join(', ') : item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

export function LectioDivinaCard({ userId, session, onSave }) {
  const dailyPassage = getDailyPassage(userId)
  const activeSession = session || createLectioSession(userId, dailyPassage)
  const stage = activeSession.stage === 'completed' ? 'completed' : activeSession.stage
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const guidance = stage === 'completed' ? null : guidanceForLectioStage(stage, activeSession)

  function start() {
    const next = createLectioSession(userId, dailyPassage)
    onSave(next)
    setDraft('')
    setNotice('Lectio session started.')
  }

  function submit() {
    if (stage === 'obey' && !draft.trim()) {
      setNotice('Please enter one concrete obedience action before completing.')
      return
    }
    const result = submitLectioStage(activeSession, stage, draft)
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    const next = result.session.stage === 'completed' ? completeLectioSession(result.session) : result.session
    onSave(next)
    setDraft('')
    setNotice(result.session.stage === 'completed' ? 'Lectio Divina completed.' : 'Stage saved.')
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>{T('圣经默想', 'Lectio Divina')}</h2>
        <p>Read, meditate, pray, contemplate, and choose one concrete obedience action.</p>
      </div>
      <PassageDisplay passage={activeSession.passage || dailyPassage} />
      {!session && <button className="sf-primary" type="button" onClick={start}>Start Lectio Session</button>}
      {session && stage !== 'completed' && (
        <article className="sf-card sf-flow-card">
          <StagePills stages={LECTIO_STAGES} active={stage} />
          <h3>{guidance.title}</h3>
          <p>{guidance.prompt}</p>
          <p className="sf-prayer">{guidance.aiResponse}</p>
          <label>
            Journal
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write your notes, prayer, or obedience action."  aria-label="Write your notes, prayer, or obedience action."/>
          </label>
          <button className="sf-primary" type="button" onClick={submit}>{stage === 'obey' ? 'Complete Lectio' : 'Save and Continue'}</button>
        </article>
      )}
      {session?.stage === 'completed' && (
        <FormationSessionSummary
          title="Lectio Session Summary"
          items={[
            { label: 'Passage', value: session.passage?.reference },
            { label: 'Key words', value: session.keyWords },
            { label: 'Prayer', value: session.prayerText },
            { label: 'Obedience action', value: session.obedienceAction },
            { label: 'Formation insight', value: session.formationInsight },
          ]}
        />
      )}
      {notice && <p className={notice.includes('urgent') || notice.includes('Please') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

export function ScriptureMemoryTrainer({ userId, items, onSave }) {
  const [selectedVerseId, setSelectedVerseId] = useState('')
  const [activeItemId, setActiveItemId] = useState('')
  const [recall, setRecall] = useState('')
  const [applicationNote, setApplicationNote] = useState('')
  const [rating, setRating] = useState('good')
  const [revealed, setRevealed] = useState(false)
  const [lastAttempt, setLastAttempt] = useState(null)
  const due = dueMemoryItems(items)
  const activeItem = items.find((item) => item.id === activeItemId) || due[0] || items[0]
  const recommended = recommendedMemoryVerses()
  const existingVerseIds = new Set(items.map((item) => item.verseId))

  function addVerse(verseId) {
    const verse = memoryVerses.find((item) => item.id === verseId)
    if (!verse || existingVerseIds.has(verse.id)) return
    const item = createMemoryItem(userId, verse)
    onSave(item)
    setSelectedVerseId('')
    setActiveItemId(item.id)
  }

  function submitReview() {
    if (!activeItem) return
    const updated = reviewMemoryItem(activeItem, recall, rating, applicationNote)
    onSave(updated)
    setLastAttempt(updated.attempts[0])
    setRecall('')
    setApplicationNote('')
    setRevealed(false)
    setActiveItemId(updated.id)
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>{T('经文背诵', 'Scripture Memory')}</h2>
        <p>Memorize, review, recall, and apply verses with a simple spaced repetition rhythm.</p>
      </div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Recommended verses</h3>
          <label>
            Add to memory plan
            <select value={selectedVerseId} onChange={(event) => setSelectedVerseId(event.target.value)}>
              <option value="">Choose a verse</option>
              {recommended.map((verse) => <option key={verse.id} value={verse.id} disabled={existingVerseIds.has(verse.id)}>{verse.reference}</option>)}
            </select>
          </label>
          <button className="sf-primary" type="button" onClick={() => addVerse(selectedVerseId)}>Add Verse</button>
          <p className="sf-muted">{items.length} in plan · {due.length} due now</p>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Due review</h3>
          {activeItem ? (
            <>
              <p><b>{activeItem.verse.reference}</b></p>
              <p className="sf-muted">Recall the verse before revealing the full text.</p>
              {revealed && <p className="sf-prayer">{activeItem.verse.verseText}</p>}
              <button type="button" onClick={() => setRevealed((value) => !value)}>{revealed ? 'Hide verse' : 'Reveal verse'}</button>
              <label>
                Recall attempt
                <textarea value={recall} onChange={(event) => setRecall(event.target.value)} placeholder="Type as much as you can remember."  aria-label="Type as much as you can remember."/>
              </label>
              <label>
                Application note
                <textarea value={applicationNote} onChange={(event) => setApplicationNote(event.target.value)} placeholder="How can this verse shape one action today?"  aria-label="How can this verse shape one action today?"/>
              </label>
              <div className="sf-chip-row" role="radiogroup" aria-label="Self rating">
                {['forgot', 'hard', 'good', 'easy'].map((value) => (
                  <button key={value} className={`sf-chip-btn ${rating === value ? 'active' : ''}`} type="button" onClick={() => setRating(value)}>{value}</button>
                ))}
              </div>
              <button className="sf-primary" type="button" onClick={submitReview}>Submit Review</button>
            </>
          ) : <p className="sf-empty">Add a verse to begin review.</p>}
          {lastAttempt && (
            <div className="sf-success">
              <b>{Math.round(lastAttempt.accuracyScore * 100)}% accuracy</b>
              <p>{lastAttempt.aiFeedback}</p>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export function SpiritualExamenForm({ userId, session, onSave }) {
  const activeSession = session || createExamenSession(userId)
  const stage = activeSession.stage === 'completed' ? 'completed' : activeSession.stage
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')

  function start() {
    const next = createExamenSession(userId)
    onSave(next)
    setNotice('Evening examen started.')
  }

  function submit(skip = false) {
    const value = skip ? '' : draft
    const result = submitExamenStage(activeSession, stage, value)
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    const next = result.session.stage === 'completed' ? completeExamenSession(result.session) : result.session
    onSave(next)
    setDraft('')
    setNotice(result.session.stage === 'completed' ? 'Examen completed.' : 'Stage saved.')
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>{T('每日省察', 'Spiritual Examen')}</h2>
        <p>Grateful awareness, truthfulness, repentance, gospel grace, and a small intention for tomorrow.</p>
      </div>
      {!session && <button className="sf-primary" type="button" onClick={start}>Start Evening Examen</button>}
      {session && stage !== 'completed' && (
        <article className="sf-card sf-flow-card">
          <StagePills stages={EXAMEN_STAGES} active={stage} />
          <h3>{stage}</h3>
          <p>{examenPrompt(stage)}</p>
          <label>
            Reflection
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Short notes are enough. Use one line per item if helpful."  aria-label="Short notes are enough. Use one line per item if helpful."/>
          </label>
          <div className="sf-plan-actions">
            <button className="sf-primary" type="button" onClick={() => submit(false)}>{stage === 'prayer' ? 'Complete Examen' : 'Save and Continue'}</button>
            <button type="button" onClick={() => submit(true)}>Skip Stage</button>
          </div>
        </article>
      )}
      {session?.stage === 'completed' && (
        <>
          <FormationSessionSummary
            title="Examen Summary"
            items={[
              { label: 'Gratitude', value: session.gratitudeItems },
              { label: 'Consolation', value: session.consolationMoments },
              { label: 'Desolation', value: session.desolationMoments },
              { label: 'Confession / repair', value: session.sinPatternsNoticed },
              { label: 'Gospel grace', value: session.graceMomentsNoticed },
              { label: 'Tomorrow intention', value: session.tomorrowIntention },
              { label: 'Prayer', value: session.prayerText },
            ]}
          />
          <ExamenInsightList insights={session.insights || []} />
        </>
      )}
      {notice && <p className={notice.includes('urgent') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

export function ExamenInsightList({ insights }) {
  return (
    <article className="sf-card">
      <h3>Examen Insights</h3>
      {insights.length ? insights.map((insight) => (
        <div className="sf-insight-row" key={`${insight.type}-${insight.title}`}>
          <b>{insight.title}</b>
          <p>{insight.description}</p>
          <span>{insight.recommendedNextAction}</span>
        </div>
      )) : <p className="sf-empty">Insights will appear after several honest entries.</p>}
    </article>
  )
}

export function ConfessionRepentanceFlow({ userId, session, onSave }) {
  const activeSession = session || createConfessionSession(userId)
  const stage = activeSession.stage === 'completed' ? 'completed' : activeSession.stage
  const [draft, setDraft] = useState('')
  const [accountabilityNeeded, setAccountabilityNeeded] = useState(false)
  const [notice, setNotice] = useState('')
  const assurance = generateGospelAssurance(activeSession)

  function start() {
    const next = createConfessionSession(userId)
    onSave(next)
    setNotice('Private confession session started.')
  }

  function submit() {
    const value = stage === 'receive_grace' && !draft.trim() ? assurance.text : draft
    const result = submitConfessionStage(activeSession, stage, value, { accountabilityNeeded })
    if (result.routed) {
      onSave(result.session)
      setNotice(result.guidance.message)
      return
    }
    const next = result.session.stage === 'completed' ? completeConfessionSession(result.session) : result.session
    onSave(next)
    setDraft('')
    setNotice(result.session.stage === 'completed' ? 'Confession and repentance plan completed.' : 'Stage saved.')
  }

  function markAction(action, status) {
    const updated = {
      ...activeSession,
      actions: (activeSession.actions || []).map((item) => item.id === action.id ? updateRepentanceAction(item, { status }) : item),
    }
    onSave(updated)
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>{T('认罪悔改', 'Confession & Repentance')}</h2>
        <p>Truthful confession, gospel assurance, wise repair, and concrete repentance without shame loops.</p>
      </div>
      {!session && <button className="sf-primary" type="button" onClick={start}>Start Private Session</button>}
      {session && stage !== 'completed' && (
        <article className="sf-card sf-flow-card">
          <StagePills stages={CONFESSION_STAGES} active={stage} />
          <h3>{stage.replace(/_/g, ' ')}</h3>
          <p>{confessionPrompt(stage)}</p>
          {stage === 'receive_grace' && <GospelAssuranceCard assurance={assurance} />}
          <label>
            Response
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Keep it specific and non-graphic. Do not include unsafe details."  aria-label="Keep it specific and non-graphic. Do not include unsafe details."/>
          </label>
          {stage === 'walk' && (
            <label className="sf-check">
              <input type="checkbox" checked={accountabilityNeeded} onChange={(event) => setAccountabilityNeeded(event.target.checked)} />
              Accountability or pastoral support is needed.
            </label>
          )}
          <button className="sf-primary" type="button" onClick={submit}>{stage === 'walk' ? 'Complete Plan' : 'Save and Continue'}</button>
        </article>
      )}
      {session?.stage === 'completed' && (
        <>
          <FormationSessionSummary
            title="Confession Completion Summary"
            items={[
              { label: 'Named pattern', value: session.sinCategory },
              { label: 'Confession', value: session.confessionText },
              { label: 'Gospel truth', value: session.gospelTruthReceived },
              { label: 'Repentance action', value: session.repentanceAction },
              { label: 'Repair action', value: session.repairAction },
            ]}
          />
          <RepentanceActionPlanner actions={session.actions || []} onMark={markAction} />
        </>
      )}
      {notice && <p className={notice.includes('urgent') || notice.includes('obsessive') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

export function GospelAssuranceCard({ assurance }) {
  return (
    <article className="sf-prayer">
      <b>{assurance.title} · {assurance.scriptureReference}</b>
      <p>{assurance.text}</p>
    </article>
  )
}

export function RepentanceActionPlanner({ actions, onMark }) {
  return (
    <article className="sf-card">
      <h3>Repentance Actions</h3>
      {actions.length ? actions.map((action) => (
        <div className="sf-insight-row" key={action.id}>
          <b>{action.description}</b>
          <p>{action.actionType} · due {new Date(action.dueAt).toLocaleDateString()} · {action.status}</p>
          <div className="sf-plan-actions">
            <button type="button" onClick={() => onMark(action, 'completed')}>Mark Completed</button>
            <button type="button" onClick={() => onMark(action, 'blocked')}>Blocked</button>
          </div>
        </div>
      )) : <p className="sf-empty">No actions planned yet.</p>}
    </article>
  )
}

export default function ScriptureFormationDashboard({ userId }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useMemo(() => loadScriptureFormationData(userId), [userId, refreshKey])
  const dashboard = useMemo(() => buildDashboard({ userId, ...data }), [userId, data])
  const today = todayKey()
  const todayLectio = data.lectioSessions.find((session) => session.sessionDate === today) || null
  const todayExamen = data.examenSessions.find((session) => session.sessionDate === today) || null
  const activeConfession = data.confessionSessions.find((session) => session.stage !== 'completed') || null

  function refresh() {
    setRefreshKey((value) => value + 1)
  }

  function saveLectio(value) {
    saveLectioSession(value)
    refresh()
  }

  function saveMemory(value) {
    saveMemoryItem(value)
    refresh()
  }

  function saveExamen(value) {
    saveExamenSession(value)
    refresh()
  }

  function saveConfession(value) {
    saveConfessionSession(value)
    refresh()
  }

  return (
    <section className="sf-section scripture-formation">
      <div className="sf-section-heading">
        <h2>Scripture Meditation & Inner Formation OS</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <div className="sf-home-grid">
        <article className="sf-card">
          <h3>Today's Scripture</h3>
          <p><b>{dashboard.today.dailyPassage.reference}</b></p>
          <p>{dashboard.today.dailyPassage.text}</p>
        </article>
        <article className="sf-card">
          <h3>Today's Formation</h3>
          <ul>
            <li>Lectio: {dashboard.today.lectioStatus}</li>
            <li>Memory due: {dashboard.today.memoryDueCount}</li>
            <li>Examen: {dashboard.today.examenStatus}</li>
            <li>Repentance actions: {dashboard.today.repentanceActionsDue.length}</li>
          </ul>
        </article>
        <article className="sf-card">
          <h3>Weekly Summary</h3>
          <ul>
            <li>Lectio completed: {dashboard.weeklySummary.lectioCompletedCount}</li>
            <li>Memory reviews: {dashboard.weeklySummary.memoryReviewsCount}</li>
            <li>Examen completed: {dashboard.weeklySummary.examenCompletedCount}</li>
            <li>Actions completed: {dashboard.weeklySummary.repentanceActionsCompletedCount}</li>
          </ul>
        </article>
      </div>
      <div className="sf-scripture-grid">
        <LectioDivinaCard userId={userId} session={todayLectio} onSave={saveLectio} />
        <ScriptureMemoryTrainer userId={userId} items={data.memoryItems} onSave={saveMemory} />
        <SpiritualExamenForm userId={userId} session={todayExamen} onSave={saveExamen} />
        <ConfessionRepentanceFlow userId={userId} session={activeConfession} onSave={saveConfession} />
      </div>
      <article className="sf-card">
        <h3>Assurance texts</h3>
        <div className="sf-chip-row">{gospelAssuranceTexts.map((item) => <span className="sf-chip" key={item.key}>{item.scriptureReference}</span>)}</div>
      </article>
    </section>
  )
}
