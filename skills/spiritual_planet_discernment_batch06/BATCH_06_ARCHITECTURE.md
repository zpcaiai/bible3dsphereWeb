# Batch 06 架构说明

## 1. 与前五批的接入

```text
Batch 01 desire/idolatry map
+ Batch 02 worldview domain packs
+ Batch 03 cultural virality analysis
+ Batch 04 pride hypotheses
+ Batch 05 dialogue state and consent
        |
        v
Batch 06 gospel-path-context-builder
        |
        v
10 Doctrine Path Packs
        |
        v
personalized-gospel-path-planner
        |
        v
law-gospel-balance-controller
        |
        v
Christ / justification / adoption / union / sanctification
        |
        v
church and eschatological hope
        |
        v
response, practice, review, safety
```

## 2. 十段路径

### 1. 创造秩序
说明人的尊严、身体、关系、工作、权柄、自由和目的来自创造主，而非自我发明。

### 2. 罪与偶像
罪不仅是错误行为，也包括不信、悖逆、自我中心、扭曲敬拜和以受造物代替创造主。

### 3. 律法功用
至少区分：
- 显明神的圣洁和善；
- 抑制罪与保护社会；
- 显明人的罪、堵住自夸；
- 指引被救赎者感恩顺服。

不得把律法当成自我称义阶梯。

### 4. 基督与代赎
必须包含基督的真实神人二性、顺服、生、死、复活、升天和现今掌权。代赎不应只剩一种孤立比喻。

### 5. 因信称义
说明罪人因基督的义被神宣告为义，是借着信心领受，不因行为赚取。

### 6. 被神收纳
从法庭图景推进到家庭图景：信徒在基督里被收纳为儿女，拥有父的爱、产业、管教与亲近。

### 7. 与基督联合
称义、收纳、成圣、复活盼望都不能脱离与基督联合。基督不是外部工具，而是信徒生命根基。

### 8. 圣灵成圣
圣灵使人重生、内住、结出果子、治死罪、更新心意，并在真实操练中塑造人。

### 9. 教会共同体
福音不是纯私人体验。洗礼、圣餐、讲道、彼此相爱、纪律、服侍和群体见证构成门徒生命环境。

### 10. 终末盼望
盼望不是灵魂逃离世界，而是复活、新天新地、审判、公义实现、受造界更新和神与人同住。

## 3. 个性化输入

```text
GospelPathContext = {
  faith_context,
  consent_scope,
  presenting_issue,
  created_good,
  distorted_desire,
  functional_savior,
  pride_hypotheses,
  suffering_and_structural_factors,
  law_risk,
  shame_risk,
  scrupulosity_risk,
  doctrine_familiarity,
  church_context,
  preferred_depth
}
```

## 4. 路径不是固定讲章

示例：

### 能力称义
```text
创造：能力是托付
罪：能力成为称义
律法：绩效不能使人称义
基督：基督的完全顺服
称义：基督的义归给信者
收纳：失败不取消儿女身份
联合：在基督里工作
成圣：学习忠心、委派、安息
教会：接受彼此需要
终末：工作成果不再承受终极重量
```

### 受害者无罪化
```text
创造：人的尊严与公义
罪：受害者与加害者都不能靠自己无罪
律法：不淡化伤害，也不提供报复豁免
基督：受苦者基督与公义审判
称义：无需靠永久清白身份自救
收纳：被父看见和保护
联合：伤害不再是最终身份
成圣：恢复责任、边界与非报复
教会：安全、问责、医治群体
终末：最终公义与身体复活
```

## 5. 律法—福音平衡

系统必须避免两种失败：

### 律法主义
```text
问题 -> 命令 -> 失败 -> 更多命令
```

### 廉价恩典
```text
问题 -> 神爱你 -> 无需悔改和更新
```

正确路径：

```text
神的善
-> 人的真实罪与无能
-> 基督已经完成的工作
-> 借信心白白领受
-> 在联合基督和圣灵中产生新顺服
```

## 6. 教义层级

### Tier 1：福音核心
- 三一神；
- 创造与堕落；
- 基督真实神人二性；
- 十字架与身体复活；
- 恩典、信心、悔改；
- 圣灵与教会；
- 最终审判与复活盼望。

### Tier 2：传统内重要差异
- 代赎模型强调；
- 称义表达；
- 圣礼观；
- 洗礼对象与方式；
- 成圣次序；
- 教会治理；
- 末世次序。

### Tier 3：可保留的次要意见
- 具体末世时间表；
- 某些属灵恩赐持续方式；
- 非核心礼仪与实践差异。

系统不得把 Tier 2、Tier 3 当作判断是否有福音的唯一标准。

## 7. 安全门

- 用户没有同意：只提供一般伦理与世界观分析；
- 宗教强迫：优先赦免确据和停止强迫循环；
- 创伤与虐待：不要求立即和解或恢复接触；
- 危机：停止普通神学路径；
- 教会伤害：允许区分基督、教义真理与错误教会实践；
- 非基督徒：使用邀请性语言，不假设已有信仰承诺。
