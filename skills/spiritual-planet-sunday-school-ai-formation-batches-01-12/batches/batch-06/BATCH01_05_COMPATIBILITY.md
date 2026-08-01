# Batch 01–05 Compatibility Contract

Batch 06 must extend, not replace:

- `sunday_school.ai_formation` module registration and route namespace;
- `FormationContentBlockV1` authority levels and review states;
- `LearnerContextV1`, S0–S3 interruption and human escalation;
- RBAC, tenant scoping, owner isolation, deletion/export and audit conventions;
- feature flags, i18n, analytics allowlists, accessibility and test infrastructure;
- all prior-batch plans, covenants, courses, practices and review records that the real repository already implements.

Compatibility rules:

1. Reuse canonical learner, household, course, content, reviewer and safety identifiers.
2. Add versioned adapters for prior contracts; do not mutate historical records silently.
3. Seed idempotently and preserve review status.
4. Do not create a second private journal, safety engine, Bible-provider abstraction, curriculum engine or notification service.
5. Keep rollout behind a feature flag and supply backward-compatible rollback.
6. When a prior batch is not yet implemented in the real repository, create the smallest interface-compatible abstraction and record it as a prerequisite—not a shadow implementation.
