// bibleMapsData.js — 全部圣经地图的统一数据
// 坐标为 [lng, lat]。年代多采用传统圣经年代学（早期出埃及说），仅供教学示意。
// 每个 config: { id, title, subtitle, era, badge, bounds, mode, layerSelect, layers[], years?, eras? }
// point: { id, name_zh, name_en, lng, lat, order, confidence, year?, age?, scriptureRef, altar?, promise?, note?, events[] }
import { exodusStations, exodusRoute } from './exodusStations'

// —— 1. 亚伯拉罕迁徙 ——
const abraham = {
  id: 'abraham',
  title: '亚伯拉罕迁徙地图',
  subtitle: '从吾珥到麦比拉洞 · 信心之父一生的旅程',
  era: '约公元前 2166–2029',
  badge: '★★★★★',
  bounds: { minLng: 30, maxLng: 47, minLat: 28, maxLat: 38 },
  mode: 'journey',
  layerSelect: 'multi',
  layers: [{
    id: 'route', label: '迁徙路线', color: '#e8b04b', route: true,
    points: [
      { id: 'ur', name_zh: '吾珥', name_en: 'Ur', lng: 46.10, lat: 30.96, order: 1, confidence: 'identified', year: -2166, age: 0, scriptureRef: '创11:28-31；徒7:2-4', note: '亚伯兰的本家之地。司提反说："荣耀的神向我们的祖宗亚伯拉罕显现，那时他在美索不达米亚。"', events: [
        { title: '蒙召的起点', ref: '徒7:2-3', summary: '神在吾珥向亚伯兰显现，呼召他离开本地、本族、父家，往神所要指示的地方去。' },
      ] },
      { id: 'haran', name_zh: '哈兰', name_en: 'Haran', lng: 39.03, lat: 36.86, order: 2, confidence: 'identified', year: -2091, age: 75, scriptureRef: '创11:31-12:4', note: '父亲他拉率家族至此居住，死于哈兰。', events: [
        { title: '七十五岁再蒙召', ref: '创12:1-4', summary: '"你要离开本地、本族、父家，往我所要指示你的地去。"亚伯兰七十五岁照耶和华的吩咐起行，带着罗得同去。' },
      ] },
      { id: 'shechem', name_zh: '示剑（摩利橡树）', name_en: 'Shechem', lng: 35.28, lat: 32.21, order: 3, confidence: 'identified', year: -2091, age: 75, scriptureRef: '创12:6-7', altar: '摩利橡树旁，为向他显现的耶和华筑坛', promise: '"我要把这地赐给你的后裔。"', events: [
        { title: '进入迦南的第一座坛', ref: '创12:6-7', summary: '亚伯兰到了示剑的摩利橡树，耶和华向他显现，应许把这地赐给他的后裔；他就在那里筑了一座坛。' },
      ] },
      { id: 'bethel-ai', name_zh: '伯特利与艾之间', name_en: 'Between Bethel & Ai', lng: 35.235, lat: 31.93, order: 4, confidence: 'identified', year: -2091, age: 75, scriptureRef: '创12:8', altar: '在伯特利与艾城之间筑坛，求告耶和华的名', events: [
        { title: '支帐筑坛、求告主名', ref: '创12:8', summary: '亚伯兰从示剑迁到伯特利东边、艾城西边的山，支搭帐棚，又筑了一座坛，求告耶和华的名。' },
      ] },
      { id: 'negev1', name_zh: '南地', name_en: 'The Negev', lng: 34.85, lat: 31.05, order: 5, confidence: 'approximate', year: -2091, age: 75, scriptureRef: '创12:9', events: [
        { title: '渐渐迁往南地', ref: '创12:9', summary: '亚伯兰一路前行，渐渐迁往南地（旷野干旱之地）。' },
      ] },
      { id: 'egypt', name_zh: '埃及', name_en: 'Egypt', lng: 31.20, lat: 30.10, order: 6, confidence: 'approximate', year: -2090, age: 76, scriptureRef: '创12:10-20', note: '地有饥荒，下到埃及暂居。', events: [
        { title: '因饥荒下埃及', ref: '创12:10-20', summary: '亚伯兰称撒莱为妹子，法老因此受灾；神保守撒莱，法老把他们送走，亚伯兰带着许多牲畜财物回迦南。' },
      ] },
      { id: 'negev2', name_zh: '南地（回程）', name_en: 'The Negev', lng: 34.85, lat: 31.05, order: 7, confidence: 'approximate', year: -2089, age: 77, scriptureRef: '创13:1-3', events: [
        { title: '带财物从埃及上来', ref: '创13:1-2', summary: '亚伯兰带着妻子与一切所有的，并罗得，从埃及上南地去；他的金、银、牲畜极多。' },
      ] },
      { id: 'bethel-ai2', name_zh: '伯特利与艾之间（回程）', name_en: 'Between Bethel & Ai', lng: 35.235, lat: 31.93, order: 8, confidence: 'identified', year: -2089, age: 77, scriptureRef: '创13:3-12', events: [
        { title: '回到旧坛、与罗得分开', ref: '创13:8-12', summary: '回到起先筑坛之处求告主名；因牧人相争，亚伯兰让罗得先选，罗得选了约旦河平原往所多玛去，亚伯兰留在迦南地。' },
      ] },
      { id: 'hebron1', name_zh: '希伯仑（幔利橡树）', name_en: 'Hebron / Mamre', lng: 35.10, lat: 31.53, order: 9, confidence: 'identified', year: -2088, age: 78, scriptureRef: '创13:18', altar: '在幔利的橡树那里为耶和华筑坛', promise: '"你举目向东西南北观看，凡你所看见的一切地，我都要赐给你和你的后裔。"', events: [
        { title: '迁到幔利筑坛', ref: '创13:18', summary: '亚伯兰搬到希伯仑幔利的橡树那里居住，在那里为耶和华筑了一座坛。' },
      ] },
      { id: 'dan-hobah', name_zh: '但附近 / 何把', name_en: 'Dan / Hobah', lng: 35.65, lat: 33.25, order: 10, confidence: 'approximate', year: -2086, age: 80, scriptureRef: '创14:14-16', note: '追敌直到大马士革左边的何把。', events: [
        { title: '率壮丁救回罗得', ref: '创14:14-16', summary: '罗得被掳，亚伯兰率三百一十八名家生壮丁连夜追赶到但，又追到大马士革左边的何把，夺回罗得及一切财物人口。' },
      ] },
      { id: 'sodom-plain', name_zh: '所多玛平原相关地区', name_en: 'Plain of Sodom', lng: 35.40, lat: 31.05, order: 11, confidence: 'approximate', year: -2067, age: 99, scriptureRef: '创18:16-33；19:27-28', events: [
        { title: '为所多玛代求', ref: '创18:23-32', summary: '亚伯拉罕为所多玛恳切代求："审判全地的主岂不行公义吗？"次日清晨他回到曾站在耶和华面前之处，望见平原烟气上腾如烧窑一般。' },
      ] },
      { id: 'hebron2', name_zh: '希伯仑（幔利）', name_en: 'Hebron / Mamre', lng: 35.10, lat: 31.53, order: 12, confidence: 'identified', year: -2067, age: 99, scriptureRef: '创17；18:1-15', altar: '幔利橡树前', promise: '"明年这时候，撒拉必给你生一个儿子。"', events: [
        { title: '立约改名与三客显现', ref: '创17；18:10', summary: '神与亚伯兰立约，应许后裔如天上的星，改名亚伯拉罕，立割礼为约的记号；又在幔利橡树前以三位客旅显现，应许撒拉必生以撒。' },
      ] },
      { id: 'gerar', name_zh: '基拉耳', name_en: 'Gerar', lng: 34.58, lat: 31.40, order: 13, confidence: 'identified', year: -2067, age: 99, scriptureRef: '创20', events: [
        { title: '寄居基拉耳', ref: '创20:2-7', summary: '亚伯拉罕寄居基拉耳，又称撒拉为妹子；神在梦中警告亚比米勒，使撒拉得保全，并为亚伯拉罕祷告医好其家。' },
      ] },
      { id: 'beersheba1', name_zh: '别是巴', name_en: 'Beersheba', lng: 34.79, lat: 31.25, order: 14, confidence: 'identified', year: -2066, age: 100, scriptureRef: '创21', altar: '栽种垂丝柳树，求告永生神耶和华的名', events: [
        { title: '以撒出生、与亚比米勒立约', ref: '创21:1-7;22-34', summary: '神照应许使撒拉生以撒，亚伯拉罕一百岁得应许之子；又为水井之争与亚比米勒起誓立约，故名"别是巴"（盟誓之井）。' },
      ] },
      { id: 'moriah', name_zh: '摩利亚地', name_en: 'Land of Moriah', lng: 35.235, lat: 31.778, order: 15, confidence: 'approximate', year: -2051, age: 115, scriptureRef: '创22:1-18', altar: '在山上筑坛，预备献以撒；耶和华以勒', promise: '"地上万国都必因你的后裔得福，因为你听从了我。"', events: [
        { title: '献以撒', ref: '创22:1-14', summary: '神试验亚伯拉罕，吩咐往摩利亚地献独生子以撒为燔祭；亚伯拉罕顺服举刀时天使拦阻，神预备公羊代替，他称那地为"耶和华以勒"。' },
      ] },
      { id: 'beersheba2', name_zh: '别是巴（回程）', name_en: 'Beersheba', lng: 34.79, lat: 31.25, order: 16, confidence: 'identified', year: -2051, age: 115, scriptureRef: '创22:19', events: [
        { title: '回别是巴居住', ref: '创22:19', summary: '于是亚伯拉罕回到他的少年人那里，一同起身往别是巴去，亚伯拉罕就住在别是巴。' },
      ] },
      { id: 'hebron3', name_zh: '希伯仑（幔利）', name_en: 'Hebron / Mamre', lng: 35.10, lat: 31.53, order: 17, confidence: 'identified', year: -2029, age: 137, scriptureRef: '创23:1-2', events: [
        { title: '撒拉离世', ref: '创23:1-2', summary: '撒拉享寿一百二十七岁，死在迦南地的基列亚巴，就是希伯仑；亚伯拉罕为她哀恸哭号。' },
      ] },
      { id: 'machpelah', name_zh: '麦比拉洞', name_en: 'Cave of Machpelah', lng: 35.105, lat: 31.524, order: 18, confidence: 'identified', year: -2029, age: 137, scriptureRef: '创23:3-20；25:9-10', events: [
        { title: '买地立坟、应许之地的第一块产业', ref: '创23:17-20', summary: '亚伯拉罕向赫人以弗仑买下麦比拉田间的洞作坟地，葬了撒拉——这是他在应许之地拥有的第一块产业；日后他自己也葬在此处。' },
      ] },
    ],
  }],
}

// —— 2. 出埃及（复用民数记33章 42站数据）——
const exodus = {
  id: 'exodus',
  title: '出埃及与旷野漂流',
  subtitle: '从兰塞到摩押平原 · 民数记33章 42个安营站',
  era: '约公元前 1446–1406（旷野四十年）',
  badge: '★★★★★',
  bounds: { minLng: 31, maxLng: 36.5, minLat: 27.5, maxLat: 32.5 },
  mode: 'journey',
  layerSelect: 'multi',
  layers: [{
    id: 'route', label: '以色列人路线', color: '#5ec2e8', route: true,
    points: exodusStations.features.map(f => ({
      id: f.properties.id,
      name_zh: f.properties.name_zh,
      name_en: f.properties.name_en,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      order: f.properties.order,
      confidence: f.properties.confidence,
      scriptureRef: f.properties.scriptureRef,
      events: f.properties.events || [],
    })),
  }],
}

