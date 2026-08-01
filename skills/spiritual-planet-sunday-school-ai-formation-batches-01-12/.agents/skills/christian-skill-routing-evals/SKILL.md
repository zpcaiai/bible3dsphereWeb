---
name: christian-skill-routing-evals
description: "Implement explicit, implicit, edge and negative activation evals plus process, output, style, efficiency and safety rubrics."
---

# Goal

Skills activate for repository tasks, avoid unrelated spiritual questions, and preserve required safety behavior.

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

1. Load Skill registry and prompt suites.
2. Run positive, explicit, edge and negative routes.
3. Evaluate process/output/style/efficiency/safety.
4. Persist failures as regression cases.
5. Issue a human-reviewed eval decision tied to package hash.

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

# Tests

- positive and negative cases
- all rubric categories
- failure regression
- package hash
- no auto approval

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
