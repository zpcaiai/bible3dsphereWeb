# 属灵星球 · 主日学 Tab
## AI时代心意更新与家庭门训 — Batch 07
### 0–6岁与7–12岁：依恋、故事、身体节律、媒介与AI素养课程系统

为0–6岁建立依恋、共同调节、节律、故事、自由游戏和真实世界经验；为7–12岁建立媒介识读、AI基础素养、隐私、责任、服事与可提问的信仰对话。

## 依赖

依赖 Batch 01–06，复用家庭角色、公约、内容审核、父母形成、AI边界与儿童保护安全门。

## 安装

```bash
cp -R .agents/skills /path/to/spiritual-planet/.agents/
```

把 `AGENTS.md.snippet` 合并到仓库根目录或主日学模块目录的 `AGENTS.md`，然后在仓库根目录显式调用：

```text
$spiritual-planet-child-formation-orchestrator
```

## 推荐产品路由

```text
/sunday-school/ai-formation/children
/sunday-school/ai-formation/children/0-6
/sunday-school/ai-formation/children/0-6/caregiver
/sunday-school/ai-formation/children/0-6/story-play
/sunday-school/ai-formation/children/7-12
/sunday-school/ai-formation/children/7-12/media
/sunday-school/ai-formation/children/7-12/ai
/sunday-school/ai-formation/children/7-12/privacy
/sunday-school/ai-formation/children/7-12/responsibility
/sunday-school/ai-formation/teachers/child-formation
```

## Skills

- `$spiritual-planet-child-formation-orchestrator` — Child Formation Orchestrator
- `$christian-early-childhood-responsive-care` — Early Childhood Responsive Care
- `$christian-child-story-imagination` — Child Story and Imagination
- `$christian-embodied-play-formation` — Embodied Play and Real-World Formation
- `$christian-child-screen-transition` — Child Screen Transition
- `$christian-elementary-media-literacy` — Elementary Media Literacy
- `$christian-elementary-ai-literacy` — Elementary AI Literacy
- `$christian-child-privacy-literacy` — Child Privacy Literacy
- `$christian-child-responsibility-service` — Child Responsibility and Service
- `$christian-parent-child-faith-conversation` — Parent–Child Faith Conversation
- `$christian-child-safeguarding-response` — Child Safeguarding Response
- `$child-formation-course-integrator` — Child Formation Course Integrator

## 本批次硬边界

1. 0–6岁以依恋、回应、节律、故事、自由游戏和身体活动为主，不把AI或屏幕作为核心养育者。
2. 不得对儿童生成依恋、发展、行为、救恩、信心或顺服诊断/评分。
3. 儿童AI仅限年龄适切、成人脚手架和公共透明场景；禁止秘密AI朋友、浪漫/性化互动和私密对话。
4. 不得采集儿童声音、照片、生物特征、精确位置、学校、第三方秘密或完整提示作为普通课程数据。
5. 故事必须区分圣经、历史、见证与虚构，不得把AI添加细节说成经文或自动发布。
6. 屏幕转场不得羞辱孩子或突然以设备剥夺替代共同调节；同时保持清楚边界。
7. 孩子可以提问、不同意或说不知道；不得把宗教答案当作内心信仰或价值评分。
8. 涉及身体边界、虐待、不安全接触、自伤或即时危险时停止普通活动，禁止取证式追问并进入S2/S3。

## 交付规模

- 12 个 Codex Skills；
- 11 个 Draft 2020-12 JSON Schema；
- 11 份参考政策/蓝图；
- 6 份种子、矩阵、模板或 Analytics 资产；
- 36 个实践/控制项；
- 10 个课程单元、23 节课；
- 12 个情境或红队场景；
- Skill 路由评测、行为安全评测、静态验证脚本和实施清单。

## 静态验证

```bash
python scripts/validate-batch07.py
```

随后必须在真实属灵星球仓库中运行原生 lint、typecheck、unit、integration、migration、E2E、a11y、安全、内容审核和部署验收。静态校验只证明技能包内部结构与约束一致，不代表真实应用已经上线。