// —— 3. 约书亚征服迦南 ——
const joshua = {
  id: 'joshua',
  title: '约书亚征服迦南地图',
  subtitle: '渡约旦河 · 中部 / 南方 / 北方三大战役',
  era: '约公元前 1406–1400',
  badge: '★★★★★',
  bounds: { minLng: 34.2, maxLng: 35.95, minLat: 30.9, maxLat: 33.7 },
  mode: 'journey',
  layerSelect: 'multi',
  layers: [
    { id: 'central', label: '中部战役', color: '#e8b04b', route: true, note: '核心作用：从约旦河谷插入中央山地，切断迦南南北联系。', points: [
      { id: 'jc-shittim', name_zh: '什亭', name_en: 'Shittim', lng: 35.62, lat: 31.84, order: 1, confidence: 'approximate', scriptureRef: '书3:1', events: [
        { title: '从什亭起行', ref: '书3:1', summary: '约书亚清早起来，率全以色列人从什亭（摩押平原的营地）起行，来到约旦河边住宿，等候过河。' } ] },
      { id: 'jc-jordan', name_zh: '约旦河', name_en: 'Jordan River', lng: 35.53, lat: 31.84, order: 2, confidence: 'identified', scriptureRef: '书3:14-17', events: [
        { title: '约旦河分开', ref: '书3:14-17', summary: '祭司抬约柜脚踏入水，约旦河水在亚当城停住立起成垒，全民走干地过河进入应许之地。' } ] },
      { id: 'jc-gilgal', name_zh: '吉甲', name_en: 'Gilgal', lng: 35.50, lat: 31.85, order: 3, confidence: 'approximate', scriptureRef: '书4-5', altar: '立十二块石头为记念；行割礼、守逾越节', events: [
        { title: '立石为记、安营基地', ref: '书4:19-24', summary: '在吉甲立起从河中取来的十二块石头作记念，又行割礼、守逾越节，吉甲成为征战的大本营。' } ] },
      { id: 'jc-jericho', name_zh: '耶利哥', name_en: 'Jericho', lng: 35.44, lat: 31.87, order: 4, confidence: 'identified', scriptureRef: '书6', events: [
        { title: '城墙倒塌', ref: '书6:20', summary: '绕城七日，第七日绕七次、吹角呐喊，城墙塌陷；惟妓女喇合一家因信得救。' } ] },
      { id: 'jc-ai', name_zh: '艾城', name_en: 'Ai', lng: 35.27, lat: 31.92, order: 5, confidence: 'approximate', scriptureRef: '书7-8', events: [
        { title: '亚干的罪与得胜', ref: '书7-8', summary: '亚干私取当灭之物致初战败北；除罪后用伏兵之计攻取艾城。' } ] },
      { id: 'jc-bethel', name_zh: '伯特利附近', name_en: 'Near Bethel', lng: 35.22, lat: 31.93, order: 6, confidence: 'approximate', scriptureRef: '书8:9,17', events: [
        { title: '伏兵与联防之城', ref: '书8:17', summary: '伏兵埋伏在伯特利与艾城中间；伯特利、艾城无一人留下不出来追赶，城门大开，被以色列攻取。' } ] },
      { id: 'jc-ebal', name_zh: '以巴路山', name_en: 'Mt Ebal', lng: 35.27, lat: 32.23, order: 7, confidence: 'identified', scriptureRef: '书8:30-31', altar: '在以巴路山为耶和华筑坛，献燔祭平安祭', events: [
        { title: '筑坛立约', ref: '书8:30-31', summary: '约书亚照摩西所吩咐，在以巴路山为耶和华以色列的神筑了一座坛，是用没有动过铁器的整石头筑的。' } ] },
      { id: 'jc-gerizim', name_zh: '基利心山', name_en: 'Mt Gerizim', lng: 35.27, lat: 32.20, order: 8, confidence: 'identified', scriptureRef: '书8:33', events: [
        { title: '宣读祝福', ref: '书8:33', summary: '一半人站在基利心山前为百姓祝福，一半人站在以巴路山前宣告咒诅，正如摩西先前所吩咐的。' } ] },
      { id: 'jc-shechem', name_zh: '示剑', name_en: 'Shechem', lng: 35.28, lat: 32.21, order: 9, confidence: 'identified', scriptureRef: '书8:34-35；24', events: [
        { title: '宣读全部律法', ref: '书8:34-35', summary: '约书亚将律法上祝福、咒诅的话当着全会众宣读，一无所遗；中央山地的示剑由此被掌控，南北迦南被一分为二。' } ] },
    ] },
    { id: 'south', label: '南方战役（五王联盟）', color: '#ff6b6b', route: true, note: '核心作用：击败耶路撒冷、希伯仑、耶末、拉吉、伊矶伦五王联盟，控制迦南南部。', points: [
      { id: 'js-gilgal', name_zh: '吉甲', name_en: 'Gilgal', lng: 35.50, lat: 31.85, order: 1, confidence: 'approximate', scriptureRef: '书10:7-9', events: [
        { title: '连夜从吉甲出兵', ref: '书10:9', summary: '基遍求救，约书亚和一切兵丁从吉甲整夜上去，猛然临到敌军。' } ] },
      { id: 'js-gibeon', name_zh: '基遍', name_en: 'Gibeon', lng: 35.18, lat: 31.85, order: 2, confidence: 'identified', scriptureRef: '书9-10', events: [
        { title: '基遍人的诡计与日头停住', ref: '书10:12-14', summary: '基遍人骗得和约；五王联军围攻基遍，约书亚驰援，神降大冰雹，他祷告「日头停在基遍」约一日之久。' } ] },
      { id: 'js-bethhoron-up', name_zh: '伯和仑上坡', name_en: 'Upper Beth-horon', lng: 35.10, lat: 31.88, order: 3, confidence: 'approximate', scriptureRef: '书10:10', events: [
        { title: '上坡路追杀', ref: '书10:10', summary: '耶和华使敌军溃乱，以色列人在基遍大大击杀他们，又沿伯和仑的上坡路追赶。' } ] },
      { id: 'js-bethhoron-down', name_zh: '伯和仑下坡', name_en: 'Lower Beth-horon', lng: 35.07, lat: 31.90, order: 4, confidence: 'approximate', scriptureRef: '书10:11', events: [
        { title: '天降大冰雹', ref: '书10:11', summary: '敌人在伯和仑下坡逃跑时，耶和华从天上降大冰雹打死他们，被冰雹打死的比以色列人用刀杀死的还多。' } ] },
      { id: 'js-azekah', name_zh: '亚西加', name_en: 'Azekah', lng: 34.94, lat: 31.70, order: 5, confidence: 'identified', scriptureRef: '书10:10-11', events: [
        { title: '追击直到亚西加', ref: '书10:10', summary: '以色列人追杀敌军直到亚西加和玛基大。' } ] },
      { id: 'js-makkedah', name_zh: '玛基大', name_en: 'Makkedah', lng: 34.95, lat: 31.62, order: 6, confidence: 'approximate', scriptureRef: '书10:16-28', events: [
        { title: '五王藏洞被擒', ref: '书10:16-27', summary: '亚摩利五王逃入玛基大洞，被约书亚擒杀挂在五棵树上；当日又攻取玛基大。' } ] },
      { id: 'js-libnah', name_zh: '立拿', name_en: 'Libnah', lng: 34.87, lat: 31.62, order: 7, confidence: 'approximate', scriptureRef: '书10:29-30', events: [
        { title: '攻取立拿', ref: '书10:29-30', summary: '约书亚从玛基大往立拿去攻打，耶和华将立拿和其王交在以色列人手里。' } ] },
      { id: 'js-lachish', name_zh: '拉吉', name_en: 'Lachish', lng: 34.85, lat: 31.56, order: 8, confidence: 'identified', scriptureRef: '书10:31-32', events: [
        { title: '第二日攻取拉吉', ref: '书10:32', summary: '约书亚安营攻打拉吉，耶和华将拉吉交在以色列人手中，第二日就攻取了。' } ] },
      { id: 'js-gezer', name_zh: '基色援军战场', name_en: 'Gezer (relief)', lng: 34.92, lat: 31.86, order: 9, confidence: 'identified', scriptureRef: '书10:33', events: [
        { title: '基色王援军被歼', ref: '书10:33', summary: '基色王何兰上来帮助拉吉，约书亚将他和他的民都击杀了，没有留下一个。' } ] },
      { id: 'js-eglon', name_zh: '伊矶伦', name_en: 'Eglon', lng: 34.78, lat: 31.60, order: 10, confidence: 'approximate', scriptureRef: '书10:34-35', events: [
        { title: '当日攻取伊矶伦', ref: '书10:35', summary: '从拉吉往伊矶伦去，当日就攻取，用刀击杀城中的人，尽行杀灭。' } ] },
      { id: 'js-hebron', name_zh: '希伯仑', name_en: 'Hebron', lng: 35.10, lat: 31.53, order: 11, confidence: 'identified', scriptureRef: '书10:36-37', events: [
        { title: '攻取希伯仑', ref: '书10:36-37', summary: '约书亚上希伯仑去攻打，夺了城与属城的邑，尽行杀灭，一个不留。' } ] },
      { id: 'js-debir', name_zh: '底璧', name_en: 'Debir', lng: 34.99, lat: 31.42, order: 12, confidence: 'approximate', scriptureRef: '书10:38-39', events: [
        { title: '攻取底璧', ref: '书10:38-39', summary: '约书亚回去攻打底璧，夺了城和属城的邑，将其王与城中的人尽行杀灭。' } ] },
      { id: 'js-negev', name_zh: '南地诸区域', name_en: 'The Negev & Lowland', lng: 34.85, lat: 31.05, order: 13, confidence: 'approximate', scriptureRef: '书10:40-41', events: [
        { title: '击杀全南地', ref: '书10:40', summary: '约书亚击打全地——山地、南地、高原、山坡的诸王，将凡有气息的尽行杀灭，正如耶和华所吩咐的。' } ] },
      { id: 'js-gilgal-r', name_zh: '吉甲（回程）', name_en: 'Gilgal', lng: 35.50, lat: 31.85, order: 14, confidence: 'approximate', scriptureRef: '书10:43', events: [
        { title: '凯旋回营', ref: '书10:43', summary: '于是约书亚和以色列众人回到吉甲的营中。' } ] },
    ] },
    { id: 'north', label: '北方战役（夏琐联盟）', color: '#4ade80', route: true, note: '核心作用：击败夏琐王耶宾领导的北方联盟，摧毁北方最大军事中心夏琐。', points: [
      { id: 'jn-gilgal', name_zh: '吉甲 / 以色列营地', name_en: 'Gilgal Camp', lng: 35.50, lat: 31.85, order: 1, confidence: 'approximate', scriptureRef: '书11:1-6', events: [
        { title: '不要惧怕他们', ref: '书11:6', summary: '夏琐王耶宾招聚北方诸王，军队多如海边的沙；耶和华对约书亚说「你不要因他们惧怕，明日这时我必将他们交付以色列人」。' } ] },
      { id: 'jn-merom', name_zh: '米伦水边', name_en: 'Waters of Merom', lng: 35.45, lat: 32.93, order: 2, confidence: 'approximate', scriptureRef: '书11:5-9', events: [
        { title: '突袭北方联军', ref: '书11:7-8', summary: '约书亚率众猝然临到米伦水边的联军，砍断马蹄筋、用火焚烧战车，将他们击败。' } ] },
      { id: 'jn-sidon', name_zh: '西顿大城方向', name_en: 'Toward Great Sidon', lng: 35.37, lat: 33.56, order: 3, confidence: 'approximate', scriptureRef: '书11:8', events: [
        { title: '追到大西顿', ref: '书11:8', summary: '以色列人追赶敌军，直到西顿大城。' } ] },
      { id: 'jn-misrephoth', name_zh: '米斯利弗玛音', name_en: 'Misrephoth-maim', lng: 35.18, lat: 33.08, order: 4, confidence: 'approximate', scriptureRef: '书11:8', events: [
        { title: '追到米斯利弗玛音', ref: '书11:8', summary: '又追赶敌军直到米斯利弗玛音（沿海一带）。' } ] },
      { id: 'jn-mizpah', name_zh: '东边米斯巴谷', name_en: 'Valley of Mizpah (east)', lng: 35.58, lat: 33.20, order: 5, confidence: 'approximate', scriptureRef: '书11:8', events: [
        { title: '追到米斯巴平原', ref: '书11:8', summary: '又往东追到米斯巴的平原（谷地），将他们击杀，没有留下一个。' } ] },
      { id: 'jn-hazor', name_zh: '夏琐', name_en: 'Hazor', lng: 35.57, lat: 33.02, order: 6, confidence: 'identified', scriptureRef: '书11:10-13', events: [
        { title: '焚烧夏琐', ref: '书11:10-11', summary: '夏琐素来是这诸国的首；约书亚回来夺取，用刀杀了夏琐王，将城中之人尽行杀灭，又用火焚烧夏琐。' } ] },
      { id: 'jn-cities', name_zh: '北方诸城', name_en: 'Northern Royal Cities', lng: 35.50, lat: 32.80, order: 7, confidence: 'approximate', scriptureRef: '书11:12-14', events: [
        { title: '夺取诸王城邑', ref: '书11:12-14', summary: '约书亚夺了北方诸王的城邑，掳掠各城的财物牲畜，但除夏琐外那些立在山冈上的城都未焚烧。' } ] },
      { id: 'jn-hills', name_zh: '北方山地', name_en: 'Northern Hill Country', lng: 35.40, lat: 32.70, order: 8, confidence: 'approximate', scriptureRef: '书11:16', events: [
        { title: '取了全境山地', ref: '书11:16', summary: '约书亚夺了那全地，就是山地、南地、歌珊全地、高原、山坡，全都收取。' } ] },
      { id: 'jn-arabah', name_zh: '亚拉巴', name_en: 'The Arabah', lng: 35.55, lat: 32.40, order: 9, confidence: 'approximate', scriptureRef: '书11:16；12:3', events: [
        { title: '亚拉巴谷地', ref: '书11:16', summary: '所取之地也包括亚拉巴（约旦河谷的裂谷低地）。' } ] },
      { id: 'jn-chinneroth', name_zh: '基尼烈南边', name_en: 'South of Chinneroth', lng: 35.58, lat: 32.70, order: 10, confidence: 'approximate', scriptureRef: '书11:2；12:3', events: [
        { title: '基尼烈南边的亚拉巴', ref: '书12:3', summary: '其疆界从基尼烈湖（加利利海）南边的亚拉巴一带，直到盐海。' } ] },
      { id: 'jn-lowland', name_zh: '低地', name_en: 'The Lowland (Shephelah)', lng: 34.95, lat: 31.70, order: 11, confidence: 'approximate', scriptureRef: '书11:16', events: [
        { title: '高原与低地', ref: '书11:16', summary: '约书亚也取了西边的低地（示非拉丘陵），全境尽归以色列。' } ] },
      { id: 'jn-dor', name_zh: '多珥高地', name_en: 'Heights of Dor', lng: 34.92, lat: 32.62, order: 12, confidence: 'approximate', scriptureRef: '书11:2；12:23', events: [
        { title: '多珥的高地', ref: '书11:2', summary: '北方山地与西边多珥的高地（拿弗多珥）一并被征服，北方联盟彻底瓦解。' } ] },
    ] },
  ],
}

// —— 4. 十二支派分地 ——
const tribes = {
  id: 'tribes',
  title: '十二支派分地地图',
  subtitle: '约书亚记13–19章 · 迦南地的产业分配',
  era: '约公元前 1400',
  badge: '★★★★★',
  bounds: { minLng: 34.2, maxLng: 36.5, minLat: 30.0, maxLat: 33.6 },
  mode: 'journey',
  layerSelect: 'multi',
  layers: [
    { id: 'west', label: '约旦河西', color: '#e8b04b', route: false, points: [
      { id: 'asher', name_zh: '亚设', name_en: 'Asher', lng: 35.18, lat: 33.05, confidence: 'approximate', scriptureRef: '书19:24-31', note: '西北沿海，近推罗、西顿。' , events: [] },
      { id: 'naphtali', name_zh: '拿弗他利', name_en: 'Naphtali', lng: 35.50, lat: 32.95, confidence: 'approximate', scriptureRef: '书19:32-39', note: '加利利海以北山地。', events: [] },
      { id: 'zebulun', name_zh: '西布伦', name_en: 'Zebulun', lng: 35.20, lat: 32.70, confidence: 'approximate', scriptureRef: '书19:10-16', note: '加利利下游，拿撒勒一带。', events: [] },
      { id: 'issachar', name_zh: '以萨迦', name_en: 'Issachar', lng: 35.45, lat: 32.55, confidence: 'approximate', scriptureRef: '书19:17-23', note: '耶斯列平原。', events: [] },
      { id: 'manasseh-w', name_zh: '玛拿西（西半）', name_en: 'Manasseh (W)', lng: 35.25, lat: 32.35, confidence: 'approximate', scriptureRef: '书17:1-13', note: '撒玛利亚山地。', events: [] },
      { id: 'ephraim', name_zh: '以法莲', name_en: 'Ephraim', lng: 35.25, lat: 32.10, confidence: 'approximate', scriptureRef: '书16:1-10', note: '中部山地，示罗会幕所在。', events: [
        { title: '示罗设立会幕', ref: '书18:1', summary: '以色列全会众在示罗（以法莲境内）设立会幕，此后成为敬拜中心，直到撒母耳时代。' },
      ] },
      { id: 'dan', name_zh: '但', name_en: 'Dan', lng: 34.90, lat: 31.95, confidence: 'approximate', scriptureRef: '书19:40-48', note: '原分沿海，后部分北迁至拉亿（但城）。', events: [] },
      { id: 'benjamin', name_zh: '便雅悯', name_en: 'Benjamin', lng: 35.22, lat: 31.85, confidence: 'approximate', scriptureRef: '书18:11-28', note: '耶路撒冷、伯特利、基遍一带。', events: [] },
      { id: 'judah', name_zh: '犹大', name_en: 'Judah', lng: 35.05, lat: 31.45, confidence: 'approximate', scriptureRef: '书15章', note: '最大的产业，南方山地与旷野；日后南国的核心。', events: [] },
      { id: 'simeon', name_zh: '西缅', name_en: 'Simeon', lng: 34.80, lat: 31.25, confidence: 'approximate', scriptureRef: '书19:1-9', note: '在犹大境内，别是巴一带。', events: [] },
    ] },
    { id: 'east', label: '约旦河东', color: '#5ec2e8', route: false, points: [
      { id: 'reuben', name_zh: '流便', name_en: 'Reuben', lng: 35.75, lat: 31.55, confidence: 'approximate', scriptureRef: '书13:15-23', note: '死海以东摩押高原。', events: [] },
      { id: 'gad', name_zh: '迦得', name_en: 'Gad', lng: 35.80, lat: 32.10, confidence: 'approximate', scriptureRef: '书13:24-28', note: '基列中部。', events: [] },
      { id: 'manasseh-e', name_zh: '玛拿西（东半）', name_en: 'Manasseh (E)', lng: 35.95, lat: 32.70, confidence: 'approximate', scriptureRef: '书13:29-31', note: '巴珊与基列北部。', events: [] },
    ] },
    { id: 'levi', label: '利未（无地业）', color: '#c084fc', route: false, points: [
      { id: 'shiloh', name_zh: '示罗（会幕）', name_en: 'Shiloh', lng: 35.29, lat: 32.05, confidence: 'identified', scriptureRef: '书18:1；21章', altar: '会幕设立之地', note: '利未人不得地业，耶和华是他们的产业；他们分得48座利未人的城（含6座逃城）散居各支派中。', events: [] },
    ] },
  ],
}

