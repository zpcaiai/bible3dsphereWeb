// 国际化文案字典 / i18n message dictionary
//
// 两部分组成：
//   1) namespaced —— 首页/顶栏/导航等手工命名空间键（zh + en 都需要）
//   2) auto-en.json —— 全站 codemod 自动抽取的「中文原文 → 英文」映射（仅英文）
//      中文模式下这些键会回退显示中文原文，因此英文缺失时不会空白。
//
// 合并规则：en = { ...autoEN, ...namespacedEn }，命名空间键优先。
// 性能：auto-en（220KB+）不再静态打进首包——EN 模式启动时由 main.jsx
// 动态 import 后调用 mergeAutoEn() 合并；中文用户完全不加载。

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
  'home.snapshot.mccheyne': '麦琴计划',
  'home.snapshot.exportData': '数据导出',
  'home.snapshot.personalSearch': '我的搜索',
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

  '本地兜底结果：后端未响应，已用前端内置规则生成。连接后端后可获得完整服务端结果。': 'Local fallback result: the backend did not respond, so the frontend generated this with built-in rules. Connect the backend for full server results.',
  '本地兜底资源：后端资源接口未响应，当前显示前端内置精选。': 'Local fallback resources: the backend resource endpoint did not respond, so built-in curated items are shown.',
  '扩充灵修': 'Expansion',
  '云转写未配置：请在后端设置 DEEPGRAM_API_KEY。': 'Cloud transcription is not configured. Set DEEPGRAM_API_KEY on the backend.',
  '录音太长，请缩短后重试。': 'The recording is too long. Please shorten it and try again.',
  '当前音频格式不支持，请换浏览器或重试。': 'This audio format is not supported. Please try another browser or retry.',
  '正在识别语音...': 'Transcribing voice...',
  '正在翻译成英文...': 'Translating to English...',
  '正在翻译成中文...': 'Translating to Chinese...',
  '正在优化文本...': 'Optimizing text...',
  '未能识别到语音内容，请重试': 'No speech was recognized. Please try again.',
  '语音识别失败': 'Voice recognition failed',
  '语音识别失败，请检查网络连接': 'Voice recognition failed. Please check your network connection.',

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
  'home.snapshot.mccheyne': "M'Cheyne Plan",
  'home.snapshot.exportData': 'Export',
  'home.snapshot.personalSearch': 'My Search',
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
  en: { ...namespacedEn },
}

export const SUPPORTED_LANGS = ['zh', 'en']
export const DEFAULT_LANG = 'zh'

// EN 模式启动时合并 auto-en 词典（命名空间键优先，不被覆盖）
export function mergeAutoEn(map) {
  if (!map) return
  for (const k in map) {
    if (!(k in translations.en)) translations.en[k] = map[k]
  }
}
