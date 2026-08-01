# Testing and Release Policy — Batch 09

Minimum evidence:

1. schema meta-validation and valid/invalid fixtures;
2. authorization, tenant and ownership isolation;
3. state-machine and idempotency tests;
4. age, safety, privacy and publication gates;
5. analytics denylist tests;
6. mobile, keyboard, screen-reader and reduced-motion tests;
7. content-review and rollback tests;
8. positive, implicit, edge and negative Skill routing evals;
9. migration forward/rollback rehearsal;
10. release notes with known limitations.

A static Skill-package validation is not proof that the real application compiles, migrates, deploys or is pastorally safe in production. Repository-native and human-review evidence is required.
