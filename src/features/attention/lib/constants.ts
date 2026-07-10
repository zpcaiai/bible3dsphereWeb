import { AttentionCategory, AttentionPull, AttentionState } from './types'
import { t as i18nT } from '../../../i18n/runtime'

export const AttentionCategoryLabel: Record<AttentionCategory, string> = {
  [AttentionCategory.WORSHIP]: i18nT('敬拜型注意力'),
  [AttentionCategory.MISSION]: i18nT('使命型注意力'),
  [AttentionCategory.RELATIONSHIP]: i18nT('关系型注意力'),
  [AttentionCategory.RESTORATION]: i18nT('恢复型注意力'),
  [AttentionCategory.CAPTURED]: i18nT('被掳型注意力'),
}

export const AttentionCategoryMeta = {
  [AttentionCategory.WORSHIP]: {
    label: i18nT('敬拜型注意力'),
    description: i18nT('将心重新归向神、真理与安静。'),
    examples: [i18nT('读经'), i18nT('祷告'), i18nT('默想'), i18nT('敬拜'), i18nT('灵修'), i18nT('属灵阅读')],
    spiritualHint: i18nT('你的心需要先被神安定。'),
  },
  [AttentionCategory.MISSION]: {
    label: i18nT('使命型注意力'),
    description: i18nT('将注意力投入神所托付的工作、学习、创造与服事。'),
    examples: [i18nT('深度工作'), i18nT('写作'), i18nT('编程'), i18nT('产品设计'), i18nT('研究'), i18nT('讲章准备'), i18nT('服事准备')],
    spiritualHint: i18nT('忠心完成今天被托付的一件事。'),
  },
  [AttentionCategory.RELATIONSHIP]: {
    label: i18nT('关系型注意力'),
    description: i18nT('把真实注意力给到真实的人。'),
    examples: [i18nT('陪伴家人'), i18nT('深度沟通'), i18nT('小组交通'), i18nT('门训'), i18nT('探访'), i18nT('代祷沟通')],
    spiritualHint: i18nT('爱不是抽象概念，也需要真实在场。'),
  },
  [AttentionCategory.RESTORATION]: {
    label: i18nT('恢复型注意力'),
    description: i18nT('承认自己是有限受造者，在安息中恢复。'),
    examples: [i18nT('睡眠'), i18nT('运动'), i18nT('散步'), i18nT('午休'), i18nT('整理环境'), i18nT('健康饮食')],
    spiritualHint: i18nT('你不是机器，安息也是信靠。'),
  },
  [AttentionCategory.CAPTURED]: {
    label: i18nT('被掳型注意力'),
    description: i18nT('注意力失去主权，被算法、焦虑、比较、情欲、消费主义或无目的信息牵引。'),
    examples: [i18nT('短视频'), i18nT('色情内容'), i18nT('无目的刷社交媒体'), i18nT('焦虑查股价'), i18nT('反复看 AI 新闻'), i18nT('冲动购物'), i18nT('网络争论'), i18nT('熬夜娱乐')],
    spiritualHint: i18nT('看见牵引，是重新得自由的开始。'),
  },
}

export const AttentionPullLabel: Record<AttentionPull, string> = {
  [AttentionPull.ANXIETY]: i18nT('焦虑'),
  [AttentionPull.COMPARISON]: i18nT('比较'),
  [AttentionPull.LUST]: i18nT('情欲'),
  [AttentionPull.GREED]: i18nT('贪婪'),
  [AttentionPull.BOREDOM]: i18nT('无聊'),
  [AttentionPull.ESCAPE]: i18nT('逃避'),
  [AttentionPull.CONTROL]: i18nT('控制欲'),
  [AttentionPull.FOMO]: i18nT('错失恐惧'),
  [AttentionPull.FATIGUE]: i18nT('疲惫'),
  [AttentionPull.ALGORITHM]: i18nT('算法牵引'),
  [AttentionPull.CONSUMERISM]: i18nT('消费主义'),
  [AttentionPull.PEOPLE_PLEASING]: i18nT('讨好人'),
  [AttentionPull.VANITY]: i18nT('虚荣'),
  [AttentionPull.CURIOSITY_WITHOUT_PURPOSE]: i18nT('无目的好奇'),
}

