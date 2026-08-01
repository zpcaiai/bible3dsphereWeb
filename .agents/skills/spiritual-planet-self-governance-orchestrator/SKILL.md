---
name: spiritual-planet-self-governance-orchestrator
description: "Implement Batch 02 of Spiritual Planet’s Sunday School AI-formation module: adult self-governance, attention assessment, Digital Rule of Life, digital Sabbath, body rhythm, delay practices, pause protocol, online speech, comfort/responsibility, 7/14/30/90-day plans, check-ins, privacy, and tests. Use for end-to-end repository implementation, not a single devotional answer."
---

# Mission

Extend the existing `sunday_school.ai_formation` module with a production-ready adult self-governance vertical slice. Preserve the repository’s architecture and all Batch 01 contracts.

# Required companion skills

Load Batch 01 skills when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- `$sunday-school-tab-module-integrator`

Load Batch 02 skills according to the feature being edited:

- `$christian-attention-governance-assessment`
- `$christian-digital-rule-of-life`
- `$christian-digital-sabbath-planner`
- `$christian-body-rhythm-discipline`
- `$christian-delay-gratification-practices`
- `$christian-emotional-pause-protocol`
- `$christian-online-speech-discipline`
- `$christian-comfort-responsibility-discernment`
- `$christian-formation-plan-engine`
- `$adult-self-governance-course-integrator`

# Required resources

Read all files under `references/`, `schemas/`, and `assets/` relative to this skill.

# Workflow

## 1. Inspect Batch 01 implementation

Report concrete paths for:

- module registry and adult route placeholder;
- content blocks and review workflow;
- safety decision boundary;
- auth, RBAC, tenant scoping and learner ownership;
- ORM, migrations, validation and API conventions;
- form, stepper, card, drawer, dialog, chart and a11y primitives;
- analytics and privacy redaction;
- unit, integration and e2e test frameworks.

Do not create a parallel application or a second domain model.

## 2. Produce a repository implementation map

Map each Batch 02 contract and page to existing files. Prefer the smallest compatible extension. If a reusable abstraction is missing, add one and document it.

## 3. Implement contracts first

Implement native types, validators, API DTOs, persistence and migrations for all Batch 02 Schemas. Reject unknown properties at trust boundaries. Version stored contracts.

Default persistence:

- assessment item responses: ephemeral;
- formation signals and user-confirmed priorities: persistable;
- private notes: none or local-only;
- online speech draft: never server-persisted;
- medical details: never stored;
- plans/check-ins/reviews: learner-owned and deletable.

## 4. Build the adult flow

Implement:

1. adult track landing;
2. grace-before-practice introduction;
3. optional assessment;
4. results without total score or diagnosis;
5. user confirmation of one to three priority domains;
6. practice catalog;
7. 7/14/30/90-day plan creation;
8. today/check-in/review flow;
9. Digital Rule of Life;
10. digital Sabbath;
11. body rhythm and fasting safety gate;
12. pause, speech and responsibility tools;
13. pause, export, delete and voluntary sharing.

## 5. Apply theology and safety

Every seed lesson and practice must pass Batch 01 theology review and carry authority and review labels.

S2/S3 signals must invoke the Batch 01 safety boundary. Do not continue a long formation lesson during S3.

Food fasting is restricted to consenting adults who pass the minimal safety gate. All other cases receive a non-food alternative without storing sensitive medical detail.

## 6. Enforce non-scoring formation

Never create:

- overall spiritual score;
- addiction diagnosis;
- salvation probability;
- streak punishment;
- leaderboard;
- cross-user comparison;
- secret teacher, pastor, parent or church-admin access.

Operational practice counts may exist internally for scheduling and aggregate QA, but UI and APIs must not present them as holiness.

## 7. Integrate analytics and privacy

Use the shared analytics example. Emit flow events without answers, drafts, narratives, health details or third-party identity. Redact logs and error reports. Make retries idempotent.

## 8. Test

At minimum cover:

- all Schema valid/invalid cases;
- assessment skip, completion and deletion;
- ephemeral response behavior;
- absence of overall score and diagnosis labels;
- maximum three priorities and three practices per phase;
- all plan horizons;
- plan simplify, pause, resume and archive;
- Digital Rule of Life exceptions and monitoring default;
- digital Sabbath timezone and emergency exceptions;
- food fasting gate;
- S3 interruption;
- online draft non-persistence;
- learner ownership and tenant isolation;
- feature flag, permission, mobile, keyboard and screen reader behavior;
- offline retry and idempotency.

Run repository-native lint, typecheck, unit, integration, e2e and a11y tests.

## 9. Report

Return files changed, migrations, architecture decisions, test commands/results, privacy decisions, content review status, unresolved risks and Batch 03 extension hooks.

# Definition of done

A learner can enter the adult track, understand grace-first formation, optionally assess patterns, confirm priorities, start a safe plan, practice, check in, review, modify or delete it, while theology, privacy, safety, accessibility and repository conventions remain intact.
