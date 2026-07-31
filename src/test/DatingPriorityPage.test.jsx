import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { submitSurveyMock } = vi.hoisted(() => ({
  submitSurveyMock: vi.fn(),
}))

vi.mock('../api', () => ({
  submitAnonymousDatingPriority: submitSurveyMock,
}))

import DatingPriorityPage, { rankWeightedPoints } from '../DatingPriorityPage'
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

  it('places no cap on how many factors can be selected', () => {
    render(<DatingPriorityPage />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))

    const options = screen.getAllByTestId('priority-option')
    expect(options.length).toBeGreaterThan(10)
    options.forEach((option) => fireEvent.click(option))

    // 全选也不该被拦下，也不该冒出「最多选择 10 项」这类提示
    expect(screen.getByText(`已选 ${options.length} 项`)).toBeTruthy()
    expect(screen.queryByText(/最多选择/)).toBeNull()
    expect(options.every((option) => option.getAttribute('aria-pressed') === 'true')).toBe(true)

    fireEvent.click(screen.getAllByRole('button', { name: '全部反选' })[0])
    expect(screen.getByText('已选 0 项')).toBeTruthy()
    expect(screen.getByText('尚未选择。0 项也是有效答案，你可以直接提交。')).toBeTruthy()
  })

  it('submits a full-length selection without tripping the backend 100-point contract', async () => {
    const onSubmit = vi.fn()
    render(<DatingPriorityPage onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))

    const options = screen.getAllByTestId('priority-option')
    options.forEach((option) => fireEvent.click(option))
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: '问卷已完成' })).toBeTruthy())
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.selected).toHaveLength(options.length)
    expect(submitted.totalScore).toBe(100)
    expect(submitted.selected.map((item) => item.rank))
      .toEqual(options.map((_, index) => index + 1))
    expect(screen.getByRole('heading', { name: '我的本次选择' })).toBeTruthy()
    expect(screen.getAllByTestId('submitted-priority')).toHaveLength(options.length)
    // 后端 score 字段是 ge=0，但勾选了却显示「权重 0」是坏体验
    expect(submitted.selected.every((item) => item.score >= 1)).toBe(true)
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
    expect(screen.getByRole('heading', { name: '我的本次选择' })).toBeTruthy()
    expect(screen.getByText('未选择优先因素')).toBeTruthy()
    expect(screen.getAllByTestId('submitted-veto')).toHaveLength(1)
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

  it('counts every newly completed survey as a new anonymous submission', async () => {
    const submittedIds = []
    window.localStorage.setItem('dating-priority-survey:anonymous-id', 'survey-legacy-browser-id')
    submitSurveyMock.mockImplementation(async (submissionId) => {
      submittedIds.push(submissionId)
      return {
        ok: true,
        anonymous: true,
        stats: { ...CURRENT_STATS, total: submittedIds.length },
      }
    })

    render(<DatingPriorityPage />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByText('1', { selector: '.dp-stats-heading > strong' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '返回上一页' }))
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByText('2', { selector: '.dp-stats-heading > strong' })).toBeTruthy())
    expect(submittedIds).toHaveLength(2)
    expect(new Set(submittedIds).size).toBe(2)
    expect(submittedIds.every((id) => /^survey-/.test(id))).toBe(true)
    expect(window.localStorage.getItem('dating-priority-survey:anonymous-id')).toBeNull()
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

  it('submits straight from the selection stage without a separate scoring step', async () => {
    const onSubmit = vi.fn()
    render(<DatingPriorityPage onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))
    fireEvent.click(screen.getByRole('button', { name: /诚实守信/ }))
    fireEvent.click(screen.getByRole('button', { name: /忠诚与专一/ }))
    fireEvent.click(screen.getByRole('button', { name: /^责任感/ }))

    // 选完就能直接提交：不应该再出现「下一步：分配 100 分」这一跳
    expect(screen.queryByText(/分配 100 分/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: '问卷已完成' })).toBeTruthy())
    expect(screen.queryByRole('spinbutton')).toBeNull()
    expect(screen.queryByRole('slider')).toBeNull()

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.totalScore).toBe(100)
    expect(submitted.selected.map((item) => item.label)).toEqual([
      '诚实守信',
      '忠诚与专一',
      '责任感',
    ])
    // 权重由点选顺序推导，第 1 位最重
    expect(submitted.selected.map((item) => item.score)).toEqual([50, 33, 17])
  })

  it('never lets the derived weights drift off 100, at any selection size', () => {
    for (let size = 1; size <= 100; size += 1) {
      const ids = Array.from({ length: size }, (_, index) => `item-${index}`)
      const points = rankWeightedPoints(ids)
      const values = ids.map((id) => points[id])

      expect(values.reduce((sum, value) => sum + value, 0)).toBe(100)
      expect(values.every((value) => Number.isInteger(value) && value > 0)).toBe(true)
      // 排名靠前的权重不得低于排名靠后的
      values.forEach((value, index) => {
        if (index > 0) expect(values[index - 1]).toBeGreaterThanOrEqual(value)
      })
    }
    expect(rankWeightedPoints([])).toEqual({})
  })

  it('shows every stat the backend returns instead of truncating to a top-N preview', async () => {
    // 之前的实现只展示 slice(0, 10)/(0, 12)，一旦选项数超过 10 项，
    // 大部分累计结果就被悄悄砍掉了。这里用 20 个优先项 + 12 个否决项模拟
    // 全站累计投票，验证页面把后端返回的每一条都渲染出来。
    const manyPriorityStats = Array.from({ length: 20 }, (_, index) => ({
      category: '人品与关系品质',
      label: `因素-${index + 1}`,
      avg_rank: index + 1,
      avg_score: 5,
      selection_count: 20 - index,
      selection_rate: 20 - index,
    }))
    const manyVetoStats = Array.from({ length: 12 }, (_, index) => ({
      label: `否决-${index + 1}`,
      strength: '高',
      supplied_rank: index + 1,
      selection_count: 12 - index,
      selection_rate: 12 - index,
    }))
    submitSurveyMock.mockResolvedValue({
      ok: true,
      anonymous: true,
      stats: { total: 30, priority_stats: manyPriorityStats, veto_stats: manyVetoStats },
    })

    render(<DatingPriorityPage />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))
    fireEvent.click(screen.getByRole('button', { name: /诚实守信/ }))
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: '问卷已完成' })).toBeTruthy())
    expect(screen.getByText('因素-20')).toBeTruthy()
    expect(screen.getByText('否决-12')).toBeTruthy()
  })

  it('ends on the stats with no restart or return buttons', async () => {
    render(<DatingPriorityPage onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /我在选择男性伴侣/ }))
    fireEvent.click(screen.getByRole('button', { name: /诚实守信/ }))
    fireEvent.click(screen.getByRole('button', { name: '匿名提交并查看统计' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: '问卷已完成' })).toBeTruthy())
    expect(screen.queryByRole('button', { name: '重新填写' })).toBeNull()
    expect(screen.queryByRole('button', { name: '完成并返回' })).toBeNull()
    // 统计仍然要在，否则这一页就没有内容了
    expect(screen.getByRole('heading', { name: '当前统计结果' })).toBeTruthy()
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
