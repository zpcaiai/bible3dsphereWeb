# 属灵星球主日学：AI时代心意更新与家庭门训
## Complete Codex Skills Bag — Batch 01–12

这是 Batch 01–12 的统一、可安装、可分批实施的 Codex Skills 总包。

## 包含内容

- **12 个 Batch**；
- **138 个逐批 Skills**；
- **1 个 Batch 04–12 跨批次编排 Skill**；
- **1 个 Batch 01–12 总编排 Skill**；
- **共 140 个 Skills**；
- **132 个 JSON Schemas**；
- **380 个 Practices / Controls**；
- **101 个课程单元、239 节课**；
- **140 个情境或红队场景**；
- **582 条 Skill 路由评测**；
- **260 条行为、安全与隐私案例**；
- 每个 Batch 的独立 ZIP；
- 合并安装脚本、完整索引、实施顺序、兼容矩阵和验证器。

## 推荐用法

### 方式一：分批安装（推荐）

```bash
python scripts/install-batches.py /absolute/path/to/spiritual-planet 01
python scripts/install-batches.py /absolute/path/to/spiritual-planet 02
# 依次继续至 12
```

### 方式二：一次安装全部 Skills

```bash
python scripts/install-batches.py /absolute/path/to/spiritual-planet all
```

安装器不会删除未关联 Skills；覆盖同名 Skill 前会创建备份。

把根目录 `AGENTS.md.snippet` 的规则人工合并到属灵星球仓库合适作用域，然后在 Codex 中显式调用：

```text
$spiritual-planet-ai-formation-complete-program-orchestrator
```

进行单个 Batch 时，优先调用对应 Batch orchestrator，详见 `BATCH_INDEX.json` 和 `ALL_SKILLS_INDEX.md`。

## 目录

```text
.agents/skills/      全部可安装 Skills
batches/batch-XX/    各 Batch 文档、Schema、资产、Evals 与验证脚本
packages/            12 个独立、已验证的 Batch ZIP
scripts/             安装与总体验证工具
```

## 重要边界

本包是实现规范和 Codex Skills，不等于真实产品已经通过生产认证。安装到真实仓库后，仍必须执行仓库原生编译、迁移、权限、多租户、E2E、无障碍、安全、隐私、儿童保护、内容审核、部署和回滚验证。
