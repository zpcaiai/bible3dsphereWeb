# Upstream Documentation References

Check these official docs before implementing provider-specific behavior; APIs may change.

## MetaPerson / LiveSpeak

- LiveSpeak overview: https://docs.metaperson.avatarsdk.com/livespeak/
- LiveSpeak integration: https://docs.metaperson.avatarsdk.com/livespeak/integration/
- MetaPerson JavaScript API: https://docs.metaperson.avatarsdk.com/js_api/

Key points reflected in this package:

- custom GLB models can be loaded by LiveSpeak;
- compatible MetaPerson GLB should be exported with visemes;
- LiveSpeak supports Azure/ElevenLabs TTS and local lipsync modes;
- `raw_stream` playback behavior must be tested rather than assumed to be zero-buffer streaming.

## LiveKit

- Agents introduction: https://docs.livekit.io/agents/
- Turn handling options: https://docs.livekit.io/reference/agents/turn-handling-options/
- Tools: https://docs.livekit.io/agents/logic/tools/
- MCP: https://docs.livekit.io/agents/logic/tools/mcp/
- Coding agent support: https://docs.livekit.io/intro/coding-agents/

LiveKit recommends checking current docs because the SDK evolves quickly. Their docs MCP endpoint is documented at:

- https://docs.livekit.io/mcp
