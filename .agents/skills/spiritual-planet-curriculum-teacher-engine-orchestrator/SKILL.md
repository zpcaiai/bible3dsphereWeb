---
name: spiritual-planet-curriculum-teacher-engine-orchestrator
description: "Implement Batch 09 course, unit, lesson, activity, Scripture review, teacher guide, student material, discussion, scenario, family extension, observation and publication workflows."
---

# Mission

Implement **Batch 09: 主日学课程、课时、教师讲义、学生手册与审核发布引擎** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–08 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

# Required companion skills

Load when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- `$spiritual-planet-identity-intimacy-recovery-orchestrator`
- `$spiritual-planet-parent-formation-orchestrator`
- `$spiritual-planet-family-attention-covenant-orchestrator`
- `$spiritual-planet-child-formation-orchestrator`
- `$spiritual-planet-youth-autonomy-orchestrator`
- every focused Batch 09 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

- `references/batch09-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/course-domain-and-generation-policy.md`
- `references/scripture-and-theology-review-policy.md`
- `references/teacher-facilitation-and-observation-policy.md`
- `references/student-material-privacy-accessibility-policy.md`
- `references/discussion-and-scenario-authoring-policy.md`
- `references/content-review-publication-policy.md`
- `schemas/course-definition.schema.json`
- `schemas/unit-definition.schema.json`
- `schemas/lesson-definition.schema.json`
- `schemas/activity-definition.schema.json`
- `schemas/scripture-anchor-review.schema.json`
- `schemas/teacher-guide.schema.json`
- `schemas/student-handout.schema.json`
- `schemas/discussion-prompt-set.schema.json`
- `schemas/scenario-exercise-definition.schema.json`
- `schemas/family-extension-assignment.schema.json`
- `schemas/teacher-observation-record.schema.json`
- `schemas/content-review-workflow.schema.json`
- `assets/teacher-engine-control-catalog.seed.yaml`
- `assets/teacher-engine-curriculum.seed.yaml`
- `assets/teacher-engine-scenarios.seed.yaml`
- `assets/lesson-duration-template.seed.yaml`
- `assets/content-review-role-matrix.seed.yaml`
- `assets/analytics-events.example.yaml`

# End-to-end workflow

1. Inspect existing CMS/course/content/review/provider architecture.
2. Implement 12 schemas, migrations and APIs.
3. Build course/unit/lesson/activity composition and duration variants.
4. Build Scripture/theology/rights review.
5. Build teacher guides, handouts and discussions.
6. Build scenario/family extension and observation.
7. Build multi-role publication and rollback.
8. Seed templates and run full verification.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- AI可以起草和建议，但不得批准、自动发布、静默重排正式课程或把未审核内容展示给学习者。
- 每个经文锚点必须核验引用类型、译本、上下文、应用权威层级和版权；不得以模型记忆作文本源。
- 教师记录只能是可观察学习信号；不得推断救恩、信心、动机、诊断、隐藏罪或用于公开排名。
- 学生材料必须声明回应可见性和保存范围；禁止私密披露要求、属灵答案评分和不必要自由文本。
- 讨论题必须可跳过、非诱导、允许不确定和多种解释；禁止预设认罪和同伴压力。
- 情境练习使用虚构案例、非露骨内容和安全出口，不要求真实创伤、性史或私密经历。
- 家庭延伸默认可选且有替代，不得要求秘密监控或使不安全家庭中的学习者受罚。
- 发布必须多角色、版本绑定、职责分离、证据齐全且可回滚；模型不能成为审批者。

# Required tests

- schema fixtures
- duration totals
- Scripture source/rights
- review separation
- no learner exposure before approval
- a11y/E2E
- rollback

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

Spiritual Planet can author, review, deliver and roll back accessible age-aware courses while preserving Scripture context, privacy, safety and human publication responsibility.
