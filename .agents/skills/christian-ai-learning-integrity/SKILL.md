---
name: christian-ai-learning-integrity
description: "Design or implement Spiritual Planet’s AI learning-integrity workflow for Sunday School and education. Use for assignment-policy discovery, first-attempt requirements, allowed AI roles, source verification, learner transformations, disclosure, teacher visibility, authorship responsibility, prohibited unaided-work claims, privacy, and tests."
---


# Goal

Allow AI to teach, question and critique without erasing the cognitive work, authorship and honesty that the assignment is meant to form.

# Required resources

Read:

- `references/learning-integrity-policy.md`
- `references/verification-and-provenance-policy.md`
- `references/journal-privacy-safety-analytics-policy.md`
- `schemas/ai-learning-integrity-record.schema.json`
- `schemas/ai-use-intent.schema.json`
- `schemas/ai-answer-verification-session.schema.json`
- `assets/ai-use-boundary-matrix.seed.yaml`
- `assets/teacher-facilitation-cards.seed.yaml`

# Workflow

1. Inspect existing course, assignment, submission, teacher policy and student privacy models.
2. Ask whether the assignment policy is known. Import a course policy only from an authorized source; do not infer permissions.
3. When policy is unknown, output `ask_teacher` and provide a concise question. Do not assume AI use is allowed or prohibited.
4. Require a minimal learner first attempt when the task is meant to build reasoning, writing, reading, proof or coding skill.
5. Let the learner select AI roles: explanation, question generation, feedback, editing, translation, coding help or source discovery. Flag answer generation according to policy.
6. Connect factual claims to verification. Require the learner to explain transformations and retain final authorship responsibility.
7. Generate an honest disclosure based on actual recorded roles. Never help evade detectors or falsify process.
8. Store role metadata, verification and disclosure summary only; raw prompts and full generations remain false. Teacher visibility follows explicit course policy or learner consent.

# Invariants

- `finalAuthorshipResponsibility=learner`.
- A polished rewrite does not prove understanding; include oral explanation, worked steps or self-test options.
- Do not treat all AI use as cheating; enforce the actual policy and learning objective.
- Do not expose a student’s unrelated AI history to teachers or parents.

# Tests

Cover policy allowed/prohibited/unknown; first attempt complete/incomplete; each AI role; answer generation; disclosure; unaided-work contradiction; source verification; no detector evasion; raw content non-persistence; teacher visibility; minor data boundary; accessible workflow and idempotent submission.

# Definition of done

Students can use AI transparently while preserving the learning work and truthfulness that the course requires.
