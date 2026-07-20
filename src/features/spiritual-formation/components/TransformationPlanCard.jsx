import { sinPatternMap } from '../data/sinPatterns'
import PlanExecutionPanel from '../../../components/PlanExecutionPanel'

export default function TransformationPlanCard({ plan, onUpdate }) {
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
        onProgress={(summary) => onUpdate?.({
          ...plan,
          executionSummary: {
            currentCompleted: summary.completed,
            currentTotal: summary.total,
            totalCheckins: summary.totalCheckins,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        })}
      />
      <div className="sf-plan-actions">
        <button type="button" onClick={() => onUpdate?.({ ...plan, status: 'paused', updatedAt: new Date().toISOString() })}>Pause</button>
        <button type="button" onClick={() => onUpdate?.({ ...plan, status: 'completed', updatedAt: new Date().toISOString() })}>Complete</button>
      </div>
    </article>
  )
}
