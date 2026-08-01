# 属灵星球 · 主日学 Tab
## AI时代心意更新与家庭门训 — Batch 02
### 攻克己身、注意力治理与数字属灵操练系统

Batch 02 在 Batch 01 的模块基础、神学权威分层、领域模型和 S0–S3 牧养安全门之上，实现成人轨道的第一个完整闭环：

```text
进入成人轨道
→ 恩典与操练导论
→ 可跳过的注意力自评
→ 用户确认 1–3 个优先领域
→ 选择或生成 7/14/30/90 天计划
→ 建立个人 Digital Rule of Life
→ 每日/触发式操练与轻量 Check-in
→ 周期复盘、降级、暂停或调整
```

## 依赖

先安装并实现 Batch 01。Batch 02 复用以下已有能力：

- `sunday_school.ai_formation` 模块注册；
- `FormationContentBlockV1` 权威层级与审核状态；
- `LearnerContextV1`；
- `PastoralSafetyDecisionV1`；
- 神学审核、牧养安全、权限、i18n、Analytics 和主日学 Tab 集成。

## 安装

将 `.agents/skills/` 合并复制到属灵星球仓库根目录：

```bash
cp -R .agents/skills /path/to/spiritual-planet/.agents/
```

将 `AGENTS.md.snippet` 中的规则合并到仓库根目录或相关模块目录的 `AGENTS.md`。

在仓库根目录启动 Codex，显式调用：

```text
$spiritual-planet-self-governance-orchestrator
```

## 推荐 Codex 实现提示

```text
使用 $spiritual-planet-self-governance-orchestrator，
并按需加载本批次全部配套 skills 以及 Batch 01 的神学、领域模型、
牧养安全和主日学集成 skills。

在现有属灵星球项目中实现“AI时代心意更新与家庭门训”成人轨道 Batch 02：
攻克己身、注意力治理与数字属灵操练系统。

先检查 Batch 01 已落地的模块、路由、类型、内容审核、安全门、权限、
i18n、Analytics、数据库与测试，再实现：

1. /sunday-school/ai-formation/adult 成人轨道入口；
2. 恩典先于操练的导论课程；
3. 可跳过、非诊断、无总分的注意力与数字习惯自评；
4. 领域信号与用户确认的 1–3 个优先领域；
5. Practice Catalog；
6. 7/14/30/90 天 Formation Plan；
7. Digital Rule of Life；
8. Digital Sabbath；
9. 睡眠、休息、运动、饮食节律与安全禁食边界；
10. 延迟满足、无聊承受、情绪暂停、网络言语和责任承担操练；
11. 每日 Check-in 与周期 Review；
12. 暂停、降级、修改、删除、导出和自愿分享；
13. Feature Flag、权限、i18n、隐私安全、无障碍和完整测试。

不得创建属灵成熟总分、排行榜、属灵连续打卡、成瘾诊断、
秘密设备监控或把产品默认规则包装为神的命令。
食物禁食只能面向已完成安全门的成年人；任何不适合情形都应自动改为非食物禁食。
完成后报告文件变更、架构决定、迁移、测试结果、隐私边界和未解决风险。
```

## 交付内容

- 11 个 Codex Skills；
- 11 个 JSON Schema；
- 9 份设计、神学、安全、API 与隐私参考文档；
- 4 份种子/示例资产；
- 成人轨道 10 单元、21 课课程种子；
- 35 个数字属灵操练种子；
- 7/14/30/90 天计划模板；
- 48 条 Skill 激活/负向评测与 18 条行为安全评测；
- 静态校验脚本；
- 完整 Codex 实施清单。

## 直接实施

- 完整提示词：`CODEX_IMPLEMENTATION_PROMPT.md`
- Skill 路由索引：`SKILL_INDEX.md`
- Batch 01 兼容契约：`BATCH01_COMPATIBILITY.md`
- 实施清单：`IMPLEMENTATION_CHECKLIST.md`

## 产品路由建议

```text
/sunday-school/ai-formation/adult
/sunday-school/ai-formation/adult/assessment
/sunday-school/ai-formation/adult/priorities
/sunday-school/ai-formation/adult/plan
/sunday-school/ai-formation/adult/practices
/sunday-school/ai-formation/adult/check-in
/sunday-school/ai-formation/adult/review
/sunday-school/ai-formation/adult/rule-of-life
/sunday-school/ai-formation/adult/digital-sabbath
```

## 核心原则

1. 恩典先于操练，身份先于表现。
2. 身体是受造的礼物，不是敌人。
3. 注意力治理是爱与使命的自由，不是单纯降低屏幕时长。
4. 自评只产生“形成信号”，不产生属灵成熟总分、诊断或救恩判断。
5. 环境设计优先于羞耻和纯意志压迫。
6. 计划默认少而可持续：最多 3 个优先领域、每阶段最多 3 个核心操练。
7. 失败触发调整、支持和重新开始，而不是惩罚或公开比较。
8. 教会、牧者、医疗和心理专业支持不可被产品替代。

## 验证

```bash
node scripts/validate-batch02.mjs
```

随后运行属灵星球仓库原生的 lint、typecheck、unit、integration、e2e、a11y 和 migration tests。
