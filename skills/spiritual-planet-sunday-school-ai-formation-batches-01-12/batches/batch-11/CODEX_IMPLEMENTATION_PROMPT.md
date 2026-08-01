# Codex 实施提示词 — Batch 11

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-formation-twin-orchestrator
```

## 目标

把 **Formation Twin：注意力、习惯、关系果子与7/14/30/90天纵向成长系统** 作为 `sunday_school.ai_formation` 的 Batch 11 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 发现事件/计划/日记/同意/数据权利架构
2. 实现12份Schema和迁移
3. 实现Twin领域与同意设置
4. 实现事件账本和证据快照
5. 实现习惯/注意力/关系轨迹
6. 实现7/14/30/90复盘和人工纠正
7. 实现可拒绝建议
8. 实现保留、导出、删除、暂停和撤销
9. 导入审核资产并完成隐私/安全/E2E

## 推荐路由

- /sunday-school/ai-formation/twin
- /sunday-school/ai-formation/twin/setup
- /sunday-school/ai-formation/twin/domains
- /sunday-school/ai-formation/twin/timeline
- /sunday-school/ai-formation/twin/reviews
- /sunday-school/ai-formation/twin/recommendations
- /sunday-school/ai-formation/twin/sharing
- /sunday-school/ai-formation/twin/data-rights
- /sunday-school/ai-formation/teachers/twin-governance

## 不可违反

- Formation Twin只是经同意的有限领域镜像，不是灵魂、良心、属灵分身、临床模型或对一个人的终极解释。
- 不得生成总体属灵成熟分、救恩/呼召判断、未来属灵预测、隐藏特质、临床诊断或跨用户/家庭排名。
- 事件只能来自真实操作或授权人记录；模型不得编造事件，且不得保存原始私密叙事和第三方身份。
- 注意力轨迹不得接入完整设备遥测、浏览历史或私聊；实践轨迹不得显示streak、总依从率或惩罚错过。
- 所有模式必须链接证据、标明不确定性和替代解释，并允许用户确认、修改或拒绝。
- 关系观察必须有同意或合法角色，只能用粗粒度可观察果子，不能访问私人日记或生成关系质量分。
- 建议必须可解释、有替代、可拒绝；禁止自动改变计划、自动通知他人、作高风险决定或以置信度压过人。
- 数据必须目的限定、最短保留、儿童更少；导出/删除/暂停/纠正/撤销共享透明执行，审计例外不得静默。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
