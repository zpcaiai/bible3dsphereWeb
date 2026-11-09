# 08 — Security, Privacy and Compliance

## Secrets

Server-side only:

- MetaPerson/LiveSpeak credentials
- LiveKit API secret
- TTS secret
- LLM API key
- database credentials

Frontend may receive only short-lived scoped tokens.

## Web security

- strict iframe origin allowlist;
- CSP configured for LiveSpeak/LiveKit endpoints;
- validate `postMessage` origin and payload;
- sanitize displayed user text;
- rate-limit token issuance;
- rotate keys;
- separate dev/stage/prod projects.

## User audio

Document:

- whether raw audio is stored;
- transcript retention period;
- deletion mechanism;
- analytics policy;
- model-training policy of third-party providers.

Default design preference: do not persist raw microphone audio unless a product feature explicitly requires it.

## Children / sensitive conversations

If the product is used by minors or for pastoral/sensitive personal discussions, add product-specific privacy/safety requirements before launch. The avatar must not pretend to replace clergy, medical professionals, emergency services or other human support.
