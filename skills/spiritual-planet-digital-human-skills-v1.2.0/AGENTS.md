# Repository Agent Rules

These rules apply to coding agents working on the Spiritual Planet digital-human module.

## Architecture

- Keep Avatar, Realtime, AI/Knowledge, and Domain Guardrails as separate boundaries.
- Frontend talks to `DigitalHumanAdapter`, never directly to vendor-specific implementation outside adapter modules.
- The LLM never sends arbitrary text straight to LiveSpeak. It must pass structured response validation and grounding gates.
- Use `characterId` as the canonical join key across graph, assets, persona, voice and analytics.

## LiveSpeak

- Prefer custom GLB exported with visemes.
- Wait for LiveSpeak `ModelAwaiting` before sending `load_model`.
- Production response path is `speak(text)` with approved text.
- Do not rely on undocumented stop/pause behavior.
- Treat `raw_stream` as a separate experimental path and test latency behavior explicitly.

## LiveKit

- Verify current LiveKit docs before implementing APIs; SDKs evolve quickly.
- Turn handling must be explicit in production configuration.
- Treat interruption, endpointing and transcript finalization as testable state-machine behavior.
- MCP/tool calls are optional and must never bypass Bible grounding for theological claims.

## Domain

- Never invent scripture references.
- Never present uncertain chronology as exact.
- Never represent artistic avatar appearance or synthesized voice as historically authentic.
- Jesus-related conversational behavior requires a separate higher-assurance policy; God/Holy Spirit are not ordinary character avatars.

## Tests

- Add truth set cases with every new character.
- Add regression cases whenever a hallucination, citation error or unsafe theological answer is discovered.
- Keep `tests/quality-gates.yaml` executable as acceptance criteria.
