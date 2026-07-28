# 多模态输出机会盘点 · bible3dsphere / bible3dsphereWeb

> 盘点日期：2026-07-28
> 范围：`bible3dsphereWeb/src` 全量页面与 feature 模块（约 190 个组件/页面）+ `bible3dsphere/backend` 现有媒体能力
> 目的：找出「加上非文本模态输出后，用户体验会明显变好」的模块，并给出具体该加哪几种模态、复用什么、需要新建什么

---

## 0. 结论速览（Top 12 最高性价比）

| # | 模块 | 现状 | 建议新增模态 | 为什么体验会更好 | 落地成本 |
|---|---|---|---|---|---|
| 1 | **危机关怀 BreathingGuide / GroundingExercise / TraumaGroundingFlow** | 纯文字 + CSS 动画 | **节律引导音 + 语音旁白 + 触觉振动 + 呼吸动效** | 惊恐/解离状态下**读不进字**，只能跟声音和节奏走。这是全站唯一「不加模态就等于功能失效」的场景 | 低（Web Audio + Vibration API，无需后端） |
| 2 | **Lectio Divina 圣经默想** | 五步纯文本表单 | **分步语音引导（TTS）+ 计时留白音 + 背景环境音 + 完成图卡** | Lectio 的本质是「慢」和「闭眼听」。现在是填表体验，模态一加质变 | 低（复用 `/api/tts` + `useGlobalAudio`） |
| 3 | **MemoryVersePage / MemoryDeckPage 背经** | 纯文字卡 + SM-2 | **经文朗读音频 + 分段跟读 + 遮词图像卡 + 语音复诵评分（STT）** | 记忆是多通道任务；听 + 说 + 看的留存率远高于只看 | 中（TTS 已有；跟读评分需接 Deepgram） |
| 4 | **Examen / DailySoulQuestion / MorningDew / PsalmPrayer** | 纯文字问答 | **TTS 引导词 + 停顿留白 + 一句话音频回听** | 省察和晨祷是闭眼场景，文字要求睁眼低头看手机，破坏专注 | 低 |
| 5 | **spiritual-formation 15 个 Dashboard**（VirtueVice / OrdoAmoris / HolyHabit / GiftCalling…） | 全部纯文本卡片 + 进度条 | **SVG 雷达图/桑基图/日历热力图 + 结构示意图** | 这些是「多维状态」数据，文字列表读不出全貌，也看不出趋势 | 中（沿用 `FormationChartsPage` 手写 SVG 风格，零新依赖） |
| 6 | **Stronghold 坚固营垒 / SinPattern** | 纯文本档案 | **成因链路图（有向图）+ 时间轴 + 前后对比卡** | 「触发→念头→行为→后果」本质是链路，图比段落清楚一个量级 | 中 |
| 7 | **Formation Twin 数字孪生**（7 个子页全纯文本） | 纯文本 | **状态雷达 + 情绪时序曲线 + 场景推演分支图 + 语音复盘播报** | 「孪生」的说服力来自可视化的「我」，现在完全没有形象 | 中高 |
| 8 | **TestimonyWall / ShareWall / PrayerWall** | 文字 + 已有 PNG 分享卡 | **音频见证（30–90s）+ 一键短视频卡 + 语音留言祷告** | 见证的感染力在声音里；短视频是唯一能出圈的载体 | 中（音频低、视频复用 film_studio） |
| 9 | **AITutorChatPage / DoctrineLearningPage / NineMarks / Worldview** | 纯文本问答 | **概念关系图 + 可折叠知识树 + 讲解音频 + 图示插画** | 教义是体系性知识，缺结构图就只能死记 | 中 |
| 10 | **PilgrimJourneyPage / DiscipleshipPathway / GrowthMap** | 纯文本清单 | **旅程地图（路径可视化）+ 里程碑动效 + 阶段音频寄语** | 「路程感」是留存的核心情绪，文字列表提供不了 | 中 |
| 11 | **Guardian 守护精灵** | 已有 sprite + 语音 hook | **表情/姿态状态机动画 + 情绪化语音 + 陪伴音效** | 拟人陪伴的可信度几乎全部由动画和声音承载 | 中 |
| 12 | **attention 注意力模块 ReportsScreen** | CSS 条形 + 文字周报 | **时段热力图 + 趋势曲线 + 语音周报（1 分钟播报）** | 行为数据不画出来就没有说服力，改不了行为 | 低 |

---

## 1. 现有多模态底座（可直接复用，别重复造）

