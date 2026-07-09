# 属灵星球前端（bible3dsphereWeb）

本仓库是 [bible3dsphere](https://github.com/stephenzhao/bible3dsphere) monorepo 的前端独立仓，
从 `a4f0d6a` 提取 `emotion-sphere-ui/` 目录内容提升为仓库根。

## 项目简介

属灵星球（holiness.uk）是一款面向华人基督徒的属灵陪伴 PWA，
涵盖灵修、代祷、社区、圣经阅读、宣教地图等模块，
后端部署于 Hugging Face Space（stephenzao-biblesphere）：
`https://stephenzao-biblesphere.hf.space`
前端通过 Vercel 独立构建部署。

## 本地开发

```bash
npm install
npm run dev
```

默认通过 Vite proxy 将 `/api` 请求转发到 `localhost:8000`（本地后端）。
若不启动本地后端，可直接指向 HF Space：

```bash
VITE_API_BASE=https://stephenzao-biblesphere.hf.space/api npm run dev
```

## Vercel 自动构建部署

- 连接本仓库到 Vercel Project，**push 即触发构建部署**，无需手动提交 `dist/`。
- 构建命令：`npm ci && npm run build`（vercel.json 已配置）。
- 产物目录：`dist/`（已在 `.gitignore` 中排除，不入 git）。

## 环境变量

在 Vercel Project Settings → Environment Variables 中配置以下变量：

| 变量 | 说明 | 默认行为 |
|------|------|----------|
| `VITE_API_BASE` | 后端 API 基础 URL | 未设置时根据域名自动推断（holiness.uk → HF Space） |
| `VITE_MAPBOX_TOKEN` | Mapbox GL JS Token | 圣经地图模块必需 |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Next.js bible-map 模块 Token | 如启用 /bible-map 子路由则必需 |
| `VITE_CESIUM_TOKEN` | CesiumJS Ion Token | 3D 地球模块必需 |
| `VITE_MAPLIBRE_STYLE` | MapLibre 底图样式 URL | 离线/自定义底图时设置 |
| `VITE_HYMN_AUDIO_BASE` | 诗歌音频资源 CDN 基础路径 | HymnPlayer 必需 |
| `VITE_BOOK_BASE` | EPUB 书籍资源 R2/CDN 基础路径 | 属灵书籍模块必需 |
| `VITE_MAP_PROVIDER` | 地图提供商（mapbox/maplibre/cesium） | 默认 mapbox |

语音输入通过后端 `/api/speech/transcribe` 代理转写；请在后端服务设置私有环境变量 `DEEPGRAM_API_KEY`，不要把语音供应商密钥配置成 `VITE_*` 浏览器变量。

后端 API 根地址：`https://stephenzao-biblesphere.hf.space`

## Service Worker 缓存版本升级

修改 `public/sw.js` 顶部的 `CACHE_VERSION` 常量（如 `v4` → `v5`）
可强制所有用户在下次访问时清除旧缓存并加载新版本。
每次有**破坏性前端变更**时应同步升级此版本号。

## Scripture Meditation & Inner Formation OS

`src/features/spiritual-formation` 内置了 Batch 1 前端 MVP：

- Lectio Divina / 圣经默想：Read, Meditate, Pray, Contemplate, Obey 五阶段流程。
- Scripture Memory / 经文背诵：推荐经文、隐藏回忆、简单准确率评分、复习间隔排程。
- Spiritual Examen / 每日省察：感恩、回顾、安慰、荒凉、悔改、恩典、明日意向、祷告。
- Confession & Repentance / 认罪悔改：命名、承认、分辨、领受恩典、回转、修复、同行。

当前仓库是 Vite React 前端，因此该模块先以本地确定性服务实现，数据保存在 `localStorage`：

| Key | 内容 |
|-----|------|
| `scriptureFormation.lectioSessions` | 默想会话与阶段记录 |
| `scriptureFormation.memoryItems` | 用户背经计划、复习历史与下次复习时间 |
| `scriptureFormation.examenSessions` | 每日省察记录与洞察 |
| `scriptureFormation.confessionSessions` | 认罪悔改会话与行动计划 |

安全策略：所有阶段提交都会先检查自伤、虐待、暴力、绝望、紧急危险和强迫性内疚语言。命中后不继续普通属灵建议，而返回 `crisis_care_system` 或牧养/临床支持提示。模块只提供属灵塑造辅助，不替代圣经、祷告、教会、牧养关怀或专业帮助。

后续如接入后端，可将本地服务映射到 `/api/scripture-formation/dashboard` 以及对应的 lectio、memory、examen、confession endpoints，并把完成事件同步为 `scripture_lectio_completed`、`scripture_memory_reviewed`、`examen_completed`、`confession_completed`、`repentance_action_created`。

## Prayer & Communion OS

`src/features/spiritual-formation` 也内置了 Batch 2 前端 MVP：

- Prayer Rule / 固定祷告规则：默认早晨、中午、晚上三段祷告节奏，可完成祷告 session 与周回顾。
- Intercession / 代祷追踪：代祷对象、代祷事项、今日代祷计划、已祷告、已答应时间线。
- Psalm Prayer / 诗篇祷告：按情绪和塑造需要推荐诗篇，并用不同 movements 引导哀歌、赞美、认罪、信靠。
- Practicing Presence / 操练与神同在：按工作、代码、通勤、冲突、疲惫、试探等处境推荐短操练，并记录 subjective awareness check-in。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `prayerCommunion.rules` | 用户祷告规则与 slot |
| `prayerCommunion.prayerSessions` | 固定祷告 session |
| `prayerCommunion.intercessionTargets` | 代祷对象 |
| `prayerCommunion.prayerRequests` | 代祷事项、隐私提醒、已答应记录 |
| `prayerCommunion.intercessionSessions` | 代祷 session 与 prayed items |
| `prayerCommunion.psalmSessions` | 诗篇祷告 movement 记录 |
| `prayerCommunion.presenceCheckins` | 同在操练 check-in |
| `prayerCommunion.presenceRules` | 同在操练触发规则 |

安全策略：所有祷告、代祷、诗篇、同在操练输入都会先检查自伤、虐待、暴力、严重绝望、紧急危险和强迫性内疚。命中后路由到 `crisis_care_system` 或牧养/专业支持提示，不把危机简化成“只要祷告”。代祷模块还会对他人隐私细节提示匿名化，避免属灵八卦。

后续如接入后端，可映射到 `/api/prayer/dashboard`、`/api/prayer/orchestrate`、`/api/prayer/rules`、`/api/prayer/intercession/*`、`/api/prayer/psalms/*`、`/api/prayer/presence/*`，并同步事件 `prayer_rule_created`、`prayer_session_completed`、`intercession_request_created`、`intercession_session_completed`、`prayer_request_answered`、`psalm_prayer_completed`、`presence_checkin_completed`、`presence_rule_created`。

## Virtue & Vice Formation OS

`src/features/spiritual-formation` 还内置了 Batch 3 前端 MVP：

- Virtue Formation / 德性塑造：推荐并创建德性焦点，提供经文、祷告、具体顺服操练，并记录 practice log。
- Vice Pattern Detection / 罪性模式识别：分析处境中的可能模式、底层欲望、错误信念、相反德性和下一步，不把人定义为罪。
- Temptation Resistance / 试探抵抗：为试探类型建立计划，实时给出逃离行动、替代行动、经文锚点和问责建议。
- Fruit of the Spirit Tracker / 圣灵果子追踪：以谦卑的 1-10 自我反思指标记录圣灵果子，不做属灵排名。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `virtueVice.focuses` | 用户德性焦点 |
| `virtueVice.virtueLogs` | 德性操练记录 |
| `virtueVice.observations` | 罪性模式观察 |
| `virtueVice.patterns` | 需要留意的 recurring vice patterns |
| `virtueVice.temptationPlans` | 试探抵抗计划 |
| `virtueVice.temptationCheckins` | 试探时刻与结果记录 |
| `virtueVice.failureReviews` | 失败后的恩典复盘 |
| `virtueVice.fruitAssessments` | 圣灵果子评估 |
| `virtueVice.feedbackRequests` | 给导师/牧者/同伴的反馈请求草稿 |

安全策略：所有德性、罪性、试探、果子评估输入都会先检查自伤、虐待、暴力、绝望、紧急危险、强迫性内疚、属灵羞耻或自我惩罚语言。命中后不继续普通塑造流程，而路由到 `crisis_care_system` 或牧养/专业支持提示。系统区分 conviction 与 condemnation、temptation 与 sin、weakness 与 rebellion，并避免把用户等同于其罪。

后续如接入后端，可映射到 `/api/formation/virtue-vice/dashboard`、`/api/formation/virtue-vice/orchestrate`、`/api/formation/virtues/*`、`/api/formation/vices/*`、`/api/formation/temptation/*`、`/api/formation/fruit/*`，并同步事件 `virtue_focus_created`、`virtue_practice_logged`、`vice_observation_created`、`vice_pattern_detected`、`temptation_plan_created`、`temptation_checkin_completed`、`temptation_failure_reviewed`、`fruit_assessment_completed`、`fruit_growth_insight_created`。

## Rule of Life & Holy Habit Engine

`src/features/spiritual-formation` 继续内置 Batch 4 前端 MVP：

- Rule of Life Builder / 生活规则构建器：覆盖 prayer、Scripture、worship、work、rest、body、money、relationships、speech、technology、service、mission、learning、solitude、community 等生活领域，并提供 beginner、busy worker、burnout recovery、leadership、suffering season、deep formation 模板。
- Holy Habit Planner / 圣洁习惯计划：将 morning prayer、weekly Lectio Divina、Scripture memory、evening examen、gratitude journal、intercession、Psalm prayer、speech restraint、technology Sabbath、hidden service、generosity、conflict pause、temptation escape plan、weekly Sabbath、simplicity audit 等模板变成可打卡计划。
- Sabbath & Rest Formation / 安息与休息操练：通过 sleep、work pressure、phone compulsion、rest guilt、worship disruption 识别休息阻塞，并推荐 phone-free morning、worship preparation、slow meal gratitude、Psalm 23 rest prayer、no work email block 等操练。
- Fasting & Simplicity / 禁食与简朴操练：支持 non-food fast 和简朴行动，例如 social media 24h fast、evening phone fast、spending fast、speech fast、entertainment fast、digital declutter、simplicity audit 和 generosity response。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `holyHabit.ruleProfiles` | 用户生活规则 profile |
| `holyHabit.ruleCommitments` | 各生活领域的规则承诺与 grace minimum |
| `holyHabit.ruleCheckins` | 生活规则 check-in |
| `holyHabit.ruleReviews` | 生活规则回顾和调整建议 |
| `holyHabit.habitPlans` | 圣洁习惯计划 |
| `holyHabit.habitCheckins` | 习惯完成/错过记录 |
| `holyHabit.habitReviews` | 习惯回顾和降载建议 |
| `holyHabit.sabbathPlans` | 安息日与休息计划 |
| `holyHabit.sabbathSessions` | 安息 session |
| `holyHabit.restAudits` | 休息阻塞 audit |
| `holyHabit.sabbathReviews` | 安息回顾 |
| `holyHabit.boundaryRules` | 休息边界规则 |
| `holyHabit.fastingPlans` | 禁食与简朴计划 |
| `holyHabit.fastingCheckins` | 禁食 check-in |
| `holyHabit.fastingReviews` | 禁食回顾 |
| `holyHabit.simplicityAudits` | 简朴 audit |
| `holyHabit.simplicityActions` | 简朴和慷慨行动 |

安全策略：生活规则不是属灵表现主义，系统会提示“trellis for love, not a ladder for self-salvation”，并对 heavy rule、missed habits、tracking obsession、burnout 等输入优先建议降载、休息和牧养支持。禁食模块会拦截自伤、虐待、暴力、绝望、强迫、饮食障碍、医疗风险、自我惩罚、减肥动机或被迫禁食等语言；食物禁食必须有健康确认，且不安全时推荐非食物禁食替代。模块不替代医学、临床、牧养、教会和现实支持。

后续如接入后端，可映射到 `/api/rule-of-life/dashboard`、`/api/rule-of-life/orchestrate`、`/api/rule-of-life/builder`、`/api/rule-of-life/habits`、`/api/rule-of-life/sabbath`、`/api/rule-of-life/fasting`、`/api/rule-of-life/simplicity`，并同步事件 `rule_of_life_created`、`rule_commitment_created`、`rule_review_created`、`holy_habit_plan_created`、`holy_habit_checkin_completed`、`sabbath_plan_created`、`sabbath_session_completed`、`rest_audit_completed`、`fasting_plan_created`、`fasting_checkin_completed`、`simplicity_action_created`。

## Worldview Formation OS Expansion

`src/features/spiritual-formation` 继续内置 Batch 5 前端 MVP：

- Belief Diagnostic / 底层信念诊断：从 event -> emotion -> interpretation -> belief -> desire -> behavior -> fruit 识别 possible belief，不把分析当定论。
- Idol Mapping / 偶像地图：识别 possible disordered loves，例如 control、safety、approval、comfort、success、money、productivity、technology、body image 等，并给出 surrender practice。
- Gospel Reframing / 福音重构：用 Creation、Fall、Redemption、Restoration 四幕重构处境，允许哀哭、悔改、盼望和智慧行动，不提供廉价正面化。
- Decision Discernment / 决策分辨：澄清问题、选项、事实、动机、价值权重、群体印证和下一步，明确不是“私下启示”或神隐藏旨意的确定答案。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `worldviewFormation.beliefSessions` | 底层信念诊断 session |
| `worldviewFormation.beliefObservations` | 用户确认/编辑后的信念观察 |
| `worldviewFormation.beliefPatterns` | recurring belief patterns |
| `worldviewFormation.beliefReviews` | 信念模式回顾 |
| `worldviewFormation.idolObservations` | 偶像地图观察 |
| `worldviewFormation.idolPatterns` | recurring idol patterns |
| `worldviewFormation.idolReviews` | 偶像模式回顾 |
| `worldviewFormation.gospelSessions` | 四幕福音重构 session |
| `worldviewFormation.gospelActions` | 福音回应行动 |
| `worldviewFormation.decisionSessions` | 决策分辨 session |
| `worldviewFormation.decisionOptions` | 决策选项 |
| `worldviewFormation.motiveChecks` | 动机检查 |
| `worldviewFormation.valueWeights` | 决策价值权重 |
| `worldviewFormation.counselInputs` | 群体/专业/牧养建议输入 |
| `worldviewFormation.decisionSummaries` | 决策分辨总结 |

安全策略：所有 worldview 分析先检查自伤、虐待、暴力、绝望、胁迫、属灵操控、危险关系和 emergency language。命中后不继续 belief/idol 归因，而路由到 `crisis_care_system`。系统不会把 trauma、abuse、illness 或 suffering 简化成“错误信念”或“偶像”；决策涉及法律、医疗、财务、移民、安全等高风险事项时，只提供智慧问题和风险提示，并建议 qualified counsel。系统不会说 “God told me” 或声称确定知道神隐藏的旨意。

后续如接入后端，可映射到 `/api/worldview/dashboard`、`/api/worldview/orchestrate`、`/api/worldview/beliefs/*`、`/api/worldview/idols/*`、`/api/worldview/reframing/*`、`/api/worldview/discernment/*`，并同步事件 `belief_diagnostic_session_created`、`belief_observation_created`、`belief_pattern_detected`、`idol_mapping_session_created`、`idol_observation_created`、`idol_pattern_detected`、`gospel_reframing_completed`、`gospel_response_action_created`、`decision_discernment_session_created`、`decision_summary_generated`、`decision_marked_waiting`、`decision_marked_decided`。

## Suffering, Crisis & Healing Formation OS

`src/features/spiritual-formation` 继续内置 Batch 6 前端 MVP：

- Suffering Theology / 苦难神学：支持 lament、grief、waiting、illness、injustice、relational pain、shame、mystery、spiritual dryness、burnout、death 等类别，允许哀歌，不用经文或神学解释最小化痛苦。
- Crisis Triage / 危机分流：先于普通塑造检查 suicide/self-harm、violence、abuse、domestic/sexual/child/elder safety、medical emergency、severe despair、panic、spiritual abuse、coercion 和 unsafe reconciliation pressure。high/imminent 会阻断普通 formation。
- Healing Journey / 医治旅程：支持 grief、shame healing、relational wound、forgiveness process、boundary formation、betrayal recovery、spiritual abuse recovery、burnout recovery、church hurt、trauma-informed stabilization、reconciliation discernment。
- Pastoral Care Companion / 牧养陪伴：支持 consent-based care relationship、care case、care log、care plan、follow-up、role-aware summary 和 escalation recommendation。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `sufferingCare.crisisAssessments` | 危机风险评估 |
| `sufferingCare.crisisEvents` | 危机事件 |
| `sufferingCare.safetyPlans` | 安全计划 |
| `sufferingCare.crisisFollowups` | 危机跟进 |
| `sufferingCare.sufferingSessions` | 苦难反思 session |
| `sufferingCare.sufferingSummaries` | 苦难反思总结 |
| `sufferingCare.healingJourneys` | 医治旅程 |
| `sufferingCare.healingEntries` | 医治旅程记录 |
| `sufferingCare.forgivenessPlans` | 饶恕与边界计划 |
| `sufferingCare.healingMilestones` | 医治里程碑 |
| `sufferingCare.careRelationships` | 牧养/导师/小组长关怀授权关系 |
| `sufferingCare.careCases` | 关怀个案 |
| `sufferingCare.careLogs` | 关怀日志 |
| `sufferingCare.carePlans` | 关怀计划 |
| `sufferingCare.careFollowups` | 关怀跟进 |
| `sufferingCare.careSummaries` | 角色化、脱敏关怀摘要 |

安全策略：本模块不是 emergency service、therapy、medical care、legal help 或 pastoral authority 的替代。出现 imminent/high 自伤、自杀、暴力、虐待、直接危险、医疗急症或无法保持安全时，普通属灵塑造会被阻断并转向危机分流、安全计划、当地紧急资源和可信真人支持。系统不会属灵化虐待，不会要求用户留在危险中，不会催促饶恕或和解；饶恕不等于立即和解或取消边界。牧养看板默认最小必要披露，caregiver 需要 active relationship 和 permission scope，用户可撤销同意。

后续如接入后端，可映射到 `/api/care/dashboard`、`/api/care/orchestrate`、`/api/care/suffering/*`、`/api/care/crisis/*`、`/api/care/healing/*`、`/api/care/pastoral/*`，并同步事件 `suffering_reflection_started`、`suffering_reflection_completed`、`crisis_risk_assessed`、`crisis_event_created`、`safety_plan_created`、`healing_journey_created`、`healing_entry_created`、`forgiveness_boundary_plan_created`、`healing_milestone_created`、`care_relationship_requested`、`care_case_created`、`care_log_created`、`care_followup_created`、`care_plan_created`、`care_case_escalated`。

## Community, Accountability & Discipleship OS

`src/features/spiritual-formation` 继续内置 Batch 7 前端 MVP：

- Discipleship Pathway / 门训路径：按 seeker、new believer、rooted disciple、practicing disciple、serving member、mature disciple、leader in training、disciple maker、missionary sent、elder-like maturity 等阶段生成 90 天门训路径、步骤和回顾。
- Accountability Group / 监督同行：支持 accountability pair、weekly triads、discipleship group、temptation support group、prayer group、leader accountability group，并生成目标、check-in、鼓励回应、代祷请求和脱敏小组回顾。
- Mentor Coaching / 导师陪跑：支持导师关系、session agenda、导师问题库、观察记录、行动计划和 review，不把导师关系变成控制、监控或隐藏权柄。
- Church Integration / 教会生活整合：支持主日敬拜、敬拜预备、圣餐反思、洗礼预备、会友探索、小组、服事、牧养 check-in、宣教祷告、慷慨反思等 church rhythms，并支持 ministry match 与 church hurt 后的 safe re-entry plan。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `communityDiscipleship.assessments` | 门训阶段评估 |
| `communityDiscipleship.paths` | 门训路径 |
| `communityDiscipleship.steps` | 门训路径步骤 |
| `communityDiscipleship.reviews` | 门训路径回顾 |
| `communityDiscipleship.groups` | 问责/同行小组 |
| `communityDiscipleship.members` | 小组成员与 sharing scope |
| `communityDiscipleship.goals` | 小组目标 |
| `communityDiscipleship.checkins` | 小组 check-in |
| `communityDiscipleship.responses` | 同行鼓励回应 |
| `communityDiscipleship.prayerRequests` | 小组代祷请求 |
| `communityDiscipleship.groupReviews` | 小组脱敏回顾 |
| `communityDiscipleship.mentorRelationships` | 导师关系与 permission scope |
| `communityDiscipleship.mentorSessions` | 导师 session |
| `communityDiscipleship.mentorObservations` | 导师观察 |
| `communityDiscipleship.mentorActionPlans` | 导师行动计划 |
| `communityDiscipleship.mentorReviews` | 导师 review |
| `communityDiscipleship.churchProfiles` | 教会 profile |
| `communityDiscipleship.churchConnections` | 用户与教会连接状态 |
| `communityDiscipleship.churchRhythms` | 教会生活节奏 |
| `communityDiscipleship.churchCheckins` | 教会节奏 check-in |
| `communityDiscipleship.ministryOpportunities` | 服事机会 |
| `communityDiscipleship.ministryMatches` | 服事匹配建议 |
| `communityDiscipleship.churchReentryPlans` | 教会伤害后的安全重返计划 |

安全策略：本模块默认 consent-based、role-aware、redacted。系统不做 surveillance-style discipleship，不鼓励 public shaming，不推动 coerced confession，不把 accountability 变成控制机制。出现自伤、自杀、暴力、虐待、胁迫、属灵操控、不安全领袖/小组、危险和解压力或 crisis language 时，普通群体门训会被阻断并转向 `suffering_care` / crisis triage。church hurt 与 spiritual abuse 会优先走 healing journey、边界和 safe re-entry，而不是直接催促回到普通教会整合。

后续如接入后端，可映射到 `/api/community/dashboard`、`/api/community/orchestrate`、`/api/community/discipleship/*`、`/api/community/accountability/*`、`/api/community/mentor/*`、`/api/community/church/*`，并同步事件 `discipleship_assessment_created`、`discipleship_path_created`、`discipleship_step_completed`、`accountability_group_created`、`accountability_checkin_created`、`group_prayer_request_created`、`mentor_relationship_created`、`mentor_session_created`、`mentor_action_plan_created`、`church_connection_created`、`church_rhythm_created`、`church_checkin_created`、`ministry_match_created`、`church_reentry_plan_created`。

## Gift, Calling & Mission OS

`src/features/spiritual-formation` 继续内置 Batch 8 前端 MVP：

- Spiritual Gifts Assessment / 属灵恩赐评估：覆盖 teaching、shepherding、mercy、service、administration、leadership、exhortation、evangelism、giving、hospitality、wisdom、discernment、faith、helps、craftsmanship、music worship、intercession、mission、knowledge、encouragement 等 20 个可能恩赐，并用 80 个 assessment items 生成 possible gift profile。
- Calling Discernment / 呼召分辨：通过 gift profile、burden、desire、skill、opportunity、community feedback、fruit evidence、Scripture/prayer reflection、mentor observation、church need、life constraints 和 risk boundaries 分析 possible calling patterns，并推荐低风险 experiment。
- Ministry Match / 服事匹配：用 gifts、calling patterns、maturity、capacity、church need、burnout、safeguarding、mentor approval 和 emotional load 生成 match score、reasons、cautions 与 observe-first service trial。
- Mission Life Design / 使命生活设计：把 vocation、family、church、money、time、skills、relationships、neighborhood、hospitality、evangelism、justice/mercy、technology、creativity、learning 和 rest 整合为 whole-life stewardship。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `giftCalling.giftAssessments` | 属灵恩赐评估 |
| `giftCalling.giftScores` | 每项恩赐 score、confidence、evidence、cautions |
| `giftCalling.giftProfiles` | 用户 possible gift profile |
| `giftCalling.giftFeedbackEntries` | mentor / pastor / group leader / friend 等社区反馈 |
| `giftCalling.callingSessions` | 呼召分辨 session |
| `giftCalling.callingInputs` | burden、fruit、feedback、opportunity 等呼召输入 |
| `giftCalling.callingPatterns` | possible calling patterns |
| `giftCalling.callingExperiments` | 低风险呼召实验 |
| `giftCalling.callingExperimentReviews` | 呼召实验回顾 |
| `giftCalling.ministryOpportunities` | 服事机会 |
| `giftCalling.capacityProfiles` | 服事容量和 burnout guardrail |
| `giftCalling.ministryMatches` | 服事匹配结果 |
| `giftCalling.serviceTrials` | observe / assist / serve trial |
| `giftCalling.serviceReviews` | 服事 trial 回顾 |
| `giftCalling.missionProfiles` | 使命生活 profile |
| `giftCalling.missionCommitments` | mission domain commitments |
| `giftCalling.missionProjects` | 使命项目 |
| `giftCalling.missionProjectLogs` | 使命项目日志 |
| `giftCalling.missionLifeReviews` | 使命生活回顾 |

安全策略：系统不会说 “God told me your calling is...”，不会把恩赐当作确定身份或属灵排名，不把 giftedness 等同于 character 或 leadership readiness，不把 burden / passion / opportunity 单独等同于 calling。若出现 self-harm、abuse、violence、coercion、spiritual abuse、burnout、overcommitment、pride/platform obsession、unsafe ministry pressure、family neglect 或 crisis language，orchestrator 会先路由到 crisis triage、suffering care / pastoral care、Sabbath rest 或 humility guardrail，而不是继续推进服事匹配。Ministry match 默认 include capacity、maturity、consent、safeguarding、mentor approval 和 boundaries。

后续如接入后端，可映射到 `/api/calling/dashboard`、`/api/calling/orchestrate`、`/api/calling/gifts/*`、`/api/calling/discernment/*`、`/api/calling/ministry/*`、`/api/calling/mission-life/*`，并同步事件 `gift_assessment_started`、`gift_assessment_completed`、`gift_profile_generated`、`gift_feedback_added`、`calling_discernment_session_created`、`calling_pattern_detected`、`calling_experiment_created`、`calling_experiment_reviewed`、`ministry_capacity_profile_created`、`ministry_matches_generated`、`ministry_service_trial_created`、`ministry_service_reviewed`、`mission_life_profile_created`、`mission_commitment_created`、`mission_project_created`、`mission_project_log_created`、`mission_life_review_completed`。

## Batches 9-13 Platform Integration Layer

`src/features/spiritual-formation` 继续内置 Batches 9-13 前端 MVP，并统一放在 `知识智能企业` tab：

- Batch 9 Bible Knowledge Graph & Doctrine Learning OS：Bible character graph、relationship path、biblical theology timeline、doctrine learning path、apologetics dialogue。种子数据包含 120+ Bible characters、主要人物关系、23 个 biblical theology movements、doctrine topics 与 apologetics topics。
- Batch 10 AI Spiritual Tutor & Personal Formation Agent OS：personal formation agent、spiritual memory/profile、recommendation routing、AI tutor conversation、daily plan、weekly review。Agent 明确不是 God、prophet、pastor、therapist 或 emergency service。
- Batch 11 Analytics, Progress & Formation Metrics OS：formation metrics、grace evidence、overload signals、monthly report、mentor-safe redaction、safety/theology/privacy audit。指标是 reflection signals，不是 holiness score。
- Batch 12 Deployment, Multi-Tenant, Admin & Productization OS：organizations、roles、permissions、moderation cases、plans/subscriptions、deployment health checks、ops runbooks。Billing 不得阻断 crisis routing。
- Batch 13 Full-Scale Integration, Enterprise Roadmap & Master Build OS：13 modules / 52 skills registry、global formation session、event bus、safety-first route、consent/permission check、roadmap、acceptance matrix、master build prompt。

当前仍为前端本地服务实现，数据保存在：

| Key | 内容 |
|-----|------|
| `platformIntegration.doctrinePaths` | Doctrine learning paths |
| `platformIntegration.apologeticsDialogues` | Apologetics dialogue records |
| `platformIntegration.spiritualProfiles` | AI tutor spiritual profiles |
| `platformIntegration.memoryItems` | Consent-aware spiritual memory |
| `platformIntegration.dailyPlans` | Daily formation plans |
| `platformIntegration.weeklyReviews` | Weekly formation reviews |
| `platformIntegration.tutorConversations` | AI tutor conversations |
| `platformIntegration.metricValues` | Formation metric values |
| `platformIntegration.graceEvidence` | Grace evidence records |
| `platformIntegration.overloadSignals` | Overload / safety signals |
| `platformIntegration.analyticsReports` | Formation review reports |
| `platformIntegration.integrityAudits` | Safety/privacy/theology audits |
| `platformIntegration.organizations` | Multi-tenant organizations |
| `platformIntegration.organizationMembers` | Members, roles, permissions |
| `platformIntegration.moderationCases` | Admin/moderation/risk cases |
| `platformIntegration.subscriptions` | Product plans/subscriptions |
| `platformIntegration.deploymentHealthChecks` | Deployment and ops checks |
| `platformIntegration.globalSessions` | Global formation sessions |
| `platformIntegration.formationEvents` | Shared event bus entries |

Batch 13 architecture docs:

- `docs/architecture/FULL_DOMAIN_MODEL.md`
- `docs/architecture/EVENT_BUS_CONTRACT.md`
- `docs/architecture/CONSENT_PERMISSION_CONTRACT.md`
- `docs/architecture/SAFETY_FIRST_CONTRACT.md`
- `docs/architecture/MODULE_REGISTRY.md`
- `docs/architecture/FULL_MASTER_BUILD_PROMPT.md`

Safety and integrity strategy：所有 Batches 9-13 AI-facing / reflective flows 先走 safety check。Doctrine/apologetics 区分 biblical text、theological interpretation、tradition、application，不使用教义羞辱或操控用户。AI tutor 不发明用户历史，不暴露 memory，不替代人类牧养/临床/紧急支持。Analytics 不做属灵排名，不做 holiness leaderboard。Tenant/admin/productization flows 默认 tenant isolation、audited admin access、role permission、consent scope、redaction policy，并保证 crisis routing 对所有 subscription states 可用。
# bible3dsphereWeb
