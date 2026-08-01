---
name: christian-discernment-journal-review
description: "Design or implement Spiritual Planet’s private AI-discernment journal and periodic review. Use for recording intended versus actual delegation, verification, attention, prayer, relationship, learning and responsibility effects; detect outsourcing drift without diagnosis; support keep/change/stop decisions, owner-only privacy, export/delete, revocable summary sharing, safety routing, and no spiritual scoring."
---


# Goal

Create a private, learner-owned memory of AI-use patterns so the user can notice drift and fruit without surveillance, cross-user comparison or an automated spirituality score.

# Required resources

Read:

- `references/journal-privacy-safety-analytics-policy.md`
- `references/api-persistence-blueprint.md`
- `references/non-outsourcable-capabilities-policy.md`
- `schemas/discernment-journal-entry.schema.json`
- `schemas/discernment-review.schema.json`
- `schemas/ai-use-intent.schema.json`
- `assets/analytics-events.example.yaml`
- `assets/ai-discernment-practice-catalog.seed.yaml`

# Workflow

1. Inspect Batch 02 check-in/review, encryption, export/delete, share/revoke and owner authorization patterns.
2. Build a short journal form for task, reason, intended/actual delegation, retained human work, verification, surprise, effects and next boundary.
3. Do not require pasting the prompt or answer. Do not collect third-party names, private confession or detailed sensitive narratives.
4. Default to `private`. A user may create a separate minimal share summary, inspect it, choose recipient scope and revoke it. Never grant secret teacher, parent, pastor or admin reading.
5. Build periodic review from selected entries. Detect descriptive patterns such as authority drift, less first-attempt work, weak verification or healthy support. Present evidence entries, not a hidden score.
6. Require at least one decision: keep, change, stop, verify more, read primary text, seek teacher/pastor/professional or reduce data shared.
7. Link chosen actions to Batch 02 Formation Plan without converting them into holiness streaks.
8. Invoke safety for S2/S3; explain that the journal is not an emergency or confidential pastoral service.

# Invariants

- `analyticsContainsPrivateReflection=false`.
- `rawAiContentStored=false`.
- `spiritualMaturityScoreGenerated=false`.
- `salvationInferenceGenerated=false`.
- `crossUserComparisonGenerated=false`.

# Tests

Cover create/edit/delete/export, owner/tenant isolation, share summary preview, revoke, teacher denied, selected-entry review, evidence links, no score, no private analytics/logs, Batch 02 handoff, retention/deletion, offline/idempotent save, accessibility and S3 interruption.

# Definition of done

Learners can see whether AI is strengthening or weakening judgment, relationships and responsibility and choose a proportionate next boundary.
