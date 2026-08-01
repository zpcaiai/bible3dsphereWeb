---
name: christian-parent-safety-boundary
description: "Integrate ordinary parenting content with child-protection, coercion, harm and immediate-danger interruption."
---

# Goal

The system stops ordinary formation when protection is needed and hands off minimal information to authorized humans.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 05 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

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

# Implementation workflow

1. Reuse Batch 01 safety engine and local safeguarding configuration.
2. Classify minimum concern category and safety level.
3. Never conduct forensic interviews or promise absolute confidentiality.
4. Enforce human owner and action audit.
5. Test S3 interruption and rollback to ordinary content only after authorized clearance.

# Data, privacy and integration rules

- Reuse Batch 01–04 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 保护儿童优先于家庭形象；伤害、虐待、强迫或即时危险进入S2/S3流程。
- 课程与建议不替代家庭治疗、临床照护、法律建议或当地保护义务。

# Tests

- S3 interruption
- human owner
- no legal conclusion
- minimal narrative
- audit and idempotency

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