// —— 5. 大卫王统一王国 ——
const david = {
  id: 'david',
  title: '大卫王统一王国地图',
  subtitle: '从伯利恒牧童到耶路撒冷君王 · 疆域的扩张',
  era: '约公元前 1010–970',
  badge: '★★★★★',
  bounds: { minLng: 33.5, maxLng: 37.0, minLat: 29.5, maxLat: 34.2 },
  mode: 'journey',
  layerSelect: 'multi',
  regions: [
    {
      id: 'david-core',
      label: '以色列核心疆域',
      color: '#e8b04b',
      center: [35.18, 32.18],
      polygon: [[34.70, 33.25], [35.38, 33.25], [35.70, 32.70], [35.62, 31.85], [35.36, 31.18], [34.78, 31.05], [34.58, 31.55], [34.70, 32.35], [34.70, 33.25]],
    },
    {
      id: 'david-philistia',
      label: '非利士沿海',
      color: '#ff8f70',
      center: [34.70, 31.55],
      polygon: [[34.35, 32.05], [34.80, 32.05], [34.92, 31.18], [34.50, 31.05], [34.35, 32.05]],
    },
    {
      id: 'david-east',
      label: '摩押·亚扪·以东',
      color: '#7dd3fc',
      center: [35.92, 31.35],
      polygon: [[35.62, 32.25], [36.30, 32.20], [36.52, 30.35], [35.25, 29.78], [35.20, 31.00], [35.62, 32.25]],
    },
    {
      id: 'david-aram',
      label: '亚兰/大马士革势力范围',
      color: '#c084fc',
      center: [36.18, 33.25],
      polygon: [[35.58, 33.75], [36.55, 33.78], [36.78, 32.82], [35.62, 32.55], [35.58, 33.75]],
    },
  ],
  boundaries: [
    { id: 'dan-beersheba-d', label: '但到别是巴', color: '#f8fafc', path: [[35.65, 33.25], [35.40, 32.45], [35.25, 31.95], [35.05, 31.45], [34.79, 31.25]], dashed: true },
  ],
  layers: [
    { id: 'rise', label: '兴起之路', color: '#e8b04b', route: true, points: [
      { id: 'bethlehem-d', name_zh: '伯利恒', name_en: 'Bethlehem', lng: 35.20, lat: 31.70, order: 1, confidence: 'identified', year: -1040, scriptureRef: '撒上16', events: [
        { title: '撒母耳膏立少年大卫', ref: '撒上16:13', summary: '耶和华拣选耶西最小的儿子；撒母耳用角里的膏油膏他，耶和华的灵从那日起感动大卫。' },
      ] },
      { id: 'elah', name_zh: '以拉谷', name_en: 'Valley of Elah', lng: 34.96, lat: 31.69, order: 2, confidence: 'approximate', scriptureRef: '撒上17', events: [
        { title: '击杀歌利亚', ref: '撒上17:49-50', summary: '少年大卫凭信心奉万军之耶和华的名，用机弦甩石击倒非利士巨人歌利亚。' },
      ] },
      { id: 'adullam', name_zh: '亚杜兰洞', name_en: 'Adullam', lng: 34.99, lat: 31.65, order: 3, confidence: 'approximate', scriptureRef: '撒上22:1-2', events: [
        { title: '逃避扫罗、聚集勇士', ref: '撒上22:1-2', summary: '凡受窘迫、欠债、心里苦恼的都聚到大卫那里，约四百人，他作他们的首领。' },
      ] },
      { id: 'engedi', name_zh: '隐基底', name_en: 'En-gedi', lng: 35.39, lat: 31.46, order: 4, confidence: 'identified', scriptureRef: '撒上24', events: [
        { title: '不杀扫罗', ref: '撒上24:4-7', summary: '扫罗入洞，大卫只割其外袍衣襟，不肯害耶和华的受膏者。' },
      ] },
      { id: 'ziklag', name_zh: '洗革拉', name_en: 'Ziklag', lng: 34.62, lat: 31.40, order: 5, confidence: 'approximate', scriptureRef: '撒上27;30', events: [
        { title: '寄居非利士与追回掳物', ref: '撒上30', summary: '大卫暂居非利士地洗革拉；亚玛力人焚城掳人，大卫求问神后追击，尽数夺回。' },
      ] },
    ] },
    { id: 'reign', label: '建都与扩张', color: '#ff6b6b', route: true, points: [
      { id: 'hebron-d', name_zh: '希伯仑', name_en: 'Hebron', lng: 35.10, lat: 31.53, order: 6, confidence: 'identified', year: -1010, scriptureRef: '撒下2;5', events: [
        { title: '作犹大王七年半', ref: '撒下5:5', summary: '大卫先在希伯仑作犹大王，后众支派来归，膏他作全以色列的王。' },
      ] },
      { id: 'jerusalem-d', name_zh: '耶路撒冷（锡安）', name_en: 'Jerusalem', lng: 35.235, lat: 31.778, order: 7, confidence: 'identified', year: -1003, scriptureRef: '撒下5:6-9;6', altar: '迎约柜进城，在亚劳拿禾场筑坛', events: [
        { title: '攻取耶布斯、定为京城', ref: '撒下5:6-9', summary: '大卫攻取耶布斯人的锡安保障，称为"大卫的城"，统一王国的政治与敬拜中心。' },
        { title: '迎约柜、神立永约', ref: '撒下6;7', summary: '大卫将约柜接进城；神借拿单应许大卫的国位必坚定到永远（弥赛亚之约）。' },
      ] },
      { id: 'dan-d', name_zh: '但', name_en: 'Dan', lng: 35.65, lat: 33.25, order: 7.2, confidence: 'identified', scriptureRef: '撒下24:6；撒下3:10', note: '传统表达“从但到别是巴”的北端。', events: [] },
      { id: 'beersheba-d', name_zh: '别是巴', name_en: 'Beersheba', lng: 34.79, lat: 31.25, order: 7.4, confidence: 'identified', scriptureRef: '撒下3:10；撒下24:7', note: '传统表达“从但到别是巴”的南端。', events: [] },
      { id: 'philistia', name_zh: '非利士（迦特）', name_en: 'Philistia', lng: 34.85, lat: 31.70, order: 8, confidence: 'approximate', scriptureRef: '撒下5:17-25', events: [
        { title: '制伏世仇非利士', ref: '撒下5:25', summary: '大卫两次在利乏音谷击败非利士人，解除西方威胁。' },
      ] },
      { id: 'rabbah', name_zh: '拉巴（亚扪）', name_en: 'Rabbah', lng: 35.93, lat: 31.95, order: 9, confidence: 'identified', scriptureRef: '撒下12:26-31', events: [
        { title: '征服亚扪', ref: '撒下12', summary: '约押围攻、大卫攻取亚扪京城拉巴（今安曼）。围城期间发生大卫与拔示巴之罪。' },
      ] },
      { id: 'moab-d', name_zh: '摩押', name_en: 'Moab', lng: 35.70, lat: 31.20, order: 9.2, confidence: 'approximate', scriptureRef: '撒下8:2', note: '大卫击败摩押，使其进贡。', events: [] },
      { id: 'edom-d', name_zh: '以东', name_en: 'Edom', lng: 35.35, lat: 30.55, order: 9.4, confidence: 'approximate', scriptureRef: '撒下8:13-14', note: '大卫在以东全地设防营，以东人归服。', events: [] },
      { id: 'damascus-d', name_zh: '大马士革（亚兰）', name_en: 'Damascus', lng: 36.30, lat: 33.51, order: 10, confidence: 'identified', scriptureRef: '撒下8:5-6', events: [
        { title: '疆界达伯拉大河', ref: '撒下8', summary: '大卫击败亚兰、摩押、以东、琐巴，使版图北达大马士革，奠定所罗门帝国的疆域。' },
      ] },
    ] },
  ],
}

// —— 6. 所罗门王国（黄金时代与贸易网络）——
const solomon = {
  id: 'solomon',
  title: '所罗门王国地图',
  subtitle: '圣殿 · 红海港口 · 古代贸易网络',
  era: '约公元前 970–930',
  badge: '★★★★★',
  bounds: { minLng: 28, maxLng: 48, minLat: 13, maxLat: 35 },
  mode: 'journey',
  layerSelect: 'multi',
  regions: [
    {
      id: 'solomon-core',
      label: '核心王国（但至别是巴）',
      color: '#e8b04b',
      center: [35.18, 32.15],
      polygon: [[34.65, 33.28], [35.50, 33.28], [35.82, 32.35], [35.52, 31.20], [34.78, 31.02], [34.55, 31.70], [34.65, 33.28]],
    },
    {
      id: 'solomon-influence',
      label: '所罗门势力范围',
      color: '#5ec2e8',
      center: [36.95, 32.25],
      polygon: [[31.05, 30.20], [34.30, 31.10], [35.10, 33.10], [36.30, 33.55], [38.35, 34.60], [40.10, 34.85], [39.20, 33.45], [36.35, 31.80], [35.05, 29.55], [31.05, 30.20]],
    },
    {
      id: 'solomon-trade-zone',
      label: '红海与香料商路',
      color: '#f472b6',
      center: [39.25, 23.00],
      polygon: [[34.80, 29.80], [36.80, 27.10], [42.40, 17.60], [45.20, 15.20], [43.20, 14.40], [38.30, 20.20], [34.80, 29.80]],
    },
  ],
  boundaries: [
    { id: 'solomon-euphrates-egypt', label: '伯拉河至埃及边界', color: '#f8fafc', path: [[40.10, 34.85], [38.27, 34.56], [36.30, 33.51], [35.24, 31.78], [34.98, 29.54], [31.20, 30.05]], dashed: true },
  ],
  layers: [
    { id: 'core', label: '王国核心', color: '#e8b04b', route: false, points: [
      { id: 'temple', name_zh: '耶路撒冷圣殿', name_en: 'The Temple', lng: 35.235, lat: 31.778, confidence: 'identified', year: -966, scriptureRef: '王上6-8', altar: '建造耶和华的殿，献殿祷告，荣耀充满', events: [
        { title: '建造圣殿', ref: '王上6:1', summary: '出埃及后第480年、所罗门在位第四年开工，历时七年建成；推罗王希兰供应香柏木与匠人。' },
        { title: '献殿与神的荣耀', ref: '王上8:10-11', summary: '约柜安放至圣所，云彩充满殿宇，耶和华的荣光充满圣殿；所罗门献上著名的献殿祷告。' },
      ] },
      { id: 'hazor-s', name_zh: '夏琐', name_en: 'Hazor', lng: 35.57, lat: 33.02, confidence: 'identified', scriptureRef: '王上9:15', note: '所罗门修筑的战略城之一。', events: [] },
      { id: 'megiddo-s', name_zh: '米吉多', name_en: 'Megiddo', lng: 35.18, lat: 32.58, confidence: 'identified', scriptureRef: '王上9:15', note: '控制耶斯列平原与沿海大道的战略城。', events: [] },
      { id: 'gezer-s', name_zh: '基色', name_en: 'Gezer', lng: 34.92, lat: 31.86, confidence: 'identified', scriptureRef: '王上9:15-17', note: '法老攻取后赐给女儿，所罗门重建。', events: [] },
      { id: 'dan-s', name_zh: '但', name_en: 'Dan', lng: 35.65, lat: 33.25, confidence: 'identified', scriptureRef: '代下30:5', note: '以色列北端地标。', events: [] },
      { id: 'beersheba-s', name_zh: '别是巴', name_en: 'Beersheba', lng: 34.79, lat: 31.25, confidence: 'identified', scriptureRef: '代下30:5', note: '以色列南端地标。', events: [] },
    ] },
    { id: 'trade', label: '贸易与外交', color: '#5ec2e8', route: true, points: [
      { id: 'tyre', name_zh: '推罗', name_en: 'Tyre', lng: 35.20, lat: 33.27, order: 1, confidence: 'identified', scriptureRef: '王上5;9:11', note: '腓尼基海上强国。', events: [
        { title: '希兰王的香柏木', ref: '王上5:6-10', summary: '推罗王希兰供应黎巴嫩的香柏木、松木与工匠，换取以色列的麦子与油，结盟修好。' },
      ] },
      { id: 'eziongeber', name_zh: '以旬迦别', name_en: 'Ezion-geber', lng: 34.98, lat: 29.54, order: 2, confidence: 'identified', scriptureRef: '王上9:26-28', note: '红海北端（亚喀巴湾）港口。', events: [
        { title: '红海船队往俄斐', ref: '王上9:26-28', summary: '所罗门在以东红海边建造船队，由推罗熟悉航海的人协助，从俄斐运回大量黄金。' },
      ] },
      { id: 'egypt-s', name_zh: '埃及', name_en: 'Egypt', lng: 31.20, lat: 30.05, order: 3, confidence: 'approximate', scriptureRef: '王上3:1;10:28-29', note: '联姻与战马、战车贸易。', events: [
        { title: '法老之女与马匹贸易', ref: '王上10:28-29', summary: '所罗门娶法老女儿为妻；从埃及进口战马战车，转售赫人和亚兰诸王，居中获利。' },
      ] },
      { id: 'tadmor', name_zh: '达莫（帕尔米拉）', name_en: 'Tadmor', lng: 38.27, lat: 34.56, order: 4, confidence: 'identified', scriptureRef: '王上9:18；代下8:4', note: '旷野中的商队要塞。', events: [
        { title: '建造旷野贸易城', ref: '代下8:4', summary: '所罗门在旷野建造达莫和积货城，控制通往美索不达米亚的商道。' },
      ] },
      { id: 'sheba', name_zh: '示巴', name_en: 'Sheba', lng: 45.00, lat: 15.40, order: 5, confidence: 'approximate', scriptureRef: '王上10:1-13', note: '阿拉伯半岛南端（今也门一带）的香料王国。', events: [
        { title: '示巴女王来访', ref: '王上10:1-10', summary: '示巴女王听见所罗门的智慧名声，带香料、宝石、大量黄金前来用难题试他；见其智慧与圣殿，诧异得神不守舍。' },
      ] },
    ] },
  ],
}

