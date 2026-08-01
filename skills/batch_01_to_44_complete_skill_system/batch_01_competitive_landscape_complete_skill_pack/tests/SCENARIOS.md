# Batch 01 Static and Runtime Scenarios

These scenarios define obligations; package presence does not prove runtime execution.

## P0 static package scenarios

1. All indexed Skills exist and have unique names, required frontmatter, and required sections.
2. Every JSON Schema parses and passes Draft 2020-12 meta-schema validation.
3. Manifest paths remain inside the package and their size and SHA-256 digests match.
4. Missing or stale upstream compatibility evidence blocks certification.

## P0 safety scenarios

1. Reject cross-tenant access, forged evidence, path traversal, and secret disclosure.
2. Reject any Agent attempt to modify tests, policy, certificates, or approval records.
3. Preserve unknown, unsupported, partial, conflicting, stale, and revoked states.
4. Require approval and a rollback receipt before irreversible effects.

## Runtime obligations

1. Execute the representative Batch 1：竞争格局、产品定位与持续竞争情报 happy path and retain replayable evidence.
2. Exercise timeout, cancellation, duplicate delivery, partial failure, and recovery.
3. Compare deterministic output digests across supported worker counts when applicable.
4. Invalidate certificates after snapshot, tool, policy, or major schema changes.

Runtime obligations remain `NOT_RUN` until executed in an authorized target environment.
