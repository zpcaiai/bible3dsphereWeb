// 福音回应层数据 / Gospel-response layer data
// 复用 strongholds.ts 本体（核心谎言、假福音、被拦阻真理、福音重构、经文已在那里），
// 这里补充本体里没有的「生成性」内容：祷告、反思问题、行动、教义教导回应、假福音简称。
// 全部内联双语 { zh, en }，渲染层用 pickVal 挑选。

import type { BiText, BiList, DoctrineCode, StrongholdArchetypeCode, StrongholdId } from "./strongholds";

export type PrayerType =
  | "surrender"
  | "confession"
  | "lament"
  | "identity"
  | "repentance"
  | "humility"
  | "worship";

export interface ArchetypePrayerSet {
  type: PrayerType;
  title: BiText;
  text: BiText;
  reflectionQuestions: BiList;
  todayAction: BiText;
  weekPractice: BiText;
}

// ── 按 8 大原型的祷告与回应 / Prayer + response per archetype ──
export const PRAYER_BY_ARCHETYPE: Record<StrongholdArchetypeCode, ArchetypePrayerSet> = {
  self_sovereignty: {
    type: "surrender",
    title: { zh: "把主权交还给神", en: "Returning the throne to God" },
    text: {
      zh: "主啊，我承认我常想自己作王，自己定义善恶、掌控人生，因为我害怕失控与软弱。我愿意尽我当尽的责任，也承认我不是掌管万有的主。今天我把 ______ 交还到你手中，求你帮助我在你的主权下安息，而不是独自扛起整个人生。阿们。",
      en: "Lord, I confess I often want to reign on my own — defining good and evil, controlling my life — because I fear losing control and weakness. I will do my part, yet I am not the Lord of all things. Today I return ______ into your hands; help me rest under your reign instead of carrying my whole life alone. Amen.",
    },
    reflectionQuestions: {
      zh: ["今天我最想自己掌控的是什么？", "我把『交托给神』误读成了消极吗？", "我能尽责、却不必掌控结果的一件事是什么？"],
      en: ["What do I most want to control on my own today?", "Have I misread 'surrender to God' as passivity?", "What is one thing where I can be faithful without controlling the outcome?"],
    },
    todayAction: { zh: "写下今天最想掌控的一件事，用一句祷告把结果交托给神。", en: "Write down the one thing you most want to control today, and hand the outcome to God in a sentence of prayer." },
    weekPractice: { zh: "本周每天留 5 分钟安静，练习先承认『神掌权』，再开始计划。", en: "Each day this week, take 5 minutes of stillness to acknowledge 'God reigns' before you start planning." },
  },
  rational_pride: {
    type: "humility",
    title: { zh: "谦卑的求知", en: "Humble knowing" },
    text: {
      zh: "主啊，我承认我容易把自己的理性当作衡量一切的最终标准，觉得不能被我证明的就不值得相信。求你赦免我用受造的心智去审判造物主。求你赐我谦卑受教的心，让我既珍惜你所赐的理性，也愿意承认它的有限，向超过我所能测度的真理敞开。阿们。",
      en: "Lord, I confess I make my own reason the final measure of everything, treating what I cannot prove as unworthy of belief. Forgive me for judging the Creator with a created mind. Give me a humble, teachable heart — to treasure the reason you gave me yet admit its limits, and to stay open to truth beyond my measure. Amen.",
    },
    reflectionQuestions: {
      zh: ["有没有什么真理，我只因为无法证明就拒绝认真考虑？", "我的怀疑是诚实的探问，还是自我保护的高傲？", "如果真理是一位位格而非一个命题，这会如何改变我？"],
      en: ["Is there a truth I dismiss only because I can't prove it?", "Is my doubt honest inquiry, or self-protective pride?", "If truth is a Person, not a proposition, how would that change me?"],
    },
    todayAction: { zh: "带着真诚（而非要赢）的态度，向神或一位成熟信徒提出一个你最难的问题。", en: "Bring your hardest question to God or a mature believer with a posture of inquiry, not winning." },
    weekPractice: { zh: "本周读一段智慧文学（如约伯记 38–39 或诗篇 8），默想受造的有限与造物主的浩大。", en: "Read a wisdom passage (e.g. Job 38–39 or Psalm 8) and meditate on creaturely limits before the vast Creator." },
  },
  desire_absolutism: {
    type: "confession",
    title: { zh: "让欲望重新归位", en: "Reordering desire" },
    text: {
      zh: "主啊，我承认我常把欲望、快感或舒适当作最真实的自我和终极的善，用受造之物去填补只有你能满足的心。求你赦免我，洁净我的渴望，把它们重新排序在你的爱之下。求你让我看见：你才是我心真正寻找的至宝。阿们。",
      en: "Lord, I confess I treat desire, pleasure, or comfort as my truest self and ultimate good, filling with created things the heart that only you can satisfy. Forgive me; cleanse my longings and reorder them under your love. Show me that you are the treasure my heart is truly seeking. Amen.",
    },
    reflectionQuestions: {
      zh: ["我用什么来填补内心的空虚，而不是把它带到神面前？", "我把哪一个正当的渴望绝对化了？", "如果神就是我心所寻的至宝，今天我可以放下什么？"],
      en: ["What do I use to fill my emptiness instead of bringing it to God?", "Which legitimate desire have I absolutized?", "If God is the treasure my heart seeks, what can I release today?"],
    },
    todayAction: { zh: "下一次想用刺激填补空虚时，先停下 5 分钟，把那份渴望带到神面前祷告。", en: "Next time you reach for stimulation to fill emptiness, pause 5 minutes and bring that longing to God in prayer." },
    weekPractice: { zh: "本周择一处执着（购物、刷屏、某种快感）做一次小小的『禁食』，把省下的时间给神或他人。", en: "This week fast from one attachment (shopping, scrolling, a pleasure) in a small way, and give the freed time to God or others." },
  },
  performance_righteousness: {
    type: "identity",
    title: { zh: "从表现回到恩典身份", en: "From performance to grace-given identity" },
    text: {
      zh: "主耶稣，我承认我常用成功证明自己，用表现换取接纳，用别人的认可定义我的价值。求你赦免我把成就放在你的位置上。谢谢你在十字架上已经成就我无法靠表现赢得的义。我不是我的履历、收入、成果或排名——我是你所造、所爱、所赎回的人。今天教我忠心做事，却不再被成功奴役。阿们。",
      en: "Lord Jesus, I confess I prove myself by success, trade performance for acceptance, and let others' approval define my worth. Forgive me for putting achievement in your place. Thank you that on the cross you secured the righteousness I could never earn. I am not my résumé, income, output, or rank — I am made, loved, and redeemed by you. Teach me to work faithfully today, no longer enslaved to success. Amen.",
    },
    reflectionQuestions: {
      zh: ["今天我最想向谁证明什么？", "我是否把失败等同于自己没有价值？", "如果我已在基督里被接纳，今天我可以放下哪一种焦虑？"],
      en: ["Whom do I most want to prove something to today?", "Do I equate failure with being worthless?", "If I'm already accepted in Christ, what anxiety can I lay down today?"],
    },
    todayAction: { zh: "今天做一件忠心、但不需要被任何人看见的小事。", en: "Do one faithful thing today that no one needs to see." },
    weekPractice: { zh: "本周每天写下『我不是我的成就，我是在基督里被接纳的人』，并为一个你常比较的人祝福祷告。", en: "Each day this week write 'I am not my achievements; I am accepted in Christ', and pray a blessing for someone you tend to compare yourself with." },
  },
  techno_salvation: {
    type: "humility",
    title: { zh: "承认人的有限，仰望真救主", en: "Owning human limits, looking to the true Savior" },
    text: {
      zh: "主啊，我承认我容易相信只要能力、效率、技术足够强，就能解决人最根本的问题。求你赦免我把人的盼望建立在人手的工作上。我承认我的根本问题不是效率，而是需要被赦免的罪和需要被胜过的死亡——这是你已经在十字架与空坟墓中成就的。求你教我善用恩赐，却把救恩留给唯一的救主。阿们。",
      en: "Lord, I confess I'm prone to believe that enough capability, efficiency, and technology will solve humanity's deepest problems. Forgive me for resting hope on the work of human hands. My deepest problem is not efficiency but sin to be forgiven and death to be conquered — which you accomplished at the cross and the empty tomb. Teach me to steward gifts well while leaving salvation to the only Savior. Amen.",
    },
    reflectionQuestions: {
      zh: ["我是否把『还没解决』的人生问题当成迟早会被攻克的工程难题？", "我对人的限制和死亡是否不耐或回避？", "哪些问题是再强的工具也无法解决、只能交给基督的？"],
      en: ["Do I treat my unsolved life-problems as engineering challenges to be cracked eventually?", "Am I impatient with, or avoidant of, human limits and death?", "Which problems can no tool solve — only Christ?"],
    },
    todayAction: { zh: "今天有意识地为一件你无法靠努力或工具解决的事祷告，把它交给神。", en: "Deliberately pray today over one thing you cannot solve by effort or tools, and entrust it to God." },
    weekPractice: { zh: "本周设一段『无屏幕』时间，安静面对神，承认你不是世界的拯救者。", en: "Set a screen-free window this week to be still before God and acknowledge you are not the world's savior." },
  },
  political_idolatry: {
    type: "repentance",
    title: { zh: "把盼望从权力转回神国", en: "Moving hope from power to the kingdom" },
    text: {
      zh: "主啊，我承认我容易把终极的盼望、身份和安全寄托在某个阵营、领袖或社会权力上，甚至把意见不同的人当成敌人。求你赦免我把对你国度的盼望转嫁给地上的国。求你提醒我：你已经掌权，且必再来施行公义。求你让我认真关心公义，却不被恐惧和愤怒辖制，也能爱政见不同的邻舍。阿们。",
      en: "Lord, I confess I rest ultimate hope, identity, and security in a camp, a leader, or social power, even treating those who differ as enemies. Forgive me for transferring kingdom hope to an earthly kingdom. Remind me that you already reign and will return to do justice. Let me care about justice without being ruled by fear and anger, and love neighbors who differ from me. Amen.",
    },
    reflectionQuestions: {
      zh: ["我是否把『我们这方胜出』当成世界得救的唯一指望？", "政治新闻是否在主导我的恐惧与愤怒？", "我能否真心为一个政见不同的人祝福？"],
      en: ["Do I treat 'our side winning' as the world's only hope?", "Do political headlines drive my fear and anger?", "Can I sincerely bless someone who votes differently?"],
    },
    todayAction: { zh: "今天为一个你视为『对立面』的人或群体祝福祷告，而不是论断。", en: "Today pray a blessing — not a judgment — over a person or group you see as 'the other side'." },
    weekPractice: { zh: "本周限制愤怒型新闻的摄入，改用 10 分钟默想神国与基督的再来。", en: "This week limit outrage-news intake and replace it with 10 minutes meditating on the kingdom of God and Christ's return." },
  },
  wounded_unbelief: {
    type: "lament",
    title: { zh: "把真实的痛苦带到神面前", en: "Bringing honest pain to God" },
    text: {
      zh: "主啊，我不想假装自己很好。我承认我有困惑、委屈、愤怒和疲惫。我不明白为什么这些事会发生，也不明白你为什么似乎沉默。但我愿意把真实的痛苦带到你面前，而不是远离你。求你让我在十字架上看见：你不是远离苦难的神，而是亲自进入苦难、担当痛苦的主。今天求你给我一点够用的信心。阿们。",
      en: "Lord, I don't want to pretend I'm fine. I confess my confusion, grievance, anger, and exhaustion. I don't understand why this happened, or why you seem silent. Yet I choose to bring my honest pain toward you, not away from you. Let me see at the cross that you are not a God far from suffering but One who entered it and bore it. Give me just enough faith for today. Amen.",
    },
    reflectionQuestions: {
      zh: ["我最不敢向神说出的痛苦是什么？", "我是否因为得不到解释，就远离了神？", "十字架如何改变我对神『沉默』的理解？"],
      en: ["What pain am I most afraid to say to God?", "Have I pulled away from God because I didn't get an explanation?", "How does the cross change my reading of God's 'silence'?"],
    },
    todayAction: { zh: "今天写一段真实的哀歌祷告，不需要修饰，向神倾诉你真正的感受。", en: "Write an honest lament prayer today — unpolished — telling God how you truly feel." },
    weekPractice: { zh: "本周找一位成熟可信的牧者或属灵同伴，分享你正在承受的痛苦，不独自承受。", en: "This week share your pain with a mature, trustworthy pastor or companion — do not carry it alone." },
  },
  religious_self_righteousness: {
    type: "confession",
    title: { zh: "从自义回到恩典", en: "From self-righteousness back to grace" },
    text: {
      zh: "主啊，我承认我容易用知识、敬虔或道德表现暗暗高抬自己、轻看别人，觉得自己不太需要悔改。求你赦免我把基督的义换成了自己的义。我承认我和我所轻看的人一样，只是一个倚靠恩典的罪人。谢谢你赐恩给谦卑的人。求你让我以领受恩典的心，而非高人一等的表演，来到你面前。阿们。",
      en: "Lord, I confess I quietly exalt myself by knowledge, devotion, or moral performance, looking down on others and feeling little need to repent. Forgive me for trading Christ's righteousness for my own. I am, like those I look down on, simply a sinner leaning on grace. Thank you that you give grace to the humble. Let me come to you receiving grace, not performing superiority. Amen.",
    },
    reflectionQuestions: {
      zh: ["今天我在哪里暗暗觉得自己比别人更属灵、更对？", "我抗拒被纠正吗？", "如果我和那个『肤浅的』弟兄一样只是蒙恩的罪人，这会如何释放我？"],
      en: ["Where do I quietly feel more spiritual or more right than others today?", "Do I resist correction?", "If I'm just a sinner under grace like that 'shallow' brother, how would that free me?"],
    },
    todayAction: { zh: "今天真诚地向一个你曾轻看的人学习一件事，或为他/她感恩祷告。", en: "Today learn one thing sincerely from someone you've looked down on, or thank God for them in prayer." },
    weekPractice: { zh: "本周练习『先认自己的罪，再看别人的需要』，每天写下一处神向你显明的恩典。", en: "This week practice confessing your own sin before seeing others' faults; write down one grace God showed you each day." },
  },
};

