---
name: spiritual-planet-digital-human
version: 1.2.0
description: Build and maintain Bible-grounded 3D digital-human experiences for Spiritual Planet using MetaPerson, LiveSpeak and LiveKit.
triggers:
  - bible digital human
  - 圣经人物数字人
  - metaperson
  - livespeak
  - livekit bible persona
  - character graph avatar
  - spiritual planet digital human
---

# Spiritual Planet Digital Human Skill

## Mission

实现“圣经人物图谱 → 3D 人物 → 实时语音提问 → 经文约束回答 → 语音与 Lip Sync → 经文可追溯”的产品闭环。

## Non-negotiable rules

1. **Scripture before persona.** Persona 只能影响表达风格，不能覆盖事实。
2. **LiveSpeak is presentation, not truth.** 禁止把 LiveSpeak 内置 ChatGPT 模式作为圣经回答权威源；生产回答走 `speak(approvedText)`。
3. **Every material claim must carry grounding metadata.** 关键事实需要经文或经审核的历史资料证据。
4. **No fabricated revelation.** 禁止人物以“神现在告诉你”“我奉神告诉你”之类方式制造新的神谕。
5. **No invented inner thoughts as facts.** 经文未记录的心理活动，只能标为推断/艺术演绎。
6. **Theology disputes are labeled.** 宗派有分歧的话题必须给出主要解释及依据，不伪装成唯一无争议结论。
7. **Use stable Character ID across layers.** 图谱、Avatar、Voice、Persona、RAG、Analytics 必须共享 `characterId`。
8. **Secrets stay server-side.** MetaPerson、LiveKit、TTS、LLM 等敏感凭证不得进浏览器 bundle。
9. **Prefer text-to-LiveSpeak in v1.** LiveKit 负责实时收音/会话；Bible Agent 产生批准文本；LiveSpeak 负责 TTS + Lip Sync。不要假定 `raw_stream` 是无等待全双工流。
10. **Adapter boundaries are mandatory.** 业务层不得直接依赖某供应商 SDK。

## Required architecture

```text
[Character Graph UI]
       │ characterId
       ▼
[Character Service] ───────► [Avatar/Voice Config]
       │
       ├──────────────► [MetaPersonLiveSpeakAdapter]
       │                         │
       │                         ▼
       │                    [LiveSpeak]
       │                         ▲
       │                         │ approved spokenText
       ▼                         │
[LiveKit Client] ─► [LiveKit Agent] ─► [Bible Persona Engine]
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
                [Bible RAG]     [Character Graph] [Theology Guard]
                    └─────────────────┬─────────────────┘
                                      ▼
                              [Structured Response]
```

## Workflow for every implementation task

### 1. Classify the change

- Avatar asset
- LiveSpeak runtime
- LiveKit realtime conversation
- Persona/RAG/graph
- Guardrail/grounding
- UX/state machine
- Security/operations

### 2. Read the relevant reference

- Avatar: `docs/02-metaperson-integration.md`
- Speech/avatar: `docs/03-livespeak-integration.md`
- Realtime: `docs/04-livekit-realtime-agent.md`
- RAG: `docs/05-bible-persona-rag.md`
- Guardrails: `docs/01-domain-and-theology-guardrails.md`
- E0–E5: `docs/10-e0-e5-assurance.md`

### 3. Preserve contracts

Do not bypass:

- `BibleCharacter`
- `DigitalHumanResponse`
- `GroundingEvidence`
- `DigitalHumanAdapter`

Schemas live under `schemas/` and example types under `src/frontend/types.ts`.

### 4. Add/modify tests before calling the feature done

At minimum:

- one happy-path truth test;
- one unsupported-fact test;
- one scripture-citation test;
- one interruption/state test if realtime behavior changes;
- one secret-exposure check if auth/config changes.

### 5. Assign assurance level

Every deliverable states current E-level and missing gates.

## Grounding levels

- `G5_DIRECT_SCRIPTURE` – direct, explicit scripture support.
- `G4_STRONG_SCRIPTURAL_FACT` – strongly supported across scripture.
- `G3_SCRIPTURAL_INFERENCE` – reasonable inference; label it.
- `G2_HISTORICAL_RECONSTRUCTION` – external historical/cultural reconstruction.
- `G1_INTERPRETIVE_POSSIBILITY` – plausible interpretation, not fact.
- `G0_UNSUPPORTED` – do not assert.

## Response contract

Agent responses must be structured before reaching LiveSpeak:

```json
{
  "characterId": "david",
  "answerType": "FACT",
  "spokenText": "...",
  "displayText": "...",
  "references": [],
  "groundingLevel": "G5_DIRECT_SCRIPTURE",
  "relatedCharacters": [],
  "relatedEvents": [],
  "warnings": []
}
```

## V1 technical preference

- Frontend: React/Next.js + TypeScript
- Realtime: LiveKit
- Avatar: MetaPerson GLB
- Speech/avatar: LiveSpeak `tts_azure3` initially
- Data: PostgreSQL + pgvector
- Graph: PostgreSQL relations first; Neo4j only when graph complexity justifies it
- Agent: Python LiveKit Agents is the reference implementation in this package
- API: modular monolith first

## Completion definition

A feature is not complete because it “looks right.” It is complete when:

1. Functionality works.
2. Structured contracts remain valid.
3. Truth tests pass.
4. Unsupported claims fail closed.
5. Secrets are protected.
6. Observability exists.
7. E-level is recorded.


## First production characters (v1.1)

首批标准人物：`moses`, `david`, `peter`, `paul`。实现或修改人物时，读取对应 `examples/<characterId>/` 中的 character、Persona、问题、Truth Set、关系、Avatar/Voice 与审核文件，并运行 `python scripts/validate_character_examples.py`。
