---
name: christian-ai-role-authority-discernment
description: "Design or implement Spiritual Planet’s AI-use intent and Christian role/authority boundary classifier. Use when distinguishing AI as tool, tutor, collaborator, verifier, recommender, decision-maker, companion, or prohibited spiritual authority; include stakes, privacy, human responsibility, idolatry reflection, safety routing, UI, persistence, and tests."
---


# Goal

Turn an ambiguous “use AI for this” request into an explicit, explainable and human-owned boundary decision without treating every use as either harmless or idolatrous.

# Required resources

Read:

- `references/ai-authority-and-idolatry-policy.md`
- `references/batch03-blueprint.md`
- `references/journal-privacy-safety-analytics-policy.md`
- `schemas/ai-use-intent.schema.json`
- `schemas/ai-authority-boundary-decision.schema.json`
- `assets/ai-use-boundary-matrix.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Inspect existing intake, form, policy-engine, safety, RBAC, privacy and event patterns.
2. Build a concise intent form for task category, stakes, requested role, delegation level, privacy class and final-responsibility acknowledgement. Never store the raw prompt.
3. Implement deterministic policy rules from the boundary matrix. Keep the rule result explainable and versioned.
4. Permit low-risk tool/tutor/collaborator uses. Route current facts to verification. Require human review for high-risk recommendation. Prohibit substitution for final moral decisions, pastoral diagnosis, prophecy, divine messages and secret minor companionship. Invoke safety for emergency/S3.
5. Render the decision as: what AI may do, what the human must retain, what source or person is required, what must not be entered and why.
6. Offer idolatry/authority-drift questions as optional reflection only. Do not label the learner an idolater, unbeliever or addict.
7. Link the result to the verification, spiritual-content, learning-integrity or human-support flow.
8. Persist only intent metadata and decision codes. Add delete/export. Redact traces and analytics.

# Decision invariants

- `aiIsUltimateAuthority=false` always.
- `claimsDivineRevelationAllowed=false` always.
- A model’s confidence never reduces human review requirements.
- `decision_maker`, `spiritual_authority`, `emergency` and `prohibited_input` cannot silently fall through to an allow state.
- Human responsibility acknowledgement is not legalistic consent and does not remove product duties.

# UX

Use neutral language: “This task needs a human decision” rather than “You lack faith.” Show examples and allow the learner to lower delegation. Older teens receive supervised language; do not create a private companion pattern.

# Tests

Cover every matrix row, unknown task, emergency, prohibited privacy input, current fact, moral decision, prayer draft, sermon outline, minor companion, prophecy claim, user override to lower delegation, no raw prompt storage, analytics redaction, owner/tenant isolation, keyboard and screen-reader flow.

# Definition of done

The product consistently identifies AI’s permitted support role while reserving authority, conscience, responsibility, church and embodied relationship to humans.
