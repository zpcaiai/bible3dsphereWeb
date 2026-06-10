import { polygon } from '../lib/geojson'
import type { BibleTerritoryDTO, GeoJsonPosition, TerritoryStatus } from '../domain/types'

interface TerritoryDef {
  id: string
  name: string
  nameZh: string
  ownerType: 'tribe' | 'kingdom' | 'nation' | 'empire'
  ownerId: string
  period: string
  startYear: number
  endYear: number | null
  controlScore: number
  status: TerritoryStatus
  color?: string
  points: GeoJsonPosition[]
  description: string
}

function close(points: GeoJsonPosition[]): GeoJsonPosition[] {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return points
  if (first[0] === last[0] && first[1] === last[1]) return points
  return [...points, first]
}

function territory(t: TerritoryDef): BibleTerritoryDTO {
  return {
    id: `${t.ownerType}-${t.id}`,
    name: t.name,
    nameZh: t.nameZh,
    ownerType: t.ownerType,
    ownerId: t.ownerId,
    ownerName: t.nameZh,
    period: t.period,
    startYear: t.startYear,
    endYear: t.endYear,
    controlScore: t.controlScore,
    status: t.status,
    color: t.color ?? null,
    geojson: polygon([close(t.points)]),
    description: t.description,
  }
}

