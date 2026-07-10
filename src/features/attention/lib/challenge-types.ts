import { t as i18nT } from '../../../i18n/runtime'
export const ChallengePrivacyLabel: Record<string, string> = {
  status_only: i18nT('只显示完成状态'),
  summary: i18nT('显示整体摘要'),
  anonymous_aggregate: i18nT('匿名聚合'),
}

export interface AttentionChallenge {
  id: string
  groupId: string
  title: string
  description?: string
  challengeType: string
  startDate: string
  endDate: string
  targetDays?: number
  targetMinutes?: number
  privacyMode: string
  progress?: {
    activeParticipants: number
    completedCheckins: number
    groupCompletionRate: number
    currentUserCompletedDays: number
    encouragementText: string
  }
}