| 能力 | 实现位置 | 状态 | 已接入模块 |
|---|---|---|---|
| **服务端 TTS** | `POST /api/tts`（`backend/routers/verse.py`）→ ElevenLabs → edge-tts → Google TTS 多级兜底 | ✅ 生产可用 | BibleReading、DailyDevotion、PersonalDevotion、SermonJournal、ShareWall、SpiritualBooks、Mirror、Engineering |
| **前端 TTS 单例** | `src/useGlobalAudio.jsx`（全局唯一播放 + 经文引用展开 + 暂停/续播） | ✅ 成熟 | 同上 |
| **语音选择策略** | `src/voice.js`（中英嗓音自动判定） | ✅ | 全站 |
| **浏览器原生 TTS 兜底** | `speechSynthesis` | ✅ | 后端 502/503 时自动降级 |
| **STT 语音输入** | `POST /api/speech/transcribe`（Deepgram）+ `src/hooks/useSpeechInput.js` + `recorderUtils.js` | ✅ | PrayerWall、Evangelism、FormationTwinWorkspace、Guardian、通话记录 |
| **PNG 分享卡生成** | `src/components/ShareCardModal.jsx`（Canvas 1080×1350，4 套渐变模板，中英断行） | ✅ 很成熟 | BibleSearch、DevotionJournal、Evangelism、MemoryDeck、PrayerWall、SermonJournal、ShareWall |
| **PDF / 截图导出** | `jspdf` + `html2canvas`（`App.jsx` 动态 import） | ✅ | 导出场景 |
| **视频生成流水线** | `backend/routers/film_studio.py`（Claude/Gemini/DeepSeek 分镜 → Veo / Kling 生成 → edge-tts 配音 → ffmpeg 合成 → R2 上传）；`video_studio_server.py`、`biblical_film_studio.py` | ✅ 已建成但**几乎没有前端入口** | 仅内部/工程页 |
| **PPT → 视频** | `film_studio.py: run_ppt_pipeline`（Ken Burns + 配音） | ✅ | 未暴露 |
| **实时音视频** | LiveKit（`backend/routers/voice.py` + `src/realtime/LiveKitCall.jsx`、`VideoTile.jsx`）+ WebRTC + Krisp 降噪 + E2EE | ✅ | VoiceRoom、好友通话 |
| **3D / WebGL** | `three@0.170` + `@react-three/fiber` + `drei` + `postprocessing` | ✅ | EmotionSphereScene、FormationGraph3D、SolomonTempleSection |
| **地图** | `maplibre-gl` + `deck.gl` + Cesium/Mapbox/Leaflet 适配层（`src/map/*`）+ `gltfModelLayer.js` | ✅ | BibleMap、BibleAtlas、MapScenes、JerusalemSandbox |
| **手写 SVG 图表** | `FormationChartsPage`（热力图/趋势）、`GrowthMapPage`（雷达图）、`MVFEPage`、`SoulDashboard`、`attention/ReportsScreen` | ✅ **无图表库依赖**，风格已统一 | 少数几个页面 |
| **音频资源托管** | Cloudflare R2 + `cdn.holiness.uk`（`HymnPlayer` 诗歌 mp3、`VIDEO_CDN_BASE`、`R2_VIDEO_PREFIX`） | ✅ | HymnPlayer、主日学视频、慕道班课程 |
| **推送** | Web Push（VAPID）+ Twilio SMS | ✅ | 提醒 |
| **图像生成** | ❌ **目前没有**（但 `GEMINI_API_KEY` / `GOOGLE_API_KEY` 已配置，可接 Imagen；`KLING_*` 已配置可做图生视频） | ⚠️ 缺口 | — |
| **触觉 / 振动** | ❌ 没有 | ⚠️ 缺口 | — |
| **环境音 / 音景** | ❌ 没有（HymnPlayer 只播完整诗歌） | ⚠️ 缺口 | — |

**关键判断：TTS、STT、图卡、视频、3D、地图、实时音视频这 7 项底座都已就绪，绝大多数机会是「接线」而不是「造轮子」。真正缺的只有三样：图像生成、环境音/节律音、触觉反馈。**

---

## 2. 判定口径：什么情况下「加模态」才真的更好

不是所有模块都该加。本次盘点用 5 条判据，命中任意一条才列入：

| 判据 | 含义 | 对应模态 |
|---|---|---|
| **A. 闭眼 / 免手场景** | 用户在祷告、默想、通勤、夜间、开车、做家务 | TTS 音频、语音输入 |
| **B. 高唤起 / 低认知带宽场景** | 惊恐、解离、崩溃、试探当下——**读不进文字** | 节律音、旁白、振动、呼吸动效 |
| **C. 结构性 / 关系型信息** | 多维状态、因果链路、时间演变、空间关系、体系知识 | SVG 图表、关系图、时间轴、3D、地图 |
| **D. 传播 / 见证意图** | 用户想分享给人、想被看见、小组要用 | 图卡、短视频、音频片段 |
| **E. 记忆 / 训练意图** | 背诵、复述、操练、纠错 | 朗读音频、遮罩图像、STT 复诵评分 |

反例（**不建议加**）：`PlatformAdminPage`、`BillingPage`、`RecycleBinPage`、`ExportDataPage`、`MissionOS` 各 Console、`OrgConsolePage`、`ChurchIntegrationPage` —— 后台管理型页面，文本+表格已是最优解，加模态只会增加噪音和维护成本。（唯一例外：Mission OS 的事故/审计控制台可加**趋势迷你图**，但那属于图表而非多模态。）

---

## 3. 全量模块 × 模态机会矩阵

图例：`♪` 音频/TTS · `🎙` 语音输入/STT · `🖼` 静态图像/图卡 · `📊` 数据可视化(SVG) · `🕸` 关系图/结构图 · `🎞` 动效/动画 · `🎬` 视频 · `🧊` 3D · `📳` 触觉 · `🔊` 环境音/音景

---

### 域 1 · 读经与默想（12 个模块）

