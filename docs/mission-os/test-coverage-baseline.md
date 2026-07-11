# Test Coverage Baseline

Confirmed checks include FastAPI route-contract tests for the MissionBridge MVP, frontend component tests for voluntary consent and safety reporting, and a successful Vite production build. The component suite currently fails because its API mock omits the newer policy endpoint.

Missing Batch 0 evidence includes repository tests against PostgreSQL, migration up/down smoke tests, RLS tenant-crossing tests, feature-flag priority and emergency-off tests, outbox transaction and idempotency tests, audit redaction tests, incident transition and L3 dual-review tests, minor-access tests using authenticated roles, and a browser path covering the Mission subtab.

The baseline is therefore `NOT READY FOR BATCH 1` until all P0 and P1 rows in the debt register have executable passing evidence.
