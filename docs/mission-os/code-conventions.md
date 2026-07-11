# Mission OS Code Conventions

The current split repositories remain intact. Backend domain code is framework-free under `backend/mission_os`; FastAPI routers and PostgreSQL implementations adapt its contracts. Frontend code uses only public API contracts under `src/features/mission-os/contracts`.

Aggregates are singular PascalCase, tables are plural snake_case, commands use imperative names, queries have no side effects, and events use past-tense facts. Sensitive and public DTOs are separate. Mission endpoints use `/api/v1/mission`; the legacy `/api/mission-bridge` surface remains an adapter during migration.

Times are stored as UTC `TIMESTAMPTZ`, transported as ISO 8601 with an offset, and displayed in the user's configured timezone. Naive datetimes are invalid for events. List endpoints use bounded pagination and explicit filter and sort allowlists.

Structured operational logs contain request, trace, tenant, actor, action, resource, and result identifiers. They never contain faith narratives, mental-health text, passport or permit data, precise locations, local contacts, tokens, or document bodies.
