# Architecture Decision Records (Condensed)

## ADR-001: LiveSpeak is not the Bible chatbot

**Decision:** Domain AI generates and verifies the answer; LiveSpeak only renders/speaks approved text.

**Why:** Prevent vendor chatbot mode from bypassing scripture grounding and theology policy.

## ADR-002: V1 uses text → LiveSpeak TTS

**Decision:** LiveKit captures user voice; agent yields approved text; LiveSpeak performs TTS/lipsync.

**Why:** Clear ownership, simpler verification, avoids assuming `raw_stream` provides desired full-duplex output semantics.

## ADR-003: Start half-duplex

**Decision:** Initial conversational behavior constrains/queues interruption while avatar speaks.

**Why:** Do not promise human-like barge-in until avatar audio can be reliably stopped/resumed.

## ADR-004: PostgreSQL relations before Neo4j

**Decision:** Use relational graph tables initially.

**Why:** 12–hundreds of Bible characters/relationships do not by themselves require a dedicated graph database; add one when query complexity/scale warrants it.
