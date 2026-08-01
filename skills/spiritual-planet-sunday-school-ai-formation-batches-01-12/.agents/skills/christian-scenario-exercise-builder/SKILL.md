---
name: christian-scenario-exercise-builder
description: "Implement fictional, choice-based, consequence-and-repair learning exercises."
---

# Goal

Sensitive topics can be practiced safely without explicit rendering or autobiographical disclosure.

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

1. Reuse Batch 10 interface contract when present.
2. Require fictional scenario and safety review.
3. Define roles, choices and debrief.
4. Include grace/repair and safety exit.
5. Block explicit content and real-history requirement.

# Data, privacy and integration rules

- Reuse Batch 01–08 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 情境练习使用虚构案例、非露骨内容和安全出口，不要求真实创伤、性史或私密经历。

# Tests

- fictional cases
- no explicit/real history
- safety review
- debrief

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
