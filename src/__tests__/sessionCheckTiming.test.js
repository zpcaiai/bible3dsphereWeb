// Unit event fixtures exercise redaction/lifecycle, not backend responses.
// Actual browser/auth/backend execution is verified by graph-entry-profile.
import { EventEmitter } from 'node:events'
import { observeSessionChecks } from '../../scripts/session-check-timing.mjs'

const origin = 'https://holiness.uk'
const request = (url = origin + '/api/auth/me', method = 'GET', resourceType = 'fetch', timing = {}) => ({
  url: () => url, method: () => method, resourceType: () => resourceType, timing: () => timing,
  headers: () => { throw Error('Private headers must never be read') },
  postData: () => { throw Error('Private body must never be read') },
  failure: () => { throw Error('Private error text must never be read') },
})
const response = (req, status = 200) => ({ request: () => req, status: () => status, body: () => { throw Error('Private response must never be read') } })
function setup(options = {}) {
  const page = new EventEmitter();let time = 100
  return { page, collector: observeSessionChecks(page, { origin, now: () => ++time, ...options }) }
}

describe('numeric session-check timing privacy and lifecycle', () => {
  it('captures start, headers and finish using only numeric fields and fixed schema', () => {
    const { page, collector } = setup(), req = request(origin + '/api/auth/me?token=PRIVATE#SECRET', 'GET', 'fetch', { startTime: 1000, requestStart: 2, responseStart: 300, responseEnd: 302, private: 'PRIVATE' })
    page.emit('request', req);page.emit('response', response(req));page.emit('requestfinished', req)
    const result = collector.stop(), row = result.requests[0]
    expect(result.status).toBe('CAPTURED_BOUNDED');expect(result.pendingAtCapture).toBe(0)
    expect(row).toMatchObject({ sequence: 1, startedAt: 102, headersAt: 103, status: 200, finishedAt: 104 })
    expect(row.timing).toEqual({ startTime: 1000, domainLookupStart: null, domainLookupEnd: null, connectStart: null, secureConnectionStart: null, connectEnd: null, requestStart: 2, responseStart: 300, responseEnd: 302 })
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|SECRET|token|holiness|https|\/api|cookie|password/i)
  })

  it('excludes login, other endpoints, documents, wrong methods, foreign origins and malformed URLs', () => {
    const { page, collector } = setup()
    for (const req of [request(origin + '/api/auth/email/login', 'POST'), request(origin + '/api/users/private'), request(origin + '/api/auth/me', 'POST'), request(origin + '/api/auth/me', 'GET', 'document'), request('https://foreign.test/api/auth/me'), request('https://user:SECRET@holiness.uk/api/auth/me'), request('invalid')]) page.emit('request', req)
    expect(collector.stop()).toMatchObject({ status: 'CAPTURED_BOUNDED', requests: [], pendingAtCapture: 0, errors: 0 })
  })

  it('keeps a request pending at the exact capture boundary and ignores later completion', () => {
    const { page, collector } = setup(), req = request()
    page.emit('request', req)
    const stopped = collector.stop()
    expect(stopped.pendingAtCapture).toBe(1);expect(stopped.requests[0].finishedAt).toBeUndefined()
    page.emit('response', response(req));page.emit('requestfinished', req)
    expect(collector.stop()).toEqual(stopped)
  })

  it('records real-protocol failure timing without ever reading the raw error', () => {
    const { page, collector } = setup(), req = request(origin + '/api/auth/me', 'GET', 'xhr', { startTime: 20, requestStart: -1, responseEnd: -1 })
    page.emit('request', req);page.emit('requestfailed', req)
    expect(collector.stop()).toMatchObject({ pendingAtCapture: 0, requests: [{ failedAt: 103, timing: { startTime: 20, requestStart: -1, responseEnd: -1 } }] })
  })

  it('counts overflow and never claims complete bounded capture when records were lost', () => {
    const { page, collector } = setup({ limit: 1 }), first = request()
    page.emit('request', first);page.emit('request', request());page.emit('request', request())
    const result = collector.stop()
    expect(result).toMatchObject({ status: 'INCOMPLETE', limit: 1, dropped: 2, pendingAtCapture: 1 })
    expect(result.requests).toHaveLength(1)
  })

  it('deduplicates events without conflating distinct requests or repeated navigations', () => {
    const { page, collector } = setup(), a = request(), b = request()
    page.emit('request', a);page.emit('request', a);page.emit('requestfinished', a);page.emit('request', a);page.emit('request', b)
    const result = collector.stop()
    expect(result.requests.map(r => r.sequence)).toEqual([1, 2]);expect(result.pendingAtCapture).toBe(1)
  })

  it('does not associate unknown responses or terminal events with a recorded request', () => {
    const { page, collector } = setup(), req = request()
    page.emit('response', response(req));page.emit('requestfinished', req);page.emit('requestfailed', req)
    expect(collector.stop()).toMatchObject({ requests: [], errors: 0, pendingAtCapture: 0 })
  })

  it('sanitizes non-finite and non-numeric clocks, HTTP status and timing values', () => {
    const { page, collector } = setup({ now: () => 'PRIVATE' }), req = request(origin + '/api/auth/me', 'GET', 'fetch', { startTime: NaN, requestStart: Infinity, responseStart: 'PRIVATE' })
    page.emit('request', req);page.emit('response', response(req, 'PRIVATE'));page.emit('requestfinished', req)
    const result = collector.stop()
    expect(result.requests[0]).toMatchObject({ startedAt: null, headersAt: null, finishedAt: null, status: null })
    expect(Object.values(result.requests[0].timing).every(x => x === null)).toBe(true)
    expect(JSON.stringify(result)).not.toContain('PRIVATE')
  })

  it('reports observer exceptions without exporting exception contents or throwing into the app', () => {
    const { page, collector } = setup()
    expect(() => page.emit('request', { url: () => { throw Error('PRIVATE cookie') } })).not.toThrow()
    const result = collector.stop();expect(result).toMatchObject({ status: 'INCOMPLETE', errors: 1 })
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|cookie/)
  })

  it('releases every installed listener and is idempotent on stop', () => {
    const { page, collector } = setup()
    for (const event of ['request', 'response', 'requestfinished', 'requestfailed']) expect(page.listenerCount(event)).toBe(1)
    const result = collector.stop();expect(collector.stop()).toEqual(result)
    for (const event of ['request', 'response', 'requestfinished', 'requestfailed']) expect(page.listenerCount(event)).toBe(0)
  })

  it('returns detached snapshots so caller mutations cannot corrupt future evidence', () => {
    const { page, collector } = setup(), req = request()
    page.emit('request', req);page.emit('requestfinished', req)
    const snapshot = collector.snapshot();snapshot.requests[0].sequence = 900;snapshot.requests[0].timing.startTime = 'PRIVATE';snapshot.requests.push({ private: true })
    const result = collector.stop();expect(result.requests).toHaveLength(1);expect(result.requests[0].sequence).toBe(1);expect(result.requests[0].timing.startTime).toBeNull()
  })

  it('rejects invalid storage, origin and clock configuration before attaching listeners', () => {
    const page = new EventEmitter()
    for (const options of [{ limit: 0 }, { limit: 33 }, { limit: 1.5 }, { now: 2 }, { origin: 'file:///private' }, { origin: 'https://user:PRIVATE@holiness.uk' }]) expect(() => observeSessionChecks(page, { origin, ...options })).toThrow()
    expect(page.eventNames()).toEqual([])
  })
})
