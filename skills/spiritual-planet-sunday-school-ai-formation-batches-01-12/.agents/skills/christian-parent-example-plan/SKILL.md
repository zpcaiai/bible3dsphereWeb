---
name: christian-parent-example-plan
description: "Generate editable 7/14/30-day parent modeling plans across attention, anxiety, repair, rest, prayer and service."
---

# Goal

Parents receive a small, sustainable plan that measures their chosen actions rather than children’s outcomes.

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

1. Use at most three focus areas at a time.
2. Require a minimum action and weekly review.
3. Keep child participation optional.
4. Disable public streaks and shame messages.
5. Connect review to keep/change/repair/support.

# Data, privacy and integration rules

- Reuse Batch 01–04 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 父母先治理自己；不得把系统变成对孩子的隐蔽监控、属灵评分或服从评分工具。
- 不得根据回答判断父母是否合格、孩子是否得救，或把孩子结果归因于某次父母操练。

# Tests

- duration variants
- no public streak
- optional child participation
- review transitions

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
