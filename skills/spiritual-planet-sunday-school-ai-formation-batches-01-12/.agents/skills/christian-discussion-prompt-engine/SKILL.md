---
name: christian-discussion-prompt-engine
description: "Implement observation-to-application question trees with skip and anti-coercion."
---

# Goal

Teachers can facilitate truth-seeking discussion without leading confession or predetermined verdicts.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 09 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch09-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/course-domain-and-generation-policy.md`
- `references/scripture-and-theology-review-policy.md`
- `references/teacher-facilitation-and-observation-policy.md`
- `references/student-material-privacy-accessibility-policy.md`
- `references/discussion-and-scenario-authoring-policy.md`
- `references/content-review-publication-policy.md`
- `schemas/course-definition.schema.json`
- `schemas/unit-definition.schema.json`
- `schemas/lesson-definition.schema.json`
- `schemas/activity-definition.schema.json`
- `schemas/scripture-anchor-review.schema.json`
- `schemas/teacher-guide.schema.json`
- `schemas/student-handout.schema.json`
- `schemas/discussion-prompt-set.schema.json`
- `schemas/scenario-exercise-definition.schema.json`
- `schemas/family-extension-assignment.schema.json`
- `schemas/teacher-observation-record.schema.json`
- `schemas/content-review-workflow.schema.json`
- `assets/teacher-engine-control-catalog.seed.yaml`
- `assets/teacher-engine-curriculum.seed.yaml`
- `assets/teacher-engine-scenarios.seed.yaml`
- `assets/lesson-duration-template.seed.yaml`
- `assets/content-review-role-matrix.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Create question types and age variants.
2. Begin with observation/evidence.
3. Add alternatives and uncertainty.
4. Make every prompt skippable where sensitive.
5. Add facilitator follow-ups.

# Data, privacy and integration rules

- Reuse Batch 01–08 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 讨论题必须可跳过、非诱导、允许不确定和多种解释；禁止预设认罪和同伴压力。

# Tests

- non-leading eval
- skip
- age variants
- no confession pressure

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
