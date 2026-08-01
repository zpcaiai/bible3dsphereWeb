---
name: christian-course-domain-model
description: "Implement versioned Course, Unit, Lesson and Activity contracts in the existing curriculum architecture."
---

# Goal

Courses become composable and migratable without duplicating the real repository content model.

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

1. Map existing entities and IDs.
2. Add adapters for supplied schemas.
3. Implement sequence and duration variants.
4. Enforce review/version references.
5. Seed idempotently and support rollback.

# Data, privacy and integration rules

- Reuse Batch 01–08 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- AI可以起草和建议，但不得批准、自动发布、静默重排正式课程或把未审核内容展示给学习者。
- 发布必须多角色、版本绑定、职责分离、证据齐全且可回滚；模型不能成为审批者。

# Tests

- domain adapters
- sequence constraints
- idempotent seeds
- migration rollback

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
