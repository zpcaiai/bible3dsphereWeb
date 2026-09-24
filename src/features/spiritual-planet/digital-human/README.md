# Digital Human frontend boundary

This feature is mounted as the `characters` tab inside the existing Spiritual
Planet platform. It consumes only authenticated backend contracts.

- `contracts.js` rejects malformed, cross-character, unsupported-as-speakable,
  uncited high-grounding, or unapproved speech payloads.
- `MetaPersonLiveSpeakAdapter.js` accepts messages only from the configured
  HTTPS origin and the mounted iframe window. It can speak only a validated
  `speechApproved` response.
- `LiveKitRealtimeSession.js` uses the current text-stream transcription topic,
  accepts only final unique segments bound to the currently published local
  microphone track, stops capture before submitting the turn, and enforces
  half duplex through answer processing and avatar speech.
- `DigitalHumanWorkspace.jsx` provides a text fallback whenever content,
  avatar, voice or provider runtime gates are not approved.
- Bare ambiguous names are resolved without inherited UI context so the user
  must choose a stable character ID.
- Administrators receive a PII-free operations panel with turn latency,
  blocked/speech-ready rates and provider health. Browser telemetry contains no
  audio, transcript or prompt content.
- `npm run test:e2e:digital-human:live` is the fail-closed real journey. It
  requires a deployed app, authenticated storage state and real speech audio;
  it never substitutes mocked APIs for certification evidence.

No LiveKit secret, TTS key, STT key, GLB signing credential or release override
belongs in `VITE_*` variables or browser source.

## Preview-only fallback assets

When a character has no approved portrait, the workspace renders the bundled
`/assets/digital-human/shared-preview-portrait-3d-v1.jpg`. It is a shared,
identity-neutral 3D CGI/PBR placeholder and is always labeled as not being a
historical likeness. Its provenance, render medium and digest are stored next
to the asset.

The preview voice button uses the browser's local `speechSynthesis` voice and
can speak only a fixed disclosure sentence. It intentionally accepts no answer
text, so it cannot bypass `DigitalHumanResponse.speechApproved` or the signed
content release gate. Character answers remain text-only until the normal
LiveSpeak asset, voice and content approvals are present.
