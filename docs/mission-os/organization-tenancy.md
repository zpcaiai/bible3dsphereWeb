# Mission Organization and Tenancy Model

Mission OS reuses `organizations` and `organization_memberships` as the source of organizational identity and membership. It never creates another Organization or User aggregate. `mission_organization_profiles` adds only mission-specific classification, safeguarding ownership, country, legal name, and data-residency metadata.

Churches, mission agencies, receiving churches, teams, training providers, member-care providers, professional partners, and funding partners collaborate through explicit versionable relationships. Sending and receiving relationships require documented approval and local-leadership decision rights. Cross-organization access is not implied by a relationship; later grants remain purpose-limited and expiring.

Invitations are email-bound, role-specific, expiring, revocable, tenant-scoped, and single-use. The database stores only the token hash. Acceptance checks the signed-in email and creates or updates the existing organization membership. Profile, relationship, and invitation writes require the existing organization `manage_settings` permission, RLS tenant context, audit, and where cross-context work is needed, an Outbox event.
