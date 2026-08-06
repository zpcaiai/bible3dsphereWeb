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
- Unique digest-bound per-Skill handlers: **788 / 788**

Read `BATCH_01_44_ROADMAP.md` first. Each Batch remains an independent, versioned, installable Skill bag with its own compatibility contract, implementation prompt, schemas, policies, tests, manifest and validation boundary.

`ORIGINAL_PAYLOAD_RECOVERY.json` records the source-archive search and the exact unresolved Batch
01–05 provenance boundary. All discovered archive copies are byte-identical and omit the same 227
files; deterministic reconstruction remains explicitly `RECONSTRUCTED_NOT_ORIGINAL` until a source
owner supplies authoritative original bytes. `runtime/original_payload_recovery.py` now provides the
complete recovery path: exact 227-file inventory, source-archive and per-file digest verification,
exact source revision, content-addressed custody receipt, and a digest-pinned external source-provenance
Trust Store approved by internal governance. Staging, exclusive locking, fsync, backups, atomic
replacement, child-path symlink confinement, persistent crash journal, digest-driven restart rollback
and post-commit receipt reconstruction are implemented. Apply remains
`APPLIED_PENDING_VERIFICATION` / `original_payload_recovered=false` until source owner, apply approver
and final verifier are proven to be three distinct organizations and all 227 bytes are independently
verified. Legacy/local exercises cannot set the flag. No authoritative source bundle has been supplied.

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
the event hash chain, all 44 callable domain handlers, all 788 unique per-Skill handlers, signed
Provider-adapter idempotency, and cross-Batch/cross-Skill contract substitution. Full
validation also covers read-only customer snapshot intake, sealed independent Holdout, cutover and
rollback transitions, concurrent one-winner fencing, controlled-clock seven-day protocol validation,
Claim-specific Oracle Holdout, independent assessment import, exact 227-file recovery, symlink/tamper
rejection, process-crash and missing-receipt recovery, and independent post-apply
verification. Full
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
both the exact registered Batch handler and the selected Skill's unique callable handler. It requires
the immutable Batch `domain_contract` plus a `skill_contract` bound to that Skill's source SHA-256,
inputs, outputs, Workflow, tests, stop conditions, risk and effect class. Every Batch capability and
the per-Skill execution role must have successful native-tool and byte-bound raw evidence plus
Claim-specific Oracle assertions. The shared runtime also checks the exact Skill/Claim/executor
binding, tool version and argv digest, Corpus ownership, and environment. Cross-Batch and cross-Skill
contract substitution fails closed, and repository content cannot select a command or handler:

```bash
python3 "$SKILL_RUNTIME" domain-result /absolute/path/to/domain-result.json \
  --evidence-root /absolute/path/to/approved-evidence \
  --output /absolute/path/to/claim-oracle-result.json
```

Record the resulting subject with separate signed Executor and Oracle-Owner attestations, verify it
with a different signed Verifier, then evaluate the exact Skill gate. Output and test Claims require
development/negative/Holdout composition; each Batch root additionally requires signed production
evidence before it can reach `READY_FOR_HUMAN_DECISION`.

For database, Cloud, SCM, compiler, browser and migration-tool side effects, use
`runtime/provider_runtime.py`. It accepts only an operator-signed Adapter Registry with an exact
executable digest, version, argv grammar, typed parameters, environment-reference allowlist, timeout,
effect class and compensation operation. Mutations require a separate Approver; execution is
shell-free, idempotency-keyed, fenced and durably journaled in SQLite WAL. Secrets are injected only
from allowlisted process-environment references and redacted from captured bytes. A timed-out
side effect becomes `UNKNOWN` and cannot be retried as success without reconciliation.

`runtime/production_closure.py` connects those Provider receipts to an authorized customer lifecycle:
read-only customer snapshot metadata, Claim-specific Oracle Holdout, exact versioned Provider API,
account model, Region, Adapter/IaC, identity, least-privilege, state-backend and rollback evidence,
cutover/rollback state machine, Provider-bound raw soak telemetry, signed heartbeat-timeout termination
and externally authorized assessment import.
Customer bytes are verified in place but only counts and digests are persisted; current SQLite records
must match their latest hash-chain event. Production soak requires at least seven real days with
six-hour maximum gaps. The accelerated protocol fixture uses an explicit `controlled-test` clock and
is permanently `engineering-only` with `real_seven_day_elapsed=false`; `soak-status` exposes the exact
heartbeat deadline and `expire-soak` atomically fails an overdue run. Production assessments bind the
exact run, cutover, release and account and require a digest-pinned, organization-independent external
certification Trust Store; all local records retain `certified=false`.
Readiness evaluates one linked Snapshot→Holdout→Result→Cutover→Soak→Assessment chain and emits its
`selected_chain`; unrelated failed history stays immutable and counted but cannot poison a complete
chain. Event-chain or current-record tampering still blocks every decision.

A sealed Holdout is custody evidence only. Production Holdout additionally requires a v2 Actor Trust
Store with organization-level separation, distinct development/Holdout partition IDs, an immutable
Oracle Registry digest, a complete Claim→Oracle/version map and separate predeclared Oracle Owner,
Holdout Executor and Verifier signatures. Production v2
cutover and soak require the exact `oracle_bound=true` passing result for the same tenant, release and
Provider account.

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
