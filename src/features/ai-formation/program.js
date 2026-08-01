export const MODULE_MANIFEST = Object.freeze({
  moduleId: 'sunday_school.ai_formation',
  version: '1.0.0',
  status: 'release_candidate',
  route: '/sunday-school/ai-formation',
  title: { 'zh-CN': 'AI时代心意更新与家庭门训', en: 'Renewing the Mind in the AI Age' },
  tracks: [
    'adult_self_governance',
    'parent_family_discipleship',
    'child_youth_formation',
    'teacher_pastoral_support',
  ],
  safetyPolicyVersion: '1.0.0',
  featureFlag: 'sundaySchoolAiFormation',
  teacherPermission: 'sunday_school.ai_formation.manage',
})

export const TRACKS = Object.freeze([
  { id: 'adult_self_governance', title: '成人自我治理', summary: '注意力、身体节律、AI分辨与恢复支持', batchIds: ['01', '02', '03', '04'] },
  { id: 'parent_family_discipleship', title: '父母与家庭门训', summary: '父母先被塑造，建立透明、可复盘的家庭公约', batchIds: ['05', '06'] },
  { id: 'child_youth_formation', title: '儿童青少年形成', summary: '年龄适切、成人脚手架、诚实提问与自治交还', batchIds: ['07', '08'] },
  { id: 'teacher_pastoral_support', title: '教师与牧养支持', summary: '审核课程、情境、Formation Twin 与发布证据', batchIds: ['09', '10', '11', '12'] },
])

const batch = (id, title, capabilities, boundaries) => ({
  id,
  title,
  capabilities,
  boundaries,
  implementationStatus: 'release_candidate',
  contentReviewStatus: 'review_pending',
  learnerContentAvailable: false,
})

export const BATCHES = Object.freeze([
  batch('01', '模块基础、神学护栏、领域模型与牧养安全契约', ['四条课程轨道', 'LearnerContext v1', 'S0-S3 中断契约'], ['不生成属灵总分', 'S3 停止普通流程']),
  batch('02', '攻克己身、注意力治理与数字属灵操练', ['7/14/30/90天计划', '可暂停、简化与删除', '非食物替代'], ['不诊断成瘾', '不保存网络草稿']),
  batch('03', 'AI认知外包、算法世界观与属灵分辨', ['AI角色边界', '来源与经文核验', '学习诚信'], ['不保存原始提示', '最终决定者始终是人']),
  batch('04', '身份、欲望、性与虚拟亲密分辨及恢复', ['类别化触发记录', '短时中断计划', '可撤销支持'], ['不保存露骨内容', '禁止秘密AI亲密关系']),
  batch('05', '父母先被塑造：榜样、焦虑、修复与权柄', ['父母榜样计划', '认罪与修复', '权柄边界'], ['不生成父母适格分', '不以控制代替塑造']),
  batch('06', '家庭注意力生态、数字公约与家庭AI公约', ['设备区域', '例外与复盘', '孩子声音'], ['禁止秘密监控', '家庭规则不是普遍神命']),
  batch('07', '0-6岁与7-12岁儿童形成', ['照护者脚手架', '故事与自由游戏', '媒介与AI素养'], ['屏幕不是核心照护者', '不采集儿童生物特征']),
  batch('08', '13-15岁与16-18岁青少年自治交还', ['诚实疑问', '学习诚信', '能力级自治'], ['不推断性取向或隐藏罪', '禁止秘密成人渠道']),
  batch('09', '课程、课时、教师讲义与审核发布引擎', ['版本课程', '多角色审核', '可回滚发布'], ['AI不能审批', '未审核内容不能面向学习者']),
  batch('10', '情境、后果、恩典、修复与苏格拉底运行时', ['版本绑定会话', '暂停与恢复', '安全退出'], ['不重演真实创伤', '路径不形成风险画像']),
  batch('11', 'Formation Twin纵向成长回顾', ['证据链接轨迹', '7/14/30/90复盘', '用户纠正'], ['不是灵魂模型', '不接入浏览历史或私聊']),
  batch('12', '生产认证、治理、红队、隐私与发布证据', ['不可变证据范围', '人类发布决策', '回滚所有权'], ['自动化不能批准发布', '缺失证据保持 NOT_CERTIFIED']),
])

