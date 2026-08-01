# Codex 实施提示词 — Batch 10

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-scenario-runtime-orchestrator
```

## 目标

把 **情境模拟、选择—后果—恩典—修复与苏格拉底门训运行时** 作为 `sunday_school.ai_formation` 的 Batch 10 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 发现课程/状态机/事件/安全架构
2. 实现12份Schema与迁移
3. 实现情境图编辑和版本审核
4. 实现运行时暂停恢复和版本绑定
5. 实现触发时间线、选择与后果
6. 实现经文恩典和苏格拉底分支
7. 实现教师主持与S2/S3中断
8. 实现复盘、Golden runs和基准
9. 导入20个情境包并完成全套测试

## 推荐路由

- /sunday-school/ai-formation/scenarios
- /sunday-school/ai-formation/scenarios/library
- /sunday-school/ai-formation/scenarios/run/:scenarioId
- /sunday-school/ai-formation/scenarios/session/:sessionId
- /sunday-school/ai-formation/scenarios/debrief/:sessionId
- /sunday-school/ai-formation/teachers/scenarios
- /sunday-school/ai-formation/teachers/scenarios/author
- /sunday-school/ai-formation/teachers/scenarios/review
- /sunday-school/ai-formation/teachers/scenarios/benchmarks

## 不可违反

- 所有情境必须虚构、非露骨、可跳过且经过相应神学/牧养/儿童安全审核；不得要求学习者重演真实创伤。
- 运行时只保存版本、节点、选择和状态，不保存原始自由文本，不根据路径建立人格、风险或属灵画像。
- 选择节点不得用羞耻、倒计时、预设唯一“敬虔答案”或隐藏惩罚操控学习者。
- 后果是带不确定性的可能果子，不是预言；不得生成未来行为、救恩或道德价值评分。
- 经文/恩典介入必须同时保留真理、责任、修复和帮助；禁止廉价恩典、纯定罪或“神告诉你”式私人神谕。
- 苏格拉底分支必须允许跳过、不确定和替代解释，禁止强迫继续、诱导认罪和采集私密历史。
- 真实安全披露必须退出角色扮演；教师不得公开羞辱、承诺绝对保密或做取证式追问。
- 合成基准只证明工程行为，不得宣称真实属灵成长、临床效果或生产安全已获证明。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
