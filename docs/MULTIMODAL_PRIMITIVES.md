# 多模态原语使用手册

本仓库新增了两套共享原语，用来把「纯文字模块」升级为多模态输出。
**任何新增图表 / 声音 / 触觉都必须走这两套，不要各自造轮子、不要引入图表库。**

---

## 一、SVG 图表原语（`src/components/charts`）

零第三方依赖，全部手写 SVG。统一从 `index.js` 导入：

```jsx
import { Radar, TrendLine, BarSeries, ColumnSeries, CalendarHeatmap, MatrixHeatmap,
         RingProgress, Meter, StatTile, ConcentricRings, Timeline, MilestoneTrack,
         GrowthTree, YearWheel, HorariumDial, DirectedGraph, DecisionTree, Sankey,
         seriesColor, STATUS, INK } from '../../components/charts'
```

### 组件速查

| 组件 | 用途 | 关键 props |
|---|---|---|
| `Radar` | 多维状态对比（德性/恩赐/体检） | `axes:[{key,label}]`, `series:[{name,values:{key:num}}]`, `max`, `title`, `subtitle` |
| `TrendLine` | 时序趋势（情绪/恢复/周回顾） | `labels:string[]`, `series:[{name,values:number[]}]`, `yUnit`, `height` |
| `BarSeries` | 水平排序条（恩赐排名/模式计数） | `items:[{label,value,color?}]`, `unit`, `colorMode:'single'|'categorical'` |
| `ColumnSeries` | 离散时序柱 | `labels`, `values`, `unit` |
| `CalendarHeatmap` | 日历连续性（习惯/读经） | `data:[{date:'YYYY-MM-DD',value}]`, `weeks` |
| `MatrixHeatmap` | 周×时段矩阵 | `rows`, `cols`, `values:number[][]` |
| `RingProgress` | 环形完成度 | `value`, `max`, `label`, `severity:'good'|'warning'|'serious'|'critical'` |
| `Meter` | 横向计量条 | `value`, `max`, `label`, `severity`, `hint` |
| `StatTile` | 数字磁贴 + 迷你趋势 | `label`, `value`, `delta`, `deltaPeriod`, `spark:number[]`, `hero` |
| `ConcentricRings` | 「次序」同心圆（爱的次序） | `rings:[{label,actual:0..1}]`（按应然次序由内而外传） |
| `Timeline` | 时间轴 + 强度带 | `events:[{date,label,value?,severity?}]`, `valueLabel` |
| `MilestoneTrack` | 旅程站点 | `stops:[{label,note?}]`, `currentIndex`, `onSelect` |
| `GrowthTree` | 圣灵果子生长树 | `fruits:[{fruit,label,count}]` |
| `YearWheel` | 教会年历轮盘 | `seasons:[{key,label,startDay,endDay}]`, `todayDay` |
| `HorariumDial` | 24 小时环形日课盘 | `hours:[{key,label,hour,minute?,done?}]`, `nowHour` |
| `DirectedGraph` | 因果链路 / 关系图（自动识别回环） | `nodes:[{id,label,kind}]`, `edges:[{from,to,label?}]`；kind: `trigger|belief|emotion|behavior|consequence|grace` |
| `DecisionTree` | 决策 / 推演分支 | `root:{label,note?,tone?,children:[]}`；tone: `good|risk|danger|neutral|option` |
| `Sankey` | 流向（时间/注意力去向） | `nodes:[{id,label,layer}]`, `links:[{from,to,value}]` |

### 硬性规则（改动前请重读）

1. **不要新增颜色。** 分类色只能用 `seriesColor(i)`；它的 8 个色位已在本应用的深色画布上通过
   明度带 / 彩度 / 色觉障碍相邻对分离度 / 常视力下限 / 对比度五项校验。
2. **散点、关系图、任意两色会相邻的形态只用前 3 个色位**（`CATEGORICAL_ALLPAIRS`）。
3. **状态色 `STATUS.{good,warning,serious,critical}` 是保留色**，只表示状态，绝不当第 4 个系列，
   且必须与图标或文字同时出现，不能只靠颜色表意。
