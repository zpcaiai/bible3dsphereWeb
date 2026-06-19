// 经文主题库 / Scripture theme library (Skill: scripture-theme-mapper)
// 把诊断（自高之事 + 被拦阻真理）映射到圣经主题 → 经文段落 → 默想 → 祷告 → 实践。
// 全部内联双语；渲染层用 pickVal 挑选。

import type { BiText, BiList, StrongholdId, DoctrineCode } from "./strongholds";

export type ScriptureUseCase =
  | "teaching" | "comfort" | "correction" | "repentance"
  | "hope" | "identity" | "lament" | "worship";

export interface ScriptureThemePassage {
  reference: string;
  text: BiText;
  useCase: ScriptureUseCase;
  themeReason: BiText;
}

export interface ScriptureTheme {
  code: string;
  name: BiText;
  summary: BiText;
  strongholdCodes: StrongholdId[];
  doctrineCodes: DoctrineCode[];
  passages: ScriptureThemePassage[];
  meditationQuestions: BiList;
  prayerPrompts: BiList;
  practiceSuggestions: BiList;
  priority: number;
}

const P = (reference: string, zh: string, en: string, useCase: ScriptureUseCase, rzh: string, ren: string): ScriptureThemePassage =>
  ({ reference, text: { zh, en }, useCase, themeReason: { zh: rzh, en: ren } });

