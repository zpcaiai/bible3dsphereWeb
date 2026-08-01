# Installation, Upgrade and Rollback

Install by merging `.agents/skills` into the existing repository and merging `AGENTS.md.snippet` intentionally. Do not delete local skills with the same names without review. Implement database changes through the repository migration framework, one dependency-ordered Batch at a time. Keep each Batch behind a feature flag; roll back UI exposure first, then application code, then data only through tested reversible migrations or compatibility adapters. Never discard safety, audit or user-owned data merely to simplify rollback.
