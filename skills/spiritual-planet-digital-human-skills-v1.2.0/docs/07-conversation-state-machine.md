# 07 — Conversation State Machine

## UI states

```text
IDLE
LISTENING
TRANSCRIBING
RETRIEVING
VERIFYING
READY_TO_SPEAK
SPEAKING
ERROR
```

## Key invariant

Only one authoritative speech turn may drive the avatar at a time.

## User experience

- `LISTENING`: visible mic indicator.
- `RETRIEVING`: “正在查找相关经文”.
- `VERIFYING`: optional short state for slow queries.
- `SPEAKING`: disable conflicting commands or apply a clearly defined interruption policy.

## V1 interruption policy

Because LiveSpeak stop semantics must not be assumed, V1 may use half-duplex behavior:

- while avatar is speaking, microphone may remain visually available but a new turn is queued, or;
- mic capture can be temporarily gated.

Whichever policy is chosen must be explicit, user-visible and tested.

## Recovery

Every vendor failure maps to a user-safe fallback:

- STT fail → text input;
- LLM/RAG fail → apology + retry, no fabricated answer;
- TTS/avatar fail → text answer + references;
- graph fail → answer without relationship recommendations.
