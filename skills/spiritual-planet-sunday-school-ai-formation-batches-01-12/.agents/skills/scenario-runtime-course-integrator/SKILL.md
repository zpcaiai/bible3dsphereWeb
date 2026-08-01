---
name: scenario-runtime-course-integrator
description: "Integrate Batch 10 author, learner and facilitator views with curriculum, feature flags, analytics, accessibility and E2E."
---

# Goal

Scenario authoring and runtime work end-to-end across roles without exposing sensitive reflections or bypassing review.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 10 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch10-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/scenario-authoring-policy.md`
- `references/scenario-runtime-state-policy.md`
- `references/choice-consequence-and-repair-policy.md`
- `references/socratic-branching-policy.md`
- `references/facilitator-and-safety-policy.md`
- `references/scenario-benchmark-policy.md`
- `schemas/scenario-definition.schema.json`
- `schemas/scenario-runtime-session.schema.json`
- `schemas/scenario-trigger-state-timeline.schema.json`
- `schemas/choice-node.schema.json`
- `schemas/consequence-projection.schema.json`
- `schemas/scripture-grace-intervention.schema.json`
- `schemas/socratic-branch.schema.json`
- `schemas/facilitator-intervention.schema.json`
- `schemas/scenario-safety-decision.schema.json`
- `schemas/scenario-debrief.schema.json`
- `schemas/scenario-authoring-review.schema.json`
- `schemas/scenario-benchmark-result.schema.json`
- `assets/scenario-runtime-control-catalog.seed.yaml`
- `assets/scenario-runtime-curriculum.seed.yaml`
- `assets/scenario-runtime-scenarios.seed.yaml`
- `assets/scenario-node-template.seed.yaml`
- `assets/scenario-benchmark-suite.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Register authoring/runtime/debrief routes.
2. Integrate Batch 09 lesson exercises.
3. Seed scenario packs and benchmarks.
4. Apply age/role/review/feature gates.
5. Implement minimal analytics.
6. Run browser, mobile, a11y, safety and migration tests.

# Data, privacy and integration rules

- Reuse Batch 01–09 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 所有情境必须虚构、非露骨、可跳过且经过相应神学/牧养/儿童安全审核；不得要求学习者重演真实创伤。
- 运行时只保存版本、节点、选择和状态，不保存原始自由文本，不根据路径建立人格、风险或属灵画像。
- 选择节点不得用羞耻、倒计时、预设唯一“敬虔答案”或隐藏惩罚操控学习者。
- 后果是带不确定性的可能果子，不是预言；不得生成未来行为、救恩或道德价值评分。
- 经文/恩典介入必须同时保留真理、责任、修复和帮助；禁止廉价恩典、纯定罪或“神告诉你”式私人神谕。
- 苏格拉底分支必须允许跳过、不确定和替代解释，禁止强迫继续、诱导认罪和采集私密历史。
- 真实安全披露必须退出角色扮演；教师不得公开羞辱、承诺绝对保密或做取证式追问。
- 合成基准只证明工程行为，不得宣称真实属灵成长、临床效果或生产安全已获证明。

# Tests

- role/review gates
- no sensitive analytics
- graph UI a11y
- pause/resume E2E
- S3 E2E

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
