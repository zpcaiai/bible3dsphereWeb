# Web 端迁移验收预检归档指南 (`docs/web-acceptance-runs`)

本目录用于存放 `bible3dsphereWeb → bible3dsphereApp` **703 条迁移验收用例集**（`docs/web-app-acceptance/`）的单次本地 Web 组件与契约预检执行副本及加密取证产物。

遵循 `docs/web-app-acceptance/README.md` 的基线隔离规范（*“每个平台和构建各复制一份执行表，保留原表作为回归基线”*），所有校验与预检运行器均对原表只读，**严禁在任何情况下直接修改 `docs/web-app-acceptance/{README.md, cases.csv, coverage.csv}`**。

---

## 1. 工具职责与非虚报边界

### 1.1 离线结构与跨仓连续性校验器：`scripts/validate_web_app_acceptance.py`
对验收基线目录执行确定性只读审计：
- **精确目录成员与编码**：仅允许 `{'README.md', 'cases.csv', 'coverage.csv'}`，`cases.csv` 与 `coverage.csv` 均须带 UTF-8 BOM（`\xef\xbb\xbf`）且通过 `csv.DictReader(..., strict=True)`。
- **703 条全量对齐与防注入**：校验 703 个唯一 `Case ID`（`[A-Z0-9-]+`）、`cases.csv['Case ID']` 与 `coverage.csv['逐项用例']` 的 1:1 映射、198 条 `scenario` + 505 条源码注册表分组计数、初始 `状态 == 'NOT_RUN'` 与空执行列，以及任意单元格不得以 `= + @ -` 开头（防电子表格公式注入）。
- **100 位数字人固定夹具校核**：核对 `e2e/fixtures/digital-human-all100.json` 的固定 SHA-256（`a207c252d5ed26e84e2aab669f50de7e852c9f61c899e7525b5f0b3b7bed4a83`）、100 个唯一 `characterId` 与 `mirrorId`，以及 `DH-C001..DH-C100` 步骤与预期中的人物提问、追问和经文坐标。
- **Web 基线与当前 `HEAD` 连续性审计**：核对 Web 基线提交 `b8f361d9589088432a915f191e9a49e32cc012ef` 上全部源码文件存在且 `1 <= line <= line_count`，并实时比对当前 `HEAD` 是否仍保留所有被引用文件、输出自基线以来的提交增量与文件行数变化（`head_continuity`）。
- **相邻 `bible3dsphereApp` 候选与 `待定位` 解析审计**：当相邻 `../bible3dsphereApp` 存在时，核对所有已填 `App 候选` 在基线提交 `42a0406388f513ae47e337017726c00e2b0c77e4` 上均真实存在，并扫描 `origin/main`（或 `HEAD`）`lib/**/*.dart` 为 27 条 `待定位` 条目给出只读候选建议（将 `legacy-devotion` 与 `DEV-03` 归类为 `待确认旧入口`），不改写原表；在独立 CI 无相邻仓库时自动以 `app_repo_available: false` 安全跳过。

