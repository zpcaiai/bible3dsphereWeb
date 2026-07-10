import { t as i18nT } from '../../../i18n/runtime'
export const GroupRoleLabel: Record<string, string> = {
  owner: 'Owner',
  leader: 'Leader',
  member: 'Member',
}

export const GroupTypeLabel: Record<string, string> = {
  private: i18nT('私密守心小组'),
  church_small_group: i18nT('教会小组'),
  discipleship: i18nT('门训同行'),
  challenge_only: i18nT('挑战小组'),
}

export interface AttentionGroup {
  id: string
  name: string
  description?: string
  groupType: string
  currentUserRole?: string
  membersCount?: number
  activeChallengesCount?: number
  inviteCode?: string
}