// —— 7. 北国南国历史（时间轴）——
const dividedKingdom = {
  id: 'divided',
  title: '北国南国历史地图',
  subtitle: '王国分裂 → 北国被掳 → 南国被掳 · 拖动时间轴看局势',
  era: '公元前 931–586',
  badge: '★★★★★',
  bounds: { minLng: 33.5, maxLng: 45.5, minLat: 30.0, maxLat: 37.5 },
  mode: 'timeline',
  layerSelect: 'multi',
  years: { min: -931, max: -586, default: -931, step: 1 },
  regions: [
    {
      id: 'north-kingdom',
      label: '北国以色列',
      color: '#5ec2e8',
      center: [35.30, 32.55],
      showFrom: -931,
      showTo: -722,
      polygon: [[34.70, 33.25], [35.65, 33.25], [36.05, 32.72], [35.82, 31.95], [35.32, 31.88], [35.04, 32.00], [34.78, 32.46], [34.70, 33.25]],
    },
    {
      id: 'south-kingdom',
      label: '南国犹大',
      color: '#e8b04b',
      center: [35.08, 31.35],
      showFrom: -931,
      showTo: -586,
      polygon: [[34.58, 31.92], [35.32, 31.92], [35.56, 31.10], [35.18, 30.62], [34.55, 30.82], [34.58, 31.92]],
    },
    {
      id: 'assyria-shadow',
      label: '亚述压力',
      color: '#ff6b6b',
      center: [39.20, 35.30],
      showFrom: -745,
      showTo: -609,
      polygon: [[36.10, 34.00], [43.15, 36.36], [44.60, 35.10], [39.80, 33.20], [35.75, 32.30], [36.10, 34.00]],
    },
    {
      id: 'babylon-shadow',
      label: '巴比伦压力',
      color: '#c084fc',
      center: [41.30, 32.60],
      showFrom: -625,
      showTo: -586,
      polygon: [[35.24, 31.78], [40.00, 34.00], [44.42, 32.54], [43.70, 31.50], [38.30, 31.10], [35.24, 31.78]],
    },
  ],
  boundaries: [
    { id: 'israel-judah-border', label: '北国/南国边界', color: '#f8fafc', path: [[34.72, 31.92], [35.00, 31.97], [35.28, 31.92], [35.55, 31.78]], dashed: true, showFrom: -931, showTo: -722 },
  ],
  eras: [
    { label: '王国分裂', from: -931, to: -875 },
    { label: '先知时代', from: -874, to: -750 },
    { label: '北国灭亡', from: -749, to: -700 },
    { label: '南国灭亡', from: -699, to: -586 },
  ],
  layers: [
    { id: 'israel', label: '北国以色列', color: '#5ec2e8', route: false, points: [
      { id: 'shechem-n', name_zh: '示剑', name_en: 'Shechem', lng: 35.28, lat: 32.21, year: -931, confidence: 'identified', scriptureRef: '王上12', events: [
        { title: '王国分裂', ref: '王上12:16-20', summary: '罗波安拒绝减轻劳役，北方十支派拥立耶罗波安，国分为二；耶罗波安以示剑为初都。' },
      ] },
      { id: 'dan-n', name_zh: '但（金牛犊）', name_en: 'Dan', lng: 35.65, lat: 33.25, year: -930, confidence: 'identified', scriptureRef: '王上12:29-30', events: [
        { title: '北端敬拜中心', ref: '王上12:29-30', summary: '耶罗波安在但和伯特利设立金牛犊，成为北国持续的罪。' },
      ] },
      { id: 'bethel-n', name_zh: '伯特利（金牛犊）', name_en: 'Bethel', lng: 35.22, lat: 31.93, year: -930, confidence: 'identified', scriptureRef: '王上12:29-33', events: [
        { title: '南端敬拜中心', ref: '王上12:29-33', summary: '伯特利靠近南北边界，成为北国替代耶路撒冷圣殿的政治性敬拜中心。' },
      ] },
      { id: 'tirzah-n', name_zh: '得撒', name_en: 'Tirzah', lng: 35.33, lat: 32.28, year: -910, confidence: 'approximate', scriptureRef: '王上14:17；15:21', note: '早期北国王城之一。', events: [] },
      { id: 'samaria', name_zh: '撒玛利亚', name_en: 'Samaria', lng: 35.19, lat: 32.28, year: -880, confidence: 'identified', scriptureRef: '王上16:24', events: [
        { title: '暗利建都撒玛利亚', ref: '王上16:24', summary: '暗利买下撒玛利亚山建为北国京城，亚哈继位后引入巴力崇拜。' },
      ] },
      { id: 'jezreel-n', name_zh: '耶斯列', name_en: 'Jezreel', lng: 35.33, lat: 32.56, year: -870, confidence: 'identified', scriptureRef: '王上21；王下9', note: '亚哈王宫与拿伯葡萄园故事相关。', events: [] },
      { id: 'carmel', name_zh: '迦密山', name_en: 'Mt Carmel', lng: 35.03, lat: 32.73, year: -860, confidence: 'identified', scriptureRef: '王上18', events: [
        { title: '以利亚斗巴力先知', ref: '王上18:36-39', summary: '先知以利亚在迦密山求火降下，证明耶和华是神，众民俯伏说"耶和华是神"。' },
      ] },
      { id: 'samaria-fall', name_zh: '撒玛利亚陷落', name_en: 'Fall of Samaria', lng: 35.19, lat: 32.28, year: -722, confidence: 'identified', scriptureRef: '王下17', events: [
        { title: '北国被亚述所灭', ref: '王下17:6', summary: '亚述王撒缦以色围困三年攻陷撒玛利亚，将以色列人掳到亚述，十支派分散；先知何西阿、阿摩司曾警告。' },
      ] },
    ] },
    { id: 'judah', label: '南国犹大', color: '#e8b04b', route: false, points: [
      { id: 'jerusalem-j', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.235, lat: 31.778, year: -931, confidence: 'identified', scriptureRef: '王上12', events: [
        { title: '南国京城', ref: '王上12:21', summary: '大卫家罗波安保有犹大、便雅悯，以耶路撒冷为都；圣殿仍在，王位由大卫后裔承袭。' },
      ] },
      { id: 'bethlehem-j', name_zh: '伯利恒', name_en: 'Bethlehem', lng: 35.20, lat: 31.70, year: -931, confidence: 'identified', scriptureRef: '弥5:2', note: '大卫之城，弥赛亚应许相关。', events: [] },
      { id: 'hebron-j', name_zh: '希伯仑', name_en: 'Hebron', lng: 35.10, lat: 31.53, year: -931, confidence: 'identified', scriptureRef: '撒下2:1-4', note: '大卫早年作犹大王的城。', events: [] },
      { id: 'lachish-j', name_zh: '拉吉', name_en: 'Lachish', lng: 34.85, lat: 31.56, year: -701, confidence: 'identified', scriptureRef: '王下18:13-14', note: '南国西南重镇，亚述西拿基立曾攻取。', events: [] },
      { id: 'beersheba-j', name_zh: '别是巴', name_en: 'Beersheba', lng: 34.79, lat: 31.25, year: -931, confidence: 'identified', scriptureRef: '代下30:5', note: '南地重镇。', events: [] },
      { id: 'isaiah', name_zh: '希西家的耶路撒冷', name_en: 'Hezekiah', lng: 35.235, lat: 31.778, year: -701, confidence: 'identified', scriptureRef: '王下18-19', events: [
        { title: '亚述围城与神的拯救', ref: '王下19:35', summary: '亚述王西拿基立围困耶路撒冷，先知以赛亚宣告神必护卫此城；耶和华的使者一夜击杀亚述军十八万五千，城得保全。' },
      ] },
      { id: 'jerusalem-fall', name_zh: '耶路撒冷陷落', name_en: 'Fall of Jerusalem', lng: 35.235, lat: 31.778, year: -586, confidence: 'identified', scriptureRef: '王下25', events: [
        { title: '南国被巴比伦所灭', ref: '王下25:8-11', summary: '巴比伦王尼布甲尼撒攻破耶路撒冷，焚毁圣殿与城，掳走犹大人；先知耶利米目睹并哀哭。' },
      ] },
    ] },
    { id: 'empires', label: '列强', color: '#ff6b6b', route: false, points: [
      { id: 'nineveh', name_zh: '尼尼微（亚述）', name_en: 'Nineveh', lng: 43.15, lat: 36.36, year: -722, confidence: 'identified', scriptureRef: '拿1;王下17', events: [
        { title: '亚述帝国', ref: '王下17', summary: '亚述以尼尼微为都，灭北国；先知约拿曾奉差往尼尼微宣讲悔改。' },
      ] },
      { id: 'babylon', name_zh: '巴比伦', name_en: 'Babylon', lng: 44.42, lat: 32.54, year: -586, confidence: 'identified', scriptureRef: '王下25;诗137', events: [
        { title: '巴比伦帝国与被掳', ref: '诗137:1', summary: '"我们曾在巴比伦的河边坐下，一追想锡安就哭了。"犹大人被掳至此七十年，但以理、以西结在此事奉。' },
      ] },
    ] },
  ],
}