export const AttentionStateLabel: Record<AttentionState, string> = {
  [AttentionState.PEACEFUL]: i18nT('平安'),
  [AttentionState.FOCUSED]: i18nT('专注'),
  [AttentionState.SCATTERED]: i18nT('分散'),
  [AttentionState.RESTLESS]: i18nT('躁动'),
  [AttentionState.TEMPTED]: i18nT('受试探'),
  [AttentionState.NUMB]: i18nT('麻木'),
  [AttentionState.REPENTING]: i18nT('悔改中'),
  [AttentionState.RESTORED]: i18nT('恢复中'),
}

export const AttentionStatusLabel = {
  not_started: i18nT('尚未开始'),
  covenant_done: i18nT('已立约'),
  focused: i18nT('专注中'),
  scattered: i18nT('分散中'),
  review_needed: i18nT('待复盘'),
  completed: i18nT('已完成'),
} as const

export const ATTENTION_REMINDERS = [
  i18nT('注意力被什么占领，心就慢慢被什么塑造。'),
  i18nT('先把心归给主，再进入今天的任务。'),
  i18nT('你不需要回应每一个刺激，只需要忠心回应今天的托付。'),
  i18nT('信息可以被使用，但不能成为主人。'),
  i18nT('安静不是浪费时间，安静是在重新整理心的方向。'),
  i18nT('今天不追逐所有声音，只聆听真正重要的呼召。'),
  i18nT('不是每一次分心都需要自责，但每一次觉察都可以成为归回。'),
  i18nT('真正的自由，不是想看什么就看什么，而是不被任何事辖制。'),
  i18nT('把最好的注意力献给最重要的事。'),
  i18nT('在算法认识你之前，神已经认识你。'),
]

export const SCRIPTURE_OPTIONS = [
  [i18nT('箴言 4:23'), i18nT('你要保守你心，胜过保守一切，因为一生的果效是由心发出。')],
  [i18nT('诗篇 46:10'), i18nT('你们要休息，要知道我是神。')],
  [i18nT('马太福音 6:21'), i18nT('因为你的财宝在哪里，你的心也在那里。')],
  [i18nT('罗马书 12:2'), i18nT('不要效法这个世界，只要心意更新而变化。')],
  [i18nT('歌罗西书 3:2'), i18nT('你们要思念上面的事，不要思念地上的事。')],
  [i18nT('哥林多前书 6:12'), i18nT('凡事我都可行，但无论哪一件，我总不受它的辖制。')],
  [i18nT('以弗所书 5:15-16'), i18nT('你们要谨慎行事，不要像愚昧人，当像智慧人，要爱惜光阴。')],
] as const

export const DEFAULT_ATTENTION_PRAYER = i18nT('主啊，今天我愿意把最宝贵的注意力献给你。\n\n求你帮助我不被焦虑、比较、算法和欲望牵引，\n也不让我的心被无目的的信息消耗。\n\n求你帮助我忠心完成今天你所托付的事，\n在敬拜、使命、关系和安息中重新归向你。\n\n当我想要逃避、分心或被试探时，\n求你提醒我回到你面前。\n\n奉主耶稣基督的名祷告，阿们。')

export const FOCUS_TYPE_META = {
  mission: { label: i18nT('使命专注'), prayer: i18nT('主啊，求你帮助我忠心完成眼前托付的一件事。') },
  worship: { label: i18nT('敬拜专注'), prayer: i18nT('主啊，求你安静我的心，使我先归向你。') },
  relationship: { label: i18nT('关系专注'), prayer: i18nT('主啊，帮助我把真实注意力给到真实的人。') },
  restoration: { label: i18nT('恢复专注'), prayer: i18nT('主啊，教我在有限中安息，并重新得力。') },
} as const

