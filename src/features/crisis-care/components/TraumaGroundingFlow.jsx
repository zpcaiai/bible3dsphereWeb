import { TRAUMA_GROUNDING } from '../data/crisisContent'
import GroundingExercise from './GroundingExercise'

/**
 * TraumaGroundingFlow — 创伤触发 / 解离 / flashback 的稳定。
 * 只做 grounding 与环境确认，不要求复述创伤、不做暴露、不属灵化解释。
 */
const DONTS = [
  '不会要求你详细复述创伤',
  '不会做暴露疗法',
  '不会说「这是神的美意」',
  '不会说「你饶恕他就好了」',
]

export default function TraumaGroundingFlow() {
  return (
    <div className="cc-card">
      <p>{TRAUMA_GROUNDING}</p>
      <div style={{ margin: '14px 0' }}>
        <GroundingExercise />
      </div>
      <h3>在这里，我们的约定</h3>
      {DONTS.map((d) => (
        <p key={d} className="cc-muted">· {d}</p>
      ))}
      <p className="cc-muted">如果这样的状态反复出现，强烈建议找一位专业的创伤治疗师一起处理。你值得被好好照顾。</p>
    </div>
  )
}
