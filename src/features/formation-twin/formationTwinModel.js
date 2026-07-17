export const FORMATION_TWIN_INTEGRATIONS = [
  {
    key: 'observe',
    title: '记录与觉察',
    description: '从你主动留下的记录开始，不擅自解释内心。',
    color: '#5ac8fa',
    items: [
      { icon: '💭', label: '情绪状态签到', description: '记录此刻感受与处境', target: 'checkin' },
      { icon: '🪞', label: '今日心镜', description: '查看情感与形成摘要', target: 'innerlife' },
      { icon: '🔍', label: '每日灵魂一问', description: '用一个问题补充生命事件', target: 'soul-question' },
    ],
  },
  {
    key: 'practice',
    title: '祷告与操练',
    description: '把状态带回祷告、经文、习惯与注意力。',
    color: '#a78bfa',
    items: [
      { icon: '🙏', label: '灵修与祷告', description: '进入已有灵修记录与祷告', target: 'devotion' },
      { icon: '🌱', label: '属灵塑造', description: '进入已有形成与习惯引擎', target: 'spiritual-formation' },
      { icon: '🕯️', label: '守心立约', description: '管理注意力与数字边界', target: 'attention' },
    ],
  },
  {
    key: 'review',
    title: '回顾与轨迹',
    description: '按时间回看证据与变化，不把成长变成排名。',
    color: '#34c759',
    items: [
      { icon: '🗺️', label: '灵命成长图谱', description: '回看已有成长节点', target: 'growth-map' },
      { icon: '🗃️', label: '个人记录检索', description: '查找自己留下的记录', target: 'personal-search' },
      { icon: '📦', label: '导出我的数据', description: '查看与带走个人数据', target: 'export-data' },
    ],
  },
  {
    key: 'care',
    title: '安全与真实关系',
    description: '安全优先；需要时连接可信真人与群体。',
    color: '#ff9f40',
    items: [
      { icon: '🛟', label: '危机安全入口', description: '先稳定、再连接、后形成', target: 'sos' },
      { icon: '🤝', label: '属灵伙伴', description: '连接守望与同行关系', target: 'partner' },
      { icon: '⛪', label: '教会与群体', description: '回到真实的教会生活', target: 'communion' },
    ],
  },
]

function addFact(facts, condition, fact) {
  if (condition) facts.push(fact)
}

export function buildFormationTwinSnapshot({ dailySnapshot, emotionTrajectory } = {}) {
  const facts = []

  addFact(facts, Boolean(dailySnapshot?.last_emotion), {
    key: 'last-emotion',
    label: '最近记录的情绪',
    value: dailySnapshot?.last_emotion,
    statementType: '用户记录',
    source: '情绪签到摘要',
  })

  addFact(facts, typeof dailySnapshot?.has_devotion_today === 'boolean', {
    key: 'devotion-today',
    label: '今日灵修记录',
    value: dailySnapshot?.has_devotion_today ? '已记录' : '尚未记录',
    statementType: '可观察事实',
    source: '灵修记录摘要',
  })

  addFact(facts, Number.isFinite(dailySnapshot?.pending_prayers), {
    key: 'pending-prayers',
    label: '待代祷事项',
    value: `${Math.max(0, dailySnapshot?.pending_prayers || 0)} 项`,
    statementType: '可观察事实',
    source: '祷告系统计数',
  })

  addFact(facts, Boolean(dailySnapshot?.trajectory_label), {
    key: 'trajectory',
    label: '当前趋势摘要',
    value: `${dailySnapshot?.trajectory_icon || '↗'} ${dailySnapshot?.trajectory_label}`.trim(),
    statementType: '系统摘要',
    source: '今日灵命状态',
  })

  addFact(facts, Number(emotionTrajectory?.count) > 0, {
    key: 'emotion-count',
    label: '近 30 天情绪记录',
    value: `${Number(emotionTrajectory?.count)} 次`,
    statementType: '可观察事实',
    source: '情感轨迹计数',
  })

  addFact(facts, Boolean(emotionTrajectory?.dominant_emotion), {
    key: 'dominant-emotion',
    label: '近期常见情绪',
    value: emotionTrajectory?.dominant_emotion,
    statementType: '系统摘要',
    source: '情感轨迹聚合',
  })

  return {
    status: facts.length > 0 ? 'available' : 'insufficient_data',
    message: facts.length > 0
      ? '以下内容来自已加载的现有系统摘要；它们是反思线索，不是属灵裁决。'
      : '目前还没有足够且经过授权的数据形成生命状态镜像。',
    facts,
    sourceCount: new Set(facts.map((fact) => fact.source)).size,
  }
}
