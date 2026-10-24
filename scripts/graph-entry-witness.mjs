// Read-only Chrome evidence. Never export raw CDP packets, headers, bodies or URLs.
export const WITNESS_SCHEMA = 'graph-entry-causal-witness/v1'
const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null
const token = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,96}$/.test(value) ? value : null

export function assetPath(value) {
  if (typeof value !== 'string') return null
  try {
    const path = new URL(value, 'https://witness.invalid').pathname
    return /^\/assets\/[A-Za-z0-9_./-]+\.(?:js|css|webp|png|woff2?|ttf)$/.test(path) ? path : null
  } catch { return null }
}

export function sourceFrame(frame) {
  const path = assetPath(frame?.url)
  if (!path) return null
  return { path, scriptId: token(frame.scriptId), line: finite(frame.lineNumber), column: finite(frame.columnNumber) }
}

export function networkEvent(kind, event, pending) {
  const id = token(event.requestId)
  const url = event.request?.url ?? event.response?.url
  let path = assetPath(url) ?? pending.get(id)
  // Background connections matter for contention, but their endpoint/IDs do not.
  if (!path && typeof url === 'string' && ['Fetch', 'XHR', 'EventSource'].includes(event.type)) {
    try {
      const pathname = new URL(url, 'https://witness.invalid').pathname
      if (pathname.startsWith('/api/') && !/^\/api\/(?:auth|users?|v1\/digital-human\/turns)(?:\/|$)/.test(pathname)) path = '<background-api>'
    } catch { /* not an eligible network identifier */ }
  }
  if (!id || !path) return null
  const row = { kind, requestId: id, path, timestamp: finite(event.timestamp) }
  if (kind === 'request') {
    if (pending.size < 20000 || pending.has(id)) pending.set(id, path)
    else row.pendingOverflow = true
    row.wallTime = finite(event.wallTime)
    row.loaderId = token(event.loaderId)
    row.frameId = token(event.frameId)
    row.resourceType = token(event.type)
    row.initiator = { type: token(event.initiator?.type), frames: [] }
    let stack = event.initiator?.stack
    for (let depth = 0; stack && depth < 4; depth++, stack = stack.parent) {
      for (const frame of (stack.callFrames ?? []).slice(0, 16)) {
        const safe = sourceFrame(frame)
        if (safe) row.initiator.frames.push(safe)
      }
    }
  }
  if (kind === 'response') {
    const response = event.response
    row.status = finite(response.status)
    row.protocol = ['http/0.9', 'http/1.0', 'http/1.1', 'h2', 'h3', 'h3-29'].includes(response.protocol) ? response.protocol : null
    row.connectionId = finite(response.connectionId)
    row.connectionReused = response.connectionReused === true
    row.fromServiceWorker = response.fromServiceWorker === true
    row.fromDiskCache = response.fromDiskCache === true
    row.eventStream = response.mimeType === 'text/event-stream'
    row.timing = Object.fromEntries(['requestTime', 'proxyStart', 'proxyEnd', 'dnsStart', 'dnsEnd', 'connectStart', 'connectEnd', 'sslStart', 'sslEnd', 'workerStart', 'workerReady', 'sendStart', 'sendEnd', 'receiveHeadersStart', 'receiveHeadersEnd'].map(key => [key, finite(response.timing?.[key])]))
  }
  if (kind === 'finished' || kind === 'failed') {
    pending.delete(id)
    row.encodedDataLength = finite(event.encodedDataLength)
    row.canceled = event.canceled === true
    // Error text may contain a URL. Keep only the standard error token.
    row.errorCode = typeof event.errorText === 'string' ? event.errorText.match(/^net::[A-Z_]+$/)?.[0] ?? null : null
  }
  return row
}

