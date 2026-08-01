# Batch 09 架构说明

## 1. 与 Batch 01–08 的集成

```text
Batch 01 worldview and discernment claims
+ Batch 04 spiritual hypotheses
+ Batch 05 dialogue questions
+ Batch 06 gospel doctrine paths
+ Batch 08 pastoral review
        |
        v
theology-query-normalizer
        |
        v
scripture-context-resolver
        |
        +--> original-language-analysis
        +--> literary-historical-context
        +--> canonical-redemptive-history
        +--> biblical-and-systematic-theology
        +--> historical-and-denominational-theology
        |
        v
citation-provenance-builder
        |
        v
scripture-misuse-detector
        |
        v
auditable-rag-evidence-graph
        |
        v
answer / report / pastoral review packet
```

## 2. 十二个知识域

1. Canonical Scripture Context
2. Literary Genre & Discourse
3. Historical-Cultural Context
4. Hebrew Language & Grammar
5. Greek Language & Grammar
6. Lexical Semantics & Corpus Usage
7. Canonical and Redemptive History
8. Biblical Theology
9. Systematic Doctrine
10. Historical Theology
11. Denominational Traditions
12. Citation, Rights & Evidence Graph

## 3. 释经层级

### Verse
词句和语法。

### Paragraph
论证、叙事单位、诗歌段落或预言单元。

### Book
作者目的、结构、主题、受众和历史情境。

### Testament
约、国度、圣殿、祭司、智慧、弥赛亚、圣灵等大主题。

### Canon
创造—堕落—应许—以色列—基督—教会—新创造。

### Doctrine
由多处经文、正典结构和教会历史共同形成。

系统不得直接：

```text
单节经文 -> 无上下文 -> 完整教义结论
```

## 4. 原文分析标准

原文分析至少考虑：

- manuscript or critical text edition；
- lemma；
- morphology；
- syntax；
- phrase and clause role；
- semantic domain；
- author-specific usage；
- Septuagint / Second Temple usage where relevant；
- textual variants；
- discourse context；
- translation options；
- confidence and limitations。

禁止：

- 词根谬误；
- Strong 编号等同词义；
- 把所有可能词义同时塞入一处经文；
- 依据现代英语或中文相似词推断原义；
- 未说明文本异文就断言唯一读法。

## 5. 救赎历史路径

```text
Creation
-> Fall
-> Covenant Promise
-> Patriarchs
-> Exodus and Law
-> Kingdom and Temple
-> Exile and Prophetic Hope
-> Christ's Incarnation, Death and Resurrection
-> Spirit and Church
-> Mission among Nations
-> Return of Christ
-> Resurrection and New Creation
```

任何经文的基督中心解释都必须避免：

- 跳过原始历史意义；
- 把每个细节都寓意化；
- 把基督中心等同任意联想；
- 否定旧约作者和原始受众。

## 6. 教义层级

### D1：福音与大公核心
三一、创造、堕落、基督神人二性、十架、复活、恩典、圣灵、教会、再来与复活。

### D2：传统内重要差异
称义表达、圣礼、洗礼、教会治理、成圣、恩赐、预定、代赎模型强调。

### D3：次要与开放问题
末世次序、某些礼仪、非核心解释传统。

系统必须标记：

```text
claim_tier
tradition_scope
consensus_level
source_basis
```

## 7. 历史神学

历史神学知识节点包括：

- 时代；
- 人物；
- 教会会议；
- 信经；
- 争议；
- 异端或错误；
- 回应；
- 传统影响；
- 原始文本来源；
- 现代学术解释。

不得只依赖现代二手摘要。

## 8. 宗派差异矩阵

每个议题至少记录：

- Reformed / Presbyterian
- Lutheran
- Anglican
- Wesleyan / Methodist
- Baptist
- Pentecostal / Charismatic
- Roman Catholic
- Eastern Orthodox
- other configured traditions

矩阵不是排名器，而是：

- 显示共同核心；
- 说明差异在哪里；
- 列出各自主要经文与历史依据；
- 标记内部多样性；
- 避免把一个代表人物等同整个传统。

## 9. 引文溯源

每条引文需要：

```text
source_id
work_title
author
edition
publisher
year
page_or_locator
quote_text
language
translation_status
rights_status
extraction_method
verification_status
```

禁止：

- 杜撰页码；
- 把二手引文当一手原文；
- 引文内容与来源不匹配；
- 省略版本差异；
- 超出合理引用长度。

## 10. 经文误用检测

检测类型：

- proof_texting；
- context_omission；
- genre_error；
- speaker_confusion；
- descriptive_prescriptive_confusion；
- promise_transfer_error；
- audience_transfer_error；
- word_study_fallacy；
- allegorical_overreach；
- prosperity_gospel_use；
- political_nationalization；
- abusive_authority_use；
- victim_blame_use；
- anti_medical_or_anti_professional_use；
- eschatological_date_setting。

检测结果是风险提示，不自动判定恶意。

## 11. 可审计 RAG

RAG 不只返回文段，还生成图谱：

```text
Query
-> RetrievalCandidate
-> SourceDocument
-> Passage
-> Claim
-> Support / Contradict / Qualify
-> DoctrineNode
-> TraditionNode
-> Citation
-> GeneratedStatement
```

每条生成陈述必须记录：

- 哪些证据支持；
- 是否存在反证；
- 检索分数；
- 重排分数；
- 来源质量；
- 版本；
- 生成模型；
- Prompt 版本；
- 人工修订。

## 12. 版权与授权

知识库必须区分：

- public_domain；
- open_license；
- licensed_internal；
- user_owned；
- quotation_only；
- metadata_only；
- prohibited_for_embedding；
- prohibited_for_generation。

不得默认抓取和嵌入受版权保护的整本注释书、词典或神学著作。
