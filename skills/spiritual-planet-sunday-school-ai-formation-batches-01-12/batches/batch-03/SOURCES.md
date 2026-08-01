# 设计与实现来源

## Codex Skills 与仓库指令

- OpenAI Developers — Build skills: https://developers.openai.com/codex/build-skills
- OpenAI Developers — Codex customization overview: https://developers.openai.com/codex/customization/overview
- OpenAI Developers Blog — Testing Agent Skills Systematically with Evals: https://developers.openai.com/blog/eval-skills
- OpenAI Developers — Skills in the API / validation limits: https://developers.openai.com/api/docs/guides/tools-skills

本包采用：

- `.agents/skills/<skill-name>/SKILL.md`；
- 可选 `agents/openai.yaml`、`references/`、`schemas/`、`assets/`；
- 细粒度 focused skill + 总编排 skill；
- `AGENTS.md` 持久化仓库级约束；
- 正向、隐式、显式、负向和行为安全评测；
- 脚本只承担确定性静态验证，不替代模型对仓库的上下文判断。

## 神学与课程原则

经文锚点包括但不限于：创 1:26–28；出 20:3–6；申 6:4–9；箴 18:13、15、17；罗 12:1–2；林后 10:5；西 2:8；帖前 5:21；雅 1:5；徒 17:11；弗 4:25；雅 3；林前 10:23–31。

实现中必须区分：

1. 经文明确教导；
2. 神学推论；
3. 牧养智慧；
4. 产品默认值。

不嵌入未经授权的长篇圣经译文；仅保存引用、用途、短摘录许可状态与上下文检查元数据。课程和实践种子默认进入人工神学/牧养审核，不自动发布。
