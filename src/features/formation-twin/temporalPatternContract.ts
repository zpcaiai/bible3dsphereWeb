export type PatternLifecycleStatus =
  | 'CANDIDATE' | 'PENDING_USER_REVIEW' | 'CONFIRMED_ACTIVE' | 'CONFIRMED_CONTEXTUAL'
  | 'WEAKENING' | 'DORMANT' | 'RESOLVED' | 'OUTDATED' | 'REJECTED' | 'INVALIDATED' | 'ARCHIVED'

export type TrajectoryDirection =
  | 'EMERGING' | 'STRENGTHENING' | 'STABLE' | 'WEAKENING' | 'BEING_REPLACED'
  | 'DORMANT' | 'RESOLVED_BY_USER' | 'MIXED' | 'INSUFFICIENT_DATA'

export interface PatternScope {
  scope_kind: 'GLOBAL_UNKNOWN' | 'LIFE_SEASON_SPECIFIC' | 'DOMAIN_SPECIFIC'
    | 'RELATIONSHIP_SPECIFIC' | 'CURRENT_CONTEXT_ONLY' | 'USER_DEFINED'
  life_domains: string[]
  life_season_ids: string[]
  user_description?: string
}

export interface PatternEvidenceReference {
  id: string
  evidence_role: 'SUPPORTING' | 'COUNTEREVIDENCE' | 'CONTEXT_LIMIT' | 'UNRESOLVED' | 'INVALIDATED'
  source_record_type: string
  source_record_id: string
  occurred_at: string
  temporal_weight: number
  source_quality: string
  independence_group?: string
  explanation: string
}

export interface FormationPattern {
  id: string
  title: string
  pattern_type: string
  description: string
  statement_type: 'RULE_PATTERN_HYPOTHESIS' | 'MODEL_PATTERN_HYPOTHESIS' | 'USER_CONFIRMED_PATTERN'
  source_kind: 'RULE' | 'MODEL' | 'USER_DEFINED' | 'USER_CONFIRMED'
  scope: PatternScope
  lifecycle_status: PatternLifecycleStatus
  confidence: {
    level: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH'
    rationale: string[]
    algorithm_version: string
  }
  supporting_evidence: PatternEvidenceReference[]
  counterevidence: PatternEvidenceReference[]
  alternative_explanations: string[]
  limitations: string[]
  first_observed_at: string
  last_observed_at: string
  review_due_at: string
  user_review_status: string
}

export interface LifeSeason {
  id: string
  title: string
  season_type: string
  started_at: string
  ended_at?: string
  life_domains: string[]
  active: boolean
  user_review_status: string
}

export interface FormationTrajectory {
  id: string
  title: string
  trajectory_type: string
  current_direction: TrajectoryDirection
  source_pattern_ids_json: string[]
  limitations_json: string[]
  user_review_status: string
}
