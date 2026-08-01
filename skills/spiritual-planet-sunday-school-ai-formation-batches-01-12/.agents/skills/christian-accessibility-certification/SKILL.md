---
name: christian-accessibility-certification
description: "Implement automated plus human accessibility certification for keyboard, screen reader, mobile, reduced motion, contrast and cognitive load."
---

# Goal

Critical learning and safety flows remain usable without mouse, sight, hearing assumptions or manipulative cognitive pressure.

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

1. Resolve standards and repository tooling.
2. Run automated checks.
3. Perform manual keyboard and screen-reader scripts.
4. Review sensitive flows for cognitive load and clear exits.
5. Capture blockers, human signoff and evidence.

# Data, privacy and integration rules

- Reuse Batch 01–11 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 无障碍认证必须同时包含自动化和人工证据，不能仅凭工具分数通过。

# Tests

- automated and manual evidence
- keyboard focus
- screen-reader status
- mobile/reduced motion
- sensitive flow exits

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
