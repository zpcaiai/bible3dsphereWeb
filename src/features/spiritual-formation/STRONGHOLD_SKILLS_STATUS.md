# 自高之事 / Stronghold — P1+P2 Skills 实现状态

**结论：10 / 10 全部实现，并通过测试。**
最后验证：前端 `vitest` 60/60 通过、生产构建干净；后端 `py_compile` 通过、纯逻辑断言（聚合/画像/进展/RAG/悔改路径）全过。

架构说明：这些 skill 用**确定性逻辑 + 本应用既有架构**落地（前端数据驱动 + 同步型 FastAPI 后端），而非 10 个独立的 Postgres+LLM 微服务。因此现在就能上线、可单测；LLM/向量部分 env 门控、优雅降级。

---

## P1 增强版

| # | Skill | 实现位置 | 测试 |
|---|---|---|---|
| 1 | Blocked Doctrine Mapper（被拦阻真理） | `data/strongholds.ts`(blockedDoctrines + DOCTRINE_NAMES)、`data/gospelResponse.ts`(DOCTRINE_RESPONSE)、`lib/gospelResponse.ts`、`components/GospelResponsePanel.jsx`「此刻较难领受的真理」 | `gospelResponse.test.ts` |
| 2 | False Gospel Mapper（假福音） | `data/strongholds.ts`(falseGospel)、`data/gospelResponse.ts`(FALSE_GOSPEL_LABEL) → 面板「假福音→更正」 | `gospelResponse.test.ts` |
| 3 | Scripture Theme Mapper（经文主题） | `data/scriptureThemes.ts`(14 主题)、`lib/scriptureThemeMapper.ts`(评分+读经计划) → 接入 `lib/gospelResponse.ts` | `scriptureThemeMapper.test.ts` |
| 4 | Prayer Reflection Generator（祷告反思） | `data/gospelResponse.ts`(PRAYER_BY_ARCHETYPE)、`lib/gospelResponse.ts`(祷告/反思/今日·本周行动) | `gospelResponse.test.ts` |
| 5 | Stronghold Timeline Engine（时间线） | `lib/strongholdHistory.ts`(summarize 7/30/90d)、`components/StrongholdTimeline.jsx`；后端 `stronghold_scans` 表 + `GET /api/strongholds/summary` | `strongholdHistory.test.ts`、`tests/test_strongholds.py` |
| 6 | Trigger Pattern Analysis（触发模式） | `lib/strongholdHistory.ts`(inferTriggerType + 触发聚合 + TRIGGER_INTERVENTION) + 时间线 UI | `strongholdHistory.test.ts` |
| 7 | Knowledge Graph RAG Engine（知识图谱 RAG） | `backend/stronghold_rag_schema.sql`、`backend/stronghold_knowledge.py`(37 条语料)、`backend/routers/stronghold_rag.py`(关键词+cosine、env 门控向量)；`/api/strongholds/rag/{status,ingest,search,context}` | `tests/test_stronghold_rag.py` |

## P2 长期成长版

| # | Skill | 实现位置 | 测试 |
|---|---|---|---|
| 8 | Repentance Path Builder（悔改路径） | `data/repentancePaths.ts`、`lib/repentancePath.ts`(1/7/30 天)、`lib/repentancePathStore.ts`(本地进度)、`components/RepentancePathView.jsx`（接入福音回应面板） | `repentancePath.test.ts` |
| 9 | Spiritual Profile Engine（属灵画像） | 后端 `build_profile`（合并自高之事 + 每日省察）+ `GET /api/strongholds/profile`；前端 `components/StrongholdProfile.jsx` | `tests/test_strongholds.py` |
| 10 | Formation Progress Scoring（成长评分） | 后端 `build_progress`（方向+信号，非绩效打分）+ `GET /api/strongholds/progress`；属灵画像 UI | `tests/test_strongholds.py` |

---

## 运行验证

前端：
```bash
cd bible3dsphere-frontend
npx vitest run src/features/spiritual-formation   # 60 passed
npx vite build                                     # clean
```

后端（需 .venv 里的 fastapi/pydantic/psycopg2）：
```bash
cd bible3dsphere/backend
pytest tests/test_strongholds.py tests/test_stronghold_rag.py
```

## 运行前提（非未完成项）
- **RAG 向量模式**：后端设 `OPENAI_API_KEY`（可选 `OPENAI_EMBED_MODEL`），登录后 `POST /api/strongholds/rag/ingest`；未配置时自动走关键词检索。
- **云同步**：登录态（Bearer token）下自动同步到 `stronghold_scans`；未登录走 localStorage 本地优先。

## 端到端能力闭环
辨识库（8 原型·18 模式）→ 自我辨识（核心谎言/偶像/危机护栏）→ 福音回应（假福音·被拦阻真理·经文主题·祷告·行动·悔改路径）→ 成长追踪（趋势·触发·本周关注点）→ 属灵画像/成长评分（服务端，合并每日省察）→ 端云同步 → 知识图谱 RAG。
