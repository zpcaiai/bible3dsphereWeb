import { useState } from 'react'
import { sinPatterns } from '../data/sinPatterns'
import { generateTransformationPlan, getIntensityDescription } from '../lib/planGenerator'
import TransformationPlanCard from './TransformationPlanCard'
import { Meter, RingProgress } from '../../../components/charts'
import { T, localizePlanTitle } from '../lib/localize'

// 计划进度只认 executionSummary（PlanExecutionPanel 真实回写的当期完成数），
// 不用「计划已创建」或日期过去了多少天冒充进度——那是日历在走，不是人在操练。
// 每个计划一条 Meter：看得出是哪一个计划在拖；外加一个总环：一眼知道当期整体完成到哪。
// 没有 executionSummary 的计划不画 0/0 的假条，只在下方如实说明还没有执行记录。
function PlanProgressPanel({ plans = [] }) {
  const tracked = plans.filter((plan) => plan.executionSummary && Number(plan.executionSummary.currentTotal) > 0)
  const untracked = plans.length - tracked.length
  const completed = tracked.reduce((sum, plan) => sum + (Number(plan.executionSummary.currentCompleted) || 0), 0)
  const total = tracked.reduce((sum, plan) => sum + (Number(plan.executionSummary.currentTotal) || 0), 0)

  if (!plans.length) return null
  return (
    <article className="sf-card">
      <h3>{T('计划执行进度', 'Plan execution progress')}</h3>
      {tracked.length ? (
        <>
          <RingProgress
            value={completed}
            max={total}
            label={T('当期总完成度', 'Current completion')}
            sublabel={T(`${completed}/${total} 项操练`, `${completed}/${total} practices`)}
            severity={total && completed / total >= 0.6 ? 'good' : 'warning'}
          />
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {tracked.map((plan) => (
              <Meter
                key={plan.id}
                label={localizePlanTitle(plan) || plan.title}
                value={Number(plan.executionSummary.currentCompleted) || 0}
                max={Number(plan.executionSummary.currentTotal) || 1}
                unit={T(' 项', '')}
                hint={T(
                  `${plan.status} · 累计打卡 ${plan.executionSummary.totalCheckins || 0} 次`,
                  `${plan.status} · ${plan.executionSummary.totalCheckins || 0} check-in(s) in total`,
                )}
              />
            ))}
          </div>
        </>
      ) : null}
      {untracked > 0 && (
        <p className="sf-empty">
          {T(
            `${untracked} 个计划还没有任何执行记录，所以不画进度条——计划被创建不等于操练被完成。`,
            `${untracked} plan(s) have no execution record yet, so no bar is drawn. Creating a plan is not completing a practice.`,
          )}
        </p>
      )}
    </article>
  )
}

export default function TransformationPlanDashboard({ userId, plans, onSave, onUpdate }) {
  const [form, setForm] = useState({ duration: '7_days', intensity: 'normal', primarySinPattern: 'entertainment_escapism', secondarySinPattern: '', startDate: new Date().toISOString().slice(0, 10) })
  const intensity = getIntensityDescription(form.intensity)
  const active = plans.find((plan) => plan.status === 'active')
  function createPlan() {
    onSave(generateTransformationPlan({
      userId,
      duration: form.duration,
      intensity: form.intensity,
      primarySinPattern: form.primarySinPattern,
      secondarySinPattern: form.secondarySinPattern || undefined,
      startDate: form.startDate,
    }))
  }
  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>Transformation Plan Dashboard</h2><p>Create a practical plan for awareness, mortification, and new obedience.</p></div>
      <div className="sf-create-plan">
        <label>Duration<select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}><option value="7_days">7-day Awareness</option><option value="30_days">30-day Mortification</option><option value="90_days">90-day Character Formation</option><option value="1_year">1-year New Creation Map</option></select></label>
        <label>Intensity<select value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })}><option value="light">light</option><option value="normal">normal</option><option value="deep">deep</option><option value="battle">battle</option></select></label>
        <label>Primary pattern<select value={form.primarySinPattern} onChange={(e) => setForm({ ...form, primarySinPattern: e.target.value })}>{sinPatterns.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Secondary pattern<select value={form.secondarySinPattern} onChange={(e) => setForm({ ...form, secondarySinPattern: e.target.value })}><option value="">None</option>{sinPatterns.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Start date<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
      </div>
      <p className="sf-muted"><b>{intensity.title}</b> · {intensity.dailyMinutes}. {intensity.description}</p>
      <button className="sf-primary" type="button" onClick={createPlan}>Create Plan</button>
      <PlanProgressPanel plans={plans} />
      {active ? <TransformationPlanCard plan={active} onUpdate={onUpdate} /> : <p className="sf-empty">No active plan yet. Create one above to begin a concrete rhythm.</p>}
      {plans.filter((plan) => plan.status !== 'active').length > 0 && (
        <div className="sf-plan-history">
          <h3>Other plans</h3>
          {plans.filter((plan) => plan.status !== 'active').map((plan) => <TransformationPlanCard key={plan.id} plan={plan} onUpdate={onUpdate} />)}
        </div>
      )}
    </section>
  )
}
