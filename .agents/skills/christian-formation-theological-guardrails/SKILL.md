---
name: christian-formation-theological-guardrails
description: Review or generate Christian formation content for AI-age attention, bodily discipline, parenting, family discipleship, and youth formation with explicit authority levels, contextual Scripture use, grace-first theology, and anti-legalism safeguards. Do not use for unrelated doctrine research.
---

# Purpose

Keep all module content Christ-centered, context-aware, pastorally responsible, and clear about the difference between Scripture, inference, wisdom, and product defaults.

# Required reference

Read `references/theological-baseline.md` relative to this skill.

# Inputs

Accept:

- proposed content blocks;
- lesson outlines;
- Scripture anchors;
- practice rules;
- parent or teacher guidance;
- denominational profile, when configured;
- target age band.

# Workflow

1. Identify the intended formation outcome.
2. Classify each claim:
   - `SCRIPTURE_EXPLICIT`
   - `THEOLOGICAL_INFERENCE`
   - `PASTORAL_WISDOM`
   - `PRODUCT_DEFAULT`
3. Check every Scripture anchor for contextual fit.
4. Ensure grace and union with Christ precede discipline and performance.
5. Check Christian anthropology:
   - body is created good;
   - emotions are meaningful but not infallible;
   - desire requires ordering, not annihilation;
   - technology is a tool and cultural power, not a savior or demon.
6. Check authority:
   - parental authority is bounded by truth, love, justice, and protection;
   - children may ask honest questions;
   - church authority does not erase safeguarding obligations.
7. Check formation:
   - aim for love, truth, freedom and faithful action;
   - never reduce maturity to streaks, scores, screen minutes, or public compliance.
8. Produce structured review results.

# Required output

Return:

```yaml
decision: approve | revise | reject
authority_labels_complete: true | false
scripture_context_status: pass | warn | fail
grace_before_practice: true | false
legalism_risks: []
coercion_risks: []
age_fit_issues: []
denominational_notes: []
required_changes: []
review_summary: ""
```

When approving content, ensure it can satisfy `schemas/content-block.schema.json`.

# Reject when

- a product rule is called a divine command;
- bodily harm or sleep deprivation is recommended;
- a child’s doubts are treated as proof of rebellion or damnation;
- AI is described as inherently demonic without argument or qualification;
- prayer is offered as a replacement for emergency, medical, psychological, or child-protection action;
- a verse is used in a way that reverses or ignores its context;
- shame, fear, exposure, or coercion is the primary behavior-change mechanism.

# Final checks

- Is Christ the center rather than self-optimization?
- Is obedience a response to grace rather than payment for acceptance?
- Is the content true, clear, age-appropriate and actionable?
- Can a teacher distinguish doctrine from adjustable household practice?
