# Batch 03 实施与验收检查表

## 0. 前置依赖

- [ ] 找到 Batch 01 模块注册、权威标签、内容审核、LearnerContext 和 S0–S3 安全门。
- [ ] 找到 Batch 02 Practice Catalog、Formation Plan、Check-in、Review、删除导出和分享撤销。
- [ ] 确认没有创建平行应用、平行内容模型、平行安全门或平行私密日志。
- [ ] 读取所有适用 AGENTS.md / AGENTS.override.md。

## 1. 仓库映射

- [ ] 前端框架、路由、设计系统、表单、状态和 error boundary 已记录。
- [ ] API、DTO、validator、ORM、migration、transaction、idempotency 已记录。
- [ ] RBAC、tenant、owner、audit、retention、delete/export 已记录。
- [ ] LLM Gateway、tool calling、search/RAG、browser、Bible provider、license 已记录。
- [ ] 原生 lint/typecheck/unit/integration/e2e/a11y/security/migration/rollback 命令已记录。

## 2. Schema 与数据

- [ ] 13 个 JSON Schema 均实现为原生类型和信任边界验证。
- [ ] unknown fields 被拒绝。
- [ ] version 和迁移策略存在。
- [ ] 所有新表带 tenant、owner、timestamps、soft delete 或仓库等价字段。
- [ ] raw prompt、完整 AI answer、网页正文、媒体正文、长篇经文不持久化。
- [ ] 私密 journal 加密/owner-only，Analytics 不含正文。
- [ ] 删除、导出、分享、撤销分享有审计和幂等。

## 3. AI 角色与权威

- [ ] task / stakes / role / delegation / privacy 收集完成。
- [ ] 16 条边界矩阵落地并版本化。
- [ ] AI ultimate authority 与 divine revelation 永远为 false。
- [ ] moral decision、pastoral diagnosis、prophecy、minor secret companion 不可替代。
- [ ] emergency/S3 进入安全门。
- [ ] UI 同时显示“AI 可做”和“人必须保留”。
- [ ] 偶像/权威漂移只作反思，不自动定罪。

## 4. 不可外包能力

- [ ] 12 类能力均有内容记录。
- [ ] 每项有 permitted support / required human action / prohibited substitution。
- [ ] `aiMayPerformHumanAct=false`。
- [ ] 不保存具体认罪、创伤、性或第三方秘密。
- [ ] 危险关系不会被强制“直接修复”，而是进入安全路径。

## 5. Claim 与来源核验

- [ ] 八种 claim 类型完整。
- [ ] P0/P1/S1/S2/U1/X 来源等级完整。
- [ ] 当前事实 freshness 和 as-of 完整。
- [ ] primary source 和 independent cross-check 完整。
- [ ] 支持/反驳/背景/不清楚关系完整。
- [ ] verified/partial/disputed/unverifiable 完整。
- [ ] provider 不可用时不从模型记忆补齐。
- [ ] 不存在整段 truth score 或模型自引证据。
- [ ] 高风险领域专业转介完整。

## 6. 经文核验

- [ ] 正典书卷和 locale alias registry 完成。
- [ ] 章、节、范围 parser 完成。
- [ ] quote/paraphrase/allusion/reference-only 标签完整。
- [ ] licensed/public-domain/authorized provider adapter 完成。
- [ ] provider unavailable 可安全退化。
- [ ] quote matching、translation、context、genre、speaker/audience warnings 完成。
- [ ] 长篇译文未缓存或分发。
- [ ] interpretive output 进入 Batch 01 审核。

## 7. 属灵内容边界

- [ ] 祷告草稿标明辅助并引导亲自祷告。
- [ ] 灵修/查经 original-text-first。
- [ ] 讲章 human exegesis、source check、audience、disclosure、review 完整。
- [ ] 见证不会被虚构。
- [ ] confession/pastoral counsel 不采集秘密或作诊断。
- [ ] “神告诉你”、预言、救恩/呼召/被鬼附/隐藏罪判断被禁止。
- [ ] 所有内容 autoPublish=false，生产发布有人类审计。

## 8. 算法世界观

