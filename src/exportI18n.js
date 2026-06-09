// 导出内容按语言翻译：EN 模式下把「手工拼装的导出内容」（TXT 字符串 / 离屏 PDF 元素）
// 在落盘/截图前机翻成英文，使导出与画面一致。ZH 模式原样返回。
import { getRuntimeLang } from './i18n/runtime'
import { translateTexts } from './api'

const CJK = /[一-鿿]/

// TXT 导出：逐行翻译含中文的行，保留分隔线/空行/纯英文行结构。
export async function translateForExport(text) {
  if (getRuntimeLang() !== 'en' || !text) return text
  const lines = String(text).split('\n')
  const idx = [], need = []
  lines.forEach((ln, i) => { if (CJK.test(ln)) { idx.push(i); need.push(ln) } })
  if (need.length === 0) return text
  try {
    const res = await translateTexts(need, 'en')
    if (Array.isArray(res)) idx.forEach((li, k) => { if (res[k]) lines[li] = res[k] })
  } catch { /* 失败保留原文 */ }
  return lines.join('\n')
}

// PDF 导出：翻译离屏元素内的中文文本节点（html2canvas 截图前调用）。
// el 为我们自建的离屏 DOM（非 React 托管），直接改 nodeValue 安全。
export async function translateElementText(el) {
  if (getRuntimeLang() !== 'en' || !el || typeof document === 'undefined') return
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
  const nodes = [], need = []
  let n
  while ((n = walker.nextNode())) {
    const v = n.nodeValue
    if (v && v.trim() && CJK.test(v)) { nodes.push(n); need.push(v) }
  }
  if (need.length === 0) return
  try {
    const res = await translateTexts(need, 'en')
    if (Array.isArray(res)) nodes.forEach((node, k) => { if (res[k]) node.nodeValue = res[k] })
  } catch { /* 保留原文 */ }
}
