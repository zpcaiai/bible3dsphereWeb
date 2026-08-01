---
name: spiritual-planet-ai-formation-complete-program-orchestrator
description: "Implement, integrate, verify, and release the complete Spiritual Planet Sunday School AI-era formation program across Batches 01–12. Use for end-to-end repository work spanning module foundations, self-governance, AI discernment, sexuality and virtual intimacy, parent and family formation, child and youth curricula, teacher tooling, scenario runtime, Formation Twin, and production certification."
---

# Mission

Implement the complete `sunday_school.ai_formation` program inside the existing Spiritual Planet repository. This Skill coordinates Batches 01–12; it is not a devotional-answer Skill and must not create a parallel application.

# Required resources

Read these files relative to this Skill directory:

- `references/program-blueprint.md`
- `references/batch-dependency-map.md`
- `references/safety-and-governance-contract.md`
- `references/implementation-and-release.md`
- `assets/batch-index.yaml`

# Required batch orchestrators

Load and execute these in dependency order:

1. `$spiritual-planet-ai-formation-orchestrator`
2. `$spiritual-planet-self-governance-orchestrator`
3. `$spiritual-planet-ai-discernment-orchestrator`
4. `$spiritual-planet-identity-intimacy-recovery-orchestrator`
5. `$spiritual-planet-parent-formation-orchestrator`
6. `$spiritual-planet-family-attention-covenant-orchestrator`
7. `$spiritual-planet-child-formation-orchestrator`
8. `$spiritual-planet-youth-autonomy-orchestrator`
9. `$spiritual-planet-curriculum-teacher-engine-orchestrator`
10. `$spiritual-planet-scenario-runtime-orchestrator`
11. `$spiritual-planet-formation-twin-orchestrator`
12. `$spiritual-planet-production-certification-orchestrator`

# Workflow

## 1. Discover the real repository

Before editing, locate and report the existing application boundaries, Sunday School navigation, routes, auth/RBAC, tenant model, learner/household identities, design system, ORM and migrations, APIs, content workflow, S0–S3 safety router, Bible/source providers, analytics, i18n, accessibility, tests, CI/CD, deployment and rollback mechanisms.

## 2. Build a dependency-aware implementation map

Map every Batch to concrete repository paths, canonical IDs, migrations, feature flags, review gates, permissions, retention rules, test suites and release evidence. Reuse existing abstractions. Do not create duplicate identity graphs, safety routers, curriculum engines, analytics pipelines or release systems.

## 3. Implement sequentially with exit gates

Implement Batch 01 through Batch 12 in order. A later Batch may begin only after the earlier Batch contracts it depends on exist and its blocking tests pass. Keep migrations forward- and rollback-testable. Record exact commands, exit codes and limitations.

## 4. Keep authority and responsibility human

AI may assist drafting, comparison, classification and evidence preparation, but may not become divine revelation, conscience, pastor, covenant partner, child’s secret companion, clinical diagnostician, final theological reviewer or final release authority.

## 5. Preserve dignity, privacy and safeguarding

Never produce salvation, holiness, maturity, purity, addiction, orientation, parental-fitness, calling or hidden-sin scores. Never use covert monitoring. Do not place raw confessions, explicit content, child narratives, private chats, health details or third-party identities in analytics or model logs. S3 and child-protection blockers interrupt ordinary flows.

## 6. Require content review

Generated theological, pastoral, sexual-formation, child/youth and curriculum material remains in review states until authorized people approve it. Deterministic code enforces age gates, owner/tenant access, publication gates, deletion/retention and release blockers.

## 7. Verify the whole program

Run repository-native lint, typecheck, unit, integration, migration forward/rollback, E2E, accessibility, privacy, security, child-safety red-team, content-review, build, deploy-smoke and rollback-drill tests. Static Skill validation is not production certification.

# Non-negotiable release blockers

- tenant or owner isolation failure;
- S3 or child-safety interruption failure;
- unauthorized sensitive-data access or logging;
- unreviewed theological or age-sensitive content reaching production;
- covert monitoring or secret AI-companion behavior;
- fabricated Scripture or source evidence;
- irreversible migration without a reviewed recovery path;
- critical accessibility or security failure;
- missing human release decision and rollback ownership.

# Final report

Return repository discoveries, architecture decisions, files and migrations, canonical contracts, routes and UI, permissions, data flows and retention, safety decisions, content-review state, exact tests and results, artifact hashes, release gates, rollout and rollback, unresolved blockers and named human-owned next actions.