| 模块 | 当前输出 | 建议模态 | 具体做什么 | 优先级 | 复用 / 新建 |
|---|---|---|---|---|---|
| `BibleReadingPage` | 文本 + ♪TTS | ♪ 增强、📊 | 连续朗读整章 + 章节进度环 + 睡眠定时；朗读速度记忆 | P1 | 复用 `useGlobalAudio` |
| `DailyDevotionPage` | 文本 + ♪ | ♪🖼 | 「一分钟灵修音频版」整篇串播（经文→释义→祷告，中间留白）；结束生成当日图卡 | **P0** | 复用 TTS + ShareCardModal |
| `PersonalDevotionPage` / `QuickDevotionPage` | 文本 + ♪ | ♪🖼 | 同上；Quick 版做 90 秒纯音频模式 | P1 | 复用 |
| **`LectioPage`** | **纯文本五步表单** | **♪🔊🎙🖼** | ①每步引导词 TTS 播报 ②步与步之间 20–60s 计时留白（可视呼吸圈 + 极轻环境音）③「默观」步骤只留声音不留字 ④完成后生成「今日经文 + 微顺服」图卡 ⑤各步允许语音口述代替打字 | **P0** | TTS/STT 复用；**新建**：留白计时器组件 + 环境音资源 |
| `MccheynePage` / `ReadingPlanPage` | 文本清单 | 📊🖼 | 年度读经进度日历热力图（365 格）+ 完成里程碑图卡 | P1 | 复用 `FormationChartsPage` SVG 模式 |
| `MorningDewPage` | 纯文本 | ♪ | 晨间 60 秒音频（经文 + 一句话）自动播放，锁屏可听 | **P0** | 复用 TTS |
| `PsalmPrayerPage` | 纯文本 | ♪🔊 | 诗篇吟诵式朗读（慢速 + 回响）；可选竖琴/风声底噪 | P1 | TTS 复用 + **新建**音景 |
| `MemoryVersePage` | 纯文本 | ♪🎙🖼 | ①逐节朗读 ②「跟我读」分句跟读 ③遮词卡（渐进挖空图像）④语音复诵 → STT 比对给准确率 | **P0** | TTS/STT 复用；**新建**遮词卡渲染 + 文本比对打分 |
| `MemoryDeckPage` | 文本卡 + SM-2 + 🖼分享卡 | ♪🎙 | 卡片正面「只听不看」模式；自评前先语音复述 | **P0** | 复用 |
| `BibleSearchPage` / `PersonalSearchPage` | 文本结果 + 🖼 | 📊 | 搜索结果的经卷分布条形图（哪些书卷命中多） | P2 | 手写 SVG |
| `SpiritualBooksPage` | 文本 + ♪ | ♪ | 章节连续播放 + 书签续播（有声书体验） | P1 | 复用 |
| `HymnPlayer` | ♪ mp3 + 歌词 | 🖼📊 | 曲谱图（已预留 `public/hymns/<id>.png` 但多数缺资源）+ 歌词逐句高亮（已有 `hymnTimings.js`，可扩展到全部诗歌） | P1 | 补资源为主 |

---

### 域 2 · 祷告与内在生活（11 个模块）

| 模块 | 当前输出 | 建议模态 | 具体做什么 | 优先级 |
|---|---|---|---|---|
| `PrayerWallPage` | 文本 + 🖼 + 🎙 | ♪ | ①代祷「听祷告」朗读 ②**语音代祷留言**（30s 音频回复，比文字有温度）③每日代祷清单音频串播 | **P0** |
| `SharedPrayerPage` / `IntercessionPage` | 纯文本 | ♪📊 | 代祷链音频播报；代祷网络关系图（谁为谁祷告） | P1 |
| **`ExamenPage`** | **纯文本 5 问** | **♪🔊🎙** | 依纳爵省察本就是**听着做**的操练：每问 TTS 播报 + 30s 静默留白 + 语音口述回答 | **P0** |
| `DailySoulQuestionPage` | 文本 + ♪ | 🎙🖼 | 语音回答；回答摘要生成「灵魂日签」图卡 | P1 |
| `PrayerRulePage` | 纯文本 | ♪📊 | 日课时刻音频提醒 + 一周日课完成度环形图 | P1 |
| `CommunionPage` | 纯文本 | ♪🔊 | 圣餐默想引导音频 + 安静音景 | P1 |
| `PracticingPresencePage` | 纯文本 | ♪📳🔊 | 「时时操练同在」——每小时轻振动 + 一句话音频锚点（这是典型的免手场景） | **P0** |
| `SabbathRestPage` | 纯文本 | 🔊♪ | 安息日音景模式（免打扰 + 环境音 + 长段诗篇朗读） | P2 |
| `FastingSimplicityPage` | 纯文本 | 📊♪ | 禁食时段进度环 + 时段提醒语音 | P2 |
| `MirrorPage` / `CheckInPage` | 文本 + ♪ + 部分图 | 📊🎞 | 情绪打卡后的**情绪轨迹曲线**（现只在别处有）+ 打卡完成微动效 | P1 |
| `SOSModal` | 纯文本 | ♪📳 | 见「域 3」——SOS 必须有声音和振动 | **P0** |

---

### 域 3 · 危机关怀 crisis-care（15 个组件，**当前 100% 纯文本，是最大缺口**）

> 这是全站**唯一「不加模态 = 功能残缺」**的域。惊恐发作、解离、创伤闪回时，用户的文字处理能力接近归零。

| 组件 | 当前 | 建议模态 | 具体做什么 | 优先级 |
|---|---|---|---|---|
| **`BreathingGuide`**（4-1-6 呼吸） | 文字 + CSS 呼吸圈 | **♪📳🎞🔊** | ①**节律引导音**：吸气上行音、屏息静音、呼气下行音（Web Audio 合成正弦波，无需音频文件）②每相位切换**振动**（`navigator.vibrate([...])`）③语音口令「吸……气」「呼……气」④呼吸圈动画同步缩放（现仅 CSS keyframes，建议改为受控动画确保与音同步）⑤可选海浪/雨声底噪 | **P0** |
| **`GroundingExercise`**（5-4-3-2-1） | 纯文本清单 | **♪📳** | 每步语音朗读 + 完成一步振动确认；「不用睁眼也能做完」 | **P0** |
| `TraumaGroundingFlow` | 纯文本 | ♪🔊 | 全流程慢速旁白 + 稳定低频底噪；**严禁**任何突发音效 | **P0** |
| `AddictionDelayFlow`（延迟策略） | 纯文本 | ♪📊📳 | 倒计时环 + 语音陪伴「再撑 10 分钟，我陪你」+ 每分钟轻振动 | **P0** |
| `SafetyCheckFlow` / `CrisisIntakeFlow` | 纯文本问答 | ♪🎙 | 语音问答（打字对崩溃中的人是负担） | P1 |
| `SafetyPlanEditor` | 纯文本表单 | 🖼 | 生成**安全计划卡片图**（可截图/锁屏/打印，危机时不需要开 App） | **P0** |
| `SpiritualComfortCard` | 纯文本 | ♪🖼 | 安慰经文朗读 + 图卡 | P1 |
| `CrisisResourcePanel` | 纯文本热线列表 | 🖼 | 热线卡片图（离线可看） | P1 |
| `EmergencyEscalationPanel` | 纯文本 | ♪📳 | 升级确认的明确音频/振动反馈 | P1 |
| `PostCrisisTimeline` | 纯文本 | 📊 | 危机后恢复曲线（看见「在变好」本身就是干预） | P1 |
| `CaregiverInbox` / `CollaborationConsole` / `GuardianNetworkManager` | 纯文本 | 📊 | 关怀负荷热力图（哪位关怀者过载） | P2 |
| `CrisisHelpButton` / `SOSModal` | 纯文本 | 📳♪ | 长按触发的触觉确认 + 「我在」语音应答 | **P0** |

