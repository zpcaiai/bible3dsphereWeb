export const GroupRoleLabel: Record<string, string> = {
  owner: 'Owner',
  leader: 'Leader',
  member: 'Member',
}

export const GroupTypeLabel: Record<string, string> = {
  private: '私密守心小组',
  church_small_group: '教会小组',
  discipleship: '门训同行',
  challenge_only: '挑战小组',
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
