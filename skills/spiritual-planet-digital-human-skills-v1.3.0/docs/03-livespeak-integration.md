# 03 — LiveSpeak Integration

## V1 role

LiveSpeak is the speaking/animation renderer. It is not the authoritative chatbot.

## Recommended initial mode

`tts_azure3` — Azure TTS + local lipsync.

Evaluate other modes behind configuration after baseline quality is established.

## Custom model lifecycle

1. Create iframe with `custom_model`.
2. Listen for LiveSpeak messages.
3. Wait for `avatar_state_changed` with `ModelAwaiting`.
4. Send `load_model` with reviewed GLB URL.
5. Wait for ready state.
6. Send `speak` only with approved structured-response text.

## Security

- Use backend-minted temporary access/token mechanisms where supported.
- Never expose permanent client secret in frontend code.
- Lock `postMessage` target origin to the documented LiveSpeak origin in production; avoid `*` outside prototypes.
- Validate message `source`, `origin`, event name and payload.

## `raw_stream` caveat

Current documented `raw_stream` behavior collects raw PCM and playback begins when `audio_end` is received. Treat it as an experimental/alternative path rather than assuming true streaming speech output. Measure it before adopting it for conversational latency.

## State model

```text
BOOTING → MODEL_AWAITING → LOADING_MODEL → READY → SPEAKING → READY
                                      ↘ ERROR
```

## Failure strategy

- Avatar load failure: show portrait fallback + text response.
- TTS failure: show text response and retry bounded times.
- LiveSpeak iframe unavailable: keep Bible Q&A functional without avatar.

The Bible learning experience must degrade gracefully rather than becoming unavailable when the avatar vendor is down.
