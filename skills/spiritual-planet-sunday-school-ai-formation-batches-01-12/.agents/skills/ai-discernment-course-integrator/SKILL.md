---
name: ai-discernment-course-integrator
description: "Integrate Batch 03 AI discernment into Spiritual Planet’s Sunday School tab: routes, navigation, course seeds, practice catalog, scenario lab, teacher facilitation, feature flags, permissions, i18n, analytics, accessibility, loading/empty/error/offline states, deep links, content review, and end-to-end tests. Use for UI and module integration, not isolated policy logic."
---


# Goal

Integrate every Batch 03 domain service into one coherent Sunday School learner and teacher experience while reusing the real project’s routes, design system, permissions and review workflow.

# Required resources

Read all files under `references/`, `schemas/`, and `assets/` relative to this skill.

# Workflow

1. Inspect the Batch 01 module shell and Batch 02 adult track before changing navigation. Reuse route guards, layout, content cards, steppers, drawers, evidence tables, forms, error boundaries and test helpers.
2. Add the discernment landing and recommended routes from the blueprint. Preserve deep links, back behavior, feature-flag off behavior and existing tab information architecture.
3. Build an integrated guided flow: intent → boundary → human tasks → verification → Scripture/spiritual review when needed → worldview/media/Socratic tools → journal/review.
4. Register all 44 practices in the existing Practice Catalog and all 10 units/24 lessons in the content system. Seeds are idempotent and non-approved by default.
5. Build the teacher lab with approved scenarios and facilitation cards. Teachers can assign a lesson or scenario and see completion/voluntary summaries permitted by policy, never private journal text or raw AI conversations.
6. Implement role-sensitive navigation for adult, parent, teacher and supervised older teen. Do not expose independent younger-child or secret AI-companion flows.
7. Add loading, empty, partial-verification, offline, provider-unavailable, conflict, safety-interrupted, error and retry states. Retries are idempotent.
8. Use i18n for every user-visible string. Support 320px width, keyboard-only interaction, screen readers, focus management, reduced motion, non-color-only status, readable evidence comparisons and printable teacher materials.
9. Emit only allowlisted analytics. Redact before logs, traces, error monitoring and exports.
10. Add route, component, integration, a11y and E2E tests plus content seed and feature-flag tests.

# UI principles

- Show uncertainty and provenance near the claim, not in a hidden tooltip.
- Show “AI may assist / human must retain” side by side.
- Do not display spiritual scores, red/green holiness grades, surveillance dashboards or attention streak penalties.
- Keep Scripture quote labels and translation visible.
- Use plain language and expandable theological detail.

# Tests

Cover every route, role and feature flag; guided branching; provider unavailable; conflict evidence; Scripture mismatch; prohibited spiritual authority; course/scenario assignment; private journal denial; mobile/keyboard/screen-reader/reduced-motion; localization; offline resume; seed idempotency; migration rollback and analytics redaction.

# Definition of done

Batch 03 feels like a native extension of Spiritual Planet, not a collection of detached forms, and every pathway preserves truth, privacy, human agency and pastoral accountability.
