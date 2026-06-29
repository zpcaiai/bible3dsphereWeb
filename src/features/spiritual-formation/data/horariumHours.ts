// Horarium — William Law's fixed hours of prayer ("A Serious Call", ch. 14-22).
// Mirrors backend spiritual_formation_engine.HORARIUM_HOURS so client and server agree.

export type HorariumHour = {
  id: string;
  time: string;
  subject: string;
  title: string;
  scripture: string;
  focus: string;
  prompt: string;
};

export const horariumHours: HorariumHour[] = [
  {
    id: "early_morning",
    time: "06:00",
    subject: "Praise",
    title: "晨起 · 赞美与奉献",
    scripture: "诗篇 5:3",
    focus: "以赞美和感恩开始，将整天献给神。",
    prompt: "今晨我要为什么赞美神？我把今天的哪一部分交托给祂？",
  },
  {
    id: "third_hour",
    time: "09:00",
    subject: "Humility",
    title: "第三时 · 谦卑",
    scripture: "腓立比书 2:5-8",
    focus: "求主对付骄傲，操练谦卑。",
    prompt: "我在哪里想证明自己？如何效法基督的降卑？",
  },
  {
    id: "sixth_hour",
    time: "12:00",
    subject: "Universal Love",
    title: "第六时 · 普世之爱与代祷",
    scripture: "提摩太前书 2:1",
    focus: "为他人代求，操练爱与怜悯。",
    prompt: "今天我为谁代祷？我可以向谁行出爱？",
  },
  {
    id: "ninth_hour",
    time: "15:00",
    subject: "Resignation",
    title: "第九时 · 顺服神的旨意",
    scripture: "路加福音 22:42",
    focus: "在一切际遇中降服于神的旨意。",
    prompt: "我此刻在抗拒神的什么安排？我愿意说『愿你的旨意成就』吗？",
  },
  {
    id: "evening",
    time: "18:00",
    subject: "Confession",
    title: "傍晚 · 认罪与省察",
    scripture: "诗篇 139:23-24",
    focus: "认罪、领受赦免、修复关系。",
    prompt: "今天我亏欠了神或人什么？我要如何认罪与修复？",
  },
  {
    id: "compline",
    time: "21:30",
    subject: "Eternity",
    title: "睡前 · 默想永恒",
    scripture: "诗篇 90:12",
    focus: "数算自己的日子，预备见主。",
    prompt: "如果今夜见主，我预备好了吗？今天有什么值得感谢与悔改？",
  },
];

export const horariumHourIds = horariumHours.map((hour) => hour.id);
export const horariumHoursById = Object.fromEntries(
  horariumHours.map((hour) => [hour.id, hour]),
) as Record<string, HorariumHour>;
