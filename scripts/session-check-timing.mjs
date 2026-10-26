// Regression diagnostics only. Never read/export headers, bodies, cookies,
// credentials, error text, URLs or external request/session identifiers.
const fields = ['startTime', 'domainLookupStart', 'domainLookupEnd', 'connectStart', 'secureConnectionStart', 'connectEnd', 'requestStart', 'responseStart', 'responseEnd']
const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null

export function observeSessionChecks(page, { origin, limit = 32, now = Date.now } = {}) {
  const base = new URL(origin)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || !Number.isSafeInteger(limit) || limit < 1 || limit > 32 || typeof now !== 'function') throw new TypeError('Invalid session timing configuration')
  const rows = [], pending = new Map(), seen = new WeakSet()
  let closed = false, dropped = 0, errors = 0, stoppedAt = null, pendingAtStop = null
  const clock = () => finite(now())
  const installedAt = clock()
  const eligible = request => {
    const value = request.url()
    if (typeof value !== 'string' || request.method() !== 'GET' || !['fetch', 'xhr'].includes(request.resourceType())) return false
    let url
    try { url = new URL(value) } catch { return false }
    return url.origin === base.origin && !url.username && !url.password && url.pathname === '/api/auth/me'
  }
  const capture = action => value => {
    if (closed) return
    try { action(value) } catch { errors++ }
  }
  const handlers = {
    request: capture(request => {
      if (!eligible(request) || seen.has(request)) return
      seen.add(request)
      if (rows.length >= limit) { dropped++; return }
      const row = { sequence: rows.length + 1, startedAt: clock() }
      rows.push(row);pending.set(request, row)
    }),
    response: capture(response => {
      const row = pending.get(response.request())
      if (!row) return
      row.headersAt = clock()
      const status = response.status()
      row.status = Number.isInteger(status) && status >= 100 && status <= 599 ? status : null
    }),
  }
  for (const [event, key] of [['requestfinished', 'finishedAt'], ['requestfailed', 'failedAt']]) {
    handlers[event] = capture(request => {
      const row = pending.get(request)
      if (!row) return
      row[key] = clock()
      const timing = request.timing()
      row.timing = Object.fromEntries(fields.map(field => [field, finite(timing?.[field])]))
      pending.delete(request)
    })
  }
  for (const [event, handler] of Object.entries(handlers)) page.on(event, handler)
  const snapshot = () => ({
    schema: 'numeric-session-check-timing/v1',
    status: dropped || errors ? 'INCOMPLETE' : 'CAPTURED_BOUNDED',
    installedAt, stoppedAt, limit, dropped, errors,
    pendingAtCapture: closed ? pendingAtStop : pending.size,
    requests: rows.map(row => ({ ...row, ...(row.timing ? { timing: { ...row.timing } } : {}) })),
  })
  return {
    snapshot,
    stop() {
      if (!closed) {
        closed = true;stoppedAt = clock();pendingAtStop = pending.size
        for (const [event, handler] of Object.entries(handlers)) page.off(event, handler)
        pending.clear()
      }
      return snapshot()
    },
  }
}
