---
name: christian-formation-context-intake
description: Build a privacy-minimizing, age-aware learner and family intake for the AI-age Christian formation Sunday School module; collect only context needed to choose tracks, lessons, practices, and safety handling. Do not use for broad profiling or covert surveillance.
---

# Required schema

Read `schemas/learner-context.schema.json` relative to this skill.

# Goal

Create progressive disclosure that selects suitable content without turning intake into a spiritual examination, diagnosis, or parental surveillance system.

# Required inputs

Collect only:

- role;
- age band;
- locale;
- one or more learning goals;
- high-level church context;
- high-level device context;
- accessibility needs;
- consent flags.

Optional later-Batch fields must remain disabled unless a concrete feature uses them.

# UX sequence

1. Ask role.
2. Ask age band.
3. Ask concrete learning goals.
4. Ask accessibility or format needs.
5. Explain data minimization.
6. For minors, require the configured guardian/organization consent path.
7. Validate and generate `LearnerContextV1`.
8. Recommend one primary track and at most two secondary next steps.

# Recommendation rules

- Adult + attention/body/digital habits → adult self-governance.
- Parent/guardian + family liturgy/modeling → parent family discipleship.
- Minor age band → corresponding child/youth path.
- Teacher/pastor → teacher and pastoral support.
- Do not infer beliefs, diagnosis, sexuality, family conflict, or abuse from role and goals.

# Copy requirements

- Use non-shaming language.
- Explain why each question is needed.
- Always offer “prefer not to say” where the schema allows it.
- Do not ask a child to disclose secrets in intake.
- Do not promise confidentiality that the product cannot guarantee.
- For sensitive issues, offer a safe route to a trusted adult or qualified support.

# Outputs

- validated learner context;
- track recommendation;
- reason codes;
- consent state;
- next screen route;
- no raw free-text narrative in Batch 01.

# Tests

Cover:

- every role and age band;
- keyboard-only completion;
- screen-reader labels and errors;
- minor consent branches;
- back navigation without data corruption;
- locale switching;
- no analytics event containing sensitive answers;
- no recommendation based on unsupported inference.
