// ExpansionHub.jsx — 内容与神学扩充 · 聚合面板（content-theology-expansion 批次）
// 只覆盖与并行进程「不重叠」的 8 个模块 + 推荐书目/圣诗；调用自包含 expansionApi。
import React, { useEffect, useState } from 'react'
import { getRuntimeLang, t as i18nT } from '../i18n/runtime'
import TranslatableParagraph from '../TranslatableParagraph'
import BackButton from '../BackButton'
import { getMeta, runAction, getBooks, getHymns } from './expansionApi'
import './expansionI18n'

const ACCENT = '#da77f2'
const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 }
const quote = { background: 'linear-gradient(135deg, rgba(218,119,242,0.10), rgba(90,200,250,0.06))', border: '1px solid rgba(218,119,242,0.25)', borderRadius: 12, padding: 14, marginBottom: 12 }

const FEATURES = [
  { key: 'lament', prefix: 'lament', action: 'compose', emoji: '🕯️', name: '哀歌 · 向神倾诉', sub: 'Vroegop 四步哀歌', kind: 'text', field: 'text', options: ['我失去了亲人，很哀伤', '我为一件事祷告很久却没有回应', '我生了重病，很痛苦', '我觉得神很沉默，离我很远'], placeholder: '把你的痛苦向神说出来，例如「我失去了亲人，觉得神很沉默，也不知道还要等多久」' },
  { key: 'knowgod', prefix: 'knowgod', action: 'meditate', emoji: '✨', name: '认识神', sub: '属性默想 · 巴刻/陶恕/里夫斯', kind: 'knowgod' },
  { key: 'union', prefix: 'union', action: 'assess', emoji: '🕊️', name: '与基督联合', sub: '在基督里我是谁 · 身份', kind: 'text', field: 'struggle', options: ['我觉得自己一无是处', '没有人真的在乎我', '我总觉得自己是个失败者', '我被定罪，觉得自己很糟'], placeholder: '写下此刻困扰你的身份谎言，例如「我觉得自己一无是处」' },
  { key: 'delight', prefix: 'delight', action: 'reframe', emoji: '🔥', name: '以神为乐', sub: '基督徒享乐主义 · 派博', kind: 'text', field: 'duty', options: ['读经像例行公事', '祷告变成一种负担', '聚会像打卡，没有喜乐', '服事让我很累、提不起劲'], placeholder: '哪个操练/责任让你觉得像苦差？例如「读经像例行公事」' },
  { key: 'contentment', prefix: 'contentment', action: 'analyze', emoji: '🍃', name: '基督徒知足', sub: '知足的秘诀 · 伯罗斯', kind: 'text', field: 'lack', options: ['总觉得钱不够', '还在单身，很孤单', '工作/前途不顺', '身体不好，很软弱'], placeholder: '你此刻的缺乏/不满是什么？例如「总觉得钱不够」' },
  { key: 'tender', prefix: 'tender', action: 'comfort', emoji: '🫶', name: '温柔谦卑', sub: '基督的慈心 · Ortlund', kind: 'text', field: 'text', options: ['我又搞砸了，觉得神很失望', '我太软弱了，配不上神', '我离神太远了，祂不会要我', '我一直在同一个罪里跌倒'], placeholder: '把你的羞愧或自责说出来，例如「我又搞砸了，觉得神很失望」' },
  { key: 'liturgy', prefix: 'liturgy', action: 'analyze', emoji: '📿', name: '文化礼仪→反礼仪', sub: '你的爱被习惯塑造 · J.K.A.Smith', kind: 'text', field: 'habit', options: ['总忍不住刷手机比较', '下班就瘫着追剧', '被绩效和成功绑架', '买东西停不下来'], placeholder: '一个反复的日常习惯，例如「总忍不住刷手机比较」' },
  { key: 'affections', prefix: 'affections', action: 'assess', emoji: '❤️', name: '情感真伪辨', sub: '宗教情感 · 爱德华兹', kind: 'ratings', metaKey: 'true_signs' },
  { key: 'eh', prefix: 'eh', action: 'assess', emoji: '🧭', name: '情感健康属灵', sub: '情商与灵命 · Scazzero', kind: 'ratings', metaKey: 'dimensions' },
  { key: 'ordo', prefix: 'ordo', action: 'analyze', emoji: '⚖️', name: '失序之爱 · 重排', sub: '爱的次序 · 奥古斯丁', kind: 'list', field: 'loves', placeholder: '列出你心里所爱/所看重的（每行一个，或用逗号分隔），例如：工作、家人、被认可、手机' },
  { key: 'spirits', prefix: 'spirits', action: 'discern', emoji: '🌗', name: '诸灵分辨', sub: '安慰/枯竭 · 依纳爵', kind: 'text', field: 'text', options: ['这几天读经祷告都很枯干', '心里莫名低落、提不起劲', '对未来很焦虑不安', '感到平安、想更靠近神'], placeholder: '描述你此刻的内在状态，例如「这几天读经祷告都很枯干，提不起劲」' },
  { key: 'renovation', prefix: 'renovation', action: 'assess', emoji: '🌱', name: '心意更新', sub: '全人塑造 VIM · 魏乐德', kind: 'ratings', metaKey: 'dimensions' },
  { key: 'chinese', prefix: 'chinese', action: 'meditate', emoji: '🏮', name: '华人本土灵修', sub: '倪柝声/王明道/唐崇荣', kind: 'text', field: 'need', options: ['我为信仰受了很多苦，快撑不住了', '想追求更深、更真实的属灵生命', '在苦难中如何忠心跟随主', '如何治死己、与主同死同活'], placeholder: '说出你此刻的处境或需要，例如「我为信仰受了很多苦，快撑不住了」' },
  { key: 'assurance', prefix: 'assurance', action: 'analyze', emoji: '🛡️', name: '得救的确据', sub: '全备的基督 · 傅格森', kind: 'text', field: 'text', options: ['我又犯了同样的罪，怀疑自己没得救', '我感受不到神，怕自己不是真信', '我这样的人不配，神不会接纳我', '我灵修服事做得不够'], placeholder: '写下动摇你确据的处境，例如「我又犯了同样的罪，怀疑自己没得救」' },
  { key: 'forgiveness', prefix: 'forgiveness', action: 'analyze', emoji: '🕊️', name: '饶恕与和好', sub: 'REACH · 沃弗/Worthington', kind: 'text', field: 'text', options: ['我被最信任的人背叛了', '我被亏待、很不公平', '被家人伤得很深', '我知道该饶恕，却放不下'], placeholder: '说出你受的伤，例如「我被最信任的人背叛了，放不下」' },
  { key: 'fellowship', prefix: 'fellowship', action: 'analyze', emoji: '🤝', name: '团契生活', sub: '基督里的团契 · 潘霍华', kind: 'text', field: 'text', options: ['我对教会很失望，大家都很表面', '我总是退缩、不想进群体', '和弟兄姊妹起了冲突', '在群体里戴着面具、不敢真实'], placeholder: '你在团契/教会里的挣扎，例如「我对教会很失望，大家都很表面」' },
  { key: 'ruleoflife', prefix: 'rule-of-life', action: 'analyze', emoji: '🌿', name: '安息节奏', sub: '铲除匆忙 · Comer/Barton/毕德生', kind: 'text', field: 'text', options: ['太忙了，一点小事就发火', '停不下来，一闲就焦虑', '没时间祷告读经', '长期疲惫、快撑不住'], placeholder: '描述你的步调，例如「最近特别忙，一点小事就发火，没时间祷告」' },
  { key: 'feargod', prefix: 'fear-of-god', action: 'analyze', emoji: '⚡', name: '敬畏神', sub: '欢喜而战兢 · 里夫斯', kind: 'text', field: 'text', options: ['我总觉得神随时要惩罚我', '把神看得太随便、失去敬畏', '怕自己不够好、达不到标准', '想更深地敬畏神、找回惊叹'], placeholder: '你与神关系的状态，例如「我总觉得神随时要惩罚我」' },
  { key: 'eucharisteo', prefix: 'eucharisteo', action: 'analyze', emoji: '🙏', name: '感恩 · 数算恩典', sub: 'eucharisteo · 沃斯甘', kind: 'text', field: 'text', options: ['最近很平淡麻木', '总觉得别人更好、心里不满', '正在难处里，想学会感恩', '心里有感恩，想数点恩典'], placeholder: '你此刻的心境，例如「最近很平淡麻木，感受不到什么」' },
  { key: 'holiness', prefix: 'holiness', action: 'analyze', emoji: '🔥', name: '成圣与圣洁', sub: '治死与穿上 · 莱尔/马歇尔', kind: 'text', field: 'text', options: ['我想胜过易怒和苦毒', '情欲/私密的挣扎', '骄傲、爱比较', '懒散、属灵懈怠'], placeholder: '你想胜过的罪或想长进处，例如「我想胜过我的坏脾气和苦毒」' },
  { key: 'neighbor', prefix: 'neighbor-love', action: 'analyze', emoji: '🫂', name: '爱邻舍 · 公义款待', sub: '慷慨的正义 · 凯勒', kind: 'text', field: 'text', options: ['我总怕麻烦、不想伸手', '对别人的需要越来越冷漠', '只顾自己往上爬', '只爱同类，对异己冷淡'], placeholder: '你在回避的一个人或需要，例如「我总怕麻烦，不想伸手帮人」' },
  { key: 'hope', prefix: 'hope', action: 'analyze', emoji: '🌅', name: '复活盼望', sub: '意料之外的盼望 · 赖特', kind: 'text', field: 'text', options: ['我失去了至亲，很想念', '很怕死亡、怕失去', '觉得人生没意义、很空', '等太久了，盼望快熄了'], placeholder: '你的哀伤/惧怕/虚空，例如「我失去了至亲，很想念」' },
  { key: 'prayerschool', prefix: 'prayer-school', action: 'analyze', emoji: '🕯️', name: '祷告经典', sub: '祷告的学校 · 慕安得烈/Bounds', kind: 'text', field: 'text', options: ['我不会祷告，不知道说什么', '祷告很干、像对着空气', '求了很久却没有回应', '太忙、挤不出时间祷告'], placeholder: '你祷告的卡点，例如「我不会祷告，也不知道说什么」' },
  { key: 'contemplation', prefix: 'contemplation', action: 'analyze', emoji: '🌫️', name: '默观 · 在神爱里安息', sub: '朱利安/大德兰/未知之云', kind: 'text', field: 'text', options: ['我很焦虑，一直担心未来', '想太多、停不下来', '觉得离神很远', '心里静不下来、很躁'], placeholder: '你心里的躁动，例如「我很焦虑，一直担心未来」' },
  { key: 'incarnation', prefix: 'incarnation', action: 'analyze', emoji: '🌟', name: '道成肉身', sub: '与神性情有份 · 亚他那修', kind: 'text', field: 'text', options: ['觉得没人懂我的软弱', '厌恶身体和现实、只想属灵', '觉得自己改变不了', '想更深认识在基督里的身份'], placeholder: '你的处境，例如「觉得没人懂我的软弱，神也不懂」' },
  { key: 'wisdom', prefix: 'wisdom', action: 'analyze', emoji: '🦉', name: '智慧 · 敬畏神地活', sub: '箴言/传道书/雅各', kind: 'text', field: 'text', options: ['总管不住嘴、说错话', '拖延、做事没恒心', '一笔花钱/消费拿不定主意', '交友、受人影响的选择'], placeholder: '需要智慧的处境，例如「我总管不住嘴，冲动说错话」' },
  { key: 'holyspirit', prefix: 'holy-spirit', action: 'analyze', emoji: '🕊️', name: '圣灵 · 与圣灵同行', sub: '字里行间的圣灵 · 巴刻/Fee', kind: 'text', field: 'text', options: ['想改变却总是无力', '不确定自己是不是神的', '干枯无力、感觉不到神', '想被圣灵带领、与祂同行'], placeholder: '说出你的处境，例如「我想改变却总是无力，靠自己撑不住」' },
  { key: 'adoption', prefix: 'adoption', action: 'analyze', emoji: '🤗', name: '儿子的名分 · 天父收纳', sub: '福音最高特权 · 巴刻/傅格森', kind: 'text', field: 'text', options: ['觉得孤立无援，像个孤儿', '总在靠表现赚神的爱', '觉得神很遥远、不敢亲近', '父亲的伤让我难信靠天父'], placeholder: '例如「我总觉得什么都得靠自己，像个孤儿」' },
  { key: 'cross', prefix: 'cross', action: 'analyze', emoji: '✝️', name: '十字架默想', sub: '当代基督十架 · 斯托得', kind: 'text', field: 'text', options: ['罪咎压着我、觉得该被罚', '觉得神在生我的气', '被罪捆住、出不来', '觉得和神疏远、关系破裂'], placeholder: '例如「我一直有很深的罪咎，觉得该被罚」' },
  { key: 'fearofman', prefix: 'fear-of-man', action: 'analyze', emoji: '👥', name: '怕人 → 敬畏神', sub: '认可偶像 · Ed Welch', kind: 'text', field: 'text', options: ['我总讨好别人、不会拒绝', '被批评就崩、太在意评价', '怕被拒绝、被排挤', '怕别人眼光、不敢表明信仰'], placeholder: '例如「我特别在意别人评价，被批评就崩」' },
  { key: 'providence', prefix: 'providence', action: 'analyze', emoji: '🌤️', name: '神的护理 · 信靠主权的手', sub: '护理的奥秘 · 傅拉维/Bridges', kind: 'text', field: 'text', options: ['觉得一切都失控了', '想不通为什么会这样', '觉得神待我不公', '担心未来会更糟'], placeholder: '例如「最近一切都失控了，乱成一团」' },
  { key: 'repentance', prefix: 'repentance', action: 'analyze', emoji: '🔄', name: '悔改的解剖', sub: '悔改的教义 · 华森', kind: 'text', field: 'text', options: ['我只是懊恼后果、怕被发现', '一直自责却没有改变', '想真正地悔改', '陷在自我定罪里'], placeholder: '例如「我一直自责却没有改变，走不出来」' },
  { key: 'doubt', prefix: 'doubt', action: 'analyze', emoji: '❓', name: '与怀疑同行', sub: '信心危机 · 牧养向', kind: 'text', field: 'text', options: ['有很多理性上的疑问', '被苦难/人伤了，对神起疑', '属灵枯竭、感觉不到神', '只是想在怀疑里被陪伴'], placeholder: '例如「我最近信不动了，有很多疑问」' },
  { key: 'generosity', prefix: 'generosity', action: 'analyze', emoji: '💝', name: '慷慨 · 管家 · 财宝在天', sub: 'The Treasure Principle · Alcorn', kind: 'text', field: 'text', options: ['钱抓得很紧、总怕不够', '把钱当成自己的', '想更有意义地用钱', '想脱离金钱的辖制、学慷慨'], placeholder: '例如「我钱抓得很紧，总怕不够，很不安」' },
  { key: 'humility', prefix: 'humility', action: 'analyze', emoji: '🙇', name: '谦卑', sub: 'Humility · 慕安得烈', kind: 'text', field: 'text', options: ['我很骄傲、爱表现', '老是贬低自己、觉得很差', '总在跟人比较', '想学像基督那样谦卑服事'], placeholder: '例如「我很骄傲，总想被看见、爱表现」' },
  { key: 'worddelight', prefix: 'word-delight', action: 'analyze', emoji: '🍯', name: '爱慕神的话 · 诗篇119', sub: '把「该读经」变成爱慕', kind: 'text', field: 'text', options: ['读经像例行任务，没味道', '读了不知道有什么用、跟生活接不上', '因为读得少而愧疚', '想更爱慕神的话'], placeholder: '例如「读经对我像例行任务，没味道」' },
  { key: 'anger', prefix: 'anger', action: 'analyze', emoji: '😤', name: '忿怒 · 在神面前处理愤怒', sub: 'Good and Angry · Powlison', kind: 'text', field: 'text', options: ['我一点就炸、事后后悔', '闷着的怒、记恨放不下', '我在对神生气', '为不义/邪恶而愤怒'], placeholder: '例如「我一点就炸，事后很后悔」' },
  { key: 'loneliness', prefix: 'loneliness', action: 'analyze', emoji: '🌑', name: '孤单 · 被看不见的痛', sub: '看顾人的神 El Roi · 夏甲', kind: 'text', field: 'text', options: ['没人懂我、觉得不被看见', '身边没有人、举目无亲', '人群里更孤单', '失去后的孤单'], placeholder: '例如「没人懂我，觉得不被看见」' },
  { key: 'perfectionism', prefix: 'perfectionism', action: 'analyze', emoji: '🎯', name: '完美主义 · 内在批判者→恩典', sub: '把批判者换成基督的声音', kind: 'text', field: 'text', options: ['做什么都觉得不够好', '怕失败、不敢开始', '对自己极苛刻', '无法放松、必须掌控一切'], placeholder: '例如「我做什么都觉得不够好」' },
  { key: 'envy', prefix: 'envy', action: 'analyze', emoji: '😔', name: '嫉妒 / 羡慕', sub: '拿到光下 · 与喜乐者同乐', kind: 'text', field: 'text', options: ['见不得别人成功', '刷到别人就自惭', '被比下去、别人被选中', '不满神的分配'], placeholder: '例如「见不得别人成功，很眼红」' },
  { key: 'burnout', prefix: 'burnout', action: 'analyze', emoji: '🪫', name: '耗竭 · 服事倦怠', sub: '以利亚 · 先被喂养再喂养', kind: 'text', field: 'text', options: ['我烧干了、什么都给不出', '麻木愤世、对以前热爱的事无感', '照顾别人到自己空了', '想逃、想放弃服事'], placeholder: '例如「我烧干了，什么都给不出」' },
  { key: 'comfort', prefix: 'comfort', action: 'analyze', emoji: '💐', name: '安慰的服事 · 与哀哭者同哭', sub: '负伤的治疗者 · 卢云', kind: 'text', field: 'text', options: ['不知道说什么、怕说错话', '忍不住想给建议、想解决', '陪伴丧亲的人', '陪伴到自己也很累'], placeholder: '例如「朋友丧亲了，我不知道说什么」' },
  { key: 'prodigal', prefix: 'prodigal', action: 'analyze', emoji: '🏡', name: '为浪子 / 未信至亲祷告', sub: '莫妮加 · 恒切代求', kind: 'text', field: 'text', options: ['为远离神的孩子揪心', '为未信的配偶祷告', '为年迈未信的父母祷告', '祷告很久却看不到改变'], placeholder: '例如「为远离神的孩子揪心」' },
  { key: 'acedia', prefix: 'acedia', action: 'analyze', emoji: '🥱', name: '属灵麻木 · 正午的魔鬼', sub: 'acedia · 沙漠教父', kind: 'text', field: 'text', options: ['什么都不想做、提不起劲', '对祷告读经都冷淡', '坐立不安又懒散', '分不清是懒散还是抑郁'], placeholder: '例如「什么都不想做，提不起劲」' },
  { key: 'conscience', prefix: 'conscience', action: 'analyze', emoji: '🧭', name: '良心', sub: 'Conscience · Naselli', kind: 'text', field: 'text', options: ['为没禁止的事一直定罪自己', '对某些罪越来越无所谓', '带着未处理的罪、良心控告', '为可不可以做某事与人有分歧'], placeholder: '例如「为圣经没禁止的事一直定罪自己」' },
  { key: 'secondcoming', prefix: 'second-coming', action: 'analyze', emoji: '⏳', name: '主再来 · 儆醒地活', sub: '十童女/才干/绵羊山羊', kind: 'text', field: 'text', options: ['在受苦中盼望主再来的安慰', '属灵懈怠、活得像主不回来', '想忠心运用神所托付的', '想让盼望落到爱人服事上'], placeholder: '例如「我属灵懈怠，活得像主不回来」' },
  { key: 'chronic', prefix: 'chronic-suffering', action: 'analyze', emoji: '🩹', name: '慢性 / 长期受苦', sub: '与刺同行 · Risner/Tada', kind: 'text', field: 'text', options: ['看不到尽头、日复一日太久', '求了很多次医治却没有挪去', '没有人真正理解、孤单地扛', '长期照顾病人、很疲惫'], placeholder: '例如「慢性病看不到尽头，日复一日」' },
  { key: 'parenting', prefix: 'parenting', action: 'analyze', emoji: '👨‍👩‍👧', name: '教养儿女 · 家庭门训', sub: 'Parenting · Paul Tripp', kind: 'text', field: 'text', options: ['管孩子越管越僵、靠吼靠罚', '想在日常里带孩子认识神', '怕自己做得不好', '为孩子的偏差/未来揪心'], placeholder: '例如「管孩子越管越僵，总靠吼」' },
  { key: 'aging', prefix: 'aging', action: 'analyze', emoji: '🌾', name: '年老 · 善始善终', sub: '仍要结果子 · 巴刻', kind: 'text', field: 'text', options: ['觉得老了没用了、不被需要', '体力衰退带来的失落', '想善用余年、留下属灵传承', '面对死亡渐近的思虑'], placeholder: '例如「觉得老了没用了，不被需要」' },
  { key: 'resources', emoji: '📚', name: '推荐书目 · 圣诗', sub: '按大陆精选 · 可收藏', kind: 'resources' },
]