**护栏（必须写进实现）**：危机场景的音频**默认不自动播放**，需用户主动点「开启声音」；禁止任何尖锐、突发、高频音；所有音频可一键静音；振动强度需可关闭（PTSD 用户可能被振动触发）。

---

### 域 4 · 灵命塑造 spiritual-formation（约 40 个组件，当前 100% 纯文本 + 进度条）

| 模块 | 当前 | 建议模态 | 具体做什么 | 优先级 |
|---|---|---|---|---|
| **`StrongholdProfile` / `StrongholdCard`** | 纯文本档案 | **🕸📊** | **成因链路图**：触发源 → 谎言信念 → 情绪 → 行为 → 后果 → 强化循环（有向图，节点可点开）。文字段落表达不了「循环」 | **P0** |
| `StrongholdTimeline` | 纯文本列表 | 📊 | 时间轴 + 强度带状图（哪段时间在恶化） | **P0** |
| `SinPatternCard` / `SinPatternLibrary` | 纯文本 | 🕸🖼 | 罪模式的「诱因—反应」示意图 + 图书馆式分类卡 | P1 |
| **`FruitTree`**（圣灵果子） | **文字 + 横条进度** | **🎞📊** | 名字就叫「树」，却没有树。→ **SVG 生长树可视化**：9 种果子为枝，操练次数决定叶/果密度；带轻微生长动效 | **P0**（叙事价值极高） |
| **`NewCreationMap`**（新造进度图） | **纯文本四个时间窗卡片** | **📊🕸** | 名字叫「地图」却是文字。→ 时间轴 + 模式消退/果子生长的**双轨对照图** | **P0** |
| `HorariumEngine`（日课时刻） | 纯文本 | 📊♪ | **24 小时环形日课盘**（修道传统的 Horarium 本就是圆盘）+ 到点语音提示 | **P0** |
| `HolyLifeEngine` | 纯文本 533 行 | 📊 | 技能雷达 + 阶段进度 | P1 |
| `GraceRecoveryFlow` / `RepentancePathView` | 纯文本 | 🎞♪ | 悔改路径的分步动效 + 赦罪宣告朗读（听见赦免 ≠ 读到赦免） | **P0** |
| `ThoughtCaptiveFlow`（夺回思想） | 纯文本 | 🎞 | 「念头 → 检验 → 替换」三步动效卡 | P1 |
| `WeeklyReviewPanel` | 纯文本 | 📊♪ | 周回顾图表 + **1 分钟语音周报** | **P0** |
| `TransformationPlanDashboard` / `Card` | 纯文本 | 📊 | 甘特式计划条 + 完成度 | P1 |
| `VirtueViceDashboard` | 纯文本 | 📊 | **德性—恶习对峙雷达图**（成对呈现最直观） | **P0** |
| `OrdoAmorisDashboard`（爱的次序） | 纯文本 | 📊🕸 | **同心圆图**（神/家人/邻舍/事工/自我 的爱的排序），错序时高亮 | **P0** |
| `HolyHabitDashboard` | 纯文本 | 📊 | 习惯连续天数热力图（GitHub 风格） | **P0** |
| `SacramentCalendarOrbit` | 纯文本 | 🧊📊 | 名字带 Orbit → **教会年历轮盘**（将临/降临/大斋/复活/圣灵降临 环形着色） | **P0** |
| `CreedCatechismGalaxy` | 纯文本 | 🧊🕸 | 名字带 Galaxy → **教义星系图**（信经条目为星，关联为连线）；可复用 `EmotionSphereScene` 的 R3F 套路 | P1 |
| `ScriptureFormationDashboard` | 纯文本 | 📊🕸 | 经文主题覆盖图（哪些主题从没碰过） | P1 |
| `PrayerCommunionDashboard` | 纯文本 | 📊♪ | 祷告类型分布 + 时长趋势 | P1 |
| `GiftCallingDashboard` / `GiftCallingView` | 纯文本 699 行 | 📊🖼 | **恩赐雷达图 + 呼召画像图卡**（可分享给教会） | **P0** |
| `SufferingCareDashboard` / `CrossLamentHopeDashboard` | 纯文本 | 📊♪ | 哀歌曲线（诗篇式「下降—转折—盼望」三段可视化）+ 哀歌朗读 | P1 |
| `WorldviewFormationDashboard` / `WorldviewPage` | 纯文本 | 🕸📊 | 世界观框架对比图（创造/堕落/救赎/成全 四格） | P1 |
| `CommunityDiscipleshipDashboard` | 纯文本 | 🕸📊 | 门训关系网络图（谁在带谁） | P1 |
| `RuleDiscernmentDashboard` / `GraceIdentityCard` / `PlatformIntegrationDashboard` | 纯文本 | 📊 | 常规图表化 | P2 |
| `DailySpiritualScanForm` | 纯文本表单 | 🎙♪ | 语音扫描（说 60 秒，自动结构化） | P1 |

> **共性结论**：这个域里 **15 个 Dashboard 全是纯文本卡片**，但它们的命名（Tree / Map / Orbit / Galaxy / Radar）明确暗示了可视化意图。**把这 15 个统一图表化，是全站单点收益最大的一次性投入** —— 且可以完全复用 `FormationChartsPage`/`GrowthMapPage` 的手写 SVG 风格，**零新增依赖**。

