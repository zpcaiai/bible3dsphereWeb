// CardActions.jsx — 「生成图卡 / 下载 / 复制」的通用按钮组。
import { useCallback, useRef, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { renderInfoCard, downloadCard, copyCardToClipboard, CARD_TEMPLATES } from './cardStudio'

const btn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 13px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)',
}

/**
 * @param {() => object} buildSpec  返回 cardStudio 的 spec
 * @param {string} filename
 */
export function CardActions({ buildSpec, filename = 'card.png', label = '生成图卡', templates = ['calm', 'ink', 'dawn', 'sea', 'olive'] }) {
  const [preview, setPreview] = useState('')
  const [tpl, setTpl] = useState(templates[0])
  const [msg, setMsg] = useState('')
  const canvasRef = useRef(null)

  const build = useCallback((template) => {
    try {
      const spec = { ...(buildSpec?.() || {}), template }
      const canvas = renderInfoCard(spec)
      canvasRef.current = canvas
      setPreview(canvas.toDataURL('image/png'))
      setMsg('')
    } catch {
      setMsg(i18nT('这个浏览器不支持生成图片，可以直接截图保存。'))
    }
  }, [buildSpec])

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {!preview ? (
          <button type="button" style={btn} onClick={() => build(tpl)}>🖼 {i18nT(label)}</button>
        ) : (
          <>
            <button type="button" style={btn} onClick={() => downloadCard(canvasRef.current, filename).then((ok) => setMsg(ok ? i18nT('已保存到下载') : i18nT('保存失败，可以直接长按图片保存')))}>
              ⬇ {i18nT('保存图片')}
            </button>
            <button type="button" style={btn} onClick={() => copyCardToClipboard(canvasRef.current).then((ok) => setMsg(ok ? i18nT('已复制到剪贴板') : i18nT('这个浏览器不支持复制图片，请用「保存图片」')))}>
              ⧉ {i18nT('复制')}
            </button>
            {templates.map((k) => (
              <button
                key={k} type="button"
                onClick={() => { setTpl(k); build(k) }}
                style={{ ...btn, padding: '5px 10px', fontSize: 12, borderColor: tpl === k ? 'rgba(52,199,89,0.5)' : 'rgba(255,255,255,0.18)' }}
              >
                {i18nT(CARD_TEMPLATES[k]?.name || k)}
              </button>
            ))}
          </>
        )}
      </div>
      {preview && (
        <img
          src={preview}
          alt={i18nT('生成的图卡预览，可长按保存')}
          style={{ width: '100%', maxWidth: 300, borderRadius: 12, marginTop: 10, display: 'block', border: '1px solid rgba(255,255,255,0.12)' }}
        />
      )}
      {msg && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{msg}</div>}
    </div>
  )
}

export default CardActions
