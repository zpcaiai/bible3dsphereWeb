# Batch 01 兼容与依赖契约

Batch 02 是增量包，不替代 Batch 01。Codex 应先定位真实实现，再映射下列逻辑依赖。

| Batch 01 能力 | Batch 02 使用方式 | 禁止行为 |
|---|---|---|
| `sunday_school.ai_formation` 模块注册 | 在成人轨道下增加页面与导航 | 新建平行应用或第二个主日学模块 |
| `FormationContentBlockV1` | 为课程、操练、经文锚点和审核状态提供内容外壳 | 另造不兼容内容模型 |
| 权威层级 | 明示 `SCRIPTURE_EXPLICIT`、`THEOLOGICAL_INFERENCE`、`PASTORAL_WISDOM`、`PRODUCT_DEFAULT` | 把分钟数、设备位置或禁食形式说成神的普遍命令 |
| `LearnerContextV1` | 读取成人角色、语言、无障碍和必要生活约束 | 采集与任务无关的敏感信息 |
| `PastoralSafetyDecisionV1` | 在推荐、暂停协议、禁食和高痛苦情形前执行 S0–S3 门 | 以产品课程替代紧急、医疗、心理或儿童保护支持 |
| 内容审核工作流 | 所有种子经 theology/pastoral review 后方可 `approved` | 自动发布模型生成内容 |
| 权限与租户隔离 | 所有学习者记录按 owner + tenant 查询 | 教师、牧者、家长或管理员秘密读取私人记录 |
| i18n、Analytics、A11y | 复用现有框架与事件治理 | 新建无法审计的埋点或硬编码界面文本 |

## 版本与迁移

- 所有外部存储契约必须保留 `version`；
- 内容版本与学习者历史分离；
- Practice 更新不得静默改写既有计划历史；
- Seed 导入必须幂等，且不得覆盖人工审核记录；
- Feature Flag 关闭时不得破坏 Batch 01 入口与其他轨道；
- 若 Batch 01 尚未落地，Codex 应停止实施并报告缺失依赖，而不是复制一套替代实现。

## Batch 03 扩展接口

Batch 02 应为后续保留：

- AI 使用反思记录与不可外包能力清单；
- 来源核查、经文误引与模型幻觉检测；
- 算法世界观和欲望分析；
- 先独立思考、再调用 AI 的学习流程；
- 但不得在 Batch 02 中提前引入未经定义的 AI 道德评分。
