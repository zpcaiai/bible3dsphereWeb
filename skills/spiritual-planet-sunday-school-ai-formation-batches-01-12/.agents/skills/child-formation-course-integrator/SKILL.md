---
name: child-formation-course-integrator
description: "Integrate Batch 07 age tracks, caregiver/teacher views, reviewed content, feature flags, analytics, accessibility and E2E."
---

# Goal

The child module is usable by age, role and accessibility needs while preserving guardian transparency and data minimization.

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

1. Register 0–6 caregiver and 7–12 shared-use routes.
2. Seed curriculum, activities and scenarios.
3. Apply guardian/org policy and review gates.
4. Implement printable/offline-friendly activities.
5. Apply analytics allowlist.
6. Run age usability, keyboard, screen-reader and E2E tests.

# Data, privacy and integration rules

- Reuse Batch 01–06 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 0–6岁以依恋、回应、节律、故事、自由游戏和身体活动为主，不把AI或屏幕作为核心养育者。
- 不得对儿童生成依恋、发展、行为、救恩、信心或顺服诊断/评分。
- 儿童AI仅限年龄适切、成人脚手架和公共透明场景；禁止秘密AI朋友、浪漫/性化互动和私密对话。
- 不得采集儿童声音、照片、生物特征、精确位置、学校、第三方秘密或完整提示作为普通课程数据。
- 故事必须区分圣经、历史、见证与虚构，不得把AI添加细节说成经文或自动发布。
- 屏幕转场不得羞辱孩子或突然以设备剥夺替代共同调节；同时保持清楚边界。
- 孩子可以提问、不同意或说不知道；不得把宗教答案当作内心信仰或价值评分。
- 涉及身体边界、虐待、不安全接触、自伤或即时危险时停止普通活动，禁止取证式追问并进入S2/S3。

# Tests

- age routing
- guardian permission
- unapproved content hidden
- no sensitive analytics
- print/mobile/a11y

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
