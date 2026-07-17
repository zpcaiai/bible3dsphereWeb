import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  completePatternReview,
  createLifeSeason,
  generatePatternReview,
  getCurrentFormationPatterns,
  listFormationPatternCandidates,
  listFormationTrajectories,
  listLifeSeasons,
  listPatternReviews,
  rebuildFormationPatterns,
  reviewFormationPattern,
  setLifeSeasonActive,
  skipPatternReview,
} from './formationTwinApi'

const VIEWS = [
  ['current', '当前模式', '/formation-twin/patterns/current'],
  ['candidates', '待我确认', '/formation-twin/patterns/candidates'],
  ['trajectories', '形成轨迹', '/formation-twin/trajectories'],
  ['seasons', '人生阶段', '/formation-twin/life-seasons'],
  ['reviews', '定期回顾', '/formation-twin/reviews'],
  ['evidence', '证据与反例', '/formation-twin/evidence'],
]

const STATUS_LABELS = {
  CONFIRMED_ACTIVE: '已确认，目前适用',
  CONFIRMED_CONTEXTUAL: '已确认，仅限特定阶段',
  WEAKENING: '近期正在减弱',
  DORMANT: '暂时休眠',
  PENDING_USER_REVIEW: '等待你确认',
  CANDIDATE: '系统候选',
  RESOLVED: '你已标记解决',
  OUTDATED: '已不适用于当前阶段',
}

const CONFIDENCE_LABELS = { VERY_LOW: '证据很有限', LOW: '证据有限', MODERATE: '有一些独立证据', HIGH: '有较多独立证据' }
const DIRECTION_LABELS = {
  EMERGING: '新的回应正在出现', STRENGTHENING: '这一回应更常出现', STABLE: '目前相对稳定',
  WEAKENING: '旧路径正在减弱', BEING_REPLACED: '可能正被新的回应替代', DORMANT: '近期未再出现',
  RESOLVED_BY_USER: '你已标记解决', MIXED: '新旧路径并存', INSUFFICIENT_DATA: '数据不足，暂不判断',
}

const EMPTY = { current: [], candidates: [], trajectories: [], seasons: [], reviews: [] }

function EvidenceList({ title, items = [], kind }) {
  return (
    <div className={`ft-pattern-evidence ${kind}`}>
      <h5>{i18nT(title)}</h5>
      {items.length ? items.map((item) => (
        <div key={item.id || item.evidence_id}>
          <span>{i18nT(item.explanation || '结构化证据引用')}</span>
          <small>{i18nT('来源引用：')}{item.source_record_type} · {new Date(item.occurred_at).toLocaleDateString()}</small>
        </div>
      )) : <p>{i18nT(kind === 'counter' ? '尚未记录反例；这不代表不存在反例。' : '暂无可展示的独立证据。')}</p>}
    </div>
  )
}

