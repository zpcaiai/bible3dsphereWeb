# Quick Start

## 1. 验证总包

```bash
python scripts/validate-all.py
```

## 2. 安装 Batch 01

```bash
python scripts/install-batches.py /absolute/path/to/spiritual-planet 01
```

## 3. 合并仓库规则

人工把 `AGENTS.md.snippet` 合并到目标仓库根目录或主日学模块目录的 `AGENTS.md`。

## 4. 在 Codex 中实施

```text
$spiritual-planet-ai-formation-orchestrator
```

每完成一个 Batch，运行该 Batch 自带验证器和真实仓库测试，再安装下一批。

## 5. 全项目编排

全部 Skills 已安装后调用：

```text
$spiritual-planet-ai-formation-complete-program-orchestrator
```