4. **文字永远用 `INK.{primary,secondary,muted}`**，不要给文字上数据色。
5. 所有图都必须传 `title`；能给出 `tableColumns`/`tableRows` 的（`ChartFrame` 内建）会自动提供
   「看数据」表格视图——这是屏幕阅读器与色觉障碍用户的兜底，不要绕过 `ChartFrame`。
6. **绝不用双 Y 轴。** 两个量纲不同的指标 → 两张图。

---

## 二、多模态输出原语（`src/lib/media`）

```jsx
import { useGuidedAudio } from '../../lib/media/useGuidedAudio'
import { useRhythmTone } from '../../lib/media/useRhythmTone'
import { useHaptics } from '../../lib/media/useHaptics'
import { useAmbience } from '../../lib/media/useAmbience'
import { useRecitation } from '../../lib/media/useRecitation'
import { getMediaPref } from '../../lib/media/mediaPrefs'
import { GuidedAudioBar, MediaToggleRow, BreathCircle, CountdownRing, SoundConsentBar } from '../../lib/media/MediaControls'
import { CardActions } from '../../lib/media/CardActions'
import { speakOnce, stopAllAudio } from '../../useGlobalAudio'
```

| 原语 | 作用 |
|---|---|
| `speakOnce(text, {rate})` | 朗读一段，返回 Promise（`'ended'｜'interrupted'`）；与全站单例共享，永不重叠播放 |
| `useGuidedAudio({scope})` | 分步播报 + 留白：`start(steps,{onStep,onComplete,rate,force})`，`steps:[{text,pauseAfter,label,onEnter}]`；暴露 `state/index/total/remaining/running` 与 `pause/resume/skip/stop` |
| `useRhythmTone({scope})` | 合成音：`inhale/exhale/hold/chime/ack/tone`，零音频文件 |
| `useAmbience({scope})` | 合成环境音：`start('rain'|'ocean'|'wind'|'hush')` / `toggle` / `stop` |
| `useHaptics({scope})` | `vibrate('tap'|'ack'|'confirm'|'stepDone'|'inhale'|'exhale'|'heartbeat')` |
| `useRecitation()` | 背经复诵闭环：`start(targetText)` → 录音 → STT → 返回 `result.accuracy` 与逐字 `ops` |
| `CardActions` | 一键把内容渲染成 1080×1350 图卡（下载 / 复制 / 换模板） |

### ⚠ 一个很容易踩的坑：不要把整个 hook 返回值放进 useEffect 的 deps

```jsx
// ✗ 错：hook 每次渲染都返回新对象（且 state 变化时必然变），
//        cleanup 会在每次重渲染时执行，播报刚开始就被自己停掉
useEffect(() => () => guided.stop(), [guided])

// ✓ 对：依赖稳定的方法引用
useEffect(() => () => guided.stop(), [guided.stop])

// ✓ 更对：其实不用写。useGuidedAudio / useAmbience / useRhythmTone
//        都已经在自己内部处理了卸载时停止，调用方只需在「离开某个子视图但组件不卸载」
//        （如切 Tab、换日期）时手动调用 stop()。
```

### 护栏（**不可协商**）

- `scope: 'crisis'` 走 `crisisAudio` / `crisisHaptics` 两个**默认关闭**的开关；
  其余走 `sound` / `haptics`。**任何声音都不得在用户未开启时自动播放。**
- 危机场景禁止尖锐、突发、高频音；创伤相关流程**完全不使用振动**。
- 所有动效必须尊重 `prefersReducedMotion()`。
- 音频与图表都要有文字等价物：关掉声音后功能必须依然完整可用。

---

## 三、i18n

用户可见的中文必须包在 `t()` / `i18nT()`（`src/i18n/runtime`）里；
`spiritual-formation` 下用该模块自己的 `T('中文','English')`（`../../lib/localize`）。
构建前会跑 `npm run i18n:audit`，漏包会被查出来。