### 1.2 Web 本地组件/契约预检运行器：`scripts/run_web_acceptance_baseline.py`
在独立输出目录生成单次预检副本与真实子进程凭证：
1. 运行前先调用 `validate_acceptance_suite` 校验基线并记录 `README.md`、`cases.csv`、`coverage.csv` 的运行前 SHA-256，运行结束后再次比对三文件 SHA-256 完全一致。
2. 通过 `subprocess.Popen` 启动真实 OS 子进程（记录 `pid > 0`、退出码、耗时及标准输出/错误日志），调用 `./node_modules/.bin/vitest run --reporter=json --outputFile=<output-dir>/vitest-report.json`，保存报告原文及其 SHA-256。
3. 仅更新副本 `<output-dir>/cases.web-local.csv`（保留 UTF-8 BOM）：
   - **绝不伪造真机通过**：`执行方式 == 'DEVICE'` 或 `夹具 == 'DEVICE'` 的条目绝不标为 `PASS`（保持 `NOT_RUN`；需 iOS/Android 物理真机实测）。
   - **绝不伪造外部供应商与人工神学签发**：`夹具 == 'PROVIDER'` 及 `DH-05..DH-08` 实时音视频/供应商监控/五方人工审核条目绝不标为 `PASS`。仅当显式传入 `--record-known-web-blockers` 时，将 `DH-05..DH-08` 在副本中记为 `BLOCKED` 并注明阻塞代码（`STT_WORKER=MISSING / LIVESPEAK=MISSING / THEOLOGY_REVIEW`）、负责方与解锁条件；否则保持 `NOT_RUN`。
   - **诚实预检取证（零跨端虚报）**：对于 `执行方式 == 'UI'` 且 `夹具` 属于 `{'VISITOR', 'OWNER', 'LANG', 'ROLES', 'SAFETY'}` 的条目，只有当其 `Web 源码` 对应的全部映射 Vitest 套件在本次子进程中实际执行且 `status == 'passed'`、通过断言数 `> 0` 时，才在副本中写入 `平台与版本`、`实测结果`（*“Web 组件与契约自动预检通过；跨端真机与实网对照待执行”*）及 `证据`（含 `vitest-report.json#<sha256前12位>` 与 `pid`），同时保持跨端迁移签收 `状态 = NOT_RUN`（`summary.json` 中 `cross_platform_acceptance_pass: 0`、`certification_state: "NOT_CERTIFIED"`）。

---

## 2. 输出目录产物说明

每次执行 `run_web_acceptance_baseline.py` 会在指定 `<output-dir>`（或时间戳子目录）生成：
- `cases.web-local.csv`：带 UTF-8 BOM 的 703 行独立工作表副本，可直接导入 Excel / Numbers 筛选。
- `vitest-report.json`：Vitest JSON Reporter 原始测试报告。
- `vitest.stdout.log` / `vitest.stderr.log`：Vitest 子进程原始输出日志。
- `web-precheck-evidence.json`：逐条 `case_id -> {test_files, passing_assertions, pid, vitest_json_sha256}` 证据索引。
- `summary.json`：汇总运行器 PID、Vitest 子进程 PID/退出码、基线运行前后 SHA-256、`cross_platform_acceptance_pass`（恒为 `0`，直至完成真实浏览器与双端真机对照）及 `web_local_vitest_verified_cases` 计数。

---

## 3. 常用验证与执行命令

### 3.1 校验 703 条验收基线完整性
```bash
python3 scripts/validate_web_app_acceptance.py docs/web-app-acceptance \
  --json-out /tmp/web-app-acceptance-validation.json
```

### 3.2 运行默认 Web 组件/契约预检并生成时间戳归档
```bash
python3 scripts/run_web_acceptance_baseline.py \
  --suite-dir docs/web-app-acceptance \
  --output-dir /tmp/web-acceptance-runs \
  --timestamp-subdir \
  --record-known-web-blockers
```

### 3.3 指定子集快速预检
```bash
python3 scripts/run_web_acceptance_baseline.py \
  --suite-dir docs/web-app-acceptance \
  --output-dir /tmp/web-acceptance-quick \
  --vitest-targets \
    src/features/spiritual-planet/__tests__/digitalHumanContracts.test.js \
    src/features/ai-formation/__tests__/AiFormationPage.test.jsx \
    src/test/sanitize.test.js
```

### 3.4 运行全量 Python 单元测试
```bash
python3 -m unittest discover -s scripts -p 'test_*web*acceptance*.py' -v
```

> **回滚与清理说明**：预检产物建议输出到 `/tmp/` 或构建产物归档路径，不污染或覆盖 `docs/web-app-acceptance/`。如需撤销本工具链变更，可直接按提交回退 `scripts/validate_web_app_acceptance.py`、`scripts/test_validate_web_app_acceptance.py`、`scripts/run_web_acceptance_baseline.py`、`scripts/test_run_web_acceptance_baseline.py` 与 `docs/web-acceptance-runs/README.md`。
