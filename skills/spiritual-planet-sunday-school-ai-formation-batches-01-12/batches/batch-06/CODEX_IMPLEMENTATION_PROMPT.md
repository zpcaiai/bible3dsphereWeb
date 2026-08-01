# Codex 实施提示词 — Batch 06

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-family-attention-covenant-orchestrator
```

## 目标

把 **家庭注意力生态、家庭数字公约与家庭AI公约系统** 作为 `sunday_school.ai_formation` 的 Batch 06 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 发现家庭/角色/设备与通知架构
2. 实现11份Schema与家庭RBAC
3. 实现注意力生态和公约编辑器
4. 实现设备区域与家庭AI公约
5. 实现年龄权限与例外状态机
6. 实现家庭会议和冲突修复
7. 实现家庭数字安息与复盘
8. 接入S2/S3数字安全
9. 导入审核种子并完成全套测试

## 推荐路由

- /sunday-school/ai-formation/family
- /sunday-school/ai-formation/family/ecology
- /sunday-school/ai-formation/family/covenant
- /sunday-school/ai-formation/family/zones
- /sunday-school/ai-formation/family/ai-covenant
- /sunday-school/ai-formation/family/meeting
- /sunday-school/ai-formation/family/permissions
- /sunday-school/ai-formation/family/exceptions
- /sunday-school/ai-formation/family/repair
- /sunday-school/ai-formation/family/sabbath
- /sunday-school/ai-formation/family/review

## 不可违反

- 家庭治理必须透明、可解释、可复盘；禁止秘密规则、秘密监控和全量设备历史采集。
- 家庭公约不是救恩、敬虔、顺服或亲子价值评分工具，不得建立成员排行榜。
- 未成年人AI使用不得进入秘密、排他、浪漫或性化陪伴；AI不得作最终道德和属灵决定。
- 每条权限和区域规则必须保留紧急、照护、工作、学校和无障碍等真实例外。
- 孩子应知道家长控制能看到什么、谁能看、何时看和保存多久；不得强迫私密认罪。
- 违规处理必须相称、有修复和恢复路径；禁止公开羞辱、无限期惩罚和一次失败永久封禁。
- 勒索、成人与未成年人不当接触、自伤、跟踪或即时危险进入S2/S3，而非仅没收设备。
- 产品不得充当数字取证仓库，不得要求上传私密影像、消息或敏感证据。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
