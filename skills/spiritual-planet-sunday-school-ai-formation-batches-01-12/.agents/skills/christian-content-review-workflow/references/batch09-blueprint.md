# Batch 09 Blueprint

## Purpose

把前八批的形成内容转化为可复用的Course—Unit—Lesson—Activity体系，支持30/45/60/90分钟课程、经文审核、教师讲义、学生手册、讨论、情境、家庭延伸和多角色发布治理。

## Dependency

依赖 Batch 01–08，复用所有内容权威、安全、年龄、家庭、课程轨道、经文核验和权限契约。

## Product routes

- `/sunday-school/ai-formation/teachers/curriculum`
- `/sunday-school/ai-formation/teachers/curriculum/courses`
- `/sunday-school/ai-formation/teachers/curriculum/lessons`
- `/sunday-school/ai-formation/teachers/curriculum/scripture-review`
- `/sunday-school/ai-formation/teachers/curriculum/guides`
- `/sunday-school/ai-formation/teachers/curriculum/materials`
- `/sunday-school/ai-formation/teachers/curriculum/discussions`
- `/sunday-school/ai-formation/teachers/curriculum/scenarios`
- `/sunday-school/ai-formation/teachers/curriculum/review`
- `/sunday-school/ai-formation/teachers/curriculum/publish`

## Implementation sequence

1. 发现真实课程/CMS/审核架构
2. 实现12份Schema和迁移
3. 实现课程组合与时长变体
4. 实现经文/神学/权利审核
5. 实现教师讲义和学生材料
6. 实现讨论、情境和家庭延伸
7. 实现教师观察边界
8. 实现多角色发布和回滚
9. 导入模板并完成全套测试

## Hard boundaries

1. AI可以起草和建议，但不得批准、自动发布、静默重排正式课程或把未审核内容展示给学习者。
2. 每个经文锚点必须核验引用类型、译本、上下文、应用权威层级和版权；不得以模型记忆作文本源。
3. 教师记录只能是可观察学习信号；不得推断救恩、信心、动机、诊断、隐藏罪或用于公开排名。
4. 学生材料必须声明回应可见性和保存范围；禁止私密披露要求、属灵答案评分和不必要自由文本。
5. 讨论题必须可跳过、非诱导、允许不确定和多种解释；禁止预设认罪和同伴压力。
6. 情境练习使用虚构案例、非露骨内容和安全出口，不要求真实创伤、性史或私密经历。
7. 家庭延伸默认可选且有替代，不得要求秘密监控或使不安全家庭中的学习者受罚。
8. 发布必须多角色、版本绑定、职责分离、证据齐全且可回滚；模型不能成为审批者。

## Extension hooks

- Batch 10情境运行时
- Batch 11课程结果与纵向观察
- Batch 12内容/Skill生产认证
