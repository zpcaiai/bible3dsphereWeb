import { syncBatch14Record } from './batch14Api'

export const HOLY_HABIT_STORAGE_KEYS = {
  ruleProfiles: 'holyHabit.ruleProfiles',
  commitments: 'holyHabit.ruleCommitments',
  ruleCheckins: 'holyHabit.ruleCheckins',
  ruleReviews: 'holyHabit.ruleReviews',
  habitPlans: 'holyHabit.habitPlans',
  habitCheckins: 'holyHabit.habitCheckins',
  habitReviews: 'holyHabit.habitReviews',
  sabbathPlans: 'holyHabit.sabbathPlans',
  sabbathSessions: 'holyHabit.sabbathSessions',
  restAudits: 'holyHabit.restAudits',
  sabbathReviews: 'holyHabit.sabbathReviews',
  boundaryRules: 'holyHabit.boundaryRules',
  fastingPlans: 'holyHabit.fastingPlans',
  fastingCheckins: 'holyHabit.fastingCheckins',
  fastingReviews: 'holyHabit.fastingReviews',
  simplicityAudits: 'holyHabit.simplicityAudits',
  simplicityActions: 'holyHabit.simplicityActions',
}

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readList(key) {
  if (!hasStorage()) return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeList(key, items) {
  if (!hasStorage()) return
  window.localStorage.setItem(key, JSON.stringify(items))
}

function upsert(key, entry, recordType) {
  const items = readList(key)
  const next = items.some((item) => item.id === entry.id)
    ? items.map((item) => item.id === entry.id ? entry : item)
    : [entry, ...items]
  writeList(key, next)
  if (recordType) syncBatch14Record('holy_habit', recordType, entry)
}

function listForUser(key, userId) {
  return readList(key).filter((entry) => entry.userId === userId)
}

export const listRuleProfiles = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.ruleProfiles, userId)
export const saveRuleProfile = (profile) => upsert(HOLY_HABIT_STORAGE_KEYS.ruleProfiles, profile, 'rule_profiles')

export const listRuleCommitments = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.commitments, userId)
export const saveRuleCommitment = (commitment) => upsert(HOLY_HABIT_STORAGE_KEYS.commitments, commitment, 'commitments')

export const listRuleCheckins = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.ruleCheckins, userId)
export const saveRuleCheckin = (checkin) => upsert(HOLY_HABIT_STORAGE_KEYS.ruleCheckins, checkin, 'rule_checkins')

export const listRuleReviews = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.ruleReviews, userId)
export const saveRuleReview = (review) => upsert(HOLY_HABIT_STORAGE_KEYS.ruleReviews, review, 'rule_reviews')

export const listHabitPlans = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.habitPlans, userId)
export const saveHabitPlan = (plan) => upsert(HOLY_HABIT_STORAGE_KEYS.habitPlans, plan, 'habit_plans')

export const listHabitCheckins = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.habitCheckins, userId)
export const saveHabitCheckin = (checkin) => upsert(HOLY_HABIT_STORAGE_KEYS.habitCheckins, checkin, 'habit_checkins')

export const listHabitReviews = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.habitReviews, userId)
export const saveHabitReview = (review) => upsert(HOLY_HABIT_STORAGE_KEYS.habitReviews, review, 'habit_reviews')

export const listSabbathPlans = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.sabbathPlans, userId)
export const saveSabbathPlan = (plan) => upsert(HOLY_HABIT_STORAGE_KEYS.sabbathPlans, plan, 'sabbath_plans')

export const listSabbathSessions = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.sabbathSessions, userId)
export const saveSabbathSession = (session) => upsert(HOLY_HABIT_STORAGE_KEYS.sabbathSessions, session, 'sabbath_sessions')

export const listRestAudits = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.restAudits, userId)
export const saveRestAudit = (audit) => upsert(HOLY_HABIT_STORAGE_KEYS.restAudits, audit, 'rest_audits')

export const listSabbathReviews = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.sabbathReviews, userId)
export const saveSabbathReview = (review) => upsert(HOLY_HABIT_STORAGE_KEYS.sabbathReviews, review, 'sabbath_reviews')

export const listBoundaryRules = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.boundaryRules, userId)
export const saveBoundaryRule = (rule) => upsert(HOLY_HABIT_STORAGE_KEYS.boundaryRules, rule, 'boundary_rules')

export const listFastingPlans = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.fastingPlans, userId)
export const saveFastingPlan = (plan) => upsert(HOLY_HABIT_STORAGE_KEYS.fastingPlans, plan, 'fasting_plans')

export const listFastingCheckins = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.fastingCheckins, userId)
export const saveFastingCheckin = (checkin) => upsert(HOLY_HABIT_STORAGE_KEYS.fastingCheckins, checkin, 'fasting_checkins')

export const listFastingReviews = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.fastingReviews, userId)
export const saveFastingReview = (review) => upsert(HOLY_HABIT_STORAGE_KEYS.fastingReviews, review, 'fasting_reviews')

export const listSimplicityAudits = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.simplicityAudits, userId)
export const saveSimplicityAudit = (audit) => upsert(HOLY_HABIT_STORAGE_KEYS.simplicityAudits, audit, 'simplicity_audits')

export const listSimplicityActions = (userId) => listForUser(HOLY_HABIT_STORAGE_KEYS.simplicityActions, userId)
export const saveSimplicityAction = (action) => upsert(HOLY_HABIT_STORAGE_KEYS.simplicityActions, action, 'simplicity_actions')

export function loadHolyHabitData(userId) {
  return {
    ruleProfiles: listRuleProfiles(userId),
    commitments: listRuleCommitments(userId),
    ruleCheckins: listRuleCheckins(userId),
    ruleReviews: listRuleReviews(userId),
    habitPlans: listHabitPlans(userId),
    habitCheckins: listHabitCheckins(userId),
    habitReviews: listHabitReviews(userId),
    sabbathPlans: listSabbathPlans(userId),
    sabbathSessions: listSabbathSessions(userId),
    restAudits: listRestAudits(userId),
    sabbathReviews: listSabbathReviews(userId),
    boundaryRules: listBoundaryRules(userId),
    fastingPlans: listFastingPlans(userId),
    fastingCheckins: listFastingCheckins(userId),
    fastingReviews: listFastingReviews(userId),
    simplicityAudits: listSimplicityAudits(userId),
    simplicityActions: listSimplicityActions(userId),
  }
}
