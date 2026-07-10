const SENSITIVE_KEYS = new Set([
  'prayer', 'note', 'review', 'biggestCapture', 'biggestGrace',
  'repentancePoint', 'tomorrowBoundary', 'interruptionReason',
  'closingReflection', 'openingPrayer', 'scriptureText', 'prompt',
  'rawResponse', 'body', 'reflection', 'payload', 'possibleRoot',
  'customMessage', 'prayerRequestBody', 'sharePayload',
])

export function redactAttentionLogPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload.map(redactAttentionLogPayload)
  if (!payload || typeof payload !== 'object') return payload
  let redacted = false
  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key[0]?.toLowerCase() + key.slice(1))) {
      output[key] = '[REDACTED_ATTENTION_SENSITIVE]'
      redacted = true
    } else {
      output[key] = redactAttentionLogPayload(value)
    }
  }
  if (redacted) output.sensitiveFieldsRedacted = true
  return output
}
