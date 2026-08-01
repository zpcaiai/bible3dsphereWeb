# Batch 01–44 Complete Application Modernization Skill System

This system combines Batch 01–05 domain-specific skill packs with the standardized Batch 06–44 packs and provides one deterministic audit, validation, and collision-safe installation entrypoint.

## Inventory

- Canonical batches: **44**
- Batch 01–05 child Skills: **120**
- Batch 06–44 child Skills: **624**
- Total child Skills: **744**
- Batch root Skills: **44**
- Total installable Skills: **788**
- Codex interfaces (`agents/openai.yaml`): **788**

Read `BATCH_01_44_ROADMAP.md` first. Each Batch remains an independent, versioned, installable Skill bag with its own compatibility contract, implementation prompt, schemas, policies, tests, manifest and validation boundary.

## Validate the complete system

```bash
./validate.sh
```

The validator checks the Batch 01→44 dependency chain, strict two-field Skill frontmatter,
folder/name alignment, all `agents/openai.yaml` interfaces, required sections, manifest sizes and
digests, checksum coverage, JSON Schemas, YAML documents, Python and shell syntax, and every
package-native validator. When Python `jsonschema` 4.x is available it also runs Draft 2020-12
meta-schema validation; otherwise the report explicitly records `json-parse-only`. It writes
`SYSTEM_AUDIT_REPORT.md` and `SYSTEM_AUDIT_REPORT.json`.

## Install all child Skills

```bash
./install.sh "${CODEX_HOME:-$HOME/.codex}/skills"
```

Installation is preflighted across all 788 destinations and refuses to overwrite an existing Skill.
The 44 Batch orchestrators are installed with their package documents, schemas, policies, examples,
and tests under `references/`; the 744 focused Skills remain independently invocable.

Static package validation is not runtime or production certification. External toolchains, providers, repositories, databases, clouds, customer acceptance, disaster recovery, and production release gates remain `NOT_RUN` / `NOT_CERTIFIED` until their named evidence obligations actually execute.
