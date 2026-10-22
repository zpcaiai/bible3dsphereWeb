# 数字人外部账号、配置与人工材料清单

日期：2026-10-22。以下是解锁条件，不是已接通凭证。密钥请保存在实际后端、Worker 或供应商的 Secrets 设置中，勿粘贴到聊天、前端 VITE_*、截图或 Git。

## 1. 生成学习草稿所需模型（可独立于语音先接通）

- 使用现有后端 `llm_provider.py` 支持的真实服务：OpenAI-compatible、Anthropic、Gemini-compatible，或已经运行的本地兼容模型。
- 提供选定服务/模型名称、可用区域、实际 base URL、调用预算与数据保留约束。配置现有 `AGENT_MODE=real`、`LLM_PROVIDER`、`LLM_MODEL`、`LLM_BASE_URL` 和所选服务的 `LLM_API_KEY`；本地无鉴权服务仍须明确可访问的 URL 与模型。
- `DIGITAL_HUMAN_DRAFT_GENERATION_ENABLED` 默认 `false`。只有在真实模型及预算明确后再开启；每次草稿最多一次模型请求，30 秒超时，无自动重试。
- 管理员可先调用 `POST /api/v1/digital-human/draft-context`，请求只含 `characterId`、`topicId`，本地组装真实 persona/引用，不调用模型。
- `POST /api/v1/digital-human/drafts` 仅管理员可调用，拒绝原始私人问题、对话历史和 Mock provider。输出一直是 `THEOLOGY_REVIEW`、`speechApproved=false`，不会进入公众回答或 Avatar。
- 引用可解析/属于主题不证明陈述语义被经文支持；人类须核对每条 claim。草稿不自动持久化，也不自动进入正式回答集；须按既有版本化内容发布流程纳入回答集、重新计算内容哈希并审核签名。
- 当前真实推理、模型质量与供应商隐私合规：`NOT_RUN`。配置完成不等于推理验收完成。

## 2. 实时收音与转写

- 一个可用的 LiveKit 项目，以及服务端 `LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET`。
- 部署 `Dockerfile.livekit-agent`，命名 Agent 为 `spiritual-planet-digital-human`，与应用使用同一项目。提供实际 Agent 状态、版本/镜像标识和无敏感正文的注册/STT 健康证据。
- `DIGITAL_HUMAN_STT_MODEL` 默认 `deepgram/nova-3:multi`，当前 Worker 走 LiveKit Inference，不读取独立 `DEEPGRAM_API_KEY`。
- 健康确认后才设置 `DIGITAL_HUMAN_LIVEKIT_AGENT_READY=true`。它只是操作者声明，不是自动健康探测或端到端通过。
- 真实设备麦克风权限、网络/WebRTC 连通性需实测。受限网络的 TURN 资源仅在实际拓扑要求时提供，不以通用 TURN 配置冒充 LiveKit 项目配置。

## 3. 3D 与发声服务

- 可用的 LiveSpeak 账户/部署与 HTTPS 嵌入 URL；配置 `DIGITAL_HUMAN_LIVESPEAK_EMBED_URL`、`DIGITAL_HUMAN_LIVESPEAK_ALLOWED_ORIGINS`。
- 本次已精确允许默认 `https://metaperson.avatarsdk.com` iframe 来源；自定义服务域必须在实际部署的 CSP 与后端允许源中同时精确配置，勿使用 `*`。
- 在 LiveSpeak 服务侧配置真实 TTS 授权及区域，给出每个角色获批的 `voiceProvider`、`voiceId`、语言和版本。当前适配器使用 Azure voice setter；ElevenLabs 专用切换尚未验收。
- MetaPerson 账户/导出授权用于制作角色 GLB。若已拥有合规模型，可直接提供模型；仅填 `METAPERSON_CLIENT_ID/SECRET` 不会自动生成 100 个角色，当前应用没有资产生成批处理管线。

## 4. 每个角色的真实媒体与版权材料

目标是 100 人，不能用共享预览 JPG 或浏览器固定说明音色替代。

- HTTPS GLB（含适用口型/viseme）、肖像、可用音色及各自真实版本。
- 模型和图片可下载字节的 SHA256，以及音色配置 SHA256；资源访问/CORS/服务条款证明。
- 模型、肖像、音色、人物描绘与使用场景的权利依据。
- `DIGITAL_HUMAN_ASSET_MANIFEST_JSON` 须为 `digital-human-assets/v1` 的真实清单。每项包含 `characterId`、`version`、`modelUrl`、`portraitUrl`、`modelSha256`、`portraitSha256`、`voiceProfileSha256`、`voiceProvider`、`voiceId`、语言，以及神学/版权/无障碍审核引用。`APPROVED` 只能在真实审核后设置。
- 用现有 `validate_digital_human_assets.py` 做实际字节校验。资产地址或摘要字段存在不等于资源已下载验证。

## 5. 五方独立人工审核与签名发布

必须由五个不同的授权人/可信密钥分别承担：

1. `theology_reviewer`：逐条事实、经文支持、推断与争议标签、禁止伪造启示。
2. `pastoral_reviewer`：危机转介、儿童/青少年、秘密陪伴与牧养边界。
3. `rights_reviewer`：模型、图像、音色、经文译本和来源使用权。
4. `accessibility_reviewer`：披露、字幕/文字回退、操作和听视觉可访问性。
5. `release_reviewer`：精确版本、构建、测试证据、回滚与发布决定。

提供审核人身份与角色授权、可信公钥、各自审核意见/材料摘要及 detached attestations。发布证书必须绑定精确的内容、目录和资产清单 SHA256，且由独立的受信 Ed25519 发布密钥签名。

配置 `DIGITAL_HUMAN_RELEASE_CERTIFICATE_PATH`、`DIGITAL_HUMAN_TRUSTED_RELEASE_KEYS_PATH`。私钥由人类安全保管，不上传前端或纳入证据包。现有脚本可准备审核包与签名证据；脚本不能替人作出批准。

## 6. 数据库、登录与最终验收

- 目标后端地址、现有登录/平台管理员角色与访问方式；真实 DB 的受控部署入口。确认迁移 `0242`、`0243` 和 RLS 已在正确数据库执行。
- 若需本地物理 SQL 回归，提供隔离的 `TEST_DATABASE_URL`，不能用生产库替代测试库。
- 可选本地向量模型：实际已部署模型与 `DIGITAL_HUMAN_EMBEDDING_MODEL_PATH`；没有时仍可使用词法与人物关系检索。
- 真实浏览器语音验收需要 `DIGITAL_HUMAN_E2E_BASE_URL`、本地认证状态文件 `DIGITAL_HUMAN_E2E_STORAGE_STATE`、真实语音 WAV 路径 `DIGITAL_HUMAN_E2E_AUDIO_FILE`。认证文件属于敏感材料，留在本机/受控 CI。
- 在目标设备实际验证半双工、切换人物、断连/重试、语音转写、审核门、Avatar 开始/结束与口型、目标并发与故障恢复。
- 当前单进程指标不是跨实例持久监控；当前本地子进程 HTTP 的登录身份是测试夹具，未验收生产登录、数据库写入或供应商链路。

Vercel CLI 在本次环境未安装。如后续由你选择使用 Vercel CLI 管理部署，建议安装 `npm i -g vercel` 以使用 env pull/deploy/logs；安装与生产部署未在本次执行。

当前整体数字人产品：`BLOCKED_INCOMPLETE / NOT_CERTIFIED`。本地实现及测试与上述外部验收分别计数。
