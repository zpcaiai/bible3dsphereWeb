// recorderUtils.js — 录音质量辅助（被 useSpeechInput 与各页面内联录音共用）。
// 目标：让「低声/轻声」也能被准确识别。

// 选择当前浏览器支持的录音容器（iOS Safari 只支持 mp4，不支持 webm）。
export function pickMimeType () {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ]
  for (const t of candidates) {
    try { if (MediaRecorder.isTypeSupported(t)) return t } catch (_) {}
  }
  return ''
}

// Deepgram 的 Content-Type（按容器归一化）。
export function contentTypeFor (mime) {
  if (!mime) return 'audio/webm'
  if (mime.includes('webm')) return 'audio/webm'
  if (mime.includes('mp4'))  return 'audio/mp4'
  if (mime.includes('aac'))  return 'audio/aac'
  if (mime.includes('ogg'))  return 'audio/ogg'
  return 'audio/webm'
}

// 软件增益链：source → compressor（拉平动态、避免大声破音）→ gain（整体放大）→ dest。
// 返回 { stream, ctx }；ctx 需在录音结束后 close()。WebAudio 不可用时回退原始流。
export function makeBoostedStream (stream, gainValue = 2.2) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return { stream, ctx: null }
    const ctx = new AC()
    if (ctx.state === 'suspended') { ctx.resume().catch((err) => { console.warn('[recorderUtils.js] ignored async error', err) }) }
    const src = ctx.createMediaStreamSource(stream)
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -50
    comp.knee.value = 30
    comp.ratio.value = 12
    comp.attack.value = 0.003
    comp.release.value = 0.25
    const gain = ctx.createGain()
    gain.gain.value = gainValue
    const dest = ctx.createMediaStreamDestination()
    src.connect(comp); comp.connect(gain); gain.connect(dest)
    return { stream: dest.stream, ctx }
  } catch (_) {
    return { stream, ctx: null }
  }
}

// 高质量录音约束：开启自动增益（对轻声很关键）。
export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
}
