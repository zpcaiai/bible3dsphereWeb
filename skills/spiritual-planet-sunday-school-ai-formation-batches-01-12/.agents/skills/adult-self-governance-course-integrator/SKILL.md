---
name: adult-self-governance-course-integrator
description: "Integrate Spiritual Planet Batch 02 adult self-governance into the existing Sunday School AI-formation module: routes, landing, lessons, assessment, plans, practices, check-ins, review, Rule of Life, digital Sabbath, feature flags, permissions, i18n, analytics, accessibility, content review, and e2e tests. Use for product integration, not isolated theology writing."
---

# Required resources

Read:

- `references/batch02-blueprint.md`
- `references/progress-and-privacy-policy.md`
- all files under `schemas/`
- all files under `assets/`

Also read the Batch 01 module integration and theology skills.

# Integration targets

Use or adapt these routes:

```text
/sunday-school/ai-formation/adult
/sunday-school/ai-formation/adult/assessment
/sunday-school/ai-formation/adult/priorities
/sunday-school/ai-formation/adult/plan
/sunday-school/ai-formation/adult/practices
/sunday-school/ai-formation/adult/check-in
/sunday-school/ai-formation/adult/review
/sunday-school/ai-formation/adult/rule-of-life
/sunday-school/ai-formation/adult/digital-sabbath
```

# Workflow

1. Inspect existing navigation, page shell, loader, data-fetching, form, i18n, analytics and test conventions.
2. Reuse the Batch 01 adult track card and deep-link contract.
3. Add a feature flag such as `sundaySchoolAiFormationAdultSelfGovernance` using the repository’s existing mechanism.
4. Protect learner data by auth, ownership and tenant scope.
5. Gate content by review status; learners see only approved content.
6. Build clear loading, empty, error, retry and offline states.
7. Preserve back navigation and draft state without leaking answers.
8. Make the assessment optional.
9. Make every plan recommendation editable before activation.
10. Provide pause, delete and export actions in settings or plan UI.
11. Integrate shared analytics events without sensitive properties.
12. Add teacher preview only where permission exists; teacher preview must not reveal learner private records.

# Accessibility

- keyboard completion for all steppers and dialogs;
- visible focus;
- semantic headings and fieldsets;
- accessible error summaries;
- no meaning conveyed only by color;
- reduced-motion support;
- screen-reader announcement for saved, paused and safety-interrupted states;
- 320px mobile support;
- adequate touch targets.

# E2E scenarios

1. Enter adult track and skip assessment.
2. Complete assessment with ephemeral answers and choose priorities.
3. Generate a 7-day plan, replace a practice and activate.
4. Submit a partial check-in offline, retry once and avoid duplicate.
5. Simplify after repeated fatigue.
6. Create and pause a Digital Rule of Life.
7. Create a digital Sabbath with emergency exception.
8. Reject food fasting when the safety answer is uncertain.
9. Trigger S3 and interrupt the ordinary lesson.
10. Verify another user and another tenant cannot read the plan.

# Definition of done

Batch 02 feels like one native part of the existing Sunday School module, not a separate app, and all sensitive formation data remains private by default.