function PatternCard({ pattern, candidate = false, busy, onAction }) {
  const scope = pattern.scope || {}
  return (
    <article className="ft-pattern-card" data-status={pattern.lifecycle_status}>
      <header>
        <div>
          <span>{i18nT(STATUS_LABELS[pattern.lifecycle_status] || pattern.lifecycle_status)}</span>
          <h4>{pattern.title}</h4>
        </div>
        <small>{i18nT(CONFIDENCE_LABELS[pattern.confidence?.level] || '证据支持程度未计算')}</small>
      </header>
      <p>{pattern.description}</p>
      <dl>
        <div><dt>{i18nT('作用范围')}</dt><dd>{i18nT(scope.user_description || scope.scope_kind || '当前情境')}</dd></div>
        <div><dt>{i18nT('首次记录')}</dt><dd>{new Date(pattern.first_observed_at).toLocaleDateString()}</dd></div>
        <div><dt>{i18nT('最近记录')}</dt><dd>{new Date(pattern.last_observed_at).toLocaleDateString()}</dd></div>
        <div><dt>{i18nT('建议复查')}</dt><dd>{new Date(pattern.review_due_at).toLocaleDateString()}</dd></div>
      </dl>
      <div className="ft-pattern-evidence-grid">
        <EvidenceList title="支持这一假设的记录" items={pattern.supporting_evidence} kind="support" />
        <EvidenceList title="反例与范围限制" items={pattern.counterevidence} kind="counter" />
      </div>
      {!!pattern.alternative_explanations?.length && (
        <details>
          <summary>{i18nT('其他可能的解释')}</summary>
          <ul>{pattern.alternative_explanations.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      )}
      {!!pattern.limitations?.length && (
        <details>
          <summary>{i18nT('数据限制')}</summary>
          <ul>{pattern.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      )}
      <footer>
        {candidate ? (
          <>
            <button type="button" disabled={busy} onClick={() => onAction(pattern.id, 'confirm')}>{i18nT('这符合我')}</button>
            <button type="button" disabled={busy} onClick={() => onAction(pattern.id, 'narrow-scope', { scope: { ...scope, scope_kind: 'CURRENT_CONTEXT_ONLY' } })}>{i18nT('只限当前阶段')}</button>
            <button type="button" disabled={busy} onClick={() => onAction(pattern.id, 'reject')}>{i18nT('这不符合我')}</button>
          </>
        ) : (
          <>
            <button type="button" disabled={busy} onClick={() => onAction(pattern.id, 'mark-weakening')}>{i18nT('最近正在减弱')}</button>
            <button type="button" disabled={busy} onClick={() => onAction(pattern.id, 'mark-outdated')}>{i18nT('只适用于过去')}</button>
            <button type="button" disabled={busy} onClick={() => onAction(pattern.id, 'mark-resolved')}>{i18nT('我已不再受它主导')}</button>
          </>
        )}
      </footer>
    </article>
  )
}

export default function FormationTwinPatterns({ user, initialData = null, onSafety }) {
  const [view, setView] = useState('current')
  const [data, setData] = useState(initialData || EMPTY)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [seasonForm, setSeasonForm] = useState({ title: '', season_type: 'USER_DEFINED', started_at: new Date().toISOString().slice(0, 10), life_domains: [] })

  const refresh = useCallback(async () => {
    if (!user || initialData) return
    setLoading(true); setError('')
    try {
      const results = await Promise.all([
        getCurrentFormationPatterns(), listFormationPatternCandidates(), listFormationTrajectories(), listLifeSeasons(), listPatternReviews(),
      ])
      setData({ current: results[0].patterns || [], candidates: results[1].patterns || [], trajectories: results[2].trajectories || [], seasons: results[3].life_seasons || [], reviews: results[4].reviews || [] })
    } catch (err) {
      setError(err.message || '暂时无法加载长期模式')
    } finally { setLoading(false) }
  }, [initialData, user])

  useEffect(() => { refresh() }, [refresh])

  const allPatterns = useMemo(() => [...(data.current || []), ...(data.candidates || [])], [data])

  const act = async (id, action, payload = {}) => {
    setBusy(`${id}:${action}`); setError('')
    try { await reviewFormationPattern(id, action, payload); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy('') }
  }

  const rebuild = async () => {
    setBusy('rebuild'); setError('')
    try { await rebuildFormationPatterns(); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy('') }
  }

  const addSeason = async (event) => {
    event.preventDefault(); if (!seasonForm.title.trim()) return
    setBusy('season')
    try {
      await createLifeSeason({ ...seasonForm, title: seasonForm.title.trim(), started_at: new Date(`${seasonForm.started_at}T00:00:00`).toISOString(), time_precision: 'DAY', roles: [] })
      setSeasonForm((value) => ({ ...value, title: '' })); await refresh()
    } catch (err) { setError(err.message) }
    finally { setBusy('') }
  }

  return (
    <div className="ft-patterns" id="formation-twin-patterns">
      <header className="ft-patterns-head">
        <div>
          <span>{i18nT('TEMPORAL FORMATION')}</span>
          <h3>{i18nT('长期模式与形成轨迹')}</h3>
          <p>{i18nT('这里展示的是有时间范围、可纠正、会过期的形成假设；它们不是人格标签，也不是神对你的最终评价。')}</p>
        </div>
        <button type="button" disabled={loading || busy === 'rebuild'} onClick={rebuild}>{busy === 'rebuild' ? i18nT('正在核对…') : i18nT('根据已确认记录重新核对')}</button>
      </header>

      <div className="ft-pattern-bias" role="note">
        <strong>{i18nT('记录偏差提醒')}</strong>
        <span>{i18nT('你可能更常在困难时期记录；没有记录不表示没有成长，记录频率也不等于真实发生频率。')}</span>
      </div>

      <nav className="ft-pattern-tabs" aria-label={i18nT('长期模式页面')}>
        {VIEWS.map(([key, label, route]) => (
          <button type="button" key={key} data-route={route} aria-selected={view === key} onClick={() => setView(key)}>{i18nT(label)}</button>
        ))}
      </nav>

      {error && <div className="ft-pattern-error" role="alert">{error}</div>}
      {loading && <p className="ft-pattern-empty">{i18nT('正在读取经授权的结构化记录…')}</p>}

      {!loading && view === 'current' && (
        <section className="ft-pattern-view" aria-label={i18nT('当前长期模式')}>
          {(data.current || []).length ? data.current.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} busy={busy.startsWith(pattern.id)} onAction={act} />) : (
            <div className="ft-pattern-empty"><strong>{i18nT('目前没有已确认的长期模式')}</strong><p>{i18nT('这可能是数据不足，也可能只是你尚未确认候选；系统不会为填满页面而制造结论。')}</p></div>
          )}
        </section>
      )}

      {!loading && view === 'candidates' && (
        <section className="ft-pattern-view" aria-label={i18nT('待确认模式')}>
          {(data.candidates || []).length ? data.candidates.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} candidate busy={busy.startsWith(pattern.id)} onAction={act} />) : (
            <div className="ft-pattern-empty"><strong>{i18nT('目前没有待确认候选')}</strong><p>{i18nT('单次事件不会形成长期模式；至少需要三个独立事件或两条你已确认的形成链。')}</p></div>
          )}
        </section>
      )}

      {!loading && view === 'trajectories' && (
        <section className="ft-pattern-view" aria-label={i18nT('形成轨迹')}>
          {(data.trajectories || []).length ? data.trajectories.map((item) => (
            <article className="ft-trajectory-card" key={item.id}>
              <span>{i18nT(DIRECTION_LABELS[item.current_direction] || item.current_direction)}</span><h4>{item.title}</h4>
              <p>{i18nT('轨迹只描述旧回应与新回应随时间的方向，不计算成长百分比。')}</p>
              <ul>{(item.limitations_json || []).map((limit) => <li key={limit}>{limit}</li>)}</ul>
            </article>
          )) : <div className="ft-pattern-empty"><strong>{i18nT('数据不足，暂不绘制轨迹')}</strong><p>{i18nT('当你确认模式的变化、反例或新的替代回应后，这里才会显示方向。')}</p></div>}
        </section>
      )}

      {!loading && view === 'seasons' && (
        <section className="ft-pattern-view">
          <form className="ft-season-form" onSubmit={addSeason}>
            <h4>{i18nT('添加我所处的人生阶段')}</h4>
            <label>{i18nT('阶段名称')}<input value={seasonForm.title} onChange={(event) => setSeasonForm({ ...seasonForm, title: event.target.value })} placeholder={i18nT('例如：项目交付期')} /></label>
            <label>{i18nT('开始日期')}<input type="date" value={seasonForm.started_at} onChange={(event) => setSeasonForm({ ...seasonForm, started_at: event.target.value })} /></label>
            <button type="submit" disabled={busy === 'season' || !seasonForm.title.trim()}>{i18nT('保存阶段')}</button>
          </form>
          {(data.seasons || []).map((season) => (
            <article className="ft-season-card" key={season.id}>
              <div><span>{season.active ? i18nT('当前阶段') : i18nT('历史阶段')}</span><h4>{season.title}</h4><p>{new Date(season.started_at).toLocaleDateString()} {season.ended_at ? `— ${new Date(season.ended_at).toLocaleDateString()}` : `— ${i18nT('现在')}`}</p></div>
              <button type="button" onClick={async () => { await setLifeSeasonActive(season.id, !season.active); await refresh() }}>{season.active ? i18nT('结束这个阶段并复查模式') : i18nT('重新打开')}</button>
            </article>
          ))}
        </section>
      )}

      {!loading && view === 'reviews' && (
        <section className="ft-pattern-view">
          <button className="ft-generate-review" type="button" onClick={async () => { await generatePatternReview(); await refresh() }}>{i18nT('生成一次有限的月度回顾')}</button>
          {(data.reviews || []).filter((item) => item.status === 'PENDING').map((review) => (
            <article className="ft-review-card" key={review.id}>
              <span>{review.review_type}</span><h4>{i18nT('一次只核对少量高价值问题')}</h4>
              {(review.review_payload_json?.user_questions || []).map((question) => <p key={question}>{question}</p>)}
              <div><button type="button" onClick={async () => { await completePatternReview(review.id); await refresh() }}>{i18nT('完成回顾')}</button><button type="button" onClick={async () => { await skipPatternReview(review.id); await refresh() }}>{i18nT('这次跳过')}</button></div>
            </article>
          ))}
          {!(data.reviews || []).some((item) => item.status === 'PENDING') && <div className="ft-pattern-empty"><p>{i18nT('没有待处理回顾。跳过回顾不会让候选模式自动成立。')}</p></div>}
        </section>
      )}

      {!loading && view === 'evidence' && (
        <section className="ft-pattern-view">
          {allPatterns.length ? allPatterns.map((pattern) => (
            <article className="ft-evidence-overview" key={pattern.id}>
              <h4>{pattern.title}</h4><div className="ft-pattern-evidence-grid"><EvidenceList title="支持证据" items={pattern.supporting_evidence} kind="support" /><EvidenceList title="反证据" items={pattern.counterevidence} kind="counter" /></div>
            </article>
          )) : <div className="ft-pattern-empty"><p>{i18nT('暂无模式证据可展示。')}</p></div>}
        </section>
      )}

      <footer className="ft-patterns-boundary">
        <p>{i18nT('完整日记、祷告、认罪、试探、语音转写和危机正文不会进入模式、日志、指标或证据图谱。')}</p>
        <button type="button" onClick={onSafety}>{i18nT('如有安全风险，先打开危机帮助')}</button>
      </footer>
    </div>
  )
}