---

### 域 5 · Formation Twin 数字孪生（7 个子页，全纯文本）

| 模块 | 建议模态 | 具体做什么 | 优先级 |
|---|---|---|---|
| `FormationTwinPage`（主视图） | 🧊📊 | **孪生体可视化**：一个可旋转的「灵命体」（可复用 `FormationGraph3D` / `EmotionSphereScene`），各维度为发光节点 | P1 |
| `FormationTwinEmotions` | 📊 | 情绪时序曲线 + 情绪光谱带 | **P0** |
| `FormationTwinPatterns` | 🕸📊 | 时间模式热力图（周×时段）+ 模式关联图 | **P0** |
| `FormationTwinScenarios` | 🕸🎞 | **场景推演分支树**（「如果这样选 → 可能走向」），这是孪生最有说服力的输出 | **P0** |
| `FormationTwinProtection` | 📊 | 试探风险仪表盘（风险等级环 + 触发因子条） | P1 |
| `FormationTwinReflections` | ♪🎙 | 反思语音输入 + 反思摘要音频回听 | P1 |
| `FormationTwinFormation` | 📊 | 塑造维度雷达 + 前后对比 | P1 |
| `FormationTwinWorkspace` | 🎙（已有） | 增加 ♪ 语音播报「孪生今日观察」 | P1 |

---

### 域 6 · 可视化与洞察（已有部分图，需补齐）

| 模块 | 当前 | 建议 | 优先级 |
|---|---|---|---|
| `EmotionSphereScene` | 🧊 3D 情绪球 | 加 ♪：点击情绪节点朗读对应经文；加 🎞：情绪轨迹的时间动画回放 | P1 |
| `FormationGraph3D` | 🧊 | 加 📊 侧栏统计 + 节点点击语音解读 | P2 |
| `RelationshipGraphView` | 🕸 | 已有图，加 📊 关系强度热力 | P2 |
| `GrowthMapPage` | 📊 雷达 | 加 🎞 时间滑杆看雷达变化 + 🖼 成长图卡分享 | P1 |
| `FormationChartsPage` | 📊 SVG | 加 ♪ 语音解读「这周你的曲线说明什么」 | P1 |
| `SoulDashboard` / `MVFEPage` | 📊 部分 | 补齐 + 统一视觉语言 | P1 |

---

### 域 7 · 圣经地图与历史（已有强底座，缺解说层）

| 模块 | 当前 | 建议模态 | 具体做什么 | 优先级 |
|---|---|---|---|---|
| `BibleMapPage` / `BibleAtlasPage` | 🧊🕸 地图 + 时间轴 | **♪🎬** | ①**路线播放解说**：`routePlayback.js` 已有播放能力，缺配音 → 保罗宣教行程边走边讲 ②关键事件 15s 短视频（Kling 图生视频已配置） | **P0** |
| `JerusalemSandbox` | 🧊 已是 Mapbox/MapLibre 3D 沙盘（时间轴剥离 + fill-extrusion + 受难周 FPV 巡游） | **♪🔊** | **视觉已经很强，缺的是声音**：FPV 巡游全程缺解说旁白，时期切换缺过渡音；建议每个站点 15–30s 配音 + 环境音（人声集市/圣殿号角） | **P0**（补音频，非补视觉） |
| `SolomonTempleSection` / `TempleSandbox` | 🧊 | 加 ♪ 器具/院落点击讲解 | P1 |
| `MapScenes` | 部分 | ♪🖼 | 场景旁白 + 场景卡 | P1 |
| `PilgrimJourneyPage` | 纯文本 | 📊🎞🖼 | **天路历程可视化路径**（关卡/驿站/当前位置）+ 到站动效 + 里程碑图卡 | **P0** |
| `AICommentaryPanel` | 文本 | ♪ | AI 释经朗读 | P1 |

---

### 域 8 · 学习、培训与布道（体系知识，最缺结构图）

| 模块 | 当前 | 建议模态 | 优先级 |
|---|---|---|---|
| `AITutorChatPage` | 纯文本对话 | ♪🕸🖼：回答朗读 + **自动生成概念关系图** + 关键概念图解 | **P0** |
| `DoctrineLearningPage` | 纯文本 | 🕸📊：教义知识树 + 掌握度热力图 | **P0** |
| `NineMarksPage` | 部分图 | 📊：九标记教会健康雷达 | P1 |
| `GospelDiagnosticPage` | 纯文本 | 🕸🖼：福音理解诊断图 + 结果卡 | P1 |
| `PersonalityPage`（1489 行） | 纯文本 | 📊🖼：人格维度雷达 + **可分享的人格画像卡**（传播力强） | **P0** |
| `SeekersClassView` / `FuelLibraryPage` | 文本 + 已有视频列表 | 🎬♪：课程视频已在 R2，补齐播放器体验 + 音频版课程（通勤听） | P1 |
| `EngineeringPage` | 文本 + ♪ | 🎬：**接上 film_studio 前端入口**（现在整条视频流水线没有产品入口） | **P0** |
| `SermonJournalPage` | 文本 + ♪🖼 | 🎙：讲道笔记语音速记（听道时打字很难） | **P0** |
| `MentorCoachingPage` / `DiscipleFormationView` | 纯文本 | 📊🕸：门训进度 + 关系图 | P1 |

---

### 域 9 · 社群、见证与实时

