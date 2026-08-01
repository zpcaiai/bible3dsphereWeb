---
name: christian-parent-child-repair
description: "Implement specific ownership, impact acknowledgment, non-demanded forgiveness, consequence repair and follow-up."
---

# Goal

Parents can repair real harm without excuses, role reversal, forced forgiveness or storing the child’s private disclosure.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 05 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch05-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/parent-modeling-policy.md`
- `references/success-anxiety-and-family-idolatry-policy.md`
- `references/authority-grace-consequence-policy.md`
- `references/parent-repair-policy.md`
- `references/child-feedback-and-nonretaliation-policy.md`
- `references/co-parent-governance-policy.md`
- `schemas/parent-formation-mirror.schema.json`
- `schemas/parent-attention-availability-assessment.schema.json`
- `schemas/parent-anxiety-transmission-reflection.schema.json`
- `schemas/success-idol-discernment.schema.json`
- `schemas/parent-child-repair-record.schema.json`
- `schemas/parent-authority-grace-plan.schema.json`
- `schemas/co-parent-governance-agreement.schema.json`
- `schemas/parent-example-practice-plan.schema.json`
- `schemas/child-feedback-invitation.schema.json`
- `schemas/parent-formation-review.schema.json`
- `schemas/parent-safety-escalation-decision.schema.json`
- `assets/parent-formation-practice-catalog.seed.yaml`
- `assets/parent-formation-curriculum.seed.yaml`
- `assets/parent-formation-scenarios.seed.yaml`
- `assets/parent-modeling-rubric.seed.yaml`
- `assets/30-day-parent-example-plan.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Build structured parent-authored repair form.
2. Prohibit conditional apology patterns in templates.
3. Allow child needs-time state without pressure.
4. Support follow-up and behavior-change reminders.
5. Escalate safety concerns outside ordinary repair.

# Data, privacy and integration rules

- Reuse Batch 01–04 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 父母道歉不得要求孩子立即饶恕、安慰父母或承担成人情绪。
- 保护儿童优先于家庭形象；伤害、虐待、强迫或即时危险进入S2/S3流程。

# Tests

- forgiveness not demanded
- child not comforter
- no child narrative
- follow-up idempotency

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
