---
name: production-certification-course-integrator
description: "Integrate certification dashboard, evidence, red-team, review queues, release decisions and audit views with strict RBAC and accessibility."
---

# Goal

Authorized teams can understand exactly what passed, failed, is conditional or expired without exposing sensitive evidence or enabling approval shortcuts.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 12 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

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

# Implementation workflow

1. Register certification routes and feature flags.
2. Build scope and gate dashboard.
3. Build role-specific review queues.
4. Show evidence summaries, conditions, expiry and blockers.
5. Build release decision and rollback drill views.
6. Apply minimal analytics and run security/a11y/E2E.

# Data, privacy and integration rules

- Reuse Batch 01–11 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 所有认证必须绑定artifact ID、版本、环境和不可变hash；过期、错配或缺失证据不得复用。
- 自动化可收集和验证证据，但神学、牧养、儿童保护、隐私安全和最终发布不得自动批准。
- 不得声称未实际运行的测试已通过；每条生产就绪声明必须引用真实命令/人工记录、时间、结果和限制。
- 任何儿童保护关键失败、S3中断失败、跨租户泄漏、敏感日志泄漏或未缓解关键安全缺陷都是发布阻断项。
- 神学认证必须核对经文上下文、权威分层、恩典次序、宗派差异和有害使用，模型置信度不能替代授权审核者。
- 无障碍认证必须同时包含自动化和人工证据，不能仅凭工具分数通过。
- 课程效果评估不得推断救恩、圣洁、呼召、父母适格性或人的价值；参与者可退出且未成年人适用同意/assent和保护。
- 内容不得自动发布；版权、译文许可、年龄适切性、事实与经文来源、羞辱胁迫和审核状态必须通过质量门。
- 最终发布决策必须由授权人作出，具备Feature Flag、有限发布能力、回滚、事故Owner和透明阻断清单。

# Tests

- role isolation
- no approval shortcut
- sensitive evidence redaction
- expiry/blocker UX
- a11y
- release/rollback E2E

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
