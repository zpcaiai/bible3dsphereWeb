// 读经计划定义（内容在前端，进度在后端）
// kind: 'date' 用 MM-DD 取 mccheyne.json；'seq' 用顺序天 d001..
const psalms30 = [1, 23, 27, 34, 37, 42, 46, 51, 63, 73, 84, 90, 91, 100, 103,
  104, 116, 119, 121, 126, 130, 131, 133, 136, 139, 143, 145, 146, 147, 150]

export const PLANS = [
  {
    id: 'mccheyne', name: '麦琴读经', subtitle: '每天 4 处经文 · 一年通读全本圣经',
    kind: 'date', length: 365, color: '#34c759', duration: '30–40 分钟',
    rhythm: '早晨读家庭两处，晚上读个人两处；也可以一次完成。',
    outcome: '一年建立整本圣经视野，并每天留下一句经文与一个顺服行动。',
    practice: {
      settle: '开启勿扰，安静 2 分钟，用一句短祷告求神赐受教的心。',
      reading: '读完后用 5–10 个字写下这段经文的中心。',
      observe: '四处经文中，哪一句最显明神是谁、神做了什么？',
      action: '根据这句话，写下今天要在什么时间、向谁、做哪一件具体的事。',
      prayer: '用选出的经文祷告 2 分钟，并在晚上回看行动是否落实。',
    },
  },
  {
    id: 'john21', name: '约翰福音 · 21 天', subtitle: '每天一章 · 认识那位道成肉身的主',
    kind: 'seq', length: 21, color: '#5ac8fa', duration: '20 分钟',
    rhythm: '连续 21 天，每天固定同一时段读一章。',
    outcome: '从耶稣的言语、行动与身份中，更具体地认识并回应基督。',
    practice: {
      settle: '先用 1 分钟安静，问自己：今天我愿意让耶稣纠正什么？',
      reading: '先通读一遍，再回看一遍，圈出耶稣的一个称呼、行动或应许。',
      observe: '这一章怎样回答“耶稣是谁”？我原先对祂有什么误解或忽略？',
      action: '把所认识的耶稣转成一个今天可验证的回应：相信、停止、开始或分享一件事。',
      prayer: '用“主耶稣，因为你是……，今天求你帮助我……”祷告 2 分钟。',
    },
    days: Array.from({ length: 21 }, (_, i) => ({ refs: [`约翰福音 ${i + 1}`] })),
  },
  {
    id: 'psalms30', name: '诗篇 · 30 天', subtitle: '每天一篇 · 与神倾心吐意',
    kind: 'seq', length: 30, color: '#a78bfa', duration: '15 分钟',
    rhythm: '每天睡前或情绪最明显时读一篇，连续 30 天。',
    outcome: '学习诚实命名情绪，把赞美、哀伤、惧怕与盼望带到神面前。',
    practice: {
      settle: '先停下来做三次缓慢呼吸，诚实说出此刻最明显的一种感受。',
      reading: '轻声读两遍：第一遍听诗人的情绪，第二遍圈出他怎样转向神。',
      observe: '诗人正在经历什么？他对神说了什么？我的处境与哪一句相遇？',
      action: '写下一项“顺服或安息”的小行动，并给它一个今天可完成的时间。',
      prayer: '把诗篇中最贴近你的一句改写成自己的 3–5 句祷告。',
    },
    days: psalms30.map(n => ({ refs: [`诗篇 ${n}`] })),
  },
  {
    id: 'gospel21', name: '福音根基 · 21天', subtitle: '为慕道友与初信者预备：约翰福音 → 罗马书 → 约翰一书',
    kind: 'seq', length: 21, color: '#ff9f0a', duration: '20–25 分钟',
    rhythm: '每天完成一课；每 7 天向一位可信同伴复述本周所认识的福音。',
    outcome: '能用自己的话说明福音核心，并在信靠、悔改与爱人上作出回应。',
    practice: {
      settle: '用 1 分钟向神诚实说明：我今天相信、怀疑或不明白的是什么？',
      reading: '读两遍，分别标出“神做了什么”和“人被邀请怎样回应”。',
      observe: '用一句话回答：这段经文带来了什么好消息？',
      action: '写下一个今天可观察的回应；每第 7 天再把本周福音要点讲给一位可信的人听。',
      prayer: '按“感谢—承认—求帮助”三句话回应今天的福音真理。',
    },
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

export function buildReadingPracticeSteps(plan, refs = []) {
  if (!plan?.practice) return []
  return [
    { id: 'settle', icon: '🕊️', label: '安静预备', detail: plan.practice.settle },
    ...refs.map((ref, index) => ({
      id: `read-${index}`,
      icon: '📖',
      label: '阅读 {ref}',
      params: { ref },
      detail: plan.practice.reading,
    })),
    { id: 'observe', icon: '🔍', label: '观察一件事', detail: plan.practice.observe },
    { id: 'action', icon: '🚶', label: '落实一个行动', detail: plan.practice.action },
    { id: 'pray', icon: '🙏', label: '祷告回应', detail: plan.practice.prayer },
  ]
}
