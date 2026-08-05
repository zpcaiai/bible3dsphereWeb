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
- Claim-specific Oracle obligations: **8,149**
- Unique Batch domain-executor handlers: **44**

Read `BATCH_01_44_ROADMAP.md` first. Each Batch remains an independent, versioned, installable Skill bag with its own compatibility contract, implementation prompt, schemas, policies, tests, manifest and validation boundary.

## Validate the complete system

```bash
./validate.sh
```

The validator checks the Batch 01→44 dependency chain, strict two-field Skill frontmatter,
folder/name alignment, all `agents/openai.yaml` interfaces, required sections, manifest sizes and
digests, checksum coverage, JSON Schemas, YAML documents, Python and shell syntax, every
package-native validator, the immutable Claim/executor registries, and the transactional runtime
test suite. The runtime tests cover Ed25519 role authentication, no-op false-positive rejection,
independent Holdout, production evidence boundaries, source drift, rollback, concurrent idempotency,
and the event hash chain. When Python `jsonschema` 4.x is available it also runs Draft 2020-12
meta-schema validation; otherwise the report explicitly records `json-parse-only`. It writes
`SYSTEM_AUDIT_REPORT.md` and `SYSTEM_AUDIT_REPORT.json`.

## Install all child Skills

```bash
./install.sh "${CODEX_HOME:-$HOME/.codex}/skills"
```

Installation is preflighted across all 788 destinations and refuses to overwrite an existing Skill.
The 44 Batch orchestrators are installed with their package documents, schemas, policies, examples,
and tests under `references/`; the 744 focused Skills remain independently invocable. The relocatable
shared runtime is installed at `.batch-01-44-runtime/`.

## Execute and evidence a real Claim

Initialize an immutable source workspace with an operator-managed Actor Trust Store:

```bash
SKILL_RUNTIME="${CODEX_HOME:-$HOME/.codex}/skills/.batch-01-44-runtime/skill_runtime.py"
python3 "$SKILL_RUNTIME" init \
  --source /absolute/path/to/source \
  --workspace /absolute/path/to/evidence-workspace \
  --trust-store /absolute/path/to/actor-trust-store.json
```

The native toolchain must emit a typed `domain-execution-result`. The package-owned Batch handler
checks the exact Skill/Claim/executor binding, tool version and argv digest, Claim-specific Oracle
assertions, Corpus ownership, environment, and raw evidence bytes:

```bash
python3 "$SKILL_RUNTIME" domain-result /absolute/path/to/domain-result.json \
  --evidence-root /absolute/path/to/approved-evidence \
  --output /absolute/path/to/claim-oracle-result.json
```

Record the resulting subject with separate signed Executor and Oracle-Owner attestations, verify it
with a different signed Verifier, then evaluate the exact Skill gate. Output and test Claims require
development/negative/Holdout composition; each Batch root additionally requires signed production
evidence before it can reach `READY_FOR_HUMAN_DECISION`.

The local runtime is implemented and tested, but it does not manufacture an external toolchain,
provider, independent organization, customer, database, cloud, DR exercise, or production operation.
Those executions remain `NOT_RUN`; certification remains `NOT_CERTIFIED`, and every local gate keeps
`certified=false`.
