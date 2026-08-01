# AI时代心意更新与家庭门训 — Batch 01–12 生产候选实施记录

## 结论（2026-08-01）

- 模块 ID：`sunday_school.ai_formation`
- 路由：`/sunday-school/ai-formation`
- 代码状态：`release_candidate`
- 发布/认证状态：`NOT_CERTIFIED`
- 前端开关：`VITE_AI_FORMATION_ENABLED=false`
- 后端开关：`SUNDAY_SCHOOL_AI_FORMATION_ENABLED=false`
- 内容：67 个精确版本，覆盖 12 个 Batch；全部 `published_at=NULL`

12 个 Batch 的代码、数据库、用户工作流、内容治理、情境运行时和证据控制台已经接入现有 split-repo 产品。它们尚不能对真实用户开放：神学、牧养、儿童安全、隐私/权利、内容质量、人工无障碍与最终发布签署没有授权人证据；staging 浏览器/部署证据也未运行。系统会因此保持 fail-closed。

## 真实架构与文件

| 关注点 | 实现 |
|---|---|
| 前端 | `src/features/ai-formation/`：模块页、132-Schema 工作流、数据权利、审核台、情境运行时、认证台 |
| 后端 | `backend/ai_formation/` 与 `backend/routers/ai_formation.py`：严格契约、规范注册、S0–S3、owner API、内容和发布门禁 |
| 规范 | `backend/ai_formation/specs/batch_01` 至 `batch_12`：132 JSON Schema、67 YAML 资源 |
| 数据库 | `0238` 基础表/RLS；`0239` 并发、精确哈希、角色审核、发布范围；`0240` 67 个 review-only 资源 |
| 认证 | 复用现有 HttpOnly session / bearer fallback；不建立平行身份系统 |
| owner / tenant | `personal:<normalized email>` + email 双重限定；记录和审计启用 owner RLS |
| Formation Twin | Batch 11 导向现有 Formation Twin；不创建第二套生命镜像 |

## Batch 01–12 已实施能力

| Batch | 可执行产品面 | 强制门禁 |
|---|---|---|
| 01 | 单模块、四轨道、最小 Learner Context、S0–S3、安全中断、132-Schema 注册 | 无属灵评分；S3 停止普通课程 |
| 02 | 计划、注意力/身体/数字节律记录；7/14/30/90 路径；暂停/恢复/完成/归档 | 不诊断成瘾；不保存敏感叙事 |
| 03 | AI 使用意图、权威边界、核验/学习诚信工作流 | AI 不能是启示、良心或最终决定者 |
| 04 | 类别化身份/欲望/虚拟亲密/恢复支持记录 | 不保存露骨内容、性历史或秘密 AI 亲密关系 |
| 05 | 父母榜样、焦虑传递、修复和权柄工作流 | 不生成父母适格、隐藏罪或成熟分数 |
| 06 | 家庭注意力生态、数字/AI 公约、例外与复盘 | 禁止秘密监控；孩子声音与同意显式化 |
| 07 | 0–6 / 7–12 照护者脚手架、故事/游戏、媒介/AI 素养 | guardian gate；儿童保护和年龄审核 |
| 08 | 13–15 / 16–18 疑问、身份、社交、学习诚信与自治交还 | 不推断性取向/隐藏罪；禁止秘密成人渠道 |
| 09 | 版本化课程/教师材料；完整内容/来源查看；精确 SHA 多角色审核、独立发布、停用 | 角色允许名单为空即 403；作者、审核人、发布人职责分离 |
| 10 | 只从已批准、已发布、年龄匹配的情境启动；版本锁定；受限 choice IDs；并发修订 | 无自由文本、创伤重演、画像或预测；可跳过/安全中断 |
| 11 | 132-Schema 中的纵向事件、快照、轨迹、建议和同意面；导向现有 Twin UI | 不接入浏览历史、私聊或原始设备遥测；不是灵魂模型 |
| 12 | artifact/version/environment/SHA 精确证据范围；10 门禁；人工证据身份；limited rollout/rollback/incident owner | 范围不完整即 `NOT_CERTIFIED`；自动化永不发布 |

所有 Schema 由服务器执行 Draft 2020-12 校验。服务器绑定 tenant/learner、生成顶层资源 ID 与时间；外键/关联 ID 必须由客户端显式提供，不能伪造。危险布尔值、原始对话、浏览历史、露骨内容、私聊、诊断、评分、排名和自动批准字段额外 fail-closed。

## 内容与权限状态

