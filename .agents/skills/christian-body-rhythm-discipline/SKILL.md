---
name: christian-body-rhythm-discipline
description: "Implement adult body-rhythm formation for Spiritual Planet: sleep, wind-down, rest, movement, outdoors, meal rhythm, non-food fasting, restricted food fasting, health-safe gating, non-shaming content, plans, check-ins, and tests. Use for bodily discipline; never prescribe sleep deprivation, weight loss, extreme exercise, or unsafe fasting."
---

# Required resources

Read:

- `references/body-rhythm-and-fasting-policy.md`
- `references/scripture-and-theology-notes.md`
- `schemas/body-rhythm-plan.schema.json`
- `schemas/practice-definition.schema.json`
- `assets/practice-catalog.seed.yaml`

# Goal

Help adults receive bodily limits as part of creaturely discipleship and establish rhythms that support prayer, relationships, work, rest and service.

# Workflow

1. Inspect health-data, consent and plan abstractions.
2. Implement `BodyRhythmPlanV1` and relevant practice definitions.
3. Offer sleep window, wind-down, rest, movement, outdoors and meal-rhythm practices without medical claims.
4. Do not collect weight, calorie or body-image metrics.
5. Do not interpret fatigue as spiritual weakness.
6. Make all targets editable and responsive to shift work, disability, illness, caregiving and professional advice.
7. Default fasting options to non-food fasts.
8. Before any food-fasting component, require adult confirmation and the minimal safety attestation.
9. If the answer is uncertain, barrier-present or prefer-not-to-say, hide food fasting and offer non-food alternatives.
10. Do not store the reason or medical detail.
11. Surface stop conditions and invoke safety/professional support when appropriate.
12. Add tests for every restricted branch.

# Content rules

- Body is good and finite.
- Rest is not automatically laziness.
- Discipline is not punishment.
- Fasting is not a transaction with God.
- More hunger, less sleep or more pain are not maturity indicators.
- Professional advice overrides the generated plan.

# Tests

Cover shift-work adaptation, illness pause, accessibility, no weight/calorie fields, minor rejection, food-fasting eligibility, uncertain-to-non-food fallback, sensitive details not stored, stop condition, plan pause, S2/S3 handoff, a11y and mobile.

# Definition of done

The product supports sustainable bodily rhythms while refusing medically presumptive, punitive or body-shaming behavior.
