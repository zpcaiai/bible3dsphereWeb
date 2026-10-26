// Unit privacy/bounds controls. Actual Chrome and backend execution is separate.
import { assetPath, sourceFrame, networkEvent, timelineEvent, cpuProfile, documentEvent, boundedCollector, boundedTimeline, withinWitnessBudget } from '../../scripts/graph-entry-witness.mjs'

describe('graph causal witness privacy and evidence integrity', () => {
  it('retains same-origin reload and health timing while excluding private documents and foreign roots', () => {
    const pending = new Map(), options = { origin: 'https://holiness.uk' }
    for (const [id, type, path] of [['doc', 'Document', '/'], ['health', 'Fetch', '/api/health']]) {
      const request = networkEvent('request', { requestId: id, type, timestamp: 10, wallTime: 20, request: { url: `https://holiness.uk${path}?token=secret`, headers: { Authorization: 'secret' } } }, pending, options)
      expect(request?.path).toBe(path)
      const response = networkEvent('response', { requestId: id, type, timestamp: 11, response: { url: `https://holiness.uk${path}`, status: 200, protocol: 'h2', remoteIPAddress: '104.21.1.2', remotePort: 443, headers: { 'cf-ray': 'abc123-SIN', 'x-vercel-id': 'sin1::abc-123', 'Set-Cookie': 'secret' }, timing: { requestTime: 10, receiveHeadersStart: 800, receiveHeadersEnd: 801 } } }, pending, options)
      expect(response.remoteAddress).toEqual({ ip: '104.21.1.2', port: 443 })
      expect(response.correlation).toEqual({ 'cf-ray': 'abc123-SIN', 'x-vercel-id': 'sin1::abc-123' })
      expect(response.timing.receiveHeadersStart).toBe(800)
      expect(JSON.stringify([request, response])).not.toMatch(/secret|Authorization|Set-Cookie|token=/)
      expect(networkEvent('finished', { requestId: id, timestamp: 12 }, pending, options).path).toBe(path)
    }
    for (const url of ['https://foreign.test/', 'https://holiness.uk/private/account', 'https://holiness.uk/api/auth/email/login']) {
      expect(networkEvent('request', { requestId: 'private', type: 'Document', request: { url } }, pending, options)).toBeNull()
    }
  })

  it('retains only a static asset path and removes credentials, query and fragment', () => {
    expect(assetPath('https://user:password@example.test/assets/MirrorPage-abc.js?token=secret#private')).toBe('/assets/MirrorPage-abc.js')
    expect(assetPath('/assets/digital-human/portraits-v1/moses.webp')).toBe('/assets/digital-human/portraits-v1/moses.webp')
    expect(assetPath('https://example.test/api/auth/email/login?token=secret')).toBeNull()
    expect(assetPath('data:text/javascript,private')).toBeNull()
    expect(assetPath(null)).toBeNull()
  })

  it('does not expose dynamic source names, URLs or function names in stack frames', () => {
    const safe = sourceFrame({ url: 'https://example.test/assets/index-a.js?session=secret', scriptId: '42', functionName: 'private chat', lineNumber: 1, columnNumber: 2, body: 'password' })
    expect(safe).toEqual({ path: '/assets/index-a.js', scriptId: '42', line: 1, column: 2 })
    expect(sourceFrame({ url: 'https://example.test/account/private' })).toBeNull()
  })

  it('captures real-protocol timing fields without request or response payloads', () => {
    const pending = new Map()
    const request = networkEvent('request', { requestId: '1.2', timestamp: 10, wallTime: 20, loaderId: 'loader', type: 'Script', request: { url: 'https://x.test/assets/MirrorPage-a.js?password=secret', postData: 'secret', headers: { Authorization: 'secret' } }, initiator: { type: 'script', stack: { callFrames: [{ url: 'https://x.test/assets/index-b.js?session=secret', scriptId: '5', lineNumber: 4, columnNumber: 8, functionName: 'private' }] } } }, pending)
    expect(request.initiator.frames).toEqual([{ path: '/assets/index-b.js', scriptId: '5', line: 4, column: 8 }])
    expect(pending.get('1.2')).toBe('/assets/MirrorPage-a.js')
    const response = networkEvent('response', { requestId: '1.2', timestamp: 11, response: { url: 'https://x.test/assets/MirrorPage-a.js', status: 200, protocol: 'h2', connectionId: 8, connectionReused: true, headers: { 'Set-Cookie': 'secret' }, timing: { requestTime: 10, dnsStart: 0, dnsEnd: 1, sendStart: 2, receiveHeadersEnd: 4, private: 'secret' } } }, pending)
    expect(response.protocol).toBe('h2')
    expect(response.timing.dnsEnd - response.timing.dnsStart).toBe(1)
    expect(response.connectionId).toBe(8)
    expect(networkEvent('response', { requestId: '1.2', response: { url: '/assets/MirrorPage-a.js', protocol: 'http/1.1' } }, pending).protocol).toBe('http/1.1')
    expect(JSON.stringify([request, response])).not.toMatch(/secret|Authorization|Set-Cookie|postData|password|functionName/)
    expect(networkEvent('finished', { requestId: '1.2', timestamp: 12, encodedDataLength: 1024 }, pending).path).toBe('/assets/MirrorPage-a.js')
    expect(pending.size).toBe(0)
  })

  it('does not retain login traffic, raw network errors or unknown identifiers', () => {
    const pending = new Map()
    expect(networkEvent('request', { requestId: '1', type: 'Fetch', request: { url: 'https://x.test/api/auth/email/login' } }, pending)).toBeNull()
    expect(networkEvent('request', { requestId: 'private/secret', request: { url: '/assets/index-a.js' } }, pending)).toBeNull()
    pending.set('1', '/assets/index-a.js')
    expect(networkEvent('failed', { requestId: '1', errorText: 'https://x.test/?password=secret' }, pending).errorCode).toBeNull()
    pending.set('2', '/assets/index-a.js')
    expect(networkEvent('failed', { requestId: '2', errorText: 'net::ERR_FAILED' }, pending).errorCode).toBe('net::ERR_FAILED')
  })

  it('records bounded numeric main-thread durations without arbitrary trace arguments', () => {
    const row = timelineEvent({ name: 'EvaluateScript', ph: 'X', ts: 10, dur: 20, pid: 7, tid: 8, args: { data: { url: 'https://x.test/assets/index-a.js?token=secret', scriptId: '2', lineNumber: 3, columnNumber: 4, message: 'private chat' }, auth: 'secret' } })
    expect(row.durationMicroseconds).toBe(20)
    expect(row.source.path).toBe('/assets/index-a.js')
    expect(JSON.stringify(row)).not.toMatch(/secret|private chat|auth|message/)
    expect(timelineEvent({ name: 'SendRequest', ph: 'X', args: { headers: 'secret' } })).toBeNull()
    expect(timelineEvent({ name: 'EvaluateScript', ph: 'B' })).toBeNull()
  })

  it('preserves CPU sample IDs and clock deltas, strips private call-frame fields', () => {
    const row = cpuProfile({ startTime: 100, endTime: 120, nodes: [{ id: 1, hitCount: 2, children: [2], callFrame: { functionName: '(root)' } }, { id: 2, hitCount: 1, callFrame: { url: 'https://x.test/assets/index-a.js?secret=secret', functionName: 'private chat', scriptId: '3', lineNumber: 5, columnNumber: 6 } }], samples: [1, 2], timeDeltas: [10, 10], private: 'secret' })
    expect(row.samples).toEqual([1, 2])
    expect(row.timeDeltas).toEqual([10, 10])
    expect(row.nodes[1].source.column).toBe(6)
    expect(row.nodes[0].runtime).toBe('(root)')
    expect(row.truncated).toBe(false)
    expect(JSON.stringify(row)).not.toMatch(/secret|private chat/)
  })

  it('makes CPU or event overflow explicit instead of claiming complete coverage', () => {
    expect(cpuProfile({ nodes: [{ id: 1 }, { id: 2 }], samples: [1, 2], timeDeltas: [1, 1] }, 1).truncated).toBe(true)
    const collector = boundedCollector(2)
    collector.append(null);collector.append({ n: 1 });collector.append({ n: 2 });collector.append({ n: 3 })
    expect(collector.rows).toEqual([{ n: 1 }, { n: 2 }])
    expect(collector.dropped).toBe(1)
    expect(() => boundedCollector(0)).toThrow()
    expect(() => cpuProfile({}, 0)).toThrow()
    expect(cpuProfile({ nodes: [{ id: 1, children: [2, 3] }, { id: 2, children: [4, 5] }], samples: [], timeDeltas: [] }, 2).truncated).toBe(true)
  })

  it('allows only document milestones and numeric clocks, never page contents', () => {
    expect(documentEvent({ kind: 'document-open', timeOrigin: 1000, now: 12, wallTime: 1012, user: 'private', url: '?token=secret' })).toEqual({ kind: 'document-open', timeOrigin: 1000, now: 12, wallTime: 1012, loadingCount: null })
    expect(documentEvent({ kind: 'heading-visible', timeOrigin: NaN, now: Infinity, wallTime: 'secret', loadingCount: 0 })).toEqual({ kind: 'heading-visible', timeOrigin: null, now: null, wallTime: null, loadingCount: 0 })
    expect(documentEvent({ kind: 'private-chat', message: 'secret' })).toBeNull()
  })

  it('records anonymous connection contention and trusted thread identities only', () => {
    const pending = new Map()
    const row = networkEvent('request', { requestId: '2', type: 'Fetch', frameId: 'frame', loaderId: 'loader', request: { url: 'https://x.test/api/layout?user=secret' } }, pending)
    expect(row.path).toBe('<background-api>')
    expect(row.frameId).toBe('frame')
    expect(JSON.stringify(row)).not.toMatch(/secret|layout|user=/)
    expect(timelineEvent({ name: 'thread_name', ph: 'M', pid: 1, tid: 2, args: { name: 'CrRendererMain', private: 'secret' } })).toEqual({ name: 'thread_name', pid: 1, tid: 2, value: 'CrRendererMain' })
    expect(timelineEvent({ name: 'thread_name', ph: 'M', args: { name: 'private secret' } })).toBeNull()
    const full = new Map(Array.from({ length: 20000 }, (_, index) => [String(index), '/assets/a.js']))
    expect(networkEvent('request', { requestId: 'overflow', request: { url: '/assets/b.js' } }, full).pendingOverflow).toBe(true)
    expect(full.size).toBe(20000)
  })

  it('settles diagnostic work within the original case budget without waiting forever', async () => {
    let called = false
    await expect(withinWitnessBudget(() => { called = true;return Promise.resolve() }, Date.now() - 1)).rejects.toMatchObject({ name: 'WitnessDeadlineError' })
    expect(called).toBe(false)
    await expect(withinWitnessBudget(() => new Promise(() => {}), Date.now() + 1000, 5)).rejects.toMatchObject({ name: 'WitnessDeadlineError' })
    await expect(withinWitnessBudget(() => Promise.resolve(42), Date.now() + 1000)).resolves.toBe(42)
  })

  it('accounts for every tiny event while keeping script, slow-task and thread detail', () => {
    const timeline = boundedTimeline(10)
    for (const duration of [10, 20, 30]) timeline.append(timelineEvent({ name: 'FunctionCall', ph: 'X', ts: 100, dur: duration, pid: 1, tid: 2 }))
    timeline.append(timelineEvent({ name: 'CompileScript', ph: 'X', ts: 100, dur: 10, pid: 1, tid: 2 }))
    timeline.append(timelineEvent({ name: 'FunctionCall', ph: 'X', ts: 100, dur: 2000, pid: 1, tid: 2 }))
    timeline.append(timelineEvent({ name: 'thread_name', ph: 'M', pid: 1, tid: 2, args: { name: 'CrRendererMain' } }))
    expect(timeline.eligibleEvents).toBe(6)
    expect(timeline.rows.map(row => row.name)).toEqual(['CompileScript', 'FunctionCall', 'thread_name'])
    expect([...timeline.buckets.values()]).toEqual([{ name: 'FunctionCall', pid: 1, tid: 2, bucketStartMicroseconds: 0, count: 3, inclusiveDurationMicroseconds: 60, minDurationMicroseconds: 10, maxDurationMicroseconds: 30 }])
    expect(timeline.dropped).toBe(0)
  })

  it('uses a single unchanged storage bound and reports every lost new timeline entry', () => {
    const timeline = boundedTimeline(2)
    timeline.append(timelineEvent({ name: 'RunTask', ph: 'X', ts: 1, dur: 1, pid: 1, tid: 2 }))
    timeline.append(timelineEvent({ name: 'EvaluateScript', ph: 'X', ts: 1, dur: 1, pid: 1, tid: 2 }))
    timeline.append(timelineEvent({ name: 'RunTask', ph: 'X', ts: 50001, dur: 2, pid: 1, tid: 2 }))
    timeline.append(timelineEvent({ name: 'RunTask', ph: 'X', ts: 2, dur: 2, pid: 1, tid: 2 }))
    expect(timeline.rows.length + timeline.buckets.size).toBe(2)
    expect(timeline.eligibleEvents).toBe(4)
    expect(timeline.dropped).toBe(1)
    expect([...timeline.buckets.values()][0].count).toBe(2)
  })
})