const traceNames = new Set(['RunTask', 'Task', 'EvaluateScript', 'CompileScript', 'ParseProgram', 'FunctionCall', 'UpdateLayoutTree', 'Layout', 'Paint', 'V8.Execute', 'v8.compile', 'v8.run'])
export function timelineEvent(event) {
  if (event.ph === 'M' && ['thread_name', 'process_name'].includes(event.name)) {
    const value = event.args?.name
    if (['CrRendererMain', 'CrBrowserMain', 'Chrome_IOThread', 'Renderer', 'Browser'].includes(value)) return { name: event.name, pid: finite(event.pid), tid: finite(event.tid), value }
    return null
  }
  if (!traceNames.has(event.name) || event.ph !== 'X') return null
  return { name: event.name, timestampMicroseconds: finite(event.ts), durationMicroseconds: finite(event.dur), pid: finite(event.pid), tid: finite(event.tid), source: sourceFrame(event.args?.data ?? {}) }
}

export function cpuProfile(profile, limit = 60000) {
  if (!Number.isSafeInteger(limit) || limit <= 0 || limit > 60000) throw Error('Invalid CPU evidence bound')
  let remainingEdges = limit, lostEdges = false
  const nodes = (profile.nodes ?? []).slice(0, limit).map(node => {
    const children = (node.children ?? []).slice(0, remainingEdges).map(finite)
    if (children.length < (node.children?.length ?? 0)) lostEdges = true
    remainingEdges -= children.length
    return { id: finite(node.id), hitCount: finite(node.hitCount), children, source: sourceFrame(node.callFrame), runtime: ['(root)', '(program)', '(idle)', '(garbage collector)'].includes(node.callFrame?.functionName) ? node.callFrame.functionName : null }
  })
  const samples = (profile.samples ?? []).slice(0, limit).map(finite)
  const timeDeltas = (profile.timeDeltas ?? []).slice(0, limit).map(finite)
  return { startTime: finite(profile.startTime), endTime: finite(profile.endTime), nodes, samples, timeDeltas,
    truncated: lostEdges || (profile.nodes?.length ?? 0) > limit || (profile.samples?.length ?? 0) > limit || (profile.timeDeltas?.length ?? 0) > limit }
}

export function documentEvent(value) {
  if (!['document-open', 'heading-visible', 'loading-change', 'observer-stats'].includes(value?.kind)) return null
  const row = { kind: value.kind, timeOrigin: finite(value.timeOrigin), now: finite(value.now), wallTime: finite(value.wallTime), loadingCount: finite(value.loadingCount) }
  if (value.kind === 'observer-stats') row.stats = { calls: finite(value.stats?.calls), observerMs: finite(value.stats?.observerMs), scannedNodes: finite(value.stats?.scannedNodes) }
  return row
}

export function boundedCollector(limit = 20000) {
  if (!Number.isSafeInteger(limit) || limit <= 0) throw Error('Invalid evidence bound')
  return { rows: [], dropped: 0, append(row) { if (!row) return; if (this.rows.length < limit) this.rows.push(row); else this.dropped++ } }
}

// Keep causal script/long-task detail; quantify every selected tiny generic event.
// Inclusive durations can overlap. These buckets are not exclusive CPU time.
export function boundedTimeline(limit = 20000) {
  if (!Number.isSafeInteger(limit) || limit <= 0) throw Error('Invalid timeline bound')
  const generic = new Set(['RunTask', 'Task', 'FunctionCall', 'UpdateLayoutTree', 'Layout', 'Paint', 'V8.Execute'])
  return {
    rows: [], buckets: new Map(), dropped: 0, eligibleEvents: 0,
    append(row) {
      if (!row) return
      this.eligibleEvents++
      const short = generic.has(row.name) && Number.isFinite(row.durationMicroseconds) && row.durationMicroseconds >= 0 && row.durationMicroseconds < 1000 && Number.isFinite(row.timestampMicroseconds)
      if (short) {
        const bucketStartMicroseconds = Math.floor(row.timestampMicroseconds / 50000) * 50000
        const key = [row.pid, row.tid, row.name, bucketStartMicroseconds].join(':')
        let bucket = this.buckets.get(key)
        if (!bucket) {
          if (this.rows.length + this.buckets.size >= limit) { this.dropped++;return }
          bucket = { name: row.name, pid: row.pid, tid: row.tid, bucketStartMicroseconds, count: 0, inclusiveDurationMicroseconds: 0, minDurationMicroseconds: row.durationMicroseconds, maxDurationMicroseconds: row.durationMicroseconds }
          this.buckets.set(key, bucket)
        }
        bucket.count++;bucket.inclusiveDurationMicroseconds += row.durationMicroseconds
        bucket.minDurationMicroseconds = Math.min(bucket.minDurationMicroseconds, row.durationMicroseconds)
        bucket.maxDurationMicroseconds = Math.max(bucket.maxDurationMicroseconds, row.durationMicroseconds)
      } else if (this.rows.length + this.buckets.size < limit) this.rows.push(row)
      else this.dropped++
    },
  }
}

