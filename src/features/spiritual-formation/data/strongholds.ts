// 自高之事本体库 / Stronghold Ontology (Skill 1: stronghold-ontology-engine)
// 现代人如何被思想、欲望、身份、文化、技术、宗教形式拦阻认识神。
// How modern people are blocked from knowing God by thought, desire, identity,
// culture, technology, and religious form.
//
// 数据为「中英双语内联」/ Bilingual inline data. 渲染层用 localizeStronghold 挑选语言。
// 引擎匹配（detectionKeywords）同时含中英关键词，匹配原始文本，不依赖语言模式。

export type StrongholdArchetypeCode =
  | "self_sovereignty" // 自主之塔
  | "rational_pride" // 理性之塔
  | "desire_absolutism" // 欲望之塔
  | "performance_righteousness" // 成就之塔
  | "techno_salvation" // 技术之塔
  | "political_idolatry" // 权力之塔
  | "wounded_unbelief" // 伤痛之塔
  | "religious_self_righteousness"; // 宗教之塔

export type StrongholdId =
  | "scientism"
  | "moral_relativism"
  | "self_sovereignty"
  | "therapeutic_self"
  | "control_idolatry"
  | "consumerism"
  | "digital_distraction"
  | "desire_identity_fusion"
  | "achievement_idolatry"
  | "techno_messianism"
  | "identity_absolutism"
  | "political_idolatry"
  | "nihilism"
  | "suffering_objection"
  | "church_hurt"
  | "spiritual_consumerism"
  | "religious_formalism"
  | "self_righteousness";

export type DoctrineCode =
  | "god_holiness"
  | "god_love"
  | "god_sovereignty"
  | "creation"
  | "human_image_of_god"
  | "human_finitude"
  | "sin"
  | "judgment"
  | "christ_uniqueness"
  | "cross"
  | "resurrection"
  | "grace"
  | "repentance"
  | "justification"
  | "identity_in_christ"
  | "sanctification"
  | "church"
  | "kingdom_of_god"
  | "new_creation";

export interface BiText {
  zh: string;
  en: string;
}
export interface BiList {
  zh: string[];
  en: string[];
}

export interface StrongholdArchetype {
  code: StrongholdArchetypeCode;
  name: BiText;
  shortName: BiText;
  description: BiText;
  theologicalRoot: BiText;
}

export interface Stronghold {
  id: StrongholdId;
  code: StrongholdId;
  archetypeCode: StrongholdArchetypeCode;
  name: BiText;
  shortName: BiText;
  summary: BiText;
  coreLie: BiText;
  falseGospel: BiText;
  falseIdentity: BiText;
  rootDesires: BiList;
  rootFears: BiList;
  cognitiveSignals: BiList;
  emotionalSignals: BiList;
  behavioralSignals: BiList;
  culturalReinforcers: BiList;
  blockedDoctrines: DoctrineCode[];
  biblicalCounterTruth: BiText;
  gospelReframe: BiText;
  scriptures: string[];
  detectionKeywords: string[];
  exampleUserPhrases: BiList;
  severityDefault: number;
}

// ── 福音核心真理名称 / Doctrine display names ──
export const DOCTRINE_NAMES: Record<DoctrineCode, BiText> = {
  god_holiness: { zh: "神的圣洁", en: "The holiness of God" },
  god_love: { zh: "神的慈爱", en: "The love of God" },
  god_sovereignty: { zh: "神的主权", en: "The sovereignty of God" },
  creation: { zh: "创造", en: "Creation" },
  human_image_of_god: { zh: "人按神形象被造", en: "Human as image of God" },
  human_finitude: { zh: "人的有限", en: "Human finitude" },
  sin: { zh: "罪", en: "Sin" },
  judgment: { zh: "审判", en: "Judgment" },
  christ_uniqueness: { zh: "基督的唯一性", en: "The uniqueness of Christ" },
  cross: { zh: "十字架", en: "The cross" },
  resurrection: { zh: "复活", en: "Resurrection" },
  grace: { zh: "恩典", en: "Grace" },
  repentance: { zh: "悔改", en: "Repentance" },
  justification: { zh: "因信称义", en: "Justification by faith" },
  identity_in_christ: { zh: "在基督里的身份", en: "Identity in Christ" },
  sanctification: { zh: "成圣", en: "Sanctification" },
  church: { zh: "教会", en: "The church" },
  kingdom_of_god: { zh: "神的国", en: "The kingdom of God" },
  new_creation: { zh: "新造", en: "New creation" },
};

// ── 关联经文（双语）/ Scripture text, bilingual ──
export const strongholdScriptureText: Record<string, BiText> = {
  "Proverbs 3:5-6": { zh: "你要专心仰赖耶和华，不可倚靠自己的聪明。", en: "Trust in the LORD with all your heart, and do not lean on your own understanding." },
  "Isaiah 55:8-9": { zh: "我的意念非同你们的意念；我的道路非同你们的道路。", en: "My thoughts are not your thoughts, neither are your ways my ways, declares the LORD." },
  "Colossians 1:16-17": { zh: "万有都是靠他造的……也靠他而立。", en: "All things were created through him and for him, and in him all things hold together." },
  "Romans 1:20-25": { zh: "他们将神的真实变为虚谎，去敬拜事奉受造之物。", en: "They exchanged the truth about God for a lie and worshiped the creature rather than the Creator." },
  "Psalm 14:1": { zh: "愚顽人心里说：没有神。", en: "The fool says in his heart, 'There is no God.'" },
  "Job 38:4": { zh: "我立大地根基的时候，你在哪里呢？", en: "Where were you when I laid the foundation of the earth?" },
  "Genesis 3:5": { zh: "你们便如神能知道善恶。", en: "You will be like God, knowing good and evil." },
  "Exodus 20:3": { zh: "除我以外，你不可有别的神。", en: "You shall have no other gods before me." },
  "Jeremiah 17:9": { zh: "人心比万物都诡诈，坏到极处。", en: "The heart is deceitful above all things, and desperately sick; who can understand it?" },
  "Judges 21:25": { zh: "各人任意而行。", en: "Everyone did what was right in his own eyes." },
  "John 14:6": { zh: "我就是道路、真理、生命。", en: "I am the way, and the truth, and the life." },
  "Matthew 6:24": { zh: "你们不能又事奉神，又事奉玛门。", en: "You cannot serve God and money." },
  "Luke 12:15": { zh: "人的生命不在乎家道丰富。", en: "One's life does not consist in the abundance of his possessions." },
  "1 Timothy 6:6-10": { zh: "敬虔加上知足的心便是大利。", en: "Godliness with contentment is great gain." },
  "1 Corinthians 6:18-20": { zh: "你们的身子是圣灵的殿……要在你们的身子上荣耀神。", en: "Your body is a temple of the Holy Spirit; so glorify God in your body." },
  "1 Thessalonians 4:3-5": { zh: "神的旨意就是要你们成为圣洁。", en: "This is the will of God, your sanctification." },
  "Psalm 16:11": { zh: "在你面前有满足的喜乐，在你右手中有永远的福乐。", en: "In your presence there is fullness of joy; at your right hand are pleasures forevermore." },
  "Matthew 11:28-30": { zh: "凡劳苦担重担的人，可以到我这里来，我就使你们得安息。", en: "Come to me, all who labor and are heavy laden, and I will give you rest." },
  "Ephesians 2:8-9": { zh: "你们得救是本乎恩，也因着信……免得有人自夸。", en: "By grace you have been saved through faith, not a result of works, so that no one may boast." },
  "Galatians 2:20": { zh: "现在活着的不再是我，乃是基督在我里面活着。", en: "It is no longer I who live, but Christ who lives in me." },
  "Philippians 3:7-9": { zh: "我也将万事当作有损的……为要得着基督。", en: "I count everything as loss for the sake of Christ, and to be found in him." },
  "Romans 8:1": { zh: "如今那些在基督耶稣里的就不定罪了。", en: "There is therefore now no condemnation for those who are in Christ Jesus." },
  "Romans 8:18-25": { zh: "现在的苦楚若比起将来要显于我们的荣耀，就不足介意了。", en: "The sufferings of this present time are not worth comparing with the glory to be revealed." },
  "Psalm 13": { zh: "耶和华啊，你忘记我要到几时呢？", en: "How long, O LORD? Will you forget me forever?" },
  "Psalm 22:1-2": { zh: "我的神，我的神，为什么离弃我？", en: "My God, my God, why have you forsaken me?" },
  "2 Corinthians 1:3-7": { zh: "我们在一切患难中，他就安慰我们。", en: "He comforts us in all our affliction." },
  "Isaiah 53:3-5": { zh: "他诚然担当我们的忧患，背负我们的痛苦。", en: "Surely he has borne our griefs and carried our sorrows." },
  "Revelation 21:3-5": { zh: "神要擦去他们一切的眼泪……看哪，我将一切都更新了。", en: "He will wipe away every tear; behold, I am making all things new." },
  "Daniel 2:21": { zh: "他改变时候、日期，废王、立王。", en: "He changes times and seasons; he removes kings and sets up kings." },
  "Psalm 146:3": { zh: "你们不要倚靠君王，不要倚靠世人。", en: "Put not your trust in princes, in a son of man, in whom there is no salvation." },
  "Philippians 3:20": { zh: "我们却是天上的国民。", en: "Our citizenship is in heaven." },
  "Luke 18:9-14": { zh: "这人回家去比那人倒算为义了。", en: "This man went down to his house justified, rather than the other." },
  "Matthew 23:25-28": { zh: "你们洗净杯盘的外面，里面却盛满了勒索和放荡。", en: "You clean the outside of the cup, but inside are full of greed and self-indulgence." },
  "Isaiah 64:6": { zh: "我们的义都像污秽的衣服。", en: "All our righteous deeds are like a polluted garment." },
  "James 4:6": { zh: "神阻挡骄傲的人，赐恩给谦卑的人。", en: "God opposes the proud but gives grace to the humble." },
  "Mark 1:35": { zh: "耶稣到旷野地方去，在那里祷告。", en: "Jesus departed to a desolate place, and there he prayed." },
  "Ecclesiastes 1:2": { zh: "虚空的虚空，凡事都是虚空。", en: "Vanity of vanities! All is vanity." },
  "John 10:10": { zh: "我来了，是要叫人得生命，并且得的更丰盛。", en: "I came that they may have life and have it abundantly." },
  "Romans 12:2": { zh: "不要效法这个世界，只要心意更新而变化。", en: "Do not be conformed to this world, but be transformed by the renewal of your mind." },
  "2 Corinthians 10:4-5": { zh: "将各样的计谋……都夺回，使它都顺服基督。", en: "We destroy arguments and take every thought captive to obey Christ." },
};

