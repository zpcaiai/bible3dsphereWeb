import { useState } from 'react'
import { t as i18nT } from '../i18n/runtime'
import {
  listPlanReviews,
  normalizePlanActions,
  planExecutionIdentity,
  planExecutionSummary,
  writePlanExecution,
  writePlanReview,
} from '../formationPlanProgress'

const cadenceLabel = {
  once: '一次行动',
  daily: '每日',
  weekly: '每周',
}

export default function PlanExecutionPanel({
  user,
  userId,
  planId,
  title = '计划执行',
  actions = [],
  defaultCadence = 'once',
  description = '',
  showReview = true,
  compact = false,
  onProgress,
}) {
  const identity = planExecutionIdentity(user || userId)
  const normalized = normalizePlanActions(actions, defaultCadence)
  const [, setRevision] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const storage = typeof window === 'undefined' ? null : window.localStorage
  const summary = planExecutionSummary(storage, identity, planId, normalized)
  const reviews = listPlanReviews(storage, identity, planId)

  function update(action, patch) {
    writePlanExecution(storage, identity, planId, action, { ...patch, planTitle: title })
    setRevision((value) => value + 1)
    onProgress?.(planExecutionSummary(storage, identity, planId, normalized))
  }

  function saveReview() {
    const saved = writePlanReview(storage, identity, planId, reviewText)
    if (!saved) return
    setReviewText('')
    setRevision((value) => value + 1)
  }

  if (!planId || normalized.length === 0) return null

  return (
    <section style={{ marginTop: 12, padding: compact ? 12 : 16, borderRadius: 14, border: '1px solid rgba(90,200,250,0.2)', background: 'rgba(90,200,250,0.055)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, color: '#d8f4ff' }}>{i18nT(title)}</h4>
          {description ? <p style={{ margin: '4px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.52)' }}>{i18nT(description)}</p> : null}
        </div>
        <strong style={{ whiteSpace: 'nowrap', color: '#7dd3fc', fontSize: 13 }}>{summary.completed}/{summary.total}</strong>
      </div>
      <div style={{ height: 6, margin: '10px 0 12px', overflow: 'hidden', borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${summary.percent}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#34c759,#5ac8fa)', transition: 'width .25s' }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {summary.current.map(({ action, record }) => {
          const done = record?.status === 'completed'
          const blocked = record?.status === 'blocked'
          return (
            <article key={action.id} style={{ padding: '10px 11px', borderRadius: 10, border: `1px solid ${done ? 'rgba(52,199,89,.3)' : blocked ? 'rgba(255,159,10,.3)' : 'rgba(255,255,255,.08)'}`, background: done ? 'rgba(52,199,89,.06)' : 'rgba(255,255,255,.025)' }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <button type="button" aria-label={done ? i18nT('取消完成') : i18nT('标记完成')} onClick={() => update(action, { status: done ? 'planned' : 'completed' })} style={{ flexShrink: 0, width: 25, height: 25, padding: 0, borderRadius: 7, cursor: 'pointer', border: `1px solid ${done ? '#34c759' : 'rgba(255,255,255,.25)'}`, background: done ? '#34c759' : 'transparent', color: '#07120a', fontWeight: 900 }}>{done ? '✓' : ''}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: done ? '#9de2ad' : '#fff', fontSize: 13, lineHeight: 1.55, textDecoration: done ? 'line-through' : 'none' }}>{i18nT(action.title)}</div>
                  <div style={{ marginTop: 2, fontSize: 10.5, color: 'rgba(255,255,255,.4)' }}>
                    {i18nT(cadenceLabel[action.cadence] || cadenceLabel.once)}
                    {action.estimatedMinutes || action.minutes ? ` · ${action.estimatedMinutes || action.minutes} ${i18nT('分钟')}` : ''}
                    {action.minimum ? ` · ${i18nT('最小一步：')}${i18nT(action.minimum)}` : ''}
                  </div>
                  {(action.when || action.where || action.support) ? <div style={{ marginTop: 3, fontSize: 10.5, color: 'rgba(125,211,252,.66)' }}>{[action.when, action.where, action.support].filter(Boolean).map((item) => i18nT(item)).join(' · ')}</div> : null}
                </div>
                <button type="button" aria-pressed={blocked} onClick={() => update(action, { status: blocked ? 'planned' : 'blocked' })} style={{ flexShrink: 0, padding: '4px 7px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,159,10,.25)', background: blocked ? 'rgba(255,159,10,.2)' : 'transparent', color: '#ffc36b', fontSize: 10.5 }}>{i18nT(blocked ? '取消受阻' : '受阻')}</button>
              </div>
              <input aria-label={i18nT('执行安排')} defaultValue={record?.evidence || ''} onBlur={(event) => update(action, { status: record?.status || 'planned', evidence: event.target.value })} placeholder={i18nT('安排：何时、何地、和谁或由什么触发')} style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(125,211,252,.13)', background: 'rgba(0,0,0,.18)', color: '#fff', fontSize: 11.5 }} />
              <input aria-label={i18nT('执行反思')} defaultValue={record?.reflection || ''} onBlur={(event) => update(action, { status: record?.status || 'planned', reflection: event.target.value })} placeholder={i18nT('一句执行反思（可选）')} style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,.09)', background: 'rgba(0,0,0,.18)', color: '#fff', fontSize: 11.5 }} />
            </article>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10, color: 'rgba(255,255,255,.46)', fontSize: 10.5 }}>
        <span>{i18nT('近7天完成')} {summary.recentCompleted} {i18nT('次')}</span>
        <span>{i18nT('累计记录')} {summary.totalCheckins} {i18nT('次')}</span>
        {summary.blocked ? <span style={{ color: '#ffc36b' }}>{i18nT('当前受阻')} {summary.blocked}</span> : null}
      </div>
      {showReview ? (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: '#b9e8fb', fontSize: 11.5 }}>{i18nT('每周复盘')} · {reviews.length}</summary>
          <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder={i18nT('哪些行动带来信、望、爱？下周需要怎样调整？')} style={{ width: '100%', minHeight: 66, boxSizing: 'border-box', marginTop: 8, padding: 9, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(0,0,0,.2)', color: '#fff', fontSize: 11.5 }} />
          <button type="button" onClick={saveReview} disabled={!reviewText.trim()} style={{ marginTop: 6, padding: '7px 10px', border: 0, borderRadius: 8, background: '#287fa4', color: '#fff', cursor: reviewText.trim() ? 'pointer' : 'not-allowed', opacity: reviewText.trim() ? 1 : .5 }}>{i18nT('保存本周复盘')}</button>
          {reviews.slice(0, 3).map((review) => <p key={review.id} style={{ margin: '7px 0 0', color: 'rgba(255,255,255,.55)', fontSize: 10.8 }}>{review.weekKey} · {review.text}</p>)}
        </details>
      ) : null}
    </section>
  )
}
