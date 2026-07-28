import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { submitSurveyMock } = vi.hoisted(() => ({
  submitSurveyMock: vi.fn(),
}))

vi.mock('../api', () => ({
  submitAnonymousDatingPriority: submitSurveyMock,
}))

import DatingPriorityPage from '../DatingPriorityPage'
import { getDatingPriorityItems, getDatingVetoItems } from '../datingPriorityData'

const CURRENT_STATS = {
  total: 8,
  priority_stats: [{
    category: '人品与关系品质',
    label: '诚实守信',
    avg_rank: 1.25,
    avg_score: 32.5,
    selection_count: 6,
    selection_rate: 75,
  }],
  veto_stats: [{
    label: '家暴、推搡、威胁、砸东西或严重控制行为',
    strength: '极高',
    supplied_rank: 1,
    selection_count: 8,
    selection_rate: 100,
  }],
}

describe('DatingPriorityPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.scrollTo = vi.fn()
    submitSurveyMock.mockReset()
    submitSurveyMock.mockResolvedValue({ ok: true, anonymous: true, stats: CURRENT_STATS })
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps every supplied factor in the corresponding perspective', () => {
    expect(getDatingPriorityItems('female_to_male')).toHaveLength(60)
    expect(getDatingPriorityItems('male_to_female')).toHaveLength(64)
    expect(getDatingVetoItems('female_to_male')).toHaveLength(12)
    expect(getDatingVetoItems('male_to_female')).toHaveLength(12)
  })

  it('ranks selections by click order and reflows ranks after deselection', () => {
    render(<DatingPriorityPage />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))

    const honesty = screen.getByRole('button', { name: /诚实守信/ })
    const loyalty = screen.getByRole('button', { name: /忠诚与专一/ })
    const responsibility = screen.getByRole('button', { name: /^责任感/ })

    fireEvent.click(loyalty)
    fireEvent.click(honesty)
    fireEvent.click(responsibility)

    expect(loyalty.textContent).toContain('#1')
    expect(honesty.textContent).toContain('#2')
    expect(responsibility.textContent).toContain('#3')

    fireEvent.click(honesty)

    expect(loyalty.textContent).toContain('#1')
    expect(responsibility.textContent).toContain('#2')
    expect(honesty.textContent).not.toContain('#')
  })

  it('caps selection at ten while allowing all items to be cleared', () => {
    render(<DatingPriorityPage />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))

    const options = screen.getAllByTestId('priority-option')
    options.slice(0, 11).forEach((option) => fireEvent.click(option))

    expect(screen.getByText('已选 10 / 10')).toBeTruthy()
    expect(screen.getByText('最多选择 10 项。如需更换，请先反选一项。')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: '全部反选' })[0])
    expect(screen.getByText('已选 0 / 10')).toBeTruthy()
    expect(screen.getByText('尚未选择。0 项也是有效答案，你可以直接提交。')).toBeTruthy()
  })

  it('accepts a zero-selection anonymous submission and shows current stats', async () => {
    const onSubmit = vi.fn()
    render(<DatingPriorityPage onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择女性伴侣/ }))
    fireEvent.click(screen.getByRole('button', { name: /出轨、长期暧昧、欺骗或严重违反忠诚边界/ }))
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: '问卷已完成' })).toBeTruthy())
    expect(screen.getByText(/没有选择优先因素/)).toBeTruthy()
    expect(screen.getByText(/同时选择了 1 项否决条件/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: '当前统计结果' })).toBeTruthy()
    expect(screen.getByText('8', { selector: '.dp-stats-heading > strong' })).toBeTruthy()
    expect(screen.getByText(/75% 选择/)).toBeTruthy()
    expect(screen.queryByText('极高')).toBeNull()
    expect(screen.queryByText(/强度/)).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0].selected).toEqual([])
    expect(onSubmit.mock.calls[0][0].vetoes).toEqual([
      {
        suppliedRank: 1,
        label: '出轨、长期暧昧、欺骗或严重违反忠诚边界',
        strength: '极高',
      },
    ])
    expect(JSON.parse(window.localStorage.getItem('dating-priority-survey:last')).selected).toEqual([])
    expect(submitSurveyMock).toHaveBeenCalledTimes(1)
    expect(submitSurveyMock.mock.calls[0][0]).toMatch(/^survey-/)
    expect(submitSurveyMock.mock.calls[0][1]).not.toHaveProperty('visitor_id')
  })

  it('shows veto ranks without strength labels while allowing independent multi-select', () => {
    render(<DatingPriorityPage />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))

    const vetoes = screen.getAllByTestId('veto-option')
    expect(vetoes).toHaveLength(12)
    expect(vetoes[0].textContent).toContain('1')
    expect(vetoes[0].textContent).not.toContain('极高')
    expect(vetoes[11].textContent).toContain('12')
    expect(vetoes[11].textContent).not.toContain('因人而异')

    fireEvent.click(vetoes[0])
    fireEvent.click(vetoes[11])
    expect(screen.getByText('已选 2 / 12')).toBeTruthy()

    fireEvent.click(vetoes[0])
    expect(screen.getByText('已选 1 / 12')).toBeTruthy()
  })

  it('prepares a valid 100-point allocation and submits ranked results', async () => {
    const onSubmit = vi.fn()
    render(<DatingPriorityPage onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))
    fireEvent.click(screen.getByRole('button', { name: /诚实守信/ }))
    fireEvent.click(screen.getByRole('button', { name: /忠诚与专一/ }))
    fireEvent.click(screen.getByRole('button', { name: /^责任感/ }))
    fireEvent.click(screen.getByRole('button', { name: /下一步：为 3 项分配 100 分/ }))

    expect(screen.getByText('100', { selector: '.dp-score-meter strong' })).toBeTruthy()
    const scoreRows = screen.getAllByRole('listitem')
    expect(within(scoreRows[0]).getByRole('spinbutton').value).toBe('34')
    expect(within(scoreRows[1]).getByRole('spinbutton').value).toBe('33')
    expect(within(scoreRows[2]).getByRole('spinbutton').value).toBe('33')

    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: '问卷已完成' })).toBeTruthy())
    expect(onSubmit.mock.calls[0][0].totalScore).toBe(100)
    expect(onSubmit.mock.calls[0][0].selected.map((item) => item.label)).toEqual([
      '诚实守信',
      '忠诚与专一',
      '责任感',
    ])
  })

  it('keeps the answer editable when anonymous submission fails', async () => {
    submitSurveyMock.mockRejectedValueOnce(new Error('网络暂时不可用'))
    render(<DatingPriorityPage />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('网络暂时不可用'))
    expect(screen.queryByRole('heading', { name: '问卷已完成' })).toBeNull()
    expect(screen.getByRole('button', { name: '匿名提交并查看统计' })).toBeTruthy()
  })
})
