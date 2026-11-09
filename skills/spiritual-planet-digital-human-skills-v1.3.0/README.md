# Spiritual Planet Digital Human Skills Package v1.3.0

面向 **“属灵星球 · 圣经人物数字人”** 的可复用工程 Skills Package。

核心技术基线：

- **MetaPerson**：圣经人物 3D Avatar 资产生成与 GLB 输出
- **LiveSpeak**：Avatar 加载、Azure/ElevenLabs TTS、Lip Sync
- **LiveKit**：WebRTC、麦克风、STT、Turn Detection、实时 Agent Session
- **Bible Persona Engine**：圣经人物 Persona、Bible RAG、人物知识图谱、引用解析
- **Grounding & Theology Guard**：经文优先、事实可追溯、神学争议中性表达、禁止伪造启示
- **E0–E5 Assurance**：从“能跑”到“可审计、可上线、可持续回归”的分级验收

## 一句话架构

```text
Bible Character Graph
        │
        ▼
Character ID ──► MetaPerson GLB ──► LiveSpeak ──► 3D Avatar + LipSync
        │                                  ▲
        │                                  │ speak(approvedText)
        ▼                                  │
LiveKit WebRTC ──► STT / Turn Detector ──► Bible Persona Engine
                                             │
                           Bible RAG + Knowledge Graph + Guardrails
                                             │
                                             ▼
                                   Structured Grounded Answer
```

## 推荐使用方式

1. 将本目录放入项目的 `.skills/spiritual-planet-digital-human/` 或团队 Skills 仓库。
2. 让编码 Agent 首先读取根目录 `SKILL.md` 与 `AGENTS.md`。
3. 新人物复制 `templates/character.yaml`；新 Persona 复制 `templates/persona.system.md`。
4. 每个可上线人物必须有 Truth Set，并通过 `scripts/validate_package.py`。
5. 生产环境必须通过 `docs/10-e0-e5-assurance.md` 中的 E3；公开大规模上线建议达到 E4；关键内容管线目标 E5。

## 快速校验

```bash
python scripts/validate_package.py
python scripts/validate_character_examples.py
python scripts/validate_identity_aliases.py
python scripts/validate_truth_set.py examples/david/truth-set.yaml
```

## 目录

- `SKILL.md`：AI Coding Agent 主技能指令
- `AGENTS.md`：仓库级实现约束
- `docs/`：架构与领域规范
- `src/`：参考代码骨架
- `schemas/`：结构化契约
- `templates/`：人物/Persona/审核模板
- `examples/<character>/`：Core 100 人物完整资产 / Persona / Truth Set；前 24 人为 deep-alpha，新增 76 人为 standard-alpha
- `examples/characters.index.yaml`：Core 100 人物索引
- `examples/identity-aliases.yaml`：同名/近名人物的路由与消歧契约
- `docs/12-first-four-characters.md`：首批四人物深度规范
- `docs/13-core-24-character-catalog.md`：v1.2 历史目录
- `docs/14-core-100-character-catalog.md`：v1.3 Core 100 数字人物目录与分层
- `docs/15-character-identity-disambiguation.md`：100 人规模下的同名人物消歧规则
- `tests/`：E2E、对抗性与质量 Gate
- `work-packages/`：可执行工作包
- `scripts/`：包与 Truth Set 校验

> 说明：本包不包含 MetaPerson、LiveSpeak、LiveKit 或圣经译本文本本身，也不授予第三方服务/内容版权。生产使用前需单独审查供应商条款与所用圣经译本授权。

## V1.3 Core 100

人物层已扩展到 **100 个数字人物**；运行时仍复用 MetaPerson + LiveSpeak + LiveKit。前 24 人为 deep-alpha，新增 76 人为 standard-alpha，扩容主要发生在内容、配置与验证资产层。

当前包提供 **532 条结构化 Truth Set 用例**，并加入同名人物身份消歧配置。使用 `scripts/validate_character_examples.py` 与 `scripts/validate_identity_aliases.py` 做全量人物包校验。
