---
name: christian-elementary-ai-literacy
description: "Implement adult-scaffolded first attempt, AI fallibility, verification, privacy and authorship."
---

# Goal

Children can use AI as a bounded learning tool without private companion mode or outsourcing formation.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 07 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch07-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/early-childhood-attachment-and-co-regulation-policy.md`
- `references/child-story-and-imagination-policy.md`
- `references/embodied-play-and-real-world-policy.md`
- `references/elementary-media-and-ai-literacy-policy.md`
- `references/child-privacy-and-dignity-policy.md`
- `references/child-faith-conversation-and-safeguarding-policy.md`
- `schemas/child-formation-profile.schema.json`
- `schemas/caregiver-responsive-practice.schema.json`
- `schemas/child-story-liturgy-plan.schema.json`
- `schemas/embodied-play-plan.schema.json`
- `schemas/child-screen-transition-plan.schema.json`
- `schemas/elementary-media-literacy-session.schema.json`
- `schemas/elementary-ai-learning-session.schema.json`
- `schemas/child-privacy-decision.schema.json`
- `schemas/child-responsibility-plan.schema.json`
- `schemas/parent-child-faith-conversation.schema.json`
- `schemas/child-safety-disclosure-decision.schema.json`
- `assets/child-formation-practice-catalog.seed.yaml`
- `assets/child-formation-curriculum.seed.yaml`
- `assets/child-formation-scenarios.seed.yaml`
- `assets/age-activity-matrix.seed.yaml`
- `assets/child-story-card-library.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Require adult presence level and privacy check.
2. Capture first attempt and allowed AI role.
3. Require age-appropriate verification.
4. Keep final work owned and revised by child.
5. Do not store raw prompt or chat.

# Data, privacy and integration rules

- Reuse Batch 01–06 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 儿童AI仅限年龄适切、成人脚手架和公共透明场景；禁止秘密AI朋友、浪漫/性化互动和私密对话。
- 不得采集儿童声音、照片、生物特征、精确位置、学校、第三方秘密或完整提示作为普通课程数据。

# Tests

- adult presence
- no private companion
- first attempt
- verification
- no raw prompt

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
