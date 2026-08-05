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
- Callable Batch domain policies covered by executable tests: **44 / 44**

Read `BATCH_01_44_ROADMAP.md` first. Each Batch remains an independent, versioned, installable Skill bag with its own compatibility contract, implementation prompt, schemas, policies, tests, manifest and validation boundary.

`ORIGINAL_PAYLOAD_RECOVERY.json` records the source-archive search and the exact unresolved Batch
01–05 provenance boundary. All discovered archive copies are byte-identical and omit the same 227
files; deterministic reconstruction remains explicitly `RECONSTRUCTED_NOT_ORIGINAL` until a source
owner supplies authoritative original bytes.

## Validate the complete system

```bash
python3 -m pip install -r requirements-validation.txt
./validate.sh
```

The validator checks the Batch 01→44 dependency chain, strict two-field Skill frontmatter,
folder/name alignment, all `agents/openai.yaml` interfaces, required sections, manifest sizes and
digests, checksum coverage, JSON Schemas, YAML documents, Python and shell syntax, every
package-native validator, the immutable Claim/executor registries, and the transactional runtime
test suite. The runtime tests cover Ed25519 role authentication, no-op false-positive rejection,
independent Holdout, production evidence boundaries, source drift, rollback, concurrent idempotency,
the event hash chain, all 44 callable domain handlers, and cross-Batch contract substitution. Full
validation fails closed unless the locked `jsonschema` and `PyYAML`
dependencies are installed; it runs Draft 2020-12 meta-schema validation and parses every YAML
document with `yaml.safe_load`. It writes
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

The native toolchain must emit a typed `domain-execution-result`. The package-owned dispatcher calls
the exact registered Batch handler and requires its immutable `domain_contract`: operation,
capabilities, and safety controls. Every capability must have a successful native-tool record, a
matching byte-bound raw-evidence role, and a Claim-specific Oracle assertion. The shared runtime also
checks the exact Skill/Claim/executor binding, tool version and argv digest, Corpus ownership, and
environment. A Batch 31 result cannot substitute a Batch 33 contract, and repository content cannot
select a command or handler:

```bash
python3 "$SKILL_RUNTIME" domain-result /absolute/path/to/domain-result.json \
  --evidence-root /absolute/path/to/approved-evidence \
  --output /absolute/path/to/claim-oracle-result.json
```

Record the resulting subject with separate signed Executor and Oracle-Owner attestations, verify it
with a different signed Verifier, then evaluate the exact Skill gate. Output and test Claims require
development/negative/Holdout composition; each Batch root additionally requires signed production
evidence before it can reach `READY_FOR_HUMAN_DECISION`.

## Import the real database and Provider vertical slice

The repository-migration E2E runner produces a strict report for PostgreSQL 16→17
`pg_dump`/`pg_restore`, detail reconciliation, checksum-bound expand migration, restore, MinIO S3
put/get/delete/cleanup and authenticated GitHub exact-commit reads. Import that byte-bound report into
the Batch 31 database and Batch 33 Provider Claim-specific Oracles:

```bash
python3 runtime/import_real_toolchain_e2e.py \
  /absolute/path/to/real-toolchain-e2e-report.json \
  --output /absolute/new/import-directory
```

The importer fails closed on cleanup, reconciliation, rollback, idempotency, Provider identity or
Corpus-boundary drift. It materializes development evidence only. It cannot add signatures, mark an
independent Holdout as executed, perform a customer production cutover, or certify the system.

The local runtime and this disposable integration route are implemented and tested. Other external
toolchains, Providers, independently owned Holdout, representative customer workloads, cloud apply,
DR exercises, production operations and certification remain `NOT_RUN` until their exact authorized
executions occur; certification remains `NOT_CERTIFIED`, and every local gate keeps `certified=false`.
