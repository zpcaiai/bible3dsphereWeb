---
name: youth-autonomy-course-integrator
description: "Integrate Batch 08 routes, role views, reviewed curriculum, feature flags, analytics, accessibility and E2E."
---

# Goal

The youth module supports 13–15 and 16–18 pathways while keeping guardian, mentor and youth visibility boundaries explicit.

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

1. Register age routes and dashboards.
2. Seed curriculum, practices, scenarios and autonomy levels.
3. Apply guardian/org, mentor and review permissions.
4. Implement youth-private ordinary reflection rules and safety exceptions.
5. Apply analytics allowlist.
6. Run youth usability, mobile/a11y/E2E/security tests.

# Data, privacy and integration rules

- Reuse Batch 01–07 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 青少年可以提问、怀疑、不同意或暂时不确定；禁止信仰答案评分、强迫归信和把疑问自动定性为悖逆。
- 不得给青少年分配身份标签、推断性取向、救恩、成熟度、隐藏罪或未来风险。
- 性与关系教育必须非露骨、年龄适切、经过审核；禁止个人性史采集、秘密成人—青少年或AI—青少年亲密渠道。
- AI学习必须遵守学校政策、保留独立尝试、核验、披露和最终作者责任；禁止代写规避检测和伪造过程。
- 社交媒体分析不得采集完整帖子历史、建立家长监控流或生成社交价值分。
- 自治按能力逐步交还，必须有青少年声音、试行、复盘和恢复路径；一次失败不得永久全量回收。
- 导师关系必须透明、角色清楚、可撤销普通同意、无秘密/浪漫/性化渠道，并说明保护性保密边界。
- 勒索、强迫、未经同意影像、成人不当接触、自伤或即时危险必须进入S2/S3，产品不取证、不责怪。

# Tests

- age routes
- role visibility
- unapproved content hidden
- analytics redaction
- E2E/a11y

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
