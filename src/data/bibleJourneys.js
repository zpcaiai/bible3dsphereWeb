// 圣经地图集 · 行程类数据集（复用 BibleMapPage 行程 UI：站点+事件+路线+年代轴+动画播放）。
// 坐标 [lng, lat]。事件 {title, ref, summary}。confidence 缺省 identified。
// 每个数据集 descriptor：{ id, title, subtitle, icon, variantLabel, cities[], variants[] }
// variant：{ id, label, color, description, stationIds[], startYear?, endYear? }（有 startYear 则显示年代轴）

export const JOURNEY_DATASETS = [
  // ── 1. 耶稣生平 ─────────────────────────────────────────────
  {
    id: 'jesus', title: '耶稣生平', subtitle: '从伯利恒到耶路撒冷 · 出生→受洗→传道→受难→复活',
    icon: '✝️', variantLabel: '生平',
    cities: [
      { id: 'bethlehem', name_zh: '伯利恒', name_en: 'Bethlehem', lng: 35.20, lat: 31.70, events: [
        { title: '道成肉身降生', ref: '路2:4-7', summary: '约瑟与马利亚回大卫的城伯利恒报名上册，耶稣降生在马槽里。' } ] },
      { id: 'nazareth', name_zh: '拿撒勒', name_en: 'Nazareth', lng: 35.30, lat: 32.70, events: [
        { title: '在拿撒勒长大', ref: '路2:51-52', summary: '耶稣在拿撒勒顺从父母、智慧身量并神人喜爱他的心一齐增长。' },
        { title: '会堂宣读以赛亚书', ref: '路4:16-21', summary: '耶稣在家乡会堂宣告「主的灵在我身上……今天这经应验在你们耳中」。' } ] },
      { id: 'jordan', name_zh: '约旦河（受洗）', name_en: 'Jordan River', lng: 35.55, lat: 31.84, events: [
        { title: '受洗、圣灵如鸽降临', ref: '太3:13-17', summary: '约翰为耶稣施洗，天开了，圣灵仿佛鸽子降下，有声音说「这是我的爱子」。' } ] },
      { id: 'capernaum', name_zh: '迦百农', name_en: 'Capernaum', lng: 35.575, lat: 32.88, events: [
        { title: '传道的中心', ref: '太4:13-22', summary: '耶稣以迦百农为加利利事工基地，呼召彼得、安得烈等门徒，医病赶鬼传天国福音。' } ] },
      { id: 'galilee', name_zh: '加利利海', name_en: 'Sea of Galilee', lng: 35.59, lat: 32.82, events: [
        { title: '平静风浪与神迹', ref: '太8:23-27; 太14', summary: '在加利利海边行许多神迹：平静风浪、五饼二鱼喂饱五千人、海面行走。' } ] },
      { id: 'jerusalem', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.23, lat: 31.78, events: [
        { title: '受难被钉十架', ref: '路23:33-46', summary: '耶稣在耶路撒冷被审判、钉于各各他十字架，为世人的罪舍命。' },
        { title: '第三日复活', ref: '路24:1-7', summary: '七日的头一日清晨，妇女发现坟墓空了，主已照他所说的复活了。' } ] },
    ],
    variants: [ { id: 'life', label: '生平历程', color: '#fbbf24', description: '依出生→受洗→传道→受难→复活的顺序，行程可动画播放。',
      stationIds: ['bethlehem', 'nazareth', 'jordan', 'capernaum', 'galilee', 'jerusalem'], startYear: -5, endYear: 33 } ],
  },

  // ── 2. 亚伯拉罕迁徙 ─────────────────────────────────────────
  {
    id: 'abraham', title: '亚伯拉罕迁徙', subtitle: '从乌珥到应许之地 · 蒙召、立约、筑坛',
    icon: '🐫', variantLabel: '迁徙',
    cities: [
      { id: 'ur', name_zh: '吾珥', name_en: 'Ur', lng: 46.10, lat: 30.96, confidence: 'approximate', events: [
        { title: '神的呼召', ref: '徒7:2-3; 创11:31', summary: '荣耀的神向在迦勒底吾珥的亚伯兰显现，呼召他离开本地本族。' } ] },
      { id: 'haran', name_zh: '哈兰', name_en: 'Haran', lng: 39.03, lat: 36.86, events: [
        { title: '七十五岁奉命起行', ref: '创12:4', summary: '父亲他拉死在哈兰；亚伯兰七十五岁时照耶和华的吩咐起行往迦南去。' } ] },
      { id: 'shechem', name_zh: '示剑', name_en: 'Shechem', lng: 35.28, lat: 32.21, events: [
        { title: '第一座坛 · 赐地的应许', ref: '创12:6-7', summary: '到示剑摩利橡树，耶和华应许「我要把这地赐给你的后裔」，他筑了第一座坛。' } ] },
      { id: 'bethel', name_zh: '伯特利', name_en: 'Bethel', lng: 35.22, lat: 31.93, events: [
        { title: '筑坛求告耶和华的名', ref: '创12:8', summary: '在伯特利与艾的中间支搭帐棚、筑坛，求告耶和华的名。' } ] },
      { id: 'egypt', name_zh: '埃及', name_en: 'Egypt', lng: 31.20, lat: 30.05, events: [
        { title: '因饥荒下埃及', ref: '创12:10-20', summary: '迦南遭遇饥荒，亚伯兰下埃及暂居，因惧怕称撒莱为妹，后蒙神保守归回。' } ] },
      { id: 'hebron', name_zh: '希伯仑（幔利）', name_en: 'Hebron', lng: 35.10, lat: 31.53, events: [
        { title: '立约 · 后裔如星', ref: '创13:18; 15:5-6', summary: '定居幔利橡树筑坛；神领他观看众星，应许后裔如星之多，他就信神，神算为他的义。' } ] },
      { id: 'moriah', name_zh: '摩利亚山', name_en: 'Mount Moriah', lng: 35.235, lat: 31.778, events: [
        { title: '献以撒 · 耶和华以勒', ref: '创22:1-14', summary: '神试验亚伯拉罕献独生子以撒；他顺服到底，神预备公羊代替，称那地为「耶和华以勒」。' } ] },
    ],
    variants: [ { id: 'journey', label: '蒙召之旅', color: '#34d399', description: '一生的信心旅程，可动画播放；点站点看应许与筑坛。',
      stationIds: ['ur', 'haran', 'shechem', 'bethel', 'egypt', 'hebron', 'moriah'], startYear: -2091, endYear: -1991 } ],
  },

  // ── 3. 约书亚征服迦南 ───────────────────────────────────────
  {
    id: 'joshua', title: '约书亚征服迦南', subtitle: '中部 / 南方 / 北方三大战役',
    icon: '⚔️', variantLabel: '战役',
    cities: [
      { id: 'gilgal', name_zh: '吉甲（基地）', name_en: 'Gilgal', lng: 35.50, lat: 31.85 },
      { id: 'jericho', name_zh: '耶利哥', name_en: 'Jericho', lng: 35.44, lat: 31.87, events: [
        { title: '城墙倒塌', ref: '书6:20', summary: '绕城七日、第七日七次，祭司吹角、百姓呐喊，耶利哥城墙塌陷，全城被取。' } ] },
      { id: 'ai', name_zh: '艾城', name_en: 'Ai', lng: 35.26, lat: 31.92, events: [
        { title: '伏兵得胜', ref: '书8:18-26', summary: '初因亚干犯罪失败；除罪后设伏兵，约书亚伸出短枪，一举攻取艾城。' } ] },
      { id: 'gibeon', name_zh: '基遍', name_en: 'Gibeon', lng: 35.18, lat: 31.85, events: [
        { title: '基遍人的诡计', ref: '书9:3-15', summary: '基遍人假扮远方来客，骗以色列与他们立约存留性命。' },
        { title: '日头停留', ref: '书10:12-14', summary: '为援救基遍迎战五王联盟，约书亚祷告，日头与月亮停住约一日，耶和华为以色列争战。' } ] },
      { id: 'jarmuth', name_zh: '耶末', name_en: 'Jarmuth', lng: 34.97, lat: 31.70 },
      { id: 'lachish', name_zh: '拉吉', name_en: 'Lachish', lng: 34.85, lat: 31.56 },
      { id: 'eglon', name_zh: '伊矶伦', name_en: 'Eglon', lng: 34.70, lat: 31.60 },
      { id: 'hebron', name_zh: '希伯仑', name_en: 'Hebron', lng: 35.10, lat: 31.53, events: [
        { title: '南方战役攻取', ref: '书10:36-37', summary: '约书亚率军上到希伯仑攻打，夺取这城与属它的城邑。' } ] },
      { id: 'jerusalem', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.23, lat: 31.78 },
      { id: 'makkedah', name_zh: '玛基大', name_en: 'Makkedah', lng: 34.85, lat: 31.62, events: [
        { title: '五王败亡', ref: '书10:16-27', summary: '南方五王联盟（耶路撒冷、希伯仑、耶末、拉吉、伊矶伦）败逃藏于洞中，终被处死。' } ] },
      { id: 'merom', name_zh: '米伦水', name_en: 'Waters of Merom', lng: 35.45, lat: 32.93, events: [
        { title: '北方联军大败', ref: '书11:1-9', summary: '夏琐王耶宾召集北方诸王于米伦水边，约书亚突袭大获全胜。' } ] },
      { id: 'hazor', name_zh: '夏琐', name_en: 'Hazor', lng: 35.57, lat: 33.02, events: [
        { title: '火烧夏琐', ref: '书11:10-13', summary: '夏琐素为列国之首，约书亚攻取并用火焚烧这城。' } ] },
    ],
    variants: [
      { id: 'central', label: '中部战役', color: '#fbbf24', description: '渡约旦后从吉甲出击：耶利哥→艾城，并与基遍立约。',
        stationIds: ['gilgal', 'jericho', 'ai', 'gibeon'] },
      { id: 'southern', label: '南方战役', color: '#38bdf8', description: '为救基遍迎战南方五王联盟，日头停留，直取诸城。',
        stationIds: ['gibeon', 'jerusalem', 'jarmuth', 'lachish', 'eglon', 'makkedah', 'hebron'] },
      { id: 'northern', label: '北方战役', color: '#a78bfa', description: '北上米伦水边大败联军，攻取并焚烧夏琐。',
        stationIds: ['gilgal', 'merom', 'hazor'] },
    ],
  },

  // ── 4. 大卫王国（生平 38 站清单版） ─────────────────────────
  {
    id: 'david', title: '大卫王国', subtitle: '从牧童到一国之君 · 生平 38 站清单版 · 统一与扩张',
    icon: '🛡️', variantLabel: '阶段',
    cities: [
      { id: 'bethlehem', name_zh: '伯利恒', name_en: 'Bethlehem', lng: 35.202, lat: 31.705, events: [
        { title: '撒母耳膏立', ref: '撒上16:13', summary: '撒母耳照神指示在伯利恒膏耶西的小儿子大卫，耶和华的灵大大感动他。' } ] },
      { id: 'gibeah', name_zh: '基比亚/扫罗王宫', name_en: 'Gibeah', lng: 35.22, lat: 31.82, events: [
        { title: '进扫罗宫廷', ref: '撒上16:21', summary: '为扫罗弹琴服事，并成为拿兵器的人。' } ] },
      { id: 'elah', name_zh: '以拉谷', name_en: 'Valley of Elah', lng: 34.98, lat: 31.69, events: [
        { title: '击杀歌利亚', ref: '撒上17:49', summary: '少年大卫奉耶和华的名，用机弦甩石击倒非利士巨人歌利亚。' } ] },
      { id: 'ramah', name_zh: '拉玛/拿约', name_en: 'Ramah / Naioth', lng: 35.18, lat: 31.85, events: [
        { title: '投奔撒母耳', ref: '撒上19:18', summary: '逃到拉玛见撒母耳，同住拿约；扫罗差人都受感说话。' } ] },
      { id: 'nob', name_zh: '挪伯', name_en: 'Nob', lng: 35.25, lat: 31.83, events: [
        { title: '求饼与刀', ref: '撒上21:1', summary: '向祭司亚希米勒求陈设饼和歌利亚的刀。' } ] },
      { id: 'gath', name_zh: '迦特', name_en: 'Gath', lng: 34.85, lat: 31.61, events: [
        { title: '装疯脱险', ref: '撒上21:10-15', summary: '初逃迦特在亚吉面前装疯脱险。' },
        { title: '再投亚吉', ref: '撒上27:2', summary: '后来再次投奔迦特王亚吉，寄居非利士地。' } ] },
      { id: 'adullam', name_zh: '亚杜兰洞', name_en: 'Cave of Adullam', lng: 34.96, lat: 31.65, events: [
        { title: '聚集四百人', ref: '撒上22:1-2', summary: '困苦、欠债、心里苦恼的人都聚集到他那里，约四百人。' } ] },
      { id: 'mizpeh-moab', name_zh: '摩押的米斯巴', name_en: 'Mizpeh of Moab', lng: 35.78, lat: 31.72, events: [
        { title: '安置父母', ref: '撒上22:3-4', summary: '把父母托付给摩押王照顾。' } ] },
      { id: 'hereth', name_zh: '哈列树林', name_en: 'Forest of Hereth', lng: 35.05, lat: 31.45, events: [
        { title: '回到犹大地', ref: '撒上22:5', summary: '照先知迦得的话离开山寨，回到犹大地。' } ] },
      { id: 'keilah', name_zh: '基伊拉', name_en: 'Keilah', lng: 35.0, lat: 31.62, events: [
        { title: '拯救基伊拉', ref: '撒上23:5', summary: '救基伊拉脱离非利士人，却仍需逃避扫罗。' } ] },
      { id: 'ziph', name_zh: '西弗旷野', name_en: 'Wilderness of Ziph', lng: 35.12, lat: 31.48, events: [
        { title: '山寨藏身', ref: '撒上23:14', summary: '在旷野的山寨中躲避扫罗天天的追索。' } ] },
      { id: 'horesh', name_zh: '何列沙', name_en: 'Horesh', lng: 35.11, lat: 31.46, events: [
        { title: '约拿单坚固他', ref: '撒上23:16', summary: '约拿单到树林里坚固他的手，使他倚靠神。' } ] },
      { id: 'maon', name_zh: '玛云旷野', name_en: 'Wilderness of Maon', lng: 35.13, lat: 31.41, events: [
        { title: '几乎被围', ref: '撒上23:24-28', summary: '扫罗追逼，大卫几乎被围住，因非利士入侵得脱。' } ] },
      { id: 'engedi', name_zh: '隐基底', name_en: 'En Gedi', lng: 35.389, lat: 31.461, events: [
        { title: '割袍不害王', ref: '撒上24:4-7', summary: '在洞中割下扫罗衣襟，却不伸手害耶和华的受膏者。' } ] },
      { id: 'paran', name_zh: '巴兰旷野', name_en: 'Wilderness of Paran', lng: 34.3, lat: 30.0, confidence: 'approximate', events: [
        { title: '下到巴兰', ref: '撒上25:1', summary: '撒母耳死后，大卫下到巴兰旷野。' } ] },
      { id: 'carmel', name_zh: '迦密', name_en: 'Carmel', lng: 35.13, lat: 31.43, events: [
        { title: '拿八与亚比该', ref: '撒上25:2-35', summary: '亚比该拦阻大卫亲手报仇，后成为他的妻。' } ] },
      { id: 'hachilah', name_zh: '西弗旷野/哈基拉山', name_en: 'Hill of Hachilah', lng: 35.15, lat: 31.47, events: [
        { title: '取枪与水瓶', ref: '撒上26:5-12', summary: '夜入扫罗营中取走枪和水瓶，再次不害受膏者。' } ] },
      { id: 'ziklag', name_zh: '洗革拉', name_en: 'Ziklag', lng: 34.85, lat: 31.39, events: [
        { title: '寄居与转折', ref: '撒上27:6; 30', summary: '寄居非利士地；夺回被掳的，后在此得知扫罗战死。' } ] },
      { id: 'hebron', name_zh: '希伯仑', name_en: 'Hebron', lng: 35.099, lat: 31.532, events: [
        { title: '作犹大王', ref: '撒下2:4', summary: '受膏作犹大家的王，在希伯仑七年六个月。' },
        { title: '作全以色列的王', ref: '撒下5:1-3', summary: '以色列众支派来希伯仑膏大卫作全以色列的王。' } ] },
      { id: 'gibeon-pool', name_zh: '基遍池旁', name_en: 'Pool of Gibeon', lng: 35.184, lat: 31.846, events: [
        { title: '两家争战开端', ref: '撒下2:13', summary: '约押与押尼珥在基遍池旁对阵。' } ] },
      { id: 'jerusalem', name_zh: '耶路撒冷/锡安', name_en: 'Jerusalem / Zion', lng: 35.214, lat: 31.768, events: [
        { title: '攻取锡安定都', ref: '撒下5:7', summary: '攻取锡安保障，建立大卫城，定为京都。' },
        { title: '约柜入城', ref: '撒下6:12-15', summary: '欢欢喜喜将约柜迎入大卫城。' },
        { title: '王归耶路撒冷', ref: '撒下19:40', summary: '平定叛乱后回到耶路撒冷，继续作王。' } ] },
      { id: 'baal-perazim', name_zh: '巴力毗拉心', name_en: 'Baal Perazim', lng: 35.15, lat: 31.78, events: [
        { title: '如水冲去敌人', ref: '撒下5:20', summary: '击败非利士人，称耶和华如水冲去敌人。' } ] },
      { id: 'rephaim', name_zh: '利乏音谷', name_en: 'Valley of Rephaim', lng: 35.18, lat: 31.74, events: [
        { title: '再胜非利士', ref: '撒下5:22-25', summary: '再次与非利士人争战，照神指示绕到桑林后击败他们。' } ] },
      { id: 'kiriath-jearim', name_zh: '基列耶琳', name_en: 'Kiriath-jearim', lng: 35.1, lat: 31.8, events: [
        { title: '迎约柜', ref: '撒下6:2', summary: '从亚比拿达家迎约柜上耶路撒冷。' } ] },
      { id: 'nacon', name_zh: '拿艮禾场', name_en: 'Threshing Floor of Nacon', lng: 35.16, lat: 31.79, events: [
        { title: '乌撒事件', ref: '撒下6:6-9', summary: '乌撒伸手扶约柜被击杀，大卫惧怕，约柜改道。' } ] },
      { id: 'obed-edom', name_zh: '俄别以东家', name_en: 'House of Obed-edom', lng: 35.13, lat: 31.79, events: [
        { title: '约柜暂放蒙福', ref: '撒下6:10-11', summary: '约柜暂放三个月，耶和华赐福俄别以东全家。' } ] },
      { id: 'rabbah', name_zh: '拉巴', name_en: 'Rabbah', lng: 35.93, lat: 31.95, events: [
        { title: '攻取亚扪京城', ref: '撒下12:29', summary: '攻取亚扪人的京城拉巴。' } ] },
      { id: 'olives', name_zh: '橄榄山', name_en: 'Mount of Olives', lng: 35.243, lat: 31.778, events: [
        { title: '蒙头哭泣上山', ref: '撒下15:30', summary: '押沙龙叛乱时蒙头赤脚上橄榄山哭泣。' } ] },
      { id: 'bahurim', name_zh: '巴户琳', name_en: 'Bahurim', lng: 35.27, lat: 31.82, events: [
        { title: '示每咒骂', ref: '撒下16:5-12', summary: '示每咒骂大卫，大卫忍受管教与羞辱。' } ] },
      { id: 'jordan-ford', name_zh: '约旦河渡口', name_en: 'Jordan Crossing', lng: 35.53, lat: 31.87, events: [
        { title: '连夜过河', ref: '撒下17:22', summary: '得密报连夜过约旦河，到了天亮无一人未过。' } ] },
      { id: 'mahanaim', name_zh: '玛哈念', name_en: 'Mahanaim', lng: 35.72, lat: 32.2, events: [
        { title: '河东重整', ref: '撒下17:24-29', summary: '逃到约旦河东玛哈念，重整局势，友人供应所需。' } ] },
      { id: 'ephraim-forest', name_zh: '以法莲树林', name_en: 'Forest of Ephraim', lng: 35.72, lat: 32.08, events: [
        { title: '叛军溃败', ref: '撒下18:6-15', summary: '押沙龙军队败在以法莲树林，押沙龙身亡。' } ] },
      { id: 'gilgal', name_zh: '吉甲', name_en: 'Gilgal', lng: 35.5, lat: 31.86, events: [
        { title: '迎王回京', ref: '撒下19:15', summary: '众人到吉甲迎王过约旦河。' } ] },
      { id: 'gihon', name_zh: '基训泉', name_en: 'Gihon Spring', lng: 35.2362, lat: 31.7733, events: [
        { title: '所罗门受膏', ref: '王上1:38-39', summary: '所罗门在基训受膏作王，国位得以坚立。' } ] },
      { id: 'city-of-david', name_zh: '大卫城', name_en: 'City of David', lng: 35.2354, lat: 31.7735, events: [
        { title: '与列祖同睡', ref: '王上2:10', summary: '大卫与列祖同睡，葬在大卫城。' } ] },
    ],
    variants: [
      { id: 'flee', label: '蒙召与逃亡', color: '#fbbf24', description: '从伯利恒受膏、击杀歌利亚，到旷野逃亡的岁月（撒上16–30）。',
        stationIds: ['bethlehem', 'gibeah', 'elah', 'ramah', 'nob', 'gath', 'adullam', 'mizpeh-moab', 'hereth', 'keilah', 'ziph', 'horesh', 'maon', 'engedi', 'paran', 'carmel', 'hachilah', 'gath', 'ziklag'], startYear: -1040, endYear: -1010 },
      { id: 'unite', label: '登基与定都', color: '#f59e0b', description: '希伯仑作犹大王、统一全以色列、攻取锡安定都、迎约柜入城（撒下2–6）。',
        stationIds: ['hebron', 'gibeon-pool', 'hebron', 'jerusalem', 'baal-perazim', 'rephaim', 'kiriath-jearim', 'nacon', 'obed-edom', 'jerusalem'], startYear: -1010, endYear: -1000 },
      { id: 'trials', label: '争战与试炼', color: '#a78bfa', description: '攻取拉巴、押沙龙之乱出逃与归回（撒下12–19）。',
        stationIds: ['rabbah', 'olives', 'bahurim', 'jordan-ford', 'mahanaim', 'ephraim-forest', 'gilgal', 'jerusalem'], startYear: -995, endYear: -979 },
      { id: 'legacy', label: '传位与安息', color: '#34d399', description: '基训膏立所罗门，大卫葬在大卫城（王上1–2）。',
        stationIds: ['gihon', 'city-of-david'], startYear: -971, endYear: -970 },
    ],
  },

  // ── 5. 所罗门王国（生平极简路线 + 贸易网络） ────────────────
  {
    id: 'solomon', title: '所罗门王国', subtitle: '黄金时代 · 生平极简路线 · 圣殿与古代贸易网络',
    icon: '🏛️', variantLabel: '阶段',
    cities: [
      { id: 'city-of-david', name_zh: '耶路撒冷/大卫城', name_en: 'City of David', lng: 35.2354, lat: 31.7735, events: [
        { title: '生于大卫家', ref: '撒下12:24', summary: '生于耶路撒冷，耶和华喜爱他，赐名耶底底亚。' },
        { title: '葬在大卫城', ref: '王上11:43', summary: '与列祖同睡，葬在父亲大卫的城里。' } ] },
      { id: 'gihon', name_zh: '基训泉', name_en: 'Gihon Spring', lng: 35.2362, lat: 31.7733, events: [
        { title: '受膏作王', ref: '王上1:38-39', summary: '骑大卫的骡子下到基训，祭司撒督膏他作王。' } ] },
      { id: 'palace', name_zh: '耶路撒冷王宫', name_en: 'Jerusalem Palace', lng: 35.235, lat: 31.7745, events: [
        { title: '国位坚固', ref: '王上2:12', summary: '坐父亲大卫的位，国位甚是坚固。' } ] },
      { id: 'gibeon', name_zh: '基遍', name_en: 'Gibeon', lng: 35.184, lat: 31.846, events: [
        { title: '梦中求智慧', ref: '王上3:4-15', summary: '在基遍邱坛献一千燔祭，梦中向神求智慧的心。' } ] },
      { id: 'jerusalem', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.214, lat: 31.768, events: [
        { title: '智断二妇争子', ref: '王上3:16-28', summary: '众人见神的智慧在他里面，敬畏他。' },
        { title: '晚年偏离', ref: '王上11:1-8', summary: '晚年随从外邦妃嫔敬拜别神，心偏离耶和华。' } ] },
      { id: 'tyre', name_zh: '黎巴嫩/推罗贸易线', name_en: 'Lebanon / Tyre', lng: 35.20, lat: 33.27, events: [
        { title: '希兰供应香柏木', ref: '王上5:1-12', summary: '与推罗王希兰立约，黎巴嫩香柏木、松木扎筏浮海运来，换取粮油。' } ] },
      { id: 'temple', name_zh: '耶路撒冷圣殿', name_en: 'Jerusalem Temple', lng: 35.2354, lat: 31.7781, events: [
        { title: '建造第一圣殿', ref: '王上6:1,38', summary: '出埃及后四百八十年动工，历七年建成耶和华的圣殿。' } ] },
      { id: 'palace-complex', name_zh: '王宫建筑群', name_en: 'Palace Complex', lng: 35.234, lat: 31.776, events: [
        { title: '十三年建王宫', ref: '王上7:1-12', summary: '又用十三年建造王宫、黎巴嫩林宫与审判廊。' } ] },
      { id: 'ezion-geber', name_zh: '以旬迦别/以禄（红海港）', name_en: 'Ezion-geber / Eloth', lng: 34.976, lat: 29.540, events: [
        { title: '红海船队', ref: '王上9:26', summary: '在红海边以禄附近的以旬迦别建造船队。' } ] },
      { id: 'ophir', name_zh: '俄斐贸易线', name_en: 'Ophir', lng: 43.00, lat: 17.00, confidence: 'unknown', events: [
        { title: '俄斐取金', ref: '王上9:27-28', summary: '希兰水手与所罗门仆人同往俄斐，运回黄金四百二十他连得。' } ] },
      { id: 'sheba', name_zh: '示巴', name_en: 'Sheba', lng: 45.30, lat: 15.40, confidence: 'approximate', events: [
        { title: '示巴女王来访', ref: '王上10:1-13', summary: '示巴女王慕所罗门的智慧与财富，带香料金银宝石远道来访、叹为观止。' } ] },
      { id: 'egypt', name_zh: '埃及', name_en: 'Egypt', lng: 31.20, lat: 30.05, events: [
        { title: '联姻与马匹贸易', ref: '王上3:1; 10:28-29', summary: '所罗门娶法老女儿为妻；从埃及进口马匹战车，转售赫人与亚兰诸王，居中获利。' } ] },
      { id: 'tadmor', name_zh: '哈马口/达莫', name_en: 'Lebo-hamath / Tadmor', lng: 38.273, lat: 34.556, confidence: 'approximate', events: [
        { title: '北取哈马建达莫', ref: '代下8:3-4', summary: '北取哈马琐巴，在旷野建造达莫与哈马的积货城。' } ] },
      { id: 'hazor', name_zh: '夏琐', name_en: 'Hazor', lng: 35.568, lat: 33.017, events: [
        { title: '重建北方要城', ref: '王上9:15', summary: '重建夏琐，巩固王国边防。' } ] },
      { id: 'megiddo', name_zh: '米吉多', name_en: 'Megiddo', lng: 35.18, lat: 32.585, events: [
        { title: '屯车马的要塞', ref: '王上9:15', summary: '修筑米吉多为屯车马的国防要塞。' } ] },
      { id: 'gezer', name_zh: '基色', name_en: 'Gezer', lng: 34.92, lat: 31.86, events: [
        { title: '重新建造基色', ref: '王上9:16-17', summary: '法老攻取基色赐给女儿作妆奁，所罗门重新建造。' } ] },
    ],
    variants: [
      { id: 'rise', label: '登基与求智慧', color: '#fde047', description: '生于大卫城、基训受膏、基遍求智慧、京中断案（撒下12; 王上1–3）。',
        stationIds: ['city-of-david', 'gihon', 'palace', 'gibeon', 'jerusalem'], startYear: -991, endYear: -969 },
      { id: 'temple', label: '圣殿与王宫', color: '#ffd700', description: '与推罗结盟取香柏木，七年建殿、十三年建宫（王上5–8）。',
        stationIds: ['jerusalem', 'tyre', 'temple', 'palace-complex'], startYear: -966, endYear: -959 },
      { id: 'redsea', label: '红海·俄斐·示巴', color: '#38bdf8', description: '以旬迦别船队远航俄斐运金；示巴女王来访（王上9–10）。',
        stationIds: ['jerusalem', 'ezion-geber', 'ophir', 'sheba'], startYear: -946, endYear: -945 },
      { id: 'build', label: '北疆与防御城', color: '#a78bfa', description: '北取哈马口、建造达莫，修筑夏琐、米吉多、基色（王上9; 代下8）。',
        stationIds: ['tadmor', 'hazor', 'megiddo', 'gezer'], startYear: -944, endYear: -943 },
      { id: 'egypt', label: '埃及联姻贸易', color: '#fb7185', description: '与埃及联姻，垄断马匹战车转口贸易。',
        stationIds: ['jerusalem', 'egypt'] },
      { id: 'later', label: '晚年与安葬', color: '#34d399', description: '晚年心偏离神，葬于大卫城（王上11）。',
        stationIds: ['jerusalem', 'city-of-david'], startYear: -935, endYear: -931 },
    ],
  },

  // ── 6. 启示录七教会 ─────────────────────────────────────────
  {
    id: 'seven-churches', title: '启示录七教会', subtitle: '亚西亚七间教会 · 优点 / 责备 / 应许',
    icon: '🕯️', variantLabel: '巡回',
    cities: [
      { id: 'ephesus', name_zh: '以弗所', name_en: 'Ephesus', lng: 27.34, lat: 37.94, events: [
        { title: '失去起初的爱心', ref: '启2:1-7', summary: '优点：为主名劳苦、恨恶尼哥拉党的行为。责备：离弃了起初的爱心。应许：得胜的得吃神乐园中生命树的果子。' } ] },
      { id: 'smyrna', name_zh: '士每拿', name_en: 'Smyrna', lng: 27.14, lat: 38.42, events: [
        { title: '至死忠心', ref: '启2:8-11', summary: '优点：在患难贫穷中却是富足，主未加责备。应许：务要至死忠心，必得生命的冠冕，不受第二次死的害。' } ] },
      { id: 'pergamum', name_zh: '别迦摩', name_en: 'Pergamum', lng: 27.18, lat: 39.13, events: [
        { title: '在撒但座位之处持守', ref: '启2:12-17', summary: '优点：在撒但座位之处仍持守主名。责备：容让巴兰与尼哥拉党的教训。应许：赐隐藏的吗哪与写新名的白石。' } ] },
      { id: 'thyatira', name_zh: '推雅推喇', name_en: 'Thyatira', lng: 27.84, lat: 38.92, events: [
        { title: '爱心增长却容让假师', ref: '启2:18-29', summary: '优点：爱心、信心、服事、忍耐越来越多。责备：容让自称女先知的耶洗别引诱人。应许：赐权柄制伏列国、并赐晨星。' } ] },
      { id: 'sardis', name_zh: '撒狄', name_en: 'Sardis', lng: 28.04, lat: 38.49, events: [
        { title: '按名是活的其实是死的', ref: '启3:1-6', summary: '责备：徒有活的名声，行为却未完全。优点：仍有几名未污秽衣服。应许：得胜的必穿白衣，名字不从生命册涂抹。' } ] },
      { id: 'philadelphia', name_zh: '非拉铁非', name_en: 'Philadelphia', lng: 28.52, lat: 38.36, events: [
        { title: '敞开的门', ref: '启3:7-13', summary: '优点：略有能力却遵守主道、未弃绝主名，主未加责备。应许：在主前有敞开的门，免去普天下的试炼，成为神殿中的柱子。' } ] },
      { id: 'laodicea', name_zh: '老底嘉', name_en: 'Laodicea', lng: 29.11, lat: 37.84, events: [
        { title: '不冷不热', ref: '启3:14-22', summary: '责备：不冷不热，自以为富足却不知贫穷、瞎眼、赤身。应许：当悔改开门，主必进来同席，得与主同坐宝座。' } ] },
    ],
    variants: [ { id: 'circuit', label: '七教会巡回', color: '#f97316', description: '依书信顺序的邮路巡回；点城市看优点、责备与应许。',
      stationIds: ['ephesus', 'smyrna', 'pergamum', 'thyatira', 'sardis', 'philadelphia', 'laodicea'] } ],
  },

  // ── 7. 受难周步行轨迹 ───────────────────────────────────────
  {
    id: 'passion-week', title: '受难周', subtitle: '耶稣在耶路撒冷最后一周的步行轨迹',
    icon: '🌿', variantLabel: '受难周',
    cities: [
      { id: 'bethany', name_zh: '伯大尼', name_en: 'Bethany', lng: 35.26, lat: 31.77, events: [
        { title: '受膏（受难周前夕）', ref: '约12:1-8', summary: '逾越节前六日，耶稣在伯大尼，马利亚用真哪哒香膏抹主，为安葬之日存留。' } ] },
      { id: 'olives', name_zh: '橄榄山', name_en: 'Mount of Olives', lng: 35.245, lat: 31.778, events: [
        { title: '荣入圣城（棕枝主日）', ref: '太21:1-11', summary: '耶稣骑驴驹从橄榄山下来进耶路撒冷，众人铺衣摇棕枝高呼「和散那」。' } ] },
      { id: 'temple', name_zh: '圣殿', name_en: 'Temple', lng: 35.2354, lat: 31.778, events: [
        { title: '洁净圣殿与教训', ref: '太21:12-13', summary: '耶稣赶出殿里做买卖的人，连日在殿中教训人、与宗教领袖辩论。' } ] },
      { id: 'upper-room', name_zh: '马可楼（最后晚餐）', name_en: 'Upper Room', lng: 35.229, lat: 31.771, events: [
        { title: '设立圣餐 · 洗脚', ref: '路22:7-20; 约13', summary: '在楼房与门徒守逾越节，为门徒洗脚，擘饼分杯设立主的圣餐。' } ] },
      { id: 'gethsemane', name_zh: '客西马尼', name_en: 'Gethsemane', lng: 35.240, lat: 31.779, events: [
        { title: '祷告与被捕', ref: '太26:36-56', summary: '耶稣在客西马尼园极其忧伤地祷告「不要照我的意思」，随后被犹大出卖、被捕。' } ] },
      { id: 'caiaphas', name_zh: '大祭司院（该亚法）', name_en: "Caiaphas's House", lng: 35.228, lat: 31.771, events: [
        { title: '宗教审判 · 彼得不认主', ref: '太26:57-75', summary: '在大祭司该亚法面前受审被定亵渎之罪；彼得在院中三次不认主，鸡叫想起主的话。' } ] },
      { id: 'pilate', name_zh: '彼拉多衙门', name_en: "Pilate's Praetorium", lng: 35.226, lat: 31.779, events: [
        { title: '罗马审判 · 定罪', ref: '约18:28-19:16', summary: '众人把耶稣解到巡抚彼拉多处；彼拉多查不出罪来却顺从众意，把他交去钉十字架。' } ] },
      { id: 'golgotha', name_zh: '各各他', name_en: 'Golgotha', lng: 35.229, lat: 31.778, events: [
        { title: '钉十字架 · 断气', ref: '路23:33-46', summary: '在各各他被钉十字架，午正遍地黑暗，耶稣喊「成了」，将灵魂交于父手中。' } ] },
      { id: 'tomb', name_zh: '园中坟墓', name_en: 'Garden Tomb', lng: 35.230, lat: 31.789, events: [
        { title: '安葬与复活', ref: '太27:59-28:6', summary: '约瑟将主葬在新坟墓里；七日的头一日，天使宣告「他不在这里，已照所说的复活了」。' } ] },
    ],
    variants: [ { id: 'week', label: '受难周路线', color: '#fb7185', description: '从伯大尼到园中坟墓，循受难周时序步行轨迹，可动画播放。',
      stationIds: ['bethany', 'olives', 'temple', 'upper-room', 'gethsemane', 'caiaphas', 'pilate', 'golgotha', 'tomb'] } ],
  },
]
