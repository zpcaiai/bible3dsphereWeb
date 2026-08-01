---
name: spiritual-planet-parent-formation-orchestrator
description: "Implement Batch 05 parent modeling, attention availability, anxiety transmission, success pressure, repair, authority, co-parenting, feedback and safety in Spiritual Planet."
---

# Mission

Implement **Batch 05: 父母先被塑造：榜样、注意力、焦虑、成功偶像、认罪修复与权柄治理系统** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–04 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

# Required companion skills

Load when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- `$spiritual-planet-identity-intimacy-recovery-orchestrator`
- every focused Batch 05 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

- `references/batch05-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/parent-modeling-policy.md`
- `references/success-anxiety-and-family-idolatry-policy.md`
- `references/authority-grace-consequence-policy.md`
- `references/parent-repair-policy.md`
- `references/child-feedback-and-nonretaliation-policy.md`
- `references/co-parent-governance-policy.md`
- `schemas/parent-formation-mirror.schema.json`
- `schemas/parent-attention-availability-assessment.schema.json`
- `schemas/parent-anxiety-transmission-reflection.schema.json`
- `schemas/success-idol-discernment.schema.json`
- `schemas/parent-child-repair-record.schema.json`
- `schemas/parent-authority-grace-plan.schema.json`
- `schemas/co-parent-governance-agreement.schema.json`
- `schemas/parent-example-practice-plan.schema.json`
- `schemas/child-feedback-invitation.schema.json`
- `schemas/parent-formation-review.schema.json`
- `schemas/parent-safety-escalation-decision.schema.json`
- `assets/parent-formation-practice-catalog.seed.yaml`
- `assets/parent-formation-curriculum.seed.yaml`
- `assets/parent-formation-scenarios.seed.yaml`
- `assets/parent-modeling-rubric.seed.yaml`
- `assets/30-day-parent-example-plan.seed.yaml`
- `assets/analytics-events.example.yaml`

# End-to-end workflow

1. Inspect parent, household, child-role, safety and prior formation architecture.
2. Implement 11 schemas, migrations, permissions and owner isolation.
3. Build parent mirror, attention and anxiety flows.
4. Build success-priority discernment and repair records.
5. Build authority/grace and co-parent agreements.
6. Build child feedback invitation with non-retaliation.
7. Build 7/14/30 day plans and review.
8. Integrate S2/S3 protection and seed reviewed content.
9. Run complete verification.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- 父母先治理自己；不得把系统变成对孩子的隐蔽监控、属灵评分或服从评分工具。
- 不得根据回答判断父母是否合格、孩子是否得救，或把孩子结果归因于某次父母操练。
- 孩子反馈必须可跳过、透明、无报复，不得作为信仰一致性或顺服测试。
- 父母权柄不得被绝对化；禁止羞辱、身体伤害、属灵威胁、强迫披露和不相称惩罚。
- 父母道歉不得要求孩子立即饶恕、安慰父母或承担成人情绪。
- 共同养育不得三角化孩子、秘密拆台或秘密监控另一位成人。
- 保护儿童优先于家庭形象；伤害、虐待、强迫或即时危险进入S2/S3流程。
- 课程与建议不替代家庭治疗、临床照护、法律建议或当地保护义务。

# Required tests

- schema invariants
- no covert capture
- feedback skip/non-retaliation
- repair role boundaries
- co-parent isolation
- S3 interruption
- a11y/E2E

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

Parents receive a grace-first, non-surveillant path to change their own attention, anxiety, authority, repair and example before attempting to govern children.
