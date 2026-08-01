# Batch 02 架构

## 1. 与 Batch 01 的接入点

```text
claim-evidence-extractor
  -> domain-pack-matcher
  -> domain-pack-composer
  -> worldview-frame-mapper
  -> pride-signal-detector
  -> socratic-question-planner
  -> gospel-bridge-builder
```

## 2. 运行流程

1. 把主张向量化或交给结构化分类模型；
2. 从 Registry 召回 Top-K Packs；
3. 运行 include / exclude / counter-evidence 检查；
4. 输出 0..N 个候选 Pack 与匹配解释；
5. 当多个包同时成立时生成 Composite Worldview；
6. 合并重复的自高假设、欲望链和问题；
7. 保留每个结论的来源 Pack 与版本；
8. 低置信度时只提澄清问题，不进入深层属灵判断。

## 3. 复合思潮示例

“购买课程、打造个人品牌、成为高价值男性即可获得自由和爱情”可能组合：

- consumerism
- meritocracy_successism
- self_optimization_hustle
- manosphere_status_masculinity
- influencer_attention_culture

系统不得选择一个标签覆盖全部，而应说明每个 Pack 解释了哪一部分。

## 4. 匹配评分

建议评分：

```text
score = semantic_similarity * 0.35
      + claim_rule_match   * 0.25
      + salvation_match    * 0.20
      + telos_match        * 0.10
      + pride_match        * 0.10
      - exclusion_penalty
      - counter_evidence_penalty
```

阈值建议：

- >= 0.78：high candidate
- 0.58–0.77：mixed candidate
- 0.40–0.57：clarification only
- < 0.40：do not classify

生产系统应通过评测校准，不能把这些初始阈值视为神学真理。

## 5. 版本治理

每个 Pack 独立遵循 SemVer：

- Patch：措辞、测试、无语义变更；
- Minor：新增规则、问题或桥接路径；
- Major：定义、边界或神学立场发生不兼容变更。

报告必须记录 Pack ID、版本和命中的证据片段。
