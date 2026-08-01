---
name: christian-twin-recommendation
description: "Implement evidence-based optional keep/reduce/replace/pause/environment/help recommendations."
---

# Goal

Recommendations support user choice without automatic behavior, notification or high-stakes decision.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 11 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch11-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/formation-twin-ontology-policy.md`
- `references/formation-event-and-state-policy.md`
- `references/trajectory-and-review-policy.md`
- `references/relationship-observation-policy.md`
- `references/twin-recommendation-human-agency-policy.md`
- `references/formation-data-lifecycle-policy.md`
- `schemas/formation-twin-profile.schema.json`
- `schemas/formation-state-snapshot.schema.json`
- `schemas/formation-signal-event.schema.json`
- `schemas/habit-trajectory.schema.json`
- `schemas/attention-trajectory.schema.json`
- `schemas/relationship-fruit-observation.schema.json`
- `schemas/practice-adherence-summary.schema.json`
- `schemas/formation-review-window.schema.json`
- `schemas/human-interpretation-note.schema.json`
- `schemas/twin-recommendation.schema.json`
- `schemas/formation-data-retention-policy.schema.json`
- `schemas/twin-export-deletion-request.schema.json`
- `assets/formation-twin-control-catalog.seed.yaml`
- `assets/formation-twin-curriculum.seed.yaml`
- `assets/formation-twin-scenarios.seed.yaml`
- `assets/formation-domain-ontology.seed.yaml`
- `assets/retention-defaults.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Require evidence IDs and explanation.
2. Provide alternatives.
3. Allow accept/modify/decline/defer.
4. Create plan only after user action.
5. Route S2/S3 deterministically.

# Data, privacy and integration rules

- Reuse Batch 01–10 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 建议必须可解释、有替代、可拒绝；禁止自动改变计划、自动通知他人、作高风险决定或以置信度压过人。

# Tests

- evidence/alternatives
- all user decisions
- no auto action/notify
- S2/S3

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
