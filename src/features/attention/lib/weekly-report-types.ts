import { AttentionPull } from './types'
import { DailyAttentionScoreDto, ScoreLabel } from './score-types'

export type WeeklyReportDto = {
  id: string
  weekStart: string
  weekEnd: string
  scoreAverage: number | null
  scoreLabel: ScoreLabel
  scoreTrend: 'up' | 'down' | 'stable' | 'insufficient'
  dataCompleteness: number
  categoryMinutes: {
    worship: number
    mission: number
    relationship: number
    restoration: number
    captured: number
  }
  categoryPercentages: {
    worship: number
    mission: number
    relationship: number
    restoration: number
    captured: number
  }
  dailyScores: DailyAttentionScoreDto[]
  focusSummary: {
    totalMinutes: number
    completedSessions: number
    interruptedSessions: number
    bestFocusDay: string | null
  }
  covenantSummary: {
    covenantDays: number
    totalDays: number
    mostCommonRisk: string | null
    commonRiskPulls: Array<{ pull: AttentionPull | string; label: string; count: number }>
  }
  reviewSummary: {
    reviewDays: number
    totalDays: number
    reviewRhythmLabel: string
  }
  warfareSummary: {
    activePlansCount: number
    checkinsCount: number
    returningCheckins?: number
    primaryPattern: { patternKey?: string; label: string; intensity: string } | null
  }
  topPulls: Array<{ pull: AttentionPull | string; label: string; count: number; minutes: number }>
  growthSignals: {
    capturedMinutesChangePercent: number | null
    investedMinutesChangePercent: number | null
    focusMinutesChangePercent: number | null
    reviewDaysChange: number | null
  }
  reportSections: {
    weeklySummary: string
    graceHighlights: string[]
    mainPattern: string
    returningMoments: string[]
    warningWithoutShame: string
    nextWeekPractice: string
    suggestedBoundary: string
  }
  nextWeekPractice: string | null
  prayer: string | null
  status: 'generated' | 'archived' | 'hidden'
  createdAt: string
  updatedAt: string
}
