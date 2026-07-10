export type AttentionRoute = {
  key: string
  label: string
  href: string
  description: string
  group: 'daily' | 'insight' | 'community' | 'settings' | 'admin'
  requiresAuth: boolean
  requiresAdmin?: boolean
}

export const ATTENTION_ROUTES: AttentionRoute[] = [
  { key: 'dashboard', label: '守心首页', href: '/attention', description: '今日守心总览。', group: 'daily', requiresAuth: true },
  { key: 'covenant', label: '每日立约', href: '/attention/covenant', description: '早晨把注意力献给神所托付的事。', group: 'daily', requiresAuth: true },
  { key: 'focus', label: '专注模式', href: '/attention/focus', description: '进入使命、敬拜、关系或恢复型专注。', group: 'daily', requiresAuth: true },
  { key: 'ledger', label: '注意力账本', href: '/attention/ledger', description: '记录今天注意力流向。', group: 'daily', requiresAuth: true },
  { key: 'review', label: '晚间复盘', href: '/attention/review', description: '在恩典中回看一天。', group: 'daily', requiresAuth: true },
  { key: 'diagnosis', label: 'AI 守心洞察', href: '/attention/diagnosis', description: '生成温柔、非羞辱的属灵反思。', group: 'insight', requiresAuth: true },
  { key: 'warfare', label: '争战地图', href: '/attention/warfare', description: '看见牵引路径并建立守心计划。', group: 'insight', requiresAuth: true },
  { key: 'reports', label: '周报成长', href: '/attention/reports', description: '回看本周节奏和成长曲线。', group: 'insight', requiresAuth: true },
  { key: 'accountability', label: '同伴守望', href: '/attention/accountability', description: '选择性分享摘要和代祷请求。', group: 'community', requiresAuth: true },
  { key: 'groups', label: '守心小组', href: '/attention/groups', description: '参与小组挑战，不排名、不比较。', group: 'community', requiresAuth: true },
  { key: 'privacy', label: '隐私设置', href: '/attention/privacy', description: '管理伙伴、小组和挑战可见范围。', group: 'settings', requiresAuth: true },
  { key: 'admin', label: '运营后台', href: '/attention/admin', description: '脱敏聚合运营与安全状态。', group: 'admin', requiresAuth: true, requiresAdmin: true },
]

export function visibleAttentionRoutes(isAdmin = false) {
  return ATTENTION_ROUTES.filter((route) => !route.requiresAdmin || isAdmin)
}
