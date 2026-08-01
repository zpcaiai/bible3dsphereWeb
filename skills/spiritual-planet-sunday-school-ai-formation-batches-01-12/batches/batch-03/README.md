# 属灵星球 · 主日学 Tab
## AI时代心意更新与家庭门训 — Batch 03
### AI认知外包、算法世界观与属灵分辨系统

Batch 03 承接 Batch 01 的神学、安全和主日学模块基础，以及 Batch 02 的成人自我治理、注意力操练和 Formation Plan，建立一个从“我要让 AI 做什么”到“我怎样验证、怎样保留人的责任、怎样识别算法正在塑造什么爱欲”的完整属灵分辨闭环：

```text
声明使用意图与任务风险
→ 区分 AI 的工具角色、建议角色与禁止替代角色
→ 标记不可外包的人类/属灵行动
→ 拆分事实、解释、神学推论和意见
→ 核查来源、时效、冲突与不确定性
→ 核验经文引用、译本、上下文与版权边界
→ 对祷告、灵修、讲章和牧养内容执行人工责任门
→ 分析算法目标函数、商业激励、人论、终极目的和救赎承诺
→ 识别媒介重复如何训练欲望、情绪和身份
→ 通过非操控性的苏格拉底问题形成自己的判断
→ 记录使用、验证、果子和下一条边界
→ 周期复盘：保留、改变、停止或转向真人支持
```

## 依赖

必须先安装并实现 Batch 01 和 Batch 02。Batch 03 复用：

- `sunday_school.ai_formation` 模块与内容审核；
- `FormationContentBlockV1` 的四层权威标签；
- `LearnerContextV1` 与 S0–S3 牧养安全门；
- 成人轨道、Practice Catalog、Formation Plan、Check-in 与 Review；
- RBAC、多租户、删除导出、i18n、Analytics、A11y 和测试框架。

## 安装

```bash
cp -R .agents/skills /path/to/spiritual-planet/.agents/
```

将 `AGENTS.md.snippet` 合并至仓库根目录或主日学模块目录的 `AGENTS.md`，然后在仓库根目录显式调用：

```text
$spiritual-planet-ai-discernment-orchestrator
```

## 推荐产品路由

```text
/sunday-school/ai-formation/discernment
/sunday-school/ai-formation/discernment/ai-role
/sunday-school/ai-formation/discernment/non-outsourcable
/sunday-school/ai-formation/discernment/verify
/sunday-school/ai-formation/discernment/scripture-check
/sunday-school/ai-formation/discernment/spiritual-content
/sunday-school/ai-formation/discernment/algorithm-lab
/sunday-school/ai-formation/discernment/media-desire
/sunday-school/ai-formation/discernment/socratic
/sunday-school/ai-formation/discernment/learning-integrity
/sunday-school/ai-formation/discernment/journal
/sunday-school/ai-formation/discernment/review
/sunday-school/ai-formation/teachers/ai-discernment
```

## 本批次硬边界

1. AI 可以辅助表达、检索、比较、生成问题和批评草稿，但不是终极权威、启示来源或良心主体。
2. AI 不得替人祷告、悔改、信靠、顺服、立约、承担道德责任、修复关系或履行教会职分。
3. 当前事实、高风险事实、统计数字和直接引语必须有可追溯来源；AI 自称“确定”不构成证据。
4. 经文引用必须区分直接引语、意译、暗引和仅引用位置；不得凭模型记忆自动发布。
5. AI 生成祷告词、灵修摘要、查经问题和讲章草稿只能作为辅助；讲员、教师和使用者保留释经、判断、披露和牧养责任。
6. 产品不得输出“神告诉你”“这是神对你的预言”，不得自动判断救恩、属灵成熟、呼召或隐藏的罪。
7. 算法世界观分析必须列出证据与不确定性，不得把所有商业技术、世俗文化或不同意见自动定性为邪恶。
8. 苏格拉底对话不得诱导认罪、制造羞耻、逼迫给出预设答案或采集未成年人秘密。
9. 学术和课程使用必须尊重教师/机构政策；AI 帮助不得冒充无辅助原创。
10. 原始提示、AI 完整回答、完整浏览历史、长篇受版权保护经文、私密反思和媒体内容默认不落库、不进 Analytics。

## 交付

- 12 个 Codex Skills；
- 13 个 JSON Schema；
- 12 份架构、神学、安全、验证和隐私参考文档；
- 7 份课程、实践、场景、边界、来源、教师卡和 Analytics 资产；
- 44 个属灵分辨实践；
- 10 单元、24 课课程种子；
- 12 个算法/AI 场景；
- 60 条 Skill 路由评测与 24 条行为安全评测；
- 静态验证脚本、实施提示、清单和版本说明。

## 验证

```bash
node scripts/validate-batch03.mjs
```

随后必须在真实属灵星球仓库中运行原生 lint、typecheck、unit、integration、e2e、a11y、migration 和内容审核测试。
