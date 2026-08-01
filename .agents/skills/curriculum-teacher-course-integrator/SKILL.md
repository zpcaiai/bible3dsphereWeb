---
name: curriculum-teacher-course-integrator
description: "Integrate Batch 09 editor, reviewer, publisher and teacher-delivery views with feature flags, analytics, a11y and E2E."
---

# Goal

The curriculum engine is usable end-to-end without bypassing review or exposing private learner data.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 09 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

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

# Implementation workflow

1. Register CMS/teacher routes.
2. Build editors and review queues from existing design system.
3. Seed templates and controls.
4. Apply role/tenant/feature gates.
5. Implement preview that clearly labels draft.
6. Run responsive/a11y/E2E/security tests.

# Data, privacy and integration rules

- Reuse Batch 01–08 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- AI可以起草和建议，但不得批准、自动发布、静默重排正式课程或把未审核内容展示给学习者。
- 每个经文锚点必须核验引用类型、译本、上下文、应用权威层级和版权；不得以模型记忆作文本源。
- 教师记录只能是可观察学习信号；不得推断救恩、信心、动机、诊断、隐藏罪或用于公开排名。
- 学生材料必须声明回应可见性和保存范围；禁止私密披露要求、属灵答案评分和不必要自由文本。
- 讨论题必须可跳过、非诱导、允许不确定和多种解释；禁止预设认罪和同伴压力。
- 情境练习使用虚构案例、非露骨内容和安全出口，不要求真实创伤、性史或私密经历。
- 家庭延伸默认可选且有替代，不得要求秘密监控或使不安全家庭中的学习者受罚。
- 发布必须多角色、版本绑定、职责分离、证据齐全且可回滚；模型不能成为审批者。

# Tests

- role routes
- draft preview labels
- analytics redaction
- a11y/E2E
- publish/rollback

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
