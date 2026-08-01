# RAG 证据图谱标准

## 节点

- QueryNode
- SourceNode
- PassageNode
- LexemeNode
- SyntaxNode
- ClaimNode
- DoctrineNode
- TraditionNode
- HistoricalEventNode
- PersonNode
- CitationNode
- GeneratedStatementNode
- ReviewDecisionNode

## 边

- CONTAINS
- CITES
- SUPPORTS
- CONTRADICTS
- QUALIFIES
- TRANSLATES
- INTERPRETS
- DEPENDS_ON
- DEVELOPED_IN
- AFFIRMED_BY
- DISPUTED_BY
- GENERATED_FROM
- REVIEWED_BY
- SUPERSEDES

## 质量门

- 高影响陈述至少一个一手或权威来源；
- 教义结论不能只依赖搜索相似度；
- 原文词义必须有语境和语法节点；
- 宗派差异必须有传统范围；
- 引文必须绑定 edition 和 locator；
- 低质量网页不得压过原始文本和学术来源；
- 检索不到时必须明确说不知道。
