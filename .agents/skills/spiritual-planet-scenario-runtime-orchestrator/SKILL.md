---
name: spiritual-planet-scenario-runtime-orchestrator
description: "Implement Batch 10 fictional scenario authoring, runtime, timelines, choices, consequences, Scripture/grace interventions, Socratic branches, facilitator actions, safety, debrief and benchmarks."
---

# Mission

Implement **Batch 10: 情境模拟、选择—后果—恩典—修复与苏格拉底门训运行时** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–09 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

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
- every focused Batch 10 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

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

# End-to-end workflow

1. Inspect curriculum, state machine, event, safety and review architecture.
2. Implement 12 schemas, migrations and APIs.
3. Build authoring graph and version-bound runtime.
4. Build trigger timeline, choices and consequences.
5. Build reviewed truth/grace and Socratic branches.
6. Build facilitator and S2/S3 interruption.
7. Build debrief, benchmarks and golden traces.
8. Seed 20 scenario packs and run full verification.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- 所有情境必须虚构、非露骨、可跳过且经过相应神学/牧养/儿童安全审核；不得要求学习者重演真实创伤。
- 运行时只保存版本、节点、选择和状态，不保存原始自由文本，不根据路径建立人格、风险或属灵画像。
- 选择节点不得用羞耻、倒计时、预设唯一“敬虔答案”或隐藏惩罚操控学习者。
- 后果是带不确定性的可能果子，不是预言；不得生成未来行为、救恩或道德价值评分。
- 经文/恩典介入必须同时保留真理、责任、修复和帮助；禁止廉价恩典、纯定罪或“神告诉你”式私人神谕。
- 苏格拉底分支必须允许跳过、不确定和替代解释，禁止强迫继续、诱导认罪和采集私密历史。
- 真实安全披露必须退出角色扮演；教师不得公开羞辱、承诺绝对保密或做取证式追问。
- 合成基准只证明工程行为，不得宣称真实属灵成长、临床效果或生产安全已获证明。

# Required tests

- graph validation
- pause/resume/version pin
- no raw text/profile
- S3 interrupt
- non-coercion/skip
- a11y/E2E
- benchmark honesty

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

Spiritual Planet can run reviewed choice-based formation scenarios that teach discernment and repair without coercion, explicit content, profiling or unsafe handling of disclosures.
