---
name: spiritual-planet-child-formation-orchestrator
description: "Implement Batch 07 age 0–6 and 7–12 caregiver, story, play, rhythm, media literacy, AI literacy, privacy, responsibility, faith conversation and safeguarding."
---

# Mission

Implement **Batch 07: 0–6岁与7–12岁：依恋、故事、身体节律、媒介与AI素养课程系统** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–06 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

# Required companion skills

Load when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- `$spiritual-planet-identity-intimacy-recovery-orchestrator`
- `$spiritual-planet-parent-formation-orchestrator`
- `$spiritual-planet-family-attention-covenant-orchestrator`
- every focused Batch 07 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

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

# End-to-end workflow

1. Inspect child, guardian, household, course, consent and safety architecture.
2. Implement 11 schemas and child/guardian permissions.
3. Build 0–6 caregiver/rhythm/story/play track.
4. Build 7–12 media, AI, privacy and responsibility track.
5. Build open faith conversation and child safety disclosure.
6. Seed reviewed age variants.
7. Integrate family covenant and S2/S3.
8. Run child-safety, privacy, a11y and E2E verification.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- 0–6岁以依恋、回应、节律、故事、自由游戏和身体活动为主，不把AI或屏幕作为核心养育者。
- 不得对儿童生成依恋、发展、行为、救恩、信心或顺服诊断/评分。
- 儿童AI仅限年龄适切、成人脚手架和公共透明场景；禁止秘密AI朋友、浪漫/性化互动和私密对话。
- 不得采集儿童声音、照片、生物特征、精确位置、学校、第三方秘密或完整提示作为普通课程数据。
- 故事必须区分圣经、历史、见证与虚构，不得把AI添加细节说成经文或自动发布。
- 屏幕转场不得羞辱孩子或突然以设备剥夺替代共同调节；同时保持清楚边界。
- 孩子可以提问、不同意或说不知道；不得把宗教答案当作内心信仰或价值评分。
- 涉及身体边界、虐待、不安全接触、自伤或即时危险时停止普通活动，禁止取证式追问并进入S2/S3。

# Required tests

- schema fixtures
- guardian/role isolation
- no child profiling
- no private AI
- story provenance
- S3 interruption
- age/a11y usability

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

Children receive developmentally appropriate, embodied and relational formation while adults retain responsibility and the product avoids diagnosis, secret AI relationships and excessive data collection.
