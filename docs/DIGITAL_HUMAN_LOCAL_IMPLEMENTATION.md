# 数字人本地功能补齐记录 — 2026-10-22

本次交付的是可独立于供应商账号执行的本地功能，以及受严格门禁保护的真实模型草稿调用入口。整体产品仍为 `BLOCKED_INCOMPLETE / NOT_CERTIFIED`，没有部署、开通供应商或批准任何内容。

## 实际实现

- 100 人的真实研读目录，532 个主题与人物关系按需浏览；研读资料明确待审，不冒充完整人物答案。
- 组合引用、跨章范围、书卷别名、全书与单章书卷简写解析；552 种实际目录引用全部对照本地章节目次验证。
- 不确定问题优先于预设回答；修复礼貌前缀绕过、身高/外貌混合问题，以及把已知圣经历史叙事误判为用户危机的情况。
- 同人物主题 ID 追问，最多四个 ID；服务端不信任浏览器自造回答或审核状态，不持久化原始问答。
- 人物切换/会话清空取消并隔离旧请求；身份识别采用会话与查询版本，过期结果不再切回旧人物。
- 提交文字前停止收音；旧麦克风开启与旧转写即使晚于快速文字轮次返回也会失效。Avatar 状态不再覆盖真实房间状态，关闭错误提示不能解开发声锁。
- Avatar 启动、模型加载、发声确认与结束有界等待，错误回退文字、显式重试；不使用未文档化的 stop 命令。
- 可用范围提示准确区分配置、资产校验、内容审核、真实设备验证；没有将配置存在当健康或认证。
- 两条部署路径精确放行默认 LiveSpeak iframe origin；没有通配符放行。
- 管理员草稿上下文与生成接口：仅接受真实目录人物/主题 ID；复用现有真实模型接口，默认关闭，拒绝 Mock。逐项校验引用、人物和边界，所有结果始终待人工审核、不可发声、不自动持久化/发布。

## 保留的分母

真实执行全部 532 个目录问题后的结果：

| 实际结果 | 数量 |
|---|---:|
| G1 经文证据入口 | 351 |
| G5 完整预设回答 | 5 |
| G0 不支持／缺证据拦截 | 176 |

五条预设仍只覆盖摩西、大卫、彼得、保罗四人。356 个有引用主题可以组装真实模型草稿上下文，不等于已经生成或人工批准 356 条答案。此次没有真实模型推理，没有真实供应商语音，也没有 100 人真实媒体完成凭证。

## 主要实际文件

前端 `bible3dsphereWeb`：

- `src/features/spiritual-planet/digital-human/DigitalHumanWorkspace.jsx`
- `DigitalHumanStudyPanel.jsx`、`DigitalHumanReadinessPanel.jsx`、`LiveKitRealtimeSession.js`、`MetaPersonLiveSpeakAdapter.js`、`api.js`、`contracts.js`、`digitalHuman.css`（同上目录）
- `nginx.conf`、`vercel.json`
- 对应的 workspace、study、realtime、avatar、API、contract、deployment 测试，以及既有身份映射、秘密边界、运营面板、人物图谱和平台导航回归。
- `docs/DIGITAL_HUMAN_EXTERNAL_REQUIREMENTS.md` 与本记录。

后端 `bible3dsphere`：

- `backend/digital_human/scripture.py`、`study.py`、`service.py`、`contracts.py`、`readiness.py`、`drafts.py`
- `backend/routers/digital_human.py`、`.env.example`
- `backend/tests/test_digital_human_{scripture,study,context,context_api,readiness,drafts,drafts_api,native_http}.py`
- `docs/digital-human-v1.3.0-operations.md`

没有新增数据库迁移；目标数据库的 0242/0243、RLS 与审计写入本次没有验收。既有未跟踪的两个 Skill 包及 zip 保持原样。

## 实际验证与局限

证据目录：`/Users/stephen/.codex/visualizations/2026/10/22/01a1635c-54c9-74b2-980c-5bfb73d9b62b/digital-human-implementation/`。原始失败、修复后运行和最终运行分开保存，没有删除失败证据。

- 后端最终专项命令：`PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=backend nice -n 10 .venv/bin/python -m pytest --noconftest -s -c backend/tests/pytest.ini backend/tests/test_digital_human*.py`，83/83 PASS，exit 0。未加载全量主应用初始化或连接真实 DB。
- 真实子进程 HTTP：启动真实 Uvicorn/FastAPI 路由，执行实际目录、证据、上下文、引用和响应校验。登录身份是明确的测试夹具；不证明生产认证、SQL 或供应商执行。
- 前一轮前端 12 文件回归：57/59 PASS，2 个既有人物图谱案例在原 5000ms 限制超时，exit 1。主机 8 CPU，观察到 load 约 176；资源争用可能相关，不能据此消除失败。后续修复及全量回归见下文。
- 保持测试、断言和超时不变，单次隔离复跑 `nice -n 10 node_modules/.bin/vitest run src/__tests__/MirrorPageDigitalHuman.test.jsx --maxWorkers=1 --minWorkers=1`：3/4 PASS，exit 1，大卫项仍超时。该文件和 `src/MirrorPage.jsx` 均与 HEAD 一致，且该测试替换了数字人工作台；不能据此认定是新实现回归，也不能算作全绿。原始日志为 `frontend-final.log`、`mirror-final-isolated.log`、`resource-and-timeout.log`。
- 数字人 workspace、语音状态、Avatar、契约、研读、API、部署、秘密边界、运营与人物映射，以及平台导航断言已实际运行；涉及 room、iframe 或 API 夹具的组件测试只证明本地适配契约。
- 单线程、低优先级实际 Vite 构建：exit 0；产物保存在证据目录 `build/`，未覆盖现有 `dist/`，未执行会写翻译文件的 i18n fill。
- 原有启动包审计：exit 0，751886 bytes，小于 900000 bytes 门槛，无抢先加载/预缓存的专用大包。
- 实际 nginx `-t`：exit 0；前端限定路径 ESLint：exit 0。
- 独立只读验证代理已对原路由与异步竞态做对抗复核，发现的问题均已修复；新增草稿边界源码及 12/12 本地门禁也已复核。它不是神学人工批准或独立产品认证。

所有命令、输出 SHA256、源文件清单与源差异收集在同一证据目录。整体 E0–E5 不授予级别：基础供应商 Avatar/语音链路仍未执行，局部引用/安全约束测试不构成完整 E 级验收。

前一轮本地验证状态为 `BLOCKED_INCOMPLETE`，对应失败证据继续保留。2026-10-22 继续修复人物资料冷启动后，原人物页测试 4/4、全前端 160 文件 777/777 已通过，exit 0；保持原断言和 5000ms 门槛。详细原因区分、实际命令、构建检查及本轮回滚见 [人物页冷启动修复记录](MIRROR_COLD_START_FIX.md)。没有提高超时、跳过测试、终止其他任务或开通外部算力。外部产品验收仍未完成。

## 内容审核、外部解锁与回滚

现有未批准内容及新增资料/草稿仍为 `THEOLOGY_REVIEW`；没有新签发实际人类审批或生产发布证书。外部账号、配置、版权、五方审核与真实验收材料见 `DIGITAL_HUMAN_EXTERNAL_REQUIREMENTS.md`。

代码变更保留在两个工作树，未提交、未合并、未部署。回滚时按交付差异逐项反向应用，只撤销本次新增/修改，保留其他工作；本次无需数据库回滚。若后续启用草稿或供应商，再先关闭草稿开关和对应运行配置，然后按既有 operations 文档撤回发布证书/资产配置。不要删除用户数据、审核或原始证据。
