export enum AttentionCategory {
  WORSHIP = 'worship',
  MISSION = 'mission',
  RELATIONSHIP = 'relationship',
  RESTORATION = 'restoration',
  CAPTURED = 'captured',
}

export enum AttentionPull {
  ANXIETY = 'anxiety',
  COMPARISON = 'comparison',
  LUST = 'lust',
  GREED = 'greed',
  BOREDOM = 'boredom',
  ESCAPE = 'escape',
  CONTROL = 'control',
  FOMO = 'fomo',
  FATIGUE = 'fatigue',
  ALGORITHM = 'algorithm',
  CONSUMERISM = 'consumerism',
  PEOPLE_PLEASING = 'people_pleasing',
  VANITY = 'vanity',
  CURIOSITY_WITHOUT_PURPOSE = 'curiosity_without_purpose',
}

export enum AttentionState {
  PEACEFUL = 'peaceful',
  FOCUSED = 'focused',
  SCATTERED = 'scattered',
  RESTLESS = 'restless',
  TEMPTED = 'tempted',
  NUMB = 'numb',
  REPENTING = 'repenting',
  RESTORED = 'restored',
}

export type AttentionStatus =
  | 'not_started'
  | 'covenant_done'
  | 'focused'
  | 'scattered'
  | 'review_needed'
  | 'completed'

export type AttentionCovenantDto = {
  id: string
  covenantDate: string
  primaryOffering: string
  missionFocus?: string | null
  worshipFocus?: string | null
  relationshipFocus?: string | null
  restorationFocus?: string | null
  mainRisk?: string | null
  riskPulls: string[]
  digitalBoundary?: string | null
  timeBoundary?: string | null
  spiritualBoundary?: string | null
  scriptureReference?: string | null
  scriptureText?: string | null
  prayer?: string | null
  status: string
  createdAt?: string
  updatedAt?: string
}

export type FocusType = 'mission' | 'worship' | 'relationship' | 'restoration'

export type FocusSessionDto = {
  id: string
  startedAt: string
  endedAt?: string | null
  plannedMinutes: number
  actualMinutes?: number | null
  focusType: FocusType
  intention?: string | null
  openingPrayer?: string | null
  closingReflection?: string | null
  interrupted: boolean
  interruptionReason?: string | null
  createdAt?: string
}

export type AttentionEntryDto = {
  id: string
  entryDate: string
  category: AttentionCategory | string
  activityName: string
  durationMinutes: number
  attentionState?: AttentionState | string | null
  pulls: string[]
  note?: string | null
  createdAt?: string
  updatedAt?: string
}

export type AttentionDailySummaryDto = {
  totalMinutes: number
  investedMinutes: number
  capturedMinutes: number
  categoryMinutes: Record<string, number>
  entriesCount: number
  topPulls: Array<{ pull: string; label: string; count: number; minutes: number }>
}

export type AttentionReviewDto = {
  id: string
  reviewDate: string
  biggestCapture?: string | null
  biggestGrace?: string | null
  repentancePoint?: string | null
  tomorrowBoundary?: string | null
  prayer?: string | null
  createdAt?: string
  updatedAt?: string
}

export type DiagnosisSafetyLevel = 'normal' | 'sensitive' | 'crisis'
export type DiagnosisConfidence = 'low' | 'medium' | 'high'

export type AttentionDiagnosisResult = {
  title: string
  shortSummary: string
  safetyLevel: DiagnosisSafetyLevel
  confidence: DiagnosisConfidence
  primaryPattern: {
    key: string
    label: string
    description: string
    evidence: string[]
    confidence: DiagnosisConfidence
  }
  secondaryPatterns: Array<{
    key: string
    label: string
    description: string
    evidence: string[]
    confidence: DiagnosisConfidence
  }>
  attentionPulls: Array<{
    pull: string
    label: string
    observation: string
    possibleRoot: string
    gentlePractice: string
  }>
  graceNoticed: string[]
  repentanceInvitation: {
    title: string
    content: string
    notShamingReminder: string
  }
  scriptureSuggestions: Array<{
    reference: string
    text: string
    reason: string
  }>
  prayer: string
  actionPlan: {
    todayReset?: string
    tomorrowBoundary: string
    replacementPractice: string
    concreteNextStep: string
    accountabilityPrompt?: string
  }
  reflectionQuestions: string[]
  disclaimer: string
}

export type DiagnosisRecordDto = {
  id: string
  diagnosisDate: string
  diagnosisType: 'daily' | 'weekly_pattern' | 'quick_reset' | 'review_support' | 'user_question'
  result: AttentionDiagnosisResult
  provider?: string | null
  modelName?: string | null
  generatedBy: string
  safetyLevel: DiagnosisSafetyLevel
  savedByUser: boolean
  createdAt: string
  updatedAt: string
}

export type WarfareIntensity = 'none' | 'low' | 'medium' | 'high'

export type WarfarePlanDto = {
  id: string
  patternKey: string
  title: string
  description?: string | null
  primaryPulls: string[]
  triggerSituations: string[]
  vulnerableTimes: string[]
  commonBehaviors: string[]
  possibleRoot?: string | null
  gospelTruth?: string | null
  scriptureReference?: string | null
  scriptureText?: string | null
  digitalBoundary?: string | null
  timeBoundary?: string | null
  spiritualBoundary?: string | null
  replacementPractice?: string | null
  escapePlan?: string | null
  accountabilityPrompt?: string | null
  status: 'active' | 'paused' | 'archived'
  sourceType?: string | null
  sourceDiagnosisId?: string | null
  createdAt: string
  updatedAt: string
}

export type WarfareCheckinDto = {
  id: string
  planId: string
  checkinDate: string
  status: 'not_seen' | 'noticed' | 'resisted' | 'escaped' | 'captured' | 'returned'
  noticed: boolean
  resisted: boolean
  escaped: boolean
  returnedToGod: boolean
  triggerObserved?: string | null
  boundaryUsed?: string | null
  replacementUsed?: string | null
  graceNoticed?: string | null
  tomorrowAdjustment?: string | null
  prayer?: string | null
  createdAt: string
  updatedAt: string
}
