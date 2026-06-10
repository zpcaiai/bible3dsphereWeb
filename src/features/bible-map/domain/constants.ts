import type { BibleLayer } from './types'
import { t } from '../../../i18n/runtime'

export const DEFAULT_YEAR = -1200
export const YEAR_MIN = -1500
export const YEAR_MAX = 100
export const YEAR_STEP = 10

export const DEFAULT_CENTER: [number, number] = [35.2, 31.8]
export const DEFAULT_ZOOM = 6

// 耶路撒冷（预言射线起点）
export const JERUSALEM: [number, number] = [35.2137, 31.7683]

export const EVENT_YEAR_WINDOW = 150 // 事件年份就近匹配窗口

export const LAYERS: ReadonlyArray<{ id: BibleLayer; label: string }> = [
  { id: 'tribes', label: t('十二支派') },
  { id: 'empires', label: t('列国帝国') },
  { id: 'all', label: t('全部疆域') },
  { id: 'people', label: t('人物轨迹') },
  { id: 'prophecies', label: t('先知预言') },
  { id: 'campaigns', label: t('战役路线') },
]

export const DISCLAIMER =
  t('本地图为教学用途，古代边界与路线采用近似重建，不代表考古定论。')
