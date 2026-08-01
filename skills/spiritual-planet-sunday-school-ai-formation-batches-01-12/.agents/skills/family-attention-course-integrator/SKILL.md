---
name: family-attention-course-integrator
description: "Integrate Batch 06 routes, covenant UI, reviewed curriculum, feature flags, analytics, accessibility and E2E."
---

# Goal

The family module works across household roles and devices without leaking one member’s data to another.

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

1. Register routes and household navigation.
2. Seed curriculum, clause library and scenarios.
3. Implement role-aware dashboards and printable covenant.
4. Apply review/feature/age gates.
5. Implement analytics allowlist.
6. Run mobile/a11y/E2E/security tests.

# Data, privacy and integration rules

- Reuse Batch 01–05 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 家庭治理必须透明、可解释、可复盘；禁止秘密规则、秘密监控和全量设备历史采集。
- 家庭公约不是救恩、敬虔、顺服或亲子价值评分工具，不得建立成员排行榜。
- 未成年人AI使用不得进入秘密、排他、浪漫或性化陪伴；AI不得作最终道德和属灵决定。
- 每条权限和区域规则必须保留紧急、照护、工作、学校和无障碍等真实例外。
- 孩子应知道家长控制能看到什么、谁能看、何时看和保存多久；不得强迫私密认罪。
- 违规处理必须相称、有修复和恢复路径；禁止公开羞辱、无限期惩罚和一次失败永久封禁。
- 勒索、成人与未成年人不当接触、自伤、跟踪或即时危险进入S2/S3，而非仅没收设备。
- 产品不得充当数字取证仓库，不得要求上传私密影像、消息或敏感证据。

# Tests

- household/role isolation
- print/mobile/a11y
- feature flag
- unapproved seeds hidden
- analytics redaction

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
