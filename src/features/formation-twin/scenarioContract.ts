export const SCENARIO_TYPES = [
  'CONTINUE_CURRENT_PATTERN', 'ADD_PROTECTIVE_FACTOR', 'REMOVE_BURDEN_FACTOR',
  'TRY_ALTERNATIVE_RESPONSE', 'CHANGE_ENVIRONMENT_BOUNDARY', 'INCREASE_REST',
  'ADD_HUMAN_SUPPORT', 'PAUSE_EXISTING_PRACTICE', 'LIFE_SEASON_TRANSITION', 'USER_DEFINED',
] as const

export const SCENARIO_HORIZONS = [
  'NEXT_EVENT', 'NEXT_24_HOURS', 'NEXT_7_DAYS', 'NEXT_30_DAYS', 'CURRENT_LIFE_SEASON', 'USER_DEFINED',
] as const

export const NON_PREDICTION_NOTICE = '这是基于你确认资料和可见假设的有限情景比较，不是预测、概率、神的旨意或人生结论。' as const

export const PROHIBITED_SCENARIO_FIELDS = [
  'scenario_success_probability', 'spiritual_outcome_score', 'salvation_probability',
  'relapse_probability', 'holiness_forecast', 'obedience_forecast',
  'divine_will_recommendation', 'future_spiritual_rank',
] as const

export interface ScenarioAssumption {
  assumption_type: string
  description: string
  source_kind: 'USER_CURRENT_STATE' | 'USER_CONFIRMED_PATTERN' | 'USER_CONFIRMED_LIFE_SEASON' | 'USER_CONFIRMED_EFFECT' | 'USER_DEFINED'
  source_reference_ids: string[]
  user_confirmed: true
  uncertainty?: string | null
}

export interface ScenarioBranch {
  branch_id: string
  label: string
  description: string
  plausible_near_term_effects: Array<{ effect_type: string; description: string }>
  possible_tradeoffs: string[]
  uncertainty_factors: string[]
  observation_plan: string[]
  action_required: false
}

export function scenarioContractIsSafe(value: unknown): boolean {
  const serialized = JSON.stringify(value).toLowerCase()
  return !PROHIBITED_SCENARIO_FIELDS.some((field) => serialized.includes(`"${field}"`))
    && !/\d+(?:\.\d+)?\s*%[^。]*(复发|救恩|属灵|信仰)/.test(serialized)
}
