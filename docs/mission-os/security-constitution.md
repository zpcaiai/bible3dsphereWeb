# Security Constitution

Mission data is classified as public, internal, confidential, sensitive, or highly sensitive. Calling narratives, religion, health, family risk, minors, precise locations, legal status, local contacts, and incidents require the minimum necessary collection and access.

All tenant business records carry a tenant identifier and are protected server-side. PostgreSQL RLS is required for sensitive tables before production use; UI hiding is not authorization. Field-level redaction separates public, participant, mentor, safeguarding, auditor, and export views. Sensitive exports, impersonation, and break-glass access require recent secondary authentication, a reason, approval where configured, immutable audit, expiry, and post-access review.

Audit records identify actor, action, resource, result, request, and changed field names without storing secret values or sensitive narrative text. AI prompts, logs, traces, events, and errors use redacted summaries or reference identifiers. Tokens, documents, exact locations, local contacts, and private narratives never enter ordinary logs.

L2 and L3 events create human work immediately. L3 bypasses normal queues. Break-glass is limited to life safety, is time-bound, alerts the safeguarding owner, and creates an after-action review. Every security incident receives containment, evidence preservation, notification assessment, remediation, and retrospective review.
