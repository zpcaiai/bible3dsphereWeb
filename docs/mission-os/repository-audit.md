# Repository Audit

## Architecture observed

The product is not a Next.js monorepo. `bible3dsphereWeb` is a React 18, Vite, JavaScript PWA deployed independently. `bible3dsphere` is a Python FastAPI service with PostgreSQL migrations and pytest. Public APIs connect the repositories.

Authentication and organization membership already exist in the backend and should be adapted. Formation, habits, discipleship, crisis guidance, content, notifications, internationalization, and PWA behavior already exist at different maturity levels and must not be recreated. The current MissionBridge work adds voluntary consent, versioned pilot programs, enrollment, check-ins, policy acknowledgement, incidents, role checks, and audit records.

## Confirmed gaps against Batch 0

There is no confirmed general-purpose Mission OS feature-flag evaluator, transactional outbox with idempotent consumers and dead-letter handling, data-lineage store, complete RLS policy set, strong break-glass workflow, complete incident state machine, or Batch 0 gate. Existing audit and event capabilities require adapters or consolidation. Items not verified by executable evidence remain `unknown`, not `existing`.

## Repository boundary

Frontend changes remain in this repository; migrations, routers, workers, and backend tests remain in `../bible3dsphere`. Releases and rollbacks are independent per repository.
