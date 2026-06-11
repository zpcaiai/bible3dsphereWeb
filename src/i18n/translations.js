// 国际化文案字典 / i18n message dictionary
//
// 两部分组成：
//   1) namespaced —— 首页/顶栏/导航等手工命名空间键（zh + en 都需要）
//   2) auto-en.json —— 全站 codemod 自动抽取的「中文原文 → 英文」映射（仅英文）
//      中文模式下这些键会回退显示中文原文，因此英文缺失时不会空白。
//
// 合并规则：en = { ...autoEN, ...namespacedEn }，命名空间键优先。

import autoEN from './auto-en.js'

const namespacedZh = {
  'lang.zh': '中文',
  'lang.en': 'EN',
  'lang.switchTitle': '切换语言 / Switch language',

  'topbar.title': '属灵星球',
  'topbar.defaultNickname': '弟兄',
  'topbar.userAlt': '用户',
  'topbar.community': '社区',
  'topbar.editProfile': '修改资料',
  'topbar.lastLogin': '最近登录时间',
  'topbar.login': '登录',

  'home.zoom.far': '远景',
  'home.zoom.mid': '中景',
  'home.zoom.near': '近景',

  'home.quick.bibleSearch': '经文搜索',
  'home.quick.groupHub': '小组中心',
  'home.snapshot.memoryDeck': '背经卡',
  'home.snapshot.exportData': '数据导出',
  'home.quick.voice': '音视频通话',
  'home.quick.communion': '群聊',
  'home.quick.bibleMaps': '圣经地图',

  'home.snapshot.title': '今日灵命快照',
  'home.snapshot.devotionDone': '今日已灵修',
  'home.snapshot.devotionNone': '今日未灵修',
  'home.snapshot.pendingPrayers': '{n} 个待代祷',
  'home.snapshot.soulQuestion': '今日一问',
  'home.snapshot.quickDevotion': '2分钟灵修',
  'home.snapshot.growthMap': '灵命图谱',
  'home.snapshot.growth': '灵命成长',
  'home.snapshot.partner': '属灵伙伴',
  'home.snapshot.bibleReading': '读经&查经',

  'home.trajectory.title': '近30天情感轨迹',

  'nav.sphere': '星球',
  'nav.mirror': '镜鉴',
  'nav.sharewall': '分享',
  'nav.journal': '主日',
  'nav.evangelism': '宣教',
  'nav.prayer': '代祷',
  'nav.devotion': '灵修',
  'nav.innerlife': '心迹',
  'nav.communion': '相通',

  'devotion.tab.personal': '今日灵修',
  'devotion.tab.dew': '清晨甘露',
  'devotion.tab.plan': '读经计划',
  'devotion.tab.memory': '背经',
  'devotion.tab.books': '属灵书籍',
  'devotion.tab.journal': '灵修日记',
}

const namespacedEn = {
  'lang.zh': '中文',
  'lang.en': 'EN',
  'lang.switchTitle': '切换语言 / Switch language',

  'topbar.title': 'Soul Planet',
  'topbar.defaultNickname': 'Friend',
  'topbar.userAlt': 'User',
  'topbar.community': 'Community',
  'topbar.editProfile': 'Edit profile',
  'topbar.lastLogin': 'Last login',
  'topbar.login': 'Log in',

  'home.zoom.far': 'Far',
  'home.zoom.mid': 'Mid',
  'home.zoom.near': 'Near',

  'home.quick.bibleSearch': 'Verse Search',
  'home.quick.groupHub': 'Groups',
  'home.snapshot.memoryDeck': 'Memory Cards',
  'home.snapshot.exportData': 'Export',
  'home.quick.voice': 'Voice & Video',
  'home.quick.communion': 'Group Chat',
  'home.quick.bibleMaps': 'Bible Maps',

  'home.snapshot.title': "Today's Spiritual Snapshot",
  'home.snapshot.devotionDone': 'Devotion done today',
  'home.snapshot.devotionNone': 'No devotion yet today',
  'home.snapshot.pendingPrayers': '{n} prayers awaiting',
  'home.snapshot.soulQuestion': "Today's Question",
  'home.snapshot.quickDevotion': '2-min Devotion',
  'home.snapshot.growthMap': 'Growth Map',
  'home.snapshot.growth': 'Spiritual Growth',
  'home.snapshot.partner': 'Prayer Partner',
  'home.snapshot.bibleReading': 'Bible Reading & Study',

  'home.trajectory.title': 'Emotional Journey (last 30 days)',

  'nav.sphere': 'Planet',
  'nav.mirror': 'Mirror',
  'nav.sharewall': 'Share',
  'nav.journal': 'Sunday',
  'nav.evangelism': 'Mission',
  'nav.prayer': 'Prayer',
  'nav.devotion': 'Devotion',
  'nav.innerlife': 'Inner Life',
  'nav.communion': 'Fellowship',

  'devotion.tab.personal': 'Today',
  'devotion.tab.dew': 'Morning Dew',
  'devotion.tab.plan': 'Reading Plan',
  'devotion.tab.memory': 'Memorize',
  'devotion.tab.books': 'Books',
  'devotion.tab.journal': 'Journal',
}

export const translations = {
  zh: namespacedZh,
  en: { ...autoEN, ...namespacedEn },
}

export const SUPPORTED_LANGS = ['zh', 'en']
export const DEFAULT_LANG = 'zh'
