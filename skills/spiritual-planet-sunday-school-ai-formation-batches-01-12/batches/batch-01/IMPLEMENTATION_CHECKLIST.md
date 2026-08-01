# Batch 01 Codex 实施清单

## 仓库侦察

- [ ] 阅读根目录及相关子目录 `AGENTS.md`
- [ ] 定位主日学 Tab
- [ ] 定位模块注册机制
- [ ] 定位路由、权限、feature flag
- [ ] 定位 i18n 与内容管理
- [ ] 定位 ORM/Schema/迁移
- [ ] 定位 analytics 与隐私策略
- [ ] 定位测试框架

## 垂直切片

- [ ] 注册 `sunday_school.ai_formation`
- [ ] 加入 Tab 卡片
- [ ] 建立 `/sunday-school/ai-formation`
- [ ] 建立四条轨道
- [ ] 加入模块说明与安全边界
- [ ] 加入教师权限入口
- [ ] 实现 feature flag
- [ ] 实现 loading/empty/error/retry
- [ ] 实现移动端与无障碍

## 契约

- [ ] ModuleManifest
- [ ] LearnerContextV1
- [ ] FormationContentBlockV1
- [ ] PastoralSafetyDecisionV1
- [ ] API/DB/validator 对齐
- [ ] 正向与负向契约测试

## 安全与神学

- [ ] 权威层级必填
- [ ] 内容审核状态必填
- [ ] 禁止救恩评分
- [ ] 禁止隐蔽监控
- [ ] S3 中断普通课程
- [ ] analytics 不含敏感叙述
- [ ] 未成年人权限隔离
- [ ] 法律/地区规则可配置

## 质量

- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] integration tests
- [ ] e2e smoke
- [ ] a11y smoke
- [ ] 320px responsive
- [ ] feature flag off
- [ ] unauthorized teacher
- [ ] rollback/migration note
