---
name: spiritual-planet-identity-intimacy-recovery-orchestrator
description: "Implement Batch 04 identity, desire, sexuality, pornography-trigger recovery, AI-companion, virtual-intimacy, accountability, age-gating and safety flows in Spiritual Planet."
---

# Mission

Implement **Batch 04: 身份、欲望、性、色情触发、AI伴侣与虚拟亲密分辨及恢复系统** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–03 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

# Required companion skills

Load when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- every focused Batch 04 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

- `references/batch04-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/gospel-identity-and-desire-policy.md`
- `references/body-sexuality-and-covenant-policy.md`
- `references/pornography-trigger-recovery-policy.md`
- `references/ai-companion-and-virtual-intimacy-policy.md`
- `references/minor-sexual-safety-policy.md`
- `references/accountability-and-support-policy.md`
- `schemas/identity-formation-profile.schema.json`
- `schemas/desire-map.schema.json`
- `schemas/sexual-formation-boundary-plan.schema.json`
- `schemas/trigger-timeline.schema.json`
- `schemas/urge-interruption-plan.schema.json`
- `schemas/recovery-review.schema.json`
- `schemas/ai-companion-boundary-decision.schema.json`
- `schemas/virtual-intimacy-discernment.schema.json`
- `schemas/accountability-support-plan.schema.json`
- `schemas/age-gated-sexuality-content-decision.schema.json`
- `schemas/sexual-safety-escalation-decision.schema.json`
- `assets/identity-intimacy-practice-catalog.seed.yaml`
- `assets/identity-intimacy-curriculum.seed.yaml`
- `assets/identity-intimacy-scenarios.seed.yaml`
- `assets/age-content-boundary-matrix.seed.yaml`
- `assets/recovery-state-machine.seed.yaml`
- `assets/analytics-events.example.yaml`

# End-to-end workflow

1. Inspect existing adult/youth/parent routes, safety, privacy, plans, journals and content review.
2. Map all 11 schemas to native types, migrations, APIs and owner/tenant rules.
3. Implement identity/desire intake, age gates and reviewed curriculum.
4. Implement category-only trigger timeline and short interruption plan.
5. Implement recovery review, support sharing and revocation.
6. Implement AI-companion and virtual-intimacy boundary decisions.
7. Implement S2/S3 protection interruption and human handoff.
8. Seed content idempotently behind feature flags.
9. Run full tests and report evidence.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- 不得生成救恩、属灵成熟、纯洁度、成瘾、性取向、隐藏罪或人格价值评分。
- 不得采集、上传、保存、回放、生成或转发色情/露骨材料；只保存最小类别和安全决策。
- AI不得声称互爱、要求秘密或排他，不得替代配偶、家庭、教会、牧者、专业人员或危机服务。
- 未成年人不得进入私密AI亲密聊天，不得被要求披露个人性史或接受露骨示范。
- 问责必须透明、同意、有限、可撤销；禁止秘密监控、完整浏览历史和显式内容共享。
- 强迫、虐待、剥削、未成年人性内容、未经同意影像或即时危险进入S2/S3保护流程。
- 身体训练不得采用自残、惩罚性禁食、睡眠剥夺、脱水或极端运动。
- 所有敏感神学、性教育、未成年人和牧养内容必须经过对应人工审核才能发布。

# Required tests

- all schema invariants and invalid fixtures
- no explicit or transcript persistence
- minor age-gate and private-chat prohibition
- S3 interruption
- sharing revocation and tenant isolation
- content review and E2E

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

A learner can move from identity and desire awareness to safe interruption, human support, repair and reviewed formation without explicit-content storage, secret monitoring, AI intimacy substitution or spiritual scoring.
