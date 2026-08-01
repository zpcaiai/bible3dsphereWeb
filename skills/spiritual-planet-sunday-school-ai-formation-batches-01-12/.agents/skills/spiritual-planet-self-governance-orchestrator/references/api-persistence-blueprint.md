# Batch 02 API 与持久化蓝图

本文件描述逻辑契约。Codex 必须映射到属灵星球现有 API、ORM、命名、审计和多租户模式，不得机械创建第二套基础设施。

## 1. 资源边界

建议资源：

- `adult_assessment_session`
- `formation_signal`
- `formation_plan`
- `practice_checkin`
- `formation_review`
- `digital_rule_of_life`
- `digital_sabbath_plan`
- `body_rhythm_plan`
- `pause_protocol`

Practice Catalog 和课程内容应进入既有内容管理/审核系统，而非普通用户数据表。

## 2. 建议 API 行为

按仓库约定实现等价端点：

```text
GET    /api/sunday-school/ai-formation/adult
GET    /api/sunday-school/ai-formation/adult/practices
POST   /api/sunday-school/ai-formation/adult/assessments
PATCH  /api/sunday-school/ai-formation/adult/assessments/:id
POST   /api/sunday-school/ai-formation/adult/assessments/:id/complete
DELETE /api/sunday-school/ai-formation/adult/assessments/:id

POST   /api/sunday-school/ai-formation/adult/plans
GET    /api/sunday-school/ai-formation/adult/plans/:id
PATCH  /api/sunday-school/ai-formation/adult/plans/:id
DELETE /api/sunday-school/ai-formation/adult/plans/:id
POST   /api/sunday-school/ai-formation/adult/plans/:id/check-ins
POST   /api/sunday-school/ai-formation/adult/plans/:id/reviews
POST   /api/sunday-school/ai-formation/adult/plans/:id/pause
POST   /api/sunday-school/ai-formation/adult/plans/:id/resume

PUT    /api/sunday-school/ai-formation/adult/rule-of-life
PUT    /api/sunday-school/ai-formation/adult/digital-sabbath
PUT    /api/sunday-school/ai-formation/adult/body-rhythm
PUT    /api/sunday-school/ai-formation/adult/pause-protocol
POST   /api/sunday-school/ai-formation/adult/export
```

端点路径可调整，但行为和权限边界必须保留。

## 3. 所有权与租户

每条学习者记录至少绑定：

- `tenant_id` 或教会范围；
- `owner_user_id`；
- contract version；
- created/updated timestamps；
- soft-delete 或产品统一删除机制；
- 必要的审计元数据。

查询必须同时约束 owner 与 tenant。不得只依赖前端隐藏或可猜测 ID。

## 4. 自评存储

默认只保存：

- session metadata；
- completion state；
- resulting signal IDs；
- user-confirmed priority domains；
- instrument version。

逐题回答在 `ephemeral` 模式完成后立即丢弃。若用户明确选择持久化：

- 使用加密存储；
- 设置保留期；
- 不复制到 Analytics、搜索索引或日志；
- 删除 session 时一并删除回答。

## 5. Plan 聚合

推荐以 `formation_plan` 为聚合根：

- plan phase 可内嵌 JSON 或使用子表，遵循现有 ORM 习惯；
- check-in 与 review 追加写入；
- pause/resume 使用显式状态转换；
- practice version 应记录，以保证内容更新后的可追溯性；
- 删除或归档不得破坏已完成的内容审核记录。

## 6. 状态转换

### Assessment

```text
in_progress → completed
in_progress → discarded
completed → discarded/deleted
```

### Formation Plan

```text
draft → active
active → paused
paused → active
active|paused → completed
any non-deleted → archived
```

非法转换返回稳定错误代码，不静默修正。

### Rule / Sabbath / Body / Pause Protocol

```text
draft → active ↔ paused → archived
```

## 7. 幂等与并发

- 创建计划支持 client-generated ID 或 idempotency key；
- Check-in 必须按 owner + plan + date + idempotency key 去重；
- Review 创建应防止相同周期的意外重复；
- PATCH 使用版本号、etag 或 optimistic locking；
- 离线重试不得覆盖较新的计划编辑；
- 计划状态转换应在事务中完成。

## 8. 日志与观测

日志允许：

- technical request ID；
- resource type；
- status transition；
- stable error code；
- duration；
- redacted tenant/owner identifiers。

日志禁止：

- assessment answers；
- online speech drafts；
- private reflections；
- medical, sexual, abuse or third-party narratives；
- full request bodies for sensitive endpoints。

## 9. 导出与删除

导出应包含学习者自己的：

- signals；
- plans；
- check-ins；
- reviews；
- rule of life；
- digital Sabbath；
- body rhythm plan；
- pause protocol。

不得导出其他成员信息、内部安全规则或他人叙述。删除须遵守既有法律保留和审计策略，并向用户说明仍需保留的最小记录。

## 10. 内容与用户数据分离

课程、经文锚点、Practice Definition 和神学审核记录属于受控内容；学习者选择、计划和 check-in 属于用户数据。不得因内容版本更新直接改写用户历史。应记录旧版本并在必要时提供迁移或重新确认。
