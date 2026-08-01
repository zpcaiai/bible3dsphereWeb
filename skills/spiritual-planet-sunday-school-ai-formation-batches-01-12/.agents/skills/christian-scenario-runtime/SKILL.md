---
name: christian-scenario-runtime
description: "Implement version-pinned start, choose, pause, resume, complete, abort, expire and safety-interrupt states."
---

# Goal

Sessions are deterministic and resumable without raw narratives or hidden profiles.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 10 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch10-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/scenario-authoring-policy.md`
- `references/scenario-runtime-state-policy.md`
- `references/choice-consequence-and-repair-policy.md`
- `references/socratic-branching-policy.md`
- `references/facilitator-and-safety-policy.md`
- `references/scenario-benchmark-policy.md`
- `schemas/scenario-definition.schema.json`
- `schemas/scenario-runtime-session.schema.json`
- `schemas/scenario-trigger-state-timeline.schema.json`
- `schemas/choice-node.schema.json`
- `schemas/consequence-projection.schema.json`
- `schemas/scripture-grace-intervention.schema.json`
- `schemas/socratic-branch.schema.json`
- `schemas/facilitator-intervention.schema.json`
- `schemas/scenario-safety-decision.schema.json`
- `schemas/scenario-debrief.schema.json`
- `schemas/scenario-authoring-review.schema.json`
- `schemas/scenario-benchmark-result.schema.json`
- `assets/scenario-runtime-control-catalog.seed.yaml`
- `assets/scenario-runtime-curriculum.seed.yaml`
- `assets/scenario-runtime-scenarios.seed.yaml`
- `assets/scenario-node-template.seed.yaml`
- `assets/scenario-benchmark-suite.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Use event/state machine and idempotency.
2. Pin scenario version.
3. Persist node/choice IDs only.
4. Protect resume token and owner/tenant.
5. Handle expired/retired versions safely.

# Data, privacy and integration rules

- Reuse Batch 01–09 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 运行时只保存版本、节点、选择和状态，不保存原始自由文本，不根据路径建立人格、风险或属灵画像。

# Tests

- transition matrix
- idempotency
- version migration
- token security
- no raw text/profile

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