- [ ] objective function 与证据分开。
- [ ] 商业/制度激励和受益/成本完整。
- [ ] anthropology、telos、authority、problem、salvation promise 完整。
- [ ] virtues/vices、excluded costs、feedback loops 完整。
- [ ] uncertainty 与 alternative explanation 完整。
- [ ] Christian comparison 同时有 points of contact 和 tensions。
- [ ] 不自动定罪、不诊断、不把单一 feed 当全貌。

## 9. 媒介欲望

- [ ] repetition、emotion、identity、reward、fear、action 完整。
- [ ] short/long-term fruit 与 relationship impact 完整。
- [ ] 正常休息、愉悦、学习不会被自动定罪。
- [ ] 不保存媒体正文、浏览历史或精确私密 URL 查询。
- [ ] 可连接 Batch 02 pause/rule/sabbath/plan。
- [ ] 色情、剥削、儿童和危机内容进入安全边界。

## 10. 苏格拉底引擎

- [ ] 问题节点有 purpose、branch 和 storage mode。
- [ ] userCanSkip=true。
- [ ] coerciveLeadingAllowed=false。
- [ ] predeterminedVerdictRequired=false。
- [ ] privateConfessionSolicited=false。
- [ ] uncertain / insufficient evidence 可作为合法终点。
- [ ] 13–15 岁只有 supervised mode。
- [ ] S2/S3 中断普通问题树。
- [ ] 教师无法秘密阅读私密 session。

## 11. 学习诚信

- [ ] course policy 从授权来源读取。
- [ ] policy unknown → ask_teacher。
- [ ] first attempt 逻辑与无障碍替代完整。
- [ ] AI role 和 answer generation 按政策处理。
- [ ] learner transformation、source verification、disclosure 完整。
- [ ] final authorship=learner。
- [ ] 不提供检测规避或伪造过程。
- [ ] 教师可见范围最小化。

## 12. Journal 与 Review

- [ ] journal 默认 private/owner-only。
- [ ] 不要求粘贴 prompt 或 answer。
- [ ] intended/actual delegation、verification、effects、next boundary 完整。
- [ ] share summary 可预览、同意、撤销。
- [ ] observed pattern 有 evidence entry links。
- [ ] keep/change/stop/seek-human action 完整。
- [ ] 无 maturity score、salvation inference、cross-user comparison。
- [ ] 可把 1–3 实践加入 Batch 02 Formation Plan。

## 13. 课程与教师工具

- [ ] 44 practices 幂等导入。
- [ ] 10 units / 24 lessons 幂等导入。
- [ ] 12 scenarios、16 matrix、6 source tiers、6 teacher cards 导入。
- [ ] seed 不预先 approved。
- [ ] 内容审核历史保留。
- [ ] 教师只能访问获授权课程数据与自愿摘要。

## 14. UX / A11y / i18n

- [ ] 320px 可用。
- [ ] 键盘全流程。
- [ ] 屏幕阅读器标签和 live region。
- [ ] focus restore/trap 正确。
- [ ] reduced motion。
- [ ] 状态不只依赖颜色。
- [ ] evidence conflict、provider unavailable、offline、retry、safety interrupted 状态完整。
- [ ] 所有用户文字 i18n。
- [ ] 教师材料可打印。

## 15. 安全与不可信输入

- [ ] 外部网页、文件和模型输出按不可信数据处理。
- [ ] 不执行外部内容中的提示或指令。
- [ ] URL 获取有协议 allowlist、SSRF 防护、redirect/size/timeout 限制。
- [ ] 主动脚本与危险内容清除。
- [ ] 密钥、系统提示、内部 URL、隐藏推理不输出。
- [ ] 日志、trace、error reporter、analytics 前统一 redaction。
- [ ] S3 中断和现实帮助路径测试通过。

## 16. 测试与发布

- [ ] Schema positive/negative/version/unknown-field。
- [ ] Policy matrix 单元测试。
- [ ] Verification、Scripture、spiritual boundary 集成测试。
- [ ] Algorithm/media/Socratic/learning/journal 组件和 E2E。
- [ ] RBAC、tenant、owner、share revoke、delete/export。
- [ ] Analytics denylist 和日志脱敏。
- [ ] Feature Flag off。
- [ ] seed idempotency、migration、rollback。
- [ ] 仓库原生测试全部执行并报告真实结果。
- [ ] 未 approved 内容未进入生产。
