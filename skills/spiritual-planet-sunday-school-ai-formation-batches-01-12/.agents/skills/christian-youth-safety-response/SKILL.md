---
name: christian-youth-safety-response
description: "Implement no-blame S2/S3 handling for bullying, grooming, coercion, imagery, extortion, stalking, self-harm and danger."
---

# Goal

Ordinary learning stops when safety requires authorized human action, without product forensics or evidence upload.

# Activation boundary

Use this skill for repository implementation, refactoring, review or testing of the named Batch 08 capability. Do not trigger it for a generic devotional answer, abstract theology discussion or a request that does not change or inspect the Spiritual Planet product.

# Required resources

Read before editing:

- `references/batch08-blueprint.md`
- `references/api-persistence-blueprint.md`
- `references/theology-and-formation-policy.md`
- `references/privacy-safety-analytics-policy.md`
- `references/testing-and-release-policy.md`
- `references/youth-identity-and-doubt-policy.md`
- `references/youth-sexuality-and-ai-companion-safety-policy.md`
- `references/youth-social-media-identity-policy.md`
- `references/youth-ai-academic-integrity-policy.md`
- `references/youth-autonomy-transfer-policy.md`
- `references/youth-mentor-and-leaving-home-policy.md`
- `schemas/youth-formation-context.schema.json`
- `schemas/youth-identity-pressure-map.schema.json`
- `schemas/youth-question-doubt-session.schema.json`
- `schemas/youth-sexuality-safety-decision.schema.json`
- `schemas/youth-social-media-identity-reflection.schema.json`
- `schemas/youth-ai-academic-integrity-record.schema.json`
- `schemas/youth-digital-autonomy-plan.schema.json`
- `schemas/youth-time-money-stewardship-plan.schema.json`
- `schemas/youth-mentor-consent-plan.schema.json`
- `schemas/youth-governance-transfer-milestone.schema.json`
- `schemas/leaving-home-digital-readiness.schema.json`
- `schemas/youth-safety-decision.schema.json`
- `assets/youth-formation-practice-catalog.seed.yaml`
- `assets/youth-formation-curriculum.seed.yaml`
- `assets/youth-formation-scenarios.seed.yaml`
- `assets/youth-autonomy-levels.seed.yaml`
- `assets/leaving-home-readiness-checklist.seed.yaml`
- `assets/analytics-events.example.yaml`

# Implementation workflow

1. Reuse local safeguarding and emergency configuration.
2. Explain confidentiality boundaries.
3. Store category, level and action only.
4. Notify authorized humans idempotently.
5. Never blame, interrogate or request sensitive evidence.

# Data, privacy and integration rules

- Reuse Batch 01–07 identifiers, authority labels, S0–S3 safety routing, content review, RBAC, tenant scoping, deletion/export and analytics allowlists.
- Validate at every trust boundary and reject unknown fields. Persist only the minimum structured data necessary for the user-visible function.
- Do not persist raw sensitive narratives, private messages, hidden browsing history, explicit content or third-party identities merely because the model can process them.
- Keep policy decisions explainable and versioned. Human review requirements cannot be bypassed by model confidence.
- Build mobile, keyboard, screen-reader and reduced-motion behavior using the existing design system.

# Invariants

- 勒索、强迫、未经同意影像、成人不当接触、自伤或即时危险必须进入S2/S3，产品不取证、不责怪。

# Tests

- S3 interruption
- no blame/forensics/evidence
- human owner
- notification audit

# Definition of done

The capability is integrated into the existing module, has versioned contracts and migrations where needed, passes repository-native tests, preserves user agency, and cannot silently violate the listed safety, privacy, age, theological or publication boundaries.
