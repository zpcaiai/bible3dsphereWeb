export const AttentionVisibilityLevels = ['private', 'status_only', 'summary', 'selected_details'] as const

export const AttentionVisibilityLabel: Record<string, string> = {
  private: '仅自己可见',
  status_only: '只显示完成状态',
  summary: '温柔摘要',
  selected_details: '选择性细节',
}

export const SensitiveCategoryLabel: Record<string, string> = {
  lust: '色情/性试探',
  financial_anxiety: '财务焦虑',
  family_conflict: '家庭冲突',
  mental_health: '心理健康',
  trauma: '创伤经历',
  addiction: '成瘾挣扎',
  work_conflict: '工作冲突',
  identity_shame: '身份羞耻',
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
