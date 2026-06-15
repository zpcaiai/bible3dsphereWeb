// journeyRouting.js — 旅程站点 → 前端贝塞尔弧线（不再请求后端 /api/route）。
// 全站行程路线统一用二次贝塞尔弧线（curvedPath）在前端生成：离线可用、零网络
// 依赖、即时返回。多站点逐段拼接成一条平滑弧线，海陆一视同仁。
// 保留 resolveJourneyRoute 的 Promise 签名（含 sea 参数，现已忽略），
// 这样 BibleMapPage 等调用方无需改动。
import { curvedPath } from './arc'
import { isValidCoord } from './routePlayback'

/**
 * 解析整条旅程为前端贝塞尔弧线。
 * @param {Array<[lng,lat]>} stationCoords 站点坐标（顺序即行程顺序）
 * @param {{sea?: boolean}} _opts 兼容旧签名；现全部走贝塞尔弧线，sea 已无差别
 * @returns {Promise<Array<[lng,lat]>|null>} 拼接后的弧线路径（不足两点返回 null）
 */
export function resolveJourneyRoute(stationCoords, _opts = {}) {
  const pts = (stationCoords || []).filter(isValidCoord)
  if (pts.length < 2) return Promise.resolve(null)
  const coords = curvedPath(pts)
  return Promise.resolve(Array.isArray(coords) && coords.length >= 2 ? coords : null)
}