// —— 8. 耶稣生平 ——
const jesus = {
  id: 'jesus',
  title: '耶稣生平地图',
  subtitle: '降生 → 受洗 → 传道 → 受难周 → 复活与升天 · 28站全程',
  era: '约公元前 5 – 公元 30/33',
  badge: '★★★★★',
  bounds: { minLng: 31.0, maxLng: 36.2, minLat: 29.8, maxLat: 33.2 },
  mode: 'journey',
  layerSelect: 'multi',
  layers: [{
    id: 'life', label: '生平足迹', color: '#e8b04b', route: true, points: [
      { id: 'bethlehem-j', name_zh: '伯利恒', name_en: 'Bethlehem', lng: 35.20, lat: 31.70, order: 1, confidence: 'identified', scriptureRef: '路2:1-20;太2:1-12', events: [
        { title: '道成肉身降生', ref: '路2:7', summary: '耶稣在伯利恒的马槽降生，天使向牧羊人报大喜信息，东方博士前来朝拜，应验弥迦书「伯利恒…将来必有一位为我作以色列的君王」。' },
      ] },
      { id: 'egypt-j', name_zh: '埃及', name_en: 'Egypt', lng: 31.80, lat: 30.80, order: 2, confidence: 'approximate', scriptureRef: '太2:13-15', events: [
        { title: '逃往埃及避难', ref: '太2:14-15', summary: '希律王要杀婴孩，约瑟夜间带马利亚与圣婴逃往埃及，应验「我从埃及召出我的儿子」，待希律死后才返回。' },
      ] },
      { id: 'nazareth-j', name_zh: '拿撒勒', name_en: 'Nazareth', lng: 35.30, lat: 32.70, order: 3, confidence: 'identified', scriptureRef: '太2:19-23;路2:39-52', events: [
        { title: '在拿撒勒成长', ref: '路2:51-52', summary: '一家回到加利利的拿撒勒定居，耶稣在此长大，「智慧和身量，并神和人喜爱他的心，都一齐增长」。' },
      ] },
      { id: 'jordan-j', name_zh: '约旦河', name_en: 'Jordan River', lng: 35.531, lat: 31.838, order: 4, confidence: 'approximate', scriptureRef: '太3:13-17', events: [
        { title: '约旦河受洗', ref: '太3:16-17', summary: '约翰为耶稣施洗，天开了，圣灵仿佛鸽子降下，有声音说：「这是我的爱子，我所喜悦的。」' },
      ] },
      { id: 'wilderness-j', name_zh: '犹太旷野', name_en: 'Judean Wilderness', lng: 35.43, lat: 31.83, order: 5, confidence: 'approximate', scriptureRef: '太4:1-11;路4:1-13', events: [
        { title: '旷野受试探', ref: '太4:1-4', summary: '耶稣被圣灵引到旷野禁食四十昼夜，三次胜过魔鬼的试探，皆以「经上记着说」回应，作我们的中保得胜者。' },
      ] },
      { id: 'capernaum-j', name_zh: '迦百农', name_en: 'Capernaum', lng: 35.57, lat: 32.88, order: 6, confidence: 'identified', scriptureRef: '太4:13-25;可1-2', events: [
        { title: '加利利传道（以迦百农为中心）', ref: '太4:13-17', summary: '耶稣以迦百农为加利利事工基地，呼召门徒、登山宝训、医病赶鬼、平静风浪、五饼二鱼，宣讲「天国近了」。' },
      ] },
      { id: 'sychar-j', name_zh: '撒马利亚·叙加', name_en: 'Sychar, Samaria', lng: 35.281, lat: 32.207, order: 7, confidence: 'identified', scriptureRef: '约4:1-42', events: [
        { title: '叙加井边的对话', ref: '约4:13-14', summary: '耶稣在雅各井边向撒马利亚妇人启示自己是弥赛亚，应许「活水」永远不渴，全城因她的见证信主。' },
      ] },
      { id: 'jerusalem-temple-j', name_zh: '耶路撒冷·圣殿', name_en: 'Jerusalem Temple', lng: 35.2354, lat: 31.7780, order: 8, confidence: 'identified', scriptureRef: '约5;7;10', events: [
        { title: '多次上耶路撒冷过节', ref: '约7:14', summary: '耶稣多次在节期上耶路撒冷圣殿教训人——医治病三十八年的人、自称「世界的光」「我与父原为一」，引发宗教领袖的敌意。' },
      ] },
      { id: 'bethany-lazarus-j', name_zh: '伯大尼·拉撒路之家', name_en: 'Bethany (Lazarus)', lng: 35.2566, lat: 31.7717, order: 9, confidence: 'identified', scriptureRef: '约11:1-44', events: [
        { title: '叫拉撒路复活', ref: '约11:25', summary: '耶稣来到马大、马利亚、拉撒路之家，宣告「复活在我，生命也在我」，叫死了四天的拉撒路从坟墓里出来。' },
      ] },
      { id: 'jericho-j', name_zh: '耶利哥', name_en: 'Jericho', lng: 35.444, lat: 31.857, order: 10, confidence: 'identified', scriptureRef: '路19:1-10;可10:46-52', events: [
        { title: '撒该与瞎子', ref: '路19:9-10', summary: '耶稣经过耶利哥，医治瞎子巴底买，又住进税吏长撒该家：「人子来，为要寻找拯救失丧的人。」' },
      ] },
      { id: 'bethany-anoint-j', name_zh: '伯大尼（受膏）', name_en: 'Bethany', lng: 35.2566, lat: 31.7710, order: 11, confidence: 'identified', scriptureRef: '约12:1-8;太26:6-13', events: [
        { title: '马利亚香膏抹主', ref: '约12:7', summary: '逾越节前六日，耶稣在伯大尼，马利亚用极贵的真哪哒香膏抹主，为他的安葬预先膏身。' },
      ] },
      { id: 'bethphage-j', name_zh: '伯法其·橄榄山', name_en: 'Bethphage / Mt. Olives', lng: 35.2480, lat: 31.7790, order: 12, confidence: 'identified', scriptureRef: '太21:1-7;可11:1-7', events: [
        { title: '橄榄山下备驴驹', ref: '太21:2-5', summary: '耶稣在伯法其、橄榄山打发门徒牵来驴驹，应验撒迦利亚书「你的王…骑着驴驹来到你这里」。' },
      ] },
      { id: 'triumphal-entry-j', name_zh: '荣入耶路撒冷', name_en: 'Triumphal Entry', lng: 35.2330, lat: 31.7770, order: 13, confidence: 'identified', scriptureRef: '太21:8-11;约12:12-19', events: [
        { title: '棕枝主日荣入圣城', ref: '太21:9', summary: '众人把衣服与棕树枝铺在路上，高呼「和散那归于大卫的子孙」，耶稣谦和地骑驴荣入耶路撒冷。' },
      ] },
      { id: 'temple-cleanse-j', name_zh: '圣殿教训与洁净', name_en: 'Temple Cleansing', lng: 35.2354, lat: 31.7785, order: 14, confidence: 'identified', scriptureRef: '太21:12-17;可11:15-18', events: [
        { title: '洁净圣殿', ref: '太21:13', summary: '耶稣赶出殿里做买卖的人：「我的殿必称为祷告的殿，你们倒使它成为贼窝。」连日在殿中教训人、回应诘难。' },
      ] },
      { id: 'upper-room-j', name_zh: '楼上·最后晚餐', name_en: 'Upper Room', lng: 35.2290, lat: 31.7715, order: 15, confidence: 'identified', scriptureRef: '路22:7-38;约13-17', events: [
        { title: '设立圣餐与新命令', ref: '路22:19-20', summary: '耶稣在楼上为门徒洗脚、设立圣餐——「这是我的身体，为你们舍的」，赐下彼此相爱的新命令与临别赠言。' },
      ] },
      { id: 'kidron-j', name_zh: '汲沦溪', name_en: 'Kidron Valley', lng: 35.2370, lat: 31.7790, order: 16, confidence: 'identified', scriptureRef: '约18:1', events: [
        { title: '过汲沦溪', ref: '约18:1', summary: '晚餐与祷告后，耶稣同门徒出城，过了汲沦溪，往橄榄山下的园子去。' },
      ] },
      { id: 'gethsemane-j', name_zh: '客西马尼', name_en: 'Gethsemane', lng: 35.2400, lat: 31.7794, order: 17, confidence: 'identified', scriptureRef: '太26:36-56;路22:39-53', events: [
        { title: '客西马尼祷告与被卖', ref: '太26:39', summary: '耶稣极其忧伤，祷告「不要照我的意思，只要照你的意思」，随后被犹大以亲嘴为号出卖、被人捉拿。' },
      ] },
      { id: 'sanhedrin-j', name_zh: '亚那·该亚法·公会', name_en: 'Annas / Caiaphas / Sanhedrin', lng: 35.2285, lat: 31.7715, order: 18, confidence: 'identified', scriptureRef: '约18:12-27;太26:57-68', events: [
        { title: '夜审与彼得不认主', ref: '太26:63-66', summary: '耶稣先被解到亚那、再到大祭司该亚法与公会前受审，因自认是基督被定为「该死」；同时彼得三次不认主。' },
      ] },
      { id: 'pilate1-j', name_zh: '彼拉多（初审）', name_en: 'Pilate (First Trial)', lng: 35.2330, lat: 31.7806, order: 19, confidence: 'identified', scriptureRef: '约18:28-38;路23:1-7', events: [
        { title: '解到罗马巡抚', ref: '约18:38', summary: '天一亮众人把耶稣解到巡抚彼拉多的衙门；彼拉多查不出他有什么罪来，听见「加利利」便转送希律。' },
      ] },
      { id: 'herod-j', name_zh: '希律', name_en: 'Herod Antipas', lng: 35.2275, lat: 31.7755, order: 20, confidence: 'approximate', scriptureRef: '路23:8-12', events: [
        { title: '希律前受戏弄', ref: '路23:11', summary: '希律本想看神迹，耶稣却一言不答；希律和兵丁戏弄他、给他穿上华丽衣服，又送回彼拉多。当日希律与彼拉多成了朋友。' },
      ] },
      { id: 'pilate2-j', name_zh: '彼拉多（定罪）', name_en: 'Pilate (Sentencing)', lng: 35.2330, lat: 31.7806, order: 21, confidence: 'identified', scriptureRef: '路23:13-25;约19:1-16', events: [
        { title: '受鞭打与被判十架', ref: '约19:16', summary: '彼拉多虽宣称「我查不出他有罪」，却屈从众人「钉他十字架」的喊声，洗手推责，将耶稣鞭打后交去钉十字架。' },
      ] },
      { id: 'golgotha-j', name_zh: '各各他', name_en: 'Golgotha', lng: 35.2297, lat: 31.7784, order: 22, confidence: 'identified', scriptureRef: '路23:33-49;约19:17-37', events: [
        { title: '各各他十字架', ref: '路23:34;约19:30', summary: '耶稣被钉于各各他，说出十架七言——「父啊，赦免他们」「成了！」遍地黑暗、殿幔裂开，为世人的罪舍命。' },
      ] },
      { id: 'tomb-j', name_zh: '附近园中坟墓', name_en: 'Garden Tomb', lng: 35.2296, lat: 31.7786, order: 23, confidence: 'identified', scriptureRef: '约19:38-42;太27:57-66', events: [
        { title: '安葬于新坟墓', ref: '约19:41-42', summary: '钉十字架的地方有一个园子，园里有一座从未葬过人的新坟墓；亚利马太的约瑟与尼哥底母把耶稣的身体安放其中。' },
      ] },
      { id: 'resurrection-j', name_zh: '复活显现', name_en: 'Resurrection', lng: 35.2296, lat: 31.7787, order: 24, confidence: 'identified', scriptureRef: '路24:1-12;约20:1-18', events: [
        { title: '空坟与显现', ref: '路24:6', summary: '七日的头一日清晨坟墓空了——「他不在这里，已经复活了！」耶稣先向抹大拉的马利亚显现，死亡被胜过。' },
      ] },
      { id: 'emmaus-j', name_zh: '以马忤斯路上', name_en: 'Road to Emmaus', lng: 35.02, lat: 31.84, order: 25, confidence: 'approximate', scriptureRef: '路24:13-35', events: [
        { title: '路上讲解全部圣经', ref: '路24:27', summary: '复活的耶稣同两个门徒走往以马忤斯，从摩西和众先知讲解指着自己的话；擘饼时他们的眼睛开了，认出了主。' },
      ] },
      { id: 'jerusalem-appear-j', name_zh: '耶路撒冷楼房', name_en: 'Jerusalem Upper Room', lng: 35.2290, lat: 31.7716, order: 26, confidence: 'identified', scriptureRef: '路24:36-49;约20:19-29', events: [
        { title: '向门徒显现', ref: '约20:27', summary: '耶稣进到关着门的楼房，站在门徒中间说「愿你们平安」，给他们看手和肋旁，又坚固多疑的多马的信心。' },
      ] },
      { id: 'galilee-appear-j', name_zh: '加利利显现', name_en: 'Galilee Appearance', lng: 35.59, lat: 32.82, order: 27, confidence: 'identified', scriptureRef: '约21:1-23;太28:16-20', events: [
        { title: '海边复兴彼得·大使命', ref: '太28:19', summary: '耶稣在加利利海边再现，三问彼得「你爱我吗」托付牧养群羊，并在山上颁布大使命：「你们要去，使万民作我的门徒。」' },
      ] },
      { id: 'ascension-j', name_zh: '橄榄山·升天', name_en: 'Ascension (Mt. Olives)', lng: 35.2530, lat: 31.7800, order: 28, confidence: 'identified', scriptureRef: '路24:50-53;徒1:6-12', events: [
        { title: '伯大尼附近升天', ref: '徒1:9-11', summary: '耶稣带门徒到伯大尼附近的橄榄山，举手祝福，被取上升，有云彩把他接去；天使应许他必照样再来。' },
      ] },
    ],
  }],
}

