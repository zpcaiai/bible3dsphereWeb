import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// 构建时产出 /precache-manifest.json（全部 hashed 产物路径），
// sw.js 安装阶段读取并预缓存——二次访问全静态秒开，也根治旧 chunk 404。
function precacheManifestPlugin() {
  return {
    name: 'precache-manifest',
    apply: 'build',
    generateBundle(_, bundle) {
      // 排除巨型按需场景包（语音降噪 wasm/livekit/PDF/地图）——只在进入对应功能时下载，
      // 避免 SW 安装阶段预取 4MB+ 拖慢首装与流量
      const PRECACHE_EXCLUDE = /(krisp|livekit|maplibre|mapbox|deck|^assets\/pdf-)/
      const files = Object.keys(bundle)
        .filter((f) => /\.(js|css|woff2?)$/.test(f))
        .filter((f) => !PRECACHE_EXCLUDE.test(f))
        .map((f) => '/' + f)
      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify({ version: Date.now(), files }),
      })
    },
  }
}

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react(), precacheManifestPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'deck-luma': [
            '@deck.gl/core',
            '@deck.gl/layers',
            '@deck.gl/mapbox',
            '@luma.gl/core',
            '@luma.gl/engine',
            '@luma.gl/shadertools',
            '@luma.gl/webgl',
            '@math.gl/core',
            '@math.gl/web-mercator',
          ],
          'pdf': ['jspdf', 'html2canvas'],
          'krisp': ['@livekit/krisp-noise-filter'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/wdbible': {
        target: 'https://wd.bible',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/wdbible/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/wdbible': {
        target: 'https://wd.bible',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/wdbible/, ''),
      },
    },
  },
})
