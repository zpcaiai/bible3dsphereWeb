---
name: christian-leaving-home-digital-readiness
description: "Implement practical readiness across security, privacy, AI, money, time, safety, support and church connection."
---

# Goal

Older teens can practice independent life domains without receiving a spiritual-maturity certificate.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 08 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch08-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/youth-identity-and-doubt-policy.md`
- `references/youth-sexuality-and-ai-companion-safety-policy.md`
- `references/youth-social-media-identity-policy.md`
- `references/youth-ai-academic-integrity-policy.md`
- `references/youth-autonomy-transfer-policy.md`
- `references/youth-mentor-and-leaving-home-policy.md`
- `schemas/youth-formation-context.schema.json`
- `schemas/youth-identity-pressure-map.schema.json`
- `schemas/youth-question-doubt-session.schema.json`
- `schemas/youth-sexuality-safety-decision.schema.json`
- `schemas/youth-social-media-identity-reflection.schema.json`
- `schemas/youth-ai-academic-integrity-record.schema.json`
- `schemas/youth-digital-autonomy-plan.schema.json`
- `schemas/youth-time-money-stewardship-plan.schema.json`
- `schemas/youth-mentor-consent-plan.schema.json`
- `schemas/youth-governance-transfer-milestone.schema.json`
- `schemas/leaving-home-digital-readiness.schema.json`
- `schemas/youth-safety-decision.schema.json`
- `assets/youth-formation-practice-catalog.seed.yaml`
- `assets/youth-formation-curriculum.seed.yaml`
- `assets/youth-formation-scenarios.seed.yaml`
- `assets/youth-autonomy-levels.seed.yaml`
- `assets/leaving-home-readiness-checklist.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Build domain checklist with next action.
2. Include account security without storing credentials.
3. Confirm support and emergency contacts through existing secure references.
4. Run 30-day trial where appropriate.
5. Do not auto-grant independence.

# Data, privacy and integration rules

- Reuse Batch 01–07 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 不得给青少年分配身份标签、推断性取向、救恩、成熟度、隐藏罪或未来风险。
- 自治按能力逐步交还，必须有青少年声音、试行、复盘和恢复路径；一次失败不得永久全量回收。

# Tests

- no credentials/spiritual certification
- domain transitions
- support reference security
- export/print

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