// —— 9. 保罗宣教 ——
const paul = {
  id: 'paul',
  title: '保罗宣教地图',
  subtitle: '三次宣教旅程 + 罗马之旅 · 逐站行程与沿途书信',
  era: '约公元 46–62',
  badge: '★★★★★',
  bounds: { minLng: 11, maxLng: 38, minLat: 30, maxLat: 42.5 },
  mode: 'journey',
  layerSelect: 'single',
  layers: [
    { id: 'first', label: '第一次宣教', color: '#e8b04b', route: true, points: [
      { id: 'p1-antioch', name_zh: '安提阿（叙利亚）', name_en: 'Antioch', lng: 36.16, lat: 36.20, order: 1, confidence: 'identified', scriptureRef: '徒13:1-3', events: [
        { title: '差遣的母会', ref: '徒13:2-3', summary: '圣灵说：「要为我分派巴拿巴和扫罗。」教会禁食祷告、按手差遣，第一次宣教从此展开。' } ] },
      { id: 'p1-seleucia', name_zh: '西流基', name_en: 'Seleucia', lng: 35.93, lat: 36.12, order: 2, confidence: 'identified', scriptureRef: '徒13:4', events: [
        { title: '启航港口', ref: '徒13:4', summary: '二人被圣灵差遣，下到安提阿的港口西流基，从那里坐船往塞浦路斯去。' } ] },
      { id: 'p1-salamis', name_zh: '撒拉米', name_en: 'Salamis', lng: 33.90, lat: 35.18, order: 3, confidence: 'identified', scriptureRef: '徒13:5', events: [
        { title: '会堂传道', ref: '徒13:5', summary: '到了塞浦路斯东岸的撒拉米，在犹太人各会堂传讲神的道，有约翰马可作帮手。' } ] },
      { id: 'p1-paphos', name_zh: '帕弗', name_en: 'Paphos', lng: 32.42, lat: 34.76, order: 4, confidence: 'identified', scriptureRef: '徒13:6-12', events: [
        { title: '方伯归信', ref: '徒13:12', summary: '在帕弗，扫罗（保罗）斥责行法术的以吕马使其瞎眼，方伯士求保罗看见所行的就信了。' } ] },
      { id: 'p1-perga', name_zh: '别加', name_en: 'Perga', lng: 30.85, lat: 36.96, order: 5, confidence: 'identified', scriptureRef: '徒13:13', events: [
        { title: '马可中途离队', ref: '徒13:13', summary: '众人从帕弗开船到旁非利亚的别加；约翰马可在此离开他们，回耶路撒冷去了。' } ] },
      { id: 'p1-pisidian', name_zh: '彼西底安提阿', name_en: 'Pisidian Antioch', lng: 31.19, lat: 38.31, order: 6, confidence: 'identified', scriptureRef: '徒13:14-50', events: [
        { title: '转向外邦', ref: '徒13:46', summary: '保罗在会堂讲救恩的历史；犹太人弃绝福音，他宣告「我们就转向外邦人去」，福音临到外邦。' } ] },
      { id: 'p1-iconium', name_zh: '以哥念', name_en: 'Iconium', lng: 32.49, lat: 37.87, order: 7, confidence: 'identified', scriptureRef: '徒14:1-6', events: [
        { title: '城里分党', ref: '徒14:3-4', summary: '主借他们的手行神迹奇事，许多人信主；满城分党，有人要凌辱用石头打他们，二人就逃往路司得。' } ] },
      { id: 'p1-lystra', name_zh: '路司得', name_en: 'Lystra', lng: 32.45, lat: 37.58, order: 8, confidence: 'identified', scriptureRef: '徒14:8-20', events: [
        { title: '被误为神、又遭石击', ref: '徒14:19', summary: '医好生来瘸腿者后被当作神明献祭；随后犹太人煽动用石头打保罗拖出城外，以为他死了。提摩太的家乡。' } ] },
      { id: 'p1-derbe', name_zh: '特庇', name_en: 'Derbe', lng: 33.27, lat: 37.35, order: 9, confidence: 'identified', scriptureRef: '徒14:20-21', events: [
        { title: '使多人作门徒', ref: '徒14:21', summary: '保罗在特庇传福音，使好些人作门徒，这是去程的最东点，随后原路折返坚固教会。' } ] },
      { id: 'p1-lystra-r', name_zh: '路司得（回程）', name_en: 'Lystra', lng: 32.45, lat: 37.58, order: 10, confidence: 'identified', scriptureRef: '徒14:21-22', events: [
        { title: '坚固门徒', ref: '徒14:22', summary: '回到路司得，坚固门徒的心，劝勉「我们进入神的国，必须经历许多艰难」。' } ] },
      { id: 'p1-iconium-r', name_zh: '以哥念（回程）', name_en: 'Iconium', lng: 32.49, lat: 37.87, order: 11, confidence: 'identified', scriptureRef: '徒14:21-22', events: [
        { title: '坚固教会', ref: '徒14:22', summary: '再经以哥念，继续坚固门徒，劝他们恒守所信的道。' } ] },
      { id: 'p1-pisidian-r', name_zh: '彼西底安提阿（回程）', name_en: 'Pisidian Antioch', lng: 31.19, lat: 38.31, order: 12, confidence: 'identified', scriptureRef: '徒14:21-23', events: [
        { title: '选立长老', ref: '徒14:23', summary: '在各教会中选立长老，又禁食祷告，把他们交托所信的主。' } ] },
      { id: 'p1-perga-r', name_zh: '别加（回程）', name_en: 'Perga', lng: 30.85, lat: 36.96, order: 13, confidence: 'identified', scriptureRef: '徒14:25', events: [
        { title: '在别加讲道', ref: '徒14:25', summary: '经过彼西底，在别加讲了道，然后下到亚大利。' } ] },
      { id: 'p1-attalia', name_zh: '亚大利', name_en: 'Attalia', lng: 30.70, lat: 36.88, order: 14, confidence: 'identified', scriptureRef: '徒14:25-26', events: [
        { title: '启程返航', ref: '徒14:26', summary: '从亚大利的港口坐船，返回起初蒙差遣的安提阿。' } ] },
      { id: 'p1-antioch-r', name_zh: '安提阿（回程）', name_en: 'Antioch', lng: 36.16, lat: 36.20, order: 15, confidence: 'identified', scriptureRef: '徒14:26-28', events: [
        { title: '述说神开了信道的门', ref: '徒14:27', summary: '回到母会聚集会众，述说神借他们所行的一切，并为外邦人开了信道的门。' } ] },
    ] },
    { id: 'second', label: '第二次宣教', color: '#5ec2e8', route: true, points: [
      { id: 'p2-antioch', name_zh: '安提阿', name_en: 'Antioch', lng: 36.16, lat: 36.20, order: 1, confidence: 'identified', scriptureRef: '徒15:36-40', events: [
        { title: '与西拉再次出发', ref: '徒15:40', summary: '因马可一事保罗与巴拿巴分手，他拣选西拉，蒙弟兄把他们交于主的恩中出发。' } ] },
      { id: 'p2-syriacilicia', name_zh: '叙利亚、基利家', name_en: 'Syria & Cilicia', lng: 34.90, lat: 36.92, order: 2, confidence: 'approximate', scriptureRef: '徒15:41', events: [
        { title: '坚固众教会', ref: '徒15:41', summary: '保罗走遍叙利亚、基利家，坚固众教会。' } ] },
      { id: 'p2-derbe', name_zh: '特庇', name_en: 'Derbe', lng: 33.27, lat: 37.35, order: 3, confidence: 'identified', scriptureRef: '徒16:1', events: [] },
      { id: 'p2-lystra', name_zh: '路司得', name_en: 'Lystra', lng: 32.45, lat: 37.58, order: 4, confidence: 'identified', scriptureRef: '徒16:1-3', events: [
        { title: '带提摩太同行', ref: '徒16:3', summary: '保罗见提摩太为众弟兄所称赞，要带他同去，便给他行了割礼免犹太人的疑。' } ] },
      { id: 'p2-iconium', name_zh: '以哥念', name_en: 'Iconium', lng: 32.49, lat: 37.87, order: 5, confidence: 'identified', scriptureRef: '徒16:2-5', events: [
        { title: '教会信心坚固', ref: '徒16:5', summary: '他们把耶路撒冷会议的决议交给各教会遵守，众教会信心越发坚固，人数天天加增。' } ] },
      { id: 'p2-phrygiagalatia', name_zh: '弗吕家、加拉太', name_en: 'Phrygia & Galatia', lng: 32.00, lat: 39.00, order: 6, confidence: 'approximate', scriptureRef: '徒16:6', events: [
        { title: '圣灵禁止往亚细亚', ref: '徒16:6', summary: '圣灵既然禁止他们在亚细亚讲道，他们就经过弗吕家、加拉太一带地方。' } ] },
      { id: 'p2-mysia', name_zh: '每西亚', name_en: 'Mysia', lng: 28.00, lat: 39.60, order: 7, confidence: 'approximate', scriptureRef: '徒16:7-8', events: [
        { title: '耶稣的灵不许', ref: '徒16:7', summary: '到了每西亚边界想往庇推尼去，耶稣的灵却不许，于是越过每西亚下到特罗亚。' } ] },
      { id: 'p2-troas', name_zh: '特罗亚', name_en: 'Troas', lng: 26.24, lat: 39.76, order: 8, confidence: 'identified', scriptureRef: '徒16:8-10', events: [
        { title: '马其顿的异象', ref: '徒16:9', summary: '夜间异象中有马其顿人求「请过来帮助我们」，他们断定是神召他们传福音，福音由此首次进入欧洲。' } ] },
      { id: 'p2-samothrace', name_zh: '撒摩特喇', name_en: 'Samothrace', lng: 25.53, lat: 40.48, order: 9, confidence: 'identified', scriptureRef: '徒16:11', events: [] },
      { id: 'p2-neapolis', name_zh: '尼亚波利', name_en: 'Neapolis', lng: 24.40, lat: 40.93, order: 10, confidence: 'identified', scriptureRef: '徒16:11', events: [
        { title: '踏上欧洲', ref: '徒16:11', summary: '从特罗亚一直行到撒摩特喇，次日到尼亚波利登岸，进入欧洲大陆。' } ] },
      { id: 'p2-philippi', name_zh: '腓立比', name_en: 'Philippi', lng: 24.29, lat: 41.01, order: 11, confidence: 'identified', scriptureRef: '徒16:12-40', note: '日后写《腓立比书》给此教会。', events: [
        { title: '吕底亚信主、狱中歌唱', ref: '徒16:25-34', summary: '卖紫布的吕底亚归主；保罗西拉被下监，半夜祷告唱诗，地大震动，禁卒全家信主。欧洲第一间教会。' } ] },
      { id: 'p2-amphipolis', name_zh: '暗妃波里', name_en: 'Amphipolis', lng: 23.84, lat: 40.82, order: 12, confidence: 'identified', scriptureRef: '徒17:1', events: [] },
      { id: 'p2-apollonia', name_zh: '亚波罗尼亚', name_en: 'Apollonia', lng: 23.44, lat: 40.70, order: 13, confidence: 'identified', scriptureRef: '徒17:1', events: [] },
      { id: 'p2-thessalonica', name_zh: '帖撒罗尼迦', name_en: 'Thessalonica', lng: 22.94, lat: 40.64, order: 14, confidence: 'identified', scriptureRef: '徒17:1-9', note: '日后写《帖撒罗尼迦前后书》。', events: [
        { title: '会堂辩道与逼迫', ref: '徒17:2-5', summary: '保罗一连三个安息日讲解基督受害复活，有人信从；嫉妒的犹太人聚众生乱，攻击接待他们的耶孙。' } ] },
      { id: 'p2-berea', name_zh: '庇哩亚', name_en: 'Berea', lng: 22.20, lat: 40.52, order: 15, confidence: 'identified', scriptureRef: '徒17:10-14', events: [
        { title: '天天考查圣经', ref: '徒17:11', summary: '庇哩亚人比帖撒罗尼迦人开明，甘心领受真道，天天考查圣经要晓得是与不是。' } ] },
      { id: 'p2-athens', name_zh: '雅典', name_en: 'Athens', lng: 23.73, lat: 37.98, order: 16, confidence: 'identified', scriptureRef: '徒17:16-34', events: [
        { title: '亚略巴古的讲论', ref: '徒17:23', summary: '保罗借「未识之神」的坛向哲士传讲创造、复活与审判的真神，有几个人信从。' } ] },
      { id: 'p2-corinth', name_zh: '哥林多', name_en: 'Corinth', lng: 22.93, lat: 37.94, order: 17, confidence: 'identified', scriptureRef: '徒18:1-18', note: '停留一年半；在此写《帖撒罗尼迦前后书》。', events: [
        { title: '与亚居拉、百基拉同工', ref: '徒18:9-11', summary: '保罗以织帐棚为业与亚居拉夫妇同工；主在异象中说「有许多的百姓」，他便住下教导一年半。' } ] },
      { id: 'p2-cenchreae', name_zh: '坚革哩', name_en: 'Cenchreae', lng: 22.99, lat: 37.88, order: 18, confidence: 'identified', scriptureRef: '徒18:18', events: [
        { title: '剪发还愿', ref: '徒18:18', summary: '保罗在哥林多的港口坚革哩剪了头发，因为他许过愿，随后坐船往叙利亚去。' } ] },
      { id: 'p2-ephesus', name_zh: '以弗所', name_en: 'Ephesus', lng: 27.34, lat: 37.94, order: 19, confidence: 'identified', scriptureRef: '徒18:19-21', events: [
        { title: '短暂停留、应许再来', ref: '徒18:21', summary: '保罗把亚居拉夫妇留在以弗所，自己进会堂辩论，辞别时说「神若许我，我还要回到你们这里」。' } ] },
      { id: 'p2-caesarea', name_zh: '该撒利亚', name_en: 'Caesarea', lng: 34.89, lat: 32.50, order: 20, confidence: 'identified', scriptureRef: '徒18:22', events: [] },
      { id: 'p2-jerusalem', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.235, lat: 31.778, order: 21, confidence: 'identified', scriptureRef: '徒18:22', events: [
        { title: '问教会安', ref: '徒18:22', summary: '在该撒利亚上岸，上耶路撒冷问教会安。' } ] },
      { id: 'p2-antioch-r', name_zh: '安提阿', name_en: 'Antioch', lng: 36.16, lat: 36.20, order: 22, confidence: 'identified', scriptureRef: '徒18:22', events: [
        { title: '回到母会', ref: '徒18:22', summary: '然后下安提阿，结束第二次宣教旅程。' } ] },
    ] },
    { id: 'third', label: '第三次宣教', color: '#4ade80', route: true, points: [
      { id: 'p3-antioch', name_zh: '安提阿', name_en: 'Antioch', lng: 36.16, lat: 36.20, order: 1, confidence: 'identified', scriptureRef: '徒18:23', events: [
        { title: '再次启程', ref: '徒18:23', summary: '保罗在安提阿住了些日子又出去，开始第三次宣教旅程。' } ] },
      { id: 'p3-galatiaphrygia', name_zh: '加拉太、弗吕家', name_en: 'Galatia & Phrygia', lng: 32.00, lat: 39.00, order: 2, confidence: 'approximate', scriptureRef: '徒18:23', events: [
        { title: '坚固众门徒', ref: '徒18:23', summary: '挨次经过加拉太、弗吕家一带地方，坚固众门徒。' } ] },
      { id: 'p3-ephesus', name_zh: '以弗所', name_en: 'Ephesus', lng: 27.34, lat: 37.94, order: 3, confidence: 'identified', scriptureRef: '徒19', note: '停留约三年；在此写《哥林多前书》。', events: [
        { title: '三年事工与银匠骚动', ref: '徒19:10;23-41', summary: '主的道大大兴旺，焚烧邪术书籍；银匠底米丢因亚底米庙生意受损煽动全城骚乱。' } ] },
      { id: 'p3-macedonia', name_zh: '马其顿', name_en: 'Macedonia', lng: 22.50, lat: 41.00, order: 4, confidence: 'approximate', scriptureRef: '徒20:1-2', events: [
        { title: '勉励门徒', ref: '徒20:2', summary: '骚乱止息后保罗往马其顿去，走遍那一带地方用许多话勉励门徒。' } ] },
      { id: 'p3-greece', name_zh: '希腊（哥林多）', name_en: 'Greece / Corinth', lng: 22.93, lat: 37.94, order: 5, confidence: 'identified', scriptureRef: '徒20:2-3', note: '住三月，在此写《罗马书》。', events: [
        { title: '写《罗马书》', ref: '罗15:23-25', summary: '保罗在希腊住了三个月，于哥林多写信给罗马教会，阐明因信称义的福音。' } ] },
      { id: 'p3-macedonia-r', name_zh: '马其顿（回程）', name_en: 'Macedonia', lng: 22.50, lat: 41.00, order: 6, confidence: 'approximate', scriptureRef: '徒20:3', events: [
        { title: '改走陆路', ref: '徒20:3', summary: '将要坐船往叙利亚去时，犹太人设计要害他，他就定意从马其顿回去。' } ] },
      { id: 'p3-philippi', name_zh: '腓立比', name_en: 'Philippi', lng: 24.29, lat: 41.01, order: 7, confidence: 'identified', scriptureRef: '徒20:6', events: [
        { title: '过除酵节后开船', ref: '徒20:6', summary: '过了除酵节，他们从腓立比开船，五天到了特罗亚与同伴相会。' } ] },
      { id: 'p3-troas', name_zh: '特罗亚', name_en: 'Troas', lng: 26.24, lat: 39.76, order: 8, confidence: 'identified', scriptureRef: '徒20:6-12', events: [
        { title: '擘饼讲道、犹推古复活', ref: '徒20:9-12', summary: '七日的头一日聚会擘饼，保罗讲到半夜；少年犹推古困倦坠楼而死，保罗下去抱住他便活了。' } ] },
      { id: 'p3-assos', name_zh: '亚朔', name_en: 'Assos', lng: 26.34, lat: 39.49, order: 9, confidence: 'identified', scriptureRef: '徒20:13-14', events: [
        { title: '保罗步行赴会', ref: '徒20:13', summary: '众人先上船往亚朔，保罗却定意步行前往，在亚朔与他们会合上船。' } ] },
      { id: 'p3-mitylene', name_zh: '米推利尼', name_en: 'Mitylene', lng: 26.55, lat: 39.11, order: 10, confidence: 'identified', scriptureRef: '徒20:14', events: [] },
      { id: 'p3-chios', name_zh: '基阿', name_en: 'Chios', lng: 26.14, lat: 38.37, order: 11, confidence: 'identified', scriptureRef: '徒20:15', events: [] },
      { id: 'p3-samos', name_zh: '撒摩', name_en: 'Samos', lng: 26.84, lat: 37.75, order: 12, confidence: 'identified', scriptureRef: '徒20:15', events: [] },
      { id: 'p3-miletus', name_zh: '米利都', name_en: 'Miletus', lng: 27.28, lat: 37.53, order: 13, confidence: 'identified', scriptureRef: '徒20:17-38', events: [
        { title: '与以弗所长老泣别', ref: '徒20:36-38', summary: '保罗请来以弗所长老，预言此去必遭捆锁，嘱咐他们牧养神的教会；众人跪下祷告、抱颈痛哭告别。' } ] },
      { id: 'p3-cos', name_zh: '哥士', name_en: 'Cos', lng: 27.29, lat: 36.89, order: 14, confidence: 'identified', scriptureRef: '徒21:1', events: [] },
      { id: 'p3-rhodes', name_zh: '罗底', name_en: 'Rhodes', lng: 28.22, lat: 36.43, order: 15, confidence: 'identified', scriptureRef: '徒21:1', events: [] },
      { id: 'p3-patara', name_zh: '帕大喇', name_en: 'Patara', lng: 29.32, lat: 36.26, order: 16, confidence: 'identified', scriptureRef: '徒21:1-2', events: [
        { title: '换船往腓尼基', ref: '徒21:2', summary: '在帕大喇遇见一只往腓尼基去的船，就上船开行。' } ] },
      { id: 'p3-tyre', name_zh: '推罗', name_en: 'Tyre', lng: 35.20, lat: 33.27, order: 17, confidence: 'identified', scriptureRef: '徒21:3-6', events: [
        { title: '门徒劝阻、海边跪祷', ref: '徒21:5', summary: '在推罗住了七日，门徒被圣灵感动劝保罗不要上耶路撒冷；临别众人带妻子儿女送行，在海边跪下祷告。' } ] },
      { id: 'p3-ptolemais', name_zh: '多利买', name_en: 'Ptolemais', lng: 35.07, lat: 32.92, order: 18, confidence: 'identified', scriptureRef: '徒21:7', events: [
        { title: '问安住一天', ref: '徒21:7', summary: '从推罗行尽水程到了多利买，问众弟兄安，与他们同住了一天。' } ] },
      { id: 'p3-caesarea', name_zh: '该撒利亚', name_en: 'Caesarea', lng: 34.89, lat: 32.50, order: 19, confidence: 'identified', scriptureRef: '徒21:8-14', events: [
        { title: '亚迦布预言捆锁', ref: '徒21:11-13', summary: '住在传福音的腓利家中；先知亚迦布用保罗的腰带捆自己手脚，预言他必在耶路撒冷被捆绑，保罗却定意为主舍命。' } ] },
      { id: 'p3-jerusalem', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.235, lat: 31.778, order: 20, confidence: 'identified', scriptureRef: '徒21:15-33', events: [
        { title: '被捕', ref: '徒21:33', summary: '保罗在圣殿被诬告引发骚乱，被罗马千夫长拿住，自此进入长期受审与监禁。' } ] },
    ] },
    { id: 'rome', label: '罗马之旅', color: '#c084fc', route: true, points: [
      { id: 'r-jerusalem', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.235, lat: 31.778, order: 1, confidence: 'identified', scriptureRef: '徒23:11', events: [
        { title: '主夜间显现壮胆', ref: '徒23:11', summary: '保罗在公会与营楼受审，主夜间站在旁边说「你怎样在耶路撒冷为我作见证，也必怎样在罗马为我作见证」。' } ] },
      { id: 'r-antipatris', name_zh: '安提帕底', name_en: 'Antipatris', lng: 34.93, lat: 32.10, order: 2, confidence: 'identified', scriptureRef: '徒23:31', events: [
        { title: '夜间护送', ref: '徒23:31', summary: '因犹太人四十余人起誓要杀保罗，千夫长连夜派兵护送他到安提帕底。' } ] },
      { id: 'r-caesarea', name_zh: '该撒利亚', name_en: 'Caesarea', lng: 34.89, lat: 32.50, order: 3, confidence: 'identified', scriptureRef: '徒23:33-26:32', events: [
        { title: '受审与上告该撒', ref: '徒25:11', summary: '保罗在腓力斯、非斯都、亚基帕王前受审两年，向非斯都说「我要上告于该撒」，于是被解往罗马。' } ] },
      { id: 'r-sidon', name_zh: '西顿', name_en: 'Sidon', lng: 35.37, lat: 33.56, order: 4, confidence: 'identified', scriptureRef: '徒27:3', events: [
        { title: '犹流宽待', ref: '徒27:3', summary: '次日到了西顿，百夫长犹流宽待保罗，准他往朋友那里去受他们的照应。' } ] },
      { id: 'r-cyprus-lee', name_zh: '塞浦路斯背风岸', name_en: 'Lee of Cyprus', lng: 34.00, lat: 35.60, order: 5, confidence: 'approximate', scriptureRef: '徒27:4', events: [
        { title: '因风不顺', ref: '徒27:4', summary: '因风不顺，船便贴着塞浦路斯的背风岸行驶。' } ] },
      { id: 'r-cilicia-sea', name_zh: '基利家、旁非利亚海面', name_en: 'Off Cilicia & Pamphylia', lng: 32.50, lat: 36.30, order: 6, confidence: 'approximate', scriptureRef: '徒27:5', events: [
        { title: '过沿岸海面', ref: '徒27:5', summary: '过了基利家、旁非利亚前面的海，便到了吕家的每拉。' } ] },
      { id: 'r-myra', name_zh: '每拉', name_en: 'Myra', lng: 29.98, lat: 36.26, order: 7, confidence: 'identified', scriptureRef: '徒27:5-6', events: [
        { title: '换船往意大利', ref: '徒27:6', summary: '在每拉，百夫长找着一只亚历山大往意大利去的船，叫他们都上去。' } ] },
      { id: 'r-cnidus', name_zh: '革尼土', name_en: 'Cnidus', lng: 27.37, lat: 36.69, order: 8, confidence: 'identified', scriptureRef: '徒27:7', events: [
        { title: '风不容许', ref: '徒27:7', summary: '一连多日船行甚慢，仅仅来到革尼土对面，因被风拦阻便贴着克里特背风岸行。' } ] },
      { id: 'r-crete', name_zh: '克里特岛（撒摩尼）', name_en: 'Crete (Salmone)', lng: 26.30, lat: 35.30, order: 9, confidence: 'identified', scriptureRef: '徒27:7-8', events: [
        { title: '贴背风岸而行', ref: '徒27:7', summary: '从撒摩尼对面经过，贴着克里特岛背风岸艰难行驶。' } ] },
      { id: 'r-fairhavens', name_zh: '佳澳', name_en: 'Fair Havens', lng: 24.91, lat: 34.90, order: 10, confidence: 'identified', scriptureRef: '徒27:8-13', events: [
        { title: '保罗劝阻开船', ref: '徒27:10', summary: '保罗警告「这次行船必有亏损」，但百夫长信从船主与掌船的，定意开船离开佳澳。' } ] },
      { id: 'r-storm', name_zh: '海上风暴', name_en: 'Euraquilo Storm', lng: 23.50, lat: 35.00, order: 11, confidence: 'approximate', scriptureRef: '徒27:14-20', events: [
        { title: '友拉革罗狂风', ref: '徒27:14-15', summary: '不多几时，狂风从岛上扑下来，船被风抓住敌不住风，只得任风刮去。' } ] },
      { id: 'r-cauda', name_zh: '高大岛附近', name_en: 'Cauda', lng: 24.10, lat: 34.84, order: 12, confidence: 'identified', scriptureRef: '徒27:16-17', events: [
        { title: '拢住小船束船', ref: '徒27:16-17', summary: '贴着高大的背风岸奔行，仅仅收住小船，又用缆索捆绑船底，恐怕搁浅。' } ] },
      { id: 'r-adria', name_zh: '亚底亚海', name_en: 'Adriatic Sea', lng: 18.50, lat: 35.80, order: 13, confidence: 'approximate', scriptureRef: '徒27:27-44', events: [
        { title: '漂流十四天得保全', ref: '徒27:27-44', summary: '在亚底亚海漂来漂去十四天；天使向保罗显现应许同船无人丧命，众人吃饱后将船搁浅，全都得救上岸。' } ] },
      { id: 'r-malta', name_zh: '马耳他', name_en: 'Malta', lng: 14.51, lat: 35.90, order: 14, confidence: 'identified', scriptureRef: '徒28:1-10', events: [
        { title: '海难脱险与毒蛇', ref: '徒28:3-6', summary: '众人游泳上岸到了米利大岛；保罗被毒蛇咬却毫无损伤，又医好岛长的父亲及岛上病人。' } ] },
      { id: 'r-syracuse', name_zh: '叙拉古', name_en: 'Syracuse', lng: 15.29, lat: 37.07, order: 15, confidence: 'identified', scriptureRef: '徒28:12', events: [
        { title: '停留三日', ref: '徒28:12', summary: '换乘在马耳他过冬的亚历山大船，到了西西里的叙拉古停留三日。' } ] },
      { id: 'r-rhegium', name_zh: '利基翁', name_en: 'Rhegium', lng: 15.65, lat: 38.11, order: 16, confidence: 'identified', scriptureRef: '徒28:13', events: [] },
      { id: 'r-puteoli', name_zh: '部丢利', name_en: 'Puteoli', lng: 14.12, lat: 40.82, order: 17, confidence: 'identified', scriptureRef: '徒28:13-14', events: [
        { title: '遇弟兄住七日', ref: '徒28:14', summary: '到了部丢利遇见弟兄，他们请保罗与同伴同住了七天，然后往罗马去。' } ] },
      { id: 'r-appii', name_zh: '亚比乌市', name_en: 'Forum of Appius', lng: 12.97, lat: 41.49, order: 18, confidence: 'identified', scriptureRef: '徒28:15', events: [
        { title: '弟兄远迎', ref: '徒28:15', summary: '罗马的弟兄听见消息，就出来到亚比乌市迎接保罗。' } ] },
      { id: 'r-threetaverns', name_zh: '三馆', name_en: 'Three Taverns', lng: 12.83, lat: 41.60, order: 19, confidence: 'identified', scriptureRef: '徒28:15', events: [
        { title: '放心壮胆', ref: '徒28:15', summary: '弟兄又到三馆相迎，保罗见了他们就感谢神，放心壮胆。' } ] },
      { id: 'r-rome', name_zh: '罗马', name_en: 'Rome', lng: 12.50, lat: 41.90, order: 20, confidence: 'identified', scriptureRef: '徒28:16-31', note: '软禁中写《以弗所书》《腓立比书》《歌罗西书》《腓利门书》等监狱书信。', events: [
        { title: '在罗马放胆传道', ref: '徒28:30-31', summary: '保罗在自己所租的房子住了两年，放胆传讲神国的道，将主耶稣基督的事教导人，并没有人禁止。' } ] },
    ] },
  ],
}

