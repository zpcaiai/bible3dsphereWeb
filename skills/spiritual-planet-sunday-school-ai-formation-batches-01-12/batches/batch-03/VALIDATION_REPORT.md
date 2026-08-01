# Batch 03 Validation Report

Date: 2026-07-31

## Static package validation

Command:

```bash
node scripts/validate-batch03.mjs
```

Result:

```text
Batch 03 static validation passed.
Validated 12 skills, 43 shared resources, 13 schemas, 44 practices,
10 units / 24 lessons, 12 scenarios, 16 boundary entries,
60 routing evals and 24 behavior cases.
```

## Extended format validation

- All 13 JSON Schema files passed Draft 2020-12 meta-schema validation through `jsonschema`.
- All 7 YAML asset files parsed successfully through PyYAML.
- Every Skill has YAML front matter, a JSON-quoted description, `agents/openai.yaml`, declared local resources and an explicit `$skill-name` default prompt.
- Curriculum practice references resolve to known practice IDs.
- Privacy, human-responsibility, no-divine-revelation, no-auto-publish, anti-coercion and no-spiritual-scoring invariants are checked by the deterministic validator.

## Scope limitation

This report validates the Skill package itself. It does not claim that Batch 03 has already compiled or passed migrations, security tests, browser E2E, accessibility tests or deployment checks inside the actual Spiritual Planet repository. Codex must run the repository-native commands after integration and report their real results.
