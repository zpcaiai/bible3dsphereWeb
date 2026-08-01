---
name: christian-human-interpretation-note
description: "Implement role-aware human context, correction, goal, barrier and support notes."
---

# Goal

Humans can add or correct meaning without giving models permission to rewrite notes or copy private journals.

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

1. Resolve author and visibility.
2. Store concise note and consent/role basis.
3. Protect meaning immutably with revisions.
4. Block journal copying and clinical-note claims.
5. Audit access.

# Data, privacy and integration rules

- Reuse Batch 01–10 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 关系观察必须有同意或合法角色，只能用粗粒度可观察果子，不能访问私人日记或生成关系质量分。

# Tests

- role/visibility
- immutable meaning
- no journal/clinical claim
- audit

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
