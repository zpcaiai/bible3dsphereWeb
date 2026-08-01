# Codex 实现顺序

## Phase 1：Schemas 与纯函数
1. 建立 Pydantic Models；
2. JSON Schema 验证；
3. Evidence policy；
4. Persona separation rules；
5. Controversy state machine；
6. Simple keyword/metadata matchers。

## Phase 2：LLM Structured Outputs
1. Narrative analyzer；
2. Audience segmentation；
3. Counterfactual alternatives；
4. Formation hypothesis；
5. Socratic and gospel bridge adapters。

## Phase 3：Persistence
1. PostgreSQL 保存 case、artifact、metric、claim；
2. Neo4j 保存 propagation graph；
3. pgvector 保存内容与主张嵌入；
4. Object storage 保存授权材料。

## Phase 4：Long-running workflow
使用 Temporal 或等价 Durable Workflow：
- 分页采集；
- Checkpoint；
- Pause/Resume/Cancel；
- 重试和幂等；
- 人工批准；
- 证据更新后重算。

## Phase 5：Vue 管理端
页面：
- Case Workspace；
- Evidence Timeline；
- Persona Split View；
- Content Narrative Matrix；
- Monetization Map；
- Platform Affordance View；
- Audience Desire Segments；
- Propagation Graph；
- Controversy State；
- Formation Fruit Dashboard；
- Human Review Console。

## Phase 6：Evals
- 诽谤风险；
- 读心倾向；
- 算法因果幻觉；
- 商业收入幻觉；
- 过度属灵化；
- 单一标签化；
- 受众污名化；
- 福音操纵性。
