# 属灵星球「洞鉴别」模块 — Batch 01 Skill Pack

## 目标

本 Skill Pack 建立「洞鉴别」模块的核心辨识底座，用于：

1. 分析现代思潮、网红、事件、商品与文化现象；
2. 区分事实、解释、价值判断、欲望承诺与救恩叙事；
3. 识别可能的自高、自义、控制、虚荣、群体优越与属灵骄傲；
4. 以苏格拉底式追问帮助用户自我察验；
5. 在不操纵、不羞辱、不替神发言的前提下，把讨论引向基督的福音；
6. 输出可审计、可解释、带不确定性标记的属灵辨识报告。

## 重要边界

本模块是「属灵辨识与门徒训练辅助系统」，不是：

- 读取人心的工具；
- 宣告“神告诉我某人怎样”的先知系统；
- 心理疾病诊断器；
- 判定某人是否得救的裁判；
- 对公众人物进行人格诽谤的工具；
- 用宗教语言操纵、羞辱或强迫用户的工具。

所有关于动机、偶像和自高的判断必须标记为“假设”，并附证据等级与替代解释。

## Batch 01 包含的 Skills

1. `case-intake-normalizer`
2. `claim-evidence-extractor`
3. `worldview-frame-mapper`
4. `pride-signal-detector`
5. `desire-idolatry-mapper`
6. `socratic-question-planner`
7. `gospel-bridge-builder`
8. `discernment-report-composer`
9. `pastoral-safety-guardian`
10. `trace-review-packager`

## 推荐实现栈

- Backend: Python 3.12 + FastAPI + Pydantic v2
- Workflow: LangGraph 或显式状态机
- Persistence: PostgreSQL + pgvector
- Knowledge graph: Neo4j（后续 Batch）
- LLM abstraction: provider-neutral adapter
- Observability: OpenTelemetry
- Tests: pytest + JSON Schema validation
- Frontend: Vue 3 + TypeScript（后续 Batch）
