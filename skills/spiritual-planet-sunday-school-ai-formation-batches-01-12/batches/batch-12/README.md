# 属灵星球 · 主日学 Tab
## AI时代心意更新与家庭门训 — Batch 12
### 生产认证、神学与牧养治理、儿童安全红队、隐私无障碍、效果评估与发布证据系统

把Batch 01–11从可实现功能收口为可验证、可审核、可回滚的生产系统：以不可变制品、独立认证门、儿童安全红队、隐私安全审计、无障碍、内容质量、Skill评测、效果评估和人类发布决策形成完整Release Evidence Certificate。

## 依赖

依赖 Batch 01–11 的全部领域契约、课程、情境、Formation Twin、S0–S3、安全、隐私、内容审核、Feature Flag和数据权利。

## 安装

```bash
cp -R .agents/skills /path/to/spiritual-planet/.agents/
```

把 `AGENTS.md.snippet` 合并到仓库根目录或主日学模块目录的 `AGENTS.md`，然后在仓库根目录显式调用：

```text
$spiritual-planet-production-certification-orchestrator
```

## 推荐产品路由

```text
/sunday-school/ai-formation/admin/certification
/sunday-school/ai-formation/admin/certification/scopes
/sunday-school/ai-formation/admin/certification/theology
/sunday-school/ai-formation/admin/certification/pastoral-safety
/sunday-school/ai-formation/admin/certification/child-red-team
/sunday-school/ai-formation/admin/certification/privacy-security
/sunday-school/ai-formation/admin/certification/accessibility
/sunday-school/ai-formation/admin/certification/content-quality
/sunday-school/ai-formation/admin/certification/skill-evals
/sunday-school/ai-formation/admin/certification/effectiveness
/sunday-school/ai-formation/admin/certification/release
```

## Skills

- `$spiritual-planet-production-certification-orchestrator` — Production Certification Orchestrator
- `$christian-theology-certification` — Theology Certification
- `$christian-pastoral-safety-certification` — Pastoral Safety Certification
- `$christian-child-safety-red-team` — Child Safety Red Team
- `$christian-privacy-security-audit` — Privacy and Security Audit
- `$christian-accessibility-certification` — Accessibility Certification
- `$christian-content-quality-gate` — Content Quality Gate
- `$christian-skill-routing-evals` — Skill Routing and Behavior Evals
- `$christian-course-effectiveness-evaluation` — Course Effectiveness Evaluation
- `$christian-release-evidence-certificate` — Release Evidence Certificate
- `$christian-distribution-package-governance` — Distribution Package Governance
- `$christian-release-decision-gate` — Human Release Decision Gate
- `$production-certification-course-integrator` — Production Certification UI Integrator

## 本批次硬边界

1. 所有认证必须绑定artifact ID、版本、环境和不可变hash；过期、错配或缺失证据不得复用。
2. 自动化可收集和验证证据，但神学、牧养、儿童保护、隐私安全和最终发布不得自动批准。
3. 不得声称未实际运行的测试已通过；每条生产就绪声明必须引用真实命令/人工记录、时间、结果和限制。
4. 任何儿童保护关键失败、S3中断失败、跨租户泄漏、敏感日志泄漏或未缓解关键安全缺陷都是发布阻断项。
5. 神学认证必须核对经文上下文、权威分层、恩典次序、宗派差异和有害使用，模型置信度不能替代授权审核者。
6. 无障碍认证必须同时包含自动化和人工证据，不能仅凭工具分数通过。
7. 课程效果评估不得推断救恩、圣洁、呼召、父母适格性或人的价值；参与者可退出且未成年人适用同意/assent和保护。
8. 内容不得自动发布；版权、译文许可、年龄适切性、事实与经文来源、羞辱胁迫和审核状态必须通过质量门。
9. 最终发布决策必须由授权人作出，具备Feature Flag、有限发布能力、回滚、事故Owner和透明阻断清单。

## 交付规模

- 13 个 Codex Skills；
- 12 个 Draft 2020-12 JSON Schema；
- 15 份参考政策/蓝图；
- 7 份种子、矩阵、模板或 Analytics 资产；
- 32 个实践/控制项；
- 8 个课程单元、20 节课；
- 24 个情境或红队场景；
- Skill 路由评测、行为安全评测、静态验证脚本和实施清单。

## 静态验证

```bash
python scripts/validate-batch12.py
```

随后必须在真实属灵星球仓库中运行原生 lint、typecheck、unit、integration、migration、E2E、a11y、安全、内容审核和部署验收。静态校验只证明技能包内部结构与约束一致，不代表真实应用已经上线。
