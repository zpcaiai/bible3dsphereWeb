import { t as i18nT } from '../../../i18n/runtime'
export const PartnerStatusLabel: Record<string, string> = {
  pending: i18nT('等待回应'),
  active: i18nT('同行中'),
  declined: i18nT('已拒绝'),
  paused: i18nT('已暂停'),
  ended: i18nT('已结束'),
}

export const PrayerStatusLabel: Record<string, string> = {
  open: i18nT('代祷中'),
  answered: i18nT('已回应'),
  closed: i18nT('已关闭'),
}

export const PrayerCategoryOptions = [
  ['attention', i18nT('守心')],
  ['anxiety', i18nT('焦虑')],
  ['temptation', i18nT('试探')],
  ['rest', i18nT('安息')],
  ['relationship', i18nT('关系')],
  ['mission', i18nT('使命')],
  ['gratitude', i18nT('感恩')],
  ['other', i18nT('其他')],
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
