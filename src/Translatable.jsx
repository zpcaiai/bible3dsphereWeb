// 可翻译文本块：当文本语言与当前界面语言不一致时显示「翻译」按钮，按需机翻并行内展示。
// 原文不变、不入库。用于 UGC（聊天/群聊/社区帖子评论等）跨语言查看。
import { useState } from 'react'
import { t, getRuntimeLang } from './i18n/runtime'
import { translateText } from './api'

export default function Translatable({ text, className, style }) {
  const [tr, setTr] = useState(null)
  const [loading, setLoading] = useState(false)
  const body = text || ''
  const lang = getRuntimeLang()
  const isZh = /[一-鿿]/.test(body)
  const crossLang = lang === 'en' ? isZh : (!isZh && /[a-zA-Z]/.test(body))
  const onTranslate = async () => {
    if (tr || loading) return
    setLoading(true)
    try { const r = await translateText(body, lang); if (r) setTr(r) } finally { setLoading(false) }
  }
  return (
    <div className={className} style={style}>
      {body}
      {tr && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.12)', opacity: 0.9 }}>{tr}</div>
      )}
      {crossLang && !tr && (
        <button onClick={onTranslate} disabled={loading}
          style={{ display: 'block', marginTop: 3, background: 'none', border: 'none', padding: 0,
            color: 'rgba(255,255,255,0.45)', fontSize: 11, cursor: 'pointer' }}>
          {loading ? t('翻译中…') : t('翻译')}
        </button>
      )}
    </div>
  )
}
