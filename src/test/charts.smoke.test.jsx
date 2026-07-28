/* 图表原语库冒烟测试：每个图都要能渲染、都要有无障碍文本等价物。 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { setRuntimeLang } from '../i18n/runtime'
import autoEn from '../i18n/auto-en'
import { mergeAutoEn } from '../i18n/translations'
import {
  Radar, TrendLine, BarSeries, ColumnSeries, CalendarHeatmap, MatrixHeatmap,
  RingProgress, Meter, StatTile, ConcentricRings, Timeline, MilestoneTrack,
  GrowthTree, YearWheel, HorariumDial, DirectedGraph, DecisionTree, Sankey,
  seriesColor, sequentialColor, divergingColor, niceTicks, compactNumber,
  barPathVertical, barPathHorizontal, arcPath, polar, CATEGORICAL, localDateKey,
} from '../components/charts'

describe('chartTheme helpers', () => {
  it('分类色按固定顺序取用且不生成新色', () => {
    expect(seriesColor(0)).toBe(CATEGORICAL[0])
    expect(seriesColor(3)).toBe(CATEGORICAL[3])
    expect(CATEGORICAL).toContain(seriesColor(11))
  })

  it('顺序色单调映射，0 值退到画布', () => {
    expect(sequentialColor(0)).toMatch(/rgba/)
    expect(sequentialColor(1)).toMatch(/^#/)
  })

  it('发散色中点为中性灰，不是第三个色相', () => {
    expect(divergingColor(0)).toBe('#383835')
    expect(divergingColor(-1)).not.toBe(divergingColor(1))
  })

  it('轴刻度取整为干净数字', () => {
    expect(niceTicks(97, 4)[0]).toBe(0)
    expect(niceTicks(97, 4).at(-1)).toBeGreaterThanOrEqual(97)
  })

  it('紧凑数字格式', () => {
    expect(compactNumber(1284)).toBe('1,284')
    expect(compactNumber(12900)).toBe('12.9K')
    expect(compactNumber(4200000)).toBe('4.2M')
  })

  it('条形路径数据端圆角、基线端方角', () => {
    expect(barPathVertical(0, 10, 20, 40)).toContain('Q')
    expect(barPathHorizontal(0, 10, 40, 20)).toContain('Q')
  })

  it('极坐标 0° 指向正上方', () => {
    const [x, y] = polar(100, 100, 50, 0)
    expect(Math.round(x)).toBe(100)
    expect(Math.round(y)).toBe(50)
  })

  it('日期键使用本地时区，不会因 UTC 偏移错位一格', () => {
    // UTC+8 的 00:30，本地是当天，UTC 却是前一天。热力图必须按本地算。
    const d = new Date(2026, 6, 28, 0, 30)
    expect(localDateKey(d)).toBe('2026-07-28')
    expect(localDateKey('not a date')).toBe('')
  })

  it('扇环路径闭合', () => {
    expect(arcPath(50, 50, 20, 40, 0, 90).trim().endsWith('Z')).toBe(true)
  })
})

describe('图表渲染 + 无障碍', () => {
  // 图表内文案走 i18n；这里验证的是「有没有渲染出那句解释」，把语言钉死在 zh 才稳定。
  beforeEach(() => {
    mergeAutoEn(autoEn)
    setRuntimeLang('zh')
  })

  it('Radar 渲染并暴露 aria 概述', () => {
    render(<Radar title="德性" axes={[{ key: 'a', label: '爱' }, { key: 'b', label: '喜乐' }, { key: 'c', label: '和平' }]} series={[{ name: '本周', values: { a: 0.8, b: 0.4, c: 0.6 } }]} />)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('TrendLine 单系列不渲染图例框', () => {
    const { container } = render(<TrendLine title="情绪" labels={['一', '二', '三']} series={[{ name: '强度', values: [1, 3, 2] }]} />)
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelectorAll('ul').length).toBe(0)
  })

  it('TrendLine 多系列必有图例', () => {
    const { container } = render(<TrendLine labels={['一', '二']} series={[{ name: 'A', values: [1, 2] }, { name: 'B', values: [2, 1] }]} />)
    expect(container.querySelectorAll('ul').length).toBe(1)
  })

  it('BarSeries / ColumnSeries 渲染', () => {
    const { container: c1 } = render(<BarSeries title="恩赐" items={[{ label: '教导', value: 8 }, { label: '款待', value: 3 }]} />)
    expect(c1.querySelector('svg')).toBeTruthy()
    const { container: c2 } = render(<ColumnSeries title="每周" labels={['w1', 'w2']} values={[2, 5]} />)
    expect(c2.querySelector('svg')).toBeTruthy()
  })

  it('热力图渲染', () => {
    const { container: c1 } = render(<CalendarHeatmap title="读经" data={[{ date: '2026-07-01', value: 2 }]} weeks={6} />)
    expect(c1.querySelector('svg')).toBeTruthy()
    const { container: c2 } = render(<MatrixHeatmap title="时段" rows={['一', '二']} cols={['08', '09']} values={[[1, 2], [0, 3]]} />)
    expect(c2.querySelector('svg')).toBeTruthy()
  })

  it('RingProgress / Meter / StatTile 渲染', () => {
    render(<RingProgress value={40} max={100} label="日课" />)
    render(<Meter value={3} max={5} label="风险" severity="warning" />)
    render(<StatTile label="连续天数" value={12} delta={3} deltaPeriod="上周" spark={[1, 2, 3, 5]} />)
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
  })

  it('ConcentricRings 标出错序', () => {
    render(<ConcentricRings title="爱的次序" rings={[{ label: '神', actual: 0.1 }, { label: '家人', actual: 0.6 }]} />)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('Timeline / MilestoneTrack 渲染', () => {
    const { container } = render(<Timeline title="演变" events={[{ date: '2026-01-01', label: '起', value: 4 }, { date: '2026-02-01', label: '转', value: 2 }]} />)
    expect(container.querySelector('svg')).toBeTruthy()
    render(<MilestoneTrack title="旅程" stops={[{ label: '起点' }, { label: '窄门' }]} currentIndex={1} />)
  })

  it('GrowthTree 渲染九种果子', () => {
    const fruits = ['仁爱', '喜乐', '和平'].map((label, i) => ({ fruit: label, label, count: i * 2 }))
    const { container } = render(<GrowthTree title="果子树" fruits={fruits} />)
    expect(container.querySelectorAll('ellipse').length).toBeGreaterThan(0)
  })

  it('YearWheel / HorariumDial 渲染', () => {
    render(<YearWheel title="教会年历" seasons={[{ key: 'a', label: '将临', startDay: 0, endDay: 40 }, { key: 'b', label: '常年', startDay: 41, endDay: 364 }]} todayDay={50} />)
    render(<HorariumDial title="日课" hours={[{ key: 'l', label: '晨祷', hour: 6, done: true }, { key: 'v', label: '晚祷', hour: 20 }]} nowHour={9} />)
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
  })

  it('DirectedGraph 识别并标注回环', () => {
    const nodes = [
      { id: 't', label: '被冷落', kind: 'trigger' },
      { id: 'b', label: '我不值得', kind: 'belief' },
      { id: 'x', label: '暴食', kind: 'behavior' },
    ]
    const edges = [{ from: 't', to: 'b' }, { from: 'b', to: 'x' }, { from: 'x', to: 't', label: '强化' }]
    const { container } = render(<DirectedGraph title="链路" nodes={nodes} edges={edges} />)
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.textContent).toContain('虚线是回环')
  })

  it('DecisionTree 渲染分支', () => {
    const root = { label: '要不要换工作', children: [{ label: '换', tone: 'option', children: [{ label: '收入下降', tone: 'risk' }] }, { label: '不换', tone: 'option' }] }
    const { container } = render(<DecisionTree title="决策" root={root} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('Sankey 渲染流向', () => {
    const nodes = [{ id: 'a', label: '工作', layer: 0 }, { id: 'b', label: '手机', layer: 0 }, { id: 'c', label: '被牵引', layer: 1 }]
    const links = [{ from: 'a', to: 'c', value: 3 }, { from: 'b', to: 'c', value: 7 }]
    const { container } = render(<Sankey title="注意力去向" nodes={nodes} links={links} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('EN 模式下图表控制和无障碍摘要不残留中文', () => {
    setRuntimeLang('en')
    render(
      <Timeline
        title="Growth"
        events={[
          { date: '2026-07-01', label: 'Start', value: 2 },
          { date: '2026-07-28', label: 'Now', value: 6 },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Show data' })).toBeTruthy()
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'Growth: 2 points from 2026-07-01 to 2026-07-28; Intensity increased by 4',
    )
  })
})
