import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveJourneyRoute } from '../map/journeyRouting'
import { curvedPath } from '../map/arc'

describe('resolveJourneyRoute（陆路前端贝塞尔弧线 / 海路后端航线）', () => {
  beforeEach(() => {
    // 后端不可达：海路应逐段回退为前端贝塞尔弧线，绝不退化为直线
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('网络不可用'))))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('不足两个有效站点时返回 null', async () => {
    expect(await resolveJourneyRoute([])).toBeNull()
    expect(await resolveJourneyRoute([[35, 31]])).toBeNull()
    expect(await resolveJourneyRoute(null)).toBeNull()
  })

  it('陆路（sea=false）纯前端 curvedPath 贝塞尔弧线，绝不发起网络请求', async () => {
    const stations = [[46.10, 30.96], [39.03, 36.86], [35.28, 32.21]]
    const route = await resolveJourneyRoute(stations)
    expect(route).toEqual(curvedPath(stations))
    expect(route.length).toBeGreaterThan(stations.length) // 弧线加密了采样点
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('海路（sea=true）先尝试后端真实航线，后端不可用时回退贝塞尔弧线', async () => {
    const stations = [[35.20, 31.70], [33.00, 34.90], [28.20, 36.40]]
    const route = await resolveJourneyRoute(stations, { sea: true })
    expect(globalThis.fetch).toHaveBeenCalled() // 海路确实走了后端
    expect(route).toEqual(curvedPath(stations)) // 后端失败 → 弧线兜底
  })

  it('过滤无效坐标后再生成弧线', async () => {
    const route = await resolveJourneyRoute([[35, 31], [NaN, 2], [39, 37]])
    expect(route).toEqual(curvedPath([[35, 31], [39, 37]]))
  })
})