// ── 被拦阻真理的教导回应 / Teaching response per doctrine ──
// healingTruth 已在各 stronghold 的 biblicalCounterTruth 里；这里给教导主题 + 反思问题。
export const DOCTRINE_RESPONSE: Record<DoctrineCode, { teachingTheme: BiText; reflectionQuestion: BiText }> = {
  god_holiness: { teachingTheme: { zh: "神的圣洁与我们的安全", en: "God's holiness and our safety" }, reflectionQuestion: { zh: "若善恶不是我发明的，而是神本性的彰显，这会如何改变我？", en: "If good and evil express God's nature rather than my invention, how does that change me?" } },
  god_love: { teachingTheme: { zh: "十字架中神的爱与苦难中的同在", en: "God's love at the cross and his presence in suffering" }, reflectionQuestion: { zh: "如果神不是远离苦难，而是在基督里进入苦难，这会如何改变我对祂的理解？", en: "If God enters suffering in Christ rather than standing far off, how does that change how I see him?" } },
  god_sovereignty: { teachingTheme: { zh: "神的主权作为安息的根基", en: "God's sovereignty as the ground of rest" }, reflectionQuestion: { zh: "如果神既良善又掌权，我今天可以尽责却放下哪一份重担？", en: "If God is both good and reigning, what burden can I do my part on yet lay down today?" } },
  creation: { teachingTheme: { zh: "受造界的次序与造物主的智慧", en: "The order of creation and the Creator's wisdom" }, reflectionQuestion: { zh: "把世界看作被爱所造、而非偶然，这会如何改变我对意义的看法？", en: "How does seeing the world as lovingly made, not accidental, change my sense of meaning?" } },
  human_image_of_god: { teachingTheme: { zh: "人按神形象被造的尊贵", en: "Human dignity as the image of God" }, reflectionQuestion: { zh: "如果每个人都承载神的形象，我会如何看待自己和与我不同的人？", en: "If every person bears God's image, how do I view myself and those unlike me?" } },
  human_finitude: { teachingTheme: { zh: "承认有限是恩典而非羞耻", en: "Accepting limits as grace, not shame" }, reflectionQuestion: { zh: "承认我有限、不是神，这对我是威胁还是释放？", en: "Is admitting I'm finite and not God a threat, or a relief, to me?" } },
  sin: { teachingTheme: { zh: "罪的真实与恩典的深度", en: "The reality of sin and the depth of grace" }, reflectionQuestion: { zh: "我是否在用别的词回避『罪』，因而也错过了赦免的好消息？", en: "Am I renaming 'sin' to avoid it — and so missing the good news of forgiveness?" } },
  judgment: { teachingTheme: { zh: "公义的审判与终极的盼望", en: "Just judgment and ultimate hope" }, reflectionQuestion: { zh: "如果有一位公义的神终将伸冤，这会如何改变我对不公的回应？", en: "If a just God will finally set things right, how does that change my response to injustice?" } },
  christ_uniqueness: { teachingTheme: { zh: "基督的唯一性与真理的位格性", en: "The uniqueness of Christ and truth as a Person" }, reflectionQuestion: { zh: "如果真理不是我定制的拼盘，而是一位向我走来的神，这意味着什么？", en: "If truth is not a buffet I curate but a God who comes to me, what does that mean?" } },
  cross: { teachingTheme: { zh: "十字架：神进入苦难与罪", en: "The cross: God entering suffering and sin" }, reflectionQuestion: { zh: "十字架如何同时回应我的罪疚和我的痛苦？", en: "How does the cross answer both my guilt and my pain at once?" } },
  resurrection: { teachingTheme: { zh: "复活的盼望胜过死亡与虚空", en: "Resurrection hope over death and futility" }, reflectionQuestion: { zh: "如果我流的眼泪不会消失在虚空里，今天我可以怎样活？", en: "If my tears don't vanish into the void, how might I live today?" } },
  grace: { teachingTheme: { zh: "白白的恩典胜过表现", en: "Free grace over performance" }, reflectionQuestion: { zh: "如果接纳不是我赢来的，今天我可以停止哪一种证明自己？", en: "If acceptance isn't earned, what self-proving can I stop today?" } },
  repentance: { teachingTheme: { zh: "悔改是转向恩典，而非自我定罪", en: "Repentance as turning to grace, not self-condemnation" }, reflectionQuestion: { zh: "我把悔改理解成自我打碎，还是在恩典中真实转向神？", en: "Do I see repentance as self-destruction, or as honestly turning to God in grace?" } },
  justification: { teachingTheme: { zh: "因信称义，不靠行为", en: "Justified by faith, not by works" }, reflectionQuestion: { zh: "如果我的义在基督里而非我的表现里，我今天可以放下什么焦虑？", en: "If my righteousness is in Christ, not my performance, what anxiety can I release today?" } },
  identity_in_christ: { teachingTheme: { zh: "在基督里的身份胜过人的评价", en: "Identity in Christ over human opinion" }, reflectionQuestion: { zh: "我最近最常用什么来定义自己？", en: "What have I most often used to define myself lately?" } },
  sanctification: { teachingTheme: { zh: "圣灵的更新与渐进的成圣", en: "The Spirit's renewal and gradual sanctification" }, reflectionQuestion: { zh: "我是否把成长误当成『感觉变好』，而非心被真理更新？", en: "Have I mistaken growth for 'feeling better' rather than the heart renewed by truth?" } },
  church: { teachingTheme: { zh: "教会作为基督的身体与真实的群体", en: "The church as Christ's body and real community" }, reflectionQuestion: { zh: "人的失败是真实的，但它能否定义神的本性吗？", en: "Human failure is real — but can it define God's nature?" } },
  kingdom_of_god: { teachingTheme: { zh: "神的国与终极的盼望", en: "The kingdom of God and ultimate hope" }, reflectionQuestion: { zh: "如果真正的盼望不在权力更替，而在已掌权的君王，这会如何改变我？", en: "If real hope is in the reigning King, not a change of power, how does that change me?" } },
  new_creation: { teachingTheme: { zh: "万物更新的应许", en: "The promise that all things are made new" }, reflectionQuestion: { zh: "如果有一天神要更新一切、擦去眼泪，这盼望今天如何托住我？", en: "If God will one day renew all things and wipe every tear, how does that hope hold me today?" } },
};

