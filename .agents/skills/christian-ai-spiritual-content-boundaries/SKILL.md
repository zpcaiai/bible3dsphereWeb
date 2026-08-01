---
name: christian-ai-spiritual-content-boundaries
description: "Design or implement Spiritual Planet’s AI-assisted spiritual-content boundary service. Use for prayer-language drafts, devotional summaries, Bible-study questions, sermon outlines or drafts, testimony editing, confession prompts, pastoral counsel, spiritual diagnosis, prophecy claims, child-private counsel, human review, disclosure, safety routing, and no-auto-publish rules."
---


# Goal

Permit carefully bounded AI assistance while preventing generated language from impersonating prayer, revelation, pastoral authority, exegesis or lived testimony.

# Required resources

Read:

- `references/spiritual-content-boundaries-policy.md`
- `references/non-outsourcable-capabilities-policy.md`
- `references/scripture-citation-validation-policy.md`
- `schemas/spiritual-content-boundary-decision.schema.json`
- `schemas/ai-use-intent.schema.json`
- `schemas/scripture-citation-check.schema.json`
- `assets/ai-use-boundary-matrix.seed.yaml`
- `assets/ai-discernment-practice-catalog.seed.yaml`

# Workflow

1. Inspect content drafting, CMS, review, publish, audit and pastoral-safety paths.
2. Classify the use case and produce a boundary decision before generation or saving.
3. Prayer-language drafts: label as generated wording, avoid storing private content, prompt personal modification and screen-free prayer.
4. Devotional summaries and Bible-study questions: require original-text-first UX and Scripture check links.
5. Sermon work: permit research questions, outline options, critique and editing; require human exegesis, source verification, audience knowledge, church policy disclosure and authorized review.
6. Testimony editing: never invent facts, feelings, conversion history or divine guidance.
7. Confession prompts and pastoral counsel: avoid harvesting secrets, diagnoses and prescriptive high-risk decisions; route to pastor/professional/safety as needed.
8. Prophecy, “God told you,” spiritual diagnosis and secret child counsel are prohibited or redirected.
9. Save generated content as draft only. `autoPublishAllowed=false` and audit human changes before publication.

# Hard invariants

- `claimsDivineRevelation=false`.
- `aiMayReplacePrayer=false`.
- `aiMayReplaceChurch=false`.
- No salvation, calling, demonization, hidden-sin or spiritual-maturity determination.
- The system may say “this is a general reflection,” never “this is God’s personal message to you.”

# Tests

Cover every use case enum; prayer draft label; original-text-first; sermon human review; fabricated testimony rejection; prophecy phrase detection; child-private counsel; S2/S3; no auto-publish; permission/audit; Scripture mismatch; draft deletion; no private content analytics; accessible review UI.

# Definition of done

AI-supported spiritual content remains transparently auxiliary, textually checked, human-reviewed and pastorally accountable.
