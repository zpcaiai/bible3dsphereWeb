---
name: christian-trigger-state-simulation
description: "Implement fictional trigger, interpretation, desire, body and action option timelines."
---

# Goal

Learners practice seeing the chain before action without disclosing personal sensitive history.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 10 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch10-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/scenario-authoring-policy.md`
- `references/scenario-runtime-state-policy.md`
- `references/choice-consequence-and-repair-policy.md`
- `references/socratic-branching-policy.md`
- `references/facilitator-and-safety-policy.md`
- `references/scenario-benchmark-policy.md`
- `schemas/scenario-definition.schema.json`
- `schemas/scenario-runtime-session.schema.json`
- `schemas/scenario-trigger-state-timeline.schema.json`
- `schemas/choice-node.schema.json`
- `schemas/consequence-projection.schema.json`
- `schemas/scripture-grace-intervention.schema.json`
- `schemas/socratic-branch.schema.json`
- `schemas/facilitator-intervention.schema.json`
- `schemas/scenario-safety-decision.schema.json`
- `schemas/scenario-debrief.schema.json`
- `schemas/scenario-authoring-review.schema.json`
- `schemas/scenario-benchmark-result.schema.json`
- `assets/scenario-runtime-control-catalog.seed.yaml`
- `assets/scenario-runtime-curriculum.seed.yaml`
- `assets/scenario-runtime-scenarios.seed.yaml`
- `assets/scenario-node-template.seed.yaml`
- `assets/scenario-benchmark-suite.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Use reviewed category options.
2. Allow multiple interpretations and desires.
3. Include body pause and help choices.
4. Do not diagnose or store explicit narrative.
5. Connect to Batch 02/04 practices.

# Data, privacy and integration rules

- Reuse Batch 01–09 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 所有情境必须虚构、非露骨、可跳过且经过相应神学/牧养/儿童安全审核；不得要求学习者重演真实创伤。
- 运行时只保存版本、节点、选择和状态，不保存原始自由文本，不根据路径建立人格、风险或属灵画像。

# Tests

- no history/diagnosis
- category options
- practice links
- age variants

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