const tribeDefs: TerritoryDef[] = [
  {
    id: 'judah', name: 'Judah', nameZh: '犹大', ownerType: 'tribe', ownerId: 'judah', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 86, status: 'stable', color: '#ef4444',
    points: [[34.72, 31.15], [34.92, 31.55], [35.12, 31.72], [35.45, 31.68], [35.52, 31.36], [35.36, 31.02], [35.08, 30.82], [34.72, 30.92]],
    description: '犹大支派地业覆盖南部山地、希伯仑、伯利恒、耶路撒冷南侧与别是巴一带，是大卫王朝核心区域。',
  },
  {
    id: 'simeon', name: 'Simeon', nameZh: '西缅', ownerType: 'tribe', ownerId: 'simeon', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 46, status: 'oppressed', color: '#f97316',
    points: [[34.42, 30.82], [34.77, 31.08], [35.08, 30.82], [35.0, 30.48], [34.58, 30.42], [34.32, 30.58]],
    description: '西缅的城邑散在犹大南地之中，后期逐渐与犹大融合。',
  },
  {
    id: 'benjamin', name: 'Benjamin', nameZh: '便雅悯', ownerType: 'tribe', ownerId: 'benjamin', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 64, status: 'disputed', color: '#facc15',
    points: [[35.03, 31.72], [35.19, 31.94], [35.44, 31.96], [35.55, 31.78], [35.43, 31.62], [35.14, 31.64]],
    description: '便雅悯地处犹大与以法莲之间，包含耶利哥、基比亚与耶路撒冷北侧通道，战略位置关键。',
  },
  {
    id: 'dan', name: 'Dan', nameZh: '但', ownerType: 'tribe', ownerId: 'dan', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 43, status: 'oppressed', color: '#ec4899',
    points: [[34.62, 31.82], [34.84, 32.08], [35.13, 32.1], [35.2, 31.84], [35.05, 31.68], [34.72, 31.68]],
    description: '但支派原在沿海平原与山麓之间，受非利士压力，部分族人北迁到拉亿/但。',
  },
  {
    id: 'ephraim', name: 'Ephraim', nameZh: '以法莲', ownerType: 'tribe', ownerId: 'ephraim', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 78, status: 'stable', color: '#22c55e',
    points: [[34.9, 31.96], [35.1, 32.28], [35.45, 32.32], [35.6, 32.08], [35.43, 31.94], [35.08, 31.9]],
    description: '以法莲位于中央山地，示剑、示罗、伯特利周边形成北方支派的宗教与政治重心。',
  },
  {
    id: 'manasseh-west', name: 'Manasseh (West)', nameZh: '西玛拿西', ownerType: 'tribe', ownerId: 'manasseh-west', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 70, status: 'stable', color: '#10b981',
    points: [[34.82, 32.28], [34.95, 32.67], [35.23, 32.75], [35.56, 32.58], [35.58, 32.32], [35.16, 32.22]],
    description: '西玛拿西连接撒玛利亚山地、耶斯列谷南缘与沙仑平原，城邑与迦南人据点长期交错。',
  },
  {
    id: 'issachar', name: 'Issachar', nameZh: '以萨迦', ownerType: 'tribe', ownerId: 'issachar', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 61, status: 'stable', color: '#84cc16',
    points: [[35.18, 32.45], [35.38, 32.74], [35.68, 32.75], [35.82, 32.55], [35.62, 32.38], [35.32, 32.32]],
    description: '以萨迦位于耶斯列谷与他泊山附近，土地肥沃、交通要道密集。',
  },
  {
    id: 'zebulun', name: 'Zebulun', nameZh: '西布伦', ownerType: 'tribe', ownerId: 'zebulun', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 66, status: 'stable', color: '#65a30d',
    points: [[35.05, 32.66], [35.18, 32.98], [35.48, 33.02], [35.58, 32.78], [35.38, 32.62]],
    description: '西布伦处于加利利下部，靠近拿撒勒、他泊山与海路通道。',
  },
  {
    id: 'asher', name: 'Asher', nameZh: '亚设', ownerType: 'tribe', ownerId: 'asher', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 42, status: 'lost', color: '#64748b',
    points: [[34.92, 32.78], [35.0, 33.22], [35.22, 33.48], [35.45, 33.42], [35.42, 33.05], [35.2, 32.82]],
    description: '亚设沿腓尼基海岸南段分布，推罗、西顿影响强，沿海城邑难以完全控制。',
  },
  {
    id: 'naphtali', name: 'Naphtali', nameZh: '拿弗他利', ownerType: 'tribe', ownerId: 'naphtali', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 58, status: 'disputed', color: '#38bdf8',
    points: [[35.35, 32.82], [35.52, 33.3], [35.78, 33.36], [35.86, 33.02], [35.72, 32.72], [35.48, 32.66]],
    description: '拿弗他利在加利利湖西北与上加利利一带，常受亚兰与腓尼基势力影响。',
  },
  {
    id: 'reuben', name: 'Reuben', nameZh: '流便', ownerType: 'tribe', ownerId: 'reuben', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 54, status: 'disputed', color: '#a855f7',
    points: [[35.48, 31.18], [35.72, 31.78], [36.02, 31.78], [36.12, 31.28], [35.92, 30.86], [35.55, 30.92]],
    description: '流便在死海东侧与亚嫩河以北，牧场广阔，与摩押边界接触频繁。',
  },
  {
    id: 'gad', name: 'Gad', nameZh: '迦得', ownerType: 'tribe', ownerId: 'gad', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 60, status: 'disputed', color: '#8b5cf6',
    points: [[35.48, 31.78], [35.62, 32.42], [36.05, 32.45], [36.12, 31.82], [35.96, 31.52], [35.7, 31.5]],
    description: '迦得位于约旦河东中段，包含雅博河区域，处在亚扪、摩押与以色列交通线上。',
  },
  {
    id: 'manasseh-east', name: 'Manasseh (East)', nameZh: '东玛拿西', ownerType: 'tribe', ownerId: 'manasseh-east', period: 'tribal_allotment',
    startYear: -1400, endYear: -1050, controlScore: 55, status: 'disputed', color: '#14b8a6',
    points: [[35.62, 32.42], [35.78, 33.05], [36.3, 33.12], [36.46, 32.52], [36.18, 32.18], [35.88, 32.18]],
    description: '东玛拿西位于巴珊与基列北部，牧养资源丰富，也常处在亚兰与以色列冲突边界。',
  },
]

