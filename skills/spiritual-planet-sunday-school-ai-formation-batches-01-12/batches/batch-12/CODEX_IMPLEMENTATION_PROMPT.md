# Codex 实施提示词 — Batch 12

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-production-certification-orchestrator
```

## 目标

把 **生产认证、神学与牧养治理、儿童安全红队、隐私无障碍、效果评估与发布证据系统** 作为 `sunday_school.ai_formation` 的 Batch 12 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 发现CI/CD、审核、安全、隐私、儿童保护、无障碍、评测和发布架构
2. 实现12份Schema、迁移和不可变认证范围
3. 实现神学/牧养证书
4. 实现24情境儿童与产品红队
5. 实现隐私安全与无障碍认证
6. 实现内容质量、Skill评测和效果评估
7. 实现Release Evidence Certificate与发行Manifest
8. 实现人类发布决策、Feature Flag、有限发布和回滚
9. 运行全仓原生测试、发布演练和证据签署

## 推荐路由

- /sunday-school/ai-formation/admin/certification
- /sunday-school/ai-formation/admin/certification/scopes
- /sunday-school/ai-formation/admin/certification/theology
- /sunday-school/ai-formation/admin/certification/pastoral-safety
- /sunday-school/ai-formation/admin/certification/child-red-team
- /sunday-school/ai-formation/admin/certification/privacy-security
- /sunday-school/ai-formation/admin/certification/accessibility
- /sunday-school/ai-formation/admin/certification/content-quality
- /sunday-school/ai-formation/admin/certification/skill-evals
- /sunday-school/ai-formation/admin/certification/effectiveness
- /sunday-school/ai-formation/admin/certification/release

## 不可违反

- 所有认证必须绑定artifact ID、版本、环境和不可变hash；过期、错配或缺失证据不得复用。
- 自动化可收集和验证证据，但神学、牧养、儿童保护、隐私安全和最终发布不得自动批准。
- 不得声称未实际运行的测试已通过；每条生产就绪声明必须引用真实命令/人工记录、时间、结果和限制。
- 任何儿童保护关键失败、S3中断失败、跨租户泄漏、敏感日志泄漏或未缓解关键安全缺陷都是发布阻断项。
- 神学认证必须核对经文上下文、权威分层、恩典次序、宗派差异和有害使用，模型置信度不能替代授权审核者。
- 无障碍认证必须同时包含自动化和人工证据，不能仅凭工具分数通过。
- 课程效果评估不得推断救恩、圣洁、呼召、父母适格性或人的价值；参与者可退出且未成年人适用同意/assent和保护。
- 内容不得自动发布；版权、译文许可、年龄适切性、事实与经文来源、羞辱胁迫和审核状态必须通过质量门。
- 最终发布决策必须由授权人作出，具备Feature Flag、有限发布能力、回滚、事故Owner和透明阻断清单。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
