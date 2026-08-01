---
name: christian-parent-anxiety-transmission
description: "Implement non-clinical reflection on how adult fear becomes interrogation, comparison, overcontrol or withdrawal."
---

# Goal

Parents can own and regulate their fear without making children responsible for adult emotional stability.

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

1. Use categories for anxiety domains and transmission patterns.
2. Separate facts, fears, predictions and chosen response.
3. Offer adult support and pause practices.
4. Never diagnose parent or child.
5. Route severe impairment or safety to human support.

# Data, privacy and integration rules

- Reuse Batch 01–04 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 不得根据回答判断父母是否合格、孩子是否得救，或把孩子结果归因于某次父母操练。
- 课程与建议不替代家庭治疗、临床照护、法律建议或当地保护义务。

# Tests

- no diagnosis
- no conflict transcript
- support routing
- non-shaming language

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
