# Batch 02 Codex 实施清单

## 0. 前置确认

- [ ] 阅读仓库根目录及目标目录的 `AGENTS.md` / `AGENTS.override.md`
- [ ] 确认 Batch 01 已实现并通过测试
- [ ] 定位成人轨道现有占位路由
- [ ] 定位 Schema、验证器、ORM、迁移和 API 约定
- [ ] 定位内容审核、牧养安全和权限边界
- [ ] 定位 Analytics、隐私、数据删除与导出机制
- [ ] 定位设计系统、表单、步骤条、图表和无障碍模式
- [ ] 定位现有定时提醒/通知能力；没有则不新增强依赖

## 1. 成人轨道垂直切片

- [ ] `/sunday-school/ai-formation/adult`
- [ ] 成人轨道介绍与“恩典先于操练”导论
- [ ] 可跳过的自评入口
- [ ] 自评结果页，不显示总分或诊断
- [ ] 用户确认 1–3 个优先领域
- [ ] 计划生成/手动选择页面
- [ ] 今日操练页
- [ ] Check-in 页面
- [ ] 周期 Review 页面
- [ ] Digital Rule of Life 编辑器
- [ ] Digital Sabbath 规划器
- [ ] Loading / Empty / Error / Retry / Offline-safe states

## 2. 契约与数据

- [ ] AttentionSelfAssessmentV1
- [ ] FormationSignalV1
- [ ] PracticeDefinitionV1
- [ ] FormationPlanV1
- [ ] PracticeCheckInV1
- [ ] FormationReviewV1
- [ ] DigitalRuleOfLifeV1
- [ ] DigitalSabbathPlanV1
- [ ] BodyRhythmPlanV1
- [ ] PauseProtocolV1
- [ ] OnlineSpeechReflectionV1
- [ ] API DTO、领域类型、验证器和数据库模型对齐
- [ ] 拒绝未知字段
- [ ] 外部存储契约版本化
- [ ] 迁移与回滚说明

## 3. 注意力自评

- [ ] 默认不保存逐题回答
- [ ] 自评可跳过、退出和删除
- [ ] 无“成瘾”“属灵失败”“意志薄弱”自动标签
- [ ] 不产生 `overallScore`
- [ ] 仅生成领域信号与建议
- [ ] 用户必须确认优先领域
- [ ] 推荐最多 3 个领域
- [ ] 不从回答推断救恩、诊断、性行为或家庭问题
- [ ] Analytics 不含逐题回答

## 4. Practice Catalog

- [ ] 每个操练有稳定 ID 与版本
- [ ] 每个操练有权威层级与审核状态
- [ ] 有最小可行动作和降低难度选项
- [ ] 有停止条件与安全提示
- [ ] 有可观察果子，但不等同属灵评分
- [ ] 无睡眠剥夺、羞辱、极端运动或惩罚性禁食
- [ ] 食物禁食只面向安全门通过的成年人
- [ ] 不适合食物禁食时提供非食物替代方案

## 5. Formation Plan

- [ ] 支持 7/14/30/90 天
- [ ] 最多 3 个优先领域
- [ ] 每阶段最多 3 个核心操练
- [ ] 至少一个恩典锚点
- [ ] 有复盘周期
- [ ] 支持暂停、降级、替换、完成和归档
- [ ] 连续未完成时优先降低复杂度
- [ ] 明显痛苦或安全风险触发 Batch 01 安全门
- [ ] 不显示排行榜、属灵等级或连续打卡惩罚

## 6. Digital Rule of Life

- [ ] 用户自愿选择规则
- [ ] 规则标明 `PASTORAL_WISDOM` 或 `PRODUCT_DEFAULT`
- [ ] `isDivineCommand=false`
- [ ] 默认 3–5 条，不用一次配置所有边界
- [ ] 支持工作值班、照护、旅行、医疗和无障碍例外
- [ ] 默认无设备级监控
- [ ] 设备原生能力必须用户明确开启
- [ ] 教师、牧者和家长不能秘密查看
- [ ] 支持导出、删除和自愿分享

## 7. Digital Sabbath

- [ ] 不把数字安息等同于普遍且唯一的守安息日方式
- [ ] 支持与主日整合、分开或教会配置
- [ ] 支持从 1–2 小时开始
- [ ] 有预备、替代活动和重新进入
- [ ] 保留紧急、照护、工作和无障碍例外
- [ ] 错过一次不会破坏连续记录或触发羞耻文案

## 8. 身体节律与禁食

- [ ] 身体神学文案通过审核
- [ ] 睡眠目标不使用剥夺或强行早起
- [ ] 不收集体重、卡路里或身体羞耻指标
- [ ] 不把疲劳直接解释为属灵软弱
- [ ] 食物禁食前运行最小化安全门
- [ ] 不存储具体医疗细节
- [ ] 未成年人不由本批次生成食物禁食计划
- [ ] 不适、头晕、疾病或专业意见冲突时停止并转介

## 9. 暂停、言语与责任操练

- [ ] 情绪暂停不压抑情绪
- [ ] 支持愤怒、焦虑、冲动发帖、刷屏和消费冲动等触发器
- [ ] S2/S3 情形走牧养安全门
- [ ] 网络言语草稿默认临时处理，不持久化正文
- [ ] Analytics 不含草稿或私聊内容
- [ ] 舒适辨识同时保护正常休息、边界与康复
- [ ] 不鼓励忍受虐待、危险或过劳
- [ ] 责任操练指向爱人、诚实、服事与完成托付

## 10. 权限与隐私

- [ ] 学习者只能访问自己的计划和 Check-in
- [ ] 教师默认只能看课程完成状态，不看私人回答
- [ ] 牧者查看需用户明确分享或安全流程授权
- [ ] 多租户/教会隔离
- [ ] 导出和删除可用
- [ ] 逐题回答默认 ephemeral
- [ ] 私密叙述不进入 Analytics、日志和错误追踪
- [ ] 审计敏感访问

## 11. 测试

- [ ] Schema 正向/负向/版本兼容测试
- [ ] 自评跳过、完成、删除与不保存回答
- [ ] 无总分、无诊断标签
- [ ] 1–3 优先领域限制
- [ ] 7/14/30/90 天计划
- [ ] 计划降级、暂停和恢复
- [ ] Rule of Life 例外与隐私
- [ ] Digital Sabbath 跨时区与例外
- [ ] 食物禁食安全门
- [ ] 暂停协议 S3 中断
- [ ] 网络言语草稿不落库、不进 Analytics
- [ ] Unauthorized / cross-tenant access
- [ ] Feature flag off
- [ ] Keyboard-only / screen reader / reduced motion
- [ ] 320px mobile / desktop
- [ ] Offline retry and duplicate submission idempotency
- [ ] lint / typecheck / unit / integration / e2e / a11y