export const scriptureThemes: ScriptureTheme[] = [
  {
    code: "identity_in_christ",
    name: { zh: "在基督里的身份", en: "Identity in Christ" },
    summary: { zh: "根本身份不由成就、失败或人的评价定义，而在基督里被接纳、收纳、更新。", en: "Identity is not defined by achievement, failure, or others' opinion, but received in Christ — accepted, adopted, renewed." },
    strongholdCodes: ["achievement_idolatry", "self_righteousness", "identity_absolutism", "therapeutic_self"],
    doctrineCodes: ["justification", "grace", "identity_in_christ"],
    passages: [
      P("以弗所书 1:3-14", "我们在基督里蒙拣选、得救赎、被圣灵印记。", "In Christ we are chosen, redeemed, and sealed with the Spirit.", "identity", "看见你在基督里被拣选、被接纳的身份。", "See your chosen, accepted identity in Christ."),
      P("罗马书 8:1-17", "如今那些在基督耶稣里的就不定罪了……你们所受的是儿子的心。", "There is now no condemnation in Christ; you received the Spirit of adoption.", "comfort", "从定罪与惧怕回到儿女的身份。", "From condemnation and fear back to a child's identity."),
      P("加拉太书 2:20", "现在活着的不再是我，乃是基督在我里面活着。", "It is no longer I who live, but Christ who lives in me.", "repentance", "从自我中心转向与基督联合的新生命。", "From self-centeredness to union with Christ."),
    ],
    meditationQuestions: { zh: ["我最近最常用什么来定义自己？", "如果我在基督里的身份比人的评价更真实，今天我会如何生活？"], en: ["What have I most used to define myself lately?", "If my identity in Christ is more real than human opinion, how would I live today?"] },
    prayerPrompts: { zh: ["主啊，帮助我不再用成就或人的眼光定义自己。"], en: ["Lord, help me stop defining myself by achievement or others' eyes."] },
    practiceSuggestions: { zh: ["写下三个你常用来定义自己的标签，用福音真理重写它们。"], en: ["Write three labels you define yourself by, and rewrite them with gospel truth."] },
    priority: 3,
  },
  {
    code: "justification_by_faith",
    name: { zh: "因信称义", en: "Justification by faith" },
    summary: { zh: "人不靠行为，而是因信靠基督被神称为义。", en: "We are justified not by works but by faith in Christ." },
    strongholdCodes: ["achievement_idolatry", "religious_formalism", "self_righteousness"],
    doctrineCodes: ["justification", "grace"],
    passages: [
      P("以弗所书 2:8-9", "你们得救是本乎恩，也因着信……免得有人自夸。", "By grace you have been saved through faith, not works, so no one may boast.", "teaching", "称义是恩典的礼物，不是表现的奖赏。", "Justification is a gift of grace, not a reward for performance."),
      P("腓立比书 3:7-9", "我将万事当作有损的……为要得着基督，得以在他里面。", "I count all as loss to gain Christ and be found in him.", "repentance", "把靠自己的义当作有损，得着基督的义。", "Count self-righteousness as loss to gain Christ's."),
      P("路加福音 18:9-14", "这人回家去比那人倒算为义了。", "This man went home justified rather than the other.", "correction", "税吏的谦卑而非法利赛的自夸蒙称义。", "The tax collector's humility, not the Pharisee's boast, is justified."),
    ],
    meditationQuestions: { zh: ["我是否在用表现换取神的接纳？", "如果我的义在基督里，今天我可以放下什么焦虑？"], en: ["Am I trading performance for God's acceptance?", "If my righteousness is in Christ, what anxiety can I release today?"] },
    prayerPrompts: { zh: ["主啊，谢谢你成就我无法靠表现赢得的义。"], en: ["Lord, thank you for the righteousness I could never earn."] },
    practiceSuggestions: { zh: ["今天做一件忠心却不求被看见的事。"], en: ["Do one faithful thing today that no one needs to see."] },
    priority: 2,
  },
  {
    code: "grace",
    name: { zh: "恩典", en: "Grace" },
    summary: { zh: "神主动赐下不配得的接纳与救赎，不靠表现赢得。", en: "God freely gives undeserved acceptance and redemption, not earned." },
    strongholdCodes: ["achievement_idolatry", "religious_formalism", "self_righteousness", "consumerism"],
    doctrineCodes: ["grace", "justification"],
    passages: [
      P("哥林多后书 12:9", "我的恩典够你用的，因为我的能力是在人的软弱上显得完全。", "My grace is sufficient for you, for my power is made perfect in weakness.", "comfort", "恩典在软弱中够用，不靠你的刚强。", "Grace is sufficient in weakness, not your strength."),
      P("提多书 2:11", "神救众人的恩典已经显明出来。", "The grace of God has appeared, bringing salvation.", "teaching", "恩典是已显明的救恩，不是奖赏。", "Grace is salvation revealed, not a reward."),
      P("以弗所书 2:8-9", "你们得救是本乎恩，也因着信。", "By grace you have been saved through faith.", "teaching", "得救本乎恩，免去自夸。", "Saved by grace, free from boasting."),
    ],
    meditationQuestions: { zh: ["如果接纳不是我赢来的，今天我可以停止哪一种证明自己？"], en: ["If acceptance isn't earned, what self-proving can I stop today?"] },
    prayerPrompts: { zh: ["主啊，让我从倚靠表现转向倚靠你的恩典。"], en: ["Lord, move me from leaning on performance to leaning on your grace."] },
    practiceSuggestions: { zh: ["把一处你最想靠自己证明的地方，交托在恩典里。"], en: ["Entrust to grace one place you most want to prove yourself."] },
    priority: 2,
  },
  {
    code: "repentance",
    name: { zh: "悔改", en: "Repentance" },
    summary: { zh: "悔改是在恩典中真实转向神，不是自我定罪。", en: "Repentance is honestly turning to God in grace, not self-condemnation." },
    strongholdCodes: ["self_righteousness", "religious_formalism", "spiritual_consumerism"],
    doctrineCodes: ["repentance", "grace", "sin"],
    passages: [
      P("约翰一书 1:9", "我们若认自己的罪，神是信实的、公义的，必要赦免。", "If we confess our sins, he is faithful and just to forgive.", "repentance", "认罪带来赦免，不带来羞辱。", "Confession brings forgiveness, not shame."),
      P("约珥书 2:13", "你们要撕裂心肠，不撕裂衣服，归向耶和华。", "Rend your hearts and not your garments, and return to the LORD.", "correction", "真悔改是内心归向神，不是外在表演。", "True repentance is the heart returning, not outward show."),
      P("路加福音 15:20", "相离还远，他父亲看见，就动了慈心，跑去抱着他。", "While still far off, his father saw him, ran, and embraced him.", "comfort", "父亲的拥抱迎接归回的人。", "The Father's embrace welcomes the one who returns."),
    ],
    meditationQuestions: { zh: ["我把悔改理解成自我打碎，还是在恩典中转向神？"], en: ["Do I see repentance as self-destruction or turning to God in grace?"] },
    prayerPrompts: { zh: ["主啊，我转向你，不是为了表演，而是真实归回。"], en: ["Lord, I turn to you — not to perform, but to truly return."] },
    practiceSuggestions: { zh: ["写一句真实的认罪，并接受神的赦免。"], en: ["Write one honest confession and receive God's forgiveness."] },
    priority: 2,
  },
  {
    code: "god_sovereignty",
    name: { zh: "神的主权", en: "The sovereignty of God" },
    summary: { zh: "神掌管万有；祂的主权不是威胁，而是被造者安息的根基。", en: "God reigns over all; his sovereignty is the ground of rest, not a threat." },
    strongholdCodes: ["control_idolatry", "self_sovereignty"],
    doctrineCodes: ["god_sovereignty", "human_finitude"],
    passages: [
      P("箴言 3:5-6", "你要专心仰赖耶和华，不可倚靠自己的聪明。", "Trust in the LORD with all your heart; do not lean on your own understanding.", "teaching", "信靠神的引导胜过倚靠自己的掌控。", "Trust God's guidance over your own control."),
      P("马太福音 6:25-34", "不要忧虑……你们需用的这一切东西，你们的天父是知道的。", "Do not be anxious; your heavenly Father knows what you need.", "comfort", "天父的看顾解除掌控的焦虑。", "The Father's care frees you from controlling anxiety."),
      P("但以理书 2:21", "他改变时候、日期，废王、立王。", "He changes times and seasons; he removes and sets up kings.", "worship", "历史在神手中，不在你的掌控里。", "History is in God's hands, not your control."),
    ],
    meditationQuestions: { zh: ["如果神既良善又掌权，今天我可以尽责却放下哪一份重担？"], en: ["If God is good and reigning, what burden can I do my part on yet lay down?"] },
    prayerPrompts: { zh: ["主啊，我愿意尽责，也愿意承认我不是掌管万有的主。"], en: ["Lord, I will do my part, and admit I am not the Lord of all."] },
    practiceSuggestions: { zh: ["写下：我能负责的部分 / 我需要交托的部分。"], en: ["Write: what is mine to do / what I must entrust."] },
    priority: 3,
  },
  {
    code: "sabbath_and_rest",
    name: { zh: "安息", en: "Sabbath and rest" },
    summary: { zh: "安息是信靠的操练：你被神托住，可以停下来。", en: "Rest is a practice of trust: you are held by God and may stop." },
    strongholdCodes: ["control_idolatry", "achievement_idolatry", "digital_distraction"],
    doctrineCodes: ["god_sovereignty", "grace"],
    passages: [
      P("马太福音 11:28-30", "凡劳苦担重担的人，可以到我这里来，我就使你们得安息。", "Come to me, all who labor and are heavy laden, and I will give you rest.", "comfort", "基督亲自赐下安息。", "Christ himself gives rest."),
      P("诗篇 23", "他使我躺卧在青草地上，领我在可安歇的水边。", "He makes me lie down in green pastures; he leads me beside still waters.", "comfort", "牧者的看顾使你能安歇。", "The Shepherd's care lets you rest."),
      P("希伯来书 4:9-10", "这样看来，必另有一安息日的安息，为神的子民存留。", "There remains a Sabbath rest for the people of God.", "teaching", "安息是为神子民存留的应许。", "Rest is a promise kept for God's people."),
    ],
    meditationQuestions: { zh: ["我是否把焦虑误认为责任感？", "停下来对我为何如此难？"], en: ["Have I mistaken anxiety for responsibility?", "Why is stopping so hard for me?"] },
    prayerPrompts: { zh: ["主啊，教我在你的主权下安息，而不是独自扛起一切。"], en: ["Lord, teach me to rest under your reign, not carry it all alone."] },
    practiceSuggestions: { zh: ["本周留一段安静时间，先承认『神掌权』再开始计划。"], en: ["Take a quiet window this week to say 'God reigns' before planning."] },
    priority: 2,
  },
  {
    code: "suffering_and_lament",
    name: { zh: "苦难与哀歌", en: "Suffering and lament" },
    summary: { zh: "圣经允许人把真实的痛苦、困惑与愤怒带到神面前，而非远离神。", en: "Scripture lets us bring honest pain, confusion, and anger to God, not away from him." },
    strongholdCodes: ["suffering_objection", "church_hurt"],
    doctrineCodes: ["god_love", "god_sovereignty", "cross"],
    passages: [
      P("诗篇 13", "耶和华啊，你忘记我要到几时呢？……但我倚靠你的慈爱。", "How long, O LORD? … But I have trusted in your steadfast love.", "lament", "示范在困惑中真实向神呼求。", "A model of honest crying out in confusion."),
      P("诗篇 22:1-2", "我的神，我的神，为什么离弃我？", "My God, my God, why have you forsaken me?", "lament", "被离弃感中的祷告，也指向基督的受苦。", "A prayer in forsakenness that points to Christ's suffering."),
      P("哥林多后书 1:3-7", "我们在一切患难中，他就安慰我们。", "He comforts us in all our affliction.", "comfort", "神在患难中赐安慰，并使人能安慰别人。", "God comforts in affliction so we can comfort others."),
    ],
    meditationQuestions: { zh: ["我最不敢向神说出的痛苦是什么？", "十字架如何改变我对神沉默的理解？"], en: ["What pain am I most afraid to tell God?", "How does the cross change my reading of God's silence?"] },
    prayerPrompts: { zh: ["主啊，我不想假装刚强，求你接纳我真实的哀哭。"], en: ["Lord, I won't pretend to be strong — receive my honest lament."] },
    practiceSuggestions: { zh: ["写一篇自己的哀歌祷告；找一位成熟同伴分享你的痛苦。"], en: ["Write your own lament; share your pain with a mature companion."] },
    priority: 4,
  },
  {
    code: "cross_and_atonement",
    name: { zh: "十字架与救赎", en: "The cross and atonement" },
    summary: { zh: "十字架显明神进入人的罪与苦难，同时回应罪疚与痛苦。", en: "The cross shows God entering our sin and suffering, answering both guilt and pain." },
    strongholdCodes: ["suffering_objection", "techno_messianism", "church_hurt"],
    doctrineCodes: ["cross", "god_love"],
    passages: [
      P("以赛亚书 53:3-5", "他诚然担当我们的忧患，背负我们的痛苦……因他受的鞭伤我们得医治。", "Surely he has borne our griefs; by his stripes we are healed.", "comfort", "基督担当忧患，神并非冷漠旁观。", "Christ bore our griefs; God is no detached observer."),
      P("罗马书 5:8", "惟有基督在我们还作罪人的时候为我们死，神的爱就在此向我们显明了。", "While we were still sinners, Christ died for us.", "teaching", "十字架是神的爱最确凿的证明。", "The cross is the surest proof of God's love."),
      P("彼得前书 2:24", "他被挂在木头上，亲身担当了我们的罪。", "He himself bore our sins in his body on the tree.", "teaching", "基督亲身担当罪，使你得自由。", "Christ bore sin himself to set you free."),
    ],
    meditationQuestions: { zh: ["十字架如何同时回应我的罪疚和我的痛苦？"], en: ["How does the cross answer both my guilt and my pain?"] },
    prayerPrompts: { zh: ["主啊，求你让我在十字架上看见你不是远离苦难的神。"], en: ["Lord, let me see at the cross that you are not far from suffering."] },
    practiceSuggestions: { zh: ["默想以赛亚书 53，把你的痛苦带到担当痛苦的基督面前。"], en: ["Meditate on Isaiah 53; bring your pain to the Christ who bore it."] },
    priority: 3,
  },
  {
    code: "resurrection_hope",
    name: { zh: "复活的盼望", en: "Resurrection hope" },
    summary: { zh: "复活宣告爱与公义终胜死亡与虚空。", en: "The resurrection declares love and justice will triumph over death and futility." },
    strongholdCodes: ["nihilism", "suffering_objection"],
    doctrineCodes: ["resurrection", "new_creation"],
    passages: [
      P("哥林多前书 15:54-57", "死被得胜吞灭的话就应验了……感谢神，使我们藉着主耶稣基督得胜。", "Death is swallowed up in victory … thanks be to God who gives us victory.", "hope", "复活宣告死亡已被胜过。", "The resurrection declares death is conquered."),
      P("启示录 21:3-5", "神要擦去他们一切的眼泪……看哪，我将一切都更新了。", "He will wipe away every tear … behold, I am making all things new.", "hope", "万物更新的应许托住今天的你。", "The promise of all things new holds you today."),
      P("罗马书 8:18-25", "现在的苦楚若比起将来要显于我们的荣耀，就不足介意了。", "The sufferings of now are not worth comparing with the glory to come.", "comfort", "今生苦难在永恒荣耀前显为轻省。", "Present suffering is light against coming glory."),
    ],
    meditationQuestions: { zh: ["如果我流的眼泪不会消失在虚空里，今天我可以怎样活？"], en: ["If my tears don't vanish into the void, how might I live today?"] },
    prayerPrompts: { zh: ["主啊，求你用复活的盼望托住我此刻的疲惫与虚无感。"], en: ["Lord, hold my weariness and emptiness with resurrection hope."] },
    practiceSuggestions: { zh: ["写下一件你盼望神将来要更新的事，并为它感恩。"], en: ["Write one thing you hope God will make new, and give thanks for it."] },
    priority: 3,
  },
  {
    code: "sanctification",
    name: { zh: "成圣", en: "Sanctification" },
    summary: { zh: "圣灵渐渐更新人心；成长是心被真理更新，而非感觉变好。", en: "The Spirit gradually renews the heart; growth is the heart renewed by truth, not just feeling better." },
    strongholdCodes: ["desire_identity_fusion", "digital_distraction", "therapeutic_self"],
    doctrineCodes: ["sanctification", "human_image_of_god"],
    passages: [
      P("罗马书 12:1-2", "不要效法这个世界，只要心意更新而变化。", "Do not be conformed to this world, but be transformed by the renewal of your mind.", "teaching", "改变源于心意更新，而非随从世界。", "Change comes by the renewed mind, not conformity."),
      P("帖撒罗尼迦前书 4:3-5", "神的旨意就是要你们成为圣洁。", "This is the will of God, your sanctification.", "correction", "圣洁是神为你定的美意。", "Holiness is God's good will for you."),
      P("哥林多后书 3:18", "我们……变成主的形状，荣上加荣。", "We are being transformed into his image from glory to glory.", "hope", "成圣是渐进地被更新成基督的形象。", "Sanctification is gradual transformation into Christ's image."),
    ],
    meditationQuestions: { zh: ["我是否把成长误当成『感觉变好』，而非心被真理更新？"], en: ["Have I mistaken growth for 'feeling better' rather than the heart renewed by truth?"] },
    prayerPrompts: { zh: ["主啊，用你的真理更新我的心思，而非只让我感觉良好。"], en: ["Lord, renew my mind with truth, not merely make me feel good."] },
    practiceSuggestions: { zh: ["择一处欲望，练习把它带到神面前重新排序。"], en: ["Take one desire and practice reordering it before God."] },
    priority: 2,
  },
  {
    code: "sin_and_idolatry",
    name: { zh: "罪与偶像", en: "Sin and idolatry" },
    summary: { zh: "罪的核心是用受造之物取代造物主；唯独神配得敬拜。", en: "Sin at root replaces the Creator with creation; God alone is worthy of worship." },
    strongholdCodes: ["consumerism", "desire_identity_fusion", "political_idolatry", "identity_absolutism"],
    doctrineCodes: ["sin", "god_holiness"],
    passages: [
      P("出埃及记 20:3", "除我以外，你不可有别的神。", "You shall have no other gods before me.", "correction", "唯独神配得终极的信靠与敬拜。", "God alone deserves ultimate trust and worship."),
      P("约翰一书 5:21", "小子们哪，你们要自守，远避偶像。", "Little children, keep yourselves from idols.", "correction", "温柔的提醒：远离会辖制你的偶像。", "A gentle call to keep from enslaving idols."),
      P("歌罗西书 3:5", "要治死……贪婪，贪婪就与拜偶像一样。", "Put to death … covetousness, which is idolatry.", "repentance", "把绝对化的欲望治死，归还神的位置。", "Put to death absolutized desire and restore God's place."),
    ],
    meditationQuestions: { zh: ["我把哪一个正当的渴望绝对化了？"], en: ["Which legitimate desire have I absolutized?"] },
    prayerPrompts: { zh: ["主啊，揭露我的偶像，让你重新坐在我心的宝座上。"], en: ["Lord, expose my idols and take your throne in my heart again."] },
    practiceSuggestions: { zh: ["在你最执着之处特意敬拜神，并操练一次释放。"], en: ["Worship God at your point of strongest attachment, and practice one release."] },
    priority: 2,
  },
  {
    code: "wisdom_and_fear_of_the_lord",
    name: { zh: "智慧与敬畏神", en: "Wisdom and the fear of the LORD" },
    summary: { zh: "敬畏耶和华是知识的开端；受造的心智无法穷尽造物主。", en: "The fear of the LORD is the beginning of knowledge; the created mind cannot exhaust the Creator." },
    strongholdCodes: ["scientism", "moral_relativism", "techno_messianism"],
    doctrineCodes: ["creation", "human_finitude", "god_sovereignty"],
    passages: [
      P("箴言 1:7", "敬畏耶和华是知识的开端。", "The fear of the LORD is the beginning of knowledge.", "teaching", "真知识始于敬畏神，而非高举理性。", "True knowledge begins in the fear of God, not exalting reason."),
      P("约伯记 38:4", "我立大地根基的时候，你在哪里呢？", "Where were you when I laid the foundation of the earth?", "correction", "受造者的有限在造物主面前显明。", "The creature's limits are exposed before the Creator."),
      P("箴言 3:5-6", "你要专心仰赖耶和华，不可倚靠自己的聪明。", "Trust in the LORD; do not lean on your own understanding.", "teaching", "信靠神胜过倚靠自己的判断。", "Trust God over your own judgment."),
    ],
    meditationQuestions: { zh: ["有没有真理，我只因无法证明就拒绝认真考虑？", "如果真理是一位位格，这会如何改变我？"], en: ["Is there a truth I dismiss only because I can't prove it?", "If truth is a Person, how would that change me?"] },
    prayerPrompts: { zh: ["主啊，赐我谦卑受教的心，既珍惜理性也承认它的有限。"], en: ["Lord, give me a humble, teachable heart that treasures reason yet owns its limits."] },
    practiceSuggestions: { zh: ["默想约伯记 38–39 或诗篇 8，省思受造的有限与造物主的浩大。"], en: ["Meditate on Job 38–39 or Psalm 8 on creaturely limits and the vast Creator."] },
    priority: 2,
  },
  {
    code: "kingdom_of_god",
    name: { zh: "神的国", en: "The kingdom of God" },
    summary: { zh: "真盼望不在权力更替，而在已掌权、必再来施行公义的君王。", en: "True hope rests not in a change of power but in the King who reigns and will return to do justice." },
    strongholdCodes: ["political_idolatry", "identity_absolutism"],
    doctrineCodes: ["kingdom_of_god", "god_sovereignty"],
    passages: [
      P("腓立比书 3:20", "我们却是天上的国民。", "Our citizenship is in heaven.", "teaching", "你最终的归属是天上的国，而非地上的阵营。", "Your final belonging is heaven's kingdom, not an earthly camp."),
      P("马太福音 6:33", "你们要先求他的国和他的义。", "Seek first the kingdom of God and his righteousness.", "correction", "把神国置于一切盼望之先。", "Put God's kingdom before every other hope."),
      P("但以理书 2:21", "他改变时候、日期，废王、立王。", "He changes times and seasons; he removes and sets up kings.", "worship", "历史与权力在神手中。", "History and power are in God's hands."),
    ],
    meditationQuestions: { zh: ["如果真盼望在已掌权的君王，今天我的恐惧会如何改变？"], en: ["If real hope is the reigning King, how does that change my fear today?"] },
    prayerPrompts: { zh: ["主啊，把我的盼望从权力更替转回你的国。"], en: ["Lord, move my hope from a change of power back to your kingdom."] },
    practiceSuggestions: { zh: ["为一个你视为『对立面』的人祝福祷告，而非论断。"], en: ["Pray a blessing — not a judgment — over someone you see as 'the other side'."] },
    priority: 2,
  },
  {
    code: "contentment",
    name: { zh: "知足", en: "Contentment" },
    summary: { zh: "敬虔加上知足是大利；神自己才是至宝。", en: "Godliness with contentment is great gain; God himself is the treasure." },
    strongholdCodes: ["consumerism", "digital_distraction"],
    doctrineCodes: ["grace", "kingdom_of_god"],
    passages: [
      P("提摩太前书 6:6-10", "敬虔加上知足的心便是大利。", "Godliness with contentment is great gain.", "teaching", "知足胜过对更多的追逐。", "Contentment surpasses the chase for more."),
      P("腓立比书 4:11-13", "我无论在什么景况都可以知足……靠着那加给我力量的，凡事都能做。", "I have learned to be content in any situation, through him who strengthens me.", "comfort", "知足是在基督里学来的能力。", "Contentment is a strength learned in Christ."),
      P("希伯来书 13:5", "你们存心不可贪爱钱财，要以自己所有的为足。", "Keep your life free from love of money, and be content with what you have.", "correction", "以神的同在为足，胜过积累。", "Be content in God's presence over accumulation."),
    ],
    meditationQuestions: { zh: ["购物或刷屏带来的兴奋为何很快退去？"], en: ["Why does the thrill of buying or scrolling fade so fast?"] },
    prayerPrompts: { zh: ["主啊，让我在你里面知足，而非被『还不够』奴役。"], en: ["Lord, make me content in you, not enslaved to 'not enough'."] },
    practiceSuggestions: { zh: ["本周对一处执着做一次小小的禁食，把省下的给神或他人。"], en: ["Fast from one attachment this week and give the freed time to God or others."] },
    priority: 1,
  },
];

export const scriptureThemeMap: Record<string, ScriptureTheme> = Object.fromEntries(
  scriptureThemes.map((t) => [t.code, t]),
);