// ── 8 大原型 / 8 archetypes ──
export const strongholdArchetypes: StrongholdArchetype[] = [
  {
    code: "self_sovereignty",
    name: { zh: "自主之塔", en: "The Tower of Self-Sovereignty" },
    shortName: { zh: "自主", en: "Autonomy" },
    description: { zh: "人坚持自己是生命的主人，有权定义善恶、掌控结果、自己作王。", en: "The self insists on being lord of its own life, defining good and evil, controlling outcomes, reigning alone." },
    theologicalRoot: { zh: "始于伊甸园『你们便如神』的试探——拒绝受造者的位分，篡夺造物主的主权。", en: "Rooted in Eden's 'you will be like God' — refusing the creature's place and seizing the Creator's throne." },
  },
  {
    code: "rational_pride",
    name: { zh: "理性之塔", en: "The Tower of Rational Pride" },
    shortName: { zh: "理性", en: "Reason" },
    description: { zh: "把人的理性、科学或个人判断高举为衡量一切真理的终极标准。", en: "Human reason, science, or private judgment is exalted as the final measure of all truth." },
    theologicalRoot: { zh: "拒绝『敬畏耶和华是知识的开端』，让受造的心智审判造物主。", en: "Rejecting that the fear of the LORD is the beginning of knowledge; the created mind judges the Creator." },
  },
  {
    code: "desire_absolutism",
    name: { zh: "欲望之塔", en: "The Tower of Desire" },
    shortName: { zh: "欲望", en: "Desire" },
    description: { zh: "把欲望、快感、舒适或自我表达绝对化，当作最真实的自我与终极的善。", en: "Desire, pleasure, comfort, or self-expression is absolutized as the truest self and the ultimate good." },
    theologicalRoot: { zh: "用受造之物取代造物主，让欲望坐上唯有神配坐的宝座。", en: "Exchanging Creator for creature, enthroning appetite where only God belongs." },
  },
  {
    code: "performance_righteousness",
    name: { zh: "成就之塔", en: "The Tower of Performance" },
    shortName: { zh: "成就", en: "Performance" },
    description: { zh: "靠成就、表现、社会认可来获得价值感与称义感。", en: "Worth and a sense of justification are earned through achievement, performance, and approval." },
    theologicalRoot: { zh: "用行为称义取代恩典称义，用人的评价取代神的接纳。", en: "Replacing justification by grace with justification by works, and God's welcome with human approval." },
  },
  {
    code: "techno_salvation",
    name: { zh: "技术之塔", en: "The Tower of Techno-Salvation" },
    shortName: { zh: "技术", en: "Technology" },
    description: { zh: "相信技术与人的能力最终能解决罪、死亡、痛苦和无意义。", en: "Belief that technology and human power can finally solve sin, death, suffering, and meaninglessness." },
    theologicalRoot: { zh: "现代的巴别塔——靠人手建造通天之路，为自己立名而不需救主。", en: "A modern Babel — building a way to heaven by human hands, making a name without a Savior." },
  },
  {
    code: "political_idolatry",
    name: { zh: "权力之塔", en: "The Tower of Power" },
    shortName: { zh: "权力", en: "Power" },
    description: { zh: "把政治阵营、身份群体或社会权力当作终极的盼望、身份与安全。", en: "A political camp, identity group, or social power becomes ultimate hope, identity, and security." },
    theologicalRoot: { zh: "把对神国的盼望转嫁给地上的国，把救恩寄托于权力而非基督。", en: "Transferring kingdom hope to an earthly kingdom, locating salvation in power rather than Christ." },
  },
  {
    code: "wounded_unbelief",
    name: { zh: "伤痛之塔", en: "The Tower of Wounded Unbelief" },
    shortName: { zh: "伤痛", en: "Wounds" },
    description: { zh: "因苦难、失望、被伤害而对神关上心门，用不信保护自己。", en: "Suffering, disappointment, and injury close the heart toward God; unbelief becomes self-protection." },
    theologicalRoot: { zh: "把未被解释的痛苦读作神不存在、不善或不可信的证据。", en: "Reading unexplained pain as proof that God is absent, unkind, or untrustworthy." },
  },
  {
    code: "religious_self_righteousness",
    name: { zh: "宗教之塔", en: "The Tower of Religious Self-Righteousness" },
    shortName: { zh: "宗教", en: "Religion" },
    description: { zh: "用宗教知识、行为、形象建立自己的义，却内心远离神的恩典。", en: "Building one's own righteousness through religious knowledge, behavior, and image while the heart stays far from grace." },
    theologicalRoot: { zh: "法利赛式的自义——用敬虔的外貌掩盖对恩典的不需要感。", en: "Pharisaical self-righteousness — a form of godliness that hides a felt non-need of grace." },
  },
];

