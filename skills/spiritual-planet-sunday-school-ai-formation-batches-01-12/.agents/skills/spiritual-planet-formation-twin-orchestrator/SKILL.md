---
name: spiritual-planet-formation-twin-orchestrator
description: "Implement Batch 11 consent-bound formation events, domain snapshots, trajectories, relationship fruit, reviews, human notes, recommendations, retention and data rights."
---

# Mission

Implement **Batch 11: Formation Twin：注意力、习惯、关系果子与7/14/30/90天纵向成长系统** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–10 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

# Required companion skills

Load when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- `$spiritual-planet-identity-intimacy-recovery-orchestrator`
- `$spiritual-planet-parent-formation-orchestrator`
- `$spiritual-planet-family-attention-covenant-orchestrator`
- `$spiritual-planet-child-formation-orchestrator`
- `$spiritual-planet-youth-autonomy-orchestrator`
- `$spiritual-planet-curriculum-teacher-engine-orchestrator`
- `$spiritual-planet-scenario-runtime-orchestrator`
- every focused Batch 11 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

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

# End-to-end workflow

1. Inspect event, analytics, plans, journals, household, consent and data-rights architecture.
2. Implement 12 schemas, migrations and event pipelines.
3. Build profile consent and selected domains.
4. Build structured events and snapshots.
5. Build habit, attention and relationship trajectories.
6. Build review windows and human correction notes.
7. Build optional recommendations.
8. Build retention/export/delete/pause/revoke.
9. Run privacy, safety, correctness and E2E validation.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- Formation Twin只是经同意的有限领域镜像，不是灵魂、良心、属灵分身、临床模型或对一个人的终极解释。
- 不得生成总体属灵成熟分、救恩/呼召判断、未来属灵预测、隐藏特质、临床诊断或跨用户/家庭排名。
- 事件只能来自真实操作或授权人记录；模型不得编造事件，且不得保存原始私密叙事和第三方身份。
- 注意力轨迹不得接入完整设备遥测、浏览历史或私聊；实践轨迹不得显示streak、总依从率或惩罚错过。
- 所有模式必须链接证据、标明不确定性和替代解释，并允许用户确认、修改或拒绝。
- 关系观察必须有同意或合法角色，只能用粗粒度可观察果子，不能访问私人日记或生成关系质量分。
- 建议必须可解释、有替代、可拒绝；禁止自动改变计划、自动通知他人、作高风险决定或以置信度压过人。
- 数据必须目的限定、最短保留、儿童更少；导出/删除/暂停/纠正/撤销共享透明执行，审计例外不得静默。

# Required tests

- event provenance
- no scores/prediction
- consent/RBAC
- uncertainty/evidence
- no telemetry
- retention/data rights
- a11y/E2E

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

Learners and authorized supporters can review evidence-linked formation patterns over time without spiritual scoring, surveillance, hidden inference or loss of human interpretive authority.
