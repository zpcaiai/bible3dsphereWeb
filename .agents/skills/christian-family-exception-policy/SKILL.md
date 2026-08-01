---
name: christian-family-exception-policy
description: "Implement expiring exceptions for emergency, school, work, care, travel and accessibility."
---

# Goal

Members can ask for real exceptions without shame while preventing invisible permanent backdoors.

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

1. Build request, approve/deny, expire and review states.
2. Require reason, approver and expiration.
3. Protect emergency and accessibility access.
4. Do not punish asking.
5. Audit changes minimally.

# Data, privacy and integration rules

- Reuse Batch 01–05 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 每条权限和区域规则必须保留紧急、照护、工作、学校和无障碍等真实例外。
- 家庭治理必须透明、可解释、可复盘；禁止秘密规则、秘密监控和全量设备历史采集。

# Tests

- expiry job
- idempotent approval
- no punishment
- role authorization

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
