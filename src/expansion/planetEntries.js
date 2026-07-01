// planetEntries.js — 属灵星球「大陆入口」延迟接线注册表（content-theology-expansion 批次）
//
// ⚠️ 不修改并行进程正在改动的 PlanetHome.jsx。此文件+文档提供「即插式」补丁：
//    等他们那批前端合并后，按 docs/EXPANSION_PLANETHOME_WIRING.md 加 3 行即可生效。
//
// 机制：新 chip 的 target 用 'exp:<featureKey>' 前缀；PlanetHome 的 act() 认出该前缀，
//       调用 window.__expansionOpen(featureKey)（由 ExpansionLauncher 暴露），绕过既有 go()。

// 用户指定的三个大陆入口（哀歌 / 联合 / 知足）
export const EXPANSION_CHIPS = {
  '回到福音': [['与基督联合', 'exp:union']],
  '认识自己': [['基督徒知足', 'exp:contentment']],
  '等候上帝': [['哀歌 · 向神倾诉', 'exp:lament']],
}

// 可选：其余不重叠模块（默认不挂，避免与并行进程客户端引擎重复/界面拥挤）
export const EXPANSION_CHIPS_OPTIONAL = {
  '认识自己': [['情感真伪辨', 'exp:affections'], ['失序之爱 · 重排', 'exp:ordo']],
  '回到福音': [['温柔谦卑', 'exp:tender'], ['华人本土灵修', 'exp:chinese']],
  '与神同行': [
    ['认识神 · 属性默想', 'exp:knowgod'],
    ['心意更新 · 全人塑造', 'exp:renovation'],
    ['以神为乐', 'exp:delight'],
    ['文化礼仪 → 反礼仪', 'exp:liturgy'],
    ['情感健康属灵', 'exp:eh'],
    ['推荐书目 · 圣诗', 'exp:resources'],
  ],
}


// 扩充第二辑（13 个新引擎）的大陆入口；同样默认仅在 includeOptional 时挂载。
export const EXPANSION_CHIPS_BATCH2 = {
  '健康教会九标志': [['团契生活', 'exp:fellowship'], ['爱邻舍 · 公义款待', 'exp:neighbor']],
  '认识自己': [['感恩 · 数算恩典', 'exp:eucharisteo'], ['智慧 · 敬畏神地活', 'exp:wisdom']],
  '回到福音': [['得救的确据', 'exp:assurance'], ['道成肉身 · 与神性情有份', 'exp:incarnation'], ['敬畏神 · 欢喜而战兢', 'exp:feargod']],
  '与神同行': [['安息节奏 · 铲除匆忙', 'exp:ruleoflife'], ['祷告经典 · 祷告的学校', 'exp:prayerschool'], ['默观 · 在神爱里安息', 'exp:contemplation']],
  '等候上帝': [['复活盼望', 'exp:hope']],
  '人格塑造': [['成圣 · 治死与穿上', 'exp:holiness'], ['饶恕与和好', 'exp:forgiveness']],
}

function _merge(a, b) {
  const out = {}
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = [...(a[k] || []), ...(b[k] || [])]
  return out
}

// 把扩充 chips 追加到匹配 name 的大陆上，返回新数组（不改原对象）。
export function withExpansionChips(continents, opts = {}) {
  // 默认挂载：用户指定的三个入口（联合/知足/哀歌）+ 第二辑 13 个新引擎
  let map = _merge(EXPANSION_CHIPS, EXPANSION_CHIPS_BATCH2)
  if (opts.includeOptional) map = _merge(map, EXPANSION_CHIPS_OPTIONAL)
  return (continents || []).map((c) => (map[c.name] ? { ...c, chips: [...c.chips, ...map[c.name]] } : c))
}

// 在 PlanetHome 的 act() 里最先调用；命中 'exp:' 前缀则深链打开扩充面板并返回 true。
export function handleExpansionTarget(target) {
  if (typeof target === 'string' && target.startsWith('exp:')) {
    if (typeof window !== 'undefined' && typeof window.__expansionOpen === 'function') {
      window.__expansionOpen(target.slice(4))
    }
    return true
  }
  return false
}
