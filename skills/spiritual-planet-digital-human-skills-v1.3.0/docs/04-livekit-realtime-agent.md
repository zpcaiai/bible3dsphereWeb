# 04 — LiveKit Realtime Agent

## V1 responsibilities

- WebRTC room/session
- microphone publishing
- STT
- turn detection
- endpointing
- connection/reconnect
- agent session state
- optional tool/MCP integration

## Reference implementation language

Python LiveKit Agents.

## Turn handling

Production code must explicitly configure and test turn handling. Current LiveKit Agents supports a recommended turn detector and configurable endpointing/interruption behavior.

For the initial LiveSpeak text→TTS architecture, consider disabling or constraining barge-in until avatar speech can be reliably stopped. Otherwise the realtime agent may stop its own logical speech while LiveSpeak continues audible playback.

## Session state

```text
DISCONNECTED
CONNECTING
IDLE
LISTENING
PROCESSING
AVATAR_SPEAKING
RECOVERING
ERROR
```

## Agent tools

Bible retrieval and graph lookup should be deterministic tools/services rather than hidden free-form prompt context where possible.

LiveKit MCP support can be used for internal tooling, but MCP tools must not bypass grounding and verification gates.

## Keep current

LiveKit SDK behavior evolves quickly. Before changing session/turn/tool APIs, consult current official documentation or their docs MCP.
