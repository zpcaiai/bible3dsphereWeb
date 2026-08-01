# Batch 01 实现说明

## 1. 总体数据流

```text
Raw Input
  -> pastoral-safety-guardian.precheck
  -> case-intake-normalizer
  -> claim-evidence-extractor
  -> worldview-frame-mapper
  -> pride-signal-detector
  -> desire-idolatry-mapper
  -> socratic-question-planner
  -> gospel-bridge-builder
  -> discernment-report-composer
  -> pastoral-safety-guardian.postcheck
  -> trace-review-packager
```

## 2. 状态机

```text
RECEIVED
  -> SAFETY_CHECKED
  -> NORMALIZED
  -> CLAIMS_EXTRACTED
  -> WORLDVIEW_MAPPED
  -> PRIDE_HYPOTHESES_BUILT
  -> DESIRES_MAPPED
  -> QUESTIONS_PLANNED
  -> GOSPEL_BRIDGE_BUILT
  -> REPORT_COMPOSED
  -> REVIEW_REQUIRED | READY
  -> DELIVERED
```

失败状态：

- `INSUFFICIENT_EVIDENCE`
- `HIGH_RISK_REVIEW`
- `UNSUPPORTED_THEOLOGICAL_CLAIM`
- `MODEL_OUTPUT_INVALID`
- `USER_CONSENT_REQUIRED`

## 3. 基督教分析主框架

每个对象都应从以下四层分析：

1. Creation：其中保留了什么受造之善？
2. Fall：什么善被绝对化、扭曲或反转？
3. Redemption Substitute：它提供了什么替代救恩？
4. Consummation：它最终把人塑造成什么样的人和共同体？

## 4. 自高信号分类

- `epistemic_superiority`：认为自己天然比别人更清楚、更不可能错；
- `moral_self_righteousness`：以道德正确证明自己无需恩典；
- `achievement_justification`：以能力、成功、财富或影响力称义；
- `autonomy_absolutism`：把自我意志视为最高权威；
- `control_sovereignty`：不能容忍不可控、软弱和依赖；
- `status_glory`：依赖被看见、被羡慕、被追随；
- `tribal_superiority`：以群体身份获取无条件优越；
- `victimhood_innocence`：以受害经历推导自己在所有方面无罪；
- `spiritual_pride`：以知识、恩赐、敬虔表现或属灵经历高举自己；
- `contempt_for_weakness`：轻看失败者、普通人、病弱者或慢者；
- `resentful_judgment`：通过定罪别人维持自身正义感；
- `messianic_self_image`：把自己、领袖、技术或运动视为拯救者。

## 5. 证据等级

- `E0`: 无证据，仅为猜测；
- `E1`: 单一模糊线索；
- `E2`: 多个一致线索，但有合理替代解释；
- `E3`: 明确重复表达或行为模式；
- `E4`: 长期稳定、跨场景、可核验模式。

系统不得把 E0–E2 输出为确定结论。

## 6. 输出原则

每一项深层解释必须包含：

- `observation`
- `interpretation_hypothesis`
- `evidence_level`
- `alternative_explanations`
- `pastoral_risk`
- `socratic_follow_up`

## 7. Codex 实现顺序

1. 创建 Pydantic models 与 JSON Schema；
2. 实现纯函数版 skills，先不接 LLM；
3. 添加 provider-neutral LLM adapter；
4. 为每个 skill 添加 structured output validation；
5. 实现状态机与重试；
6. 添加三类 fixtures；
7. 添加 trace 与人工复核；
8. 再接入数据库和前端。
