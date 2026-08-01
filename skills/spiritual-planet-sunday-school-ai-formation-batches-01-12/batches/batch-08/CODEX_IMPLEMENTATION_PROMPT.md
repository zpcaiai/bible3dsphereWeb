# Codex 实施提示词 — Batch 08

在“属灵星球”真实仓库根目录执行本任务，并显式使用：

```text
$spiritual-planet-youth-autonomy-orchestrator
```

## 目标

把 **13–15岁与16–18岁：身份、怀疑、性与社交媒体、AI诚信和自治交还系统** 作为 `sunday_school.ai_formation` 的 Batch 08 垂直切片实现，不得另建平行应用，不得复制已有安全、神学权威、内容审核、Formation Plan、家庭或课程引擎。

## 先做仓库发现

定位并报告：主日学 Tab 注册、现有路由、设计系统、鉴权/RBAC、多租户、ORM/迁移、API模式、Schema验证、内容审核、S0–S3安全门、Feature Flag、i18n、Analytics、隐私删除导出、通知、测试与部署命令。

## 实施顺序

1. 发现青少年/监护/导师/学校政策架构
2. 实现12份Schema和角色权限
3. 实现身份压力与怀疑对话
4. 实现性与社交媒体安全
5. 实现AI学习诚信
6. 实现能力级自治和时间金钱托付
7. 实现导师与治理交还里程碑
8. 实现离家准备和S2/S3
9. 导入审核种子并完成青少年安全与E2E

## 推荐路由

- /sunday-school/ai-formation/youth
- /sunday-school/ai-formation/youth/13-15
- /sunday-school/ai-formation/youth/16-18
- /sunday-school/ai-formation/youth/identity
- /sunday-school/ai-formation/youth/questions
- /sunday-school/ai-formation/youth/social-media
- /sunday-school/ai-formation/youth/ai-integrity
- /sunday-school/ai-formation/youth/autonomy
- /sunday-school/ai-formation/youth/stewardship
- /sunday-school/ai-formation/youth/mentor
- /sunday-school/ai-formation/youth/leaving-home
- /sunday-school/ai-formation/teachers/youth

## 不可违反

- 青少年可以提问、怀疑、不同意或暂时不确定；禁止信仰答案评分、强迫归信和把疑问自动定性为悖逆。
- 不得给青少年分配身份标签、推断性取向、救恩、成熟度、隐藏罪或未来风险。
- 性与关系教育必须非露骨、年龄适切、经过审核；禁止个人性史采集、秘密成人—青少年或AI—青少年亲密渠道。
- AI学习必须遵守学校政策、保留独立尝试、核验、披露和最终作者责任；禁止代写规避检测和伪造过程。
- 社交媒体分析不得采集完整帖子历史、建立家长监控流或生成社交价值分。
- 自治按能力逐步交还，必须有青少年声音、试行、复盘和恢复路径；一次失败不得永久全量回收。
- 导师关系必须透明、角色清楚、可撤销普通同意、无秘密/浪漫/性化渠道，并说明保护性保密边界。
- 勒索、强迫、未经同意影像、成人不当接触、自伤或即时危险必须进入S2/S3，产品不取证、不责怪。

## 验证

运行技能包校验，然后运行真实仓库的 lint、typecheck、unit、integration、migration、E2E、a11y、security、content-review 和 build/deploy smoke tests。记录每条命令、退出码和关键结果；失败必须如实报告并修复或列为阻断项。

## 最终报告

报告仓库发现、文件变更、迁移、Schema/API、UI、权限、隐私、安全、审核状态、测试结果、回滚、未解决风险和下一批扩展点。
