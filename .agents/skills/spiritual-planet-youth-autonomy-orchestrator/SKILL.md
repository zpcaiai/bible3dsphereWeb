---
name: spiritual-planet-youth-autonomy-orchestrator
description: "Implement Batch 08 youth identity, doubt, sexuality safety, social media, AI integrity, autonomy, stewardship, mentoring, leaving-home readiness and safeguarding."
---

# Mission

Implement **Batch 08: 13–15岁与16–18岁：身份、怀疑、性与社交媒体、AI诚信和自治交还系统** as a production-grade vertical slice inside the existing `sunday_school.ai_formation` module. Preserve Batch 01–07 contracts, reuse the real repository architecture, and do not create a parallel application, duplicate authority model, duplicate safety engine or isolated data silo.

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
- every focused Batch 08 skill relevant to the changed surface.

# Required resources

Read all declared files before editing:

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

# End-to-end workflow

1. Inspect youth/guardian/mentor/course/household/safety architecture.
2. Implement 12 schemas, migrations and permissions.
3. Build identity pressure and question/doubt flows.
4. Build sexuality safety and social-media reflection.
5. Build AI academic integrity.
6. Build capability autonomy, time/money and mentor plans.
7. Build governance milestones and leaving-home readiness.
8. Integrate S2/S3 and reviewed content.
9. Run full verification.

# Repository integration requirements

- Inspect the actual routes, module registry, design system, auth/RBAC, tenant scoping, ORM/migrations, API conventions, content review, feature flags, analytics, i18n, accessibility and test commands first.
- Produce a file-level change map before implementation. Resolve existing identifiers and services rather than inventing a second architecture.
- Implement schemas and trust-boundary validators before UI. Reject unknown fields, version persisted records, add migrations and rollback paths, and preserve owner/tenant isolation.
- Keep generated content in review states until authorized human reviewers approve it. Seed data must be idempotent.
- Use deterministic policy code for hard safety, privacy, age, permission and publication gates. LLM output may assist wording or classification only where ambiguity is acceptable and reviewable.
- When the task can be safely parallelized and the Codex environment supports subagents, delegate bounded repository discovery, schema/test work and UI/a11y review; the main agent remains responsible for integration and verification.
- Run the repository’s real lint, typecheck, unit, integration, migration, E2E, accessibility, content-review and security tests. Never report a test as passed unless its command actually ran successfully.

# Non-negotiable invariants

- 青少年可以提问、怀疑、不同意或暂时不确定；禁止信仰答案评分、强迫归信和把疑问自动定性为悖逆。
- 不得给青少年分配身份标签、推断性取向、救恩、成熟度、隐藏罪或未来风险。
- 性与关系教育必须非露骨、年龄适切、经过审核；禁止个人性史采集、秘密成人—青少年或AI—青少年亲密渠道。
- AI学习必须遵守学校政策、保留独立尝试、核验、披露和最终作者责任；禁止代写规避检测和伪造过程。
- 社交媒体分析不得采集完整帖子历史、建立家长监控流或生成社交价值分。
- 自治按能力逐步交还，必须有青少年声音、试行、复盘和恢复路径；一次失败不得永久全量回收。
- 导师关系必须透明、角色清楚、可撤销普通同意、无秘密/浪漫/性化渠道，并说明保护性保密边界。
- 勒索、强迫、未经同意影像、成人不当接触、自伤或即时危险必须进入S2/S3，产品不取证、不责怪。

# Required tests

- schema fixtures
- youth/guardian/mentor RBAC
- no belief/identity scoring
- AI integrity
- autonomy transitions
- mentor safety
- S3 interruption
- a11y/E2E

# Final report

Return repository discoveries, files changed, migrations, seeds, APIs, UI routes, permission decisions, privacy decisions, safety decisions, content review state, exact commands and results, rollback notes, unresolved risks and extension hooks for the next batch.

# Definition of done

Youth can form honest faith, digital judgment and progressively owned responsibility within transparent protection, without coercion, surveillance or spiritual scoring.
