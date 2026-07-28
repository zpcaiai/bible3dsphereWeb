// cardStudio.js — 通用图卡渲染引擎（Canvas，无水印，离线可用）。
//
// ShareCardModal 只能出「经文卡」。很多场景需要的是**离线可看**的信息卡：
// 危机时打开 App 本身就是负担，安全计划和热线必须能截图、能设成锁屏、能打印。
// 本模块把版式抽象出来，各模块只提供内容。
//
// 尺寸 1080×1350（4:5），中文按字断行 / 拉丁按词断行。

export const CARD_TEMPLATES = Object.freeze({
  dawn: { name: '晨光', stops: [[0, '#2b1d4f'], [0.55, '#7a3b67'], [1, '#e8945a']], ink: '#fff7ec', sub: 'rgba(255,247,236,0.74)', rule: 'rgba(255,247,236,0.22)' },
  sea: { name: '深海', stops: [[0, '#0a1f33'], [0.6, '#10405e'], [1, '#1d6f86']], ink: '#eafaff', sub: 'rgba(234,250,255,0.72)', rule: 'rgba(234,250,255,0.22)' },
  olive: { name: '橄榄', stops: [[0, '#1c2a17'], [0.6, '#3c5230'], [1, '#7a8f54']], ink: '#f6f8ec', sub: 'rgba(246,248,236,0.74)', rule: 'rgba(246,248,236,0.22)' },
  ink: { name: '墨夜', stops: [[0, '#0c0d12'], [1, '#23263a']], ink: '#f2ecdd', sub: 'rgba(242,236,221,0.68)', rule: 'rgba(242,236,221,0.2)' },
  calm: { name: '静蓝', stops: [[0, '#0b1622'], [0.62, '#123049'], [1, '#1b4a63']], ink: '#eaf4ff', sub: 'rgba(234,244,255,0.72)', rule: 'rgba(234,244,255,0.2)' },
})

const W = 1080
const H = 1350
const PAD = 84
const CJK = /[一-鿿]/

function wrap(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  const tokens = String(text).match(/[一-鿿　-〿＀-￯]|\S+|\s+/g) || []
  for (const tk of tokens) {
    const test = line + tk
    if (ctx.measureText(test).width > maxWidth && line.trim()) {
      lines.push(line.trimEnd())
      line = /\s/.test(tk) ? '' : tk
    } else {
      line = test
    }
  }
  if (line.trim()) lines.push(line.trimEnd())
  return lines
}

function font(size, weight = 400) {
  return `${weight} ${size}px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif`
}

/**
 * 渲染一张信息卡。
 * @param {{
 *   template?: string, kicker?: string, title?: string, subtitle?: string,
 *   sections?: Array<{heading?: string, items?: string[], emphasis?: boolean}>,
 *   footer?: string, badge?: string
 * }} spec
 * @returns {HTMLCanvasElement}
 */
export function renderInfoCard(spec = {}) {
  const tpl = CARD_TEMPLATES[spec.template] || CARD_TEMPLATES.calm
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 背景
  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H)
  tpl.stops.forEach(([at, color]) => grad.addColorStop(at, color))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // 极轻的纹理，避免大面积渐变的色带
  ctx.globalAlpha = 0.035
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#000000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2)
  }
  ctx.globalAlpha = 1

  const maxW = W - PAD * 2
  let y = PAD + 24

  if (spec.badge) {
    ctx.font = font(26, 600)
    const tw = ctx.measureText(spec.badge).width
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    const bx = PAD; const bw = tw + 36; const bh = 52
    ctx.beginPath()
    ctx.roundRect ? ctx.roundRect(bx, y, bw, bh, 26) : ctx.rect(bx, y, bw, bh)
    ctx.fill()
    ctx.fillStyle = tpl.ink
    ctx.textBaseline = 'middle'
    ctx.fillText(spec.badge, bx + 18, y + bh / 2)
    ctx.textBaseline = 'alphabetic'
    y += bh + 34
  }

  if (spec.kicker) {
    ctx.font = font(28, 500)
    ctx.fillStyle = tpl.sub
    ctx.fillText(spec.kicker, PAD, y + 28)
    y += 56
  }

  if (spec.title) {
    ctx.font = font(62, 700)
    ctx.fillStyle = tpl.ink
    wrap(ctx, spec.title, maxW).forEach((ln) => { y += 78; ctx.fillText(ln, PAD, y) })
    y += 18
  }

  if (spec.subtitle) {
    ctx.font = font(30, 400)
    ctx.fillStyle = tpl.sub
    wrap(ctx, spec.subtitle, maxW).forEach((ln) => { y += 44; ctx.fillText(ln, PAD, y) })
    y += 12
  }

  const sections = (spec.sections || []).filter((s) => s && ((s.items || []).some((i) => String(i || '').trim()) || s.heading))
  sections.forEach((sec) => {
    y += 42
    if (y > H - PAD - 120) return
    ctx.strokeStyle = tpl.rule
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(PAD, y - 22); ctx.lineTo(W - PAD, y - 22); ctx.stroke()

    if (sec.heading) {
      ctx.font = font(30, 700)
      ctx.fillStyle = tpl.ink
      y += 22
      ctx.fillText(sec.heading, PAD, y)
      y += 12
    }
    const size = sec.emphasis ? 38 : 32
    ctx.font = font(size, sec.emphasis ? 600 : 400)
    ;(sec.items || []).forEach((item) => {
      const text = String(item || '').trim()
      if (!text) return
      const lines = wrap(ctx, text, maxW - 34)
      lines.forEach((ln, li) => {
        y += size + 14
        if (y > H - PAD - 70) return
        if (li === 0) {
          ctx.fillStyle = tpl.sub
          ctx.beginPath()
          ctx.arc(PAD + 8, y - size / 3, 6, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = sec.emphasis ? tpl.ink : tpl.sub
        ctx.fillText(ln, PAD + 34, y)
      })
    })
  })

  if (spec.footer) {
    ctx.font = font(24, 400)
    ctx.fillStyle = tpl.sub
    const lines = wrap(ctx, spec.footer, maxW)
    let fy = H - PAD - (lines.length - 1) * 34
    lines.forEach((ln) => { ctx.fillText(ln, PAD, fy); fy += 34 })
  }

  return canvas
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve) => {
    if (canvas.toBlob) canvas.toBlob(resolve, type)
    else resolve(null)
  })
}

export async function downloadCard(canvas, filename = 'card.png') {
  const blob = await canvasToBlob(canvas)
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => { try { URL.revokeObjectURL(url) } catch { /* ignore */ } }, 1000)
  return true
}

export async function copyCardToClipboard(canvas) {
  try {
    const blob = await canvasToBlob(canvas)
    if (!blob || !navigator.clipboard?.write) return false
    await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}
