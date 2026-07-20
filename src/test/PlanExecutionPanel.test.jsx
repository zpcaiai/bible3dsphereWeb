import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PlanExecutionPanel from '../components/PlanExecutionPanel'
import { listPlanExecutions, listPlanReviews } from '../formationPlanProgress'

describe('PlanExecutionPanel', () => {
  beforeEach(() => window.localStorage.clear())

  it('records schedule, completion, reflection, and progress for the current period', () => {
    const onProgress = vi.fn()
    render(<PlanExecutionPanel userId="u1" planId="plan-1" actions={[{ id: 'pray', title: 'Pray one honest sentence', cadence: 'daily', minimum: 'One sentence' }]} onProgress={onProgress} />)

    fireEvent.change(screen.getByLabelText(/执行安排|Practice schedule/), { target: { value: 'After breakfast at the desk' } })
    fireEvent.blur(screen.getByLabelText(/执行安排|Practice schedule/))
    fireEvent.click(screen.getByLabelText(/标记完成|Mark complete/))
    fireEvent.change(screen.getByLabelText(/执行反思|Practice reflection/), { target: { value: 'I began without waiting to feel ready.' } })
    fireEvent.blur(screen.getByLabelText(/执行反思|Practice reflection/))

    const record = listPlanExecutions(window.localStorage, 'u1', 'plan-1')[0]
    expect(record.status).toBe('completed')
    expect(record.evidence).toContain('breakfast')
    expect(record.reflection).toContain('began')
    expect(screen.getByText('1/1')).toBeTruthy()
    expect(onProgress).toHaveBeenCalled()
  })

  it('saves one editable review for the current week', () => {
    render(<PlanExecutionPanel userId="u1" planId="plan-2" actions={['One action']} />)
    fireEvent.change(screen.getByPlaceholderText(/哪些行动带来信、望、爱|Which actions nurtured faith/), { target: { value: 'Reduce the plan to one action.' } })
    fireEvent.click(screen.getByText(/保存本周复盘|Save this week’s review/))
    expect(listPlanReviews(window.localStorage, 'u1', 'plan-2')).toHaveLength(1)
  })
})
