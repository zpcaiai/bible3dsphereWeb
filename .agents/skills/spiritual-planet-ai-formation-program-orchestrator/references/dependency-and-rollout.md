# Batch 04–12 Unified Implementation Order

## Dependency sequence

### Batch 04 — 身份、欲望、性、色情触发、AI伴侣与虚拟亲密分辨及恢复系统

- Orchestrator: `$spiritual-planet-identity-intimacy-recovery-orchestrator`
- Dependency: 必须先安装 Batch 01–03，并复用其模块、权威分层、S0–S3、安全、成人自我治理、AI角色边界、私密日志和内容审核。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 05 — 父母先被塑造：榜样、注意力、焦虑、成功偶像、认罪修复与权柄治理系统

- Orchestrator: `$spiritual-planet-parent-formation-orchestrator`
- Dependency: 依赖 Batch 01–04，尤其复用安全门、成人自我治理、身份与恢复、家庭/学习者关系和内容审核。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 06 — 家庭注意力生态、家庭数字公约与家庭AI公约系统

- Orchestrator: `$spiritual-planet-family-attention-covenant-orchestrator`
- Dependency: 依赖 Batch 01–05，复用家庭角色、父母榜样、AI权威边界、个人数字规则、内容审核与S0–S3安全。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 07 — 0–6岁与7–12岁：依恋、故事、身体节律、媒介与AI素养课程系统

- Orchestrator: `$spiritual-planet-child-formation-orchestrator`
- Dependency: 依赖 Batch 01–06，复用家庭角色、公约、内容审核、父母形成、AI边界与儿童保护安全门。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 08 — 13–15岁与16–18岁：身份、怀疑、性与社交媒体、AI诚信和自治交还系统

- Orchestrator: `$spiritual-planet-youth-autonomy-orchestrator`
- Dependency: 依赖 Batch 01–07，复用家庭公约、儿童保护、身份/亲密边界、AI核验、课程审核和安全门。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 09 — 主日学课程、课时、教师讲义、学生手册与审核发布引擎

- Orchestrator: `$spiritual-planet-curriculum-teacher-engine-orchestrator`
- Dependency: 依赖 Batch 01–08，复用所有内容权威、安全、年龄、家庭、课程轨道、经文核验和权限契约。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 10 — 情境模拟、选择—后果—恩典—修复与苏格拉底门训运行时

- Orchestrator: `$spiritual-planet-scenario-runtime-orchestrator`
- Dependency: 依赖 Batch 01–09，复用课程引擎、安全门、身份/欲望/家庭/儿童/青少年内容和审核发布。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 11 — Formation Twin：注意力、习惯、关系果子与7/14/30/90天纵向成长系统

- Orchestrator: `$spiritual-planet-formation-twin-orchestrator`
- Dependency: 依赖 Batch 01–10，复用所有实践、计划、课程、情境、家庭/青少年角色、私密日志、S0–S3和数据权利。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

### Batch 12 — 生产认证、神学与牧养治理、儿童安全红队、隐私无障碍、效果评估与发布证据系统

- Orchestrator: `$spiritual-planet-production-certification-orchestrator`
- Dependency: 依赖 Batch 01–11 的全部领域契约、课程、情境、Formation Twin、S0–S3、安全、隐私、内容审核、Feature Flag和数据权利。
- Exit gate:
  - schemas/migrations and policy gates pass;
  - role/tenant/age/privacy tests pass;
  - reviewed seeds remain non-approved unless humans approve;
  - feature flag and rollback are ready;

## Program checkpoints

1. **After Batch 04–06:** adult intimacy recovery, parent formation and family covenant share one consent and household model.
2. **After Batch 07–08:** child/youth age transitions, guardian roles, privacy and autonomy transfer are consistent.
3. **After Batch 09–10:** all courses and scenarios use one versioned curriculum/runtime and deterministic S0–S3 interruption.
4. **After Batch 11:** Formation Twin consumes only authorized structured events, never raw surveillance or hidden traits.
5. **After Batch 12:** immutable evidence, independent gates, human release ownership, limited rollout and rollback are complete.

Parallel work is allowed only for bounded discovery, schema/test implementation and independent UI review. Cross-batch identifiers, migrations, safety, publication and release decisions stay centrally owned.