| 模块 | 当前 | 建议模态 | 具体做什么 | 优先级 |
|---|---|---|---|---|
| `TestimonyWallPage` | 纯文本 | **♪🎬🖼** | ①**音频见证**（30–90s 录音，比文字有 10 倍感染力）②一键把见证转成**竖版短视频**（文字 + 配音 + Ken Burns，`run_ppt_pipeline` 逻辑可复用）③见证图卡 | **P0** |
| `ShareWallPage` | 文本 + ♪🖼 | 🎬 | 分享内容一键成片 | P1 |
| `CommunityPage` / `CommunityHubPage` / `GroupHubPage` | 纯文本 | 📊🖼 | 社群活跃热力图 + 小组周报图卡 | P1 |
| `VoiceRoomPage` | 🎙♪ LiveKit | 🎞📊 | 说话者波形/音量可视化 + 房间氛围指示（现在是「黑箱语音」） | P1 |
| `realtime` 私聊/群聊 | 文本 | ♪🎙 | **语音消息**（底座已有 MediaRecorder + Deepgram，缺 UI）+ 语音转文字双呈现 | **P0** |
| `AccountabilityGroupPage` | 纯文本 | 📊 | 小组问责完成度矩阵 | P1 |
| `MeetingScheduleModal` / `MinutesModal` | 文本 | ♪ | 会议纪要语音摘要 | P2 |
| `EvangelismPage`（1550 行） | 文本 + 🎙🖼 | 🖼🎬 | 福音对话要点卡 + 见证短片；联系人祷告进度图 | P1 |

---

### 域 10 · 决策、辅导与人生议题

| 模块 | 当前 | 建议模态 | 优先级 |
|---|---|---|---|
| `DecisionSupportPage`（1846 行，纯文本） | 🕸📊：**决策树 / 权衡矩阵可视化**（多选项多标准，表格+图远胜文字）+ 结果图卡 | **P0** |
| `DecisionDiscernmentPage` | 🕸：分辨路径图 | P1 |
| `WaitingPathPage` | 📊🎞：等候进程条 + 阶段动效（等候最需要「看见进展」） | **P0** |
| `IdolatryMonitorPage` | 📊🕸：偶像雷达 + 时间趋势（哪个偶像在抬头） | **P0** |
| `TemptationResistancePage` | 📊📳♪：抵挡记录曲线 + 试探当下的呼吸/振动介入（与 crisis-care 共用组件） | **P0** |
| `DatingPriorityPage` | 📊：优先级排序可视化 | P1 |
| `SpiritualCheckupPage` / `SpiritualPartnerPage` | 📊：体检雷达 + 伙伴互动图 | P1 |
| `BehaviorPage` / `HabitsPage` | 📊：习惯连续性热力图 + 能量-完成度散点 | **P0** |

---

### 域 11 · 注意力模块 attention（6 屏，全纯文本）

| 模块 | 建议模态 | 具体做什么 | 优先级 |
|---|---|---|---|
| `ReportsScreen` | 📊♪ | 已有 `AllocationChart`（CSS 条形）+ `GrowthCurvePanel`（文字摘要）→ 升级为**时段热力图（周×小时）+ 真趋势曲线**，再加 **1 分钟语音周报** | **P0** |
| `AccountabilityScreen` | 📊 | 问责伙伴响应矩阵 | P1 |
| `GroupsScreen` | 📊 | 小组分数对比条 | P1 |
| `AttentionPage`（1089 行） | 📊🎞 | 分数环 + 变化动效 | P1 |

---

### 域 12 · Guardian 守护精灵 & 游戏化

| 模块 | 当前 | 建议模态 | 优先级 |
|---|---|---|---|
| `GuardianSprite` / `GuardianWidget` | 已有 sprite + `useGuardianVoice` | 🎞♪🔊：**表情/姿态状态机**（喜/忧/陪伴/提醒）+ 情绪化语音 + 轻音效 | **P0** |
| `GuardianChatPanel` | 文本 | ♪🎙：全语音对话模式 | P1 |
| `EmotionCheckIn` / `SpiritualCheckIn` | 文本 | 🎞：打卡微动效反馈 | P1 |
| `PatternInsightCard` / `IdolMonitorCard` | 文本 | 📊：迷你趋势图 | P1 |
| `PilgrimsGame`（Godot） | 已有游戏 | ♪🎬：BGM + 过场；与 `PilgrimJourneyPage` 打通 | P2 |

---

### 域 13 · Mission Bridge 工作台（13 个 workspace）

| 模块 | 建议模态 | 说明 | 优先级 |
|---|---|---|---|
| `MobileWorkerWorkspace` / `NightShiftWorkspace` | ♪ | 流动人口/夜班场景 = 典型**免手免眼**场景，音频优先级最高 | **P0** |
| `MobileFamilyWorkspace` | ♪🖼 | 家庭场景音频 + 亲子图卡 | P1 |
| `SpecializedSupportWorkspace` | ♪📊 | 无障碍音频（`mission_bridge_accessibility.py` 已有相关后端） | **P0** |
| `TrainingConsole` / `ProgramDesigner` | 🎬📊 | 培训视频（复用 PPT→视频管线）+ 项目进度图 | P1 |
| `ContentLibrary` | 🎬♪ | 内容库补音视频类型 | P1 |
| `OperationsConsole` / `AgentWorkbench` | 📊 | 运营指标图表 | P2 |

---

### 域 14 · 不建议加多模态（保持纯文本/表格）

`PlatformAdminPage`、`BillingPage`、`RecycleBinPage`、`ExportDataPage`、`OrgConsolePage`、`ChurchIntegrationPage`、`ChurchOnboardingModal`、`ReminderSettings`、`LoginScreen`、`OnboardingPage`、`ProductizationPage`、`MissionOS` 各 Console（`MissionAuditConsole` / `MissionIncidentConsole` / `MissionOrganizationConsole` / `MissionOutboxConsole` / `MissionFeatureSettings`）、`IntegrationHealthPanel`、`ProductionGovernancePanel`

理由：管理型/配置型界面，用户目标是**快速扫读和精确操作**，多模态只会增加加载成本与认知噪音。（例外：治理面板可加静态迷你趋势图，属图表增强而非多模态。）

---

## 4. 建议的模态类型总表（该建哪些「模态原语」）

