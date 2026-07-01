# 属灵星球前端 · 改进记录与路线图

> 本文由一次代码审计生成：上半部分是**本轮已完成并验证**的改进；下半部分是**建议继续完善的路线图**（按优先级排序）。
> 说明：审计发现代码库其实相当成熟（0 个 TODO/FIXME、无「敬请期待」占位、图片均有 alt）。因此改进以**打磨、性能、无障碍、工程化**为主，而非补未完成的功能。

---

## 一、本轮已完成（已验证）

| # | 改进 | 文件 | 价值 | 验证 |
|---|------|------|------|------|
| 1 | 生产构建移除噪声调试日志（`console.log/info/debug`）与 `debugger`，保留 `warn/error` | `vite.config.js` | 约 144 处调试日志不再泄漏给终端用户，减小体积、更专业 | `node --check` 通过 |
| 2 | `index.html` 全面升级 | `index.html` | 见下 | HTML 解析通过、关键锚点校验 |
| 3 | 无障碍与动效安全 CSS | `src/styles.css`（追加） | 键盘焦点环 + 尊重系统「减弱动态」偏好 + `.sr-only` | 花括号配平校验 |
| 4 | 社交分享卡片图 | `public/og-image.png`（1200×630） | 链接分享时显示品牌卡片而非空白 | 像素统计校验渲染正确 |
| 5 | 工程化配置 | `.editorconfig` / `.prettierrc.json` / `.prettierignore` | 统一多人协作代码风格（贴合现有「无分号+单引号」风格） | JSON 校验通过 |
| 6 | 仓库杂物治理 | `.gitignore`（追加） / `scripts/cleanup-cruft.sh` | 收敛 75 个 Vite/Vitest 临时包与误入文件 | `bash -n` 通过 |
| 7 | 17 处阻塞式 `alert()` 错误弹窗 → 非阻塞全局 Toast（`window.showToast(msg,'error')`，带 `alert` 兜底） | 10 个页面文件 | 统一、非阻塞的错误提示体验 | 每个文件 @babel/parser 校验通过 |

**`index.html` 具体升级点：**
- 新增 SEO `description` 与 `canonical`。
- 新增 Open Graph + Twitter Card（标题/描述/图片/域名 `holiness.uk`）——微信/Twitter/Facebook 分享时显示卡片。
- `viewport-fit=cover`——刘海屏/灵动岛机型正确铺满。
- 渲染前依据 `app-lang` 偏好动态设置 `<html lang>`——利于屏幕阅读器与浏览器翻译。
- **首屏启动占位**（`#boot-splash`，React 挂载后自动替换）——重型 3D 包加载期间不再白屏。
- `<noscript>` 兜底提示（中/英）。
- Service Worker 清理脚本包 `try/catch`——隐私模式下 `localStorage` 抛错不再中断启动。

---

## 二、建议继续完善的路线图（按优先级）

### P1 — 高价值、低风险，建议优先
1. **源码层清理 `console.log`**：已在生产构建剥离，但可进一步在源码中改为统一的 `debug()` 包装或直接删除（约 144 处）。
2. **接入 ESLint + 纳入 CI**：当前 `.github/workflows/ci.yml` 只跑测试与构建，**无 lint**。建议加 `eslint` + `eslint-plugin-react-hooks`（可捕获 Hooks 依赖遗漏、未定义变量等真实 bug），并加一个 lint job。已随附 Prettier 配置可与之协同。
3. **将「减弱动态」偏好接入 3D 场景**：CSS 层已处理；但重型的 Three.js/`@react-three` 场景动画是 JS `requestAnimationFrame` 驱动，需在 JS 中读取 `matchMedia('(prefers-reduced-motion: reduce)')` 后降帧/暂停自转——对晕动症用户与低端机续航是实打实的体验提升。

### P2 — 用户体验一致性
4. **补 Promise 版确认弹窗以替换 `confirm()`**：✅ 本轮已将 17 处 `alert()` 错误提示替换为全局 Toast。剩余 8 处 `confirm()` 因返回布尔值参与流程控制，需先补一个基于 Promise 的确认弹窗组件（复用 GlobalToast 风格）再替换。
5. **PWA「新版本可用」提示**：`sw.js` 更新后引导用户刷新（配合已有 precache 机制），避免用户长期停留在旧 chunk。
6. **空状态 / 错误态 / 加载态审计**：为列表类页面（代祷墙、社区、灵修记录）统一空状态插画与失败重试按钮。

### P3 — 性能与可维护性
7. **拆分 `src/mirrorData.js`（36,629 行，单文件最大）**：若为静态数据，建议拆为按需 JSON 并懒加载，缩短首屏解析与打包时间。
8. **路由级代码分割复核**：项目已有 `lazyWithRetry.js`，可复核百余个页面是否都走懒加载，并做一次打包体积分析（`rollup-plugin-visualizer`）。
9. **清理根目录 75 个 `*.timestamp-*.mjs`**：运行随附的 `scripts/cleanup-cruft.sh`（沙箱挂载无法删除，需本地执行）。

