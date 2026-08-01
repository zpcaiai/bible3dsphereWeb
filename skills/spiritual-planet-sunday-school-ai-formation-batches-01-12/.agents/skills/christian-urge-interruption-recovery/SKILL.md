---
name: christian-urge-interruption-recovery
description: "Implement 90-second interruption, environment exit, support contact, repair and non-shaming review flows."
---

# Goal

A learner has a safe, minimal plan for high-urge moments and a path back to truth, responsibility and support after failure.

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

1. Build first-90-seconds and environment-exit editor.
2. Support device boundaries and trusted-person routes.
3. Prohibit self-punishment and deprivation.
4. Implement keep/reduce/replace/pause/support review.
5. Connect persistent impairment to professional support without diagnosis.

# Data, privacy and integration rules

- Reuse Batch 01–03 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 不得生成救恩、属灵成熟、纯洁度、成瘾、性取向、隐藏罪或人格价值评分。
- 身体训练不得采用自残、惩罚性禁食、睡眠剥夺、脱水或极端运动。
- Failure must never trigger punitive streak loss or public ranking.

# Tests

- plan transitions
- no deprivation
- notification idempotency
- recovery review no score
- offline fallback

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
