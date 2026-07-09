export const PartnerStatusLabel: Record<string, string> = {
  pending: '等待回应',
  active: '同行中',
  declined: '已拒绝',
  paused: '已暂停',
  ended: '已结束',
}

export const PrayerStatusLabel: Record<string, string> = {
  open: '代祷中',
  answered: '已回应',
  closed: '已关闭',
}

export const PrayerCategoryOptions = [
  ['attention', '守心'],
  ['anxiety', '焦虑'],
  ['temptation', '试探'],
  ['rest', '安息'],
  ['relationship', '关系'],
  ['mission', '使命'],
  ['gratitude', '感恩'],
  ['other', '其他'],
] as const

export interface AccountabilityRelationship {
  id: string
  status: string
  requesterUser?: { id: string; displayName: string; avatarUrl?: string }
  partnerUser?: { id: string; displayName: string; avatarUrl?: string }
  currentUserRole?: string
  requesterMessage?: string
}

export interface PrayerRequest {
  id: string
  title: string
  body?: string
  status: string
  category?: string
  prayedCount?: number
  isSensitive?: boolean
}
