# 前端全量审计报告 — bible3dsphereWeb（2026-07）

> 范围:Vite + React 18 PWA(507 个 JS/JSX / ~126k LOC)。Three.js 星球、zustand、react-query、mapbox/maplibre/deck.gl、LiveKit 语音、jspdf/html2canvas。
> 方法:4 路并行只读深审(安全 / React 正确性与资源泄漏 / 性能与 PWA / 配置与可访问性)。仅为审计,**尚未改动代码**——你确认后再修。

**先说优点(确实做得好,别动):** REST 全走 `Authorization: Bearer` 头(非 query);API base 在非本地一律解析为同源相对 `/api`(攻击者无法运行时重定向);**没有 raw-HTML markdown 渲染器**,LLM/经文输出经 React 自动转义 + 导出路径统一 `escapeHtml`(经典 LLM-XSS 向量是关闭的);资源回收纪律优秀(LiveKit room / mapbox map / TTS 音频 / 事件监听基本都在卸载时清理);路由已代码分割(38 个 lazy chunk);手写 Service Worker 质量不错;生产关闭 sourcemap、剥离 console。问题集中在**凭证生命周期、部署安全头、可访问性、以及首屏包体**。

---

## 🔴 一、必须最先修

1. **`public/godot/.env.local` 把密钥打进生产包** — 里面有 `VERCEL_OIDC_TOKEN`(JWT)。Vite 原样拷贝 `public/` 到构建产物,已确认出现在 `dist/godot/.env.local`,即**可从 `https://holiness.uk/godot/.env.local` 下载**。虽然它被 gitignore(所以不在 git 里),但部署产物仍暴露。当前 token 已过期,但只要下次带新 token 重建就会发布一个有效凭证。
   **修复**:删掉 `public/godot/.env.local`;`public/**` 下永不放 `.env*`;`.gitignore` + CI 加 `public/**/.env*` 检查;轮换该 token。

2. **首屏无谓加载整个 three.js** — `src/App.jsx:18` 静态 import `EmotionSphereScene` → 把 `three`+fiber+drei(**317KB gzip / 1.1MB raw**)modulepreload 进首屏,即使用户从不看星球。首屏 JS ~450KB gzip 主要就是它。
   **修复**:`lazyWithRetry(() => import('./EmotionSphereScene'))` + `<Suspense>`,和其余 37 条路由同款。**全站单点最大性能收益。**

---

## 🟠 二、安全 / 凭证

- **会话 token 存 localStorage**(`src/auth.js:11-15`):长期 bearer 凭证,任何 XSS = 账号接管,且永久留存。建议后端下发 httpOnly+Secure+SameSite cookie;不行则仅存内存、刷新重认证。
- **WS token 走 `?token=` query**(`src/realtime/realtimeApi.js:32`):`/api/ws/rtc` 把完整 token 拼进 URL,会进反代/APM/错误监控日志。改用 `Sec-WebSocket-Protocol` 子协议或一次性短时 ticket。
- **无任何安全响应头**(`vercel.json` 与 `nginx.conf` 都没有):缺 CSP / HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy。页面可被 clickjack,localStorage token 无第二道防线。两条部署路径都要补(nginx 用 `add_header ... always`)。
- **`credentials:'include'` + Bearer 并存**(mission-os 的 `features/audit/outbox/incidents/organizations.js` + `missionBridgeApi.js`):若后端认 cookie,这些改状态的 POST 存在 **CSRF** 面;若后端只认 Bearer,则 cookie 是多余、应删。
- **微信/邮箱 OAuth 把 token 放 URL query**(`src/auth.js:184-196`):虽 `history.replaceState` 清理,但已暴露给访问日志/Referer/历史。让后端改用 POST body 或 httpOnly cookie 回传。
- **敏感数据进 console**(`src/api.js:191/174/787` 等):情绪/心理健康标签、祷告/日记长度被 `console.log`,会流入任何错误监控/会话回放。用 `import.meta.env.DEV` 门控,危机字段永不打印。
- **nginx 以 root 运行**、无 gzip:Dockerfile 无 `USER`;补安全头 + gzip/brotli + 非特权运行。

## 🟠 三、可访问性(危机/心理健康用户,权重高)

- **~131 处 `onClick` 挂在 `<div>/<span>/<li>`**,仅 15 个文件有键盘处理:键盘用户和读屏用户无法触达核心流程。改 `<button>`,或加 `role="button"`+`tabIndex={0}`+`onKeyDown`。
- **~41 个 modal/dialog** 只有 2 个用 `role="dialog"`/`aria-modal`、5 个做 `.focus()`:无焦点陷阱/焦点返回。做一个统一的 modal 原语(role+aria-modal+初始焦点+焦点陷阱+Esc 关闭)。
- **图片 alt 缺失**(10 个 `<img>` 仅 5 个有 alt);**表单缺关联标签**(251 个 input 仅 14 个 `htmlFor`,多为 placeholder-only)。
- **动画重但几乎不尊重 `prefers-reduced-motion`**(全仓仅 1 处引用):3D + postprocessing 对前庭敏感用户不友好。加全局 reduced-motion 门控。