const kingdomAndNationDefs: TerritoryDef[] = [
  {
    id: 'united-monarchy', name: 'United Monarchy', nameZh: '统一王国', ownerType: 'kingdom', ownerId: 'united-monarchy', period: 'united_monarchy',
    startYear: -1050, endYear: -930, controlScore: 82, status: 'stable', color: '#f59e0b',
    points: [[34.5, 30.45], [34.95, 33.28], [35.55, 33.45], [36.38, 32.95], [36.16, 31.0], [35.62, 30.45], [34.9, 30.18]],
    description: '扫罗、大卫、所罗门时期的以色列统一王国，范围随军事控制与附庸关系变化，此处为核心控制区示意。',
  },
  {
    id: 'israel-north', name: 'Kingdom of Israel', nameZh: '北国以色列', ownerType: 'kingdom', ownerId: 'israel-north', period: 'divided_monarchy',
    startYear: -930, endYear: -722, controlScore: 70, status: 'disputed', color: '#3b82f6',
    points: [[34.82, 31.93], [35.0, 33.25], [35.58, 33.43], [36.1, 32.92], [36.02, 31.84], [35.48, 31.76], [35.18, 31.9]],
    description: '分裂王国后的北国以色列，首都曾在示剑、得撒，后在撒玛利亚，最终亡于亚述。',
  },
  {
    id: 'judah-kingdom', name: 'Kingdom of Judah', nameZh: '南国犹大', ownerType: 'kingdom', ownerId: 'judah-kingdom', period: 'divided_monarchy',
    startYear: -930, endYear: -586, controlScore: 68, status: 'oppressed', color: '#dc2626',
    points: [[34.55, 30.65], [34.92, 31.75], [35.45, 31.78], [35.58, 31.2], [35.18, 30.62], [34.72, 30.45]],
    description: '南国犹大以耶路撒冷为中心，承接大卫王朝，历经亚述、巴比伦压力，最终被掳。',
  },
  {
    id: 'philistia', name: 'Philistia', nameZh: '非利士', ownerType: 'nation', ownerId: 'philistia', period: 'iron_age',
    startYear: -1200, endYear: -604, controlScore: 64, status: 'disputed', color: '#db2777',
    points: [[34.2, 31.22], [34.38, 31.85], [34.72, 32.05], [34.86, 31.68], [34.68, 31.22], [34.42, 31.02]],
    description: '非利士五城位于地中海沿岸平原，与以色列士师及早期王国长期冲突。',
  },
  {
    id: 'aram-damascus', name: 'Aram-Damascus', nameZh: '亚兰大马士革', ownerType: 'nation', ownerId: 'aram-damascus', period: 'iron_age',
    startYear: -1100, endYear: -732, controlScore: 72, status: 'disputed', color: '#0ea5e9',
    points: [[35.72, 32.9], [36.2, 34.0], [37.0, 34.25], [37.35, 33.55], [36.8, 32.95], [36.0, 32.62]],
    description: '亚兰大马士革控制叙利亚南部与黑门山以北区域，是列王纪中以色列的重要敌国。',
  },
  {
    id: 'ammon', name: 'Ammon', nameZh: '亚扪', ownerType: 'nation', ownerId: 'ammon', period: 'iron_age',
    startYear: -1200, endYear: -582, controlScore: 58, status: 'disputed', color: '#eab308',
    points: [[35.88, 31.72], [36.28, 32.32], [36.72, 32.18], [36.78, 31.58], [36.28, 31.18], [35.98, 31.34]],
    description: '亚扪位于约旦河东、拉巴一带，与以色列、犹大时有战争与外交往来。',
  },
  {
    id: 'moab', name: 'Moab', nameZh: '摩押', ownerType: 'nation', ownerId: 'moab', period: 'iron_age',
    startYear: -1300, endYear: -582, controlScore: 60, status: 'disputed', color: '#f97316',
    points: [[35.55, 30.86], [35.88, 31.62], [36.28, 31.32], [36.18, 30.72], [35.84, 30.45], [35.48, 30.56]],
    description: '摩押位于死海东侧高原，是路得、巴兰、米沙碑与列王纪冲突的重要背景。',
  },
  {
    id: 'edom', name: 'Edom', nameZh: '以东', ownerType: 'nation', ownerId: 'edom', period: 'iron_age',
    startYear: -1300, endYear: -400, controlScore: 62, status: 'disputed', color: '#ea580c',
    points: [[35.18, 29.45], [35.62, 30.72], [36.1, 30.52], [36.38, 29.72], [35.9, 29.12], [35.28, 29.05]],
    description: '以东位于死海南方至西珥山地，与雅各/以扫传统、旷野路程和先知审判密切相关。',
  },
]

