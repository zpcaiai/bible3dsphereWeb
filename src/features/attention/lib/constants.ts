import { AttentionCategory, AttentionPull, AttentionState } from './types'

export const AttentionCategoryLabel: Record<AttentionCategory, string> = {
  [AttentionCategory.WORSHIP]: '敬拜型注意力',
  [AttentionCategory.MISSION]: '使命型注意力',
  [AttentionCategory.RELATIONSHIP]: '关系型注意力',
  [AttentionCategory.RESTORATION]: '恢复型注意力',
  [AttentionCategory.CAPTURED]: '被掳型注意力',
}

export const AttentionCategoryMeta = {
  [AttentionCategory.WORSHIP]: {
    label: '敬拜型注意力',
    description: '将心重新归向神、真理与安静。',
    examples: ['读经', '祷告', '默想', '敬拜', '灵修', '属灵阅读'],
    spiritualHint: '你的心需要先被神安定。',
  },
  [AttentionCategory.MISSION]: {
    label: '使命型注意力',
    description: '将注意力投入神所托付的工作、学习、创造与服事。',
    examples: ['深度工作', '写作', '编程', '产品设计', '研究', '讲章准备', '服事准备'],
    spiritualHint: '忠心完成今天被托付的一件事。',
  },
  [AttentionCategory.RELATIONSHIP]: {
    label: '关系型注意力',
    description: '把真实注意力给到真实的人。',
    examples: ['陪伴家人', '深度沟通', '小组交通', '门训', '探访', '代祷沟通'],
    spiritualHint: '爱不是抽象概念，也需要真实在场。',
  },
  [AttentionCategory.RESTORATION]: {
    label: '恢复型注意力',
    description: '承认自己是有限受造者，在安息中恢复。',
    examples: ['睡眠', '运动', '散步', '午休', '整理环境', '健康饮食'],
    spiritualHint: '你不是机器，安息也是信靠。',
  },
  [AttentionCategory.CAPTURED]: {
    label: '被掳型注意力',
    description: '注意力失去主权，被算法、焦虑、比较、情欲、消费主义或无目的信息牵引。',
    examples: ['短视频', '色情内容', '无目的刷社交媒体', '焦虑查股价', '反复看 AI 新闻', '冲动购物', '网络争论', '熬夜娱乐'],
    spiritualHint: '看见牵引，是重新得自由的开始。',
  },
}

export const AttentionPullLabel: Record<AttentionPull, string> = {
  [AttentionPull.ANXIETY]: '焦虑',
  [AttentionPull.COMPARISON]: '比较',
  [AttentionPull.LUST]: '情欲',
  [AttentionPull.GREED]: '贪婪',
  [AttentionPull.BOREDOM]: '无聊',
  [AttentionPull.ESCAPE]: '逃避',
  [AttentionPull.CONTROL]: '控制欲',
  [AttentionPull.FOMO]: '错失恐惧',
  [AttentionPull.FATIGUE]: '疲惫',
  [AttentionPull.ALGORITHM]: '算法牵引',
  [AttentionPull.CONSUMERISM]: '消费主义',
  [AttentionPull.PEOPLE_PLEASING]: '讨好人',
  [AttentionPull.VANITY]: '虚荣',
  [AttentionPull.CURIOSITY_WITHOUT_PURPOSE]: '无目的好奇',
}

export const AttentionStateLabel: Record<AttentionState, string> = {
  [AttentionState.PEACEFUL]: '平安',
  [AttentionState.FOCUSED]: '专注',
  [AttentionState.SCATTERED]: '分散',
  [AttentionState.RESTLESS]: '躁动',
  [AttentionState.TEMPTED]: '受试探',
  [AttentionState.NUMB]: '麻木',
  [AttentionState.REPENTING]: '悔改中',
  [AttentionState.RESTORED]: '恢复中',
}

export const AttentionStatusLabel = {
  not_started: '尚未开始',
  covenant_done: '已立约',
  focused: '专注中',
  scattered: '分散中',
  review_needed: '待复盘',
  completed: '已完成',
} as const

export const ATTENTION_REMINDERS = [
  '注意力被什么占领，心就慢慢被什么塑造。',
  '先把心归给主，再进入今天的任务。',
  '你不需要回应每一个刺激，只需要忠心回应今天的托付。',
  '信息可以被使用，但不能成为主人。',
  '安静不是浪费时间，安静是在重新整理心的方向。',
  '今天不追逐所有声音，只聆听真正重要的呼召。',
  '不是每一次分心都需要自责，但每一次觉察都可以成为归回。',
  '真正的自由，不是想看什么就看什么，而是不被任何事辖制。',
  '把最好的注意力献给最重要的事。',
  '在算法认识你之前，神已经认识你。',
]

