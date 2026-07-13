#!/usr/bin/env bash
# 一键部署：确认修复已推送 → 上线 Vercel 生产环境
# 用法：在项目根目录执行  bash deploy.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "==> 1/4 提交本地修复改动"
if [ -n "$(git status --porcelain src public api scripts requirements.txt index.html vercel.json .gitignore)" ]; then
  # 显式暂存已知路径，避免 git add -A 误扫瞬时/临时文件（timestamp bundles、.env.local、film_output 等）
  git add src public api scripts requirements.txt index.html \
    vite.config.js vitest.config.js eslint.config.js \
    tailwind.config.js postcss.config.js \
    package.json package-lock.json \
    vercel.json nginx.conf Dockerfile Makefile .gitignore
  git commit -m "fix(地图): Leaflet flyTo 在容器0尺寸/目标≈当前中心时内部产生(NaN,NaN)崩整页——setView/fitBounds 先invalidateSize并对退化情形改用无动画setView"
  echo "    ✓ 已提交"
else
  echo "    工作区无改动，跳过提交"
fi

echo "==> 2/4 推送到 origin/main"
git push origin HEAD:main
echo "    ✓ 已推送"

echo "==> 3/4 本地构建校验（确保产物含 NaN 守卫）"
npm run build >/dev/null 2>&1 && echo "    ✓ 构建成功" || { echo "    ✗ 构建失败，已中止"; exit 1; }

echo "==> 4/4 部署到 Vercel 生产环境"
if command -v vercel >/dev/null 2>&1; then
  vercel --prod
else
  npx vercel --prod
fi

echo ""
echo "完成。刷新 holiness.uk（建议硬刷新清缓存：Cmd+Shift+R）。"
echo "成功标志：控制台加载的 chunk 从 EvangelismPage-BQEN70_a.js 变为新 hash，地图动画不再报 NaN。"
