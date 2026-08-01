---
name: sunday-school-tab-module-integrator
description: Integrate the “AI时代心意更新与家庭门训” feature into Spiritual Planet’s existing Sunday School Tab, routes, navigation, permissions, feature flags, i18n, analytics, responsive UI, accessibility, and tests. Use for product integration, not for authoring theology.
---

# Required resources

Read:

- `references/module-blueprint.md`
- `assets/module-manifest.example.yaml`
- `schemas/module-contract.schema.json`

relative to this skill.

# Integration rules

1. Inspect the existing Sunday School Tab and follow its registration pattern.
2. Add module ID `sunday_school.ai_formation`.
3. Add route `/sunday-school/ai-formation`.
4. Reuse existing card, page shell, breadcrumb, tabs, button, skeleton, empty, error, and retry primitives.
5. Gate availability with `sundaySchoolAiFormation`.
6. Gate teacher management with `sunday_school.ai_formation.manage`.
7. Add i18n keys; no user-visible strings buried in logic.
8. Add analytics under `sunday_school.ai_formation`.
9. Preserve tenant/church scoping.
10. Do not expose draft or unapproved content to learners.

# Landing-page information architecture

Render:

- title and summary;
- “为什么需要这个模块”;
- four track cards;
- theology and safety note;
- primary learner CTA;
- teacher CTA when authorized;
- last-progress continuation when available;
- no-data first-run experience.

# Track cards

Use stable IDs:

- `adult_self_governance`
- `parent_family_discipleship`
- `child_youth_formation`
- `teacher_pastoral_support`

Each card needs:

- localized title;
- one-sentence outcome;
- audience;
- status;
- accessible action label.

# States

Implement and test:

- loading;
- empty/no published courses;
- recoverable API error;
- authorization denied;
- feature flag disabled;
- offline or degraded state when the product supports it.

# Accessibility

- semantic heading order;
- keyboard navigation;
- visible focus;
- accessible card/action names;
- sufficient touch targets;
- status not conveyed by color alone;
- reduced-motion compliance;
- mobile reflow without horizontal scrolling.

# Analytics events

At minimum:

- `module_card_viewed`
- `module_opened`
- `track_selected`
- `teacher_console_opened`
- `module_load_failed`
- `module_retry_clicked`

Do not include raw reflections, sensitive intake, minor disclosures, or safety narratives.

# Acceptance tests

- module appears in correct Tab and order;
- deep link works;
- four cards render;
- feature flag off hides entry and blocks route;
- unauthorized teacher CTA is hidden or disabled according to product convention;
- keyboard can reach every action;
- screen-reader names are meaningful;
- 320px-width view remains usable;
- retry recovers from a simulated transient error;
- unapproved content is not rendered.
