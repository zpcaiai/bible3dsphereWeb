---
name: formation-twin-course-integrator
description: "Integrate Batch 11 profile, timelines, evidence, reviews, recommendations and data-rights views with feature flags, analytics, a11y and E2E."
---

# Goal

Users can understand and control the twin without dark patterns, hidden scores or leaked sensitive data.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 11 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch11-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/formation-twin-ontology-policy.md`
- `references/formation-event-and-state-policy.md`
- `references/trajectory-and-review-policy.md`
- `references/relationship-observation-policy.md`
- `references/twin-recommendation-human-agency-policy.md`
- `references/formation-data-lifecycle-policy.md`
- `schemas/formation-twin-profile.schema.json`
- `schemas/formation-state-snapshot.schema.json`
- `schemas/formation-signal-event.schema.json`
- `schemas/habit-trajectory.schema.json`
- `schemas/attention-trajectory.schema.json`
- `schemas/relationship-fruit-observation.schema.json`
- `schemas/practice-adherence-summary.schema.json`
- `schemas/formation-review-window.schema.json`
- `schemas/human-interpretation-note.schema.json`
- `schemas/twin-recommendation.schema.json`
- `schemas/formation-data-retention-policy.schema.json`
- `schemas/twin-export-deletion-request.schema.json`
- `assets/formation-twin-control-catalog.seed.yaml`
- `assets/formation-twin-curriculum.seed.yaml`
- `assets/formation-twin-scenarios.seed.yaml`
- `assets/formation-domain-ontology.seed.yaml`
- `assets/retention-defaults.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Register twin routes and settings.
2. Build evidence-first domain views.
3. Show consent, sharing and retention clearly.
4. Seed ontology/defaults after review.
5. Apply minimal analytics.
6. Run mobile/a11y/privacy/security/E2E.

# Data, privacy and integration rules

- Reuse Batch 01–10 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- Formation Twin只是经同意的有限领域镜像，不是灵魂、良心、属灵分身、临床模型或对一个人的终极解释。
- 不得生成总体属灵成熟分、救恩/呼召判断、未来属灵预测、隐藏特质、临床诊断或跨用户/家庭排名。
- 事件只能来自真实操作或授权人记录；模型不得编造事件，且不得保存原始私密叙事和第三方身份。
- 注意力轨迹不得接入完整设备遥测、浏览历史或私聊；实践轨迹不得显示streak、总依从率或惩罚错过。
- 所有模式必须链接证据、标明不确定性和替代解释，并允许用户确认、修改或拒绝。
- 关系观察必须有同意或合法角色，只能用粗粒度可观察果子，不能访问私人日记或生成关系质量分。
- 建议必须可解释、有替代、可拒绝；禁止自动改变计划、自动通知他人、作高风险决定或以置信度压过人。
- 数据必须目的限定、最短保留、儿童更少；导出/删除/暂停/纠正/撤销共享透明执行，审计例外不得静默。

# Tests

- consent UX
- no hidden score
- data rights E2E
- role isolation
- analytics redaction
- a11y

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
