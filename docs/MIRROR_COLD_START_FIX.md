# 人物页冷启动修复 — 2026-10-22

原 5000ms 默认测试限制、原人物页断言、`MirrorPage.jsx`、`MirrorPageDigitalHuman.test.jsx` 和 Vitest 配置均保持不变。没有跳过案例或在测试中提前加载资料。外部账号、真实模型/语音、生产数据库和设备验收仍为 `NOT_RUN`，五方人工审核仍为 `PENDING`；整体数字人产品仍为 `BLOCKED_INCOMPLETE / NOT_CERTIFIED`。

## 主机负载和代码开销分别观测

先前失败日志保留在 `digital-human-implementation/`：8 CPU 主机 load 曾接近 176；最终隔离运行大卫仍超过 5 秒。当时没有 CPU 分阶段记录，不能把历史失败完全归于某一因素。

本轮先在未修复源上测量，主机 load 约 23 时原文件 4/4 通过：大卫 556ms，资料动态加载 479ms，详情渲染至提交约 49ms。说明原测试不是稳定的逻辑断言失败，也说明首次资料加载是主要可削减开销。后续人物复用缓存，不承担同样的冷加载。

资料原为约 1.99MB 的 JavaScript 对象字面量，开发/测试首次动态导入需解析和转换整棵 AST。改为真实 JSON 资料、`?raw` 字符串加载及 `JSON.parse` 后，仍按需导入并保留原导出接口，减少对象 AST 转换。没有用异步外壳或空数据提前展示成功。

修复后的同一测量：大卫 367ms、资料加载 319ms。全量回归中大卫 1070ms，当时 load 约 38。两次主机状态不同，不能将耗时差全部算作代码收益，也不保证任意过载主机都能在 5 秒内完成。

额外对照 `compare-formats-repaired.log` 的同服务冷轮：原字面量 wall 645ms、CPU 647ms；raw JSON wall 324ms、CPU 346ms。后续 raw 轮复用了依赖缓存，不能用作冷启动数据。`baseline-data.log`/`fixed-data.log` 的独立服务启动测量存在噪声，修复后总耗时反而较慢，完整保留，不据此宣称稳定倍数改善。第一次格式对照因 Node 输出缓冲不足失败，修复诊断脚本缓冲后重跑，失败日志也保留。

## 实际改动与资料完整性

- `src/mirrorData.js`：保留 `MIRROR_CHARACTERS`、`MIRROR_THEMES` 导出，读取 JSON 字符串并真实解析。
- `src/mirrorData.json`：原有 718 位人物、15 个主题全部字段的无损迁移，未生成或批准任何内容。
- `src/__tests__/mirrorData.test.js`：对完整序列化资料校验修复前摘要 `5c3e22047327a00d2b1e97c7dcbe105076db9bf3e8a2e22799dc42f4640ffe77`，并核对条目数与真实 JSON。
- `scripts/generate_journeys.py`：原资料读取器依赖 JS 字面量，改为按脚本位置定位真实 JSON；其余生成/写入流程未改。真实调用读取器并逐字段对照修复前资料通过；没有执行生成或写入 journey 数据。
- 本记录和数字人本地交付记录。无数据库迁移，无后端变更，无新账号或配置要求，无提交、合并或部署。

## 真实验证

本轮证据目录：`/Users/stephen/.codex/visualizations/2026/10/22/01a1635c-54c9-74b2-980c-5bfb73d9b62b/mirror-cold-start/`。每条运行包含命令、真实 PID、退出码、资源采样、原始日志和 SHA256 receipt。

- `nice -n 10 node_modules/.bin/vitest run --maxWorkers=1 --minWorkers=1 --reporter=verbose`：160 文件、777/777 测试通过，exit 0，147.16s。包含原人物页 4/4 及数字人全套前端回归，原默认超时未改。
- 分阶段诊断运行仅通过外置 Vite 插件插入时间/CPU 标记，不修改产品或测试；修复后 5/5 通过，exit 0。
- 原生 Python 资料读取：718 条与修复前完整相等，exit 0。

- `GOMAXPROCS=1 nice -n 10 node_modules/.bin/vite build --outDir <本轮证据目录>/build`：exit 0，20.47s；未覆盖工作树的 `dist/`，未执行会修改翻译的 prebuild。仍有专用大包的体积提示。
- 原 `scripts/audit_startup_bundle.mjs` 对该真实构建执行：exit 0，首屏 751886 bytes < 900000 门槛；无抢先加载/预缓存专用大包。资料仍位于延迟加载的 `mirrorData-*.js`。
- 对新增测试及数字人前端源码/相关测试执行 ESLint：exit 0。`git diff --check`：exit 0；对人物页、原人物页测试、Vitest 配置执行 `git diff --exit-code`：exit 0。

独立只读审计未发现本轮范围内新的必须修复项，另外从 HEAD 原始 JS 导出独立比对全部 JSON 字段，并使用现有 Rollup AST 检查新构建的静态模块图，确认人物数据不在首屏或 precache 中。审计记录为证据目录的 `ADVERSARIAL_REVIEW.md`；它未重复全量测试或授予生产认证。最终源文件/日志摘要见同目录 `SOURCE_AND_EVIDENCE.json`。组件中已有的供应商/API 夹具只证明本地契约，不能当作真实语音或外部服务验收。

## 回滚和未完成项

本轮增量可从证据包的 scoped patch 单独反向应用：恢复原 `src/mirrorData.js` 和脚本读取器，移除本轮新 JSON、完整性测试及文档增量。先核对后续编辑和哈希；不要用整库 reset 覆盖前一轮数字人改动或用户未跟踪的 Skill 包。无需数据库回滚，保留所有失败与通过证据。

外部账号、服务端配置、100 人真实媒体/版权材料、五方人工审批、签名发布与生产验收继续按 [外部解锁清单](DIGITAL_HUMAN_EXTERNAL_REQUIREMENTS.md) 逐项保持未完成。本轮资料格式优化没有更改任何审核状态或发声权限。
