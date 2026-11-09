# 10 — E0–E5 Assurance

## E0 — Prototype

Evidence:
- one avatar can load;
- one scripted phrase can speak;
- one LiveKit room can connect.

Not shippable.

## E1 — Functional

Evidence:
- end-to-end voice question and avatar answer;
- structured response contract;
- basic Bible retrieval;
- basic failure handling.

## E2 — Grounded

Evidence:
- verse resolver validation;
- Truth Set for each character;
- G0 unsupported behavior fails closed;
- persona/character mismatch tests;
- vendor secrets not exposed.

## E3 — Production-ready

Evidence:
- SLO monitoring;
- reconnect/retry strategy;
- content/asset review workflow;
- adversarial prompt suite;
- privacy/retention documented;
- graceful degradation;
- CI validation.

Minimum for public production.

## E4 — Auditable / Scaled

Evidence:
- traceability from answer claims to evidence;
- versioned character/persona/assets;
- release gates and rollback;
- sampled human review;
- multi-character regression suite;
- load/latency testing on target concurrency;
- vendor outage drills.

Recommended target for Spiritual Planet v1.x.

## E5 — High-assurance Knowledge Experience

Evidence:
- reproducible release evidence bundle;
- mutation tests for citation/grounding logic;
- red-team corpus;
- independent domain review process;
- automatic detection of evidence drift/content version drift;
- signed/versioned approved character packages;
- statistically monitored quality thresholds;
- documented incident response and correction propagation.

E5 does not mean “AI cannot be wrong”; it means errors are actively constrained, detected, traceable and repairable.
