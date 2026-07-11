# Version Governance

Mission OS independently versions its PostgreSQL schema, `/api/v1/mission` API, prompt definitions, program definitions, policies, and field-data snapshots. Schema versions are immutable numbered SQL migrations. Public API changes remain backward compatible within v1. Prompt, program, policy, and snapshot records carry immutable semantic versions or content hashes; an active pointer may advance only through an audited operation.

Production enables no high-risk capability from code defaults. `MISSION_OS_ENABLED`, `MISSION_AI_ENABLED`, and database overrides are all required where applicable. `MISSION_EMERGENCY_OFF=true` overrides every database value immediately. Expired overrides are ignored. Frontend flags improve the experience but never grant permission.
