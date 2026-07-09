import { AttentionPull } from './types'

export type ScoreLabel =
  | 'insufficient_data'
  | 'needs_gentle_attention'
  | 'returning'
  | 'steady'
  | 'growing'
  | 'flourishing'

export type ScoreConfidence = 'low' | 'medium' | 'high'

export type ScoreComponentKey =
  | 'covenant'
  | 'investedAttention'
  | 'capturedAwareness'
  | 'reflectionReturn'
  | 'focusAndFollowThrough'
  | 'restorationAndRelationship'

export type ScoreComponent = {
  key: ScoreComponentKey
  label: string
  score: number
  max: number
  reason: string
  gentleSuggestion?: string | null
}

export type DailyAttentionScoreDto = {
  id?: string
  date: string
  score: number | null
  scoreLabel: ScoreLabel
  scoreLabelText?: string
  dataCompleteness: number
  confidence: ScoreConfidence
  components: ScoreComponent[]
  inputSummary: {
    hasCovenant: boolean
    entriesCount: number
    totalMinutes: number
    investedMinutes: number
    capturedMinutes: number
    capturedRatio: number | null
    focusMinutes: number
    completedFocusSessions: number
    reviewExists: boolean
    planCheckinsCount: number
    topPulls: Array<{ pull: AttentionPull | string; label: string; count: number; minutes: number }>
  }
  insights: {
    grace: string[]
    risks: string[]
    nextStep: string
  }
  createdAt?: string
  updatedAt?: string
}

export const ScoreLabelText: Record<ScoreLabel, string> = {
  insufficient_data: '记录不足',
  needs_gentle_attention: '需要温柔留意',
  returning: '正在归回',
  steady: '稳定操练',
  growing: '持续成长',
  flourishing: '节奏丰盛',
}

export const ScoreConfidenceText: Record<ScoreConfidence, string> = {
  low: '参考有限',
  medium: '有一定参考价值',
  high: '记录较完整',
}
