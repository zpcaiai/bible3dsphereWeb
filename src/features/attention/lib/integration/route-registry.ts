import { t as i18nT } from '../../../../i18n/runtime'
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
  { key: 'dashboard', label: i18nT('守心首页'), href: '/attention', description: i18nT('今日守心总览。'), group: 'daily', requiresAuth: true },
  { key: 'covenant', label: i18nT('每日立约'), href: '/attention/covenant', description: i18nT('早晨把注意力献给神所托付的事。'), group: 'daily', requiresAuth: true },
  { key: 'focus', label: i18nT('专注模式'), href: '/attention/focus', description: i18nT('进入使命、敬拜、关系或恢复型专注。'), group: 'daily', requiresAuth: true },
  { key: 'ledger', label: i18nT('注意力账本'), href: '/attention/ledger', description: i18nT('记录今天注意力流向。'), group: 'daily', requiresAuth: true },
  { key: 'review', label: i18nT('晚间复盘'), href: '/attention/review', description: i18nT('在恩典中回看一天。'), group: 'daily', requiresAuth: true },
  { key: 'diagnosis', label: i18nT('AI 守心洞察'), href: '/attention/diagnosis', description: i18nT('生成温柔、非羞辱的属灵反思。'), group: 'insight', requiresAuth: true },
  { key: 'warfare', label: i18nT('争战地图'), href: '/attention/warfare', description: i18nT('看见牵引路径并建立守心计划。'), group: 'insight', requiresAuth: true },
  { key: 'reports', label: i18nT('周报成长'), href: '/attention/reports', description: i18nT('回看本周节奏和成长曲线。'), group: 'insight', requiresAuth: true },
  { key: 'accountability', label: i18nT('同伴守望'), href: '/attention/accountability', description: i18nT('选择性分享摘要和代祷请求。'), group: 'community', requiresAuth: true },
  { key: 'groups', label: i18nT('守心小组'), href: '/attention/groups', description: i18nT('参与小组挑战，不排名、不比较。'), group: 'community', requiresAuth: true },
  { key: 'privacy', label: i18nT('隐私设置'), href: '/attention/privacy', description: i18nT('管理伙伴、小组和挑战可见范围。'), group: 'settings', requiresAuth: true },
  { key: 'admin', label: i18nT('运营后台'), href: '/attention/admin', description: i18nT('脱敏聚合运营与安全状态。'), group: 'admin', requiresAuth: true, requiresAdmin: true },
]

export function visibleAttentionRoutes(isAdmin = false) {
  return ATTENTION_ROUTES.filter((route) => !route.requiresAdmin || isAdmin)
}

export function enabledAttentionRoutes(
  flags: Record<string, boolean>,
  isAdmin = false,
) {
  const disabled = new Set<string>()
  if (!flags.ATTENTION_AI_ENABLED) disabled.add('diagnosis')
  if (!flags.ATTENTION_COMMUNITY_ENABLED) disabled.add('accountability')
  if (!flags.ATTENTION_GROUPS_ENABLED) disabled.add('groups')
  if (!flags.ATTENTION_ADMIN_ENABLED) disabled.add('admin')
  return visibleAttentionRoutes(isAdmin).filter((route) => !disabled.has(route.key))
}

export function attentionSectionFromPath(pathname: string) {
  const match = String(pathname || '').match(/^\/attention(?:\/([^/]+))?\/?$/)
  return match ? (match[1] || 'dashboard') : null
}
