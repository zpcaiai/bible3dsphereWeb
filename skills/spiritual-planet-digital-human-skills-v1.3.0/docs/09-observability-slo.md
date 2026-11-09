# 09 — Observability and SLO

## Correlation

Every turn gets:

- `sessionId`
- `turnId`
- `characterId`
- `traceId`

Propagate them through LiveKit, retrieval, LLM, verifier, TTS and avatar events.

## Metrics

### Realtime
- room connect success
- STT latency
- endpoint detection latency
- reconnect count

### AI
- retrieval latency
- answer generation latency
- grounding coverage
- citation validation failures
- unsupported-claim blocks

### Avatar
- GLB load time
- model load failure rate
- TTS first-audio latency
- speak completion rate

### Product
- reference click-through
- follow-up question rate
- user feedback
- character switch success

## V1 targets

- character profile API P95 < 1s
- avatar interactive target < 5s on supported broadband/device tier
- user end-of-turn → answer pipeline begins responding P50 < 2s, P95 < 4s where model/provider latency allows
- scripture citation validity = 100% for released Truth Set
- fabricated citation severity = release blocker
