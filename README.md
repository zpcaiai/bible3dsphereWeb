# 情感星球前端（bible3dsphere-frontend）

本仓库是 [bible3dsphere](https://github.com/stephenzhao/bible3dsphere) monorepo 的前端独立仓，
从 `a4f0d6a` 提取 `emotion-sphere-ui/` 目录内容提升为仓库根。

## 项目简介

情感星球（holiness.uk）是一款面向华人基督徒的属灵陪伴 PWA，
涵盖灵修、代祷、社区、圣经阅读、宣教地图等模块，
后端部署于 Hugging Face Space（stephenzao-biblesphere）：
`https://stephenzao-biblesphere.hf.space`
前端通过 Vercel 独立构建部署。

## 本地开发

```bash
npm install
npm run dev
```

默认通过 Vite proxy 将 `/api` 请求转发到 `localhost:8000`（本地后端）。
若不启动本地后端，可直接指向 HF Space：

```bash
VITE_API_BASE=https://stephenzao-biblesphere.hf.space/api npm run dev
```

## Vercel 自动构建部署

- 连接本仓库到 Vercel Project，**push 即触发构建部署**，无需手动提交 `dist/`。
- 构建命令：`npm ci && npm run build`（vercel.json 已配置）。
- 产物目录：`dist/`（已在 `.gitignore` 中排除，不入 git）。

## 环境变量

在 Vercel Project Settings → Environment Variables 中配置以下变量：

| 变量 | 说明 | 默认行为 |
|------|------|----------|
| `VITE_API_BASE` | 后端 API 基础 URL | 未设置时根据域名自动推断（holiness.uk → HF Space） |
| `VITE_MAPBOX_TOKEN` | Mapbox GL JS Token | 圣经地图模块必需 |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Next.js bible-map 模块 Token | 如启用 /bible-map 子路由则必需 |
| `VITE_CESIUM_TOKEN` | CesiumJS Ion Token | 3D 地球模块必需 |
| `VITE_MAPLIBRE_STYLE` | MapLibre 底图样式 URL | 离线/自定义底图时设置 |
| `VITE_HYMN_AUDIO_BASE` | 诗歌音频资源 CDN 基础路径 | HymnPlayer 必需 |
| `VITE_BOOK_BASE` | EPUB 书籍资源 R2/CDN 基础路径 | 属灵书籍模块必需 |
| `VITE_DEEPGRAM_API_KEY` | Deepgram 语音识别 API Key | 语音输入功能必需 |
| `VITE_MAP_PROVIDER` | 地图提供商（mapbox/maplibre/cesium） | 默认 mapbox |

后端 API 根地址：`https://stephenzao-biblesphere.hf.space`

## Service Worker 缓存版本升级

修改 `public/sw.js` 顶部的 `CACHE_VERSION` 常量（如 `v4` → `v5`）
可强制所有用户在下次访问时清除旧缓存并加载新版本。
每次有**破坏性前端变更**时应同步升级此版本号。
# bible3dsphere-frontend
