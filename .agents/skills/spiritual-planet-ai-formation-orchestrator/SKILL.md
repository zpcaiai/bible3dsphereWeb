---
name: spiritual-planet-ai-formation-orchestrator
description: Build or extend the Spiritual Planet Sunday School module “AI时代心意更新与家庭门训”; orchestrate repository inspection, module integration, theology, safety, schemas, UI, data, tests, and documentation. Use for end-to-end implementation of this module, not for answering a single theological question.
---

# Mission

Implement the `sunday_school.ai_formation` module inside the existing Spiritual Planet repository. Preserve the repository’s architecture, design system, authentication, permissions, i18n, testing conventions, and deployment model.

# Required companion skills

Before editing theology, data, intake, safety, or navigation, load the matching companion skill when available:

- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-context-intake`
- `$christian-formation-pastoral-safety`
- `$sunday-school-tab-module-integrator`

# Required references

Read:

- `references/module-blueprint.md`
- `references/theological-baseline.md`
- `references/pastoral-safety-policy.md`
- all files under `schemas/`
- `assets/module-manifest.example.yaml`

Resolve these paths relative to this skill directory.

# Workflow

## 1. Inspect before changing

Determine and report:

- monorepo or single app;
- frontend framework and routing;
- backend/runtime and API conventions;
- database and migration system;
- auth, RBAC and tenant model;
- design system and existing Sunday School Tab patterns;
- i18n conventions;
- analytics/event conventions;
- unit, integration and e2e test tools;
- content storage and editorial review model.

Do not scaffold a parallel app unless the repository has no product application.

## 2. Create an implementation map

Map every required feature to concrete repository paths. Reuse existing abstractions. Identify gaps and choose the smallest compatible extension.

The Batch 01 vertical slice must contain:

- module registry entry;
- Sunday School Tab card;
- route `/sunday-school/ai-formation`;
- module landing page;
- four course-track cards;
- learner-context type and validator;
- content-block type and validator;
- pastoral safety decision interface;
- feature flag and teacher permission;
- seed or fixture data;
- loading, empty, error and retry states;
- accessibility and responsive behavior;
- tests and developer documentation.

## 3. Implement contracts before rich content

Implement schemas/types/validators first. Generate language-native types from the JSON Schemas when the repository supports code generation; otherwise write equivalent types and contract tests.

Reject unknown fields at trust boundaries. Preserve forward compatibility through explicit versioning rather than permissive payloads.

## 4. Apply theology and safety gates

Every course content object must carry `authorityLevel` and `reviewStatus`.

Do not publish generated theological content directly. Route it through at least theology review and pastoral review states.

Before storing or presenting sensitive learner input, invoke the safety decision flow. S3 must interrupt ordinary lessons.

## 5. Integrate, do not duplicate

Use existing:

- navigation registry;
- card and page-shell components;
- loading/error primitives;
- permission utilities;
- feature flags;
- analytics;
- database repositories;
- content editor;
- testing fixtures.

If an abstraction is missing, add the smallest reusable primitive and document it.

## 6. Test

At minimum test:

- module discovery from Sunday School Tab;
- route and deep link;
- four track cards;
- teacher CTA permission behavior;
- Schema valid/invalid cases;
- content authority label rendering;
- S3 ordinary-flow interruption;
- keyboard navigation and accessible names;
- mobile layout;
- feature flag off behavior;
- no sensitive details written by the safety decision object.

Run repository-native lint, typecheck, unit and relevant e2e tests.

## 7. Report

Return:

- files changed;
- architecture decisions;
- data migrations;
- test commands and results;
- unresolved risks;
- next Batch hooks.

# Non-negotiable constraints

- Do not equate low screen time with spiritual maturity.
- Do not create a salvation score.
- Do not diagnose mental illness.
- Do not implement covert child surveillance.
- Do not present household rules as universal divine commands.
- Do not replace church, pastoral care, clinical care, or emergency support.
- Do not invent Scripture quotations or citations.
- Do not leave placeholder TODOs in the completed Batch 01 path unless they are explicitly registered as later-batch extension points.

# Definition of done

The module is discoverable, understandable, typed, safe, permission-aware, accessible, tested, and implemented in the existing product rather than a side project.
