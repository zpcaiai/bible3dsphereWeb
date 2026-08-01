---
name: christian-gospel-identity-formation
description: "Build gospel-identity formation profiles and practices without performance, salvation or purity scoring."
---

# Goal

Identity pressures become visible while value remains received rather than inferred from behavior, sexuality, appearance or achievement.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 04 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch04-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/gospel-identity-and-desire-policy.md`
- `references/body-sexuality-and-covenant-policy.md`
- `references/pornography-trigger-recovery-policy.md`
- `references/ai-companion-and-virtual-intimacy-policy.md`
- `references/minor-sexual-safety-policy.md`
- `references/accountability-and-support-policy.md`
- `schemas/identity-formation-profile.schema.json`
- `schemas/desire-map.schema.json`
- `schemas/sexual-formation-boundary-plan.schema.json`
- `schemas/trigger-timeline.schema.json`
- `schemas/urge-interruption-plan.schema.json`
- `schemas/recovery-review.schema.json`
- `schemas/ai-companion-boundary-decision.schema.json`
- `schemas/virtual-intimacy-discernment.schema.json`
- `schemas/accountability-support-plan.schema.json`
- `schemas/age-gated-sexuality-content-decision.schema.json`
- `schemas/sexual-safety-escalation-decision.schema.json`
- `assets/identity-intimacy-practice-catalog.seed.yaml`
- `assets/identity-intimacy-curriculum.seed.yaml`
- `assets/identity-intimacy-scenarios.seed.yaml`
- `assets/age-content-boundary-matrix.seed.yaml`
- `assets/recovery-state-machine.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Reuse learner context and authority labels.
2. Build a short, skippable identity-pressure intake.
3. Render received-identity anchors with reviewed Scripture context.
4. Offer one embodied, non-performative action.
5. Persist categories only and support delete/export.
6. Connect comparison inputs to Batch 02 attention practices.

# Data, privacy and integration rules

- Reuse Batch 01–03 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 不得生成救恩、属灵成熟、纯洁度、成瘾、性取向、隐藏罪或人格价值评分。
- 所有敏感神学、性教育、未成年人和牧养内容必须经过对应人工审核才能发布。
- Never label a learner impure, idolater, unbeliever or spiritually immature from answers.

# Tests

- profile schema fixtures
- authority labels
- no salvation/sexual-history persistence
- accessible form and mobile flow

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
