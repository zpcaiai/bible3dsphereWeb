---
name: christian-formation-plan-engine
description: "Generate explainable, editable 7/14/30/90-day Christian formation plans from the adult attention baseline and reviewed practice catalog, enforcing max-three active practices, minimum versions, safety gates, and no spiritual scoring."
---

# Required resources

Read:

- `references/formation-plan-policy.md`
- `references/progress-and-privacy-policy.md`
- `references/api-persistence-blueprint.md`
- `schemas/formation-plan.schema.json`
- `schemas/practice-definition.schema.json`
- `schemas/practice-checkin.schema.json`
- `schemas/formation-review.schema.json`
- `assets/formation-plan-templates.seed.yaml`
- `assets/practice-catalog.seed.yaml`

# Goal

Create a small, explainable plan that a user can edit or reject. The engine supports formation; it does not automate sanctification or calculate holiness.

# Inputs

- validated `AttentionBaselineV1`;
- user-selected horizon: 7, 14, 30, or 90 days;
- reviewed practice catalog;
- life constraints and exceptions;
- Batch 01 safety decision;
- optional user-selected practice preferences.

# Hard invariants

- S3: no ordinary plan; interrupt.
- S2: no intensified plan; offer support and, when appropriate, a gentle optional practice.
- maximum three active practices per phase;
- every item has reason codes;
- every item has minimum version and fallback;
- `requiresHealthReview=true` is never auto-selected;
- only approved practices may be activated in production;
- plan is editable and voluntarily accepted;
- no maturity, salvation or holiness score;
- no recommendation based only on total screen minutes.

# Selection policy

Prefer a balanced plan:

- one attention / prayer / Scripture anchor;
- one device or embodied boundary;
- one relational, delay, speech or rest practice when justified.

Do not force one item from every category. Use the smallest set that addresses the highest-impact patterns and desired fruits.

Tie-breaking priority:

1. user-selected practice;
2. safety and basic responsibilities;
3. sleep and high-leverage morning/evening boundary;
4. desired fruit;
5. existing strength that can support success;
6. template default.

# Plan horizons

- **7 days:** observe and protect; one or two practices.
- **14 days:** attention reset; up to three practices.
- **30 days:** first Rule of Life; up to three practices.
- **90 days:** phased plan; no more than three active in a phase, with review before phase transition.

# Explainability

Return:

- selected practice IDs;
- reason codes;
- template ID and version;
- why a health-review practice was excluded;
- user-editable schedule;
- minimum version;
- fallback;
- next review date.

Do not return opaque confidence percentages about the user’s soul or diagnosis.

# Adaptation

The user can:

- remove any item;
- replace it with another approved practice;
- shorten duration;
- change frequency;
- add exceptions;
- pause;
- cancel;
- choose manual mode.

Revalidate all invariants after editing.

# Tests

Add deterministic and property-style tests:

- horizons only 7/14/30/90;
- active item count never exceeds three;
- no health-review auto-selection;
- S3 returns no plan;
- unapproved content excluded;
- reason codes always present;
- minimum and fallback always present;
- patterns and desired fruits influence selection;
- screen minutes alone do not determine severity;
- user edits are preserved and revalidated;
- same input and rules version produces stable output when deterministic mode is used.

# Definition of done

The plan is small, safe, transparent, editable and executable, and the engine’s behavior is testable without making theological or clinical claims.
