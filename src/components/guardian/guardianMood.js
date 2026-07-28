// guardianMood.js — 守护者的姿态状态机（纯函数，无 React、无副作用）。
//
// 姿态（mood）与状态（state）是两层：
//   state 是 guardianStore 一路传下来的原始信号（含后端返回的 spriteState）；
//   mood  是「它此刻该怎么站着」——只有五档，决定倾身、抬升还是低下来。
// 分成两层是因为：可信的陪伴感来自姿态的连续与克制，
// 而不是把每一个后端状态都画成一种特效。
//
// 单独成文件（而不是挂在 GuardianSprite.jsx 上）是为了让它能被
// 不渲染鸽子的地方（Widget、测试里被 mock 掉 Sprite 的场景）直接引用。

export const GUARDIAN_MOODS = Object.freeze(['idle', 'listening', 'encouraging', 'concerned', 'celebrating'])

/** guardianStore.spriteState 的六个取值 → 五档姿态 */
export const MOOD_BY_SPRITE_STATE = Object.freeze({
  idle: 'idle',
  resting: 'idle',
  listening: 'listening',
  comforting: 'concerned',   // 安慰＝关切地低下来靠近，不是打气
  praying: 'encouraging',
  celebrating: 'celebrating',
})

// EmotionCheckIn.EMOTIONS 里真实存在的 key
const HEAVY_EMOTIONS = new Set(['sadness', 'anxiety', 'anger', 'shame', 'loneliness', 'tired'])
const BRIGHT_EMOTIONS = new Set(['joy', 'peace', 'gratitude'])
// SpiritualCheckIn.STATES 里真实存在的 key
const HEAVY_STATES = new Set(['dry', 'struggling'])

/**
 * 由 guardianStore 已经在跟踪的真实状态推出姿态。
 * 只读它真的有的字段：spriteState / sending / stateView / lastEmotion；
 * 未登录或还没有任何签到时 stateView 为 null，就老实停在 idle，不猜心情。
 *
 * @param {{spriteState?: string, sending?: boolean, stateView?: object|null, lastEmotion?: string|null}} [signals]
 * @returns {'idle'|'listening'|'encouraging'|'concerned'|'celebrating'}
 */
export function resolveGuardianMood({ spriteState = 'idle', sending = false, stateView = null, lastEmotion = null } = {}) {
  // 消息正在发送＝它正在接住你这句话
  if (sending) return 'listening'

  const explicit = MOOD_BY_SPRITE_STATE[spriteState]
  if (explicit && explicit !== 'idle') return explicit

  // 最近一次心情签到里的沉重情绪，优先于平均分
  if (HEAVY_EMOTIONS.has(lastEmotion)) return 'concerned'

  if (stateView) {
    if (HEAVY_STATES.has(stateView.spiritualState)) return 'concerned'
    const levels = ['faithLevel', 'hopeLevel', 'loveLevel']
      .map((k) => Number(stateView[k]))
      .filter((n) => Number.isFinite(n))
    if (levels.length) {
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length
      if (avg <= 3.5) return 'concerned'
      if (avg >= 8) return 'encouraging'
    }
  }

  if (BRIGHT_EMOTIONS.has(lastEmotion)) return 'encouraging'
  return 'idle'
}

export default resolveGuardianMood
