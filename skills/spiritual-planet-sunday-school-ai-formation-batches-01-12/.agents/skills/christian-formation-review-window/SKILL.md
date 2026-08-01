---
name: christian-formation-review-window
description: "Implement 7/14/30/90-day evidence-linked pattern hypotheses and learner confirmation/rejection."
---

# Goal

The learner remains an interpreter and decision-maker rather than being overruled by a model.

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

1. Build pattern candidates from evidence.
2. Show uncertainty and alternatives.
3. Capture confirm/modify/reject.
4. Create keep/change/pause/support next steps.
5. Prohibit salvation/calling conclusions.

# Data, privacy and integration rules

- Reuse Batch 01–10 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 所有模式必须链接证据、标明不确定性和替代解释，并允许用户确认、修改或拒绝。
- 不得生成总体属灵成熟分、救恩/呼召判断、未来属灵预测、隐藏特质、临床诊断或跨用户/家庭排名。

# Tests

- window variants
- confirm/reject
- no calling
- evidence links

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
