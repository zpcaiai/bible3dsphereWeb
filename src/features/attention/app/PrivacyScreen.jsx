import React, { useEffect, useState } from 'react'
import { attentionApi } from '../../../api'
import { AttentionCard } from '../components/attentionComponents'
import { AttentionVisibilityLabel, SensitiveCategoryLabel } from '../lib/privacy-types'

const VISIBILITY = ['status_only', 'summary', 'private']

export default function PrivacyScreen({ token, onBack }) {
  const [settings, setSettings] = useState(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    let cancelled = false
    setLoading(true)
    setMessage('')
    attentionApi.privacy(token)
      .then((data) => { if (!cancelled) setSettings(data.settings) })
      .catch(() => { if (!cancelled) setMessage('暂时无法加载隐私设置。') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }

  useEffect(() => {
    const cancel = load()
    return cancel
  }, [token])

  function patch(values) {
    setSettings((current) => ({ ...(current || {}), ...values }))
  }

  function toggleHidden(key) {
    const current = settings?.hideSensitiveCategories || []
    patch({
      hideSensitiveCategories: current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    })
  }

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const data = await attentionApi.updatePrivacy(settings, token)
      setSettings(data.settings)
      setMessage('隐私设置已保存。')
    } catch (err) {
      setMessage(err?.message || '保存隐私设置时遇到问题。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>返回守心首页</button>
        <h1>守心隐私</h1>
        <p>你决定哪些摘要可以被看见。原始祷告、复盘、洞察和敏感牵引不会自动分享。</p>
      </header>

      {message ? <div className="attn-alert" role="status">{message}{!settings && !loading ? <button type="button" onClick={load}>重试</button> : null}</div> : null}
      {loading ? <div className="attn-loading">正在加载隐私边界…</div> : null}

      {settings ? (
        <section className="attn-grid">
          <AttentionCard title="默认可见范围">
            <div className="attn-form-grid">
              {[
                ['defaultPartnerVisibility', '守望伙伴默认可见'],
                ['defaultGroupVisibility', '守心小组默认可见'],
                ['defaultChallengeVisibility', '挑战 Check-in 默认可见'],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <select value={settings[key] || 'status_only'} onChange={(e) => patch({ [key]: e.target.value })}>
                    {VISIBILITY.map((value) => <option key={value} value={value}>{AttentionVisibilityLabel[value]}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </AttentionCard>

          <AttentionCard title="分享开关">
            <div className="attn-toggle-list">
              {[
                ['shareWeeklyReportSummary', '允许手动分享周报摘要'],
                ['shareWarfarePlanProgress', '允许手动分享守心计划进展'],
                ['sharePrayerRequests', '允许发送代祷请求'],
                ['shareScoresWithPartners', '允许向伙伴分享评分摘要'],
                ['shareScoresWithGroups', '允许向小组分享评分摘要'],
                ['requirePreviewBeforeSharing', '分享前需要预览'],
              ].map(([key, label]) => (
                <label key={key} className="attn-toggle">
                  <input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => patch({ [key]: e.target.checked })} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </AttentionCard>

          <AttentionCard title="敏感内容保护">
            <div className="attn-pill-grid">
              {Object.entries(SensitiveCategoryLabel).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`attn-pill ${(settings.hideSensitiveCategories || []).includes(key) ? 'active' : ''}`}
                  aria-pressed={(settings.hideSensitiveCategories || []).includes(key)}
                  onClick={() => toggleHidden(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="attn-muted">被保护的类别在分享摘要中会被遮蔽为“一个敏感牵引”。</p>
          </AttentionCard>
        </section>
      ) : null}

      <section className="attn-section">
        <button className="attn-button" type="button" disabled={!settings || saving} onClick={save}>{saving ? '保存中…' : '保存隐私设置'}</button>
      </section>
    </main>
  )
}
