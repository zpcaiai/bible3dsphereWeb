---
name: spiritual-planet-ai-discernment-orchestrator
description: "Implement Batch 03 of Spiritual Planet’s Sunday School AI-formation module: AI-role boundaries, non-outsourcable human acts, claim verification, Scripture checks, spiritual-content review, algorithmic worldview analysis, media desire formation, Socratic discernment, learning integrity, private journals, courses, privacy, safety, and tests. Use for end-to-end repository implementation, not a single devotional answer."
---


# Mission

Extend the existing `sunday_school.ai_formation` module with the production-ready Batch 03 discernment vertical slice. Preserve all Batch 01 theology/safety contracts and Batch 02 non-scoring, privacy, Practice Catalog, plan and review contracts.

# Required companion skills

Load when available:

- `$spiritual-planet-ai-formation-orchestrator`
- `$christian-formation-theological-guardrails`
- `$christian-formation-domain-model`
- `$christian-formation-pastoral-safety`
- `$spiritual-planet-self-governance-orchestrator`
- `$christian-formation-plan-engine`
- every focused Batch 03 skill relevant to the changed surface.

# Required resources

Read all files under `references/`, `schemas/`, and `assets/` relative to this skill.

# Workflow

## 1. Inspect the real repository

Locate concrete paths for module registration, adult and teacher routes, content review, S0–S3 interruption, Practice Catalog, Formation Plan/Review, auth/RBAC/tenant scoping, ORM/migrations, validators, search or web adapters, Bible text/provider adapters, privacy redaction, feature flags, analytics, i18n, design primitives and test commands. Do not create a parallel application, second authority model or second private-journal subsystem.

## 2. Produce a file-level implementation map

Map every new route, schema, table/service, seed and test to existing repository conventions. Identify external provider boundaries without hard-coding a vendor. Report any missing prerequisite before implementing the smallest compatible abstraction.

## 3. Implement contracts first

Implement native types, trust-boundary validation, migrations, APIs and ownership rules for all 13 Batch 03 schemas. Reject unknown properties. Version persisted contracts. Keep raw prompts, complete AI answers, source pages, media bodies and long Scripture text ephemeral. Persist only minimal structured metadata or user-consented short summaries.

## 4. Build the discernment flow

Implement:

1. discernment landing and course entry;
2. `AiUseIntentV1` capture without raw prompt storage;
3. deterministic role/authority boundary classification;
4. non-outsourcable capability explanation and human-action reservation;
5. claim-level verification with source provenance, freshness and conflict states;
6. Scripture reference, quotation, translation, context and rights checks;
7. prayer/devotional/sermon/pastoral content boundary decisions;
8. algorithmic worldview canvas;
9. media desire/liturgy analysis;
10. non-coercive Socratic question trees;
11. learning-integrity workflow;
12. private discernment journal, periodic review, export, delete and revocable summary sharing;
13. teacher facilitation lab without secret access to learner reflections.

## 5. Preserve human agency and church responsibility

Never make AI the final factual, ethical, theological, pastoral or relational authority. Never generate divine-revelation claims, salvation judgments, spiritual-maturity scores, hidden-sin conclusions or automatic calls. AI may assist expression and analysis but cannot perform prayer, repentance, faith, covenant, relational repair, embodied care, church office or final authorship.

## 6. Integrate verification correctly

For current or high-impact factual claims, use the repository’s controlled external retrieval layer when available. Prefer primary sources, store provenance metadata and preserve disputes. If tools or providers are unavailable, return `unverified` or `unverifiable`; never fill gaps from model memory. A confident tone is not evidence.

## 7. Apply privacy, age and safety boundaries

Adult/teacher flows are complete. Older-teen access is supervised according to product policy; younger children remain out of scope for independent use. Do not harvest confession, sexuality, trauma, third-party identities or private browsing history. S2/S3 invokes Batch 01; S3 interrupts ordinary lessons.

## 8. Seed reviewed content

Load the curriculum, practice, scenario, boundary, source-quality, analytics and teacher-card assets idempotently. All spiritual content remains `theology_review` or `pastoral_review` until authorized reviewers approve it. Never auto-publish generated prayer, devotional, teaching or sermon content.

## 9. Test

Cover valid/invalid schema cases; role classification; prohibited spiritual authority; emergency interruption; non-outsourcable actions; source freshness and conflicts; no whole-answer trust score; provider unavailable degradation; Scripture parser and quotation mismatch; no long-text persistence; spiritual-content review; algorithm hypotheses and alternative explanations; no diagnosis or automatic condemnation; Socratic skip/non-leading behavior; academic policy unknown; journal owner isolation; sharing revocation; analytics denylist; feature flag; mobile; keyboard; screen reader; reduced motion; idempotency; migration and rollback.

Run repository-native lint, typecheck, unit, integration, e2e, a11y, migration and content-review tests.

## 10. Report

Return repository discoveries, files changed, migrations, provider adapters, architecture decisions, security/privacy decisions, content review state, real commands/results, unresolved risks and extension hooks for Batch 04.

# Definition of done

A learner can state what they want AI to do, preserve non-outsourcable responsibility, verify important claims and Scripture, analyze algorithmic formation, reach a human-owned decision and review the fruit without surveillance, spiritual scoring, fabricated authority or unreviewed publication.
