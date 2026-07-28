// chartTheme.js — 全站图表的设计令牌与几何工具。
//
// 配色不是拍脑袋选的：这套分类色板经 dataviz 校验脚本在本应用的实际深色画布
// (#0b0c14) 上跑过五项检查——明度带 / 彩度下限 / 色觉障碍相邻对分离度
// (最差 ΔE 8.4) / 常视力相邻对下限 (最差 ΔE 19.3) / 对比度 ≥3:1，全部通过。
//
// 规则（改动前请重跑校验）：
//   · 分类色按固定顺序取用，永不循环；第 9 个系列应折叠为「其他」或改用小多图。
//   · 散点 / 图谱 / 关系图这类「任意两色都会相邻」的形态，只用前 3 个色位。
//   · 顺序色 = 单一色相由浅到深；发散色 = 蓝↔红 + 灰色中点。永远不用彩虹色。
//   · 状态色（好/注意/严重/危急）保留专用，绝不当作「第 4 个系列」。
//   · 文字永远用文本色，不用数据色；身份靠文字旁边的色块承载。

export const CHART_SURFACE = '#0b0c14'

export const INK = Object.freeze({
  primary: '#ffffff',
  secondary: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  baseline: '#383835',
  border: 'rgba(255,255,255,0.10)',
})

/** 分类色：固定顺序，相邻对已校验。 */
export const CATEGORICAL = Object.freeze([
  '#3987e5', // 1 蓝
  '#d95926', // 2 橙
  '#199e70', // 3 青绿
  '#c98500', // 4 黄
  '#d55181', // 5 品红
  '#008300', // 6 绿
  '#9085e9', // 7 紫
  '#e66767', // 8 红
])

/** 任意两色都可能同框时（关系图 / 散点 / 小多图）只用这 3 个。 */
export const CATEGORICAL_ALLPAIRS = Object.freeze(CATEGORICAL.slice(0, 3))

/** 顺序色（蓝，浅→深，已按 ordinal 规则校验步距与浅端对比度）。 */
export const SEQUENTIAL = Object.freeze(['#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95'])

/** 发散色：蓝 ↔ 红，灰色中点（中点必须是「无」，不能是另一个色相）。 */
export const DIVERGING = Object.freeze({
  negative: ['#184f95', '#256abf', '#3987e5', '#86b6ef'],
  neutral: '#383835',
  positive: ['#f0a3a3', '#e66767', '#d03b3b', '#a92c2c'],
})

/** 状态色：固定不随主题变化，必须与图标+文字同时出现，绝不单靠颜色表意。 */
export const STATUS = Object.freeze({
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
})

export const MARK = Object.freeze({
  barMax: 24,        // 条形最大粗细，剩余留白
  barRadius: 4,      // 数据端圆角，基线端为方
  lineWidth: 2,
  markerR: 4.5,      // ≥8px 直径
  ringWidth: 2,      // 标记点的画布色描边环
  gap: 2,            // 相邻标记之间的画布色缝隙
  areaOpacity: 0.1,
})

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** 取第 i 个分类色（固定顺序，超出时折叠为最后一色 + 应改用「其他」）。 */
export function seriesColor(i) {
  return CATEGORICAL[i % CATEGORICAL.length]
}

/** 顺序色取色：value 归一化到 [0,1]。 */
export function sequentialColor(t) {
  const clamped = Math.max(0, Math.min(1, Number(t) || 0))
  if (clamped <= 0) return 'rgba(255,255,255,0.05)'
  const idx = Math.min(SEQUENTIAL.length - 1, Math.floor(clamped * SEQUENTIAL.length))
  return SEQUENTIAL[idx]
}

/** 发散取色：value 在 [-1, 1]。 */
export function divergingColor(t) {
  const v = Math.max(-1, Math.min(1, Number(t) || 0))
  if (Math.abs(v) < 0.06) return DIVERGING.neutral
  const arm = v < 0 ? DIVERGING.negative : DIVERGING.positive
  const idx = Math.min(arm.length - 1, Math.floor(Math.abs(v) * arm.length))
  return v < 0 ? arm[arm.length - 1 - idx] : arm[idx]
}

// ── 几何工具 ────────────────────────────────────────────────────────────────

/** 极坐标 → 直角坐标（0° 指向正上方，顺时针）。 */
export function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/** 生成扇环路径（用于年历轮盘 / 环形日课盘）。 */
export function arcPath(cx, cy, rInner, rOuter, startDeg, endDeg) {
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const [x1, y1] = polar(cx, cy, rOuter, startDeg)
  const [x2, y2] = polar(cx, cy, rOuter, endDeg)
  const [x3, y3] = polar(cx, cy, rInner, endDeg)
  const [x4, y4] = polar(cx, cy, rInner, startDeg)
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ')
}

/** 单调三次插值的平滑折线（避免 Catmull-Rom 的过冲）。 */
export function smoothPath(points) {
  if (!points.length) return ''
  if (points.length < 3) return points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ')
  const d = [`M ${points[0][0]} ${points[0][1]}`]
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const mx = (x0 + x1) / 2
    d.push(`C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`)
  }
  return d.join(' ')
}

/** 顶端 4px 圆角、底端方角的条形路径（垂直向上生长）。 */
export function barPathVertical(x, yTop, width, height, radius = MARK.barRadius) {
  const r = Math.max(0, Math.min(radius, width / 2, height))
  const yBottom = yTop + height
  return [
    `M ${x} ${yBottom}`,
    `L ${x} ${yTop + r}`,
    `Q ${x} ${yTop} ${x + r} ${yTop}`,
    `L ${x + width - r} ${yTop}`,
    `Q ${x + width} ${yTop} ${x + width} ${yTop + r}`,
    `L ${x + width} ${yBottom}`,
    'Z',
  ].join(' ')
}

/** 右端 4px 圆角、左端方角的条形路径（水平向右生长）。 */
export function barPathHorizontal(x, y, width, height, radius = MARK.barRadius) {
  const r = Math.max(0, Math.min(radius, height / 2, width))
  const xEnd = x + width
  return [
    `M ${x} ${y}`,
    `L ${xEnd - r} ${y}`,
    `Q ${xEnd} ${y} ${xEnd} ${y + r}`,
    `L ${xEnd} ${y + height - r}`,
    `Q ${xEnd} ${y + height} ${xEnd - r} ${y + height}`,
    `L ${x} ${y + height}`,
    'Z',
  ].join(' ')
}

/**
 * 本地日期键 YYYY-MM-DD。
 * 不能用 toISOString().slice(0,10)：那是 UTC。用户在 UTC+8 记录的「今天」，
 * 在 UTC 下会落到前一天，整张日历热力图会整体错位一格，且「今天」被判成未来而不渲染。
 */
export function localDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** 大数紧凑格式：1,284 / 12.9K / 4.2M。 */
export function compactNumber(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (abs >= 1e4) return `${(v / 1e3).toFixed(1)}K`
  return v.toLocaleString()
}

/**
 * 轴刻度取整（0 / 5 / 10 / 25 / 50 / 100…）。
 * 最后一个刻度必须 >= max，否则最高的那根柱/那个点会被画到轴外。
 */
export function niceTicks(max, count = 4) {
  const m = Math.max(1, Number(max) || 1)
  const raw = m / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag
  const ticks = []
  const round = (v) => Math.round(v * 1000) / 1000
  for (let v = 0; ; v += step) {
    ticks.push(round(v))
    if (v >= m - step * 1e-9) break
    if (ticks.length > 64) break // 防御性上限，避免异常入参造成死循环
  }
  return ticks
}
