---
name: christian-digital-rule-of-life
description: "Design and implement an editable, voluntary Christian digital Rule of Life with daily and weekly boundaries, exceptions, accountability scope, pause/review states, and anti-legalism safeguards. Use for rule-of-life features, not universal device commandments."
---

# Required resources

Read:

- `references/digital-rule-of-life-policy.md`
- `references/progress-and-privacy-policy.md`
- `schemas/digital-rule-of-life.schema.json`
- `assets/practice-catalog.seed.yaml`

# Purpose

Translate formation goals into a simple, editable pattern for mornings, meals, work, evening, bedroom, weekly rest and online speech. A Rule of Life is a servant of love and faithfulness, not a test of salvation or a mechanism for another person to control an adult.

# Authoring flow

1. Start with desired fruits and a grace reminder.
2. Select no more than a few high-leverage boundaries.
3. Add practices from the reviewed catalog.
4. Enable the minimum version for every practice.
5. Configure real-life exceptions.
6. Optionally choose revocable accountability and exact share scope.
7. Preview the weekly load.
8. Let the user edit, decline or save as draft.
9. Activate only after voluntary confirmation.

# Boundary rules

Support these domains:

- first input after waking;
- device-free meal or relational presence;
- single-task or notification windows;
- evening shutdown;
- bedroom device posture;
- weekly digital rest;
- online speech delay and fact checking.

Concrete defaults such as 15 minutes, 30 minutes, another room, or two hours are `PRODUCT_DEFAULT`. They must be editable and must not be described as universal biblical commands.

# Exceptions

First-class exceptions include:

- emergency;
- on-call work;
- shift work;
- caregiving;
- accessibility;
- travel;
- acute illness;
- church ministry.

An exception is not failure. The UI must allow a temporary exception without breaking a streak, generating shame, or requiring a justification essay.

# Accountability

Accountability must be:

- user-initiated;
- explicit about the recipient relationship;
- limited to plan-only, weekly summary, or user-selected updates;
- revocable;
- off by default.

Never implement covert device control, automatic forwarding of check-ins, or administrator access to private details.

# State machine

```text
draft → active ↔ paused → completed → archived
```

Every transition is idempotent. Pausing preserves data. Completing ends reminders. Archiving removes the rule from active views without changing historical audit requirements.

# Anti-legalism checks

Before saving, verify:

- grace reminder is present;
- rules are framed as wisdom/defaults where appropriate;
- no self-harm, sleep deprivation or punitive fasting;
- no rule equates completion with holiness;
- no rule removes necessary responsibilities;
- plan is realistically sustainable;
- the user can pause or simplify.

# Tests

Include:

- Schema valid/invalid cases;
- voluntary consent required;
- covert monitoring always false;
- exceptions preserved;
- no more than allowed practices;
- state transition idempotency;
- user can decline a recommendation;
- shared scope never exceeds consent;
- no unapproved practice can be activated in production;
- export and deletion behavior.

# Definition of done

The user owns a simple, voluntary, editable and reviewable rule that protects love, worship, work, rest and relationships without turning product defaults into divine law.
