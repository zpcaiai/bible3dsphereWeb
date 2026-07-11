import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n/runtime'
import { a11yClickProps } from '../lib/a11yClick';

/**
 * SuggestField — 通用「常见选项 + 手动输入」组合控件
 * 右上角「常见选项 ▾」下拉里是预备好的合理选项，可【多选】：点选即加入、再点取消，菜单保持打开；
 * 已选项左侧打 ✓。用户也可随时在框里手动输入。主题中性（深色），accent 可配置。
 *
 * props:
 *  label, value, onChange(string), placeholder, options[string]
 *  multiline=true | minHeight=64 | sep='；'(追加分隔符) | required
 *  accent='#f5b53f' | style(外层) | inputStyle(输入框)
 */
function hexToRgba(hex, a) {
  const m = String(hex).replace('#', '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// 把当前值拆成「已选片段」集合（按常见分隔符）
function splitParts(value) {
  return (value || '').split(/[；;，,、\n]/).map(x => x.trim()).filter(Boolean)
}
// 多选切换：已含则移除，未含则按 sep 追加
function toggleValue(value, v, sep) {
  const cur = (value || '').trim()
  const parts = splitParts(cur)
  const i = parts.indexOf(v)
  if (i >= 0) { parts.splice(i, 1); return parts.join(sep) }
  return cur ? cur + sep + v : v
}

// 下拉里单个可多选选项行
function OptionRow({ opt, value, accent, accentDim, onPick }) {
  const txt = t(opt)
  const on = splitParts(value).includes(txt)
  return (
    <div
      onMouseDown={e => e.preventDefault()} onClick={() => onPick(opt)}
      onMouseEnter={e => { e.currentTarget.style.background = accentDim }}
      onMouseLeave={e => { e.currentTarget.style.background = on ? accentDim : 'transparent' }}
      style={{
        display: 'flex', gap: 6, alignItems: 'flex-start', padding: '7px 10px', fontSize: 12.5,
        color: on ? accent : 'rgba(255,255,255,0.85)', background: on ? accentDim : 'transparent',
        borderRadius: 7, cursor: 'pointer', lineHeight: 1.5,
      }}
     {...a11yClickProps(() => onPick(opt))}>
      <span style={{ flex: '0 0 12px', color: accent }}>{on ? '✓' : ''}</span>{txt}
    </div>
  )
}

function MultiHint({ accent }) {
  return <div style={{ padding: '2px 10px 6px', fontSize: 10.5, color: hexToRgba(accent, 0.85) }}>{t('可多选')}</div>
}

export default function SuggestField({
  label, value, onChange, placeholder, options = [],
  multiline = true, minHeight = 64, sep = '；', required = false,
  accent = '#f5b53f', style, inputStyle,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const accentDim = hexToRgba(accent, 0.16)
  const pick = (opt) => onChange(toggleValue(value, t(opt), sep)) // 多选：不关闭菜单

  const baseInput = {
    width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 13,
    color: 'inherit', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
    padding: '9px 96px 9px 11px', outline: 'none', ...inputStyle,
  }

  return (
    <div style={{ position: 'relative', margin: '8px 0', ...style }} ref={ref}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, opacity: 0.6, margin: '0 0 5px' }}>
          {t(label)}{required ? ' *' : ''}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {multiline ? (
          <textarea
            value={value || ''} onChange={e => onChange(e.target.value)} placeholder={t(placeholder)}
            style={{ ...baseInput, minHeight, resize: 'vertical', lineHeight: 1.6 }}
           aria-label={t(placeholder)}/>
        ) : (
          <input
            value={value || ''} onChange={e => onChange(e.target.value)} placeholder={t(placeholder)}
            style={baseInput}
           aria-label={t(placeholder)}/>
        )}
        {options.length > 0 && (
          <button
            type="button" onClick={() => setOpen(o => !o)}
            style={{
              position: 'absolute', top: 6, right: 6, zIndex: 2, padding: '3px 9px', fontSize: 11.5,
              fontFamily: 'inherit', cursor: 'pointer', borderRadius: 7, whiteSpace: 'nowrap',
              border: '1px solid ' + hexToRgba(accent, 0.4), background: accentDim, color: accent,
            }}
          >{t('常见选项')} ▾</button>
        )}
        {open && options.length > 0 && (
          <div
            style={{
              position: 'absolute', top: '100%', right: 6, marginTop: 4, zIndex: 40, maxHeight: 260,
              overflowY: 'auto', minWidth: 200, maxWidth: 340, padding: 5, borderRadius: 10,
              border: '1px solid ' + hexToRgba(accent, 0.35), background: '#1a1c24',
              boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
            }}
          >
            <MultiHint accent={accent} />
            {options.map(opt => (
              <OptionRow key={opt} opt={opt} value={value} accent={accent} accentDim={accentDim} onPick={pick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * SuggestMenu — 仅「常见选项 ▾」按钮 + 下拉（不含输入框），叠加到已有 textarea/input 右上角。
 * 适合已有自定义样式的表单：父容器设 position:relative，把本组件放在输入框之后即可。
 * 可【多选】：点选加入 / 再点取消，菜单保持打开；已选项打 ✓。
 */
export function SuggestMenu({ options = [], value, onChange, sep = '；', accent = '#f5b53f', title = '常见选项', top = 6, right = 6 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const opts = (options || []).filter(Boolean)
  if (opts.length === 0) return null
  const accentDim = hexToRgba(accent, 0.16)
  const pick = (opt) => onChange(toggleValue(value, t(opt), sep)) // 多选：不关闭菜单
  return (
    <span ref={ref} style={{ position: 'absolute', top, right, zIndex: 6 }}>
      <button
        type="button" onClick={() => setOpen(o => !o)}
        style={{
          padding: '3px 9px', fontSize: 11.5, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 7,
          whiteSpace: 'nowrap', border: '1px solid ' + hexToRgba(accent, 0.4), background: accentDim, color: accent,
        }}
      >{t(title)} ▾</button>
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 50, maxHeight: 260,
            overflowY: 'auto', minWidth: 220, maxWidth: 360, padding: 5, borderRadius: 10,
            border: '1px solid ' + hexToRgba(accent, 0.35), background: '#1a1c24', boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
            textAlign: 'left',
          }}
        >
          <MultiHint accent={accent} />
          {opts.map((opt, i) => (
            <OptionRow key={opt + i} opt={opt} value={value} accent={accent} accentDim={accentDim} onPick={pick} />
          ))}
        </div>
      )}
    </span>
  )
}
