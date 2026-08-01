# 属灵星球 · 主日学 Tab
## AI时代心意更新与家庭门训 — Batch 10
### 情境模拟、选择—后果—恩典—修复与苏格拉底门训运行时

把手机失控、AI代写、色情暴露、同伴排斥、网红崇拜、家庭冲突、信仰怀疑、AI伴侣、成绩失败、过度控制等转化为可审核、可暂停、非操控的选择式情境运行时。

## 依赖

依赖 Batch 01–09，复用课程引擎、安全门、身份/欲望/家庭/儿童/青少年内容和审核发布。

## 安装

```bash
cp -R .agents/skills /path/to/spiritual-planet/.agents/
```

把 `AGENTS.md.snippet` 合并到仓库根目录或主日学模块目录的 `AGENTS.md`，然后在仓库根目录显式调用：

```text
$spiritual-planet-scenario-runtime-orchestrator
```

## 推荐产品路由

```text
/sunday-school/ai-formation/scenarios
/sunday-school/ai-formation/scenarios/library
/sunday-school/ai-formation/scenarios/run/:scenarioId
/sunday-school/ai-formation/scenarios/session/:sessionId
/sunday-school/ai-formation/scenarios/debrief/:sessionId
/sunday-school/ai-formation/teachers/scenarios
/sunday-school/ai-formation/teachers/scenarios/author
/sunday-school/ai-formation/teachers/scenarios/review
/sunday-school/ai-formation/teachers/scenarios/benchmarks
```

## Skills

- `$spiritual-planet-scenario-runtime-orchestrator` — Scenario Runtime Orchestrator
- `$christian-scenario-authoring` — Formation Scenario Authoring
- `$christian-scenario-runtime` — Scenario Runtime State Machine
- `$christian-trigger-state-simulation` — Trigger–State Simulation
- `$christian-choice-consequence-engine` — Choice and Consequence Engine
- `$christian-scripture-grace-intervention` — Scripture, Grace and Repair Intervention
- `$christian-socratic-scenario-branching` — Socratic Scenario Branching
- `$christian-scenario-facilitator` — Scenario Facilitator Tools
- `$christian-scenario-safety-gate` — Scenario Safety Gate
- `$christian-scenario-debrief` — Scenario Debrief
- `$christian-scenario-benchmark` — Scenario Benchmark and Golden Runs
- `$scenario-runtime-course-integrator` — Scenario Runtime UI Integrator

## 本批次硬边界

1. 所有情境必须虚构、非露骨、可跳过且经过相应神学/牧养/儿童安全审核；不得要求学习者重演真实创伤。
2. 运行时只保存版本、节点、选择和状态，不保存原始自由文本，不根据路径建立人格、风险或属灵画像。
3. 选择节点不得用羞耻、倒计时、预设唯一“敬虔答案”或隐藏惩罚操控学习者。
4. 后果是带不确定性的可能果子，不是预言；不得生成未来行为、救恩或道德价值评分。
5. 经文/恩典介入必须同时保留真理、责任、修复和帮助；禁止廉价恩典、纯定罪或“神告诉你”式私人神谕。
6. 苏格拉底分支必须允许跳过、不确定和替代解释，禁止强迫继续、诱导认罪和采集私密历史。
7. 真实安全披露必须退出角色扮演；教师不得公开羞辱、承诺绝对保密或做取证式追问。
8. 合成基准只证明工程行为，不得宣称真实属灵成长、临床效果或生产安全已获证明。

## 交付规模

- 12 个 Codex Skills；
- 12 个 Draft 2020-12 JSON Schema；
- 11 份参考政策/蓝图；
- 6 份种子、矩阵、模板或 Analytics 资产；
- 32 个实践/控制项；
- 8 个课程单元、20 节课；
- 20 个情境或红队场景；
- Skill 路由评测、行为安全评测、静态验证脚本和实施清单。

## 静态验证

```bash
python scripts/validate-batch10.py
```

随后必须在真实属灵星球仓库中运行原生 lint、typecheck、unit、integration、migration、E2E、a11y、安全、内容审核和部署验收。静态校验只证明技能包内部结构与约束一致，不代表真实应用已经上线。