## 🟠 四、正确性 / 资源泄漏

- **麦克风流泄漏**(`src/hooks/useSpeechInput.js`):持有 MediaStream/MediaRecorder/timer 但**没有 useEffect 卸载清理**,录音中途离开页面 → 麦克风持续开启。加卸载 cleanup effect。**隐私 + 资源。**
- **语音通话会中途掉线**(`VoiceRoomPage.jsx:394` / `realtime/LiveKitCall.jsx:196`):connect-effect 依赖里含 `sync`(其 deps 追 `user`/`selfName`),user 对象身份一变(如 token 刷新)→ 断开重连,通话中断。把 `sync` 放 ref,connect-effect 只依赖 `group.id/token/reconnectN`。
- **单一顶层 error boundary**(`main.jsx:28`):任意页面渲染崩溃会白掉整个 App。在 `App.jsx` 路由切换处加 feature/route 级边界(仓库已有 `SceneErrorBoundary` 可复用)。
- **write 路径 `JSON.parse(localStorage)` 未 try/catch**(ordo-amoris / cross-lament / creedCatechismEngine / api.js:977):损坏或旧 schema 会抛。统一 `readJSON/writeJSON` 安全助手。
- **gltfModelLayer 纹理泄漏 + 每帧 `triggerRepaint()`**(`src/lib/gltfModelLayer.js:70/66`):`onRemove` 未 dispose 纹理;地图永不 idle(耗电)。dispose material 贴图 + 按需重绘。

## 🟠 五、性能 / 包体 / PWA

- **同时打包 mapbox-gl 和 maplibre-gl**(+deck.gl,合计 ~3.3MB raw):两个重叠的 GL 引擎。统一到其中一个,单项最大总字节收益。maplibre 还锁在老旧 `^1.15.2`。
- **`src/mirrorData.js` 1.9MB 当 JS chunk 发**:虽 lazy,但 JS 解析/编译远慢于 JSON。移到静态 JSON 按需 fetch。
- **Krisp 降噪 1.7MB + livekit 520KB**:已 lazy、已排除预缓存(好),但确认只在用户显式进语音房时才加载,别在挂载即拉。
- **`EmotionSphereScene` 持续 rAF**、无 `frameloop="demand"`:星球一直转,移动端后台也耗 GPU/电。非活动视图暂停渲染。
- **Godot web 导出 1.2MB 在 public/**(`index.png` 755KB):按需加载 + PNG→WebP。
- `chunkSizeWarningLimit: 2000` 把警告压掉了,又无 bundle 体积 CI:装 `rollup-plugin-visualizer` 或加体积预算守卫。

## 🟡 六、配置 / 卫生 / 测试

- **ESLint 配了但没启用**:package.json 无 `lint` 脚本、CI 不跑。`Makefile` 的 `lint`/`typecheck` 都指向 **0 字节的 `check_parse.mjs`**——跑了瞬间通过、零检查(假安全信号)。加真实 `eslint .` + `tsc/vite build`,删空文件。
- **vitest 覆盖率只统计 4 个文件**(`utils/api/store/sanitize`):81 个测试文件却把 UI/features/危机流程全排除,覆盖率数字误导。放宽 `coverage.include`。
- **`film_output/` 未 gitignore + `deploy.sh` 用 `git add -A`**:可能误提交未跟踪产物/临时文件。改显式暂存路径 + 补 gitignore。
- **根目录 20+ 个 `vite.config.js.timestamp-*.mjs` / `vitest.*.mjs`** 残留(已 gitignore 但脏)。清理 + 加 clean 步骤。
- 数组下标当 key(57 文件,多数良性);`src/realtime/useRealtime.js` 死代码;SW 注销逻辑在 `pwa.js` 与 `index.html` 两处重复。

---

## 七、建议修复顺序
1. 一节两项(密钥外泄 + 首屏 three.js)。
2. 安全头(vercel.json + nginx)、localStorage token / WS query token、敏感 console 日志。
3. 可访问性(clickable 语义 + modal focus)——对本应用用户群价值高。
4. 资源泄漏(麦克风、语音掉线、error boundary)。
5. 包体(map 库去重、mirrorData→JSON、星球 lazy)。
6. 配置卫生(ESLint/CI 启用、覆盖率、清理)。

> 注:本环境 git 锁操作不稳定,前端若要提交同样需你在本机执行。修复我会逐项 `npm`/eslint/构建可行时做验证,但完整 e2e 需你本地环境。
