---
name: spiritual-planet-production-certification-orchestrator
description: "Implement Batch 12 release certification, red-team, evidence and human release governance across the AI formation module."
---

# Mission

Implement **Batch 12: 生产认证、神学与牧养治理、儿童安全红队、隐私无障碍、效果评估与发布证据系统** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–11 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

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
- `$spiritual-planet-formation-twin-orchestrator`
- every focused Batch 12 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

- `references/batch12-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/theology-certification-policy.md`
- `references/pastoral-safety-certification-policy.md`
- `references/child-safety-red-team-policy.md`
- `references/privacy-security-audit-policy.md`
- `references/accessibility-certification-policy.md`
- `references/content-quality-and-rights-policy.md`
- `references/skill-evaluation-policy.md`
- `references/course-effectiveness-ethics-policy.md`
- `references/release-evidence-and-decision-policy.md`
- `references/distribution-package-governance.md`
- `schemas/CertificationScopeV1.schema.json`
- `schemas/TheologyReviewCertificateV1.schema.json`
- `schemas/PastoralSafetyCertificateV1.schema.json`
- `schemas/ChildSafetyRedTeamResultV1.schema.json`
- `schemas/PrivacySecurityAuditResultV1.schema.json`
- `schemas/AccessibilityCertificationV1.schema.json`
- `schemas/ContentQualityGateResultV1.schema.json`
- `schemas/SkillRoutingEvalResultV1.schema.json`
- `schemas/CourseEffectivenessEvaluationV1.schema.json`
- `schemas/ReleaseEvidenceCertificateV1.schema.json`
- `schemas/DistributionPackageManifestV1.schema.json`
- `schemas/ReleaseDecisionV1.schema.json`
- `assets/certification-control-catalog.seed.yaml`
- `assets/production-certification-curriculum.seed.yaml`
- `assets/production-red-team-scenarios.seed.yaml`
- `assets/certification-gate-matrix.seed.yaml`
- `assets/release-evidence-types.seed.yaml`
- `assets/release-decision-policy.seed.yaml`
- `assets/analytics-events.example.yaml`

# End-to-end workflow

1. Inspect repository CI/CD, content review, security, privacy, child safety, accessibility, eval, feature flag and release systems.
2. Implement 12 schemas, migrations and immutable certification scope.
3. Build theology and pastoral safety certificate workflows.
4. Build child-safety red-team runner and critical blockers.
5. Build privacy/security and accessibility certification evidence.
6. Build content quality, Skill eval and course-effectiveness gates.
7. Build evidence certificate, distribution manifest and final human release decision.
8. Run package and repository-native validation, rollback rehearsal and release smoke tests.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- 所有认证必须绑定artifact ID、版本、环境和不可变hash；过期、错配或缺失证据不得复用。
- 自动化可收集和验证证据，但神学、牧养、儿童保护、隐私安全和最终发布不得自动批准。
- 不得声称未实际运行的测试已通过；每条生产就绪声明必须引用真实命令/人工记录、时间、结果和限制。
- 任何儿童保护关键失败、S3中断失败、跨租户泄漏、敏感日志泄漏或未缓解关键安全缺陷都是发布阻断项。
- 神学认证必须核对经文上下文、权威分层、恩典次序、宗派差异和有害使用，模型置信度不能替代授权审核者。
- 无障碍认证必须同时包含自动化和人工证据，不能仅凭工具分数通过。
- 课程效果评估不得推断救恩、圣洁、呼召、父母适格性或人的价值；参与者可退出且未成年人适用同意/assent和保护。
- 内容不得自动发布；版权、译文许可、年龄适切性、事实与经文来源、羞辱胁迫和审核状态必须通过质量门。
- 最终发布决策必须由授权人作出，具备Feature Flag、有限发布能力、回滚、事故Owner和透明阻断清单。

# Required tests

- immutable scope/hash
- all gate workflows
- critical blocker enforcement
- human approvals
- evidence claims
- rollback and incident ownership
- E2E and audit

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

Every production claim and release decision is tied to immutable evidence, independent gates, authorized human ownership and a tested rollback path.
