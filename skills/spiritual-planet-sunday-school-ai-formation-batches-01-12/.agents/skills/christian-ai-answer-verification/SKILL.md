---
name: christian-ai-answer-verification
description: "Design or implement Spiritual Planet’s claim-level AI-answer verification pipeline. Use for decomposing outputs into claim types, attaching source provenance and quality, checking freshness and primary sources, preserving conflicts and uncertainty, blocking unverified high-risk use, minimizing stored content, and testing human-owned adoption decisions."
---


# Goal

Replace vague whole-answer “trust scores” with claim-level evidence, provenance, freshness, conflict and human adoption decisions.

# Required resources

Read:

- `references/verification-and-provenance-policy.md`
- `references/api-persistence-blueprint.md`
- `references/journal-privacy-safety-analytics-policy.md`
- `schemas/evidence-claim.schema.json`
- `schemas/ai-answer-verification-session.schema.json`
- `schemas/ai-use-intent.schema.json`
- `assets/source-quality-rubric.seed.yaml`
- `assets/analytics-events.example.yaml`

# Workflow

1. Inspect existing search/browser/RAG adapters, citation UI, audit logs and provider permission boundaries.
2. Accept an ephemeral AI answer or user-selected short excerpt; never persist the complete answer by default.
3. Decompose it into bounded claims. Require the learner to confirm or edit the split for important tasks.
4. Classify each claim: current fact, stable fact, statistic, quotation, interpretation, theological inference, opinion or prediction.
5. Assign verification requirements based on type and stakes. Current facts require fresh sources; quotations require exact provenance; opinions do not become facts.
6. Retrieve evidence only through approved tools/adapters. Prefer primary sources, track access/publication dates, relation and quality tier.
7. Preserve supporting and contradicting evidence. Output `unverified`, `partially_verified`, `verified`, `disputed` or `unverifiable`; never hide conflict behind an average confidence score.
8. Let the human record whether to adopt, revise, defer or reject the claim. `finalDecisionOwner=human`.
9. Store metadata, rights status and optional hashes, not full source pages. Apply tenant/owner scope, export/delete and redaction.

# Failure behavior

If network, source or provider access is unavailable, say so and keep the claim unverified. Do not ask a model to fabricate citations or use its memory as a primary source. For medical, legal, financial, child-safety or emergency claims, route to the corresponding professional/safety boundary.

# Tests

Cover every claim type and source tier; stale/current sources; two sources sharing one origin; citation with no provenance; contradictory reliable sources; provider timeout; offline retry; idempotency; no overall truth percentage; no raw content in DB/logs/analytics; human adoption; ownership; high-risk blocking; accessible evidence comparison.

# Definition of done

The learner can see exactly which claims are supported, disputed or unknown and remains responsible for adopting them.
