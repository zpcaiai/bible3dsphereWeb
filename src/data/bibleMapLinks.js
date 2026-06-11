// bibleMapLinks.js — 书卷（OSIS 三字码）→ 相关地图入口映射。
// 读经页 / 经文搜索结果据此浮现"🗺 相关地图"快捷入口。
// panel: 'bible-maps'（12 图中心，mapId 深链自动打开）| 'bible-atlas'（新版地图集）

const L = (mapId, label) => ({ panel: 'bible-maps', mapId, label })
const ATLAS = (label) => ({ panel: 'bible-atlas', mapId: null, label })

const BOOK_MAPS = {
  GEN: [L('abraham', '亚伯拉罕之旅')],
  EXO: [L('exodus', '出埃及路线')],
  LEV: [L('exodus', '旷野行程')],
  NUM: [L('exodus', '旷野行程')],
  DEU: [L('exodus', '旷野行程')],
  JOS: [L('joshua', '征服迦南'), L('tribes', '十二支派分地')],
  JDG: [L('tribes', '十二支派分地'), ATLAS('士师时代事件')],
  RUT: [L('tribes', '十二支派分地')],
  '1SA': [L('david', '大卫的足迹')],
  '2SA': [L('david', '大卫的足迹')],
  '1KI': [L('solomon', '所罗门王国'), L('divided', '王国分裂')],
  '2KI': [L('divided', '王国分裂'), L('timeline', '列国兴衰')],
  '1CH': [L('david', '大卫的足迹')],
  '2CH': [L('solomon', '所罗门王国'), L('divided', '王国分裂')],
  EZR: [L('timeline', '列国兴衰')],
  NEH: [L('timeline', '列国兴衰')],
  EST: [L('timeline', '列国兴衰')],
  PSA: [L('david', '大卫的足迹')],
  PRO: [L('solomon', '所罗门王国')],
  ECC: [L('solomon', '所罗门王国')],
  SNG: [L('solomon', '所罗门王国')],
  ISA: [ATLAS('先知预言地图')],
  JER: [ATLAS('先知预言地图')],
  LAM: [ATLAS('先知预言地图')],
  EZK: [ATLAS('先知预言地图')],
  DAN: [L('timeline', '列国兴衰'), ATLAS('先知预言地图')],
  HOS: [ATLAS('先知预言地图')], JOL: [ATLAS('先知预言地图')], AMO: [ATLAS('先知预言地图')],
  OBA: [ATLAS('先知预言地图')], JON: [ATLAS('先知预言地图')], MIC: [ATLAS('先知预言地图')],
  NAM: [ATLAS('先知预言地图')], HAB: [ATLAS('先知预言地图')], ZEP: [ATLAS('先知预言地图')],
  HAG: [ATLAS('先知预言地图')], ZEC: [ATLAS('先知预言地图')], MAL: [ATLAS('先知预言地图')],
  MAT: [L('jesus', '耶稣的脚踪')], MRK: [L('jesus', '耶稣的脚踪')],
  LUK: [L('jesus', '耶稣的脚踪')], JHN: [L('jesus', '耶稣的脚踪')],
  ACT: [L('paul', '保罗宣教之旅')],
  ROM: [L('paul', '保罗宣教之旅')], '1CO': [L('paul', '保罗宣教之旅')], '2CO': [L('paul', '保罗宣教之旅')],
  GAL: [L('paul', '保罗宣教之旅')], EPH: [L('paul', '保罗宣教之旅')], PHP: [L('paul', '保罗宣教之旅')],
  COL: [L('paul', '保罗宣教之旅')], '1TH': [L('paul', '保罗宣教之旅')], '2TH': [L('paul', '保罗宣教之旅')],
  '1TI': [L('paul', '保罗宣教之旅')], '2TI': [L('paul', '保罗宣教之旅')], TIT: [L('paul', '保罗宣教之旅')],
  PHM: [L('paul', '保罗宣教之旅')],
  REV: [L('seven-churches', '七教会')],
}

// 中文书名 → OSIS 码（读经页用中文书名时换算）
export const ZH_TO_CODE = {
  '创世记': 'GEN', '出埃及记': 'EXO', '利未记': 'LEV', '民数记': 'NUM', '申命记': 'DEU',
  '约书亚记': 'JOS', '士师记': 'JDG', '路得记': 'RUT', '撒母耳记上': '1SA', '撒母耳记下': '2SA',
  '列王纪上': '1KI', '列王纪下': '2KI', '历代志上': '1CH', '历代志下': '2CH', '以斯拉记': 'EZR',
  '尼希米记': 'NEH', '以斯帖记': 'EST', '约伯记': 'JOB', '诗篇': 'PSA', '箴言': 'PRO',
  '传道书': 'ECC', '雅歌': 'SNG', '以赛亚书': 'ISA', '耶利米书': 'JER', '耶利米哀歌': 'LAM',
  '以西结书': 'EZK', '但以理书': 'DAN', '何西阿书': 'HOS', '约珥书': 'JOL', '阿摩司书': 'AMO',
  '俄巴底亚书': 'OBA', '约拿书': 'JON', '弥迦书': 'MIC', '那鸿书': 'NAM', '哈巴谷书': 'HAB',
  '西番雅书': 'ZEP', '哈该书': 'HAG', '撒迦利亚书': 'ZEC', '玛拉基书': 'MAL',
  '马太福音': 'MAT', '马可福音': 'MRK', '路加福音': 'LUK', '约翰福音': 'JHN', '使徒行传': 'ACT',
  '罗马书': 'ROM', '哥林多前书': '1CO', '哥林多后书': '2CO', '加拉太书': 'GAL', '以弗所书': 'EPH',
  '腓立比书': 'PHP', '歌罗西书': 'COL', '帖撒罗尼迦前书': '1TH', '帖撒罗尼迦后书': '2TH',
  '提摩太前书': '1TI', '提摩太后书': '2TI', '提多书': 'TIT', '腓利门书': 'PHM', '希伯来书': 'HEB',
  '雅各书': 'JAS', '彼得前书': '1PE', '彼得后书': '2PE', '约翰一书': '1JN', '约翰二书': '2JN',
  '约翰三书': '3JN', '犹大书': 'JUD', '启示录': 'REV',
}

/** 书卷码（或中文书名）→ 相关地图入口数组（可能为空） */
export function mapsForBook(codeOrZh) {
  if (!codeOrZh) return []
  const code = BOOK_MAPS[codeOrZh] ? codeOrZh : ZH_TO_CODE[codeOrZh]
  return (code && BOOK_MAPS[code]) || []
}

/** 跳转辅助：写入深链并返回目标 panel（调用方负责 setActivePanel） */
export function openMapEntry(entry) {
  try {
    if (entry?.mapId) sessionStorage.setItem('biblemaps-open', entry.mapId)
  } catch { /* ignore */ }
  return entry?.panel || 'bible-maps'
}
