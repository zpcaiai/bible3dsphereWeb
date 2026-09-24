export const SHARED_PREVIEW_PORTRAIT_URL = '/assets/digital-human/shared-preview-portrait-3d-v1.jpg'

export const SHARED_PREVIEW_VOICE_DISCLOSURE =
  '这是默认预览音色，只用于确认声音播放功能，不代表任何圣经人物的真实声音。'

/**
 * Plays only the fixed preview disclosure. Deliberately accepting no arbitrary
 * text prevents this local browser fallback from bypassing the reviewed
 * DigitalHumanResponse speech gate.
 */
export function speakSharedPreviewDisclosure({ onStart = () => {}, onEnd = () => {} } = {}) {
  const synth = globalThis.speechSynthesis
  const Utterance = globalThis.SpeechSynthesisUtterance
  if (!synth || typeof synth.speak !== 'function' || typeof Utterance !== 'function') {
    throw new Error('当前浏览器不支持默认预览音色')
  }

  synth.cancel?.()
  const utterance = new Utterance(SHARED_PREVIEW_VOICE_DISCLOSURE)
  const voices = synth.getVoices?.() || []
  utterance.voice = voices.find((voice) => voice.lang === 'zh-CN')
    || voices.find((voice) => voice.lang?.startsWith('zh'))
    || null
  utterance.lang = utterance.voice?.lang || 'zh-CN'
  utterance.rate = 0.92
  utterance.pitch = 1
  utterance.onstart = onStart
  utterance.onend = onEnd
  utterance.onerror = onEnd
  synth.speak(utterance)

  return () => {
    synth.cancel?.()
  }
}
