# Batch 04 架构说明

## 1. 与 Batch 01–03 的关系

```text
Batch 01 claim/evidence extractor
  -> Batch 03 public evidence and persona separation
  -> Batch 04 observation normalizer
  -> pride signal extractor
  -> 9 hypothesis packs
  -> hypothesis composer
  -> counter-evidence planner
  -> trigger-response-fruit mapper
  -> longitudinal validator
  -> Socratic self-mirror planner
  -> gospel identity re-anchoring
  -> pastoral safety guardian
  -> integrated report
```

## 2. 九个基础模型

### A. 认知自高
“我更清楚、更理性、更不可能错”，常表现为拒绝可证伪性、选择性怀疑、轻视普通人和把知识当作身份。

### B. 能力称义
“我的价值取决于能力、效率、成就和不可替代性”，常表现为无法接受失败、慢者或依赖。

### C. 道德自义
“我是正确的一方，因此无需同样被审判”，常表现为双重标准、定罪快感和缺少悔改能力。

### D. 受害者无罪化
“我受过伤，所以我在当前冲突中必然无罪”，需要同时承认真实伤害与持续的个人责任。

### E. 控制主权
“只有我掌控，事情才安全”，常把责任、谨慎和计划绝对化为不容他人、不容未知、不容神护理的控制。

### F. 群体优越
“因为我属于这个群体，所以我天然更正义、更聪明或更有价值”，包括阶级、民族、政治、性别、专业和宗派群体。

### G. 属灵骄傲
“我的知识、恩赐、经历、服侍或纪律证明我比别人更属灵”，包括启示优越、神学优越、事工成功称义。

### H. 伪谦卑
以自我贬低、拒绝恩赐、持续否认肯定或展示软弱来获得注意、控制期待或避免责任。

### I. 弥赛亚自我形象
“如果没有我，一切就会崩溃；我必须拯救组织、家庭、教会或社会”，常与控制、能力称义和属灵骄傲组合。

## 3. 假设对象

```text
PrideHypothesis = {
  observation,
  pattern_id,
  scope,
  evidence_level,
  confidence,
  alternative_explanations,
  counter_evidence,
  triggering_conditions,
  reinforcing_rewards,
  relational_costs,
  spiritual_interpretation,
  falsification_plan,
  review_status
}
```

## 4. 组合而非标签

系统不输出：

```text
这个人就是道德自义型。
```

而输出：

```text
在公开材料和当前场景中，出现了与“道德自义”和“群体优越”
相一致的若干信号；目前证据为 H2。可能替代解释包括急性压力、
表达压缩和对真实不公的抗议。需要观察其面对反证、同阵营错误
和自身责任时的反应，才能提高或降低该假设。
```

## 5. 证据等级 H0–H4

- `H0`：纯猜测；
- `H1`：单一模糊信号；
- `H2`：多个一致信号，但有强替代解释；
- `H3`：跨场景重复，并在反证出现时仍持续；
- `H4`：跨时间、跨关系、跨压力情境稳定，并有本人自述或可靠纵向证据。

H0–H2 不得写成稳定人格结论。

## 6. 假设生命周期

```text
PROPOSED
-> CLARIFYING
-> TESTING
-> SUPPORTED | WEAKENED | FALSIFIED
-> FORMATION_PLAN
-> REVIEWED
```

任何阶段都允许：
- `INSUFFICIENT_EVIDENCE`
- `PASTORAL_SAFETY_HOLD`
- `HUMAN_REVIEW_REQUIRED`

## 7. 组合规则

典型组合：

```text
能力称义 + 控制主权
-> 不可替代者模式

道德自义 + 群体优越
-> 阵营无罪模式

属灵骄傲 + 弥赛亚自我形象
-> 属灵救世主模式

伪谦卑 + 能力称义
-> 隐蔽荣耀交换模式

受害者无罪化 + 道德自义
-> 伤害即绝对正当模式
```

组合只是解释模板，不是新的固定人格类型。

## 8. 福音校正轴

每个模式都从以下维度重新安置：

- 身份：从表现、正确、控制或受害身份转向在基督里被接纳；
- 称义：从自我证明转向因信称义；
- 荣耀：从被看见转向以基督为荣耀；
- 能力：从不可替代转向管家式忠心；
- 权柄：从控制转向服侍；
- 群体：从优越转向同为蒙恩罪人；
- 软弱：从羞耻或表演转向在恩典中真实；
- 救主：从“必须由我拯救”转向基督已经是救主。
