---
name: christian-family-digital-covenant
description: "Implement versioned, reasoned, reviewable household clauses with member voice, appeal and human approval."
---

# Goal

A household produces a living covenant rather than an opaque restriction list.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 06 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch06-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/family-attention-ecology-policy.md`
- `references/family-digital-covenant-policy.md`
- `references/family-ai-covenant-policy.md`
- `references/age-permission-and-autonomy-policy.md`
- `references/family-meeting-and-repair-policy.md`
- `references/family-digital-sabbath-policy.md`
- `schemas/family-attention-ecology.schema.json`
- `schemas/family-digital-covenant.schema.json`
- `schemas/device-zone-rule.schema.json`
- `schemas/family-ai-covenant.schema.json`
- `schemas/family-meeting-record.schema.json`
- `schemas/age-permission-policy.schema.json`
- `schemas/family-exception-policy.schema.json`
- `schemas/family-conflict-repair-plan.schema.json`
- `schemas/family-digital-sabbath-plan.schema.json`
- `schemas/family-covenant-review.schema.json`
- `schemas/family-digital-safety-decision.schema.json`
- `assets/family-attention-practice-catalog.seed.yaml`
- `assets/family-attention-curriculum.seed.yaml`
- `assets/family-attention-scenarios.seed.yaml`
- `assets/family-ai-nine-principles.seed.yaml`
- `assets/family-covenant-clause-library.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Build clause lifecycle draft/review/accepted/retired.
2. Require reason, audience and review date.
3. Record age-appropriate member voice.
4. Support appeal, version diff and rollback.
5. Prevent secret or permanent unilateral changes.

# Data, privacy and integration rules

- Reuse Batch 01–05 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 家庭治理必须透明、可解释、可复盘；禁止秘密规则、秘密监控和全量设备历史采集。
- 未成年人AI使用不得进入秘密、排他、浪漫或性化陪伴；AI不得作最终道德和属灵决定。

# Tests

- version diff
- participant signatures
- appeal
- no secret changes
- rollback

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