### P4 — 测试与质量
10. **扩充测试覆盖**：现有 15 个测试文件，集中在工具与 store；可为高频交互页面（代祷墙、灵修记录、登录）补组件测试与关键 API 契约测试。

---

## 三、收尾操作（需在本地执行）

```bash
cd ~/Documents/Projects/DoctorPro/bible3dsphere-frontend

# 1) 清理杂物（沙箱无法删除文件，故本地执行）
bash scripts/cleanup-cruft.sh

# 2) 提交本轮改进 + 之前未入库的两个页面文件
git add -A
git add src/ProductizationPage.jsx src/FormationAnalyticsPage.jsx   # 修复上次 Vercel 构建失败
git commit -m "chore: 无障碍/SEO/构建打磨 + 仓库杂物治理"
git push origin main
```

> 注：请勿 `git add` 沙箱临时探测文件 `__cap_test.txt` / `__cap_copy.txt`（已加入 `.gitignore`，清理脚本亦会删除）。

---

## 四、第二轮：深层改进（已完成并验证）

> 校验方式：受限于本环境无法安装 Linux 版原生构建二进制（rollup/esbuild），改用 `node --check`（JS）+ `@babel/parser`（每个 JSX 文件）逐一校验。
> 注：`await` 出现在非 async 函数中会被解析器判为语法错误——因此「解析通过」也间接证明了下方 `confirm()` 改造的 async 位置正确。**上线前请本地 `npm run build` 跑一次并做冒烟测试。**

| # | 深层改进 | 文件 | 说明 |
|---|----------|------|------|
| 8 | **「减弱动态」接入 3D 场景** | `src/prefersReducedMotion.js`(新) + `src/EmotionSphereScene.jsx` | 新增模块级缓存的偏好读取（随系统设置实时更新）；对 3 处装饰性自转 `useFrame` 加门控——晕动症用户/低端机不再持续旋转。已确认全项目仅此文件有装饰性自转。 |
| 9 | **`confirm()` → Promise 版全局弹窗** | `src/components/ConfirmDialog.jsx`(新) + `styles.css` + `App.jsx` + 5 个页面 | 新增 `window.confirmDialog(msg,{tone,confirmText,cancelText})→Promise<boolean>`（支持 Esc/Enter/点击遮罩、`alertdialog` 语义）；替换全部 6 处真实 `window.confirm`。用 `?.` 可选链调用——弹窗未挂载时破坏性操作**安全中止**（fail-closed）。未误改两处同名局部函数 `confirm()`。 |
| 10 | **PWA「新版本」提示** | `src/pwa.js` | 将「静默强制刷新」改为**非打断式**底部提示条（含「刷新／关闭」按钮），且仅在真正「更新」（已有 controller）时出现，首次安装不打扰。自包含实现，不依赖 React 树。 |
| 11 | **ESLint 就绪配置** | `eslint.config.js`(新) | 提供 ESLint 9 扁平配置（React Hooks + Refresh 规则）。**未改动 `package.json`/`ci.yml`**，以免破坏 `npm ci`；启用步骤见文件内注释。 |

**顺带澄清一项路线图担忧：** `src/mirrorData.js`（36k 行）的两个使用者（`MirrorPage`、`RelationshipGraphView`）**均已在懒加载链内**（`MirrorPage` 走 `lazyWithRetry`，`RelationshipGraphView` 仅被其引用）。即该数据已被打包进按需 chunk、不在主包中——**无需高风险地拆分该文件**。

## 五、路线图状态更新

**已解决 / 已交付：** 首屏白屏、SEO/分享卡、无障碍焦点与减弱动态（CSS+3D）、`alert→toast`、`confirm→Promise 弹窗`、PWA 更新提示、仓库杂物治理、ESLint 配置（待激活）、mirrorData（确认已代码分割）。

**仍建议后续处理（需本地构建/依赖变更，本环境无法安全验证，故未擅自改动）：**
1. **激活 ESLint 并入 CI**：装依赖后先本地 `npx eslint .` 观察，再加入 CI（建议先非阻塞）。
2. **打包体积分析**：`npm i -D rollup-plugin-visualizer` 生成 treemap，复核百余页面的懒加载与大依赖（three/deck/mapbox 已在 `manualChunks` 分包）。
3. **源码层 `console.log` 收敛**：生产构建已剥离（本轮 vite 配置），如需源码整洁可逐步改统一 `debug()` 包装。
4. **扩充组件测试**：为高频交互页（代祷墙、灵修记录、登录、确认弹窗）补测试——本环境无法运行 vitest（缺 esbuild 原生二进制），留待本地。
5. **空/错/载状态统一**：为列表页统一空状态与失败重试。
