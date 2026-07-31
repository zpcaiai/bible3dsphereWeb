// 统一语音(TTS)语言/嗓音选择：EN 模式只用英文嗓音，ZH 用中文。
// EN 模式的中文源文本必须先经过 prepareSpeechText() 翻译；这里不再按原文
// 回退中文，避免页面已经显示英文、朗读却仍然播放中文。
import { getRuntimeLang } from './i18n/runtime'

// 返回 'en-US' | 'zh-CN'
export function speechLangFor(_text) {
  return getRuntimeLang() === 'en' ? 'en-US' : 'zh-CN'
}

// 根据文本应读语言挑一个最合适的本地嗓音(可能为 null)
export function pickVoiceFor(text) {
  const lang = speechLangFor(text)
  const voices = (typeof window !== 'undefined' && window.speechSynthesis?.getVoices?.()) || []
  if (lang.startsWith('en')) {
    return voices.find(v => /aria|jenny|guy|natural|samantha|female/i.test(v.name || '') && v.lang?.startsWith('en'))
      || voices.find(v => v.lang === 'en-US')
      || voices.find(v => v.lang?.startsWith('en'))
      || null
  }
  return voices.find(v => /xiaoxiao|tingting|婷婷|yaoyao|zhiyu/i.test(v.name || ''))
    || voices.find(v => v.lang?.startsWith('zh') && /female|女/i.test(v.name || ''))
    || voices.find(v => v.lang === 'zh-CN')
    || voices.find(v => v.lang?.startsWith('zh'))
    || null
}

// 服务端 TTS 参数 [language_code, voice_name]
export function ttsServerParamsFor(text) {
  return speechLangFor(text).startsWith('en')
    ? ['en-US', 'en-US-AriaNeural']
    : ['zh-CN', 'zh-CN-XiaoxiaoNeural']
}