| 模态原语 | 说明 | 覆盖模块数（约） | 底座状态 |
|---|---|---|---|
| **♪ 引导式 TTS 播报** | 带停顿、分段、可续播的引导音频（区别于现在的「整段朗读」） | 35+ | ✅ 有 TTS，**需新建**「引导脚本播放器」 |
| **🔊 节律音 / 环境音** | Web Audio 合成的呼吸引导音、计时留白音、低频稳定底噪 | 12+ | ❌ **新建**（纯前端，无需资源文件） |
| **📳 触觉反馈** | `navigator.vibrate` 的呼吸节律、确认、提醒 | 8+ | ❌ **新建**（极低成本） |
| **🎙 语音输入 → 结构化** | 说一段话自动填表/生成条目 | 15+ | ✅ 有 STT，需扩展到更多表单 |
| **🎙 语音复诵评分** | STT + 文本比对 + 准确率反馈（背经专用） | 2 | ⚠️ 需新建比对打分 |
| **📊 SVG 图表原语库** | 雷达 / 热力图 / 趋势线 / 环形进度 / 同心圆 / 时间轴 / 桑基 | **45+** | ⚠️ 已有零散实现，**需抽成共享组件库**（零新依赖） |
| **🕸 关系图 / 链路图** | 有向图、知识树、决策树、分支推演 | 15+ | ⚠️ 有 3D 图谱，**需新建 2D 轻量版** |
| **🎞 微动效** | 生长、呼吸、进度、里程碑庆祝 | 20+ | ⚠️ 零散 CSS，需统一（注意已有 `prefersReducedMotion.js`，务必接入） |
| **🖼 图卡生成（扩展）** | 现只有经文卡 → 扩展为：成长卡、恩赐画像卡、安全计划卡、里程碑卡、周报卡 | 20+ | ✅ `ShareCardModal` 可参数化改造 |
| **🎬 短视频生成** | 见证成片、经文短片、培训片 | 8+ | ✅ film_studio 已建成，**缺前端入口** |
| **🧊 3D 场景（扩展）** | 圣殿、耶路撒冷、教义星系、孪生体 | 6+ | ✅ R3F 已在用 |
| **🖼 AI 生成插画** | 经文/场景配图 | 10+ | ❌ **唯一真缺口**（可接 Gemini/Imagen，key 已有） |

---

## 5. 落地路线图

### P0 · 第一批（4–6 周，收益最陡）

1. **危机关怀音频化套件**（呼吸节律音 + 语音口令 + 振动 + 安全计划卡图）— 唯一「不做就是残缺」的一档
2. **共享 SVG 图表原语库** + 用它一次性点亮 spiritual-formation 的 15 个 Dashboard（含 FruitTree 真的长成树、NewCreationMap 真的是地图、Horarium 真的是圆盘）
3. **引导式 TTS 播放器**（带留白/分步）+ 接入 Lectio、Examen、MorningDew、PracticingPresence、DailyDevotion
4. **背经多模态**（朗读 + 跟读 + 遮词卡 + STT 复诵评分）
5. **语音消息**（realtime 私聊/群聊）+ **音频见证**（TestimonyWall）
6. **film_studio 前端入口**（把已建好的视频流水线接到产品里：见证成片 / 经文短片）

### P1 · 第二批（6–10 周）

7. Formation Twin 全面可视化（情绪曲线 / 模式热力 / 场景分支树）
8. 圣经地图路线播放解说（配音 + 短片）+ 耶路撒冷 3D
9. 决策支持决策树可视化 + Stronghold 成因链路图
10. Guardian 状态机动画 + 情绪化语音
11. attention 周报图表 + 语音周报
12. 学习域知识树 / 概念图（AITutor、Doctrine、Personality 画像卡）

### P2 · 第三批

13. AI 插画生成（接 Gemini/Imagen）用于经文配图、场景卡
14. 教义星系 3D、教会年历轮盘
15. 有声书体验（SpiritualBooks 连播 + 书签）、安息日音景
16. Mission Bridge 培训视频批量生产

---

## 6. 需要新建的公共能力（接口草案）

```
前端（bible3dsphereWeb/src/lib/media/）
├── useGuidedAudio.js        引导式播报：分步脚本 + 可配置留白 + 进度回调 + 中断恢复
├── useRhythmTone.js         Web Audio 合成节律音（呼吸/计时/确认），无音频文件依赖
├── useHaptics.js            navigator.vibrate 封装 + 用户开关 + 降级
├── useRecitationScore.js    STT 复诵 → 文本归一化比对 → 准确率 + 错字定位
└── ambience/                环境音（雨/海/风/静默底噪），懒加载，走 R2 CDN

前端（bible3dsphereWeb/src/components/charts/）  ← 零新增依赖，纯 SVG
├── Radar.jsx  Heatmap.jsx  TrendLine.jsx  RingProgress.jsx
├── ConcentricRings.jsx（爱的次序）  Timeline.jsx  Sankey.jsx
├── GrowthTree.jsx（圣灵果子）  YearWheel.jsx（教会年历）
└── DirectedGraph.jsx / DecisionTree.jsx（2D 轻量，非 3D）

前端（扩展现有）
└── components/ShareCardModal.jsx → 抽象为 CardStudio：
    模板注册表（经文卡 / 成长卡 / 恩赐画像 / 安全计划 / 周报 / 里程碑）

后端（bible3dsphere/backend/routers/）
├── POST /api/tts/script        新增：引导脚本合成（分段 + 段间静音时长），返回单文件 + cue points
├── POST /api/media/card        新增：服务端图卡渲染（用于推送/邮件/离线场景）
├── POST /api/media/testimony-clip  新增：见证 → 竖版短视频（复用 film_studio.run_ppt_pipeline）
└── POST /api/media/illustrate  新增（P2）：Gemini/Imagen 经文配图，结果入 R2
```

---

## 7. 护栏与风险

