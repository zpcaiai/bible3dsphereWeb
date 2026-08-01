---
name: spiritual-planet-family-attention-covenant-orchestrator
description: "Implement Batch 06 household attention ecology, digital covenant, device zones, family AI rules, meetings, age permissions, exceptions, repair, Sabbath and safety."
---

# Mission

Implement **Batch 06: 家庭注意力生态、家庭数字公约与家庭AI公约系统** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–05 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

# Required companion skills

Load when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- `$spiritual-planet-identity-intimacy-recovery-orchestrator`
- `$spiritual-planet-parent-formation-orchestrator`
- every focused Batch 06 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

- `references/batch06-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/family-attention-ecology-policy.md`
- `references/family-digital-covenant-policy.md`
- `references/family-ai-covenant-policy.md`
- `references/age-permission-and-autonomy-policy.md`
- `references/family-meeting-and-repair-policy.md`
- `references/family-digital-sabbath-policy.md`
- `schemas/family-attention-ecology.schema.json`
- `schemas/family-digital-covenant.schema.json`
- `schemas/device-zone-rule.schema.json`
- `schemas/family-ai-covenant.schema.json`
- `schemas/family-meeting-record.schema.json`
- `schemas/age-permission-policy.schema.json`
- `schemas/family-exception-policy.schema.json`
- `schemas/family-conflict-repair-plan.schema.json`
- `schemas/family-digital-sabbath-plan.schema.json`
- `schemas/family-covenant-review.schema.json`
- `schemas/family-digital-safety-decision.schema.json`
- `assets/family-attention-practice-catalog.seed.yaml`
- `assets/family-attention-curriculum.seed.yaml`
- `assets/family-attention-scenarios.seed.yaml`
- `assets/family-ai-nine-principles.seed.yaml`
- `assets/family-covenant-clause-library.seed.yaml`
- `assets/analytics-events.example.yaml`

# End-to-end workflow

1. Inspect household, participant, guardian, route, policy, notification and safety architecture.
2. Implement 11 schemas, migrations and household/role permissions.
3. Build ecology map and covenant clause editor.
4. Build zone rules, family AI principles and age permissions.
5. Build meetings, exceptions and repair state machines.
6. Build family digital Sabbath and covenant review.
7. Integrate S2/S3 digital safety.
8. Seed reviewed assets and run full verification.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- 家庭治理必须透明、可解释、可复盘；禁止秘密规则、秘密监控和全量设备历史采集。
- 家庭公约不是救恩、敬虔、顺服或亲子价值评分工具，不得建立成员排行榜。
- 未成年人AI使用不得进入秘密、排他、浪漫或性化陪伴；AI不得作最终道德和属灵决定。
- 每条权限和区域规则必须保留紧急、照护、工作、学校和无障碍等真实例外。
- 孩子应知道家长控制能看到什么、谁能看、何时看和保存多久；不得强迫私密认罪。
- 违规处理必须相称、有修复和恢复路径；禁止公开羞辱、无限期惩罚和一次失败永久封禁。
- 勒索、成人与未成年人不当接触、自伤、跟踪或即时危险进入S2/S3，而非仅没收设备。
- 产品不得充当数字取证仓库，不得要求上传私密影像、消息或敏感证据。

# Required tests

- schema fixtures
- household RBAC
- version/concurrency
- no surveillance
- exception expiry
- S3 interruption
- responsive/a11y/E2E

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

A household can create, operate and review transparent attention and AI rules that cultivate internal governance without surveillance, ranking or coercion.
