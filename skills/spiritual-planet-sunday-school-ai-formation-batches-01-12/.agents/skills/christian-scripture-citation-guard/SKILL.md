---
name: christian-scripture-citation-guard
description: "Design or implement Spiritual Planet’s Scripture citation and context guard. Use for canonical book parsing, localized aliases, direct-quote versus paraphrase labels, licensed/public-domain text providers, quotation matching, translation metadata, paragraph/chapter context, authority-level separation, copyright minimization, human review, and tests."
---


# Goal

Prevent fabricated verses, translation confusion and context-free applications while respecting Scripture rights and keeping final interpretation with accountable humans and the church.

# Required resources

Read:

- `references/scripture-citation-validation-policy.md`
- `references/spiritual-content-boundaries-policy.md`
- `references/api-persistence-blueprint.md`
- `schemas/scripture-citation-check.schema.json`
- `schemas/spiritual-content-boundary-decision.schema.json`
- `assets/ai-discernment-practice-catalog.seed.yaml`
- `assets/teacher-facilitation-cards.seed.yaml`

# Workflow

1. Inspect any existing Bible canon registry, translation provider, content license, locale alias and theological-review code.
2. Implement a canonical reference parser with book aliases for supported locales. Keep aliases data-driven and tested.
3. Require citation kind: direct quote, paraphrase, allusion or reference only.
4. For direct quotes, require a licensed/public-domain/authorized provider and compare the text. Record translation and provenance.
5. When a provider is unavailable, degrade to reference-only or `not_checked`; never generate a remembered verse.
6. Read at least paragraph context. For doctrinal or high-impact application, expose chapter, genre, speaker, audience, covenant setting and canonical-context prompts.
7. Detect common warnings: speaker/audience errors, narrative treated as command, description as prescription, translation mismatch and missing reference.
8. Keep long quote storage false. Store reference, metadata, match result, rights status and human-review outcome.
9. Send interpretive outputs through Batch 01 authority/review workflow. This tool validates text/context; it does not certify a complete theology.

# Prohibitions

Never put invented words in quotation marks and attribute them to Scripture. Never say AI is delivering a private word from God. Never silently mix translations. Never bypass a provider license by caching large passages.

# Tests

Cover all canonical books, common Chinese/English aliases, ranges, invalid chapters/verses, direct quote exact/minor/mismatch, paraphrase labels, provider unavailable, translation mismatch, rights limits, context warning, no long-text storage, human review, i18n, accessibility and malicious reference input.

# Definition of done

Every published Scripture reference has traceable provenance, a correct citation label, relevant context signals and an accountable human review path.