export const ATTENTION_DURATION_OPTIONS = [15, 25, 30, 45, 60, 90] as const

export const ATTENTION_ENTRY_QUICK_ACTIVITIES = {
  worship: [i18nT('读经祷告'), i18nT('默想经文'), i18nT('安静等候')],
  mission: [i18nT('深度工作'), i18nT('写作'), i18nT('编程'), i18nT('研究')],
  relationship: [i18nT('陪伴家人'), i18nT('深度沟通'), i18nT('代祷交通')],
  restoration: [i18nT('散步'), i18nT('午休'), i18nT('运动'), i18nT('整理环境')],
  captured: [i18nT('反复看 AI 资讯'), i18nT('刷短视频'), i18nT('焦虑查消息'), i18nT('社交媒体比较'), i18nT('冲动购物')],
} as const

export const REVIEW_PRAYER_TEMPLATE = i18nT('主啊，感谢你今天在恩典中扶持我。求你帮助我诚实看见被牵引的地方，也温柔带我重新归回。')

export const SCRIPTURE_LIBRARY = [
  { id: 'proverbs_4_23', reference: i18nT('箴言 4:23'), text: i18nT('你要保守你心，胜过保守一切，因为一生的果效是由心发出。'), tags: ['heart', 'attention', 'vigilance', 'default'] },
  { id: 'psalm_46_10', reference: i18nT('诗篇 46:10'), text: i18nT('你们要休息，要知道我是神。'), tags: ['anxiety', 'control', 'fomo', 'rest'] },
  { id: 'matthew_6_21', reference: i18nT('马太福音 6:21'), text: i18nT('因为你的财宝在哪里，你的心也在那里。'), tags: ['greed', 'consumerism', 'treasure', 'desire'] },
  { id: 'romans_12_2', reference: i18nT('罗马书 12:2'), text: i18nT('不要效法这个世界，只要心意更新而变化。'), tags: ['algorithm', 'worldliness', 'renewal', 'identity'] },
  { id: 'colossians_3_2', reference: i18nT('歌罗西书 3:2'), text: i18nT('你们要思念上面的事，不要思念地上的事。'), tags: ['attention', 'desire', 'renewal'] },
  { id: 'first_corinthians_6_12', reference: i18nT('哥林多前书 6:12'), text: i18nT('凡事我都可行，但无论哪一件，我总不受它的辖制。'), tags: ['lust', 'addiction', 'compulsive', 'freedom', 'captured'] },
  { id: 'ephesians_5_15_16', reference: i18nT('以弗所书 5:15-16'), text: i18nT('你们要谨慎行事，不要像愚昧人，当像智慧人，要爱惜光阴。'), tags: ['time', 'stewardship', 'mission'] },
  { id: 'philippians_4_6_7', reference: i18nT('腓立比书 4:6-7'), text: i18nT('应当一无挂虑，只要凡事借着祷告、祈求和感谢，将你们所要的告诉神。'), tags: ['anxiety', 'prayer', 'peace'] },
  { id: 'matthew_11_28', reference: i18nT('马太福音 11:28'), text: i18nT('凡劳苦担重担的人，可以到我这里来，我就使你们得安息。'), tags: ['fatigue', 'rest', 'restoration'] },
  { id: 'galatians_1_10', reference: i18nT('加拉太书 1:10'), text: i18nT('我现在是要得人的心呢？还是要得神的心呢？'), tags: ['people_pleasing', 'comparison', 'identity'] },
] as const

export const WarfareIntensityLabel = {
  none: i18nT('暂无明显记录'),
  low: i18nT('轻微出现'),
  medium: i18nT('需要留意'),
  high: i18nT('近期较明显'),
} as const

export const CHECKIN_STATUS_LABELS = {
  not_seen: i18nT('今天没有明显出现'),
  noticed: i18nT('我看见了牵引'),
  resisted: i18nT('我抵挡住了'),
  escaped: i18nT('我及时逃离了'),
  captured: i18nT('我被牵引了一段时间'),
  returned: i18nT('我被牵引后重新归回'),
} as const