export const SCRIPTURE_OPTIONS = [
  ['箴言 4:23', '你要保守你心，胜过保守一切，因为一生的果效是由心发出。'],
  ['诗篇 46:10', '你们要休息，要知道我是神。'],
  ['马太福音 6:21', '因为你的财宝在哪里，你的心也在那里。'],
  ['罗马书 12:2', '不要效法这个世界，只要心意更新而变化。'],
  ['歌罗西书 3:2', '你们要思念上面的事，不要思念地上的事。'],
  ['哥林多前书 6:12', '凡事我都可行，但无论哪一件，我总不受它的辖制。'],
  ['以弗所书 5:15-16', '你们要谨慎行事，不要像愚昧人，当像智慧人，要爱惜光阴。'],
] as const

export const DEFAULT_ATTENTION_PRAYER = `主啊，今天我愿意把最宝贵的注意力献给你。

求你帮助我不被焦虑、比较、算法和欲望牵引，
也不让我的心被无目的的信息消耗。

求你帮助我忠心完成今天你所托付的事，
在敬拜、使命、关系和安息中重新归向你。

当我想要逃避、分心或被试探时，
求你提醒我回到你面前。

奉主耶稣基督的名祷告，阿们。`

export const FOCUS_TYPE_META = {
  mission: { label: '使命专注', prayer: '主啊，求你帮助我忠心完成眼前托付的一件事。' },
  worship: { label: '敬拜专注', prayer: '主啊，求你安静我的心，使我先归向你。' },
  relationship: { label: '关系专注', prayer: '主啊，帮助我把真实注意力给到真实的人。' },
  restoration: { label: '恢复专注', prayer: '主啊，教我在有限中安息，并重新得力。' },
} as const

export const ATTENTION_DURATION_OPTIONS = [15, 25, 30, 45, 60, 90] as const

export const ATTENTION_ENTRY_QUICK_ACTIVITIES = {
  worship: ['读经祷告', '默想经文', '安静等候'],
  mission: ['深度工作', '写作', '编程', '研究'],
  relationship: ['陪伴家人', '深度沟通', '代祷交通'],
  restoration: ['散步', '午休', '运动', '整理环境'],
  captured: ['反复看 AI 资讯', '刷短视频', '焦虑查消息', '社交媒体比较', '冲动购物'],
} as const

export const REVIEW_PRAYER_TEMPLATE = '主啊，感谢你今天在恩典中扶持我。求你帮助我诚实看见被牵引的地方，也温柔带我重新归回。'

export const SCRIPTURE_LIBRARY = [
  { id: 'proverbs_4_23', reference: '箴言 4:23', text: '你要保守你心，胜过保守一切，因为一生的果效是由心发出。', tags: ['heart', 'attention', 'vigilance', 'default'] },
  { id: 'psalm_46_10', reference: '诗篇 46:10', text: '你们要休息，要知道我是神。', tags: ['anxiety', 'control', 'fomo', 'rest'] },
  { id: 'matthew_6_21', reference: '马太福音 6:21', text: '因为你的财宝在哪里，你的心也在那里。', tags: ['greed', 'consumerism', 'treasure', 'desire'] },
  { id: 'romans_12_2', reference: '罗马书 12:2', text: '不要效法这个世界，只要心意更新而变化。', tags: ['algorithm', 'worldliness', 'renewal', 'identity'] },
  { id: 'colossians_3_2', reference: '歌罗西书 3:2', text: '你们要思念上面的事，不要思念地上的事。', tags: ['attention', 'desire', 'renewal'] },
  { id: 'first_corinthians_6_12', reference: '哥林多前书 6:12', text: '凡事我都可行，但无论哪一件，我总不受它的辖制。', tags: ['lust', 'addiction', 'compulsive', 'freedom', 'captured'] },
  { id: 'ephesians_5_15_16', reference: '以弗所书 5:15-16', text: '你们要谨慎行事，不要像愚昧人，当像智慧人，要爱惜光阴。', tags: ['time', 'stewardship', 'mission'] },
  { id: 'philippians_4_6_7', reference: '腓立比书 4:6-7', text: '应当一无挂虑，只要凡事借着祷告、祈求和感谢，将你们所要的告诉神。', tags: ['anxiety', 'prayer', 'peace'] },
  { id: 'matthew_11_28', reference: '马太福音 11:28', text: '凡劳苦担重担的人，可以到我这里来，我就使你们得安息。', tags: ['fatigue', 'rest', 'restoration'] },
  { id: 'galatians_1_10', reference: '加拉太书 1:10', text: '我现在是要得人的心呢？还是要得神的心呢？', tags: ['people_pleasing', 'comparison', 'identity'] },
] as const

export const WarfareIntensityLabel = {
  none: '暂无明显记录',
  low: '轻微出现',
  medium: '需要留意',
  high: '近期较明显',
} as const

export const CHECKIN_STATUS_LABELS = {
  not_seen: '今天没有明显出现',
  noticed: '我看见了牵引',
  resisted: '我抵挡住了',
  escaped: '我及时逃离了',
  captured: '我被牵引了一段时间',
  returned: '我被牵引后重新归回',
} as const
