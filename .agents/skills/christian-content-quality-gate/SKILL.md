---
name: christian-content-quality-gate
description: "Implement factual, Scripture, rights, translation, authority, age and harmful-language review before publication."
---

# Goal

No spiritual formation content is auto-published or distributed without versioned review and rollback.

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

1. Pin content hash/version.
2. Verify facts, Scripture and direct quotations.
3. Verify copyright and translation permissions.
4. Review age fit, authority labels, shame/coercion and bias.
5. Require reviewer decision before publication.

# Data, privacy and integration rules

- Reuse Batch 01–11 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 神学认证必须核对经文上下文、权威分层、恩典次序、宗派差异和有害使用，模型置信度不能替代授权审核者。
- 内容不得自动发布；版权、译文许可、年龄适切性、事实与经文来源、羞辱胁迫和审核状态必须通过质量门。

# Tests

- hash/version
- source verification
- rights fixtures
- age bands
- auto-publish false

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