// ── 假福音简称 / Short label for the operating false gospel (per stronghold) ──
export const FALSE_GOSPEL_LABEL: Record<StrongholdId, BiText> = {
  scientism: { zh: "理性福音", en: "The gospel of reason" },
  moral_relativism: { zh: "自定善恶福音", en: "The gospel of self-defined good" },
  self_sovereignty: { zh: "自主福音", en: "The gospel of autonomy" },
  therapeutic_self: { zh: "感觉福音", en: "The gospel of feelings" },
  control_idolatry: { zh: "控制福音", en: "The gospel of control" },
  consumerism: { zh: "消费福音", en: "The gospel of consumption" },
  digital_distraction: { zh: "麻醉福音", en: "The gospel of numbing" },
  desire_identity_fusion: { zh: "欲望福音", en: "The gospel of desire" },
  achievement_idolatry: { zh: "成功福音", en: "The gospel of success" },
  techno_messianism: { zh: "技术福音", en: "The gospel of technology" },
  identity_absolutism: { zh: "群体身份福音", en: "The gospel of tribal identity" },
  political_idolatry: { zh: "权力福音", en: "The gospel of power" },
  nihilism: { zh: "虚无福音", en: "The gospel of nothingness" },
  suffering_objection: { zh: "解释福音", en: "The gospel of explanation" },
  church_hurt: { zh: "退场福音", en: "The gospel of withdrawal" },
  spiritual_consumerism: { zh: "灵性拼盘福音", en: "The gospel of spiritual buffet" },
  religious_formalism: { zh: "宗教表现福音", en: "The gospel of religious performance" },
  self_righteousness: { zh: "自义福音", en: "The gospel of self-righteousness" },
};
