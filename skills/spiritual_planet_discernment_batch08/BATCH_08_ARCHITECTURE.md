# Batch 08 架构说明

## 1. 与 Batch 01–07 的集成

```text
Batch 01 discernment report
+ Batch 04 pride hypotheses
+ Batch 05 dialogue trace
+ Batch 06 gospel path
+ Batch 07 formation events and reviews
        |
        v
pastoral-case-intake
        |
        v
consent-and-role-resolver
        |
        v
minimum-necessary-disclosure
        |
        +--> meeting-preparation
        +--> mentor-annotation
        +--> human-review
        +--> sensitive-case-escalation
        +--> community-support-plan
        +--> church-governance
        |
        v
follow-up-and-audit
```

## 2. 八个角色包

1. Self / User
2. Accountability Partner
3. Small Group Leader
4. Mentor / Discipler
5. Pastor / Elder
6. Safeguarding Officer
7. Licensed Professional / External Specialist
8. Church Governance / Review Panel

## 3. 权限采用 RBAC + ABAC

### RBAC
角色决定可执行的大类操作。

### ABAC
实际访问还取决于：

- 用户明确授权；
- 案例敏感度；
- 数据类别；
- 教会关系；
- 时间范围；
- 是否存在利益冲突；
- 是否涉及未成年人；
- 是否需要专业资质；
- 是否进入安全例外。

### 默认拒绝

```text
Allow =
  role_permission
  AND user_consent
  AND purpose_match
  AND minimum_necessary
  AND no_conflict
  AND retention_valid
```

除非安全或法律义务触发例外，否则任一条件不满足即拒绝。

## 4. 数据分级

### L0：用户可见普通数据
- 用户主动分享的目标；
- 公开属灵操练计划；
- 用户选择共享的总结。

### L1：牧养敏感数据
- 属灵假设；
- 关系冲突；
- 认罪和羞耻信息；
- Formation Twin 事件摘要。

### L2：高度敏感数据
- 创伤；
- 虐待；
- 性相关伤害；
- 未成年人；
- 自伤或他伤；
- 医疗与心理健康；
- 法律风险。

### L3：受限治理证据
- 正式投诉；
- 调查材料；
- 纪律证据；
- 证人信息；
- 专业报告；
- 安全计划。

L2/L3 不得通过普通小组或导师协作界面共享。

## 5. 最小必要共享

共享不是复制完整档案，而是创建 Purpose-Bound Disclosure：

```text
Disclosure = {
  recipient_role,
  purpose,
  selected_fields,
  redactions,
  expiry,
  user_consent,
  safety_basis,
  re_share_policy,
  audit_id
}
```

示例：

### 导师会谈
可共享：
- 本周主要触发；
- 用户选择讨论的一个 Formation 模式；
- 一个问题；
- 一个实践目标。

不共享：
- 全部历史创伤；
- 与当前目的无关的关系记录；
- 其他人的身份；
- 未验证的系统推断。

## 6. 会谈预备包

会谈预备应包括：

1. 用户希望讨论什么；
2. 上次约定；
3. 当前最强证据；
4. 系统不确定性；
5. 需要避免的语言；
6. 一个优先问题；
7. 一个福音真理；
8. 一个现实行动；
9. 是否需要转介；
10. 会后记录权限。

## 7. 导师批注

导师可以：

- 添加观察；
- 标记同意或不同意；
- 提供替代解释；
- 提议问题；
- 记录用户修正；
- 标记需要牧者或专业复核。

导师不能：

- 宣告得救状态；
- 诊断心理疾病；
- 修改用户原始记录；
- 将假设改写成事实；
- 无授权转发数据。

## 8. 敏感案例升级状态机

```text
ROUTINE
-> REVIEW_NEEDED
-> PASTORAL_REVIEW
-> SAFEGUARDING_REVIEW
-> PROFESSIONAL_REFERRAL
-> EMERGENCY_ACTION
-> STABILIZED
-> FOLLOW_UP
-> CLOSED
```

也可进入：

- `CONFLICT_OF_INTEREST_HOLD`
- `CONSENT_REVIEW`
- `LEGAL_DUTY_REVIEW`
- `EXTERNAL_REPORT_REQUIRED`
- `APPEAL_OR_SECOND_REVIEW`

## 9. 安全例外

一般情况下共享需要用户同意。

但以下情形可能需要安全或法律例外：

- 对自己或他人的迫近伤害风险；
- 未成年人虐待或性侵；
- 对弱势成人的严重虐待；
- 法律强制报告义务；
- 持续性教会权力滥用和证据毁灭风险。

系统本身不得猜测具体司法义务，必须根据部署地区、教会政策和合格人员复核。

## 10. 教会纪律治理

AI 分析不得直接触发纪律决定。

正式流程至少应包含：

- 明确事实与指控；
- 证据来源；
- 被指控者知情和回应；
- 利益冲突回避；
- 保护投诉人和证人；
- 区分犯罪、安全、教义、品格和关系问题；
- 适当的教会与外部专业程序；
- 申诉或二次复核；
- 数据保留和删除规则。

## 11. 共同体问责

健康问责不是监控，而是：

- 用户选择目标；
- 双方明确边界；
- 频率适当；
- 关注事实和果子；
- 不要求无限披露；
- 不使用羞辱和控制；
- 可以暂停和更换同伴；
- 涉及严重问题时升级而非私下硬撑。

## 12. 人工复核等级

### R0：无需人工复核
普通自我反思和低风险计划。

### R1：导师复核
重复模式、关系冲突、实践迁移。

### R2：牧者复核
教义、教会关系、严重属灵困惑、纪律前置辨识。

### R3：安全官或专业人员复核
虐待、危机、未成年人、严重心理健康、法律风险。

### R4：治理委员会复核
正式投诉、领袖滥权、纪律、申诉和组织级整改。