export const RELEASE_GATES = Object.freeze([
  'theology', 'pastoral_safety', 'child_safety', 'privacy_security', 'tenant_isolation',
  'accessibility_automated', 'accessibility_manual', 'content_quality', 'skill_evals', 'rollback_rehearsal',
])

const allowedContextKeys = new Set(['version', 'role', 'age_band', 'locale', 'goals', 'accessibility_needs', 'device_context', 'consent'])
const allowedGoals = new Set(['attention', 'digital_habits', 'body_rhythm', 'sexual_integrity', 'ai_discernment', 'family_liturgy', 'parent_modeling', 'identity', 'relationships', 'teacher_preparation'])

export function validateLearnerContext(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('learner context must be an object')
  const unknown = Object.keys(value).filter((key) => !allowedContextKeys.has(key))
  if (unknown.length) throw new TypeError(`unknown learner context fields: ${unknown.join(', ')}`)
  if (!['learner', 'parent', 'teacher', 'pastor', 'guardian'].includes(value.role)) throw new TypeError('invalid role')
  if (!['0_6', '7_12', '13_15', '16_18', 'adult'].includes(value.age_band)) throw new TypeError('invalid age band')
  if (!Array.isArray(value.goals) || !value.goals.length || value.goals.some((goal) => !allowedGoals.has(goal))) throw new TypeError('invalid goals')
  if (new Set(value.goals).size !== value.goals.length) throw new TypeError('goals must be unique')
  if (value.consent?.data_minimization_accepted !== true) throw new TypeError('data minimization consent is required')
  if (value.age_band !== 'adult' && value.consent?.guardian_confirmed !== true) throw new TypeError('minor access requires guardian confirmation')
  return { version: '1.0.0', locale: 'zh-CN', accessibility_needs: [], device_context: 'prefer_not_to_say', ...value }
}

export function recommendTrack(context) {
  if (['teacher', 'pastor'].includes(context.role)) return 'teacher_pastoral_support'
  if (context.age_band !== 'adult') return 'child_youth_formation'
  if (['parent', 'guardian'].includes(context.role) || context.goals.some((goal) => ['family_liturgy', 'parent_modeling'].includes(goal))) return 'parent_family_discipleship'
  return 'adult_self_governance'
}

export function createFormationPlan({ horizonDays, priorityDomains, practiceIds, startsOn }) {
  if (![7, 14, 30, 90].includes(Number(horizonDays))) throw new TypeError('horizon must be 7, 14, 30, or 90 days')
  if (!priorityDomains?.length || priorityDomains.length > 3 || new Set(priorityDomains).size !== priorityDomains.length) throw new TypeError('choose one to three unique priorities')
  if (!practiceIds?.length || practiceIds.length > 3 || new Set(practiceIds).size !== practiceIds.length) throw new TypeError('choose one to three unique practices')
  return {
    version: '1.0.0', horizon_days: Number(horizonDays), priority_domains: priorityDomains,
    practice_ids: practiceIds, status: 'draft', starts_on: startsOn,
    grace_before_practice: true, spiritual_score_generated: false,
  }
}

export function assessAiRole({ requestedRole, stakes = 'low', delegationLevel = 'assist' }) {
  const prohibited = new Set(['final_moral_authority', 'pastoral_diagnostician', 'divine_messenger', 'secret_minor_companion'])
  const blocked = prohibited.has(requestedRole) || stakes === 'emergency' || delegationLevel === 'decide'
  return {
    decision: blocked ? 'prohibited_substitution' : 'assist_with_human_ownership',
    finalDecisionOwner: 'human',
    requiresSafetyFlow: stakes === 'emergency',
  }
}

export function filterApprovedContent(items = []) {
  return items.filter((item) => item.reviewStatus === 'approved' && item.publishedAt && !item.retiredAt)
}

export function evaluateReleaseEvidence(items = []) {
  const passed = new Set(items.filter((item) => item.result === 'passed' && (item.exitCode === 0 || item.exitCode == null)).map((item) => item.gate))
  const blockers = RELEASE_GATES.filter((gate) => !passed.has(gate)).map((gate) => `${gate}:MISSING_OR_NOT_PASSED`)
  return { status: blockers.length ? 'NOT_CERTIFIED' : 'READY_FOR_HUMAN_DECISION', blockers, automatedApproval: false }
}
