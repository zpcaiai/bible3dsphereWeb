import { beforeEach, describe, expect, it } from 'vitest'
import {
  listPlanExecutions,
  normalizePlanActions,
  planActionPeriodKey,
  planExecutionSummary,
  readPlanExecution,
  writePlanExecution,
  writePlanReview,
} from '../formationPlanProgress'

describe('formation plan execution progress', () => {
  beforeEach(() => window.localStorage.clear())

  it('records daily practices separately for each date', () => {
    const action = { id: 'pray', title: '祷告十分钟', cadence: 'daily' }
    writePlanExecution(window.localStorage, 'u1', 'plan-1', action, { status: 'completed' }, new Date('2026-07-20T12:00:00'))
    expect(readPlanExecution(window.localStorage, 'u1', 'plan-1', action, new Date('2026-07-20T12:00:00'))?.status).toBe('completed')
    expect(readPlanExecution(window.localStorage, 'u1', 'plan-1', action, new Date('2026-07-21T12:00:00'))).toBeNull()
    expect(listPlanExecutions(window.localStorage, 'u1', 'plan-1')).toHaveLength(1)
  })

  it('keeps weekly and one-time actions in their own periods', () => {
    expect(planActionPeriodKey({ cadence: 'once' }, new Date('2026-07-20T12:00:00'))).toBe('once')
    expect(planActionPeriodKey({ cadence: 'weekly' }, new Date('2026-07-22T12:00:00'))).toBe('week:2026-07-20')
  })

  it('summarizes current completion, blocks, and real check-ins', () => {
    const actions = normalizePlanActions([
      { id: 'a', title: 'A', cadence: 'daily' },
      { id: 'b', title: 'B', cadence: 'daily' },
    ])
    const date = new Date('2026-07-20T12:00:00')
    writePlanExecution(window.localStorage, 'u1', 'plan-1', actions[0], { status: 'completed' }, date)
    writePlanExecution(window.localStorage, 'u1', 'plan-1', actions[1], { status: 'blocked' }, date)
    const summary = planExecutionSummary(window.localStorage, 'u1', 'plan-1', actions, date)
    expect(summary).toMatchObject({ total: 2, completed: 1, blocked: 1, percent: 50, totalCheckins: 1 })
  })

  it('stores one editable review per week', () => {
    writePlanReview(window.localStorage, 'u1', 'plan-1', '先从最小一步开始', new Date('2026-07-20T12:00:00'))
    const updated = writePlanReview(window.localStorage, 'u1', 'plan-1', '调整后继续', new Date('2026-07-24T12:00:00'))
    expect(updated.text).toBe('调整后继续')
  })
})
