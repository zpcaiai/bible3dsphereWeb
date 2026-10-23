import fs from 'node:fs'
import os from 'node:os'
import { chromium, expect } from '@playwright/test'
import crypto from 'node:crypto'
const root=(process.env.GRAPH_ENTRY_PROFILE_DIR || os.tmpdir()+'/graph-entry-profile-'+process.pid+'-'+Date.now()).replace(/\/$/, '')+'/'
const baseURL=process.env.GRAPH_ENTRY_PROFILE_BASE_URL || 'https://holiness.uk'
fs.mkdirSync(root,{recursive:false})
const out={scope:'Actual cold mobile graph entry only; original5s assertion; no turn requests deliberately invoked; does not reconstruct prior failures or certify root cause.',sourceSHA:process.env.GITHUB_SHA||null,baseURL,gate:[],results:[],product:'NOT_CERTIFIED'}
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
   const context=await browser.newContext({baseURL,viewport:{width,height:844},isMobile:true,hasTouch:true})
   const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000)
   const r={width,started:Date.now(),phase:'setup',originalAssertionMs:5000,assetEvents:[],parentSamples:[],observedTurnPOSTs:0}
   let last=performance.now()
   const timer=setInterval(()=>{const now=performance.now();r.parentSamples.push({at:Date.now(),actualGapMs:now-last,load:os.loadavg()});last=now},2000)
   timer.unref()
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
    await page.addLocatorHandler(page.getByRole('button',{name:'暂时跳过',exact:true}),button=>button.click())
    r.phase='login';await page.goto('/')
    await page.getByRole('button',{name:'🔑 登录',exact:true}).click()
    const account=await page.getByLabel('默认登录账号',{exact:true}).locator('code').allTextContents();expect(account).toHaveLength(2)
    await page.getByLabel('邮箱',{exact:true}).fill(account[0]);await page.getByLabel('密码',{exact:true}).fill(account[1])
    const pending=page.waitForResponse(response=>response.url().endsWith('/api/auth/email/login'))
    await page.getByRole('button',{name:'🔑 登录',exact:true}).click()
    r.loginHTTP=(await pending).status();expect(r.loginHTTP).toBe(200)
    await expect(page.getByRole('button',{name:'退出登录',exact:true})).toBeVisible({timeout:5000})
    r.phase='tap';r.beforeTapAt=Date.now();r.browserBeforeTap=await page.evaluate(()=>performance.now())
    r.homeCanvasesBefore=await page.locator('.mobile-sphere-stage canvas').count()
    const graphReply=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/characters/knowledge-graph'&&response.request().method()==='GET').catch(error=>({probeErrorName:error.name}))
    await page.getByRole('button',{name:'人物图谱',exact:false}).tap()
    r.graphTapCompleted=true
    r.phase='graph_assert';r.assertStartAt=Date.now()
    await expect(page.getByRole('heading',{name:'关系图谱',exact:true})).toBeVisible({timeout:5000})
    r.assertEndAt=Date.now();r.originalFiveSecondAssertion='PASS'
    r.phase='graph_data'
    const response=await graphReply
    if(response.probeErrorName)throw Error('Graph API response unavailable: '+response.probeErrorName)
    r.graphHTTP=response.status();expect(r.graphHTTP).toBe(200)
    const bytes=await response.body(),graph=JSON.parse(bytes.toString('utf8'))
    r.graphDataSHA256=crypto.createHash('sha256').update(bytes).digest('hex')
    expect(graph.success).toBe(true);r.graphNodeCount=graph.data.nodes.length;expect(r.graphNodeCount).toBeGreaterThan(0)
    await expect.poll(()=>page.getByRole('heading',{name:'关系图谱',exact:true}).locator('../..').locator('svg circle').count(),{timeout:5000}).toBe(r.graphNodeCount)
    r.graphDataStatus='PASS'
    await expect(page.locator('.mobile-sphere-stage canvas')).toHaveCount(0,{timeout:5000})
    r.homeCanvasesAfter=await page.locator('.mobile-sphere-stage canvas').count()
   }catch(error){
    r.failureAt=Date.now();r.originalFiveSecondAssertion=r.originalFiveSecondAssertion==='PASS'?'PASS':(r.phase==='graph_assert'?'FAIL':'NOT_RUN');r.errorName=error.name
    if(r.phase==='graph_assert')r.assertEndAt=r.failureAt
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
      return {capturedAt:performance.now(),probe:window.__graphEntryProfile,loadingNodes:loads,circleCounts:[...document.querySelectorAll('svg')].map(e=>e.querySelectorAll('circle').length),statuses:[...document.querySelectorAll('[role="status"]')].map(box),resources:performance.getEntriesByType('resource').filter(x=>new URL(x.name).pathname.startsWith('/assets/')).map(x=>({path:new URL(x.name).pathname,start:x.startTime,responseStart:x.responseStart,responseEnd:x.responseEnd,duration:x.duration,transferSize:x.transferSize}))}
     })
     await page.screenshot({path:root+'entry-'+width+'-'+r.originalFiveSecondAssertion+'.png'})
    }catch(error){r.captureErrorName=error.name;process.exitCode=1}
    else r.captureSkipped='Before completed authenticated graph tap; no DOM or PNG captured to avoid auth values'
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
