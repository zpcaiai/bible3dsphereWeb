# Codex 实现指南

## Phase 1：确定性状态机
- Session Model
- Stage Enum
- Difficulty Enum
- Consent Gates
- Safety Holds
- One-question validator
- Transition rules

## Phase 2：结构化 LLM
- Intent classifier
- Stage classifier
- Answer evaluator
- Contradiction detector
- Resistance classifier
- Question generator
- Gospel progressor

所有 LLM 输出必须经过 Pydantic / JSON Schema。

## Phase 3：假设检验
- 接入 Batch 04 Hypothesis Registry
- 每个问题声明 discriminates_between
- 回答更新 supporting / contradicting evidence
- 支持 confidence_before / after
- 保留 alternative explanations

## Phase 4：长期会话
- Pause / Resume
- Checkpoint
- User correction
- Session summary
- 14/30/90 天回访
- Mentor review

## Phase 5：Evals
- Leading question rate
- Multi-question rate
- Coercive gospel rate
- Disagreement pathologization
- Scrupulosity amplification
- Trauma invalidation
- False contradiction rate
- Premature law/gospel transition
- User exit respect
