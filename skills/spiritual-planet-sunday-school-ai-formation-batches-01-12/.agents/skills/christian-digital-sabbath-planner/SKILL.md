---
name: christian-digital-sabbath-planner
description: "Build Spiritual Planet’s adult digital-Sabbath planner with timezones, one-time/weekly/monthly cadence, Lord’s Day configuration, emergency and accessibility exceptions, replacement practices, preparation, re-entry reflection, privacy, and tests. Use for voluntary digital rest; do not universalize one Sabbath rule."
---

# Required resources

Read:

- `references/digital-rule-of-life-policy.md`
- `references/scripture-and-theology-notes.md`
- `schemas/digital-sabbath-plan.schema.json`
- `assets/practice-catalog.seed.yaml`

# Goal

Help adults create recurring space for worship, rest, relationships, creation and service by temporarily setting aside nonessential digital inputs.

# Workflow

1. Inspect schedule, timezone, notification and calendar abstractions.
2. Implement `DigitalSabbathPlanV1`.
3. Offer a gentle starting option of 60–120 minutes before half-day or full-day options.
4. Let the learner choose one-time, weekly, monthly or custom cadence.
5. Let church configuration determine whether the practice is integrated with the Lord’s Day, separate or unspecified.
6. Require allowed exceptions and emergency access planning.
7. Require at least one replacement practice; never leave a content vacuum as the entire plan.
8. Add preparation steps and a brief re-entry reflection.
9. Do not create a streak or punish a missed period.
10. Store the plan, not device activity detail.

# Theology boundary

Digital Sabbath is `PASTORAL_WISDOM` or `PRODUCT_DEFAULT`. It can embody biblical principles of rest and attention, but the product must not declare a duration, device list or weekday to be the universal divine requirement.

# Accessibility and care

A user may need a device for communication, assistive technology, medical support, navigation, caregiving, church service or on-call work. Preserve those uses without guilt copy.

# Tests

Cover timezone behavior, DST-safe schedule handling where the host stack supports it, cadence, emergency exception, assistive-device exception, Lord’s Day configuration, missed occurrence, pause/resume, privacy, no monitoring by default, keyboard and mobile flows.

# Definition of done

The learner can plan meaningful digital rest without losing emergency access, violating church configuration or being placed under a universalized product rule.