| 风险 | 措施 |
|---|---|
| **危机场景的音频/振动可能加重症状** | 默认关闭自动播放；禁止突发/尖锐音；单键全局静音；振动可独立关闭；PTSD 提示 |
| **无障碍倒退** | 已有 `prefersReducedMotion.js` 和 `components/a11y/` —— 所有新动效必须接入；所有图表必须有文本等价物（`aria-label` + 数据表降级） |
| **流量与成本** | TTS 结果按内容哈希缓存到 R2；视频生成必须异步 + 配额（`film_studio` 已有 spend cap 逻辑，需复用）；移动端默认不自动加载音视频 |
| **离线可用性** | 已有 `offlinePack.js` / `missionBridgeOffline.js` —— 危机模块的音频与安全计划卡必须可离线；节律音用 Web Audio 合成天然离线 |
| **i18n** | 已有严格的中英双语体系（`i18n:audit` 在 prebuild 强制）；音频需中英双版本，图卡文字需走 `t()`，图表标签需可翻译 |
| **包体积** | 图表全部手写 SVG（不引入 recharts/d3 全量）；3D 和视频相关继续走 `lazyWithRetry` 动态加载 |
| **神学与牧养安全** | AI 生成的插画/短视频不得出现基督形象争议、不得视觉化创伤内容；沿用现有 `pastoralSafety.ts` / `THEOLOGICAL_SAFETY_REQUIRED` 审核链路 |

---

## 附录 A · 现状统计

- 扫描页面/组件：**约 190 个**（`src/*.jsx` + `src/features/**`）
- 当前**已有**任一非文本模态输出：**28 个**（约 15%）
- 当前**纯文本**输出：**160+ 个**（约 85%）
- 命中「加模态收益显著」判据：**约 95 个**
- 其中 **P0（强烈建议）：约 35 个**

## 附录 B · 「名字承诺了可视化但实为纯文本」清单（最应优先修）

| 组件 | 名字暗示 | 实际 |
|---|---|---|
| `FruitTree.jsx` | 树 | 横条进度 |
| `NewCreationMap.jsx` | 地图 | 四张文字卡 |
| `SacramentCalendarOrbit.jsx` | 轨道 | 文字列表 |
| `CreedCatechismGalaxy.jsx` | 星系 | 文字列表 |
| `GrowthMapPage.jsx` | 地图 | 有雷达，但无「地图」 |
| `PilgrimJourneyPage.jsx` | 旅程 | 文字清单 |
| ~~`JerusalemSandbox.jsx`~~ | 沙盘 | ✅ 名副其实（3D 沙盘已实现），仅缺配音 |
| `HorariumEngine.jsx` | 时刻表 | 文字（传统上是圆盘） |
| `StrongholdTimeline.jsx` | 时间轴 | 文字列表 |

---

## ✅ 实施状态（2026-07-28 全部落地）

本报告中的建议**已全部实施**。实现细节见 `docs/MULTIMODAL_PRIMITIVES.md`。

| 批次 | 内容 | 状态 |
|---|---|---|
| 底座 | `src/lib/media/*`（引导播报 / 节律音 / 环境音 / 触觉 / 复诵评分 / 图卡引擎 / 偏好护栏） | ✅ 12 个模块 |
| 底座 | `src/components/charts/*`（15 个纯 SVG 图表原语，零新依赖） | ✅ 15 个模块 |
| P0-1 | 危机关怀 15 个组件多模态化 + 全套护栏 | ✅ |
| P0-2 | 灵命塑造 15 个 Dashboard + FruitTree/NewCreationMap/Horarium/Orbit/Galaxy 图表化 | ✅ |
| P0-3 | Lectio / Examen / MorningDew / PracticingPresence / PsalmPrayer / DailyDevotion / QuickDevotion 引导式播报 | ✅ |
| P0-4 | 背经：朗读 / 分句跟读 / 遮词卡 / STT 复诵评分 | ✅ |
| P0-5 | 语音消息 + 音频见证 + film_studio 前端入口 | ✅ |
| P0-6 | 坚固营垒链路图 / 决策树 / 等候 / 偶像 / 试探 / 习惯 / 注意力周报 / 天路 | ✅ |
| P1 | Formation Twin 全量可视化、学习域、地图配音、Guardian 状态机、社群图表、有声书 | ✅ |
| 后端 | `/api/tts/script`、`/api/media/card`、`/api/media/testimony-clip`、`/api/media/illustrate` | ✅ `backend/routers/media.py` |

**验证**：前端 132 个测试文件 / 628 个用例全绿；155 个改动文件语法检查通过；i18n 英文覆盖缺口 0。

### 实施中发现并修复的真实缺陷

1. **`niceTicks` 会裁掉图表顶部** —— 轴刻度上界可能小于数据最大值（`max=97` 时上界只到 50），最高的柱子会被画到轴外。已改为刻度必须覆盖 max，并补 `2.5` 档位。
2. **日历热力图整体错位一格** —— 用 `toISOString()` 取日期键是 UTC；UTC+8 的用户「今天」会落到前一天，且今天被判成未来而不渲染。已改为本地日期键 `localDateKey()`。
3. **引导播报会被自己掐断** —— `useEffect(() => () => guided.stop(), [guided])`：hook 每次渲染返回新对象，cleanup 于是每次重渲染都执行，播报刚开始就停。已改为依赖稳定的 `guided.stop`，并写进原语手册的「坑」章节。

### 刻意没做的部分（判断而非遗漏）

- **后台管理型页面不加多模态**（PlatformAdmin / Billing / RecycleBin / ExportData / MissionOS 各 Console 等）——文本+表格已是最优解。
- **`GraceIdentityCard` 不加图表** —— 该模块的全部数据是散文；把「身份」量化成分数，恰恰是这个模块存在的目的所要拆毁的东西。
- **数据不存在的地方一律给诚实空状态**，不用默认值或占位数字凑出图形。例如 `HolyLifeEngine` 的技能默认分是 50，若直接画雷达会得到一个整齐的假菱形，已显式抑制。
