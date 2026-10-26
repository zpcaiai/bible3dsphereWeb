import fs from 'node:fs'
import os from 'node:os'
import { chromium, expect } from '@playwright/test'
import crypto from 'node:crypto'
import { startCausalWitness } from './graph-entry-witness.mjs'
const root=(process.env.GRAPH_ENTRY_PROFILE_DIR || os.tmpdir()+'/graph-entry-profile-'+process.pid+'-'+Date.now()).replace(/\/$/, '')+'/'
const baseURL=process.env.GRAPH_ENTRY_PROFILE_BASE_URL || 'https://holiness.uk'
const fault=process.env.GRAPH_ENTRY_PROFILE_FAULT || 'none'
if(!['none','chunk-cache-hang','catalogue-failure','portrait-failure'].includes(fault))throw Error('Unsupported controlled fault')
const portraits=JSON.parse(fs.readFileSync(new URL('../src/features/spiritual-planet/digital-human/portraitCatalog.json',import.meta.url),'utf8')).portraits
fs.mkdirSync(root,{recursive:false})
const out={scope:'Actual mobile graph entry with original5s assertion and real backend; optional explicitly labelled network/cache fault injection, never fabricated API responses. No turn requests deliberately invoked; no reconstruction of historical failures.',fault,sourceSHA:process.env.GITHUB_SHA||null,baseURL,gate:[],results:[],product:'NOT_CERTIFIED'}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
function free(){const s=fs.statfsSync(process.cwd());return s.bavail*s.bsize}
async function admission(){
 for(let i=0;i<2;i++){
  if(i)await pause(10000)
  const at=performance.now();await pause(2000)
  const row={at:Date.now(),load:os.loadavg(),cpus:os.cpus().length,freeBytes:free(),twoSecondSampleActualSeconds:(performance.now()-at)/1000}
  row.loadLimit=Math.min(32,4*row.cpus)
  row.admitted=row.load[0]<=row.loadLimit&&row.freeBytes>=2*1024**3&&row.twoSecondSampleActualSeconds<=3
  out.gate.push(row);process.stdout.write('ACTUAL_PROFILE_ADMISSION '+JSON.stringify(row)+'\n')
  if(!row.admitted)return false
 }
 return true
}
let browser
try{
 if(!await admission()){out.status='NOT_RUN_RESOURCE_GATE';process.exitCode=2}
 else{
  browser=await chromium.launch({channel:'chrome',headless:true})
  out.browserVersion=browser.version()
  for(const width of [390,320]){
   const context=await browser.newContext({baseURL,viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:fault==='none'?'allow':'block'})
   const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000)
   const r={width,started:Date.now(),phase:'setup',originalAssertionMs:5000,assetEvents:[],parentSamples:[],onboardingEvents:[],observedTurnPOSTs:0}
   let causalWitness
   let witnessStop
   const stopWitness=()=>{
    if(causalWitness&&!witnessStop)witnessStop=causalWitness.finish({name:'graph-heading-visible',assertionMs:5000,startAt:r.assertStartAt??null,endAt:r.assertEndAt??null,outcome:r.originalFiveSecondAssertion,catalogueRetry:r.catalogueRetryEvidence??null}).then(value=>({value}),error=>({errorName:error.name}))
   }
   const pendingAssets=new Map()
   const imageResponses=new Map()
   page.on('response',response=>{
    const path=new URL(response.url()).pathname
    if(path.startsWith('/assets/digital-human/portraits-v1/')&&path.endsWith('.webp')&&response.request().resourceType()==='image')imageResponses.set(path,(async()=>{
     try{const bytes=await response.body();return {body:bytes,receipt:{path,status:response.status(),contentType:response.headers()['content-type'],bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),receivedAt:Date.now()}}}
     catch(error){return {receipt:{path,errorType:error.name}}}
    })())
   })
   page.on('request',request=>{
    const path=new URL(request.url()).pathname
    if(path.startsWith('/assets/')){pendingAssets.set(request,{path,at:Date.now()});r.assetEvents.push({path,at:Date.now(),event:'request'})}
   })
   page.on('response',response=>{const path=new URL(response.url()).pathname;if(path.startsWith('/assets/'))r.assetEvents.push({path,at:Date.now(),event:'response',status:response.status()})})
   page.on('requestfinished',request=>pendingAssets.delete(request))
   page.on('requestfailed',request=>pendingAssets.delete(request))
   let last=performance.now()
   const timer=setInterval(()=>{const now=performance.now();r.parentSamples.push({at:Date.now(),actualGapMs:now-last,load:os.loadavg()});last=now},2000)
   timer.unref()
   const caseDeadlineAt=Date.now()+120000
   const caseDeadline=setTimeout(()=>{r.caseTimedOutAt=Date.now();context.close().catch(()=>{})},120000)
   caseDeadline.unref()
   page.on('request',request=>{if(request.method()==='POST'&&new URL(request.url()).pathname==='/api/v1/digital-human/turns')r.observedTurnPOSTs++})
   page.on('requestfinished',request=>{if(new URL(request.url()).pathname.startsWith('/assets/'))r.assetEvents.push({path:new URL(request.url()).pathname,at:Date.now(),timing:request.timing()})})
   page.on('requestfailed',request=>{if(new URL(request.url()).pathname.startsWith('/assets/'))r.assetEvents.push({path:new URL(request.url()).pathname,at:Date.now(),error:request.failure()?.errorText})})
   await page.addInitScript(()=>{
    localStorage.setItem('app-lang','zh')
    const p=window.__graphEntryProfile={longTasks:[],eventLoopGaps:[]}
    let last=performance.now()
    setInterval(()=>{const now=performance.now();if(now-last>=150&&p.eventLoopGaps.length<1000)p.eventLoopGaps.push({start:last,end:now,gap:now-last});last=now},100)
    try{new PerformanceObserver(list=>{for(const task of list.getEntries())if(p.longTasks.length<1000)p.longTasks.push({start:task.startTime,duration:task.duration,name:task.name,attribution:task.attribution?.map(x=>({name:x.name,type:x.entryType,containerType:x.containerType,containerPath:x.containerSrc?new URL(x.containerSrc,location.href).pathname:''}))})}).observe({type:'longtask',buffered:true})}
    catch{p.longTaskObserver='UNAVAILABLE'}
   })
   try{
    await page.addLocatorHandler(page.getByRole('button',{name:'暂时跳过',exact:true}),async button=>{
     r.onboardingEvents.push({stage:'start',at:Date.now()})
     await button.click()
     r.onboardingEvents.push({stage:'end',at:Date.now()})
    })
    r.phase='login';await page.goto('/')
    await page.getByRole('button',{name:'🔑 登录',exact:true}).click()
    const account=await page.getByLabel('默认登录账号',{exact:true}).locator('code').allTextContents();expect(account).toHaveLength(2)
    await page.getByLabel('邮箱',{exact:true}).fill(account[0]);await page.getByLabel('密码',{exact:true}).fill(account[1])
    const pending=page.waitForResponse(response=>response.url().endsWith('/api/auth/email/login'))
    await page.getByRole('button',{name:'🔑 登录',exact:true}).click()
    r.loginHTTP=(await pending).status();expect(r.loginHTTP).toBe(200)
    await expect(page.getByRole('button',{name:'退出登录',exact:true})).toBeVisible({timeout:5000})
    r.phase='witness_start';causalWitness=await startCausalWitness(page,{deadlineAt:caseDeadlineAt})
    if(fault!=='none'){
     r.injectedFailures=0;r.recoveryNavigations=0;r.cacheKeysCalls=0;r.routeEvents=[]
     page.on('framenavigated',frame=>{if(frame===page.mainFrame())r.recoveryNavigations++})
     const pattern=fault==='portrait-failure'?'**/assets/digital-human/portraits-v1/*.webp':fault==='chunk-cache-hang'?'**/assets/MirrorPage-*.js':'**/assets/mirrorData-*.js'
     await page.route(pattern,async route=>{
      r.routeEvents.push({stage:'entered',at:Date.now(),path:new URL(route.request().url()).pathname})
      if(!r.injectedFailures){r.injectedFailures++;r.failedAssetPath=new URL(route.request().url()).pathname;await route.abort('failed');r.routeEvents.push({stage:'aborted',at:Date.now()})}
      else {await route.continue();r.routeEvents.push({stage:'continued',at:Date.now()})}
     })
     if(fault==='chunk-cache-hang'){
      await page.exposeFunction('__graphCacheAttempt',()=>{r.cacheKeysCalls++})
      await page.evaluate(()=>Object.defineProperty(window,'caches',{configurable:true,value:{keys:()=>{
       window.__graphCacheAttempt();return new Promise(()=>{})
      }}}))
     }
    }
    r.phase='tap';r.beforeTapAt=Date.now();r.browserBeforeTap=await page.evaluate(()=>performance.now())
    causalWitness.mark('before-tap')
    r.homeCanvasesBefore=await page.locator('.mobile-sphere-stage canvas').count()
    const graphReply=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/characters/knowledge-graph'&&response.request().method()==='GET').catch(error=>({probeErrorName:error.name}))
    await page.getByRole('button',{name:'人物图谱',exact:false}).tap()
    r.graphTapCompleted=true
    causalWitness.mark('tap-complete')
    r.phase='graph_assert';r.predicate='graph-heading-visible';r.assertStartAt=Date.now()
    causalWitness.mark('heading-expect-start')
    await expect(page.getByRole('heading',{name:'关系图谱',exact:true})).toBeVisible({timeout:5000})
    r.assertEndAt=Date.now();r.originalFiveSecondAssertion='PASS'
    causalWitness.mark('heading-expect-pass')
    r.phase='graph_data'
    const response=await graphReply
    if(response.probeErrorName)throw Error('Graph API response unavailable: '+response.probeErrorName)
    r.graphHTTP=response.status();expect(r.graphHTTP).toBe(200)
    const bytes=await response.body(),graph=JSON.parse(bytes.toString('utf8'))
    r.graphDataSHA256=crypto.createHash('sha256').update(bytes).digest('hex')
    expect(graph.success).toBe(true);r.graphNodeCount=graph.data.nodes.length;expect(r.graphNodeCount).toBeGreaterThan(0)
    r.predicate='graph-circle-count-equals-api-nodes';r.renderAssertStartAt=Date.now()
    const graphView=page.getByRole('heading',{name:'关系图谱',exact:true}).locator('../..')
    await expect.poll(()=>graphView.locator('svg circle').count(),{timeout:5000}).toBe(r.graphNodeCount)
    r.renderAssertEndAt=Date.now()
    r.graphDataStatus='PASS'
    r.phase='portrait_assert';r.predicate='graph-artistic-portrait-actual-image'
    if(fault==='portrait-failure'){
     const status=page.getByRole('status',{name:'图谱艺术头像状态',exact:true})
     await expect(status).toBeVisible({timeout:5000})
     expect(r.failedAssetPath).toMatch(/\/portraits-v1\/.*\.webp$/)
     await expect(graphView.locator(`svg image[href="${r.failedAssetPath}"]`)).toHaveCount(0,{timeout:5000})
     await expect(graphView.locator('svg circle')).toHaveCount(r.graphNodeCount,{timeout:5000})
     await page.screenshot({path:root+'portrait-failure-'+width+'.png'})
     r.portraitRetryAt=Date.now()
     await status.getByRole('button',{name:'重试头像',exact:true}).tap()
     await expect(status).toHaveCount(0,{timeout:5000})
     await expect(graphView.locator(`svg image[href="${r.failedAssetPath}"]`)).toHaveCount(1,{timeout:5000})
    }
    await expect.poll(()=>graphView.locator('svg image[data-portrait-character-id]').count(),{timeout:5000}).toBeGreaterThan(0)
    const image=fault==='portrait-failure'?graphView.locator(`svg image[href="${r.failedAssetPath}"]`):graphView.locator('svg image[data-portrait-character-id]').first()
    const identity=await image.evaluate(node=>({characterId:node.dataset.portraitCharacterId,path:node.getAttribute('href'),reviewState:node.dataset.reviewState}))
    const expected=portraits[identity.characterId];expect(expected).toBeTruthy();expect(identity.path).toBe(expected.url);expect(identity.reviewState).toBe('PREVIEW_ONLY')
    await expect.poll(()=>imageResponses.has(identity.path),{timeout:5000}).toBe(true)
    const loaded=await imageResponses.get(identity.path),http=loaded.receipt
    if(loaded.body)fs.writeFileSync(root+'portrait-loaded-'+width+'.webp',loaded.body)
    r.portrait={...identity,http}
    expect(http.errorType).toBeUndefined();expect(http.status).toBe(200);expect(http.contentType).toContain('image/webp');expect(http.sha256).toBe(expected.sha256);expect(http.bytes).toBe(expected.bytes)
    r.portrait.decode=await page.evaluate(async path=>{const img=new Image();img.src=path;await img.decode();return {width:img.naturalWidth,height:img.naturalHeight,complete:img.complete}},identity.path)
    expect(r.portrait.decode).toEqual({width:384,height:384,complete:true})
    r.portrait.status='PASS'
    if(fault==='portrait-failure')r.portraitRetry='PASS'
    r.phase='mobile_chrome';r.predicate='mirror-without-floating-guardian'
    r.mobileChromeBefore={guardianCount:await page.locator('.guardian-widget-root').count(),navigationVisible:await page.getByRole('navigation',{name:'主要导航',exact:true}).isVisible()}
    await expect(page.locator('.guardian-widget-root')).toHaveCount(0,{timeout:5000})
    await expect(page.getByRole('navigation',{name:'主要导航',exact:true})).toBeVisible({timeout:5000})
    r.mobileChrome={guardianCount:await page.locator('.guardian-widget-root').count(),navigationVisible:await page.getByRole('navigation',{name:'主要导航',exact:true}).isVisible(),status:'PASS'}
    await page.screenshot({path:root+'graph-rendered-'+width+'.png'})
    await expect(page.locator('.mobile-sphere-stage canvas')).toHaveCount(0,{timeout:5000})
    r.homeCanvasesAfter=await page.locator('.mobile-sphere-stage canvas').count()
    if(fault!=='none')expect(r.injectedFailures).toBe(1)
    if(fault==='chunk-cache-hang'){
     expect(r.cacheKeysCalls).toBeGreaterThan(0);expect(r.recoveryNavigations).toBe(1)
    }
    if(fault==='catalogue-failure'){
     r.phase='catalogue_retry';r.predicate='catalogue-retry-alert-and-return'
     await expect(page.getByRole('alert')).toBeVisible({timeout:5000})
     r.catalogueRetryEvidence={startAt:Date.now(),originalAssertionMs:5000,outcome:'PENDING'}
     causalWitness.mark('catalogue-retry-start')
     await page.getByRole('button',{name:'重试',exact:true}).tap()
     await expect(page.getByRole('alert')).toHaveCount(0,{timeout:5000})
     r.catalogueRetryEvidence.headingAssertStartAt=Date.now()
     await expect(page.getByRole('heading',{name:'关系图谱',exact:true})).toBeVisible({timeout:5000})
     r.catalogueRetryEvidence.endAt=Date.now();r.catalogueRetryEvidence.outcome='PASS'
     causalWitness.mark('catalogue-retry-pass')
     await page.getByRole('button',{name:'返回',exact:true}).tap()
     await expect(page.getByRole('textbox',{name:'搜索人物',exact:true})).toBeVisible({timeout:5000})
     r.catalogueRetry='PASS'
    }
    if(fault==='none'){
     r.phase='home_return'
     const layoutRequest=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/layout')
     layoutRequest.catch(()=>{})
     await page.getByRole('navigation',{name:'主要导航',exact:true}).getByRole('button',{name:'星球',exact:true}).tap()
     const layoutResponse=await layoutRequest
     r.homeLayoutHTTP=layoutResponse.status();expect(r.homeLayoutHTTP).toBe(200)
     await expect(page.locator('.mobile-sphere-stage canvas')).toHaveCount(1,{timeout:5000})
     await expect(page.getByRole('button',{name:'打开属灵守护者（按住可拖动）',exact:true})).toBeVisible({timeout:5000})
     r.homeGuardianRestored='PASS'
     r.homeRequestsResumed='PASS'
    }
   }catch(error){
    r.failureAt=Date.now();r.originalFiveSecondAssertion=r.originalFiveSecondAssertion==='PASS'?'PASS':(r.phase==='graph_assert'?'FAIL':'NOT_RUN');r.errorName=error.name
    if(r.phase==='graph_assert')r.assertEndAt=r.failureAt
    if(r.phase==='graph_assert')causalWitness?.mark('heading-expect-fail')
    if(r.catalogueRetryEvidence?.outcome==='PENDING'){
     r.catalogueRetryEvidence.endAt=r.failureAt;r.catalogueRetryEvidence.outcome='FAIL'
     causalWitness?.mark('catalogue-retry-fail')
    }
    stopWitness()
    r.error=r.phase==='login'?'Login stage failed; auth inputs intentionally not logged':error.message
    if(r.phase==='graph_data')r.graphDataStatus='FAIL'
    process.exitCode=1
   }finally{
    r.captureStartAt=Date.now()
    const authPanelVisible=await page.getByLabel('默认登录账号',{exact:true}).isVisible().catch(()=>true)
    if(r.loginHTTP===200&&!authPanelVisible)try{
     r.browserSnapshot=await page.evaluate(()=>{
      const box=e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,role:e.getAttribute('role'),x:r.x,y:r.y,width:r.width,height:r.height}}
      const loads=[...document.querySelectorAll('span,p,div')].filter(e=>e.childElementCount===0&&e.textContent.trim()==='加载中…').slice(0,8).map(e=>({self:box(e),parent:e.parentElement?box(e.parentElement):null,grandparent:e.parentElement?.parentElement?box(e.parentElement.parentElement):null}))
      return {capturedAt:performance.now(),timeOrigin:performance.timeOrigin,readyState:document.readyState,nav:{panel:sessionStorage.getItem('nav-activePanel'),mirror:sessionStorage.getItem('nav-mirror'),restore:sessionStorage.getItem('lazy-chunk-mirror-restore')},probe:window.__graphEntryProfile,loadingNodes:loads,circleCounts:[...document.querySelectorAll('svg')].map(e=>e.querySelectorAll('circle').length),statuses:[...document.querySelectorAll('[role="status"]')].map(box),resources:performance.getEntriesByType('resource').filter(x=>new URL(x.name).pathname.startsWith('/assets/')).map(x=>({path:new URL(x.name).pathname,start:x.startTime,responseStart:x.responseStart,responseEnd:x.responseEnd,duration:x.duration,transferSize:x.transferSize}))}
     })
     await page.screenshot({path:root+'entry-'+width+'-'+r.originalFiveSecondAssertion+'.png'})
    }catch(error){r.captureErrorName=error.name;process.exitCode=1}
    else r.captureSkipped='Before completed authenticated graph tap; no DOM or PNG captured to avoid auth values'
    r.pendingAssetsAtCapture=[...pendingAssets.values()]
    if(causalWitness){
     try{
      stopWitness()
      const stopped=await witnessStop
      if(stopped.errorName)throw Error('Causal witness capture failed: '+stopped.errorName)
      const value=stopped.value
      const file='causal-witness-'+width+'.json',bytes=Buffer.from(JSON.stringify(value,null,2))
      fs.writeFileSync(root+file,bytes)
      r.causalWitness={file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),status:value.status}
      expect(value.status).toBe('CAPTURED_BOUNDED')
     }catch(error){r.witnessErrorName=error.name;process.exitCode=1}
    }else r.causalWitness={status:'NOT_RUN',reason:'Authenticated witness startup was not completed'}
    if(fault!=='none'&&r.originalFiveSecondAssertion==='FAIL'){
     r.afterFailureObservations=[]
     for(let i=0;i<3;i++){
      await pause(2000)
      r.afterFailureObservations.push({at:Date.now(),headingVisible:await page.getByRole('heading',{name:'关系图谱',exact:true}).isVisible().catch(()=>false),pendingAssets:[...pendingAssets.values()]})
     }
    }
    r.captureEndAt=Date.now();clearInterval(timer);clearTimeout(caseDeadline);out.results.push(r);await context.close()
   }
  }
  out.status=process.exitCode?'ENTRY_OR_CAPTURE_FAILED':'ENTRY_PASSED_ROOT_UNRESOLVED'
 }
}finally{
 if(browser)await browser.close()
 fs.writeFileSync(root+'profile-data.json',JSON.stringify(out,null,2))
 process.stdout.write('ACTUAL_ENTRY_PROFILE '+JSON.stringify({status:out.status,gate:out.gate,results:out.results.map(r=>({width:r.width,assertion:r.originalFiveSecondAssertion,observedTurnPOSTs:r.observedTurnPOSTs,phase:r.phase,assetEvents:r.assetEvents.length,graphHTTP:r.graphHTTP,graphNodeCount:r.graphNodeCount,graphDataStatus:r.graphDataStatus}))})+'\n')
}
