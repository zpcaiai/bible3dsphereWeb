# Codex 实施提示词 — Batch 09

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-curriculum-teacher-engine-orchestrator
```

## 目标

把 **主日学课程、课时、教师讲义、学生手册与审核发布引擎** 作为 `sunday_school.ai_formation` 的 Batch 09 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 发现真实课程/CMS/审核架构
2. 实现12份Schema和迁移
3. 实现课程组合与时长变体
4. 实现经文/神学/权利审核
5. 实现教师讲义和学生材料
6. 实现讨论、情境和家庭延伸
7. 实现教师观察边界
8. 实现多角色发布和回滚
9. 导入模板并完成全套测试

## 推荐路由

- /sunday-school/ai-formation/teachers/curriculum
- /sunday-school/ai-formation/teachers/curriculum/courses
- /sunday-school/ai-formation/teachers/curriculum/lessons
- /sunday-school/ai-formation/teachers/curriculum/scripture-review
- /sunday-school/ai-formation/teachers/curriculum/guides
- /sunday-school/ai-formation/teachers/curriculum/materials
- /sunday-school/ai-formation/teachers/curriculum/discussions
- /sunday-school/ai-formation/teachers/curriculum/scenarios
- /sunday-school/ai-formation/teachers/curriculum/review
- /sunday-school/ai-formation/teachers/curriculum/publish

## 不可违反

- AI可以起草和建议，但不得批准、自动发布、静默重排正式课程或把未审核内容展示给学习者。
- 每个经文锚点必须核验引用类型、译本、上下文、应用权威层级和版权；不得以模型记忆作文本源。
- 教师记录只能是可观察学习信号；不得推断救恩、信心、动机、诊断、隐藏罪或用于公开排名。
- 学生材料必须声明回应可见性和保存范围；禁止私密披露要求、属灵答案评分和不必要自由文本。
- 讨论题必须可跳过、非诱导、允许不确定和多种解释；禁止预设认罪和同伴压力。
- 情境练习使用虚构案例、非露骨内容和安全出口，不要求真实创伤、性史或私密经历。
- 家庭延伸默认可选且有替代，不得要求秘密监控或使不安全家庭中的学习者受罚。
- 发布必须多角色、版本绑定、职责分离、证据齐全且可回滚；模型不能成为审批者。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
