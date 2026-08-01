---
name: christian-attention-governance-assessment
description: "Design or implement the optional adult attention and digital-habit self-assessment for Spiritual Planet, including non-diagnostic questions, domain signals, ephemeral responses, user-confirmed priorities, privacy, UI, algorithms, and tests. Use for assessment flows; do not use to diagnose addiction or score spirituality."
---

# Required resources

Read:

- `references/attention-assessment-policy.md`
- `references/progress-and-privacy-policy.md`
- `schemas/attention-assessment.schema.json`
- `schemas/formation-signal.schema.json`

# Goal

Help adults observe current patterns and select one to three formation priorities without turning the instrument into a clinical test, spiritual examination or surveillance mechanism.

# Implementation workflow

1. Inspect existing form, survey, validation, privacy and accessibility patterns.
2. Build a versioned instrument with 16–24 closed-response items.
3. Cover every configured domain with at least two items when possible.
4. Include both protective/supportive and attention-needed wording.
5. Make the assessment skippable and resumable without coercive copy.
6. Validate `AttentionSelfAssessmentV1`.
7. Generate independent `FormationSignalV1` objects using deterministic rules.
8. Recommend at most three priority domains.
9. Require the learner to confirm or replace recommendations.
10. Persist responses only when explicit consent selects `persist_with_consent`; otherwise discard item responses after signal generation.
11. Add delete and retake actions.
12. Add contract, algorithm, privacy, a11y and e2e tests.

# Signal rules

Use the shared policy as the default. Keep scoring implementation private and domain-local; do not expose a total. `prefer_not_to_answer` reduces completeness only.

High intensity is permitted only when a domain-specific control-loss item is frequently present or multiple items converge. High intensity still means “attention needed,” not diagnosis.

# Result UX

Render:

- supportive patterns first;
- plain-language attention signals;
- reasons based on selected item IDs, not generated moral judgments;
- recommended practices;
- user priority selection;
- privacy explanation and delete action.

Do not render red/green holiness grades, percent spiritual maturity, shame copy or comparison with other users.

# Safety

Do not ask free-text crisis questions in this assessment. If another product surface supplies S2/S3 content, invoke the Batch 01 safety skill and interrupt ordinary flow as required.

# Tests

Must cover:

- every response option;
- skipped items;
- result completeness;
- no overall score property;
- no addiction or salvation label;
- max-three recommendation;
- user override of recommendation;
- ephemeral deletion;
- consented persistence and deletion;
- no answer in analytics or logs;
- keyboard, screen reader and mobile completion;
- duplicate submission idempotency.

# Definition of done

The assessment produces useful, explainable, privacy-minimizing formation signals and leaves moral agency with the learner.