// ── 18 个自高之事模式 / 18 stronghold patterns ──
export const strongholds: Stronghold[] = [
  {
    id: "scientism",
    code: "scientism",
    archetypeCode: "rational_pride",
    name: { zh: "科学主义", en: "Scientism" },
    shortName: { zh: "科学", en: "Science" },
    summary: { zh: "把科学方法当作认识真理的唯一途径，凡不能被实证的就视为不真实。", en: "Treating the scientific method as the only path to truth; whatever cannot be measured is treated as unreal." },
    coreLie: { zh: "科学不能证明的，就不值得相信。", en: "If science cannot prove it, it is not worth believing." },
    falseGospel: { zh: "只要知识与方法足够，人类终能自行解释并掌握一切。", en: "Given enough knowledge and method, humanity will finally explain and master everything itself." },
    falseIdentity: { zh: "我是清醒的理性者，比迷信的人更高明。", en: "I am the clear-eyed rationalist, superior to the superstitious." },
    rootDesires: { zh: ["确定性", "掌控", "智识上的优越", "不被欺骗"], en: ["certainty", "control", "intellectual superiority", "not being deceived"] },
    rootFears: { zh: ["被骗", "失控", "无知", "显得愚蠢"], en: ["being fooled", "loss of control", "ignorance", "looking foolish"] },
    cognitiveSignals: { zh: ["只接受可量化的证据", "把信仰等同于反智", "预设奇迹不可能"], en: ["accepts only quantifiable evidence", "equates faith with anti-intellectualism", "assumes miracles are impossible a priori"] },
    emotionalSignals: { zh: ["居高临下", "轻蔑", "焦虑于不确定"], en: ["condescension", "contempt", "anxiety toward uncertainty"] },
    behavioralSignals: { zh: ["辩论压人", "嘲讽信仰", "回避无法解答的问题"], en: ["argues to win", "mocks faith", "avoids questions it cannot answer"] },
    culturalReinforcers: { zh: ["科普话语", "新无神论", "技术精英文化"], en: ["pop-science discourse", "new atheism", "tech-elite culture"] },
    blockedDoctrines: ["creation", "god_sovereignty", "human_finitude"],
    biblicalCounterTruth: { zh: "敬畏耶和华是知识的开端；受造的心智无法穷尽造物主，理性是恩赐而非审判神的法庭。", en: "The fear of the LORD is the beginning of knowledge; the created mind cannot exhaust the Creator. Reason is a gift, not a court that judges God." },
    gospelReframe: { zh: "科学是认识神所造世界的好仆人，却是坏主人。它能描述受造界的『怎样』，却不能回答『为何存在』『何为善』『如何被赦免』。在基督里，真理不是被你证明的命题，而是位格——你可以认识祂。", en: "Science is a good servant but a poor master. It can describe the 'how' of creation but not 'why anything exists', 'what is good', or 'how to be forgiven'. In Christ, truth is not a proposition you prove but a Person you can know." },
    scriptures: ["Proverbs 3:5-6", "Job 38:4", "Colossians 1:16-17"],
    detectionKeywords: ["科学", "证明", "证据", "理性", "迷信", "实证", "无神", "science", "prove", "evidence", "rational", "superstition"],
    exampleUserPhrases: { zh: ["没有证据的东西我一概不信。", "信仰只是科学还没解释的部分。"], en: ["I don't believe anything without evidence.", "Faith is just the gap science hasn't filled yet."] },
    severityDefault: 3,
  },
  {
    id: "moral_relativism",
    code: "moral_relativism",
    archetypeCode: "rational_pride",
    name: { zh: "道德相对主义", en: "Moral Relativism" },
    shortName: { zh: "相对", en: "Relativism" },
    summary: { zh: "认为没有绝对真理或普世道德，对错只是个人选择或文化建构。", en: "The conviction that there is no absolute truth or universal morality; right and wrong are personal choice or cultural construct." },
    coreLie: { zh: "真理是个人选择，没有绝对的对错。", en: "Truth is a personal choice; there is no absolute right or wrong." },
    falseGospel: { zh: "只要不伤害别人、忠于自己，每个人都可以定义自己的善。", en: "As long as you harm no one and stay true to yourself, each person may define their own good." },
    falseIdentity: { zh: "我是宽容开明、不评判别人的人。", en: "I am the tolerant, open-minded one who judges no one." },
    rootDesires: { zh: ["自由", "不被论断", "自我作主", "避免冲突"], en: ["freedom", "not being judged", "self-rule", "avoiding conflict"] },
    rootFears: { zh: ["被定罪", "被约束", "显得偏狭", "承担道德责任"], en: ["being condemned", "being constrained", "appearing narrow", "moral accountability"] },
    cognitiveSignals: { zh: ["把所有真理主张相对化", "用『这只是你的看法』回避", "暗中又坚持某些绝对（如宽容）"], en: ["relativizes all truth claims", "deflects with 'that's just your view'", "secretly absolutizes some values like tolerance"] },
    emotionalSignals: { zh: ["对权威的反感", "对罪疚的回避", "不安"], en: ["resentment of authority", "avoidance of guilt", "unease"] },
    behavioralSignals: { zh: ["回避明确立场", "随情境改变标准", "抵触悔改"], en: ["avoids firm positions", "shifts standards by situation", "resists repentance"] },
    culturalReinforcers: { zh: ["后现代话语", "『你做你』文化", "消费式价值观"], en: ["postmodern discourse", "'you do you' culture", "consumer values"] },
    blockedDoctrines: ["god_holiness", "sin", "judgment"],
    biblicalCounterTruth: { zh: "神是良善与公义的源头，善恶不是人发明的，而是祂本性的彰显。否认绝对真理本身就是一个绝对主张。", en: "God is the source of goodness and justice; good and evil are not human inventions but the expression of his character. To deny all absolutes is itself an absolute claim." },
    gospelReframe: { zh: "若没有绝对的善，就没有真正的怜悯、公义或盼望——苦难无法被称为『错』，受害者无法被伸冤。福音不是要你戴上道德枷锁，而是把你从『自己定义善恶』的重担中释放：有一位良善的神已经定义了善，并在基督里担当了你的恶。", en: "Without absolute good there is no real mercy, justice, or hope — suffering cannot be called 'wrong' and victims cannot be vindicated. The gospel does not chain you with morality; it frees you from the burden of defining good and evil yourself: a good God has defined the good, and in Christ has borne your evil." },
    scriptures: ["Judges 21:25", "Isaiah 55:8-9", "John 14:6"],
    detectionKeywords: ["相对", "没有绝对", "你的看法", "评判", "宽容", "对错", "relative", "no absolute", "your truth", "tolerance", "judge"],
    exampleUserPhrases: { zh: ["对你是对的，对我未必。", "谁有资格说什么是对的？"], en: ["What's true for you isn't true for me.", "Who's to say what's right?"] },
    severityDefault: 3,
  },
  {
    id: "self_sovereignty",
    code: "self_sovereignty",
    archetypeCode: "self_sovereignty",
    name: { zh: "人本自主", en: "Human Self-Sovereignty" },
    shortName: { zh: "自主", en: "Self-Rule" },
    summary: { zh: "坚持『我的人生我做主』，不愿向任何高于自己的权柄交账。", en: "The insistence that 'my life is mine to run', unwilling to give account to any authority above the self." },
    coreLie: { zh: "我不需要神，我自己可以定义善恶、掌管人生。", en: "I don't need God; I can define good and evil and run my own life." },
    falseGospel: { zh: "做自己的主，靠自己的力量，就能活出最好的人生。", en: "Be your own master and rely on your own strength — that is the best life." },
    falseIdentity: { zh: "我是独立自足、不靠任何人的人。", en: "I am self-sufficient and beholden to no one." },
    rootDesires: { zh: ["自由", "掌控", "独立", "自我实现"], en: ["freedom", "control", "independence", "self-actualization"] },
    rootFears: { zh: ["被支配", "失控", "亏欠他人", "软弱"], en: ["being controlled", "loss of control", "indebtedness", "weakness"] },
    cognitiveSignals: { zh: ["把顺服等同于失去自我", "认为求助是软弱", "对权柄本能警惕"], en: ["equates submission with losing the self", "sees asking for help as weakness", "instinctively distrusts authority"] },
    emotionalSignals: { zh: ["烦躁于被约束", "对依赖的羞耻", "孤独"], en: ["irritation at constraint", "shame around dependence", "loneliness"] },
    behavioralSignals: { zh: ["抗拒寻求帮助", "难以委身", "凡事自己扛"], en: ["resists seeking help", "struggles to commit", "carries everything alone"] },
    culturalReinforcers: { zh: ["自我实现叙事", "成功学", "个人主义"], en: ["self-actualization narratives", "hustle culture", "individualism"] },
    blockedDoctrines: ["god_sovereignty", "human_image_of_god", "repentance"],
    biblicalCounterTruth: { zh: "人是按神形象被造、为与神相交而活的受造者；真自由不在脱离神的自治，而在归回创造我们的那位主里。", en: "Humans are created in God's image to live in communion with him; true freedom is not autonomy from God but homecoming to the Lord who made us." },
    gospelReframe: { zh: "你不是宇宙中孤独的立法者，那是重担不是自由。基督来不是要夺走你的人生，而是要把你被罪扭曲的『自主』赎回成与神同行的『儿女名分』——在祂的主权下，你第一次可以真正安息，不必再独自扛起整个人生。", en: "You are not the lonely lawgiver of the universe — that is a burden, not freedom. Christ comes not to seize your life but to redeem your sin-twisted autonomy into the adoption of a child of God. Under his sovereignty you can finally rest, no longer carrying your whole life alone." },
    scriptures: ["Genesis 3:5", "Isaiah 55:8-9", "Galatians 2:20"],
    detectionKeywords: ["我做主", "靠自己", "不需要神", "独立", "自己决定", "my life", "on my own", "don't need god", "independent", "be my own"],
    exampleUserPhrases: { zh: ["我的人生我自己负责，不用谁来管。", "我靠自己也能过得很好。"], en: ["My life is my own responsibility, no one tells me what to do.", "I can do just fine on my own."] },
    severityDefault: 3,
  },
  {
    id: "therapeutic_self",
    code: "therapeutic_self",
    archetypeCode: "self_sovereignty",
    name: { zh: "心理治疗主义", en: "The Therapeutic Self" },
    shortName: { zh: "感觉", en: "Feelings" },
    summary: { zh: "把『感觉良好』『忠于内心』当作人生最高准则与终极疗愈。", en: "Treating 'feeling good' and 'being true to my feelings' as the highest rule and ultimate healing of life." },
    coreLie: { zh: "我只要感觉好，就说明这是对的；忠于内心就不会错。", en: "If it feels good it must be right; if I follow my heart I cannot go wrong." },
    falseGospel: { zh: "真正的救赎是接纳自己、爱自己、跟随内心的感受。", en: "True salvation is to accept yourself, love yourself, and follow your feelings." },
    falseIdentity: { zh: "我的感受就是我最真实的自我。", en: "My feelings are my truest self." },
    rootDesires: { zh: ["内在平静", "被理解", "自我接纳", "情绪掌控"], en: ["inner peace", "being understood", "self-acceptance", "emotional control"] },
    rootFears: { zh: ["痛苦", "罪疚感", "被否定", "情绪失控"], en: ["pain", "guilt", "being negated", "emotional overwhelm"] },
    cognitiveSignals: { zh: ["以感受为真理标准", "把『罪』重命名为『创伤反应』", "回避客观对错"], en: ["uses feeling as the test of truth", "renames sin as 'trauma response'", "avoids objective right and wrong"] },
    emotionalSignals: { zh: ["对不适的低容忍", "情绪化决策", "自我专注"], en: ["low tolerance of discomfort", "emotion-driven decisions", "self-focus"] },
    behavioralSignals: { zh: ["跟着感觉做选择", "回避使自己不适的责任", "把成长等同于自我感觉变好"], en: ["chooses by feeling", "avoids uncomfortable duties", "equates growth with feeling better"] },
    culturalReinforcers: { zh: ["疗愈话语", "自我关怀产业", "情绪至上文化"], en: ["therapeutic discourse", "self-care industry", "feelings-first culture"] },
    blockedDoctrines: ["sin", "sanctification", "human_image_of_god"],
    biblicalCounterTruth: { zh: "人心比万物都诡诈；感受是被造的好仆人，却是不可靠的主人。真医治不是无条件认同感受，而是在真理中被更新。", en: "The heart is deceitful above all things; feeling is a good servant but an unreliable master. True healing is not endorsing every feeling but being renewed in truth." },
    gospelReframe: { zh: "你的感受是真实的、值得被聆听的——神并不轻看你的痛苦。但感受不能承受『定义你是谁』『判断什么是真』的重担。福音给你比自我接纳更深的东西：在基督里，你被那位看透你的神完全认识，又被祂完全接纳，于是你可以诚实面对感受而不被它辖制。", en: "Your feelings are real and worth hearing — God does not despise your pain. But feelings cannot bear the weight of defining who you are or judging what is true. The gospel offers something deeper than self-acceptance: in Christ you are fully known by the God who sees through you, and fully accepted, so you can be honest about your feelings without being ruled by them." },
    scriptures: ["Jeremiah 17:9", "Proverbs 3:5-6", "Romans 12:2"],
    detectionKeywords: ["感觉", "忠于内心", "爱自己", "接纳自己", "我的真实", "feel", "follow my heart", "love myself", "authentic", "true to myself"],
    exampleUserPhrases: { zh: ["只要我觉得对，那就是对的。", "我只是想做真实的自己。"], en: ["As long as it feels right to me, it is right.", "I just want to be my authentic self."] },
    severityDefault: 3,
  },
  {
    id: "control_idolatry",
    code: "control_idolatry",
    archetypeCode: "self_sovereignty",
    name: { zh: "控制主义", en: "Control Idolatry" },
    shortName: { zh: "控制", en: "Control" },
    summary: { zh: "试图通过掌控结果、他人、环境和未来来获得安全感。", en: "Seeking security by controlling outcomes, people, circumstances, and the future." },
    coreLie: { zh: "只有我掌控一切，事情才不会崩；如果我放手交托，就会失控。", en: "Only if I control everything will things not fall apart; if I let go and trust, it will all unravel." },
    falseGospel: { zh: "只要我计划得够周全、检查得够仔细，就能确保安全。", en: "If I plan thoroughly enough and check carefully enough, I can guarantee safety." },
    falseIdentity: { zh: "我是那个必须托住一切的人。", en: "I am the one who has to hold everything together." },
    rootDesires: { zh: ["确定性", "安全", "秩序", "不出错"], en: ["certainty", "safety", "order", "never failing"] },
    rootFears: { zh: ["失控", "混乱", "失败", "被伤害"], en: ["loss of control", "chaos", "failure", "being hurt"] },
    cognitiveSignals: { zh: ["反复预演最坏情况", "难以信任他人", "把交托等同于不负责"], en: ["rehearses worst-case scenarios", "struggles to trust others", "equates surrender with irresponsibility"] },
    emotionalSignals: { zh: ["焦虑", "烦躁", "恐惧", "愤怒"], en: ["anxiety", "irritability", "fear", "anger"] },
    behavioralSignals: { zh: ["过度计划", "反复检查", "无法休息", "操控他人"], en: ["over-planning", "repeated checking", "inability to rest", "managing others"] },
    culturalReinforcers: { zh: ["绩效文化", "风险管理叙事", "完美主义"], en: ["performance culture", "risk-management narratives", "perfectionism"] },
    blockedDoctrines: ["god_sovereignty", "grace", "human_finitude"],
    biblicalCounterTruth: { zh: "神的主权不是威胁，而是被造者安息的根基。你被一位良善而全能的神托住，你可以尽责，却不必成为掌管万有的主。", en: "God's sovereignty is not a threat but the ground of the creature's rest. You are held by a God both good and almighty; you may be faithful without being the lord of all things." },
    gospelReframe: { zh: "你紧抓控制，是因为你以为安全只能靠自己制造。但基督已经掌权，并在十字架上证明祂对你的善。你可以尽你当尽的责任，然后把结果交在那位连头发都数过的父手中。放手不是失控，而是把控制权交还给唯一真正掌权、又真正爱你的那位。", en: "You grip control because you believe safety must be manufactured by you. But Christ already reigns, and the cross proves his goodness toward you. You can do your part, then place the outcome in the hands of a Father who has numbered your hairs. Letting go is not losing control; it is returning control to the One who truly reigns and truly loves you." },
    scriptures: ["Proverbs 3:5-6", "Matthew 11:28-30", "Daniel 2:21"],
    detectionKeywords: ["控制", "掌控", "计划", "失控", "不确定", "安排", "检查", "control", "plan", "uncertain", "out of control", "manage"],
    exampleUserPhrases: { zh: ["只要事情有一点不确定，我就很焦虑。", "我必须把每个细节都安排好。"], en: ["The moment anything is uncertain, I get anxious.", "I have to have every detail arranged."] },
    severityDefault: 3,
  },
  {
    id: "consumerism",
    code: "consumerism",
    archetypeCode: "desire_absolutism",
    name: { zh: "消费主义", en: "Consumerism" },
    shortName: { zh: "消费", en: "Consume" },
    summary: { zh: "藉着拥有、购买、升级来寻求身份、安全与满足。", en: "Seeking identity, security, and fulfillment through owning, buying, and upgrading." },
    coreLie: { zh: "我拥有更多东西，生命就更完整。", en: "The more I own, the more complete my life will be." },
    falseGospel: { zh: "下一次购买、下一个升级，会终于让我满足。", en: "The next purchase, the next upgrade, will finally make me content." },
    falseIdentity: { zh: "我是我所拥有、所展示的东西。", en: "I am what I own and display." },
    rootDesires: { zh: ["安全感", "地位", "满足", "掌控"], en: ["security", "status", "satisfaction", "control"] },
    rootFears: { zh: ["匮乏", "落伍", "平庸", "失去地位"], en: ["scarcity", "falling behind", "being ordinary", "losing status"] },
    cognitiveSignals: { zh: ["用消费调节情绪", "把幸福与拥有挂钩", "持续比较物质"], en: ["regulates emotion by buying", "ties happiness to possessions", "constantly compares belongings"] },
    emotionalSignals: { zh: ["购物后的空虚", "嫉妒", "焦虑", "短暂兴奋"], en: ["post-purchase emptiness", "envy", "anxiety", "fleeting excitement"] },
    behavioralSignals: { zh: ["冲动消费", "难以慷慨", "用购物逃避情绪"], en: ["impulse buying", "difficulty being generous", "shopping to escape feelings"] },
    culturalReinforcers: { zh: ["广告", "网红种草", "升级文化"], en: ["advertising", "influencer hauls", "upgrade culture"] },
    blockedDoctrines: ["creation", "grace", "kingdom_of_god"],
    biblicalCounterTruth: { zh: "人的生命不在乎家道丰富；敬虔加上知足的心便是大利。受造之物是好礼物，却无法承受『终极满足』的重担。", en: "Life does not consist in abundance of possessions; godliness with contentment is great gain. Created things are good gifts but cannot bear the weight of ultimate satisfaction." },
    gospelReframe: { zh: "购物带来的兴奋很快退去，因为有限之物无法填满为无限者预备的心。福音不是禁止你享受美好之物，而是把它们归回应有的位置：神自己才是至宝，在祂里面你已经富足，于是你可以感恩地享受、慷慨地施予，而不再被『还不够』奴役。", en: "The thrill of buying fades fast, because finite things cannot fill a heart made for the Infinite. The gospel does not forbid enjoying good things; it restores them to their place: God himself is the treasure, and in him you are already rich — so you can enjoy with gratitude and give with freedom, no longer enslaved to 'not enough'." },
    scriptures: ["Luke 12:15", "1 Timothy 6:6-10", "Matthew 6:24"],
    detectionKeywords: ["买", "购物", "拥有", "更多", "升级", "物质", "消费", "buy", "shopping", "own", "more stuff", "upgrade"],
    exampleUserPhrases: { zh: ["买点东西就感觉好一点。", "等我买到那个，我就满足了。"], en: ["Buying something makes me feel better.", "Once I get that, I'll be satisfied."] },
    severityDefault: 2,
  },
  {
    id: "digital_distraction",
    code: "digital_distraction",
    archetypeCode: "desire_absolutism",
    name: { zh: "娱乐麻醉", en: "Digital Distraction" },
    shortName: { zh: "麻醉", en: "Numbing" },
    summary: { zh: "用不断的刷屏、娱乐、刺激来麻醉内心，回避安静面对神与自己。", en: "Numbing the inner self with constant scrolling, entertainment, and stimulation to avoid stillness before God and self." },
    coreLie: { zh: "我只要不断娱乐，就不用面对内心的空虚。", en: "As long as I keep entertaining myself, I never have to face the emptiness inside." },
    falseGospel: { zh: "下一个视频、下一局游戏，会让我感觉好起来。", en: "The next video, the next game, will make me feel okay." },
    falseIdentity: { zh: "我是需要持续被娱乐填满才能存在的人。", en: "I am someone who needs constant entertainment just to exist." },
    rootDesires: { zh: ["舒适", "逃避", "刺激", "被分心"], en: ["comfort", "escape", "stimulation", "distraction"] },
    rootFears: { zh: ["无聊", "空虚", "独处", "面对真实自我"], en: ["boredom", "emptiness", "solitude", "facing the real self"] },
    cognitiveSignals: { zh: ["无法忍受安静", "把独处与痛苦画等号", "持续寻找下一个刺激"], en: ["cannot tolerate silence", "equates solitude with pain", "always seeking the next hit"] },
    emotionalSignals: { zh: ["空虚", "焦躁", "倦怠", "刷后的内疚"], en: ["emptiness", "restlessness", "fatigue", "post-scroll guilt"] },
    behavioralSignals: { zh: ["强迫性刷屏", "逃避祷告与责任", "深夜停不下来"], en: ["compulsive scrolling", "avoiding prayer and duty", "can't stop late at night"] },
    culturalReinforcers: { zh: ["无限信息流", "推荐算法", "随时在线文化"], en: ["infinite feeds", "recommendation algorithms", "always-on culture"] },
    blockedDoctrines: ["god_love", "sanctification", "new_creation"],
    biblicalCounterTruth: { zh: "心灵的空虚需要被带到神面前、被真实关系充满，而不是被刺激麻醉。耶稣常退到旷野安静祷告，安息是恩典而非缺失。", en: "The emptiness of the soul must be brought to God and filled with real communion, not numbed by stimulation. Jesus withdrew to pray in stillness; rest is grace, not lack." },
    gospelReframe: { zh: "你不断刷屏，往往是因为安静下来时会听见内心你不想面对的声音。但那份空虚其实是一个邀请——它本是为神预留的空间。福音邀请你不是用更多刺激填满它，而是把它带到那位说『凡劳苦担重担的可以到我这里来』的主面前。试着用五分钟的安静代替一次刷屏，你会发现你逃避的，正是你最需要的。", en: "You keep scrolling often because stillness lets you hear what you don't want to face. But that emptiness is an invitation — it is space made for God. The gospel asks you not to fill it with more stimulation but to bring it to the One who says, 'Come to me, all who labor.' Trade one scroll for five minutes of silence, and you may find that what you've been avoiding is exactly what you most need." },
    scriptures: ["Mark 1:35", "Matthew 11:28-30", "Psalm 16:11"],
    detectionKeywords: ["刷", "停不下来", "短视频", "游戏", "无聊", "逃避", "娱乐", "scroll", "binge", "can't stop", "distract", "numb"],
    exampleUserPhrases: { zh: ["我一安静下来就忍不住想刷手机。", "我用刷视频来逃避不想面对的事。"], en: ["The moment it's quiet I reach for my phone.", "I scroll videos to escape what I don't want to face."] },
    severityDefault: 2,
  },
  {
    id: "desire_identity_fusion",
    code: "desire_identity_fusion",
    archetypeCode: "desire_absolutism",
    name: { zh: "情欲自由主义", en: "Desire-Identity Fusion" },
    shortName: { zh: "情欲", en: "Desire" },
    summary: { zh: "把欲望（尤其性欲）等同于真实自我，认为压抑欲望就是压抑生命。", en: "Equating desire (especially sexual desire) with the true self, so that restraining desire feels like suppressing life itself." },
    coreLie: { zh: "我的欲望就是我的真实自我，满足欲望才是忠于自己。", en: "My desires are my true self; satisfying them is being true to who I am." },
    falseGospel: { zh: "解放与满足欲望，就是活出真实、自由的人生。", en: "Liberating and satisfying desire is what it means to live a free, authentic life." },
    falseIdentity: { zh: "我就是我的欲望；约束欲望就是否定我。", en: "I am my desires; to restrain them is to deny me." },
    rootDesires: { zh: ["快感", "自由", "被接纳", "亲密"], en: ["pleasure", "freedom", "acceptance", "intimacy"] },
    rootFears: { zh: ["被压抑", "孤独", "羞耻", "失去自我"], en: ["being repressed", "loneliness", "shame", "losing the self"] },
    cognitiveSignals: { zh: ["把节制读作压抑", "把身体当作纯粹的工具或快感来源", "抗拒圣洁的呼召"], en: ["reads self-control as repression", "treats the body as mere instrument or pleasure source", "resists the call to holiness"] },
    emotionalSignals: { zh: ["羞耻与渴望交织", "空虚", "强迫感"], en: ["intertwined shame and craving", "emptiness", "compulsion"] },
    behavioralSignals: { zh: ["难以节制", "隐秘的性模式", "用亲密逃避孤独"], en: ["difficulty with restraint", "secret sexual patterns", "using intimacy to escape loneliness"] },
    culturalReinforcers: { zh: ["『欲望即身份』叙事", "色情产业", "表达即自由的文化"], en: ["'desire is identity' narratives", "pornography industry", "expression-as-freedom culture"] },
    blockedDoctrines: ["human_image_of_god", "sanctification", "repentance"],
    biblicalCounterTruth: { zh: "身体是圣灵的殿，是重价买来的；欲望是好礼物，却不是主人。真自由不是放纵欲望，而是欲望被神的爱重新排序。", en: "The body is a temple of the Holy Spirit, bought at a price; desire is a good gift but not the master. True freedom is not the indulgence of desire but desire reordered by the love of God." },
    gospelReframe: { zh: "你不等于你的欲望——这其实是好消息。如果你就是你的冲动，那你永远是它的奴隶。福音不是羞辱你的渴望，而是认真对待它：你被造是为了真正的亲密与爱，这渴望本身指向神。在基督里，你的身份不再由欲望定义，于是你第一次有自由去爱，而不是被欲望驱使。这条路常需要在安全、成熟的属灵同伴陪伴下慢慢走。", en: "You are not your desires — and that is good news. If you were your impulses, you would always be their slave. The gospel does not shame your longings; it takes them seriously: you were made for real intimacy and love, and that longing points to God. In Christ your identity is no longer defined by desire, so for the first time you are free to love rather than be driven. This path often needs to be walked slowly, with safe, mature companions alongside." },
    scriptures: ["1 Corinthians 6:18-20", "1 Thessalonians 4:3-5", "Galatians 2:20"],
    detectionKeywords: ["欲望", "情欲", "压抑", "真实自我", "色情", "节制", "desire", "lust", "repress", "porn", "authentic self"],
    exampleUserPhrases: { zh: ["压抑欲望就是不真实地活着。", "这就是我，为什么要克制？"], en: ["Suppressing desire is living a lie.", "This is just who I am, why hold back?"] },
    severityDefault: 3,
  },
  {
    id: "achievement_idolatry",
    code: "achievement_idolatry",
    archetypeCode: "performance_righteousness",
    name: { zh: "成功主义", en: "Achievement Idolatry" },
    shortName: { zh: "成功", en: "Success" },
    summary: { zh: "人通过成就、表现、社会认可来获得价值感与称义感。", en: "Worth and a sense of justification are gained through achievement, performance, and social approval." },
    coreLie: { zh: "我必须成功，才有价值。", en: "I must succeed in order to have worth." },
    falseGospel: { zh: "成功使我被接纳，表现使我称义。", en: "Success makes me accepted; performance makes me justified." },
    falseIdentity: { zh: "我是我的成就、履历、收入、地位和他人评价。", en: "I am my achievements, résumé, income, status, and others' opinions." },
    rootDesires: { zh: ["被认可", "被尊重", "赢过别人", "避免羞耻"], en: ["recognition", "respect", "winning", "avoiding shame"] },
    rootFears: { zh: ["失败", "被轻看", "无价值", "落后"], en: ["failure", "being looked down on", "worthlessness", "falling behind"] },
    cognitiveSignals: { zh: ["不断比较", "把失败解释为自我否定", "用结果衡量生命价值"], en: ["constant comparison", "reads failure as self-negation", "measures life's worth by results"] },
    emotionalSignals: { zh: ["焦虑", "嫉妒", "羞耻", "竞争性愤怒"], en: ["anxiety", "envy", "shame", "competitive anger"] },
    behavioralSignals: { zh: ["过度工作", "无法休息", "自我展示", "害怕承认失败"], en: ["overworking", "inability to rest", "self-display", "fear of admitting failure"] },
    culturalReinforcers: { zh: ["学历主义", "职场绩效文化", "创业成功叙事", "社交媒体展示"], en: ["credentialism", "workplace performance culture", "startup success narratives", "social-media display"] },
    blockedDoctrines: ["grace", "justification", "identity_in_christ"],
    biblicalCounterTruth: { zh: "人在神面前的价值不是靠表现获得，而是在被造、蒙爱、被基督救赎中被确立。", en: "Your worth before God is not earned by performance but established in being created, loved, and redeemed by Christ." },
    gospelReframe: { zh: "基督的义胜过我的表现；我可以努力工作，但不再用成就证明自己。你不是你的履历。在十字架上，基督已经为你成就了你永远无法靠表现赢得的接纳——所以你今天可以忠心做事，却不必再用结果来换取价值。", en: "Christ's righteousness outweighs my performance; I can work hard, yet no longer prove myself by achievement. You are not your résumé. On the cross Christ has already secured the acceptance you could never earn — so today you can labor faithfully without trading results for worth." },
    scriptures: ["Ephesians 2:8-9", "Matthew 11:28-30", "Philippians 3:7-9"],
    detectionKeywords: ["成功", "证明自己", "不能输", "被看不起", "没价值", "失败", "succeed", "prove myself", "can't lose", "worthless", "failure"],
    exampleUserPhrases: { zh: ["如果我不成功，别人根本不会尊重我。", "我失败了就说明我不行。"], en: ["If I'm not successful, no one will respect me.", "If I fail, it means I'm not enough."] },
    severityDefault: 3,
  },
  {
    id: "techno_messianism",
    code: "techno_messianism",
    archetypeCode: "techno_salvation",
    name: { zh: "技术弥赛亚主义", en: "Techno-Messianism" },
    shortName: { zh: "技术", en: "Tech" },
    summary: { zh: "相信技术足够强大时，人类就能解决罪、死亡、痛苦和无意义。", en: "The belief that, given enough technological power, humanity will solve sin, death, suffering, and meaninglessness." },
    coreLie: { zh: "技术最终可以解决人的根本问题。", en: "Technology can ultimately solve humanity's deepest problems." },
    falseGospel: { zh: "靠创新、效率与增强人类能力，我们能自我拯救。", en: "Through innovation, efficiency, and human enhancement, we can save ourselves." },
    falseIdentity: { zh: "我是站在未来一边、改造世界的创造者。", en: "I am a creator on the side of the future, remaking the world." },
    rootDesires: { zh: ["掌控", "超越限制", "进步", "永生般的延续"], en: ["control", "transcending limits", "progress", "quasi-immortality"] },
    rootFears: { zh: ["落后", "无能", "死亡", "失控"], en: ["falling behind", "powerlessness", "death", "loss of control"] },
    cognitiveSignals: { zh: ["把人的问题误判为效率问题", "对人的限制不耐", "把救赎寄托于进步"], en: ["misreads human problems as efficiency problems", "impatience with human limits", "locates salvation in progress"] },
    emotionalSignals: { zh: ["亢奋", "傲慢", "对限制的愤怒", "隐藏的焦虑"], en: ["euphoria", "arrogance", "anger at limits", "hidden anxiety"] },
    behavioralSignals: { zh: ["把一切优化", "轻看智慧传统", "用工具回避属灵问题"], en: ["optimizes everything", "dismisses wisdom traditions", "uses tools to avoid spiritual questions"] },
    culturalReinforcers: { zh: ["硅谷叙事", "超人类主义", "颠覆式创新文化"], en: ["Silicon Valley narratives", "transhumanism", "disruptive-innovation culture"] },
    blockedDoctrines: ["sin", "cross", "human_finitude"],
    biblicalCounterTruth: { zh: "技术能扩展人的能力，却不能赦免罪、洁净心、胜过死亡。人的根本问题不是效率，而是罪与死亡，唯有基督能解决。", en: "Technology can extend human ability but cannot forgive sin, cleanse the heart, or conquer death. Humanity's deepest problem is not efficiency but sin and death — which only Christ can solve." },
    gospelReframe: { zh: "技术是神所赐受造能力的延伸，是好礼物。但它能造更好的工具，却造不出更好的心。巴别塔的故事提醒我们：靠人手建造通天之路，最终带来混乱而非拯救。福音宣告：你最深的问题不是还没被解决的工程难题，而是需要被赦免的罪与需要被胜过的死亡——基督已经在十字架与空坟墓中成就了技术永远做不到的事。", en: "Technology is an extension of God-given creative ability, a good gift. But it can build better tools, not better hearts. Babel reminds us that building a way to heaven by human hands ends in confusion, not salvation. The gospel declares that your deepest problem is not an unsolved engineering challenge but sin to be forgiven and death to be conquered — which Christ has already accomplished at the cross and the empty tomb." },
    scriptures: ["Romans 1:20-25", "Isaiah 53:3-5", "1 Corinthians 6:18-20"],
    detectionKeywords: ["技术", "AI", "效率", "优化", "进步", "解决", "未来", "technology", "ai", "optimize", "progress", "solve everything"],
    exampleUserPhrases: { zh: ["科技最终会解决人类所有的痛苦。", "只要算法够强，什么问题都能解决。"], en: ["Technology will eventually solve all human suffering.", "With a strong enough algorithm, any problem is solvable."] },
    severityDefault: 2,
  },
  {
    id: "identity_absolutism",
    code: "identity_absolutism",
    archetypeCode: "political_idolatry",
    name: { zh: "身份政治", en: "Identity Absolutism" },
    shortName: { zh: "身份", en: "Identity" },
    summary: { zh: "把某一群体身份当作终极的自我、归属与道德坐标，凡事以阵营划线。", en: "Making a group identity the ultimate self, belonging, and moral compass, dividing all things by camp." },
    coreLie: { zh: "我必须站在正确的群体里，才有身份和安全感。", en: "I must belong to the right group to have identity and security." },
    falseGospel: { zh: "归属于正确的阵营，就能获得意义、清白与归属。", en: "Belonging to the right camp grants meaning, innocence, and belonging." },
    falseIdentity: { zh: "我首先是我的群体标签，其次才是别的。", en: "I am first my group label, and only secondarily anything else." },
    rootDesires: { zh: ["归属", "意义", "被看见", "道德清白"], en: ["belonging", "meaning", "being seen", "moral innocence"] },
    rootFears: { zh: ["被排斥", "被消音", "孤立", "成为压迫者"], en: ["exclusion", "being silenced", "isolation", "being the oppressor"] },
    cognitiveSignals: { zh: ["以阵营判断对错", "把异见者非人化", "用群体定义全部价值"], en: ["judges right and wrong by camp", "dehumanizes dissenters", "defines all worth by group"] },
    emotionalSignals: { zh: ["义愤", "恐惧", "对外群体的轻蔑"], en: ["righteous anger", "fear", "contempt for the out-group"] },
    behavioralSignals: { zh: ["划线站队", "回声室", "难以与异见者真诚相处"], en: ["drawing lines and taking sides", "echo chambers", "inability to relate honestly across difference"] },
    culturalReinforcers: { zh: ["身份政治话语", "算法回声室", "极化媒体"], en: ["identity-politics discourse", "algorithmic echo chambers", "polarized media"] },
    blockedDoctrines: ["human_image_of_god", "church", "kingdom_of_god"],
    biblicalCounterTruth: { zh: "每个人都按神形象被造，价值不源于群体标签；在基督里，最深的身份与归属超越一切人为的阵营。", en: "Every person is made in God's image; worth does not come from group labels. In Christ, the deepest identity and belonging transcend every human camp." },
    gospelReframe: { zh: "对归属的渴望是真实而美好的——你本被造是为了归属。但任何地上的群体都无法承受『定义你是谁、宣告你清白』的重担，而且会要求你把异见者当作敌人。福音给你一个更深的身份：在基督里，你被神收纳为儿女，这身份不靠你站对队赢得，也不会被取消。从这身份出发，你能爱与你不同的人，因为他们同样按神形象被造。", en: "The longing to belong is real and good — you were made for belonging. But no earthly group can bear the weight of defining who you are or declaring you innocent, and it will demand that you treat dissenters as enemies. The gospel offers a deeper identity: in Christ you are adopted as God's child, an identity you did not win by taking the right side and cannot lose. From there you can love those unlike you, because they too bear God's image." },
    scriptures: ["Romans 1:20-25", "Philippians 3:20", "Revelation 21:3-5"],
    detectionKeywords: ["阵营", "群体", "他们", "我们这边", "归属", "标签", "camp", "us vs them", "belong", "side", "identity group"],
    exampleUserPhrases: { zh: ["不站在我们这边的人都不可信。", "离开这个群体我就不知道自己是谁了。"], en: ["Anyone not on our side can't be trusted.", "Without this group I wouldn't know who I am."] },
    severityDefault: 2,
  },
  {
    id: "political_idolatry",
    code: "political_idolatry",
    archetypeCode: "political_idolatry",
    name: { zh: "政治偶像", en: "Political Idolatry" },
    shortName: { zh: "权力", en: "Politics" },
    summary: { zh: "把政治权力、领袖或运动当作终极盼望，相信它能拯救世界。", en: "Treating political power, a leader, or a movement as ultimate hope, believing it will save the world." },
    coreLie: { zh: "世界最终靠正确的政治胜利被拯救。", en: "The world will ultimately be saved by the right political victory." },
    falseGospel: { zh: "只要我们这一方掌权，正义与安全就会来临。", en: "If our side takes power, justice and security will finally arrive." },
    falseIdentity: { zh: "我是为正确事业而战的战士。", en: "I am a warrior for the right cause." },
    rootDesires: { zh: ["正义", "权力", "安全", "掌控历史走向"], en: ["justice", "power", "security", "control of history"] },
    rootFears: { zh: ["失势", "敌方得胜", "社会崩坏", "无力"], en: ["losing power", "the other side winning", "societal collapse", "powerlessness"] },
    cognitiveSignals: { zh: ["把对手妖魔化", "把救恩政治化", "为目的合理化手段"], en: ["demonizes opponents", "politicizes salvation", "justifies means by ends"] },
    emotionalSignals: { zh: ["恐惧", "义怒", "对失败的绝望"], en: ["fear", "righteous fury", "despair at loss"] },
    behavioralSignals: { zh: ["把政治当信仰投入", "因立场割席", "新闻驱动情绪"], en: ["invests in politics as religion", "cuts off relationships over positions", "news-driven emotions"] },
    culturalReinforcers: { zh: ["极化政治", "末世式竞选叙事", "愤怒媒体经济"], en: ["polarized politics", "apocalyptic campaign narratives", "outrage media economy"] },
    blockedDoctrines: ["kingdom_of_god", "god_sovereignty", "judgment"],
    biblicalCounterTruth: { zh: "神改变时候、日期，废王、立王；不要倚靠君王。基督的国不属这世界，真正的盼望不在权力更替，而在祂的再来。", en: "God changes times and seasons; he removes kings and sets up kings. Put not your trust in princes. Christ's kingdom is not of this world; true hope rests not in a change of power but in his return." },
    gospelReframe: { zh: "关心公义与政治本是好的，是爱邻舍的一部分。但当政治成为你的终极盼望，它就会变成偶像——让你恐惧、愤怒，把对手当敌人。福音提醒你：世界的拯救不取决于哪一方胜选，而取决于已经掌权、并将再来施行公义的那位君王。从神国的盼望出发，你可以认真参与政治，却不被它辖制，也能爱政见不同的邻舍。", en: "Caring about justice and politics is good — part of loving your neighbor. But when politics becomes your ultimate hope it becomes an idol, leaving you fearful, angry, and treating opponents as enemies. The gospel reminds you that the world's salvation does not hinge on which side wins an election but on the King who already reigns and will return to do justice. Anchored in kingdom hope, you can engage politics seriously without being enslaved by it, and love neighbors who vote differently." },
    scriptures: ["Psalm 146:3", "Daniel 2:21", "Philippians 3:20"],
    detectionKeywords: ["政治", "选举", "掌权", "敌人", "正义", "对手", "阵营", "politics", "election", "power", "the other side", "enemy"],
    exampleUserPhrases: { zh: ["如果他们赢了，这个国家就完了。", "只有我们这方掌权，一切才会好。"], en: ["If they win, this country is finished.", "Only if our side holds power will things be okay."] },
    severityDefault: 2,
  },
  {
    id: "nihilism",
    code: "nihilism",
    archetypeCode: "wounded_unbelief",
    name: { zh: "虚无主义", en: "Nihilism" },
    shortName: { zh: "虚无", en: "Nihilism" },
    summary: { zh: "认为世界没有意义、没有目的，于是认真、盼望与爱都显得徒然。", en: "The conviction that the world is without meaning or purpose, so that earnestness, hope, and love all seem futile." },
    coreLie: { zh: "世界没有意义，所以认真也没用。", en: "The world is meaningless, so it's pointless to care." },
    falseGospel: { zh: "看穿一切都是虚空，就能免于失望、保护自己。", en: "Seeing through everything as vanity protects you from disappointment." },
    falseIdentity: { zh: "我是看透真相、不再天真的人。", en: "I am the one who sees through it all and is no longer naive." },
    rootDesires: { zh: ["免于失望", "自我保护", "诚实", "终极意义"], en: ["freedom from disappointment", "self-protection", "honesty", "ultimate meaning"] },
    rootFears: { zh: ["再次受伤", "盼望落空", "被欺骗", "存在的无意义"], en: ["being hurt again", "hope disappointed", "being deceived", "existential meaninglessness"] },
    cognitiveSignals: { zh: ["预设一切徒劳", "把犬儒当成熟", "回避投入与盼望"], en: ["assumes all is futile", "mistakes cynicism for maturity", "avoids commitment and hope"] },
    emotionalSignals: { zh: ["麻木", "倦怠", "隐藏的悲伤", "疏离"], en: ["numbness", "weariness", "hidden grief", "detachment"] },
    behavioralSignals: { zh: ["不再投入", "嘲讽意义", "退缩与拖延"], en: ["disengagement", "mocking meaning", "withdrawal and drift"] },
    culturalReinforcers: { zh: ["丧文化", "解构一切的话语", "倦怠世代叙事"], en: ["doomer culture", "deconstruct-everything discourse", "burnout-generation narratives"] },
    blockedDoctrines: ["creation", "resurrection", "new_creation"],
    biblicalCounterTruth: { zh: "万有都是借基督造的，也为他造；复活宣告爱、公义与盼望终将胜过死亡与虚空。意义不是人发明的幻觉，而是创造的真相。", en: "All things were created through Christ and for him; the resurrection declares that love, justice, and hope will finally triumph over death and futility. Meaning is not an invented illusion but the truth of creation." },
    gospelReframe: { zh: "虚无常常不是冷静的哲学，而是受伤后的自我保护——如果什么都不重要，就没有什么能再伤害我。这份疲惫与悲伤值得被温柔对待。但你内心对意义的渴望本身就是线索：若世界真是纯然虚空，你为何会为它的无意义而痛？复活宣告：你流过的眼泪不会消失在虚空里，有一位神要擦去一切眼泪，并将万物更新。意义不是你必须制造的重担，而是你可以领受的恩典。", en: "Nihilism is often not cool philosophy but self-protection after being hurt — if nothing matters, nothing can wound me again. That weariness and grief deserve gentleness. Yet your very longing for meaning is a clue: if the world were sheer emptiness, why would its meaninglessness pain you? The resurrection declares that your tears do not vanish into the void; a God is coming to wipe away every tear and make all things new. Meaning is not a burden you must manufacture but a grace you can receive." },
    scriptures: ["Ecclesiastes 1:2", "Colossians 1:16-17", "Revelation 21:3-5"],
    detectionKeywords: ["没意义", "虚无", "无所谓", "认真就输了", "徒劳", "空虚", "meaningless", "pointless", "nothing matters", "why bother", "empty"],
    exampleUserPhrases: { zh: ["反正什么都没意义，努力有什么用。", "认真你就输了。"], en: ["Nothing matters anyway, why try.", "Caring is for suckers."] },
    severityDefault: 3,
  },
  {
    id: "suffering_objection",
    code: "suffering_objection",
    archetypeCode: "wounded_unbelief",
    name: { zh: "苦难控诉", en: "The Suffering Objection" },
    shortName: { zh: "苦难", en: "Suffering" },
    summary: { zh: "因经历或目睹苦难，把未被解释的痛苦读作神不爱、不在或不可信的证据。", en: "Through experiencing or witnessing suffering, reading unexplained pain as proof that God is unloving, absent, or untrustworthy." },
    coreLie: { zh: "如果神爱我，就不该让我受苦；我有痛苦，神就欠我解释。", en: "If God loved me he would not let me suffer; my pain means God owes me an explanation." },
    falseGospel: { zh: "只要我得到完整的解释，我才能重新相信。", en: "Only when I get a complete explanation can I believe again." },
    falseIdentity: { zh: "我是被神亏待、被遗弃的人。", en: "I am the one God has wronged and abandoned." },
    rootDesires: { zh: ["被理解", "公义", "安全", "痛苦被看见"], en: ["being understood", "justice", "safety", "having pain seen"] },
    rootFears: { zh: ["再次受伤", "神不善", "孤立无援", "痛苦没有意义"], en: ["being hurt again", "that God is not good", "being alone", "that pain is meaningless"] },
    cognitiveSignals: { zh: ["要求神为苦难作解释", "把沉默读作离弃", "用痛苦质疑神的善"], en: ["demands an explanation for suffering", "reads silence as abandonment", "questions God's goodness through pain"] },
    emotionalSignals: { zh: ["愤怒", "委屈", "悲伤", "疲惫"], en: ["anger", "grievance", "grief", "exhaustion"] },
    behavioralSignals: { zh: ["远离祷告与神", "回避教会", "压抑或爆发情绪"], en: ["withdrawing from prayer and God", "avoiding church", "suppressing or erupting emotions"] },
    culturalReinforcers: { zh: ["『好人不该受苦』预设", "速效安慰文化", "回避哀伤的环境"], en: ["the assumption that good people shouldn't suffer", "quick-fix comfort culture", "grief-avoidant settings"] },
    blockedDoctrines: ["god_love", "god_sovereignty", "cross"],
    biblicalCounterTruth: { zh: "神不是远离苦难的神；基督在十字架上进入人的苦难、罪与死亡。十字架不解释每一个细节，却显明神不是冷漠的旁观者，而是亲自承担者。", en: "God is not a God far from suffering; on the cross Christ entered human suffering, sin, and death. The cross does not explain every detail, but it shows that God is not a detached observer but One who bears it himself." },
    gospelReframe: { zh: "你的痛苦是真实的，你的困惑与愤怒并不是不信的罪——圣经里满是哀歌，连耶稣都喊『我的神，为什么离弃我』。这里先不急着给你一个解释或叫你立刻喜乐。福音指向的不是一套关于苦难的理论，而是一位进入苦难的神：在十字架上，神没有站在远处解释痛苦，而是亲自走进痛苦、担当死亡。你可以把真实的哀哭带到祂面前，而不必远离祂。也请不要独自承受——找一位成熟可信的牧者或属灵同伴陪你。", en: "Your pain is real, and your confusion and anger are not the sin of unbelief — Scripture is full of laments, and even Jesus cried, 'My God, why have you forsaken me?' This is not the moment to hand you an explanation or tell you to rejoice. The gospel points not to a theory about suffering but to a God who entered it: on the cross God did not stand at a distance explaining pain but walked into it and bore death himself. You can bring your honest grief to him rather than away from him. And please do not carry this alone — find a mature, trustworthy pastor or companion to walk with you." },
    scriptures: ["Psalm 13", "Psalm 22:1-2", "Isaiah 53:3-5"],
    detectionKeywords: ["为什么", "受苦", "痛苦", "神不公平", "为什么是我", "离弃", "suffer", "why me", "unfair", "where was god", "abandoned"],
    exampleUserPhrases: { zh: ["如果神真的爱我，为什么允许这些事发生？", "我太痛苦了，也不想再祷告了。"], en: ["If God really loves me, why does he allow this?", "I'm in so much pain, I don't even want to pray anymore."] },
    severityDefault: 4,
  },
  {
    id: "church_hurt",
    code: "church_hurt",
    archetypeCode: "wounded_unbelief",
    name: { zh: "教会伤害", en: "Church Hurt" },
    shortName: { zh: "教会伤", en: "Church Hurt" },
    summary: { zh: "因在教会或属灵权柄下受过伤，把人的失败读作神的不可信。", en: "Having been hurt by a church or spiritual authority, reading human failure as proof that God is untrustworthy." },
    coreLie: { zh: "教会有问题，所以神不可信。", en: "The church failed, therefore God cannot be trusted." },
    falseGospel: { zh: "远离一切信仰群体，就能保护自己不再受伤。", en: "Staying away from all faith community will protect me from being hurt again." },
    falseIdentity: { zh: "我是被宗教辜负、识破真相的人。", en: "I am the one religion betrayed, who finally saw through it." },
    rootDesires: { zh: ["安全", "公义", "被尊重", "真实的群体"], en: ["safety", "justice", "being respected", "genuine community"] },
    rootFears: { zh: ["再次被伤害", "被操控", "被背叛", "重蹈覆辙"], en: ["being hurt again", "being manipulated", "betrayal", "repeating the past"] },
    cognitiveSignals: { zh: ["把人的罪等同于神的本性", "对属灵权柄全面警惕", "把退出当作唯一保护"], en: ["equates human sin with God's character", "blanket distrust of spiritual authority", "treats withdrawal as the only protection"] },
    emotionalSignals: { zh: ["愤怒", "悲伤", "背叛感", "警惕"], en: ["anger", "grief", "sense of betrayal", "guardedness"] },
    behavioralSignals: { zh: ["回避聚会", "难以信任领袖", "孤立信仰"], en: ["avoiding gatherings", "difficulty trusting leaders", "isolating one's faith"] },
    culturalReinforcers: { zh: ["教会丑闻", "解构社群", "对机构的普遍不信任"], en: ["church scandals", "deconstruction communities", "general distrust of institutions"] },
    blockedDoctrines: ["church", "god_love", "grace"],
    biblicalCounterTruth: { zh: "神既不为伤害你的人辩护，也未离弃你；祂自己就是被宗教权贵弃绝、钉十字架的那位。人的失败是真实的，却不能定义神的本性。", en: "God neither excuses those who hurt you nor abandons you; he is the very One rejected and crucified by the religious establishment. Human failure is real but does not define God's character." },
    gospelReframe: { zh: "你受的伤是真实的，系统不该轻率地说『你要赶快饶恕』或『回去就好了』。更合适的第一步是安全、被聆听、被保护。值得记住的是：神并不站在伤害你的权柄那一边——祂自己就是被宗教领袖弃绝、定罪、钉死的那位。教会的失败是真实的罪，但人的罪不能定义神的本性。当你预备好时，可以在安全、健康的属灵同伴陪伴下，慢慢分辨：哪些是该远离的伤害，哪些是神仍向你伸出的恩典。", en: "Your wound is real, and the system should not glibly say 'you must forgive quickly' or 'just go back.' A wiser first step is safety, being heard, and being protected. It is worth remembering that God does not stand on the side of the authority that hurt you — he is the very One rejected, condemned, and crucified by religious leaders. The church's failure is real sin, but human sin does not define God's nature. When you are ready, with safe and healthy companions, you can slowly discern what harm to stay away from and what grace God still extends to you." },
    scriptures: ["Psalm 22:1-2", "2 Corinthians 1:3-7", "Isaiah 53:3-5"],
    detectionKeywords: ["教会伤害", "牧者", "被论断", "教会让我", "属灵权柄", "受伤", "church hurt", "pastor", "judged", "spiritual abuse", "betrayed"],
    exampleUserPhrases: { zh: ["教会的人那样对我，我怎么还能相信神？", "我再也不想踏进任何教会。"], en: ["After how church people treated me, how can I trust God?", "I never want to set foot in a church again."] },
    severityDefault: 4,
  },
  {
    id: "spiritual_consumerism",
    code: "spiritual_consumerism",
    archetypeCode: "religious_self_righteousness",
    name: { zh: "灵性拼盘", en: "Spiritual Consumerism" },
    shortName: { zh: "拼盘", en: "Buffet" },
    summary: { zh: "像在自助餐里挑菜一样组装属灵体验，只取舒适的部分，回避真理的要求。", en: "Assembling spirituality like a buffet — taking only the comfortable parts and avoiding the demands of truth." },
    coreLie: { zh: "所有宗教都差不多，只要让我感觉好、对我有用就行。", en: "All religions are basically the same; whatever feels good and works for me is fine." },
    falseGospel: { zh: "由我来挑选、定制一个最适合自己的属灵组合，就能得着平安。", en: "By curating my own custom spiritual blend, I can find peace." },
    falseIdentity: { zh: "我是开明、不被任何教条束缚的灵性探索者。", en: "I am an open-minded seeker bound by no single creed." },
    rootDesires: { zh: ["平安", "掌控", "灵性体验", "不被约束"], en: ["peace", "control", "spiritual experience", "freedom from constraint"] },
    rootFears: { zh: ["被教条束缚", "被要求改变", "委身的代价", "排他性"], en: ["being bound by dogma", "being asked to change", "the cost of commitment", "exclusivity"] },
    cognitiveSignals: { zh: ["把真理当口味", "回避排他性主张", "只接受不挑战自己的部分"], en: ["treats truth as taste", "avoids exclusive claims", "accepts only what doesn't challenge the self"] },
    emotionalSignals: { zh: ["对委身的不安", "灵性消费后的空虚", "新鲜感驱动"], en: ["unease toward commitment", "emptiness after spiritual consumption", "novelty-driven"] },
    behavioralSignals: { zh: ["不断更换灵修方式", "回避真理的要求", "拒绝任何权柄"], en: ["constantly switching practices", "avoiding truth's demands", "rejecting all authority"] },
    culturalReinforcers: { zh: ["灵性消费市场", "『身心灵』产业", "拼贴式宗教文化"], en: ["spirituality marketplace", "wellness-and-spirituality industry", "pastiche-religion culture"] },
    blockedDoctrines: ["christ_uniqueness", "repentance", "god_holiness"],
    biblicalCounterTruth: { zh: "耶稣说『我就是道路、真理、生命』；真理不是由我们的口味定制的拼盘，而是一位向我们启示自己、并要求我们回应的神。", en: "Jesus says, 'I am the way, the truth, and the life'; truth is not a buffet curated by our tastes but a God who reveals himself and calls for a response." },
    gospelReframe: { zh: "想要平安与灵性体验本身没有错。但若由你来挑选、回避一切让你不舒服的真理，你最终拜的其实还是你自己——你成了那个决定什么为真的神。这听起来自由，其实孤独，因为定制的神救不了你。福音的好消息恰恰在于：真理不取决于你的口味，而是一位真实、独一、超越你的神，祂亲自走向你、为你舍命。让真理来塑造你，而不是被你裁剪，反而带来你一直在寻找的平安。", en: "Wanting peace and spiritual experience is not wrong. But if you curate it yourself, avoiding every truth that makes you uncomfortable, the one you finally worship is yourself — you become the god who decides what is true. That sounds free but is lonely, because a god you customized cannot save you. The good news of the gospel is precisely this: truth does not depend on your taste but is a real, singular God beyond you, who came to you and gave himself for you. Letting truth shape you, rather than trimming it to fit, brings the very peace you've been seeking." },
    scriptures: ["John 14:6", "Romans 1:20-25", "Exodus 20:3"],
    detectionKeywords: ["都一样", "适合自己", "身心灵", "灵性", "定制", "什么都信一点", "all the same", "works for me", "spiritual not religious", "my own path"],
    exampleUserPhrases: { zh: ["所有宗教讲的都是爱，都差不多。", "我相信一点这个、一点那个，自己组合最好。"], en: ["All religions teach love, they're basically the same.", "I take a bit of this and that and make my own mix."] },
    severityDefault: 2,
  },
  {
    id: "religious_formalism",
    code: "religious_formalism",
    archetypeCode: "religious_self_righteousness",
    name: { zh: "宗教形式主义", en: "Religious Formalism" },
    shortName: { zh: "形式", en: "Formalism" },
    summary: { zh: "有宗教行为与外在敬虔，却心灵远离神，把例行当作与神关系正常的证据。", en: "Possessing religious behavior and outward devotion while the heart stays far from God, mistaking routine for a right relationship." },
    coreLie: { zh: "我已经有宗教行为，所以我与神的关系正常。", en: "I do the religious things, so my relationship with God must be fine." },
    falseGospel: { zh: "守住外在的敬虔表现，就能确保自己被神接纳。", en: "Keeping up outward devotion secures my acceptance by God." },
    falseIdentity: { zh: "我是尽本分、按规矩来的好信徒。", en: "I am the dutiful believer who keeps the rules." },
    rootDesires: { zh: ["被神接纳", "秩序", "安心", "良心无亏"], en: ["being accepted by God", "order", "reassurance", "a clear conscience"] },
    rootFears: { zh: ["被神弃绝", "失序", "不确定得救", "被揭穿空洞"], en: ["being rejected by God", "disorder", "uncertainty of salvation", "being exposed as empty"] },
    cognitiveSignals: { zh: ["以例行衡量属灵", "把习惯当关系", "回避心灵的真实状态"], en: ["measures spirituality by routine", "mistakes habit for relationship", "avoids the heart's true state"] },
    emotionalSignals: { zh: ["枯干", "麻木", "隐约的不安", "缺乏喜乐"], en: ["dryness", "numbness", "vague unease", "joylessness"] },
    behavioralSignals: { zh: ["机械化的灵修", "重外表轻内心", "缺乏真实祷告"], en: ["mechanical devotions", "outer over inner", "lack of honest prayer"] },
    culturalReinforcers: { zh: ["宗教绩效文化", "外在虔诚的社会期待", "表演式敬虔"], en: ["religious performance culture", "social expectation of outward piety", "performative devotion"] },
    blockedDoctrines: ["grace", "repentance", "justification"],
    biblicalCounterTruth: { zh: "神看的是内心，不是外表；这百姓用嘴唇尊敬神，心却远离祂。与神的关系不是靠例行维持，而是靠恩典中真实的相交。", en: "God looks at the heart, not the appearance; this people honors God with their lips while their hearts are far from him. Relationship with God is sustained not by routine but by real communion in grace." },
    gospelReframe: { zh: "外在的敬虔本是好的，但它无法承受『让你与神和好』的重担——你可以做对一切宗教动作，心却依然枯干、远离神。这不是要你做更多，而是更少地倚靠表现、更深地倚靠恩典。福音邀请你从『例行公事』回到『关系』：神要的不是你完美的宗教记录，而是你真实的心。把你的枯干、麻木、空洞带到祂面前，那正是恩典涌流之处。", en: "Outward devotion is good, but it cannot bear the weight of reconciling you to God — you can do every religious motion correctly while your heart stays dry and distant. The answer is not to do more but to lean less on performance and more on grace. The gospel calls you from routine back to relationship: God wants not your flawless religious record but your honest heart. Bring your dryness, numbness, and emptiness to him — that is exactly where grace flows." },
    scriptures: ["Matthew 23:25-28", "James 4:6", "Ephesians 2:8-9"],
    detectionKeywords: ["我有做", "例行", "应该做的都做了", "走过场", "枯干", "宗教", "i do the things", "going through the motions", "dry", "ritual", "should be fine"],
    exampleUserPhrases: { zh: ["我每天读经祷告，应该没什么问题吧。", "我该做的宗教本分都做了。"], en: ["I read and pray every day, so I should be fine.", "I've done all my religious duties."] },
    severityDefault: 3,
  },
  {
    id: "self_righteousness",
    code: "self_righteousness",
    archetypeCode: "religious_self_righteousness",
    name: { zh: "隐秘自义", en: "Hidden Self-Righteousness" },
    shortName: { zh: "自义", en: "Self-Righteous" },
    summary: { zh: "用知识、敬虔或道德表现暗暗高抬自己、轻看别人，自觉不太需要恩典。", en: "Quietly exalting oneself and looking down on others through knowledge, devotion, or moral performance, feeling little need of grace." },
    coreLie: { zh: "我懂很多神学、行得也好，所以我比别人属灵，不太需要悔改。", en: "I know my theology and live well, so I'm more spiritual than others and don't really need to repent." },
    falseGospel: { zh: "凭我的正确与敬虔，我已经站在比别人更高的位置。", en: "By my correctness and devotion, I already stand above others." },
    falseIdentity: { zh: "我是属灵成熟、比别人更对的人。", en: "I am the spiritually mature one who is more right than others." },
    rootDesires: { zh: ["优越感", "被尊重", "确定自己得救", "掌控真理"], en: ["superiority", "respect", "assurance of being right", "owning the truth"] },
    rootFears: { zh: ["被指出错误", "与别人一样有罪", "被看穿", "失去优越"], en: ["being shown wrong", "being as sinful as others", "being seen through", "losing superiority"] },
    cognitiveSignals: { zh: ["把别人灵性贬为肤浅", "抗拒被纠正", "用知识衡量属灵"], en: ["dismisses others' faith as shallow", "resists correction", "measures spirituality by knowledge"] },
    emotionalSignals: { zh: ["轻蔑", "隐隐的优越", "对批评的恼怒"], en: ["contempt", "subtle superiority", "irritation at criticism"] },
    behavioralSignals: { zh: ["论断他人", "好为人师", "难以认错"], en: ["judging others", "lecturing", "difficulty admitting fault"] },
    culturalReinforcers: { zh: ["神学圈的较劲", "属灵比较文化", "社交媒体的道德表演"], en: ["theological one-upmanship", "spiritual-comparison culture", "moral performance on social media"] },
    blockedDoctrines: ["grace", "repentance", "sin"],
    biblicalCounterTruth: { zh: "税吏回家比法利赛人倒算为义；神阻挡骄傲的人，赐恩给谦卑的人。我们的义都像污秽的衣服，唯有基督的义能站立。", en: "The tax collector went home justified rather than the Pharisee; God opposes the proud but gives grace to the humble. All our righteousness is like filthy rags; only Christ's righteousness can stand." },
    gospelReframe: { zh: "最难被看见的自高之事，往往穿着敬虔的外衣。当你用知识或表现暗暗高抬自己、轻看别人时，你其实把基督的义换成了自己的义——而那正是法利赛人回不了家的原因。好消息是：你不需要比别人更对才能被神接纳，因为接纳从来不是靠你赢得的。当你和那个『肤浅的』弟兄一样，只是一个倚靠恩典的罪人时，你反而第一次真正自由——不必再维持高人一等的疲惫表演。", en: "The hardest stronghold to see often wears the clothes of devotion. When you quietly exalt yourself by knowledge or performance and look down on others, you have traded Christ's righteousness for your own — which is exactly why the Pharisee could not go home justified. The good news is that you don't need to be more right than others to be accepted by God, because acceptance was never something you won. When you stand, like that 'shallow' brother, simply as a sinner leaning on grace, you are for the first time truly free — no longer keeping up the exhausting performance of superiority." },
    scriptures: ["Luke 18:9-14", "Isaiah 64:6", "James 4:6"],
    detectionKeywords: ["比别人", "肤浅", "我懂", "他们不如", "更属灵", "不需要悔改", "more than others", "shallow", "i know better", "more spiritual", "they don't"],
    exampleUserPhrases: { zh: ["很多基督徒都不如我认真，他们太肤浅了。", "我读经很多，也懂神学。"], en: ["Most Christians aren't as serious as me, they're shallow.", "I read a lot and know my theology."] },
    severityDefault: 3,
  },
];

// ── 索引与辅助 / Indexes and helpers ──
export const strongholdMap: Record<string, Stronghold> = Object.fromEntries(
  strongholds.map((s) => [s.code, s]),
);

export const strongholdArchetypeMap: Record<string, StrongholdArchetype> = Object.fromEntries(
  strongholdArchetypes.map((a) => [a.code, a]),
);

export const strongholdsByArchetype: Record<StrongholdArchetypeCode, Stronghold[]> =
  strongholdArchetypes.reduce((acc, a) => {
    acc[a.code] = strongholds.filter((s) => s.archetypeCode === a.code);
    return acc;
  }, {} as Record<StrongholdArchetypeCode, Stronghold[]>);