// —— 10. 启示录七教会 ——
const sevenChurches = {
  id: 'seven-churches',
  title: '启示录七教会地图',
  subtitle: '亚细亚七间教会 · 优点 / 责备 / 应许',
  era: '约公元 95',
  badge: '★★★★★',
  bounds: { minLng: 26.5, maxLng: 29.7, minLat: 37.5, maxLat: 39.4 },
  mode: 'journey',
  layerSelect: 'multi',
  layers: [{
    id: 'churches', label: '七教会（书信次序）', color: '#e8b04b', route: true, points: [
      { id: 'ephesus-c', name_zh: '以弗所', name_en: 'Ephesus', lng: 27.34, lat: 37.94, order: 1, confidence: 'identified', scriptureRef: '启2:1-7', events: [
        { title: '优点', ref: '启2:2-3', summary: '劳碌、忍耐、恨恶恶人、试验假使徒、为主名劳苦不乏倦。' },
        { title: '责备', ref: '启2:4', summary: '"把起初的爱心离弃了。"', },
        { title: '应许', ref: '启2:7', summary: '得胜的，必将神乐园中生命树的果子赐他吃。' },
      ] },
      { id: 'smyrna-c', name_zh: '士每拿', name_en: 'Smyrna', lng: 27.14, lat: 38.42, order: 2, confidence: 'identified', scriptureRef: '启2:8-11', events: [
        { title: '优点', ref: '启2:9', summary: '在患难、贫穷中却是富足的（受逼迫的忠心教会，主无责备）。' },
        { title: '应许', ref: '启2:10-11', summary: '务要至死忠心，主赐生命的冠冕；得胜的必不受第二次死的害。' },
      ] },
      { id: 'pergamum-c', name_zh: '别迦摩', name_en: 'Pergamum', lng: 27.18, lat: 39.13, order: 3, confidence: 'identified', scriptureRef: '启2:12-17', events: [
        { title: '优点', ref: '启2:13', summary: '住在撒但座位之处仍坚守主名，在见证人安提帕殉道时也没有弃绝信仰。' },
        { title: '责备', ref: '启2:14-15', summary: '容让巴兰的教训与尼哥拉党的教训（拜偶像、行奸淫）。' },
        { title: '应许', ref: '启2:17', summary: '得胜的，主赐隐藏的吗哪，并写着新名的白石。' },
      ] },
      { id: 'thyatira-c', name_zh: '推雅推喇', name_en: 'Thyatira', lng: 27.84, lat: 38.92, order: 4, confidence: 'identified', scriptureRef: '启2:18-29', events: [
        { title: '优点', ref: '启2:19', summary: '爱心、信心、勤劳、忍耐，且末后所行的善事比起初更多。' },
        { title: '责备', ref: '启2:20', summary: '容让自称先知的妇人耶洗别引诱仆人行奸淫、吃祭偶像之物。' },
        { title: '应许', ref: '启2:26-28', summary: '得胜的，主赐他权柄制伏列国，又把晨星赐给他。' },
      ] },
      { id: 'sardis-c', name_zh: '撒狄', name_en: 'Sardis', lng: 28.04, lat: 38.49, order: 5, confidence: 'identified', scriptureRef: '启3:1-6', events: [
        { title: '责备', ref: '启3:1-2', summary: '"按名你是活的，其实是死的。"行为在神面前没有一样是完全的。' },
        { title: '优点（少数）', ref: '启3:4', summary: '还有几名素来未曾污秽自己衣服的，必穿白衣与主同行。' },
        { title: '应许', ref: '启3:5', summary: '得胜的必穿白衣，主不从生命册上涂抹他的名，且在父与众使者面前认他的名。' },
      ] },
      { id: 'philadelphia-c', name_zh: '非拉铁非', name_en: 'Philadelphia', lng: 28.66, lat: 38.34, order: 6, confidence: 'identified', scriptureRef: '启3:7-13', events: [
        { title: '优点', ref: '启3:8', summary: '略有一点力量，却遵守主的道，没有弃绝主的名（忠心教会，主无责备）。' },
        { title: '应许', ref: '启3:8-12', summary: '主在他面前给他一个敞开的门；得胜的要作神殿中的柱子，写上神的名、新耶路撒冷的名。' },
      ] },
      { id: 'laodicea-c', name_zh: '老底嘉', name_en: 'Laodicea', lng: 29.11, lat: 37.84, order: 7, confidence: 'identified', scriptureRef: '启3:14-22', events: [
        { title: '责备', ref: '启3:15-17', summary: '不冷不热，自以为富足、一样都不缺，却不知是困苦、可怜、贫穷、瞎眼、赤身的。' },
        { title: '劝勉与应许', ref: '启3:18-20', summary: '"看哪，我站在门外叩门。"得胜的，主赐他在自己宝座上与主同坐。' },
      ] },
    ],
  }],
}

