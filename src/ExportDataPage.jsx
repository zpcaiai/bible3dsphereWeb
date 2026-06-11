// ExportDataPage — 个人灵修数据导出：灵修日志 / 祷告 / 读经进度 → TXT 下载或打印成 PDF。
// 年底回顾"这一年神的带领"，或换设备前备份。数据完全归你。
import { useState } from 'react'
import BackButton from './BackButton'
import { fetchJournals, fetchPrayers, fetchReadingProgress } from './api'
import { getToken } from './auth'
import { t } from './i18n/runtime'

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

const fmtDate = (s) => { try { return new Date(s).toLocaleString('zh-CN', { hour12: false }) } catch { return s || '' } }

async function collect(parts) {
  const token = getToken()
  const out = { exportedAt: new Date().toISOString() }
  if (parts.journal) {
    try { out.journals = (await fetchJournals(token, 500, 0)).items || [] } catch { out.journals = [] }
  }
  if (parts.prayer) {
    try { out.prayers = (await fetchPrayers(500, 0, token)).prayers || [] } catch { out.prayers = [] }
  }
  if (parts.reading) {
    try { out.reading = await fetchReadingProgress(token) } catch { out.reading = null }
  }
  return out
}

function toText(data) {
  const L = []
  L.push('═══════════════════════════════════')
  L.push(`  个人灵修数据导出 · ${fmtDate(data.exportedAt)}`)
  L.push('═══════════════════════════════════', '')
  if (data.journals) {
    L.push(`【灵修日志】共 ${data.journals.length} 篇`, '')
    for (const j of data.journals) {
      L.push(`◆ ${fmtDate(j.created_at)}${j.title ? ` · ${j.title}` : ''}`)
      if (j.scripture_ref) L.push(`  📖 ${j.scripture_ref}`)
      L.push(`  ${(j.content || '').replace(/\n/g, '\n  ')}`, '')
    }
  }
  if (data.prayers) {
    L.push('───────────────────────────────────', '')
    L.push(`【祷告记录】共 ${data.prayers.length} 条`, '')
    for (const p of data.prayers) {
      const status = p.status === 'answered' ? '✅已应允' : ''
      L.push(`🙏 ${fmtDate(p.created_at)} ${status}`)
      L.push(`  ${(p.content || '').replace(/\n/g, '\n  ')}`, '')
    }
  }
  if (data.reading) {
    L.push('───────────────────────────────────', '')
    L.push('【读经进度】', '')
    const by = data.reading.by_book || {}
    const books = Object.keys(by)
    const chapters = books.reduce((s, b) => s + (by[b]?.length || 0), 0)
    L.push(`  已读 ${books.length} 卷书 · ${chapters} 章`)
    for (const b of books) L.push(`  ${b}：${(by[b] || []).length} 章`)
    L.push('')
  }
  L.push('───────────────────────────────────')
  L.push('「要记念耶和华你的神在旷野引导你这一切的路。」（申 8:2）')
  return L.join('\n')
}

export default function ExportDataPage({ onBack }) {
  const [parts, setParts] = useState({ journal: true, prayer: true, reading: true })
  const [busy, setBusy] = useState(false)

  const togglePart = (k) => setParts((p) => ({ ...p, [k]: !p[k] }))
  const nothing = !parts.journal && !parts.prayer && !parts.reading

  async function exportTxt() {
    setBusy(true)
    try {
      const text = toText(await collect(parts))
      const blob = new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `灵修数据_${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(a.href)
      toast(t('已导出 TXT'), 'success')
    } catch (e) { toast(e.message || t('导出失败'), 'error') }
    finally { setBusy(false) }
  }

  async function exportPdf() {
    setBusy(true)
    try {
      const text = toText(await collect(parts))
      const w = window.open('', '_blank')
      if (!w) { toast(t('请允许弹出窗口'), 'error'); return }
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>灵修数据导出</title>
<style>
  body { font: 14px/1.9 "Songti SC","SimSun",serif; color:#1a1a1a; max-width: 720px; margin: 32px auto; padding: 0 20px; white-space: pre-wrap; }
  @media print { body { margin: 0; } }
</style></head><body>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</body></html>`)
      w.document.close()
      w.onload = () => { w.focus(); w.print() }
      setTimeout(() => { try { w.focus(); w.print() } catch (e) { /* ignore */ } }, 600)
    } catch (e) { toast(e.message || t('导出失败'), 'error') }
    finally { setBusy(false) }
  }

  const Item = ({ k, icon, label, desc }) => (
    <button style={{ ...S.item, opacity: parts[k] ? 1 : 0.45 }} onClick={() => togglePart(k)}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>
        <div style={S.itemTitle}>{label}</div>
        <div style={S.itemDesc}>{desc}</div>
      </span>
      <span style={{ fontSize: 18 }}>{parts[k] ? '☑' : '☐'}</span>
    </button>
  )

  return (
    <div style={S.page}>
      <header style={S.header}>
        <BackButton onClick={onBack} />
        <span style={S.title}>{t('📦 数据导出')}</span>
        <span style={{ width: 56 }} />
      </header>
      <div style={S.body}>
        <p style={S.lead}>{t('你的灵修数据完全归你。选择要导出的内容，保存为 TXT 或打印成 PDF——年底回顾这一年神的带领，或换设备前留个备份。')}</p>
        <Item k="journal" icon="📔" label={t('灵修日志')} desc={t('每日灵修记录与默想')} />
        <Item k="prayer" icon="🙏" label={t('祷告记录')} desc={t('祷告与应允见证')} />
        <Item k="reading" icon="📖" label={t('读经进度')} desc={t('已读书卷与章数统计')} />
        <div style={S.btns}>
          <button style={S.ghost} disabled={busy || nothing} onClick={exportTxt}>{busy ? t('整理中…') : t('⬇ 导出 TXT')}</button>
          <button style={S.primary} disabled={busy || nothing} onClick={exportPdf}>{busy ? t('整理中…') : t('🖨 打印 / 存为 PDF')}</button>
        </div>
        <p style={S.note}>{t('「要记念耶和华你的神在旷野引导你这一切的路。」（申 8:2）')}</p>
      </div>
    </div>
  )
}

const S = {
  page: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#fff', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 700 },
  body: { flex: 1, overflowY: 'auto', padding: '18px 16px', maxWidth: 480, width: '100%', margin: '0 auto', boxSizing: 'border-box' },
  lead: { fontSize: 13.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', margin: '0 0 16px' },
  item: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '13px 15px', color: '#fff', cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' },
  itemTitle: { fontSize: 14.5, fontWeight: 600 },
  itemDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  btns: { display: 'flex', gap: 10, marginTop: 16 },
  ghost: { flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '12px 0', color: '#fff', fontSize: 14, cursor: 'pointer' },
  primary: { flex: 1, background: '#e8b04b', border: 'none', borderRadius: 12, padding: '12px 0', color: '#2a1d05', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  note: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 22, lineHeight: 1.7 },
}