- 0240 从安装的 Skill 资源确定性生成 67 个 canonical JSON、SHA-256、来源路径、年龄带和必需审核角色。
- 种子中 64 个从 `theology_review` 开始，其余保持包内 `draft/pastoral_review`；没有版本自动升级为 `approved`。
- 学习者 API 只返回 `approved + published + not retired + saved age band match` 的内容。
- 审核和发布身份由以下环境变量显式允许：
  - `AI_FORMATION_THEOLOGY_REVIEWERS`
  - `AI_FORMATION_PASTORAL_REVIEWERS`
  - `AI_FORMATION_CHILD_SAFETY_REVIEWERS`
  - `AI_FORMATION_PRIVACY_RIGHTS_REVIEWERS`
  - `AI_FORMATION_ACCESSIBILITY_REVIEWERS`
  - `AI_FORMATION_CONTENT_REVIEWERS`
  - `AI_FORMATION_PUBLISHERS`
  - `AI_FORMATION_RELEASE_AUTHORITIES`
- 空允许名单不会回退到“任意管理员”。人工门禁证据必须由 `human_reviewer` 本人认证提交。

## 已执行验证与退出码

| 命令/检查 | 结果 | 退出码 |
|---|---:|---:|
| Batch 01–44 Skill 系统 `skill_system.py validate --write-reports` | 44 Batch / 788 Skills / 788 agent interfaces / 284 Schemas / 0 contract violations | 0 |
| Batch 01–44 Skill 系统 `skill_system.py self-test` | parser、audit、package validators、collision refusal、788-Skill install | 0 |
| Skill 整包 `validate-all.py`（backend venv） | 12 Batch / 140 Skills / 132 Schemas / 380 controls / 101 units / 239 lessons / 140 scenarios / 582 evals / 260 behavior cases | 0 |
| 独立临时 PostgreSQL：0238→0240 strict forward | 3/3 applied；67 content；12 Batch；0 published | 0 |
| 临时 PostgreSQL事务演练：0238→0240、0240→0238、再 forward | 6 个模块表归零后 3/3 重新应用；最终事务回滚、不持久化 | 0 |
| 后端全量 `pytest -q`（strict markers） | backend 2482 passed / evaluation 6 passed / 1 collection skip / 0 warnings | 0 |
| 当前内容审核包与证据 focused contracts | 14 passed；67/67 exact-hash packets；人工签署为空时保持 `BLOCKED` | 0 |
| AI Formation live DB acceptance | owner CRUD、年龄、并发、导出/删除、角色审核、发布分离、缺证据拒绝、情境版本锁定 | 0（包含于全量） |
| 前端 AI Formation focused | 11 passed | 0 |
| 前端生产 build | 2402 modules transformed | 0 |
| AI Formation ESLint scope | 0 errors / 0 warnings | 0 |
| 本地 Chrome Playwright + axe | 4/4 passed：桌面键盘/最小化数据、390×844 与 320×568 reflow/触控/减弱动态、admin fail-closed；0 axe violations | 0 |
| 前端全量（首次） | 691 passed / 1 failed：新增 6 个英文词条缺失 | 1 |
| `npm run i18n:fill` + i18n contract | 6/6 补齐；focused 9 passed | 0 |
| 前端全量（修复后） | 142 files / 692 tests passed | 0 |

本地自动化证据快照见 `docs/AI_FORMATION_LOCAL_GATE_EVIDENCE.json`；tenant isolation、Skill eval 与 rollback rehearsal 的 `passed` 现在全部来自真实子进程退出码、执行时间和输出 SHA-256，不再由生成器预填。快照明确保持 `NOT_CERTIFIED`，不替代 staging 浏览器验收或人工签署。Batch 01–44 静态审计明细见 `skills/batch_01_to_44_complete_skill_system/SYSTEM_AUDIT_REPORT.md`。

## 回滚路径

1. 将 `VITE_AI_FORMATION_ENABLED` 与 `SUNDAY_SCHOOL_AI_FORMATION_ENABLED` 设为 `false`，停止入口和写入。
2. 停用有问题的内容版本；学习者 API 自动回到其他已批准、未停用版本。
3. 数据库按 `0240`、`0239`、`0238` 的 `.down.sql` 逆序运行。0240 只删除 Skill 种子；用户记录需先按数据权利流程导出/处置。
4. 部署上一已知良好应用版本。现有 Formation Twin、Attention、Prayer、Devotion 不由这些迁移删除。

## 尚未解决的生产阻断

- 67 个内容版本的真实多角色人工审核与独立发布仍未发生。
- theology、pastoral safety、child safety、privacy/security、content quality、manual accessibility 的具名 staging/production 证据缺失。
- 本地 Chrome 自动化 E2E 已通过并保存 JSON/截图证据；但没有 staging URL、VoiceOver/屏幕阅读器、200%/400% 缩放、iPhone/Android 实机与具名人工签署。
- 没有 staging deploy smoke、limited rollout、事故演练、生产回滚负责人签署。
- 仓库完整 fresh-database migration 链依赖应用先建旧 base/MVFE 表，并且本机 pgvector 镜像没有 PostGIS；本模块 0238–0240 已独立 strict 验证，但完整历史链的 PostGIS 段仍会 warning/skip。

因此，代码可作为 release candidate 交给授权审核和 staging gate；在这些阻断实际关闭前，不得标注为 production-ready、certified，也不得打开 feature flags。
