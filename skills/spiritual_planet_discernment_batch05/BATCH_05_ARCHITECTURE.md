# Batch 05 架构说明

## 1. 对话阶段

```text
ORIENT
-> CLARIFY
-> STEELMAN
-> EVIDENCE
-> ASSUMPTION
-> COUNTEREXAMPLE
-> CONSEQUENCE
-> SELF_MIRROR
-> HEART
-> WORSHIP
-> LAW
-> GOSPEL_INVITATION
-> GOSPEL_EXPLORATION
-> RESPONSE
-> REVIEW
```

阶段并非必须全部经过。系统应根据用户目标、信仰背景、同意范围和安全状态选择路径。

## 2. 对话状态机

```text
CREATED
-> CONSENT_ROUTED
-> ACTIVE
-> QUESTION_ASKED
-> ANSWER_RECEIVED
-> ANSWER_EVALUATED
-> HYPOTHESIS_UPDATED
-> NEXT_STAGE_SELECTED
-> COMPLETED
```

可随时进入：

- `PAUSED_BY_USER`
- `REPAIR_REQUIRED`
- `SAFETY_HOLD`
- `HUMAN_REVIEW_REQUIRED`
- `EXITED_BY_USER`
- `BLOCKED`

## 3. 每轮协议

每轮只能包含：

1. 最多一句简短反映；
2. 一个核心问题；
3. 可选的“跳过/暂停”出口。

禁止：

- 连续堆叠多个问题；
- 在问题中塞入完整讲道；
- 用“你是否愿意承认你其实……”预设答案；
- 在用户未同意时推进至福音劝服；
- 把对方不同意解释为抗拒圣灵。

## 4. 问题难度

### D0：安全与事实
- 发生了什么？
- 哪句话最能代表你的观点？

### D1：澄清与证据
- 你说“成功”具体指什么？
- 什么证据会使你改变看法？

### D2：假设与反例
- 这个判断依赖什么前提？
- 是否有一个反例能限制这个结论？

### D3：自我镜照与果子
- 你是否对自己采用同样标准？
- 长期相信它会把你变成怎样的人？

### D4：欲望、恐惧和敬拜
- 如果失去这个东西，你最怕它说明什么？
- 什么有限之物正在承担终极重量？

### D5：律法与福音
- 这个标准若照向你自己，你能站立吗？
- 你愿意看看基督如何回应这个困境吗？

难度只能逐步升高。出现防御、羞耻、创伤或宗教强迫时必须降低。

## 5. 抗拒不是单一概念

系统应区分：

- `confusion`：不理解问题；
- `disagreement`：不同意前提；
- `fatigue`：对话疲劳；
- `fear`：担心被定罪；
- `shame_flooding`：羞耻过载；
- `trauma_activation`：创伤触发；
- `scrupulosity`：强迫性罪疚；
- `strategic_evasion`：持续回避明确问题；
- `hostility`：敌意升级；
- `boundary_setting`：用户合理设限。

只有在多轮、跨表达、有充分证据时，才可把“持续回避”作为假设检验信号；不得把拒绝等同于属灵悖逆。

## 6. 良心唤醒

良心唤醒不是制造羞耻，而是帮助用户：

- 看见事实；
- 承认标准不一致；
- 看见行为果子；
- 承认有限和责任；
- 区分罪疚、羞耻和责任；
- 在恩典中面对真相。

## 7. 福音推进协议

```text
用户允许属灵分析
+ 用户明确同意进入福音层
+ 当前无安全阻断
= 可进入 GOSPEL_EXPLORATION
```

福音推进必须包含：

- 用户真实渴望；
- 人的自我称义失败；
- 基督的位格与工作；
- 恩典身份；
- 悔改与信心；
- 圣灵中的新顺服；
- 教会共同体和现实支持。

不得只输出“你要谦卑、认罪、努力改变”。

## 8. 假设检验联动

Batch 04 假设可通过对话被：

- 支持；
- 削弱；
- 否证；
- 暂停；
- 拆分；
- 与其他假设组合。

系统必须记录：

```text
question
-> answer
-> evidence extracted
-> hypothesis impact
-> alternative explanation impact
-> next discriminating question
```