const LABELS = {
  summary: '小结', reflection: '回应', truth: '真理', scripture: '经文', verse: '经文', practice: '操练',
  practices: '操练', prayer: '完整祷文', meditation: '默想', note: '说明', assurance: '确据', encouragement: '鼓励',
  reassurance: '宽心的话', invitation: '邀请', invitations: '成长邀请', growth_step: '成长一步', growth_steps: '成长的一步',
  vision: '它在训练你渴望', counter_liturgy: '反礼仪', first_step: '第一步', lesson: '功课', anchor: '锚点',
  misplaced: '错置的期待', logic: '为什么这是喜乐之路', fight_for_joy: '为喜乐而争战', strong: '较扎根的',
  deepen: '可求神加深', attribute: '属性', lie: '谎言', key_question: '关键分辨', closing: '', message: '', prayer_scaffold: '祷告脚手架',
  root: '根', deficit: '福音欠缺', deepen_dirs: '可加深的方向', weak: '成长的邀请',
  movements: '四步哀歌', draft: '可照着祷告', guidance: '', verb: '', themes: '主题', name: '',
  // —— 扩充第二辑字段标签 ——
  diagnosis: '看见', gospel_truth: '福音真理', grounds_line: '确据的根基', lean_note: '偏向', way_forward: '出路', way_outward: '向外的一步', teaching: '经典的话', hope: '盼望', principle: '原则', wise_step: '智慧的一步', from_above_test: '从上头来的智慧 · 检验', contemplative_practice: '默观操练', valley_prayer: '清教徒祷文', doctrine_note: '温柔的教义提示', prescription: '开的药', rule_hint: '生活规则', gospel_order_note: '福音次序', pair_line: '治死 · 穿上', spirit_note: '倚靠圣灵', concrete_step: '落到一个人一个动作', gospel_root: '福音的根', distinction: '分辨', mediator_reminder: '回到根基', balance_note: '平衡', voice_note: '经典的话', invite: '邀请', abuse_note: '安全优先', crisis_note: '',
  trigger: '触发点', shadow: '此刻的阴影', block: '卡点', state: '状态', facet: '面向', domain: '领域', focus: '焦点', hurt_type: '伤害类型', struggle: '挣扎', symptom: '匆忙病征', mood: '心境', inward_curve: '向内蜷缩', suggested_form: '爱的操练', prescribed_practice: '操练', mortify: '治死', vivify: '穿上',
  grounds: '确据的根基', gift_lenses: '数算恩典的取景框', reach_steps: 'REACH 五步', rhythm_layers: '节奏（日/周/季）', ministries: '服事的操练', put_off: '要脱去的', put_on: '要穿上的', key_distinction: '关键分辨', examples: '例如', layer: '节奏层', voice: '经典之声',
  spirit_ministry: '圣灵的职事', adoption_truth: '收纳的真理', cure: '解药', three_pillars: '三根支柱', pillar_note: '这根支柱', pillar: '支柱', steward_reminder: '管家的身份', word_practice: '读经操练', next_route: '可继续', reversal: '反转', six_elements: '悔改六要素', achievement: '十架的成就', image: '意象', need: '此刻的需要', kind: '怀疑的种类', form: '怕人的形态', situation: '处境',
  four_steps: '四步', two_moves: '两个方向', inner_critic: '内在批判者的声音', christ_voice: '基督的声音', antidote: '解药', restore_order: '恢复的次序', avoid: '要避免的', posture: '你的姿态', calibrate_note: '校准良心', hope_link: '盼望', violence_note: '安全优先',
}
const SKIP = new Set(['ai_used', 'crisis', 'crisis_note', 'lang', 'en_localized', 'lean', 'mode', 'type', 'violence_flag', 'abuse_flag', 'scruple_flag', 'shame_flag', 'hard_mode', 'legalist_lean'])

