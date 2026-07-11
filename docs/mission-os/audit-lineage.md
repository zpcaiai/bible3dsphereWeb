# Audit, Break-glass and Data Lineage

Sensitive views and all create, update, delete, approval, export, impersonation, AI review, feature-flag, Outbox replay, and emergency-access actions write immutable audit metadata. Logs contain changed field names rather than values, use a salted IP hash, truncate the user-agent summary, and exclude private narratives and credentials.

Break-glass is limited to platform or safeguarding officers, requires MFA verified within ten minutes, expires after thirty minutes, emits a notification event, and creates a post-access review task in the same transaction. It is not an administrative convenience.

Lineage stores reference edges from a derived resource to its sources and optional Model Run. The authorized API follows edges recursively to a maximum depth of eight so reports, scores, and AI artifacts remain explainable without copying source text into the lineage table.
