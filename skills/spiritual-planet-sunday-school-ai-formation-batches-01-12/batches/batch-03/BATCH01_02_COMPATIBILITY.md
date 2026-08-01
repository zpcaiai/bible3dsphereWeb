# Batch 01 / 02 兼容契约

## 必需依赖

Batch 03 不创建第二套神学、安全、用户或计划模型。Codex 必须先定位并复用：

### Batch 01

- `SundaySchoolAiFormationModuleV1` 与模块注册；
- `FormationContentBlockV1` 的 `authorityLevel`、`reviewStatus`、`ageBands`、`scriptureAnchors`；
- `LearnerContextV1`；
- `PastoralSafetyDecisionV1` 与 S0–S3 中断规则；
- 教师、牧者、管理员权限和人工审核队列。

### Batch 02

- 成人轨道与页面壳；
- `PracticeDefinitionV1`、`FormationPlanV1`、`PracticeCheckInV1`、`FormationReviewV1`；
- 私密日志、导出、删除、暂停和自愿分享模式；
- 不评分、不排行、不羞耻的产品规则；
- Analytics denylist 和日志脱敏。

## 扩展方式

- Batch 03 的 44 个实践应注册进 Batch 02 Practice Catalog，而非新建平行 catalog。
- `DiscernmentReviewV1` 是专项复盘，不取代通用 `FormationReviewV1`；可由通用 Review 引用其 ID。
- `AiUseIntentV1` 记录“任务与委托边界”，不保存原始 prompt。
- `EvidenceClaimV1` 与 `AiAnswerVerificationSessionV1` 只保存结构化核验元数据和经同意的短摘要。
- `ScriptureCitationCheckV1` 通过 Batch 01 内容审核进入发布流程。
- Batch 03 页面使用 Batch 01 Feature Flag、RBAC、tenant scope、i18n、a11y 和 error boundary。

## 迁移原则

- 所有新表必须带 tenant、owner、version、created_at、updated_at、deleted_at 或仓库等价字段。
- 私密日志默认仅 learner owner 可见；教师/牧者无隐蔽读取权限。
- 自愿分享只生成最小摘要，可撤销并留下审计记录。
- 任何原始 AI 内容、媒体正文或长篇经文不得因调试而写入普通日志。
