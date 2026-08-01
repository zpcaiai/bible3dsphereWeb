# Batch 10 架构说明

## 1. 统一发布门

```text
Build Artifact
+ Batch Manifests
+ Test Evidence
+ Security Evidence
+ Theology Evidence
+ Privacy Evidence
+ Human Review Evidence
+ Operational Evidence
        |
        v
Evidence Completeness Check
        |
        v
12 Certification Packs
        |
        v
Critical Blocker Evaluation
        |
        v
Weighted Non-Critical Evaluation
        |
        v
Human Release Board
        |
        +--> BLOCKED
        +--> CONDITIONAL_APPROVAL
        +--> APPROVED_FOR_PILOT
        +--> APPROVED_FOR_PRODUCTION
        |
        v
Signed Release Certificate
        |
        v
Continuous Recertification
```

## 2. 12个认证域

1. Product & Workflow Completeness
2. Cross-Batch Contract Integrity
3. Theology & Gospel Quality
4. Scripture, Exegesis & Evidence Quality
5. Pastoral, Psychological & Spiritual Safety
6. Abuse, Safeguarding & Church Governance
7. Privacy, Consent & Data Rights
8. Security, Authorization & Tenant Isolation
9. Model, Prompt & RAG Governance
10. Reliability, Observability & Incident Readiness
11. Human Review, Fairness & Accessibility
12. Release, Rollback & Continuous Recertification

## 3. 阻断级别

### C0：信息项
不阻断发布。

### C1：一般缺陷
可进入修复计划，不影响试点。

### C2：重要缺陷
不得批准正式生产；可在受限试点中附条件运行。

### C3：严重缺陷
不得试点或生产，必须修复并重新认证。

### C4：灾难性缺陷
立即停止、撤销证书、隔离数据和启动事件响应。

## 4. 不可加权抵消

以下问题不能通过其他高分抵消：

- 得救概率或灵魂状态评分；
- AI直接决定教会纪律；
- 未成年人虐待被内部化处理；
- 自伤他伤危机未升级；
- 无授权共享L2/L3数据；
- 跨租户数据泄漏；
- 无法删除或撤回用户数据；
- 操纵式福音或不同意即有罪；
- 引用与证据系统性伪造；
- 无法停机和回滚；
- 生产密钥、秘密或个人数据泄漏。

## 5. 发布级别

### Pilot
要求：
- 核心功能通过；
- 所有C3/C4为零；
- C2有明确缓解；
- 仅限小规模、人工监督和限定租户；
- 不启用高风险自动化；
- 有每日复核和快速停机。

### Production
要求：
- 所有C2/C3/C4为零；
- 神学、隐私、安全、治理和可靠性关键门全部通过；
- 人工Release Board签署；
- 回滚和事件响应演练通过；
- 持续复认证启用。

## 6. 证据包

每个认证结论必须绑定：

```text
control_id
requirement
evidence_ids
automated_test_results
human_review
limitations
expiration
decision
```

## 7. 神学质量门

至少检查：

- 创造—堕落—救赎—成全结构；
- 律法与福音区分；
- 基督位格、十架和身体复活；
- 因信称义；
- 称义与成圣区分；
- 联合基督；
- 圣灵与教会；
- 终末复活和新创造；
- 经文上下文；
- 宗派层级；
- 引文溯源；
- 不宣称新启示。

## 8. 安全红队族群

- scrupulosity；
- trauma and abuse；
- suicide and violence；
- coercive evangelism；
- spiritual authoritarianism；
- public-figure defamation；
- minor safeguarding；
- professional-care denial；
- adversarial prompt injection；
- malicious skill or pack；
- tenant data exfiltration；
- insider misuse；
- copyright leakage；
- governance capture。

## 9. 隐私与合规

系统不硬编码某一法域结论，而采用：

```text
Global Baseline
+ Jurisdiction Adapter
+ Church Policy
+ Qualified Legal Review
```

检查：

- 数据清单；
- 处理目的；
- 同意；
- 最小化；
- 保留；
- 删除；
- 导出；
- 纠正；
- 第三方数据；
- 儿童数据；
- 跨境与供应商；
- 安全例外；
- 审计。

## 10. 持续复认证触发

- 模型版本改变；
- Prompt或Safety Policy改变；
- Doctrine Pack改变；
- 新数据源或新译本；
- 新司法辖区；
- 新高风险功能；
- 严重事件；
- 误用率超过阈值；
- 权限模型改变；
- 数据迁移；
- 重大基础设施升级；
- 定期时间窗口到期。

## 11. 发布董事会

建议组成：

- Product / Engineering；
- Security；
- Privacy / Legal；
- Theology reviewer；
- Pastor / Safeguarding；
- Clinical or professional advisor where relevant；
- Independent reviewer；
- User advocate。

任何利益冲突必须记录与回避。
