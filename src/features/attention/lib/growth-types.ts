import { AttentionPull } from './types'

export type GrowthMetricKey =
  | 'score'
  | 'investedMinutes'
  | 'capturedMinutes'
  | 'capturedRatio'
  | 'worshipMinutes'
  | 'missionMinutes'
  | 'relationshipMinutes'
  | 'restorationMinutes'
  | 'focusMinutes'
  | 'reviewCompleted'
  | 'planCheckins'
  | 'topPulls'

export type GrowthDataPoint = {
  date: string
  score: number | null
  investedMinutes: number
  capturedMinutes: number
  capturedRatio: number | null
  worshipMinutes: number
  missionMinutes: number
  relationshipMinutes: number
  restorationMinutes: number
  focusMinutes: number
  reviewCompleted: boolean
  planCheckins: number
  topPulls: Array<{ pull: AttentionPull | string; label: string; count: number; minutes: number }>
}

export type GrowthTrendDto = {
  range: { from: string; to: string; days: number }
  points: GrowthDataPoint[]
  summary: {
    averageScore: number | null
    averageInvestedMinutes: number
    averageCapturedMinutes: number
    capturedTrend: 'up' | 'down' | 'stable' | 'insufficient'
    focusTrend: 'up' | 'down' | 'stable' | 'insufficient'
    mostFrequentPulls: Array<{ pull: AttentionPull | string; label: string; count: number; minutes: number }>
    bestRhythmDay: string | null
  }
}
