---
name: christian-algorithmic-worldview-analyzer
description: "Design or implement Spiritual Planet’s algorithmic-worldview analysis canvas for feeds, recommenders, ads, influencers, search, chatbots, games, rankings, and news aggregation. Use to model objective functions, incentives, anthropology, telos, authority, problem and salvation narratives, virtues/vices, hidden costs, feedback loops, Christian comparison, uncertainty, evidence, and tests."
---


# Goal

Help learners inspect how product metrics, incentives and narratives shape a view of humanity and the good life, while keeping hypotheses evidence-based and avoiding blanket condemnation of technology or culture.

# Required resources

Read:

- `references/algorithmic-worldview-policy.md`
- `references/ai-authority-and-idolatry-policy.md`
- `references/journal-privacy-safety-analytics-policy.md`
- `schemas/algorithmic-worldview-analysis.schema.json`
- `schemas/ai-use-intent.schema.json`
- `assets/algorithm-worldview-scenarios.seed.yaml`
- `assets/teacher-facilitation-cards.seed.yaml`
- `assets/ai-discernment-practice-catalog.seed.yaml`

# Workflow

1. Inspect current canvas/form components and content-review patterns.
2. Let users select an artifact type and provide a short label or structured observations. Do not require a URL, browsing history or full media upload.
3. Gather evidence for objective-function hypotheses: interface defaults, public documentation, pricing, ranking behavior and user incentives.
4. Analyze business/institutional incentives, human model, telos, authority model, problem definition, salvation promise, virtues, exploited vices, excluded costs and feedback loops.
5. Require uncertainty and at least one alternative explanation when the analysis is inferential.
6. Build a Christian comparison with both points of contact and tensions. Keep authority labels explicit.
7. End with one reversible experiment: disable personalization, broaden sources, change a default, delay sharing, compare logged-out results or discuss with a human group.
8. Store the structured canvas only. Do not infer developer motives as facts or create a profile of the learner.

# Quality rules

- `automaticCondemnationGenerated=false`.
- `diagnosisGenerated=false`.
- Metrics and profit are not automatically sinful; assess ends, means, tradeoffs and effects.
- Algorithms influence but do not eliminate agency.
- Do not treat a single feed sample as proof of a platform’s complete worldview.

# Tests

Cover every artifact type; hypothesis/evidence separation; missing evidence; alternative explanations; both positive and negative design effects; feedback-loop representation; no raw content storage; no automatic condemnation; teacher facilitation; scenario seeds; i18n; mobile canvas; keyboard ordering and export/delete.

# Definition of done

The learner can articulate what a system optimizes, what kind of person it imagines and what practices could resist or redirect its formation.
