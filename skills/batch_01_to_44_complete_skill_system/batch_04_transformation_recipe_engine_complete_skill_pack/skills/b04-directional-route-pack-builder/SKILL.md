---
name: b04-directional-route-pack-builder
description: "把“Java→C#”细化为精确源目标版本、框架、运行时和工作负载路线。 Use for Batch 04 route-pack implementation, review, or validation. Use when implementing, reviewing, or validating Batch 04."
---

# b04-directional-route-pack-builder

## Objective

把“Java→C#”细化为精确源目标版本、框架、运行时和工作负载路线。

## Scope

- Batch: `batch-04`
- Capability layer: `route-pack`
- Risk: `critical`
- Parent system: Batch 4：跨语言语义映射、Transformation Rule DSL 与 Deterministic Recipe Engine

## Inputs

- Use exact, authorized, digest-bound upstream snapshots and certificates.
- Record tenant, owner, scope, versions, policies, budgets, and idempotency key.
- Preserve unknown, unsupported, opaque, partial, conflicting, and stale states.

## Outputs

- `directional-route-pack.yaml`
- `route-integration-report.json`
- `route-pack-certificate.json`
- `CompletionReport`

## Workflow

1. Validate scope, authorization, upstream compatibility, schema, and evidence freshness.
2. Create an immutable run identifier, input digest, plan, and bounded execution journal.
3. Execute deterministic steps first; isolate tools, providers, and untrusted inputs.
4. Record evidence, unknowns, failures, approvals, side effects, and rollback receipts.
5. Run independent verification and issue only the strongest evidence-supported state.

## Hard Rules

- Do not treat plans, documentation, model self-assessment, or static checks as runtime success.
- Do not hide unknowns, failures, unsupported semantics, exceptions, or incomplete coverage.
- Agents and providers may propose changes; they cannot self-approve, weaken tests, or release.
- Require explicit human approval and a rehearsed rollback for irreversible actions.
- Bind every high-impact claim to exact scope, snapshot, digest, policy, version, and evidence.

## Required Tests

- Cover the normal path, missing evidence, stale input, cancellation, retry, and rollback.
- Reject cross-tenant access, forged certificates, path escape, secret access, and test deletion.
- Verify deterministic output for the same inputs and stable ordering where applicable.
- Invalidate results when an upstream snapshot, policy, tool, or major schema changes.

## Verification

- Validate schema, compatibility, permissions, evidence digests, producers, and timestamps.
- Exercise negative security, idempotency, timeout, partial-failure, and recovery paths.
- Confirm that changing only a status field cannot raise certification.

## Stop and Escalate

- Stop for missing, expired, revoked, contradictory, or snapshot-mismatched evidence.
- Stop for unknown authority, uncontrolled side effects, cross-tenant access, or data-loss risk.
- Escalate blocking verification failures or results that cannot be reproduced.

## Definition of Done

- Inputs and outputs have versioned contracts and stable digests.
- Execution is bounded, replayable, cancellable, and recoverable where applicable.
- P0 tests pass; critical exceptions are explicit, approved, scoped, and time-limited.
- The completion state does not exceed what actual execution and evidence prove.

## Completion Report

Report files, schemas or migrations, commands and exit codes, tests, evidence, approvals,
rollback path, limitations, unresolved blockers, and the next Batch interface.