function observeDocument() {
  if (window.__graphCausalDocumentInstalled) return
  window.__graphCausalDocumentInstalled = true
  const stats = { calls: 0, observerMs: 0, scannedNodes: 0 }
  const emit = (kind, loadingCount = null) => window.__graphCausalDocument(JSON.stringify({ kind, timeOrigin: performance.timeOrigin, now: performance.now(), wallTime: Date.now(), loadingCount, stats }))
  window.__graphCausalSnapshot = () => emit('observer-stats')
  addEventListener('pagehide', window.__graphCausalSnapshot)
  emit('document-open')
  let lastLoading = -1, headingSeen = false
  const observe = () => {
    const at = performance.now(), headings = [...document.querySelectorAll('h2')], nodes = [...document.querySelectorAll('p,span')]
    const heading = headings.find(node => node.textContent.trim() === '关系图谱')
    const visible = !headingSeen && heading?.getClientRects().length && getComputedStyle(heading).visibility !== 'hidden'
    const count = nodes.filter(node => node.childElementCount === 0 && node.textContent.trim() === '加载中…').length
    stats.calls++;stats.scannedNodes += headings.length + nodes.length;stats.observerMs += performance.now() - at
    if (visible) { headingSeen = true; emit('heading-visible');emit('observer-stats') }
    if (count !== lastLoading) { lastLoading = count; emit('loading-change', count);emit('observer-stats') }
  }
  let observer, stopped = false
  window.__graphCausalStop = () => {
    if (stopped) return
    stopped = true;emit('observer-stats');observer?.disconnect()
    removeEventListener('DOMContentLoaded', start);removeEventListener('pagehide', window.__graphCausalSnapshot)
  }
  const start = () => { if (stopped) return;observe();observer = new MutationObserver(observe);observer.observe(document.documentElement, { childList: true, subtree: true }) }
  if (document.documentElement) start()
  else addEventListener('DOMContentLoaded', start, { once: true })
}

export async function withinWitnessBudget(operation, deadlineAt, capMs = 5000) {
  const remaining = Math.min(capMs, deadlineAt - Date.now())
  if (!(remaining > 0)) { const error = Error('Original case budget exhausted');error.name = 'WitnessDeadlineError';throw error }
  let timer
  try {
    return await Promise.race([operation(), new Promise((_, reject) => { timer = setTimeout(() => { const error = Error('Diagnostic operation exceeded its bounded budget');error.name = 'WitnessDeadlineError';reject(error) }, remaining) })])
  } finally { clearTimeout(timer) }
}

