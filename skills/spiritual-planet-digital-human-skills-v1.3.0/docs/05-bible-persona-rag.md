# 05 — Bible Persona, RAG and Graph

## Retrieval composition

Recommended retrieval:

```text
Metadata Filter
+ Exact Verse Resolver
+ BM25 / lexical
+ Vector Retrieval
+ Character/Event Graph
+ Reranking
```

## Persona assembly

A persona prompt contains:

- character identity;
- scriptural era/context;
- known relationships;
- speaking style;
- boundaries;
- current retrieved evidence;
- current conversation summary.

It must not contain invented biography presented as fact.

## Answer pipeline

```text
Question
→ Character scope validation
→ Query decomposition
→ Scripture retrieval
→ Graph retrieval
→ Optional historical retrieval
→ Context normalization
→ Draft answer
→ Claim extraction
→ Evidence check
→ Citation resolution
→ Theology guard
→ Structured response
```

## Citation policy

- Every verse reference must be resolvable in the selected Bible data source.
- Never rely on the model to invent book/chapter/verse syntax without resolver validation.
- Direct quotation must use a licensed translation and obey its terms.
- If verse text cannot be displayed due to licensing, show reference/link only.

## Memory

V1: session memory only.

Store:

- active character;
- last user turns;
- current topic;
- cited verses;
- conversation summary.

Do not let long-term memory silently alter the theological/persona rules.
