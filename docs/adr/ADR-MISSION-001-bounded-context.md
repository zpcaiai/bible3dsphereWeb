# ADR-MISSION-001: Mission OS is a bounded context

Status: Accepted

Mission OS owns mission-lifecycle aggregates and integrates with Identity, Formation, Crisis, Content, Notification, and Analytics through ports and versioned events. It does not duplicate their entities or write their tables.
