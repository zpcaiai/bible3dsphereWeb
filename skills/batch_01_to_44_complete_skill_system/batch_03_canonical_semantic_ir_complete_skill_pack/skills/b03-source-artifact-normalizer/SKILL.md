---
name: b03-source-artifact-normalizer
description: "建立内容寻址 Raw Artifact Layer，确保后续任何解析都可回到原始字节。 Use for Batch 03 source-intake implementation, review, or validation. Use when implementing, reviewing, or validating Batch 03."
---

# b03-source-artifact-normalizer

## Objective

建立内容寻址 Raw Artifact Layer，确保后续任何解析都可回到原始字节。

## Scope

- Batch: `batch-03`
- Capability layer: `source-intake`
- Risk: `critical`
- Parent system: Batch 3：统一源码摄取、解析前端与 Canonical Semantic IR Foundation

## Inputs

- Use exact, authorized, digest-bound upstream snapshots and certificates.
- Record tenant, owner, scope, versions, policies, budgets, and idempotency key.
- Preserve unknown, unsupported, opaque, partial, conflicting, and stale states.

## Outputs

- `source-artifact-manifest.json`
- `source-blob-index.json`
- `encoding-report.json`
- `unsafe-artifact-register.json`
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
