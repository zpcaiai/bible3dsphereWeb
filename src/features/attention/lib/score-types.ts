import { AttentionPull } from './types'
import { t as i18nT } from '../../../i18n/runtime'

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
  insufficient_data: i18nT('记录不足'),
  needs_gentle_attention: i18nT('需要温柔留意'),
  returning: i18nT('正在归回'),
  steady: i18nT('稳定操练'),
  growing: i18nT('持续成长'),
  flourishing: i18nT('节奏丰盛'),
}

export const ScoreConfidenceText: Record<ScoreConfidence, string> = {
  low: i18nT('参考有限'),
  medium: i18nT('有一定参考价值'),
  high: i18nT('记录较完整'),
}
