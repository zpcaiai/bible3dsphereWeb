import { syncBatch14Record } from './batch14Api'

export const VIRTUE_VICE_STORAGE_KEYS = {
  focuses: 'virtueVice.focuses',
  virtueLogs: 'virtueVice.virtueLogs',
  observations: 'virtueVice.observations',
  patterns: 'virtueVice.patterns',
  temptationPlans: 'virtueVice.temptationPlans',
  temptationCheckins: 'virtueVice.temptationCheckins',
  failureReviews: 'virtueVice.failureReviews',
  fruitAssessments: 'virtueVice.fruitAssessments',
  feedbackRequests: 'virtueVice.feedbackRequests',
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
  if (recordType) syncBatch14Record('virtue_vice', recordType, entry)
}

function listForUser(key, userId) {
  return readList(key).filter((entry) => entry.userId === userId)
}

export const listVirtueFocuses = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.focuses, userId)
export const saveVirtueFocus = (focus) => upsert(VIRTUE_VICE_STORAGE_KEYS.focuses, focus, 'focuses')

export const listVirtueLogs = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.virtueLogs, userId)
export const saveVirtueLog = (log) => upsert(VIRTUE_VICE_STORAGE_KEYS.virtueLogs, log, 'virtue_logs')

export const listViceObservations = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.observations, userId)
export const saveViceObservation = (observation) => upsert(VIRTUE_VICE_STORAGE_KEYS.observations, observation, 'observations')

export const listVicePatterns = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.patterns, userId)
export const saveVicePattern = (pattern) => upsert(VIRTUE_VICE_STORAGE_KEYS.patterns, pattern, 'patterns')

export const listTemptationPlans = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.temptationPlans, userId)
export const saveTemptationPlan = (plan) => upsert(VIRTUE_VICE_STORAGE_KEYS.temptationPlans, plan, 'temptation_plans')

export const listTemptationCheckins = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.temptationCheckins, userId)
export const saveTemptationCheckin = (checkin) => upsert(VIRTUE_VICE_STORAGE_KEYS.temptationCheckins, checkin, 'temptation_checkins')

export const listFailureReviews = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.failureReviews, userId)
export const saveFailureReview = (review) => upsert(VIRTUE_VICE_STORAGE_KEYS.failureReviews, review, 'failure_reviews')

export const listFruitAssessments = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.fruitAssessments, userId)
export const saveFruitAssessment = (assessment) => upsert(VIRTUE_VICE_STORAGE_KEYS.fruitAssessments, assessment, 'fruit_assessments')

export const listFruitFeedbackRequests = (userId) => listForUser(VIRTUE_VICE_STORAGE_KEYS.feedbackRequests, userId)
export const saveFruitFeedbackRequest = (request) => upsert(VIRTUE_VICE_STORAGE_KEYS.feedbackRequests, request, 'feedback_requests')

export function loadVirtueViceData(userId) {
  return {
    focuses: listVirtueFocuses(userId),
    virtueLogs: listVirtueLogs(userId),
    observations: listViceObservations(userId),
    patterns: listVicePatterns(userId),
    temptationPlans: listTemptationPlans(userId),
    temptationCheckins: listTemptationCheckins(userId),
    failureReviews: listFailureReviews(userId),
    fruitAssessments: listFruitAssessments(userId),
    feedbackRequests: listFruitFeedbackRequests(userId),
  }
}
