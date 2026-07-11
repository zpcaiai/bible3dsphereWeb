# ADR-MISSION-002: Data isolation is enforced server-side and in PostgreSQL

Status: Accepted

Sensitive tenant data requires authenticated membership, least privilege, field-specific DTOs, and RLS. A tenant header or hidden UI control is insufficient authorization.
