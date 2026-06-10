// 读经计划定义（内容在前端，进度在后端）
// kind: 'date' 用 MM-DD 取 mccheyne.json；'seq' 用顺序天 d001..
const psalms30 = [1, 23, 27, 34, 37, 42, 46, 51, 63, 73, 84, 90, 91, 100, 103,
  104, 116, 119, 121, 126, 130, 131, 133, 136, 139, 143, 145, 146, 147, 150]

export const PLANS = [
  {
    id: 'mccheyne', name: '麦琴读经', subtitle: '每天 4 处经文 · 一年通读全本圣经',
    kind: 'date', length: 365, color: '#34c759',
  },
  {
    id: 'john21', name: '约翰福音 · 21 天', subtitle: '每天一章 · 认识那位道成肉身的主',
    kind: 'seq', length: 21, color: '#5ac8fa',
    days: Array.from({ length: 21 }, (_, i) => ({ refs: [`约翰福音 ${i + 1}`] })),
  },
  {
    id: 'psalms30', name: '诗篇 · 30 天', subtitle: '每天一篇 · 与神倾心吐意',
    kind: 'seq', length: 30, color: '#a78bfa',
    days: psalms30.map(n => ({ refs: [`诗篇 ${n}`] })),
  },
  {
    id: 'gospel21', name: '福音根基 · 21天', subtitle: '为慕道友与初信者预备：约翰福音 → 罗马书 → 约翰一书',
    kind: 'seq', length: 21, color: '#ff9f0a',
    days: [
      { key: 'd1',  reading: '约翰福音 1',  theme: '道成肉身' },
      { key: 'd2',  reading: '约翰福音 3',  theme: '重生与神爱世人' },
      { key: 'd3',  reading: '约翰福音 5',  theme: '信子的人有永生' },
      { key: 'd4',  reading: '约翰福音 6',  theme: '生命的粮' },
      { key: 'd5',  reading: '约翰福音 10', theme: '好牧人' },
      { key: 'd6',  reading: '约翰福音 11', theme: '复活与生命' },
      { key: 'd7',  reading: '约翰福音 14', theme: '道路、真理、生命' },
      { key: 'd8',  reading: '约翰福音 15', theme: '葡萄树与枝子' },
      { key: 'd9',  reading: '约翰福音 17', theme: '主的祷告' },
      { key: 'd10', reading: '约翰福音 20', theme: '复活的盼望' },
      { key: 'd11', reading: '罗马书 1',   theme: '福音是神的大能' },
      { key: 'd12', reading: '罗马书 3',   theme: '因信称义' },
      { key: 'd13', reading: '罗马书 5',   theme: '与神和好' },
      { key: 'd14', reading: '罗马书 6',   theme: '向罪死、向神活' },
      { key: 'd15', reading: '罗马书 8',   theme: '不再定罪' },
      { key: 'd16', reading: '罗马书 12',  theme: '将身体献上' },
      { key: 'd17', reading: '约翰一书 1', theme: '与神相交' },
      { key: 'd18', reading: '约翰一书 2', theme: '遵守主道' },
      { key: 'd19', reading: '约翰一书 3', theme: '神的儿女' },
      { key: 'd20', reading: '约翰一书 4', theme: '神就是爱' },
      { key: 'd21', reading: '约翰一书 5', theme: '信心的确据' },
    ].map(d => ({ ...d, refs: [d.reading] })),
  },
]

// 顺序计划某一天的 day_key：优先用计划自带 key（如 gospel21 的 d1..d21），否则 d001..
export function planDayKey(plan, idx) {
  return plan?.days?.[idx]?.key || seqDayKey(idx)
}

export function planById(id) { return PLANS.find(p => p.id === id) }

// 今天的 MM-DD（Asia/Shanghai 近似：用本地，足够日常使用）
export function todayMMDD() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

// 顺序计划下一天 key（首个未完成）
export function seqDayKey(idx) { return 'd' + String(idx + 1).padStart(3, '0') }
