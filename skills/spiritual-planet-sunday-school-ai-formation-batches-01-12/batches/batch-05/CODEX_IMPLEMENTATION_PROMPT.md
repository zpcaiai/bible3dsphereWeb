# Codex 实施提示词 — Batch 05

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-parent-formation-orchestrator
```

## 目标

把 **父母先被塑造：榜样、注意力、焦虑、成功偶像、认罪修复与权柄治理系统** 作为 `sunday_school.ai_formation` 的 Batch 05 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 仓库发现和家庭角色映射
2. 实现11份Schema、迁移与权限
3. 实现父母镜像、注意力和焦虑流程
4. 实现成功优先级和父母修复
5. 实现权柄/恩典和共同养育协议
6. 实现孩子反馈与无报复门
7. 实现30天父母榜样计划
8. 接入S2/S3保护
9. 导入审核种子并完成测试

## 推荐路由

- /sunday-school/ai-formation/parents
- /sunday-school/ai-formation/parents/mirror
- /sunday-school/ai-formation/parents/attention
- /sunday-school/ai-formation/parents/anxiety
- /sunday-school/ai-formation/parents/success
- /sunday-school/ai-formation/parents/repair
- /sunday-school/ai-formation/parents/authority
- /sunday-school/ai-formation/parents/co-parent
- /sunday-school/ai-formation/parents/feedback
- /sunday-school/ai-formation/parents/plan
- /sunday-school/ai-formation/teachers/parent-formation

## 不可违反

- 父母先治理自己；不得把系统变成对孩子的隐蔽监控、属灵评分或服从评分工具。
- 不得根据回答判断父母是否合格、孩子是否得救，或把孩子结果归因于某次父母操练。
- 孩子反馈必须可跳过、透明、无报复，不得作为信仰一致性或顺服测试。
- 父母权柄不得被绝对化；禁止羞辱、身体伤害、属灵威胁、强迫披露和不相称惩罚。
- 父母道歉不得要求孩子立即饶恕、安慰父母或承担成人情绪。
- 共同养育不得三角化孩子、秘密拆台或秘密监控另一位成人。
- 保护儿童优先于家庭形象；伤害、虐待、强迫或即时危险进入S2/S3流程。
- 课程与建议不替代家庭治疗、临床照护、法律建议或当地保护义务。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