function Scripture({ reference, text }) {
  return (
    <div style={{ ...quote }}>
      {text && <TranslatableParagraph style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}>{'「' + String(text) + '」'}</TranslatableParagraph>}
      {reference && <div style={{ fontSize: 12, color: ACCENT, marginTop: 6, textAlign: 'right' }}>—— {reference}</div>}
    </div>
  )
}

function Field({ k, v }) {
  const label = LABELS[k] !== undefined ? LABELS[k] : k
  if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return null
  // scripture-like object
  if (v && typeof v === 'object' && !Array.isArray(v) && ('ref' in v || 'text' in v)) {
    return (<div style={{ marginBottom: 10 }}>{label && <div style={lbl}>{i18nT(label)}</div>}<Scripture reference={v.ref} text={v.text} /></div>)
  }
  if (typeof v === 'string' || typeof v === 'number') {
    return (<div style={{ marginBottom: 10 }}>{label && <div style={lbl}>{i18nT(label)}</div>}<TranslatableParagraph style={{ fontSize: 13.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>{String(v)}</TranslatableParagraph></div>)
  }
  if (Array.isArray(v)) {
    return (
      <div style={{ marginBottom: 10 }}>{label && <div style={lbl}>{i18nT(label)}</div>}
        {v.map((item, i) => (
          <div key={i} style={{ fontSize: 13.5, lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', padding: '4px 0' }}>
            {(item && typeof item === 'object')
              ? <div style={{ ...card, marginBottom: 8 }}>{Object.entries(item).filter(([kk]) => !SKIP.has(kk)).map(([kk, vv]) => <Field key={kk} k={kk} v={vv} />)}</div>
              : <TranslatableParagraph>{'· ' + String(item)}</TranslatableParagraph>}
          </div>
        ))}
      </div>
    )
  }
  if (typeof v === 'object') {
    return (<div style={{ ...card }}>{label && <div style={lbl}>{i18nT(label)}</div>}{Object.entries(v).filter(([kk]) => !SKIP.has(kk)).map(([kk, vv]) => <Field key={kk} k={kk} v={vv} />)}</div>)
  }
  return null
}
const lbl = { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 3, letterSpacing: 0.3 }

class ResultBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('[ExpansionResult] 渲染出错:', error, info?.componentStack) }
  render() {
    if (this.state.error) {
      let dump = ''
      try { dump = JSON.stringify(this.props.data, null, 2) } catch { dump = String(this.props.data) }
      return (
        <div style={{ ...card, borderColor: 'rgba(255,135,135,0.4)' }}>
          <div style={{ color: '#ff8787', fontSize: 13, marginBottom: 8 }}>{i18nT('结果已生成，但显示时出了点问题。下面是完整内容：')}</div>
          <pre style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{dump}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function RenderResult({ data }) {
  if (!data) return null
  return (
    <div>
      {data.crisis && data.crisis_note && (
        <div style={{ ...card, borderColor: 'rgba(255,135,135,0.5)', background: 'rgba(255,80,80,0.10)' }}>
          <TranslatableParagraph style={{ fontSize: 13.5, lineHeight: 1.85, color: '#ffb3b3' }}>{'💛 ' + String(data.crisis_note)}</TranslatableParagraph>
        </div>
      )}
      {Object.entries(data).filter(([k]) => !SKIP.has(k)).map(([k, v]) => <Field key={k} k={k} v={v} />)}
    </div>
  )
}

function Framework({ meta }) {
  if (!meta) return null
  const blurb = meta.principle || meta.thesis || meta.motto || meta.definition || meta.heart_of_christ || meta.tozer_quote || meta.augustine_quote || meta.key_question
  if (!blurb) return null
  return <div style={quote}><TranslatableParagraph style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.82)' }}>{String(blurb)}</TranslatableParagraph></div>
}

function FeatureRunner({ feature, onBack }) {
  const [meta, setMeta] = useState(null)
  const [text, setText] = useState('')
  const [ratings, setRatings] = useState({})
  const [attribute, setAttribute] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    let alive = true
    getMeta(feature.prefix).then((m) => { if (alive) setMeta(m) }).catch(() => {})
    return () => { alive = false }
  }, [feature.prefix])

  const ratingItems = (feature.kind === 'ratings' && meta && Array.isArray(meta[feature.metaKey])) ? meta[feature.metaKey] : []
  useEffect(() => {
    if (ratingItems.length && Object.keys(ratings).length === 0) {
      setRatings(Object.fromEntries(ratingItems.map((it) => [it.key, 0.5])))
    }
  }, [ratingItems.length]) // eslint-disable-line

  async function submit(override) {
    const val = (typeof override === 'string') ? override : text
    if (typeof override === 'string' && override !== text) setText(override)
    setBusy(true); setError(''); setResult(null)
    setRunId((n) => n + 1)
    try {
      let body = { use_ai: true }
      if (feature.kind === 'text') body[feature.field] = val
      else if (feature.kind === 'list') body[feature.field] = val.split(/[，,、\n]+/).map((x) => x.trim()).filter(Boolean)
      else if (feature.kind === 'ratings') body.ratings = ratings
      else if (feature.kind === 'knowgod') { if (attribute) body.attribute = attribute; else body.need = val }
      const r = await runAction(feature.prefix, feature.action, body)
      setResult(r); window.scrollTo({ top: 0 })
    } catch (e) { setError(i18nT(e.message || '提交失败')) } finally { setBusy(false) }
  }

  const attrs = (feature.kind === 'knowgod' && meta && Array.isArray(meta.attributes)) ? meta.attributes : []

  return (
    <div>
      <Header title={feature.name} sub={feature.sub} onBack={result ? () => setResult(null) : onBack} />
      <div style={{ padding: '14px 16px 120px', maxWidth: 660, margin: '0 auto' }}>
        {error && <div style={{ ...card, borderColor: 'rgba(255,135,135,0.4)', color: '#ff8787', fontSize: 13 }}>{error}</div>}
        {!result ? (
          <>
            <Framework meta={meta} />
            {(feature.kind === 'text' || feature.kind === 'list') && (
              <>
                {Array.isArray(feature.options) && feature.options.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{i18nT('点一个常见的，或在下面自己写：')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {feature.options.map((opt, i) => (
                        <button key={i} onClick={() => submit(opt)} disabled={busy}
                          style={{ ...chip, textAlign: 'left', maxWidth: '100%', opacity: busy ? 0.6 : 1 }}>{i18nT(opt)}</button>
                      ))}
                    </div>
                  </>
                )}
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={i18nT(feature.placeholder)}
                  style={ta} rows={4} />
              </>
            )}
            {feature.kind === 'knowgod' && (
              <>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{i18nT('说出此刻的需要/惧怕，或直接选一个神的属性默想：')}</div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={i18nT('例如「我好孤单，没人懂我」')} style={ta} rows={3} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
                  {attrs.map((a) => (
                    <button key={a.key} onClick={() => setAttribute(attribute === a.key ? '' : a.key)}
                      style={{ ...chip, ...(attribute === a.key ? chipOn : {}) }}>{a.name || a.key}</button>
                  ))}
                </div>
              </>
            )}
            {feature.kind === 'ratings' && (
              <>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{i18nT('诚实地为每一项打分（0 = 弱，1 = 强）。这不是评判，只帮助你看见成长的邀请。')}</div>
                {ratingItems.map((it) => (
                  <div key={it.key} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{it.name || it.key}</span>
                      <span style={{ color: ACCENT, fontWeight: 700 }}>{(ratings[it.key] ?? 0.5).toFixed(1)}</span>
                    </div>
                    {it.hint && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{it.hint}</div>}
                    <input type="range" min={0} max={1} step={0.1} value={ratings[it.key] ?? 0.5}
                      onChange={(e) => setRatings({ ...ratings, [it.key]: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: ACCENT }} />
                  </div>
                ))}
              </>
            )}
            <button onClick={() => submit()} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
              {busy ? i18nT('生成中…') : i18nT('开始')}
            </button>
          </>
        ) : <ResultBoundary key={runId} data={result}><RenderResult data={result} /></ResultBoundary>}
      </div>
    </div>
  )
}

function ResourcesView({ onBack }) {
  const [books, setBooks] = useState([])
  const [hymns, setHymns] = useState([])
  const [err, setErr] = useState('')
  const english = getRuntimeLang() === 'en'
  useEffect(() => {
    getBooks().then((d) => setBooks(d.books || [])).catch((e) => setErr(e.message))
    getHymns().then((d) => setHymns(d.hymns || [])).catch(() => {})
  }, [])
  const CONT = { A: '认识神', B: '回到福音', C: '心的争战', D: '与神同行', E: '等候与受苦', F: '分辨与呼召', G: '门徒与群体', H: '华人本土灵修' }
  const byCont = {}
  books.forEach((b) => { (byCont[b.continent] = byCont[b.continent] || []).push(b) })
  return (
    <div>
      <Header title="推荐书目 · 圣诗" sub="按大陆精选（★ = 填补空白/极高契合）" onBack={onBack} />
      <div style={{ padding: '14px 16px 120px', maxWidth: 660, margin: '0 auto' }}>
        {err && <div style={{ ...card, color: '#ff8787', fontSize: 13 }}>{err}</div>}
        {Object.keys(CONT).filter((c) => byCont[c]).map((c) => (
          <div key={c} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, margin: '4px 0 8px' }}>{i18nT(CONT[c])}</div>
            {byCont[c].map((b) => (
              <div key={b.slug} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{'★'.repeat(b.priority || 0)} {english ? (b.en || b.zh) : b.zh}</span>
                  {b.public_domain && <span style={{ fontSize: 10, color: '#34c759' }}>{i18nT('公版')}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', margin: '2px 0 4px' }}>{english ? b.author : `${b.en} · ${b.author}`}</div>
                <TranslatableParagraph style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>{String(english ? (b.blurbEn || b.blurb) : b.blurb)}</TranslatableParagraph>
              </div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#5ac8fa', margin: '10px 0 8px' }}>{i18nT('🎵 圣诗扩充')}</div>
        {hymns.map((h) => (
          <div key={h.slug} style={{ ...card, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13.5 }}>
              {english ? (h.en || h.zh) : h.zh}
              {!english && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}> {h.en}</span>}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{h.era} · {h.theme}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Header({ title, sub, onBack }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(28,28,30,0.92)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
      <BackButton onClick={onBack} />
      <div><div style={{ fontSize: 17, fontWeight: 600 }}>{i18nT(title)}</div>{sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{i18nT(sub)}</div>}</div>
    </div>
  )
}

export default function ExpansionHub({ onClose, initialFeatureKey }) {
  const [selected, setSelected] = useState(() => (initialFeatureKey ? (FEATURES.find((f) => f.key === initialFeatureKey) || null) : null))
  const wrap = { width: '100%', height: '100%', background: '#000', color: '#fff', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
  if (selected && selected.kind === 'resources') return <div style={wrap}><ResourcesView onBack={() => setSelected(null)} /></div>
  if (selected) return <div style={wrap}><FeatureRunner feature={selected} onBack={() => setSelected(null)} /></div>
  return (
    <div style={wrap}>
      <Header title="内容与神学扩充" sub="属灵星球 · 新增养料（自包含增量）" onBack={onClose} />
      <div style={{ padding: '14px 16px 120px', maxWidth: 660, margin: '0 auto' }}>
        <div style={{ ...quote }}>
          <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>{i18nT('补足神学光谱空白的新养料：认识神、与基督联合、以神为乐、知足、情感真伪、基督的慈心、文化礼仪、情感健康，以及一份分大陆的推荐书目与圣诗。')}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FEATURES.map((f) => (
            <button key={f.key} onClick={() => setSelected(f)} style={tile}>
              <div style={{ fontSize: 26 }}>{f.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{i18nT(f.name)}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.5 }}>{i18nT(f.sub)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const ta = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', padding: 12, fontSize: 14, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit' }
const primaryBtn = { width: '100%', marginTop: 14, padding: '13px', borderRadius: 12, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg,#7b2ff7,#5ac8fa)' }
const chip = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer' }
const chipOn = { background: 'linear-gradient(135deg,#7b2ff7,#5ac8fa)', borderColor: 'transparent', color: '#fff' }
const tile = { textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '16px 14px', cursor: 'pointer', color: '#fff' }
