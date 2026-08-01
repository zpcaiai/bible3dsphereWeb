---
name: christian-formation-pastoral-safety
description: Design or implement pastoral safety triage, child safeguarding boundaries, crisis interruption, referral UX, privacy controls, and human-review requirements for the Spiritual Planet Christian formation module. Use when content or user input may involve self-harm, abuse, exploitation, severe impairment, or sensitive minor disclosures.
---

# Required resources

Read:

- `references/pastoral-safety-policy.md`
- `schemas/safety-decision.schema.json`

relative to this skill.

# Purpose

Protect users without pretending that an automated formation product is a pastor, clinician, emergency service, investigator, or legal authority.

# Decision model

Classify into:

- `S0`: general education;
- `S1`: pastoral concern;
- `S2`: qualified professional support recommended;
- `S3`: immediate safety or protection concern.

Use the least alarming level justified by available evidence. Do not infer abuse or diagnosis from a single ambiguous phrase. When material ambiguity affects safety, ask one concise, non-leading question or route to human review.

# Required behavior

## S0

Continue the lesson. Offer normal practices.

## S1

Continue only when appropriate. Offer trusted parent/guardian, pastor, mentor, counselor, or accountability support. Avoid shame.

## S2

State product limits. Recommend licensed or qualified support. For minors, include a trusted adult path.

## S3

Interrupt ordinary flow. Present localized urgent help and trusted-adult guidance. Minimize further data collection. Do not deliver a long theological lesson.

# Engineering requirements

- Implement safety decision as a pure, testable policy boundary where possible.
- Keep content rendering separate from risk classification.
- Store reason codes, not raw disclosure text.
- Require human review for configured S2/S3 cases.
- Make jurisdiction-specific reporting behavior configurable and legally reviewed.
- Audit access to sensitive referral records.
- Apply role-based access and tenant isolation.
- Support correction and deletion according to product policy.

# Prohibited implementations

- automatic public reporting to church groups;
- full disclosure transcripts in analytics;
- covert parental access;
- automatic salvation judgments;
- punishment recommendations;
- claiming legal reporting duties without jurisdiction and organizational approval;
- treating prayer as sufficient response to immediate danger.

# Tests

Must include:

- S0 normal completion;
- S1 non-shaming support;
- S2 professional support copy;
- S3 ordinary-flow interruption;
- no sensitive narrative persisted;
- unauthorized teacher cannot access referral;
- analytics payload redaction;
- locale fallback;
- safe failure if hotline or referral configuration is absent.

# Definition of done

Safety behavior is explicit, testable, privacy-minimizing, human-reviewable, and separated from routine spiritual formation scoring.
