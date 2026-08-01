---
name: christian-non-outsourcable-capabilities
description: "Design or implement the Christian non-outsourcable-capabilities registry and user flow for Spiritual Planet. Use when defining what AI may assist but cannot perform: prayer, worship, repentance, faith, conscience, covenant, relational repair, embodied care, pastoral accountability, church office, final authorship, final decision, and crisis help."
---


# Goal

Represent a nuanced “assist but do not substitute” boundary and translate it into concrete human actions. Avoid both technology rejection and the fiction that a generated text performs a person’s spiritual or relational act.

# Required resources

Read:

- `references/non-outsourcable-capabilities-policy.md`
- `references/ai-authority-and-idolatry-policy.md`
- `references/spiritual-content-boundaries-policy.md`
- `schemas/non-outsourcable-capability.schema.json`
- `schemas/ai-authority-boundary-decision.schema.json`
- `assets/ai-discernment-practice-catalog.seed.yaml`
- `assets/teacher-facilitation-cards.seed.yaml`

# Workflow

1. Inspect Batch 01 content review and Batch 02 Practice Catalog conventions.
2. Implement a versioned capability registry using the schema. Seed all required categories with authority and review labels.
3. For each capability render three columns: permitted AI support, required human action, prohibited substitution.
4. Create contextual handoffs from AI-use intents. Example: a prayer draft may proceed, but the flow ends with a screen-free personal prayer action; an apology draft proceeds only with direct listening and repair.
5. Do not collect the content of confession, trauma, sexuality, third-party identity or private pastoral narratives. Store only the selected capability and completion preference when necessary.
6. Major decisions recommend family, teacher, pastor, elder or licensed professional according to context. Crisis help invokes Batch 01 safety.
7. Teacher mode uses scenarios and facilitation cards, not learner surveillance.

# Theological/product invariants

- `aiMayPerformHumanAct=false` for every registry item.
- “Non-outsourcable” does not mean AI cannot provide vocabulary, questions, organization or accessibility support.
- Product completion does not prove the human act occurred or measure sincerity.
- Do not turn church office or pastoral accountability into an AI credential.
- Do not use the boundary to force contact with an unsafe person; abuse and danger use safety policy.

# Tests

Cover registry completeness; review status; prayer, repentance, relational repair, authorship, final decision, embodied care, church office and crisis examples; no private confession persistence; safe-person alternatives; no completion-based spirituality score; voluntary skip; teacher access boundary; accessibility and localization.

# Definition of done

Learners understand where AI assistance ends and can name the real human, embodied, ecclesial or accountable action that remains theirs.
