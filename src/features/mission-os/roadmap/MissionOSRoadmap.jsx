import { useState } from 'react'
import { t } from '../../../i18n/runtime'
import { ROADMAP_META, BATCHES, STATUS_STYLES } from './missionOsRoadmapData'

/**
 * MissionOSRoadmap — Mission OS 全功能版开发路线图（Batch 0–5）
 * 在「宣教」子标签内以可折叠的 Batch → Skill 分层视图呈现规划内容。
 * 纯前端、无外部依赖；轻量 markdown 渲染（标题/列表/粗体/行内代码/代码块）。
 */

// ---- 轻量 markdown 行内渲染：**粗体** 与 `行内代码` ----
function renderInline(text, keyPrefix) {
  const nodes = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m
  let i = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`} style={{ color: '#fff' }}>{tok.slice(2, -2)}</strong>)
    } else {
      nodes.push(
        <code key={`${keyPrefix}-c${i}`} style={{
          background: 'rgba(255,255,255,0.10)', borderRadius: 5, padding: '1px 5px',
          fontSize: '0.86em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{tok.slice(1, -1)}</code>
      )
    }
    last = m.index + tok.length
    i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// ---- 轻量 markdown 块渲染：标题 / 列表 / 代码块 / 段落 ----
function Markdown({ text }) {
  const lines = String(text || '').split('\n')
  const blocks = []
  let i = 0
  let listBuf = null
  const flushList = () => {
    if (listBuf && listBuf.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} style={{ margin: '6px 0 8px', paddingLeft: 20 }}>
          {listBuf.map((it, idx) => (
            <li key={idx} style={{ margin: '3px 0', lineHeight: 1.55, color: 'rgba(255,255,255,0.82)' }}>
              {renderInline(it, `li-${blocks.length}-${idx}`)}
            </li>
          ))}
        </ul>
      )
    }
    listBuf = null
  }
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      flushList()
      const code = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) { code.push(lines[i]); i++ }
      i++
      blocks.push(
        <pre key={`pre-${blocks.length}`} style={{
          background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '10px 12px', overflowX: 'auto', margin: '8px 0',
          fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{code.join('\n')}</pre>
      )
      continue
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (!listBuf) listBuf = []
      listBuf.push(line.replace(/^\s*[-*]\s+/, ''))
      i++
      continue
    }
    flushList()
    if (line.trim() === '') { i++; continue }
    blocks.push(
      <p key={`p-${blocks.length}`} style={{ margin: '4px 0 8px', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>
        {renderInline(line, `p-${blocks.length}`)}
      </p>
    )
    i++
  }
  flushList()
  return <div>{blocks}</div>
}

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.planned
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
      borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap',
    }}>{t(s.label)}</span>
  )
}

function SkillRow({ skill }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          background: 'transparent', border: 'none', color: '#fff', textAlign: 'left',
          padding: '10px 4px', fontSize: 14, fontWeight: 600,
        }}
        aria-expanded={open}
      >
        <span style={{ opacity: 0.6, fontSize: 12, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>
        <span style={{ flex: 1 }}>{skill.title}</span>
      </button>
      {open && (
        <div style={{ padding: '0 4px 12px 24px', fontSize: 13.5 }}>
          <Markdown text={skill.body} />
        </div>
      )}
    </div>
  )
}

function BatchCard({ batch, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: 14, marginBottom: 12,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', padding: 0,
        }}
        aria-expanded={open}
      >
        <span style={{ opacity: 0.6, fontSize: 13, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>
        <span style={{ flex: 1, fontSize: 15.5, fontWeight: 800 }}>{batch.title}</span>
        <StatusPill status={batch.status} />
      </button>
      <div style={{ margin: '8px 0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.55 }}>
        🎯 {batch.goal}
      </div>
      {open && (
        <div style={{ marginTop: 10 }}>
          {batch.principles?.length > 0 && (
            <div style={{
              background: 'rgba(90,200,250,0.07)', border: '1px solid rgba(90,200,250,0.15)',
              borderRadius: 10, padding: '8px 12px', margin: '4px 0 10px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8fd6ff', marginBottom: 4 }}>{t('统一原则')}</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {batch.principles.map((p, idx) => (
                  <li key={idx} style={{ margin: '2px 0', fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)' }}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            {batch.skills.map(sk => <SkillRow key={sk.id} skill={sk} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MissionOSRoadmap() {
  const [showStack, setShowStack] = useState(false)
  return (
    <div style={{ padding: '4px 2px 40px' }}>
      {/* 头部 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(94,92,230,0.18), rgba(52,199,89,0.10))',
        border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 16, marginBottom: 14,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>🛰️ {ROADMAP_META.title}</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.66)', marginTop: 6, lineHeight: 1.55 }}>
          {ROADMAP_META.subtitle}
        </div>
        <button
          onClick={() => setShowStack(s => !s)}
          style={{
            marginTop: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff',
            fontSize: 12, fontWeight: 600, padding: '6px 12px',
          }}
        >
          {showStack ? t('隐藏技术栈与完成定义') : t('技术栈与完成定义')}
        </button>
        {showStack && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.78)' }}>
            <div style={{ fontWeight: 700, color: '#fff', margin: '4px 0' }}>{t('每个 Skill 完成定义')}</div>
            <div style={{ lineHeight: 1.6 }}>{ROADMAP_META.dod.join(' · ')}</div>
            <div style={{ fontWeight: 700, color: '#fff', margin: '10px 0 4px' }}>{t('技术栈')}</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {Object.entries(ROADMAP_META.stack).map(([k, v]) => (
                <li key={k} style={{ margin: '2px 0', lineHeight: 1.55 }}><strong style={{ color: '#fff' }}>{k}</strong>：{v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Batch 列表 */}
      {BATCHES.map((b, idx) => (
        <BatchCard key={b.id} batch={b} defaultOpen={idx === 0} />
      ))}

      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
        {t('完整 Codex 执行 Prompt 见 docs/mission-os 参考文档')}
      </div>
    </div>
  )
}
