# Batch 03 架构说明

## 1. 与前两批的接入点

```text
Batch 01 case-intake-normalizer
  -> Batch 03 viral-case-normalizer
  -> public-figure-evidence-profiler
  -> identity-persona-separator
  -> content-corpus-curator
  -> narrative-rhetoric-analyzer
  -> Batch 02 domain-pack-matcher/composer
  -> worldview-salvation-linker
  -> business-model-monetization-analyzer
  -> platform-affordance-analyzer
  -> audience-desire-segmenter
  -> virality-trigger-decomposer
  -> propagation-network-builder
  -> controversy-cycle-engine
  -> manipulation-trust-risk-detector
  -> parasocial-community-analyzer
  -> counterfactual-explanation-engine
  -> long-term-formation-fruit-evaluator
  -> Batch 01 socratic-question-planner
  -> socratic-hotspot-question-planner
  -> Batch 01 gospel-bridge-builder
  -> gospel-cultural-bridge-builder
  -> integrated-virality-report-composer
  -> public-figure-safety-guardian
```

## 2. 九段核心分析链

### A. 人物
只记录可验证的公开经历、技能、组织关系、历史言论和行为模式。

### B. 人设
区分：
- 可验证身份；
- 自我宣称；
- 内容中反复呈现的角色；
- 粉丝赋予的象征；
- 品牌团队塑造的商业人设；
- 系统推断。

### C. 内容
分析题材、叙事、情绪、修辞、价值判断、敌人、救主、行动号召和内容模板。

### D. 商业模式
识别广告、带货、课程、会员、打赏、经纪、咨询、订阅、数据、平台分成和线下业务，但不在无证据时断言具体收入。

### E. 平台算法与可供性
只能分析可观察的平台功能和分发迹象：
- 推荐流；
- 转发与合拍；
- 热搜；
- 直播；
- 评论排序；
- 话题标签；
- 短视频完播激励；
- 争议互动激励。

不得把不可见算法内部机制写成确定事实。

### F. 受众欲望
按不同受众段识别真实需要、恐惧、身份愿望、社会处境和可能的偶像化，禁止把粉丝整体污名化。

### G. 传播网络
构建人物、内容、媒体、社群、品牌、反对者、搬运者和平台节点图；区分原始传播、二次解读、批评传播和反讽传播。

### H. 争议循环
状态机：

```text
LATENT
-> TRIGGERED
-> AMPLIFYING
-> POLARIZED
-> MONETIZED
-> FATIGUED
-> REFRAMED | RESOLVED | REIGNITED
```

### I. 长期塑造果子
评估长期接触对受众的可能塑造：
- 注意力；
- 真理习惯；
- 欲望；
- 身份；
- 关系；
- 工作与金钱；
- 身体与性；
- 公共生活；
- 属灵开放性。

## 3. 爆火因果分解

```text
virality_score is not a truth score.

observed_virality =
  creator_capability
+ narrative_fit
+ emotional_activation
+ platform_affordance
+ network_seeding
+ controversy_lift
+ audience_need_fit
+ timing
+ randomness
```

该模型是分析框架，不是可证明的完整因果方程。

## 4. 证据等级

- `P0`：无公开证据；
- `P1`：单一未经独立验证的公开来源；
- `P2`：多个一致公开来源，但仍可能同源；
- `P3`：一手材料、官方披露或可重复观察；
- `P4`：跨时间、跨平台、跨来源稳定证据。

算法因果、个人动机和商业收入通常不得高于 P2，除非有公开披露或可审计实验。

## 5. 三种图

### Evidence Graph
连接 claim -> source -> extraction -> interpretation。

### Propagation Graph
连接 actor -> content -> repost/comment/critique -> audience cluster。

### Formation Graph
连接 exposure -> attention -> desire -> belief -> practice -> fruit。

## 6. 生产状态机

```text
RECEIVED
-> CONSENT_CHECKED
-> NORMALIZED
-> EVIDENCE_PROFILED
-> PERSONA_SEPARATED
-> CORPUS_CURATED
-> CONTENT_ANALYZED
-> WORLDVIEW_LINKED
-> BUSINESS_ANALYZED
-> PLATFORM_ANALYZED
-> AUDIENCE_SEGMENTED
-> VIRALITY_DECOMPOSED
-> NETWORK_BUILT
-> CONTROVERSY_MODELED
-> TRUST_RISK_ASSESSED
-> PARASOCIAL_ANALYZED
-> COUNTERFACTUAL_CHECKED
-> FORMATION_EVALUATED
-> QUESTIONS_PLANNED
-> GOSPEL_BRIDGE_BUILT
-> REPORT_COMPOSED
-> REVIEW_REQUIRED | READY
```

## 7. 最小生产要求

- 所有高风险结论具备证据引用；
- 所有因果推断具备替代解释；
- 公众人物报告经过安全守卫；
- Domain Pack 命中保留版本；
- 每项长期果子明确标注“观察”或“前瞻假设”；
- 支持时间切片，避免把一次爆火当作稳定人格；
- 支持删除、导出、租户隔离和人工纠错。
