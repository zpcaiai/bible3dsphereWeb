---
name: christian-socratic-media-discernment
description: "Design or implement Spiritual Planet’s non-coercive Socratic discernment engine for AI and media questions. Use for question trees covering observation, definitions, evidence, assumptions, incentives, anthropology, alternative explanations, telos, fruit, Scripture context, and action; include skip rights, age modes, privacy, teacher facilitation, safety escalation, anti-manipulation tests, and no forced confession."
---


# Goal

Create a branching dialogue that strengthens observation and judgment rather than steering users through leading questions toward a hidden predetermined answer.

# Required resources

Read:

- `references/socratic-discernment-policy.md`
- `references/algorithmic-worldview-policy.md`
- `references/media-desire-liturgy-policy.md`
- `schemas/socratic-discernment-session.schema.json`
- `schemas/algorithmic-worldview-analysis.schema.json`
- `schemas/media-desire-analysis.schema.json`
- `assets/teacher-facilitation-cards.seed.yaml`
- `assets/algorithm-worldview-scenarios.seed.yaml`

# Workflow

1. Inspect existing conversation/tree/state-machine and content-authoring tools.
2. Implement versioned question nodes with explicit purpose, next-node IDs and response-storage mode.
3. Use the default sequence: observation, definition, evidence, assumptions, incentives, alternative explanations, anthropology/telos, fruit, Scripture context and action.
4. Let learners skip, pause or answer “uncertain.” Do not treat refusal as resistance or spiritual failure.
5. Keep self-guided responses ephemeral or local/private unless explicit consent. Never solicit confession, trauma, sexuality or third-party secrets.
6. Teacher mode shows facilitation goals, bias warnings and safe redirects. Teachers cannot secretly open private learner sessions.
7. For 13–15-year-olds, only use approved parent/teacher-facilitated trees. Do not create private companion dynamics.
8. Detect S2/S3 content and hand off to Batch 01 rather than continuing philosophical questions.
9. Produce a learner-owned summary: evidence found, assumptions remaining, uncertainty and one action experiment.

# Anti-manipulation invariants

- `userCanSkip=true`.
- `coerciveLeadingAllowed=false`.
- `predeterminedVerdictRequired=false`.
- `privateConfessionSolicited=false`.
- Every evaluative branch should permit at least one alternative explanation or an explicit “insufficient evidence” outcome.

# Tests

Cover branching, cycles, unreachable nodes, skip/pause, uncertain answer, alternative explanation, teacher mode, age gate, private storage choice, no forced confession, no hidden verdict, safety interruption, accessibility, localization and deterministic resume.

# Definition of done

The engine helps learners reason honestly and act wisely without using spiritual language to manipulate disclosure or agreement.
