// audioEngine.js — 全站共享的 Web Audio 上下文。
//
// 为什么不用音频文件：呼吸引导音、计时提示音、环境底噪都可以用振荡器与噪声缓冲
// 合成，零网络请求、天然离线可用（危机关怀在地铁/信号差时也必须能响）。

let _ctx = null
let _master = null

export function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (_ctx) return _ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  try {
    _ctx = new AC()
    _master = _ctx.createGain()
    _master.gain.value = 1
    _master.connect(_ctx.destination)
  } catch {
    _ctx = null
  }
  return _ctx
}

export function getMasterGain() {
  if (!_ctx) getAudioContext()
  return _master
}

/** 浏览器要求音频必须在用户手势后才能启动，所有入口按钮都应调用一次。 */
export async function resumeAudio() {
  const ctx = getAudioContext()
  if (!ctx) return false
  if (ctx.state === 'suspended') {
    try { await ctx.resume() } catch { return false }
  }
  return ctx.state === 'running'
}

export function audioSupported() {
  if (typeof window === 'undefined') return false
  return !!(window.AudioContext || window.webkitAudioContext)
}

/** 生成一段用于噪声音源的缓冲。kind: 'white' | 'pink' | 'brown' */
export function createNoiseBuffer(ctx, kind = 'brown', seconds = 4) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  if (kind === 'white') {
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1
  } else if (kind === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else {
    let last = 0
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  }
  return buffer
}
