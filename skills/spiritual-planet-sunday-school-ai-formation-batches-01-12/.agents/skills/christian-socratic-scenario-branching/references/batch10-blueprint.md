# Batch 10 Blueprint

## Purpose

把手机失控、AI代写、色情暴露、同伴排斥、网红崇拜、家庭冲突、信仰怀疑、AI伴侣、成绩失败、过度控制等转化为可审核、可暂停、非操控的选择式情境运行时。

## Dependency

依赖 Batch 01–09，复用课程引擎、安全门、身份/欲望/家庭/儿童/青少年内容和审核发布。

## Product routes

- `/sunday-school/ai-formation/scenarios`
- `/sunday-school/ai-formation/scenarios/library`
- `/sunday-school/ai-formation/scenarios/run/:scenarioId`
- `/sunday-school/ai-formation/scenarios/session/:sessionId`
- `/sunday-school/ai-formation/scenarios/debrief/:sessionId`
- `/sunday-school/ai-formation/teachers/scenarios`
- `/sunday-school/ai-formation/teachers/scenarios/author`
- `/sunday-school/ai-formation/teachers/scenarios/review`
- `/sunday-school/ai-formation/teachers/scenarios/benchmarks`

## Implementation sequence

1. 发现课程/状态机/事件/安全架构
2. 实现12份Schema与迁移
3. 实现情境图编辑和版本审核
4. 实现运行时暂停恢复和版本绑定
5. 实现触发时间线、选择与后果
6. 实现经文恩典和苏格拉底分支
7. 实现教师主持与S2/S3中断
8. 实现复盘、Golden runs和基准
9. 导入20个情境包并完成全套测试

## Hard boundaries

1. 所有情境必须虚构、非露骨、可跳过且经过相应神学/牧养/儿童安全审核；不得要求学习者重演真实创伤。
2. 运行时只保存版本、节点、选择和状态，不保存原始自由文本，不根据路径建立人格、风险或属灵画像。
3. 选择节点不得用羞耻、倒计时、预设唯一“敬虔答案”或隐藏惩罚操控学习者。
4. 后果是带不确定性的可能果子，不是预言；不得生成未来行为、救恩或道德价值评分。
5. 经文/恩典介入必须同时保留真理、责任、修复和帮助；禁止廉价恩典、纯定罪或“神告诉你”式私人神谕。
6. 苏格拉底分支必须允许跳过、不确定和替代解释，禁止强迫继续、诱导认罪和采集私密历史。
7. 真实安全披露必须退出角色扮演；教师不得公开羞辱、承诺绝对保密或做取证式追问。
8. 合成基准只证明工程行为，不得宣称真实属灵成长、临床效果或生产安全已获证明。

## Extension hooks

- Batch 11 Formation Twin使用情境事件
- Batch 12情境安全和效果认证
- 未来Scenario Pack Marketplace
