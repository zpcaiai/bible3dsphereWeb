# 属灵星球 · 主日学 Tab
## AI时代心意更新与家庭门训 — Batch 01

本批次建立模块基础设施、神学护栏、领域模型、学习者上下文、牧养安全门与主日学 Tab 集成。

## 安装

将本目录中的 `.agents/skills/` 复制到“属灵星球”仓库根目录：

```bash
cp -R .agents/skills /path/to/spiritual-planet/.agents/
```

在仓库根目录启动 Codex。显式调用入口技能：

```text
$spiritual-planet-ai-formation-orchestrator
```

推荐实现提示：

```text
使用 $spiritual-planet-ai-formation-orchestrator 和本批次全部配套技能，
在现有“属灵星球”项目的主日学 Tab 中建立
“AI时代心意更新与家庭门训”模块的 Batch 01 基础垂直切片。
先检查仓库技术栈、路由、权限、设计系统、i18n、测试和数据层，
然后实现模块注册、入口页、四条课程轨道占位、领域模型、Schema校验、
神学内容校验接口、牧养安全门、种子数据和自动化测试。
不得另起平行应用，不得破坏现有导航与设计语言。
```

## Batch 01 交付

- 6 个 Codex Skills
- 4 个 JSON Schema
- 1 个模块蓝图
- 1 个神学基线
- 1 个牧养安全策略
- 1 个模块 Manifest 示例
- 1 组 Skill 激活评测
- 1 个静态校验脚本
- 1 个 `AGENTS.md` 集成片段

## 产品入口

建议模块标识：

```text
module_id: sunday_school.ai_formation
route: /sunday-school/ai-formation
display_name_zh: AI时代心意更新与家庭门训
```

## 四条顶层课程轨道

1. 成人：攻克己身与数字时代属灵操练
2. 父母：夺回家庭注意力与榜样塑造
3. 儿童青少年：按年龄形成内在治理
4. 教师：主日学备课、带领、观察与转介

## 验证

```bash
node scripts/validate-batch01.mjs
```

校验成功后，应继续运行项目原有的 lint、typecheck、unit、integration 和 e2e 测试。
