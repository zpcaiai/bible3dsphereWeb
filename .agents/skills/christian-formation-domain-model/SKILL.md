---
name: christian-formation-domain-model
description: Implement or revise typed data models, JSON Schemas, validation, persistence, migrations, and contract tests for the Spiritual Planet AI-age Christian formation Sunday School module. Use for data and API contracts, not for writing lesson prose.
---

# Required resources

Read all files under `schemas/` and `assets/module-manifest.example.yaml` relative to this skill.

# Core entities

Implement repository-native representations for:

- ModuleManifest
- CourseTrack
- Unit
- Lesson
- ScriptureAnchor
- FormationDomain
- Practice
- ReflectionPrompt
- Scenario
- FamilyCovenant
- LearnerContext
- AssessmentInstrument
- ProgressRecord
- SafetyFlag
- PastoralReferral
- ContentReviewRecord

Batch 01 must fully implement:

- ModuleManifest
- CourseTrack
- LearnerContext
- FormationContentBlock
- PastoralSafetyDecision

Other entities may be stable interfaces or documented extension points.

# Modeling rules

- Version every externally stored contract.
- Reject unknown properties at API boundaries.
- Use stable machine IDs separate from localized titles.
- Store localized text by locale key.
- Store Scripture references as references and context notes, not unlicensed full translations.
- Keep `authorityLevel` and `reviewStatus` mandatory on content.
- Do not infer salvation status, diagnosis, abuse status, or family fitness from assessment scores.
- Separate formation observations from clinical or legal conclusions.
- Use append-only audit records for content approval when the repository supports auditing.
- Apply tenant/church isolation where the product is multi-tenant.

# Persistence boundaries

Do not persist raw sensitive narratives by default. Prefer:

- categorical goals;
- user-selected age band;
- explicit consent flags;
- aggregate progress;
- reviewed referral state;
- redacted audit metadata.

Do not persist:

- raw private AI chats;
- detailed sexual disclosures from minors;
- full browsing history;
- secret parental surveillance data.

# Implementation workflow

1. Inspect existing schema, ORM and validation conventions.
2. Map JSON Schema fields to native types.
3. Add migration only when persistence is required.
4. Add serialization and validation.
5. Add positive, negative and version-compatibility tests.
6. Add fixtures for four tracks and all age bands.
7. Document migration rollback and data retention.

# Contract tests

Must cover:

- missing required fields;
- unknown fields;
- invalid age band;
- minor consent without guardian confirmation;
- duplicate or missing course tracks;
- content without authority level;
- content with invalid review status;
- S3 decision that incorrectly continues ordinary course;
- any attempt to set `storeSensitiveDetails` true.

# Definition of done

The product has a single authoritative model layer, validated at trust boundaries, with migrations and tests aligned to existing repository conventions.