const empireDefs: TerritoryDef[] = [
  {
    id: 'assyria', name: 'Assyria', nameZh: '亚述', ownerType: 'empire', ownerId: 'assyria', period: 'empire',
    startYear: -900, endYear: -612, controlScore: 88, status: 'empire', color: '#8b5cf6',
    points: [[35.2, 31.2], [37.0, 35.2], [39.2, 37.2], [43.4, 37.4], [48.8, 35.4], [47.3, 31.0], [42.0, 29.8], [37.2, 31.0]],
    description: '新亚述帝国势力覆盖两河流域、亚兰与黎凡特，主前722年灭北国以色列。',
  },
  {
    id: 'babylon', name: 'Babylon', nameZh: '巴比伦', ownerType: 'empire', ownerId: 'babylon', period: 'empire',
    startYear: -626, endYear: -539, controlScore: 90, status: 'empire', color: '#7c3aed',
    points: [[34.8, 30.5], [36.2, 34.0], [40.5, 36.0], [45.2, 35.4], [48.6, 31.2], [47.0, 29.0], [42.4, 29.2], [38.4, 30.0]],
    description: '新巴比伦帝国在尼布甲尼撒时期控制犹大与耶路撒冷，主前586年毁城并掳民。',
  },
  {
    id: 'persia', name: 'Persia', nameZh: '波斯', ownerType: 'empire', ownerId: 'persia', period: 'empire',
    startYear: -550, endYear: -330, controlScore: 92, status: 'empire', color: '#9333ea',
    points: [[27.0, 31.0], [34.0, 38.5], [45.0, 41.0], [57.0, 39.4], [63.0, 33.0], [56.0, 25.2], [43.0, 25.0], [33.0, 28.0]],
    description: '波斯帝国从埃及到伊朗高原，古列诏令开启犹太人归回与圣殿重建。',
  },
  {
    id: 'greece', name: 'Greek/Hellenistic Realms', nameZh: '希腊化诸国', ownerType: 'empire', ownerId: 'greece', period: 'empire',
    startYear: -336, endYear: -146, controlScore: 86, status: 'empire', color: '#a855f7',
    points: [[19.0, 35.0], [23.8, 41.2], [31.0, 40.0], [39.6, 36.0], [37.2, 30.0], [29.5, 30.2], [23.0, 32.2]],
    description: '亚历山大及其后继希腊化势力影响地中海东部，形成新约时期语言与文化背景。',
  },
  {
    id: 'rome', name: 'Rome', nameZh: '罗马', ownerType: 'empire', ownerId: 'rome', period: 'empire',
    startYear: -27, endYear: 476, controlScore: 94, status: 'empire', color: '#6d28d9',
    points: [[-5.5, 36.0], [3.0, 44.5], [13.0, 47.8], [25.0, 45.2], [36.5, 39.0], [39.5, 31.0], [31.2, 29.0], [17.0, 31.8], [5.0, 33.5]],
    description: '罗马帝国控制新约时代的犹太、叙利亚、小亚细亚、希腊与意大利，是福音扩展的政治道路网络背景。',
  },
]

const tribeTerritories = tribeDefs.map(territory)
const kingdomAndNationTerritories = kingdomAndNationDefs.map(territory)
const empireTerritories = empireDefs.map(territory)

export const seedTribes: BibleTerritoryDTO[] = tribeTerritories
export const seedEmpires: BibleTerritoryDTO[] = [...kingdomAndNationTerritories, ...empireTerritories]
export const seedTerritories: BibleTerritoryDTO[] = [...tribeTerritories, ...kingdomAndNationTerritories, ...empireTerritories]
