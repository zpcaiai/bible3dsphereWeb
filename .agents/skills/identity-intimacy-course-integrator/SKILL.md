---
name: identity-intimacy-course-integrator
description: "Integrate Batch 04 routes, course content, feature flags, analytics, accessibility, review states and E2E tests."
---

# Goal

The Batch 04 learning experience is discoverable, reviewed, accessible and safely connected to prior plans and safety systems.

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

1. Register routes and navigation in the existing module.
2. Implement landing, lesson, plan, support, review and teacher views.
3. Seed curriculum/practices/scenarios idempotently.
4. Apply age, role, feature and review gates.
5. Implement analytics allowlist and denylist.
6. Run mobile, keyboard, screen-reader, reduced-motion and E2E tests.

# Data, privacy and integration rules

- Reuse Batch 01–03 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 不得生成救恩、属灵成熟、纯洁度、成瘾、性取向、隐藏罪或人格价值评分。
- 不得采集、上传、保存、回放、生成或转发色情/露骨材料；只保存最小类别和安全决策。
- AI不得声称互爱、要求秘密或排他，不得替代配偶、家庭、教会、牧者、专业人员或危机服务。
- 未成年人不得进入私密AI亲密聊天，不得被要求披露个人性史或接受露骨示范。
- 问责必须透明、同意、有限、可撤销；禁止秘密监控、完整浏览历史和显式内容共享。
- 强迫、虐待、剥削、未成年人性内容、未经同意影像或即时危险进入S2/S3保护流程。
- 身体训练不得采用自残、惩罚性禁食、睡眠剥夺、脱水或极端运动。
- 所有敏感神学、性教育、未成年人和牧养内容必须经过对应人工审核才能发布。

# Tests

- feature flag off/on
- unapproved content hidden
- age/role routes
- analytics redaction
- responsive/a11y/E2E

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
