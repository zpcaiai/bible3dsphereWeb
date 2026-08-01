# API、持久化与实现蓝图

## 推荐聚合根

- `AiUseIntent`
- `AiBoundaryDecision`
- `VerificationSession` + `EvidenceClaim`
- `ScriptureCitationCheck`
- `SpiritualContentBoundaryDecision`
- `AlgorithmicWorldviewAnalysis`
- `MediaDesireAnalysis`
- `SocraticDiscernmentSession`
- `AiLearningIntegrityRecord`
- `DiscernmentJournalEntry`
- `DiscernmentReview`

## 数据最小化

| 数据 | 默认 |
|---|---|
| 原始 prompt / 完整 AI 回答 | ephemeral，不入库 |
| Claim statement | 可持久化，限制长度，用户可删 |
| 来源正文 | 不入库；仅 metadata/hash/许可状态 |
| 经文 | reference + translation metadata；长文不入库 |
| 媒体正文/浏览历史 | 不入库 |
| 私密反思 | owner-only，加密，Analytics 禁止 |
| 分享 | 单独 summary snapshot + consent + revoke |

## API 参考

```text
POST   /api/ai-formation/discernment/intents
POST   /api/ai-formation/discernment/intents/:id/classify
POST   /api/ai-formation/discernment/verification-sessions
POST   /api/ai-formation/discernment/verification-sessions/:id/claims
POST   /api/ai-formation/discernment/scripture-checks
POST   /api/ai-formation/discernment/spiritual-boundaries
POST   /api/ai-formation/discernment/worldview-analyses
POST   /api/ai-formation/discernment/media-analyses
POST   /api/ai-formation/discernment/socratic-sessions
POST   /api/ai-formation/discernment/learning-integrity
POST   /api/ai-formation/discernment/journal
POST   /api/ai-formation/discernment/reviews
DELETE /api/ai-formation/discernment/:resource/:id
```

## 事务与幂等

- 创建、完成、删除、分享和撤销使用 idempotency key；
- claim 与 evidence 写入同一事务或使用可恢复的状态机；
- 所有查询 tenant + owner scope；
- 教师课程内容与 learner private data 使用不同权限边界；
- 审核内容和用户生成数据分表/分域；
- redaction 在日志、trace、error reporter 和 analytics adapter 前执行。

## 外部工具

事实检索、圣经文本和内容版权供应商通过 adapter 接入。Skill 不锁定特定供应商。网络不可用时明确退化为未核验，不调用模型记忆填补。
