# 属灵星球 · 主日学 Tab
## AI时代心意更新与家庭门训 — Batch 09
### 主日学课程、课时、教师讲义、学生手册与审核发布引擎

把前八批的形成内容转化为可复用的Course—Unit—Lesson—Activity体系，支持30/45/60/90分钟课程、经文审核、教师讲义、学生手册、讨论、情境、家庭延伸和多角色发布治理。

## 依赖

依赖 Batch 01–08，复用所有内容权威、安全、年龄、家庭、课程轨道、经文核验和权限契约。

## 安装

```bash
cp -R .agents/skills /path/to/spiritual-planet/.agents/
```

把 `AGENTS.md.snippet` 合并到仓库根目录或主日学模块目录的 `AGENTS.md`，然后在仓库根目录显式调用：

```text
$spiritual-planet-curriculum-teacher-engine-orchestrator
```

## 推荐产品路由

```text
/sunday-school/ai-formation/teachers/curriculum
/sunday-school/ai-formation/teachers/curriculum/courses
/sunday-school/ai-formation/teachers/curriculum/lessons
/sunday-school/ai-formation/teachers/curriculum/scripture-review
/sunday-school/ai-formation/teachers/curriculum/guides
/sunday-school/ai-formation/teachers/curriculum/materials
/sunday-school/ai-formation/teachers/curriculum/discussions
/sunday-school/ai-formation/teachers/curriculum/scenarios
/sunday-school/ai-formation/teachers/curriculum/review
/sunday-school/ai-formation/teachers/curriculum/publish
```

## Skills

- `$spiritual-planet-curriculum-teacher-engine-orchestrator` — Curriculum and Teacher Engine Orchestrator
- `$christian-course-domain-model` — Course Domain Model
- `$christian-lesson-generator` — Reviewed Lesson Generator
- `$christian-scripture-anchor-review` — Scripture Anchor Review
- `$christian-teacher-guide-generator` — Teacher Guide Generator
- `$christian-student-material-generator` — Student Material Generator
- `$christian-discussion-prompt-engine` — Discussion Prompt Engine
- `$christian-scenario-exercise-builder` — Scenario Exercise Builder
- `$christian-family-extension-builder` — Family Extension Builder
- `$christian-teacher-observation` — Teacher Observation Boundaries
- `$christian-content-review-workflow` — Content Review and Publication
- `$curriculum-teacher-course-integrator` — Curriculum Teacher UI Integrator

## 本批次硬边界

1. AI可以起草和建议，但不得批准、自动发布、静默重排正式课程或把未审核内容展示给学习者。
2. 每个经文锚点必须核验引用类型、译本、上下文、应用权威层级和版权；不得以模型记忆作文本源。
3. 教师记录只能是可观察学习信号；不得推断救恩、信心、动机、诊断、隐藏罪或用于公开排名。
4. 学生材料必须声明回应可见性和保存范围；禁止私密披露要求、属灵答案评分和不必要自由文本。
5. 讨论题必须可跳过、非诱导、允许不确定和多种解释；禁止预设认罪和同伴压力。
6. 情境练习使用虚构案例、非露骨内容和安全出口，不要求真实创伤、性史或私密经历。
7. 家庭延伸默认可选且有替代，不得要求秘密监控或使不安全家庭中的学习者受罚。
8. 发布必须多角色、版本绑定、职责分离、证据齐全且可回滚；模型不能成为审批者。

## 交付规模

- 12 个 Codex Skills；
- 12 个 Draft 2020-12 JSON Schema；
- 11 份参考政策/蓝图；
- 6 份种子、矩阵、模板或 Analytics 资产；
- 30 个实践/控制项；
- 8 个课程单元、20 节课；
- 12 个情境或红队场景；
- Skill 路由评测、行为安全评测、静态验证脚本和实施清单。

## 静态验证

```bash
python scripts/validate-batch09.py
```

随后必须在真实属灵星球仓库中运行原生 lint、typecheck、unit、integration、migration、E2E、a11y、安全、内容审核和部署验收。静态校验只证明技能包内部结构与约束一致，不代表真实应用已经上线。
