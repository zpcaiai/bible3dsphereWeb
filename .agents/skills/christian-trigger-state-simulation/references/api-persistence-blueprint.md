# API and Persistence Blueprint — Batch 10

## Principles

- Use the repository's existing transport and ORM conventions.
- Validate request and response payloads against the supplied JSON Schemas.
- Add `tenant_id`, owner identifiers, version, review state, timestamps and soft-delete fields only where the existing repository standard requires them.
- Enforce tenant and owner filters in the query layer, not only in UI.
- Prefer structured categorical signals over free-text narratives.
- Encrypt or tokenize supporter/contact references using the existing secret-management boundary.
- Provide export and deletion for user-owned records; preserve only legally required audit evidence with documented retention.
- Do not place S2/S3 narrative details in analytics, traces, model logs or error messages.

## Suggested endpoint families

- `/api/sunday-school/ai-formation/batch-10/...`
- `/api/sunday-school/ai-formation/content-review/...`
- `/api/sunday-school/ai-formation/safety/...`
- `/api/sunday-school/ai-formation/export/...`

Endpoint names are illustrative. Codex must map them to the real repository conventions.

## Concurrency and idempotency

- Use idempotency keys for seeds, covenant/signature writes, publication transitions and safety escalations.
- Use optimistic concurrency or repository-standard revision fields for learner-edited plans.
- Reject stale writes with a recoverable conflict state.
- Never let retries duplicate notifications, audit events or safety handoffs.
