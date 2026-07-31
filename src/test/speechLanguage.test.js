import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchTTS } from '../api'
import { setRuntimeLang } from '../i18n/runtime'
import {
  ENGLISH_SPEECH_TRANSLATION_UNAVAILABLE,
  prepareSpeechText,
} from '../speechText'
import { speechLangFor, ttsServerParamsFor } from '../voice'

describe('EN speech language guard', () => {
  beforeEach(() => {
    setRuntimeLang('en')
  })

  afterEach(() => {
    setRuntimeLang('zh')
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('translates dynamic Chinese content before returning speech text', async () => {
    const source = '这是一段仅用于语音测试的动态内容。'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        translations: ['This is dynamic content used only for a narration test.'],
      }),
    }))

    const result = await prepareSpeechText(source)

    expect(result).toBe('This is dynamic content used only for a narration test.')
    expect(result).not.toMatch(/[一-鿿]/)
    expect(fetch).toHaveBeenCalledWith('/api/translate-batch', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('fails closed instead of returning Chinese when translation is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(prepareSpeechText('这段中文不能被英文朗读。')).rejects.toMatchObject({
      code: ENGLISH_SPEECH_TRANSLATION_UNAVAILABLE,
    })
  })

  it('always selects English language and server voice in EN mode', () => {
    expect(speechLangFor('仍然是中文原文')).toBe('en-US')
    expect(ttsServerParamsFor('仍然是中文原文')).toEqual([
      'en-US',
      'en-US-AriaNeural',
    ])
  })

  it('blocks Chinese text at the TTS API boundary and does not make a request', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    await expect(fetchTTS('不可发送给英文语音')).rejects.toThrow(
      'ENGLISH_TTS_REQUIRES_ENGLISH_TEXT',
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('forces English TTS parameters even when a caller uses defaults', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['audio']),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchTTS('English narration')

    const [, options] = mockFetch.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({
      text: 'English narration',
      language_code: 'en-US',
      voice_name: 'en-US-AriaNeural',
    })
  })

  it('passes translated text and en-US to the browser fallback', async () => {
    const source = '这是浏览器回退朗读的专用测试内容。'
    const nativeSpeak = vi.fn((utterance) => {
      queueMicrotask(() => utterance.onend?.())
    })
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) {
        this.text = text
      }
    })
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      speak: nativeSpeak,
      getVoices: vi.fn(() => [{ name: 'Samantha', lang: 'en-US' }]),
    })
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).endsWith('/translate-batch')) {
        return {
          ok: true,
          json: async () => ({
            translations: ['This content specifically tests browser fallback narration.'],
          }),
        }
      }
      return {
        ok: false,
        status: 503,
        json: async () => ({}),
      }
    }))

    const { speakOnce } = await import('../useGlobalAudio.jsx')
    await expect(speakOnce(source)).resolves.toBe('ended')

    expect(nativeSpeak).toHaveBeenCalledOnce()
    const utterance = nativeSpeak.mock.calls[0][0]
    expect(utterance.text).toBe(
      'This content specifically tests browser fallback narration.',
    )
    expect(utterance.lang).toBe('en-US')
  })
})
