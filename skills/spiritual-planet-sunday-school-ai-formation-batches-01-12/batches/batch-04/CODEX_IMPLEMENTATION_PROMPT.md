# Codex 实施提示词 — Batch 04

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-identity-intimacy-recovery-orchestrator
```

## 目标

把 **身份、欲望、性、色情触发、AI伴侣与虚拟亲密分辨及恢复系统** 作为 `sunday_school.ai_formation` 的 Batch 04 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 完成仓库发现和Batch 01–03兼容图
2. 实现11份Schema、迁移、权限和删除导出
3. 实现年龄内容门与身份/欲望课程
4. 实现类别化触发时间线和中断计划
5. 实现恢复复盘、支持邀请与撤销
6. 实现AI伴侣/虚拟亲密边界
7. 接入S2/S3保护流程
8. 导入审核状态种子
9. 完成E2E、安全、隐私和无障碍验证

## 推荐路由

- /sunday-school/ai-formation/identity-intimacy
- /sunday-school/ai-formation/identity-intimacy/identity
- /sunday-school/ai-formation/identity-intimacy/desire-map
- /sunday-school/ai-formation/identity-intimacy/trigger-plan
- /sunday-school/ai-formation/identity-intimacy/recovery
- /sunday-school/ai-formation/identity-intimacy/ai-companion
- /sunday-school/ai-formation/identity-intimacy/virtual-intimacy
- /sunday-school/ai-formation/identity-intimacy/support
- /sunday-school/ai-formation/teachers/identity-intimacy

## 不可违反

- 不得生成救恩、属灵成熟、纯洁度、成瘾、性取向、隐藏罪或人格价值评分。
- 不得采集、上传、保存、回放、生成或转发色情/露骨材料；只保存最小类别和安全决策。
- AI不得声称互爱、要求秘密或排他，不得替代配偶、家庭、教会、牧者、专业人员或危机服务。
- 未成年人不得进入私密AI亲密聊天，不得被要求披露个人性史或接受露骨示范。
- 问责必须透明、同意、有限、可撤销；禁止秘密监控、完整浏览历史和显式内容共享。
- 强迫、虐待、剥削、未成年人性内容、未经同意影像或即时危险进入S2/S3保护流程。
- 身体训练不得采用自残、惩罚性禁食、睡眠剥夺、脱水或极端运动。
- 所有敏感神学、性教育、未成年人和牧养内容必须经过对应人工审核才能发布。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