// —— 11. 圣经时间轴融合（救赎历史主线）——
const timeline = {
  id: 'timeline',
  title: '圣经时间轴 + 地图融合',
  subtitle: '拖动年份，看救赎历史在地图上展开（核心壁垒）',
  era: '公元前 2100 – 公元 95',
  badge: '★★★★★★',
  bounds: { minLng: 11, maxLng: 48, minLat: 14, maxLat: 42 },
  mode: 'timeline',
  layerSelect: 'multi',
  years: { min: -2100, max: 100, default: 100, step: 5 },
  eras: [
    { label: '族长', from: -2100, to: -1500 },
    { label: '出埃及', from: -1499, to: -1100 },
    { label: '王国', from: -1099, to: -600 },
    { label: '被掳归回', from: -599, to: -1 },
    { label: '新约', from: 0, to: 100 },
  ],
  layers: [{
    id: 'redemption', label: '救赎历史里程碑', color: '#e8b04b', route: false, points: [
      { id: 't-abraham', name_zh: '亚伯拉罕蒙召', name_en: 'Abraham', lng: 35.10, lat: 31.53, year: -2091, confidence: 'approximate', scriptureRef: '创12', events: [
        { title: '应许之约', ref: '创12:2-3', summary: '神拣选亚伯拉罕，应许使他成为大国，地上万族都要因他得福——救赎计划的起点。' },
      ] },
      { id: 't-egypt', name_zh: '寄居埃及', name_en: 'In Egypt', lng: 31.20, lat: 30.10, year: -1876, confidence: 'approximate', scriptureRef: '创46-50', events: [
        { title: '约瑟与下埃及', ref: '创46', summary: '雅各全家因约瑟下到埃及，寄居四百多年，渐成大族。' },
      ] },
      { id: 't-exodus', name_zh: '出埃及与西奈立约', name_en: 'Exodus', lng: 33.97, lat: 28.54, year: -1446, confidence: 'approximate', scriptureRef: '出20', events: [
        { title: '律法与立约', ref: '出19-20', summary: '摩西领以色列出埃及，在西奈山领受十诫，神与以色列立约成为祭司的国度。' },
      ] },
      { id: 't-conquest', name_zh: '约书亚进迦南', name_en: 'Conquest', lng: 35.44, lat: 31.87, year: -1406, confidence: 'approximate', scriptureRef: '书6', events: [
        { title: '得地为业', ref: '书11:23', summary: '约书亚率以色列攻取迦南，按支派分地，应许之地初步成就。' },
      ] },
      { id: 't-david', name_zh: '大卫建都耶路撒冷', name_en: 'David', lng: 35.235, lat: 31.778, year: -1003, confidence: 'identified', scriptureRef: '撒下5', events: [
        { title: '大卫之约', ref: '撒下7:16', summary: '神应许大卫的国位必坚立到永远，指向将来的弥赛亚君王。' },
      ] },
      { id: 't-solomon', name_zh: '所罗门建圣殿', name_en: 'Temple', lng: 35.235, lat: 31.778, year: -966, confidence: 'identified', scriptureRef: '王上6', events: [
        { title: '圣殿落成', ref: '王上8:11', summary: '耶和华的荣光充满圣殿，敬拜有了中心，王国进入黄金时代。' },
      ] },
      { id: 't-fall-n', name_zh: '北国亡于亚述', name_en: 'Assyria', lng: 35.19, lat: 32.28, year: -722, confidence: 'identified', scriptureRef: '王下17', events: [
        { title: '撒玛利亚陷落', ref: '王下17:6', summary: '北国以色列被亚述所灭，十支派分散。' },
      ] },
      { id: 't-exile', name_zh: '被掳巴比伦', name_en: 'Exile', lng: 44.42, lat: 32.54, year: -586, confidence: 'identified', scriptureRef: '王下25', events: [
        { title: '圣殿被毁、被掳七十年', ref: '耶25:11', summary: '巴比伦灭南国、焚圣殿，犹大被掳；但神借先知应许七十年后归回。' },
      ] },
      { id: 't-return', name_zh: '归回重建', name_en: 'Return', lng: 35.235, lat: 31.778, year: -538, confidence: 'identified', scriptureRef: '拉1;尼2', events: [
        { title: '波斯王下诏归回', ref: '拉1:1-3', summary: '古列王下诏准犹大人回耶路撒冷重建圣殿；以斯拉、尼希米带领重建殿与城墙。' },
      ] },
      { id: 't-jesus', name_zh: '耶稣降生与救赎', name_en: 'Jesus', lng: 35.20, lat: 31.70, year: 1, confidence: 'identified', scriptureRef: '路2;太27-28', events: [
        { title: '道成肉身、受死复活', ref: '约1:14', summary: '神的儿子降生、受死、复活，成就一切应许，新约由此开启。' },
      ] },
      { id: 't-church', name_zh: '教会与万邦', name_en: 'The Church', lng: 12.50, lat: 41.90, year: 60, confidence: 'identified', scriptureRef: '徒2;28', events: [
        { title: '福音传到地极', ref: '徒1:8', summary: '五旬节圣灵降临，教会诞生；保罗等人将福音从耶路撒冷传至罗马与万邦。' },
      ] },
    ],
  }],
}

// —— 12. 圣经人物轨迹 ——
const characters = {
  id: 'characters',
  title: '圣经人物轨迹地图',
  subtitle: '选择人物，看其出生地、活动地与旅程',
  era: '跨越两千年',
  badge: '★★★★★★',
  bounds: { minLng: 11, maxLng: 48, minLat: 14, maxLat: 42 },
  mode: 'journey',
  layerSelect: 'single',
  profile: true,
  layers: [
    { id: 'c-abraham', label: '亚伯拉罕', color: '#e8b04b', route: true, era: '约公元前 2166–1991', scene: 'altar', bio: '信心之父。蒙神呼召离开吾珥，凭信心寄居应许之地；神与他立约，应许其后裔如天上的星、万族因他得福。', points: [
      { id: 'ca-ur', name_zh: '吾珥（出生）', name_en: 'Ur', lng: 46.10, lat: 30.96, order: 1, confidence: 'identified', scriptureRef: '创11:28', events: [{ title: '本家之地', ref: '创11:31', summary: '亚伯拉罕生于迦勒底的吾珥。' }] },
      { id: 'ca-haran', name_zh: '哈兰', name_en: 'Haran', lng: 39.03, lat: 36.86, order: 2, confidence: 'identified', scriptureRef: '创12:4', events: [{ title: '蒙召起行', ref: '创12:4', summary: '七十五岁离哈兰往迦南。' }] },
      { id: 'ca-shechem', name_zh: '示剑', name_en: 'Shechem', lng: 35.28, lat: 32.21, order: 3, confidence: 'identified', scriptureRef: '创12:6-7', altar: '进迦南第一座坛', events: [] },
      { id: 'ca-hebron', name_zh: '希伯仑（终）', name_en: 'Hebron', lng: 35.10, lat: 31.53, order: 4, confidence: 'identified', scriptureRef: '创23', events: [{ title: '麦比拉洞', ref: '创23', summary: '葬于希伯仑麦比拉洞。' }] },
    ] },
    { id: 'c-moses', label: '摩西', color: '#5ec2e8', route: true, era: '约公元前 1526–1406', scene: 'tablets', bio: '以色列的领袖与立法者。在荆棘火焰中蒙召，领以色列出埃及、过红海，在西奈山领受十诫与律法，带领百姓走过旷野四十年。', points: [
      { id: 'cm-egypt', name_zh: '埃及（出生/王宫）', name_en: 'Egypt', lng: 31.20, lat: 30.10, order: 1, confidence: 'approximate', scriptureRef: '出2', events: [{ title: '蒙救与长大', ref: '出2:10', summary: '生于埃及，被法老女儿收养长大。' }] },
      { id: 'cm-midian', name_zh: '米甸', name_en: 'Midian', lng: 35.40, lat: 28.40, order: 2, confidence: 'approximate', scriptureRef: '出3', altar: '何烈山荆棘火焰中蒙召', events: [{ title: '荆棘异象', ref: '出3:2', summary: '逃往米甸牧羊四十年，在何烈山火焰中蒙召。' }] },
      { id: 'cm-sinai', name_zh: '西奈山', name_en: 'Mt Sinai', lng: 33.97, lat: 28.54, order: 3, confidence: 'identified', scriptureRef: '出20', altar: '领受十诫、立约', events: [{ title: '颁布律法', ref: '出20', summary: '领以色列出埃及，在西奈领受律法。' }] },
      { id: 'cm-nebo', name_zh: '尼波山（终）', name_en: 'Mt Nebo', lng: 35.73, lat: 31.77, order: 4, confidence: 'approximate', scriptureRef: '申34', events: [{ title: '遥望应许之地', ref: '申34:1-5', summary: '在尼波山遥望迦南后逝世。' }] },
    ] },
    { id: 'c-david', label: '大卫', color: '#ff6b6b', route: true, era: '约公元前 1040–970', scene: 'crown', bio: '合神心意的牧人君王。从伯利恒牧场受膏，凭信心击杀歌利亚，建都耶路撒冷；神应许他的国位坚立到永远。诗篇多出其手。', points: [
      { id: 'cd-beth', name_zh: '伯利恒（出生）', name_en: 'Bethlehem', lng: 35.20, lat: 31.70, order: 1, confidence: 'identified', scriptureRef: '撒上16', events: [{ title: '受膏', ref: '撒上16:13', summary: '牧童大卫在伯利恒受撒母耳膏立。' }] },
      { id: 'cd-elah', name_zh: '以拉谷', name_en: 'Elah', lng: 34.96, lat: 31.69, order: 2, confidence: 'approximate', scriptureRef: '撒上17', events: [{ title: '战胜歌利亚', ref: '撒上17', summary: '凭信心击杀巨人歌利亚。' }] },
      { id: 'cd-hebron', name_zh: '希伯仑', name_en: 'Hebron', lng: 35.10, lat: 31.53, order: 3, confidence: 'identified', scriptureRef: '撒下2', events: [{ title: '作犹大王', ref: '撒下2:4', summary: '先在希伯仑作王七年半。' }] },
      { id: 'cd-jeru', name_zh: '耶路撒冷', name_en: 'Jerusalem', lng: 35.235, lat: 31.778, order: 4, confidence: 'identified', scriptureRef: '撒下5', events: [{ title: '建都、立约', ref: '撒下5-7', summary: '攻取耶布斯定为京城，神立永约。' }] },
    ] },
    { id: 'c-elijah', label: '以利亚', color: '#4ade80', route: true, era: '约公元前 9 世纪', scene: 'fire', bio: '烈火先知。在亚哈王拜巴力的黑暗年代为耶和华争战，于迦密山求火降下证明真神，最终乘旋风火车被接升天。', points: [
      { id: 'ce-gilead', name_zh: '提斯比（基列）', name_en: 'Tishbe', lng: 35.75, lat: 32.30, order: 1, confidence: 'approximate', scriptureRef: '王上17:1', events: [{ title: '宣告旱灾', ref: '王上17:1', summary: '基列的提斯比人以利亚宣告三年不下雨。' }] },
      { id: 'ce-cherith', name_zh: '基立溪', name_en: 'Cherith', lng: 35.62, lat: 32.05, order: 2, confidence: 'approximate', scriptureRef: '王上17:2-6', events: [{ title: '乌鸦供养', ref: '王上17:6', summary: '神命乌鸦早晚叼饼和肉供养他。' }] },
      { id: 'ce-carmel', name_zh: '迦密山', name_en: 'Carmel', lng: 35.03, lat: 32.73, order: 3, confidence: 'identified', scriptureRef: '王上18', altar: '重修耶和华的坛，求火降下', events: [{ title: '斗巴力先知', ref: '王上18:38', summary: '求火降下，证明耶和华是神。' }] },
      { id: 'ce-horeb', name_zh: '何烈山', name_en: 'Horeb', lng: 33.97, lat: 28.54, order: 4, confidence: 'identified', scriptureRef: '王上19', events: [{ title: '微小的声音', ref: '王上19:12', summary: '在何烈山洞口，神不在风火地震中，而在微小的声音里。' }] },
    ] },
    { id: 'c-paul', label: '保罗', color: '#c084fc', route: true, era: '约公元 5–67', scene: 'boat', epistles: ['罗马书','哥林多前后书','加拉太书','以弗所书','腓立比书','歌罗西书','帖前后书','提摩太前后书','提多书','腓利门书'], bio: '外邦人的使徒。原为逼迫教会的法利赛人，在大马士革路上蒙主光照归主；三次宣教旅程遍传福音，写下十三卷书信，最终在罗马为主作见证。', points: [
      { id: 'cp-tarsus', name_zh: '大数（出生）', name_en: 'Tarsus', lng: 34.90, lat: 36.92, order: 1, confidence: 'identified', scriptureRef: '徒22:3', events: [{ title: '生于大数', ref: '徒22:3', summary: '生在基利家的大数，长在耶路撒冷迦玛列门下。' }] },
      { id: 'cp-damascus', name_zh: '大马士革路上', name_en: 'Damascus', lng: 36.30, lat: 33.51, order: 2, confidence: 'identified', scriptureRef: '徒9', events: [{ title: '蒙光照归主', ref: '徒9:3-6', summary: '往大马士革途中被大光照住，听见主的声音，从逼迫者变为使徒。' }] },
      { id: 'cp-antioch', name_zh: '安提阿', name_en: 'Antioch', lng: 36.16, lat: 36.20, order: 3, confidence: 'identified', scriptureRef: '徒13', events: [{ title: '宣教的差遣地', ref: '徒13:2-3', summary: '从安提阿被圣灵差派，三次宣教旅程的起点。' }] },
      { id: 'cp-rome', name_zh: '罗马（终）', name_en: 'Rome', lng: 12.50, lat: 41.90, order: 4, confidence: 'identified', scriptureRef: '徒28', events: [{ title: '在罗马传道', ref: '徒28:30-31', summary: '被解到罗马，软禁中仍放胆传讲神国的道。' }] },
    ] },
  ],
}

export const BIBLE_MAPS = [
  abraham, exodus, joshua, tribes, david, solomon,
  dividedKingdom, jesus, paul, sevenChurches, timeline, characters,
]

export const BIBLE_MAPS_BY_ID = Object.fromEntries(BIBLE_MAPS.map(m => [m.id, m]))
