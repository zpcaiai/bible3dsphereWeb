# Codex 实施提示词 — Batch 07

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-child-formation-orchestrator
```

## 目标

把 **0–6岁与7–12岁：依恋、故事、身体节律、媒介与AI素养课程系统** 作为 `sunday_school.ai_formation` 的 Batch 07 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 发现儿童/监护/课程/安全架构
2. 实现11份Schema与角色权限
3. 实现0–6照顾者和节律轨道
4. 实现故事、想象与具身游戏
5. 实现7–12媒介和AI素养
6. 实现儿童隐私、责任与信仰对话
7. 实现披露安全门
8. 导入年龄审核种子
9. 完成儿童安全、隐私、a11y和E2E

## 推荐路由

- /sunday-school/ai-formation/children
- /sunday-school/ai-formation/children/0-6
- /sunday-school/ai-formation/children/0-6/caregiver
- /sunday-school/ai-formation/children/0-6/story-play
- /sunday-school/ai-formation/children/7-12
- /sunday-school/ai-formation/children/7-12/media
- /sunday-school/ai-formation/children/7-12/ai
- /sunday-school/ai-formation/children/7-12/privacy
- /sunday-school/ai-formation/children/7-12/responsibility
- /sunday-school/ai-formation/teachers/child-formation

## 不可违反

- 0–6岁以依恋、回应、节律、故事、自由游戏和身体活动为主，不把AI或屏幕作为核心养育者。
- 不得对儿童生成依恋、发展、行为、救恩、信心或顺服诊断/评分。
- 儿童AI仅限年龄适切、成人脚手架和公共透明场景；禁止秘密AI朋友、浪漫/性化互动和私密对话。
- 不得采集儿童声音、照片、生物特征、精确位置、学校、第三方秘密或完整提示作为普通课程数据。
- 故事必须区分圣经、历史、见证与虚构，不得把AI添加细节说成经文或自动发布。
- 屏幕转场不得羞辱孩子或突然以设备剥夺替代共同调节；同时保持清楚边界。
- 孩子可以提问、不同意或说不知道；不得把宗教答案当作内心信仰或价值评分。
- 涉及身体边界、虐待、不安全接触、自伤或即时危险时停止普通活动，禁止取证式追问并进入S2/S3。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
