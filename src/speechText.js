import { translateTexts } from './api'
import { getRuntimeLang, lookupTranslation, setEnEntry } from './i18n/runtime'

const CJK = /[一-鿿]/
const MAX_TRANSLATION_CHARS = 1600

export const ENGLISH_SPEECH_TRANSLATION_UNAVAILABLE =
  'ENGLISH_SPEECH_TRANSLATION_UNAVAILABLE'

function splitForTranslation(text, maxChars = MAX_TRANSLATION_CHARS) {
  if (text.length <= maxChars) return [text]

  const pieces = text
    .split(/(?<=[。！？!?；;\n])/u)
    .map((part) => part.trim())
    .filter(Boolean)
  const chunks = []
  let current = ''

  for (const piece of pieces) {
    if (piece.length > maxChars) {
      if (current) {
        chunks.push(current)
        current = ''
      }
      for (let start = 0; start < piece.length; start += maxChars) {
        chunks.push(piece.slice(start, start + maxChars))
      }
      continue
    }

    const next = current ? `${current}\n${piece}` : piece
    if (next.length > maxChars) {
      chunks.push(current)
      current = piece
    } else {
      current = next
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function validEnglish(value) {
  return typeof value === 'string' && value.trim() && !CJK.test(value)
}

/**
 * Resolve the exact text that may be sent to a speech engine.
 *
 * EN mode is fail-closed: Chinese source text is translated first, and if an
 * English translation is unavailable no Chinese text is returned for speech.
 */
export async function prepareSpeechText(rawText) {
  const source = String(rawText ?? '').trim()
  if (!source || getRuntimeLang() !== 'en' || !CJK.test(source)) return source

  const local = lookupTranslation(source)
  if (validEnglish(local)) return local.trim()

  const chunks = splitForTranslation(source)
  const resolved = new Array(chunks.length)
  const missing = []
  const missingIndexes = []

  chunks.forEach((chunk, index) => {
    const candidate = lookupTranslation(chunk)
    if (validEnglish(candidate)) {
      resolved[index] = candidate.trim()
    } else {
      missing.push(chunk)
      missingIndexes.push(index)
    }
  })

  if (missing.length) {
    const translated = await translateTexts(missing, 'en')
    missingIndexes.forEach((index, offset) => {
      resolved[index] = translated?.[offset]
    })
  }

  if (resolved.some((value) => !validEnglish(value))) {
    const error = new Error(ENGLISH_SPEECH_TRANSLATION_UNAVAILABLE)
    error.code = ENGLISH_SPEECH_TRANSLATION_UNAVAILABLE
    throw error
  }

  const english = resolved.map((value) => value.trim()).join('\n')
  setEnEntry(source, english)
  return english
}

export function notifyEnglishSpeechUnavailable() {
  if (typeof window === 'undefined') return
  const message = 'English narration is temporarily unavailable. Please try again.'
  if (typeof window.showToast === 'function') window.showToast(message, 'error')
}
