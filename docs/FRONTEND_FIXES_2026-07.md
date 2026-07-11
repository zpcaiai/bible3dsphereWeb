# 前端审计修复报告 — bible3dsphereWeb（2026-07）

配套:`docs/FRONTEND_AUDIT_2026-07.md`(问题清单)。本文件记录**已修复**、**需你手动执行**、**仍待跟进**。
验证:全量 422 个 src 文件 esbuild 语法解析 **0 错误**(每处自动化改动都过 parse-verify-revert 门:解析失败即自动回滚,未落地任何坏文件)。完整 `npm run build` 沙盒会超时,请你本机跑一次确认。

---

## 一、已完成(代码,语法门通过)

### 配置 / 部署 / 安全头
- 删除随构建外泄的 `public/godot/.env.local`(`holiness.uk/godot/.env.local` 曾可下载);`.gitignore` 补 `public/**/.env*`、`**/.env.local`、`film_output/`。
- `vercel.json`:全站补 `X-Content-Type-Options`、`X-Frame-Options: DENY`、`Referrer-Policy`、`HSTS`、`Permissions-Policy` 及 **CSP(先 Report-Only 防误伤)**;保留 SPA rewrites。
- `nginx.conf`:镜像同套安全头(`add_header ... always`)+ gzip;`Dockerfile` 改 `nginx-unprivileged` 非 root(内部端口 80→**8080**,跑容器注意 `-p 80:8080`)。
- `package.json` 加 `lint`/`lint:fix` 脚本 + 补齐 eslint 依赖(需 `npm install`);`Makefile` 的 lint/typecheck 从 0 字节 `check_parse.mjs` 改指向真实 `eslint`/`vite build`;`check_parse.mjs` 取消跟踪。
- `vitest.config.js` 覆盖率从 4 文件放宽到 `src/**/*.{js,jsx}`;`deploy.sh` 的 `git add -A` 改显式路径。

### 敏感日志 / auth
- 新增 `src/lib/devlog.js`;`api.js` **125 处**含情绪/危机/邮件/内容的 `console.log` 全部 dev 门控;guard `api.js` 的 `JSON.parse`。
- 7 个 mission-os fetch 确认 Bearer 鉴权后移除 `credentials:'include'`(关闭 CSRF 面)。
- `auth.js` token 存储 / `realtimeApi.js` WS `?token=` 加后端耦合说明注释(不改传输,避免破坏鉴权)。

### 性能 / 正确性 / 资源泄漏
- **three.js 星球改 lazy**(`App.jsx`,首屏最大收益);路由级 error boundary。
- `useSpeechInput.js` 加卸载 cleanup(修麦克风常开);`VoiceRoomPage`/`LiveKitCall` 用 `syncRef` 防通话中途掉线。
- `EmotionSphereScene` 尊重 reduced-motion;`gltfModelLayer` dispose 纹理 + 按需重绘;`realtimeStore` 定时器/readyState 修复。
- `creedCatechismEngine`、`CrossLamentHopeDashboard`、OrdoAmoris 的 write 路径 `JSON.parse` 加 try/catch;`useRealtime.js` 加死代码告警注释;SW 注销逻辑整理。

### 可访问性(a11y)
- 新增可复用 `AccessibleModal`(role=dialog/aria-modal/焦点陷阱/Esc)+ `useFocusTrap` hook;已接入若干关键 modal。
- 新增 `src/lib/a11yClick.js`;**62 处**挂在 `<div>/<span>/<li>` 的 `onClick` 自动补齐 `role="button"`+`tabIndex`+Enter/Space 键盘激活(镜像原 onClick,行为不变)。
- **224 个**表单控件(input/textarea/select)按 placeholder 自动补 `aria-label`(88 文件)。
- 全部 10 张图片补 `alt`;全局 `prefers-reduced-motion` CSS(`styles.css`)。

---

## 二、需要你手动执行
1. **提交**:本沙盒对 `.git` 锁操作权限不稳定,提交不了。请本机执行(见下方命令),并注意工作区里还混着你自己的 MissionBridge WIP(`src/features/mission-os/console/`、`missionApi.js`、`MissionConsole.test.jsx` 等),按需分开提交。
2. **`npm install`**(eslint 新依赖)+ **`npm run build`** 本机跑一次确认;可选 `npm run lint`。
3. **部署侧**:在 Vercel/nginx 设 CSP 从 Report-Only 收紧为强制(先看 report 无误报);Docker 端口改 8080 注意映射;Mapbox token 在控制台加 URL 限制。
4. **后端耦合项**(前端改不动):会话 token 从 localStorage 迁到 httpOnly cookie;WS 鉴权从 `?token=` 改短时 ticket/子协议;OAuth 回调别用 URL query 传 token。

## 三、仍待跟进(有意未做 / 需人工测试)
- **Modal 焦点管理全量接入**:`AccessibleModal` 原语已就绪并接入关键几个,但把其余 ~38 个自研 modal 逐个改造是行为性重构,需逐个测试(盲改会破坏开关逻辑)——留作增量。
- **地图库去重**:mapbox-gl 与 maplibre-gl 同时打包(~3.3MB),二选一是跨多组件的重构,需人工。
- **`mirrorData.js` 1.9MB → 静态 JSON fetch**:降低解析成本,需改加载逻辑。
- **Krisp/livekit 语音栈**确认只在用户显式进房时加载;`chunkSizeWarningLimit` 配合 bundle 体积 CI。
- a11y 剩余的 clickable/label 长尾(自动化跳过的复杂内联 handler)与颜色对比度,建议接 eslint-plugin-jsx-a11y + axe 增量收敛。

---

## 提交命令(本机)
```bash
cd ~/Documents/Projects/DoctorPro/bible3dsphereWeb
rm -f .git/index.lock
npm install          # eslint 新增依赖
npm run build        # 确认构建通过
# 复核改动;我的修复主要是 src/ 各页面的 a11y + 安全/性能,以及 vercel/nginx/Docker/config
git add -A           # 若要把你的 MissionBridge WIP 一起提交;否则显式挑选路径
git commit -m "fix(frontend): security headers, a11y (keyboard+labels), perf lazy-load, leak fixes, sensitive-log gating"
```
