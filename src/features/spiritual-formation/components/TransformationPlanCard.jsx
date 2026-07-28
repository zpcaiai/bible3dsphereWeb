import { sinPatternMap } from '../data/sinPatterns'
import PlanExecutionPanel from '../../../components/PlanExecutionPanel'
import { Meter } from '../../../components/charts'
import { useState } from 'react'

export default function TransformationPlanCard({ plan, onUpdate }) {
  // 先用已存的 executionSummary 打底，执行面板回调后再实时更新；
  // 没有任何执行记录时保持 null，不画 0/0 的假进度条。
  const [live, setLive] = useState(() => (plan.executionSummary
    ? {
      completed: plan.executionSummary.currentCompleted ?? 0,
      total: plan.executionSummary.currentTotal ?? 0,
      totalCheckins: plan.executionSummary.totalCheckins ?? 0,
    }
    : null))
  const actions = [
    ...(plan.dailyPractices || []).map((practice) => ({ ...practice, title: practice.name, cadence: 'daily' })),
    ...(plan.weeklyPractices || []).map((practice) => ({ ...practice, title: practice.name, cadence: 'weekly' })),
  ]
  return (
    <article className="sf-card sf-plan-card">
      <div className="sf-card-head">
        <div>
          <h3>{plan.title}</h3>
          <p>{sinPatternMap[plan.primarySinPattern].name} · {plan.duration.replaceAll('_', ' ')} · {plan.intensity}</p>
        </div>
        <span className={`sf-status ${plan.status}`}>{plan.status}</span>
      </div>
      <p>{plan.progressSummary}</p>
      {/* 计划卡上原本只有一句文字进度。执行面板回传的 completed/total 是真实数字，
          画成一条就能在卡片层一眼看出「这个计划到底动了没有」。 */}
      {live && live.total > 0 && (
        <Meter
          label="本轮操练完成度"
          value={live.completed}
          max={live.total}
          severity={live.completed >= live.total ? 'good' : live.completed === 0 ? 'warning' : undefined}
          hint={`累计打卡 ${live.totalCheckins} 次`}
        />
      )}
      <div className="sf-chip-row">{plan.targetFruits.map((fruit) => <span className="sf-chip" key={fruit}>{fruit.replace('_', ' ')}</span>)}</div>
      <div className="sf-practice-columns">
        <div>
          <h4>Weekly review questions</h4>
          <ul>{plan.reviewQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
      <PlanExecutionPanel
        userId={plan.userId}
        planId={`transformation:${plan.id}`}
        title="转化计划执行"
        description="每日操练按日期重新出现；每周操练按周记录，不会因一次勾选而永久完成。"
        actions={actions}
        onProgress={(summary) => { setLive({ completed: summary.completed, total: summary.total, totalCheckins: summary.totalCheckins }); return onUpdate?.({
          ...plan,
          executionSummary: {
            currentCompleted: summary.completed,
            currentTotal: summary.total,
            totalCheckins: summary.totalCheckins,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        }) }}
      />
      <div className="sf-plan-actions">
        <button type="button" onClick={() => onUpdate?.({ ...plan, status: 'paused', updatedAt: new Date().toISOString() })}>Pause</button>
        <button type="button" onClick={() => onUpdate?.({ ...plan, status: 'completed', updatedAt: new Date().toISOString() })}>Complete</button>
      </div>
    </article>
  )
}
