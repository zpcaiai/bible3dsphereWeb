import fs from 'node:fs'
import os from 'node:os'
import https from 'node:https'
import {createRequire} from 'node:module'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {createServer} from 'vite'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
const w=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),root=process.env.HOME_REQUEST_CANCEL_DIR||os.tmpdir()+'/home-request-cancel-'+process.pid+'-'+Date.now()
assert.ok(root);fs.mkdirSync(root,{recursive:false})
const require=createRequire(w+'/package.json'),{HttpsProxyAgent}=require('https-proxy-agent')
const agent=process.env.HOME_REQUEST_UPSTREAM_PROXY?new HttpsProxyAgent(process.env.HOME_REQUEST_UPSTREAM_PROXY):new https.Agent({keepAlive:true}),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const out={scope:'Actual source API methods in real Chrome, real holiness.uk GET responses over verified TLS. Task-local HTTP transport holds actual upstream headers/body for2000ms; never creates backend response/status/body. This is an auxiliary cancellation control, not online graph acceptance or unique root proof.',executed:true,pid:process.pid,command:process.argv,sourceSHA:process.env.GITHUB_SHA||null,upstreamRouting:process.env.HOME_REQUEST_UPSTREAM_PROXY?'EXPLICIT_TASK_PROXY':'DIRECT_NODE_TRANSPORT',appSHA256:crypto.createHash('sha256').update(fs.readFileSync(w+'/src/App.jsx')).digest('hex'),apiSHA256:crypto.createHash('sha256').update(fs.readFileSync(w+'/src/api.js')).digest('hex'),gate:[],results:[],historicalUniqueRoot:'UNKNOWN/BLOCKED_INCOMPLETE'}
let server,browser,active
try{
 for(let i=0;i<2;i++){
  if(i)await pause(10000)
  const at=performance.now();await pause(2000);const s=fs.statfsSync(w),g={load:os.loadavg(),cpus:os.cpus().length,freeBytes:s.bavail*s.bsize,sampleSeconds:(performance.now()-at)/1000}
  g.admitted=g.load[0]<=Math.min(32,4*g.cpus)&&g.freeBytes>=2*1024**3&&g.sampleSeconds<=3;out.gate.push(g)
  if(!g.admitted){out.status='NOT_RUN_ORIGINAL_RESOURCE_GATE';process.exitCode=2;break}
 }
 if(!process.exitCode){
  server=await createServer({root:w,configFile:w+'/vite.config.js',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'scoped-real-transport-cancellation-probe',configureServer(vite){
   vite.middlewares.use((req,res,next)=>{
    const path=new URL(req.url,'http://localhost').pathname
    if(path==='/__cancel_probe'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html><body>Native API cancellation control</body></html>');return}
    if(!active||req.method!=='GET'||path!==active.path){next();return}
    const row=active.row;row.proxyRequestAt=Date.now();let forwardTimer
    const upstream=https.request('https://holiness.uk'+req.url,{method:'GET',agent,rejectUnauthorized:true},reply=>{
     row.upstreamStatus=reply.statusCode;row.upstreamHeadersAt=Date.now();reply.pause();active.headersReady()
     forwardTimer=setTimeout(()=>{if(!res.destroyed){row.forwardedAt=Date.now();res.writeHead(reply.statusCode,reply.headers);reply.pipe(res)}},2000)
     reply.on('error',()=>{if(!res.destroyed)res.destroy()})
    })
    const connectTimer=setTimeout(()=>upstream.destroy(Error('CONNECT_DEADLINE')),5000),totalTimer=setTimeout(()=>upstream.destroy(Error('TOTAL_DEADLINE')),10000)
    upstream.once('socket',socket=>{if(socket.encrypted&&!socket.connecting)clearTimeout(connectTimer);else socket.once('secureConnect',()=>clearTimeout(connectTimer))})
    upstream.on('error',error=>{if(!row.clientClosedAt){row.upstreamErrorName=error.name;active.headersReady()}if(!res.destroyed)res.destroy()})
    upstream.on('close',()=>{clearTimeout(connectTimer);clearTimeout(totalTimer)})
    res.on('close',()=>{row.clientClosedAt=Date.now();clearTimeout(forwardTimer);upstream.destroy()})
    upstream.end()
   })
  }}]})
  await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port
  browser=await chromium.launch({channel:'chrome',headless:true});out.browserVersion=browser.version()
  for(const control of [{name:'fetchLayout',path:'/api/layout',args:'[{signal:window.__abort.signal}]'},{name:'fetchHistory',path:'/api/history',args:'[{signal:window.__abort.signal}]'},{name:'fetchCommunityHeatmap',path:'/api/community/emotion-heatmap',args:'[24,8,{signal:window.__abort.signal}]'}]){
   const row={control:control.name,startedAt:Date.now()},context=await browser.newContext(),page=await context.newPage();const deadline=setTimeout(()=>context.close().catch(()=>{}),120000)
   let ready;const headers=new Promise(resolve=>ready=resolve);active={...control,row,headersReady:ready}
   try{
    await page.goto(origin+'/__cancel_probe',{timeout:30000})
    await page.evaluate(async()=>{window.__api=await import('/src/api.js')})
    await page.evaluate(({name})=>{window.__abort=new AbortController();const opts={signal:window.__abort.signal},args=name==='fetchCommunityHeatmap'?[24,8,opts]:[opts];window.__pending=window.__api[name](...args).then(()=>({outcome:'RESOLVED'}),e=>({outcome:'REJECTED',name:e.name}))},control)
    let headerTimer
    try{await Promise.race([headers,new Promise((_,reject)=>{headerTimer=setTimeout(()=>reject(Error('Real upstream did not provide headers within original action limit')),30000)})])}
    finally{clearTimeout(headerTimer)}
    assert.equal(row.upstreamStatus,200,'Actual upstream endpoint must respond200 before using this control')
    row.abortAt=Date.now();await page.evaluate(()=>window.__abort.abort())
    row.clientResult=await page.evaluate(()=>window.__pending)
    assert.deepEqual(row.clientResult,{outcome:'REJECTED',name:'AbortError'},'Original API method must propagate caller abort rather than finish or start static fallback')
    await pause(100);assert.ok(row.clientClosedAt&&!row.forwardedAt,'Caller abort must close the actual held HTTP response before it is forwarded')
    row.status='PASS_NATIVE_ABORT_TRANSPORT_ONLY'
   }catch(error){row.status=row.upstreamStatus===200?'FAIL_NATIVE_ABORT_TRANSPORT_ONLY':'NOT_RUN_REAL_UPSTREAM_UNAVAILABLE';row.errorName=error.name;row.error=error.message;process.exitCode=row.upstreamStatus===200?1:2}
   finally{clearTimeout(deadline);row.endedAt=Date.now();out.results.push(row);await context.close();active=null}
  }
  out.status=process.exitCode?'ABORT_CONTROL_NOT_ACCEPTED':'PASS_NATIVE_ABORT_TRANSPORT_ONLY'
 }
}catch(error){
 process.exitCode=process.exitCode||1;out.status='NATIVE_CONTROL_SETUP_FAILED';out.errorName=error.name
}finally{
 if(browser)await browser.close();if(server)await server.close();agent.destroy();out.exit_code=process.exitCode||0
 fs.writeFileSync(root+'/control-data.json',JSON.stringify(out,null,2));process.stdout.write(JSON.stringify(out)+'\n')
}
