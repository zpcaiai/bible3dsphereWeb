// ShareCardModal — 经文分享卡生成器（Canvas，无水印）。
// 渐变模板 × 自适应排版（中文按字断行 / 英文按词断行），导出 PNG / 复制图片。
import { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '../i18n/runtime'

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

const W = 1080
const H = 1350 // 4:5，朋友圈/小红书友好

const TEMPLATES = [
  { id: 'dawn', name: '晨光', stops: [[0, '#2b1d4f'], [0.55, '#7a3b67'], [1, '#e8945a']], ink: '#fff7ec', sub: 'rgba(255,247,236,0.72)' },
  { id: 'sea', name: '深海', stops: [[0, '#0a1f33'], [0.6, '#10405e'], [1, '#1d6f86']], ink: '#eafaff', sub: 'rgba(234,250,255,0.7)' },
  { id: 'olive', name: '橄榄', stops: [[0, '#1c2a17'], [0.6, '#3c5230'], [1, '#7a8f54']], ink: '#f6f8ec', sub: 'rgba(246,248,236,0.72)' },
  { id: 'ink', name: '墨夜', stops: [[0, '#0c0d12'], [1, '#23263a']], ink: '#f2ecdd', sub: 'rgba(242,236,221,0.66)' },
]

// 文本断行：中文逐字、拉丁按词
function wrapText(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  // 按"词或单个 CJK 字符"切分
  const tokens = text.match(/[一-鿿　-〿＀-￯]|\S+|\s+/g) || []
  for (const tk of tokens) {
    const test = line + tk
    if (ctx.measureText(test).width > maxWidth && line.trim()) {
      lines.push(line.trimEnd())
      line = tk.trimStart()
    } else {
      line = test
    }
  }
  if (line.trim()) lines.push(line.trimEnd())
  return lines
}

function render(canvas, { text, reference, tpl }) {
  const ctx = canvas.getContext('2d')
  canvas.width = W
  canvas.height = H
  // 背景渐变
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
  tpl.stops.forEach(([o, c]) => g.addColorStop(o, c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // 轻噪点质感（细网格点）
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let y = 40; y < H; y += 28) for (let x = 30 + (y % 56), s = 0; x < W; x += 56, s++) ctx.fillRect(x, y, 2, 2)
  // 顶部装饰线 + 十字
  ctx.strokeStyle = tpl.sub
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(W / 2 - 90, 140); ctx.lineTo(W / 2 - 26, 140); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W / 2 + 26, 140); ctx.lineTo(W / 2 + 90, 140); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W / 2, 120); ctx.lineTo(W / 2, 160); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W / 2 - 14, 132); ctx.lineTo(W / 2 + 14, 132); ctx.stroke()

  // 正文自适应字号：先试大字号，放不下逐级缩小
  const maxWidth = W - 220
  const fontStack = '"Noto Serif SC","Songti SC","SimSun",Georgia,serif'
  let fontSize = 64
  let lines = []
  for (; fontSize >= 34; fontSize -= 4) {
    ctx.font = `600 ${fontSize}px ${fontStack}`
    lines = wrapText(ctx, text, maxWidth)
    const blockH = lines.length * fontSize * 1.72
    if (blockH <= H - 560) break
  }
  const lineH = fontSize * 1.72
  const startY = Math.max(300, (H - 140 - lines.length * lineH) / 2)
  ctx.fillStyle = tpl.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lineH))

  // 出处
  ctx.font = `500 40px ${fontStack}`
  ctx.fillStyle = tpl.sub
  ctx.fillText(`—— ${reference}`, W / 2, startY + lines.length * lineH + 56)
}

export default function ShareCardModal({ text, reference, onClose }) {
  const canvasRef = useRef(null)
  const [tplId, setTplId] = useState('dawn')
  const tpl = TEMPLATES.find((x) => x.id === tplId) || TEMPLATES[0]

  const repaint = useCallback(() => {
    if (canvasRef.current) render(canvasRef.current, { text, reference, tpl })
  }, [text, reference, tpl])

  useEffect(() => {
    repaint()
    // 衬线字体可能后到：字体就绪后重绘一次
    if (document.fonts?.ready) document.fonts.ready.then(() => repaint()).catch(() => {})
  }, [repaint])

  function download() {
    try {
      const a = document.createElement('a')
      a.download = `${reference.replace(/[\s:：]/g, '_')}.png`
      a.href = canvasRef.current.toDataURL('image/png')
      a.click()
      toast(t('已保存图片'), 'success')
    } catch { toast(t('保存失败'), 'error') }
  }

  async function copyImage() {
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'))
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
      toast(t('图片已复制，可直接粘贴分享'), 'success')
    } catch {
      toast(t('此浏览器不支持复制图片，请用「保存图片」'), 'info')
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <span style={{ fontWeight: 700 }}>{t('🖼 经文分享卡')}</span>
          <button style={S.x} onClick={onClose}>×</button>
        </div>
        <div style={S.canvasWrap}>
          <canvas ref={canvasRef} style={S.canvas} />
        </div>
        <div style={S.tplRow}>
          {TEMPLATES.map((x) => (
            <button key={x.id} onClick={() => setTplId(x.id)}
              style={{
                ...S.tplChip,
                background: `linear-gradient(135deg, ${x.stops[0][1]}, ${x.stops[x.stops.length - 1][1]})`,
                outline: tplId === x.id ? '2px solid #e8b04b' : '1px solid rgba(255,255,255,0.2)',
              }}>
              {t(x.name)}
            </button>
          ))}
        </div>
        <div style={S.btns}>
          <button style={S.ghost} onClick={copyImage}>{t('📋 复制图片')}</button>
          <button style={S.primary} onClick={download}>{t('⬇ 保存图片')}</button>
        </div>
      </div>
    </div>
  )
}

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(5,7,14,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' },
  card: { width: 'min(420px, 100%)', maxHeight: '100%', overflowY: 'auto', background: '#141826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, boxSizing: 'border-box' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', marginBottom: 12, fontSize: 15 },
  x: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  canvasWrap: { borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' },
  canvas: { width: '100%', display: 'block' },
  tplRow: { display: 'flex', gap: 8, margin: '12px 0' },
  tplChip: { flex: 1, border: 'none', borderRadius: 10, padding: '9px 0', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textShadow: '0 1px 3px rgba(0,0,0,0.6)' },
  btns: { display: 'flex', gap: 10 },
  ghost: { flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 11, padding: '11px 0', color: '#fff', fontSize: 14, cursor: 'pointer' },
  primary: { flex: 1, background: '#e8b04b', border: 'none', borderRadius: 11, padding: '11px 0', color: '#2a1d05', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
}
