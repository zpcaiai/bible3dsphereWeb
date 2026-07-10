import { t as i18nT } from '../../../i18n/runtime'
export const AttentionVisibilityLevels = ['private', 'status_only', 'summary', 'selected_details'] as const

export const AttentionVisibilityLabel: Record<string, string> = {
  private: i18nT('仅自己可见'),
  status_only: i18nT('只显示完成状态'),
  summary: i18nT('温柔摘要'),
  selected_details: i18nT('选择性细节'),
}

export const SensitiveCategoryLabel: Record<string, string> = {
  lust: i18nT('色情/性试探'),
  financial_anxiety: i18nT('财务焦虑'),
  family_conflict: i18nT('家庭冲突'),
  mental_health: i18nT('心理健康'),
  trauma: i18nT('创伤经历'),
  addiction: i18nT('成瘾挣扎'),
  work_conflict: i18nT('工作冲突'),
  identity_shame: i18nT('身份羞耻'),
}

export interface AttentionPrivacySettings {
  defaultPartnerVisibility: string
  defaultGroupVisibility: string
  defaultChallengeVisibility: string
  shareScoresWithPartners: boolean
  shareScoresWithGroups: boolean
  shareWeeklyReportSummary: boolean
  shareWarfarePlanProgress: boolean
  sharePrayerRequests: boolean
  hideSensitiveCategories: string[]
  allowPartnerReminders: boolean
  allowGroupChallengeReminders: boolean
  requirePreviewBeforeSharing: boolean
}