export async function startCausalWitness(page, { deadlineAt } = {}) {
  if (!Number.isFinite(deadlineAt)) throw Error('Original case deadline is required')
  const network = boundedCollector(), scripts = boundedCollector(), timeline = boundedTimeline(), documents = boundedCollector(1000), contexts = boundedCollector(1000), frames = boundedCollector(1000)
  const pending = new Map(), phases = [], errorCollector = boundedCollector(100), startedAt = Date.now()
  const errors = errorCollector.rows
  const fail = (stage, name) => errorCollector.append({ stage, name })
  const bounded = operation => withinWitnessBudget(operation, deadlineAt)
  let session, before = null, after = null, cpuStarted = false, traceStarted = false, cpuAttempted = false, traceAttempted = false, generation = 0, startupAbandoned = false, mainFrameId = null, documentScriptId = null, bindingAttempted = false
  const lateEffects = { session: 'NOT_REQUESTED', documentScript: 'NOT_REQUESTED', cpuStartAttempted: false, traceStartAttempted: false }
  let resolveTrace
  const traceDone = new Promise(resolve => { resolveTrace = resolve })
  const closed = () => { fail('page-close', 'PageClosed');resolveTrace() }
  page.once('close', closed)
  const send = (method, params) => bounded(() => session.send(method, params))
  const stopDocument = async () => {
    await bounded(() => page.evaluate(() => window.__graphCausalStop?.())).catch(error => fail('observer-stop', error.name))
    if (documentScriptId) {
      try { await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: documentScriptId });documentScriptId = null;lateEffects.documentScript = 'REMOVED' }
      catch (error) { fail('new-document-script-stop', error.name) }
    }
    if (bindingAttempted) {
      try { await send('Runtime.removeBinding', { name: '__graphCausalDocument' });bindingAttempted = false }
      catch (error) { fail('document-binding-stop', error.name) }
    }
  }
  const metrics = async () => {
    const before = Date.now()
    const reply = await send('Performance.getMetrics')
    const allowed = new Set(['Timestamp', 'NavigationStart', 'TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount', 'JSHeapUsedSize'])
    return { parentBefore: before, parentAfter: Date.now(), values: Object.fromEntries(reply.metrics.filter(item => allowed.has(item.name)).map(item => [item.name, finite(item.value)])) }
  }
  try {
    lateEffects.session = 'PENDING'
    session = await bounded(() => page.context().newCDPSession(page).then(async value => {
      session = value;lateEffects.session = 'ATTACHED'
      if (startupAbandoned) {
        try { await withinWitnessBudget(() => value.detach(), deadlineAt, 1000);lateEffects.session = 'LATE_DETACHED' }
        catch (error) { lateEffects.session = 'LATE_CLEANUP_UNCONFIRMED';fail('late-session-cleanup', error.name) }
      }
      return value
    }))
    for (const [event, kind] of [['requestWillBeSent', 'request'], ['responseReceived', 'response'], ['loadingFinished', 'finished'], ['loadingFailed', 'failed']]) session.on('Network.' + event, value => network.append(networkEvent(kind, value, pending)))
    session.on('Page.frameNavigated', ({ frame }) => {
      if (!frame.parentId) mainFrameId = token(frame.id)
      frames.append({ kind: 'frame-navigated', frameId: token(frame.id), loaderId: token(frame.loaderId), parentAt: Date.now() })
    })
    session.on('Runtime.executionContextCreated', ({ context }) => {
      if (context.auxData?.isDefault) contexts.append({ kind: 'context-created', generation, uniqueContextId: token(context.uniqueId), executionContextId: finite(context.id), frameId: token(context.auxData.frameId), parentAt: Date.now() })
    })
    session.on('Runtime.executionContextsCleared', () => { generation++;contexts.append({ kind: 'contexts-cleared', generation, parentAt: Date.now() }) })
    session.on('Runtime.bindingCalled', value => {
      if (value.name !== '__graphCausalDocument') return
      try {
        const context = contexts.rows.filter(item => item.kind === 'context-created' && item.generation === generation && item.executionContextId === value.executionContextId).at(-1)
        if (context?.frameId !== mainFrameId) return
        const row = documentEvent(JSON.parse(value.payload))
        if (row) documents.append({ ...row, generation, executionContextId: finite(value.executionContextId), parentAt: Date.now() })
      }
      catch { fail('document-binding', 'InvalidDocumentEvent') }
    })
    session.on('Debugger.scriptParsed', value => {
      const path = assetPath(value.url)
      if (path) scripts.append({ path, generation, scriptId: token(value.scriptId), observedAt: Date.now(), startLine: finite(value.startLine), endLine: finite(value.endLine), executionContextId: finite(value.executionContextId) })
    })
    session.on('Tracing.dataCollected', value => { for (const event of value.value) timeline.append(timelineEvent(event)) })
    session.once('Tracing.tracingComplete', () => resolveTrace())
    await send('Page.enable')
    const { frameTree } = await send('Page.getFrameTree')
    mainFrameId = token(frameTree.frame.id)
    frames.append({ kind: 'frame-navigated', frameId: token(frameTree.frame.id), loaderId: token(frameTree.frame.loaderId), parentAt: Date.now() })
    await send('Runtime.enable')
    bindingAttempted = true
    await send('Runtime.addBinding', { name: '__graphCausalDocument' })
    lateEffects.documentScript = 'PENDING'
    documentScriptId = (await send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + observeDocument.toString() + ')()' })).identifier
    lateEffects.documentScript = 'INSTALLED'
    await bounded(() => page.evaluate(observeDocument))
    await send('Network.enable')
    await send('Debugger.enable')
    await send('Performance.enable')
    await send('Profiler.enable')
    await send('Profiler.setSamplingInterval', { interval: 1000 })
    before = await metrics()
    cpuAttempted = lateEffects.cpuStartAttempted = true
    await send('Profiler.start');cpuStarted = true
    traceAttempted = lateEffects.traceStartAttempted = true
    await send('Tracing.start', { categories: 'devtools.timeline,v8,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });traceStarted = true
  } catch (error) {
    startupAbandoned = true
    fail('startup', error.name)
    if (session) {
      await stopDocument().catch(failure => fail('startup-document-cleanup', failure.name))
      if (cpuAttempted) await send('Profiler.stop').catch(failure => fail('startup-cpu-cleanup', failure.name))
      if (traceAttempted) await send('Tracing.end').catch(failure => fail('startup-trace-cleanup', failure.name))
      await bounded(() => session.detach()).then(() => { lateEffects.session = 'DETACHED_AFTER_STARTUP_FAILURE' }).catch(failure => { lateEffects.session = 'CLEANUP_UNCONFIRMED';fail('startup-detach', failure.name) })
    }
    cpuStarted = traceStarted = false
  }
  let finished = false
  return {
    mark(kind) {
      if (!['before-tap', 'tap-complete', 'heading-expect-start', 'heading-expect-pass', 'heading-expect-fail'].includes(kind)) throw Error('Unsupported phase')
      phases.push({ kind, wallTime: Date.now() })
    },
    async finish(predicate) {
      if (finished) throw Error('Evidence already finalized')
      finished = true
      const stopRequestedAt = Date.now()
      let cpu = null
      if (cpuStarted) {
        await stopDocument().catch(error => fail('document-stop', error.name))
        try { after = await metrics() } catch (error) { fail('metrics-stop', error.name) }
        try { cpu = cpuProfile((await send('Profiler.stop')).profile) } catch (error) { fail('cpu-stop', error.name) }
      }
      if (traceStarted) try { await send('Tracing.end');await bounded(() => traceDone) } catch (error) { fail('trace-stop', error.name) }
      page.off('close', closed)
      if (session && (cpuStarted || traceStarted)) await bounded(() => session.detach()).then(() => { lateEffects.session = 'DETACHED' }).catch(error => { lateEffects.session = 'CLEANUP_UNCONFIRMED';fail('detach', error.name) })
      const dropped = { network: network.dropped, scripts: scripts.dropped, timeline: timeline.dropped, documents: documents.dropped, contexts: contexts.dropped, frames: frames.dropped, errors: errorCollector.dropped }
      const epochs = documents.rows.filter(row => row.kind === 'document-open').map(row => {
        const context = contexts.rows.filter(item => item.kind === 'context-created' && item.generation === row.generation && item.executionContextId === row.executionContextId && item.parentAt <= row.parentAt).at(-1)
        const frame = frames.rows.filter(item => item.frameId === context?.frameId && item.parentAt <= row.parentAt).at(-1)
        return { timeOrigin: row.timeOrigin, generation: row.generation, executionContextId: row.executionContextId, uniqueContextId: context?.uniqueContextId ?? null, frameId: context?.frameId ?? null, loaderId: frame?.loaderId ?? null }
      })
      const rendererThreads = timeline.rows.filter(row => row.name === 'thread_name' && row.value === 'CrRendererMain')
      const scriptContexts = new Map()
      for (const row of scripts.rows) {
        const key = row.scriptId + '|' + row.path
        if (!scriptContexts.has(key)) scriptContexts.set(key, new Set())
        scriptContexts.get(key).add(row.generation + ':' + row.executionContextId)
      }
      const nodeContexts = new Map((cpu?.nodes ?? []).map(node => {
        const matches = scriptContexts.get(node.source?.scriptId + '|' + node.source?.path)
        return [node.id, matches?.size === 1 ? [...matches][0] : null]
      }))
      const sampleCounts = new Map()
      for (const id of cpu?.samples ?? []) { const context = nodeContexts.get(id);sampleCounts.set(context, (sampleCounts.get(context) ?? 0) + 1) }
      const cpuEpochs = epochs.map(epoch => ({ ...epoch, attributedSamples: sampleCounts.get(epoch.generation + ':' + epoch.executionContextId) ?? 0 }))
      const complete = epochs.length > 0 && epochs.every(epoch => epoch.frameId && epoch.loaderId) && rendererThreads.length > 0 && network.rows.length > 0 && cpu?.samples.length > 0 && cpu?.nodes.length > 0
      return { schema: WITNESS_SCHEMA, startedAt, stopRequestedAt, endedAt: Date.now(), predicate, phases, clocks: { before, after },
        network: network.rows, pending: [...pending].map(([requestId, path]) => ({ requestId, path })), scripts: scripts.rows, timeline: timeline.rows,
        shortEventAggregates: [...timeline.buckets.values()], timelineSummary: { eligibleEvents: timeline.eligibleEvents, detailEvents: timeline.rows.length, aggregateEvents: [...timeline.buckets.values()].reduce((sum, bucket) => sum + bucket.count, 0), retainedEntries: timeline.rows.length + timeline.buckets.size, bucketWidthMicroseconds: 50000, aggregateBelowMicroseconds: 1000, inclusiveDurationsMayOverlap: true },
        documents: documents.rows, contexts: contexts.rows, frames: frames.rows, cpu, dropped, errors, lateEffects,
        coverage: { epochs, rendererThreads, cpuEpochs, unattributedOrAmbiguousSamples: sampleCounts.get(null) ?? 0, cpuEpochContinuity: cpuEpochs.every(epoch => epoch.attributedSamples > 0) ? 'ATTRIBUTED_SAMPLES_EACH_EPOCH' : 'PARTIAL_OR_UNATTRIBUTED', observerOverhead: 'Observed DOM callback costs only; total CDP/CPU sampling perturbation is not known.' },
        status: errors.length || Object.values(dropped).some(Boolean) || cpu?.truncated || !complete ? 'INCOMPLETE' : 'CAPTURED_BOUNDED',
        limits: { eventRows: 20000, documentRows: 1000, cpuSamples: 60000 },
        scope: 'Actual instrumented Chrome experiment with observer overhead. Selected generic sub1ms events are quantified in50ms buckets; individual tiny-event callsites are not retained. Script/evaluation/slow-event detail and CPU samples remain separate. scriptParsed is not import resolution, DOM heading is not an internal React commit, sampling/epoch attribution does not establish complete CPU scheduling or historical causation.', historicalUniqueRoot: 'UNKNOWN' }
    },
  }
}
