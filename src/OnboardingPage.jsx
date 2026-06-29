import { useState } from 'react'
import BackButton from './BackButton'
import { getToken } from './auth'
import { t } from './i18n/runtime'
import { AutoText } from './autoTranslate'
import { postFormationBaseline, postFormationEvent } from './api'

// 统一入门漏斗 / Onboarding —— 一次基线诊断 → 个性化成长路径（接 /api/formation/baseline）
// i18n：静态文案走 t()；后端动态/AI 文案走 <AutoText>。
const ACCENT = '#34d399'
const ACCENT_DIM = 'rgba(52,211,153,0.14)'

const SYMPTOMS = [
  ['joylessness', '失去喜乐'], ['assurance_loss', '失去确据'],
  ['self_condemnation', '自我控告'], ['hopelessness', '失去盼望'],
  ['circumstance', '只盯环境'], ['dryness', '属灵枯干'],
  ['anxiety', '焦虑不安'], ['discouragement', '灰心丧志'],
]

const STEP_ICON = { care: '🕊', practice: '🌱', truth: '📖', rhythm: '🔁', diagnose: '🧭', review: '📅' }

const card = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, padding: 16, marginBottom: 12,
}

export default function OnboardingPage({ onBack, onNavigate }) {
  const [text, setText] = useState('')
  const [showCheckup, setShowCheckup] = useState(false)
  const [ratings, setRatings] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState(null)

  async function submit() {
    const token = getToken()
    if (!token) { setErr(t('请先登录后再做基线诊断。')); return }
    if (!text.trim() && !Object.keys(ratings).length) { setErr(t('请先用几句话写下你现在的处境，或做一下心灵体检。')); return }
    setBusy(true); setErr('')
    try {
      const checkup = showCheckup && Object.keys(ratings).length ? ratings : undefined
      const r = await postFormationBaseline({ text: text.trim(), checkup }, token)
      setRes(r)
    } catch (e) { setErr(e.message || t('诊断失败')) } finally { setBusy(false) }
  }

  const diag = res?.diagnosis
  const plan = res?.plan
  const steps = plan?.steps || (plan ? [plan] : [])

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '8px 14px 40px', color: '#fff' }}>
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 4px' }}>
        <span style={{ fontSize: 26 }}>🌱</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t('从这里开始')}</h2>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginTop: 4 }}>
        {t('用几分钟做一次基线诊断，系统会据此为你生成一条个性化的成长路径——而不是让你在众多入口里迷路。')}
      </p>

      {!res && (
        <div>
          <div style={card}>
            <label style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{t('此刻你的处境 / 挣扎')}</label>
            <textarea
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder={t('例如：最近很焦虑，总想证明自己，读经祷告也提不起劲……')}
              rows={5}
              style={{ width: '100%', marginTop: 8, background: 'rgba(0,0,0,0.25)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10,
                fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div style={card}>
            <button
              onClick={() => setShowCheckup((v) => !v)}
              style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', padding: 0 }}>
              {showCheckup ? '▾ ' : '▸ '}{t('加做心灵体检（可选）')}
            </button>
            {showCheckup && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                  {t('为每一项打分：0 = 完全没有，10 = 非常强烈。')}
                </div>
                {SYMPTOMS.map(([key, name]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, width: 84, color: 'rgba(255,255,255,0.8)' }}>{t(name)}</span>
                    <input type="range" min={0} max={10} step={1} value={ratings[key] ?? 0}
                      onChange={(e) => setRatings((p) => ({ ...p, [key]: Number(e.target.value) }))}
                      style={{ flex: 1, accentColor: ACCENT }} />
                    <span style={{ fontSize: 12, width: 18, textAlign: 'right', color: ACCENT }}>{ratings[key] ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {err && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <button
            onClick={submit} disabled={busy}
            style={{ width: '100%', padding: '13px', background: busy ? 'rgba(52,211,153,0.4)' : ACCENT,
              color: '#06281d', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: busy ? 'default' : 'pointer' }}>
            {busy ? t('正在为你生成路径…') : t('生成我的成长路径')}
          </button>
        </div>
      )}

      {res && (
        <div>
          {diag && diag.ok && diag.summary && (
            <div style={{ ...card, borderColor: ACCENT_DIM, background: ACCENT_DIM }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT, marginBottom: 6 }}>{t('基线诊断')}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
                <AutoText>{diag.summary}</AutoText>
              </div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 700, margin: '14px 2px 8px', color: '#fff' }}>
            {t('为你定制的下一步')}
          </div>
          {steps.map((s, i) => (
            <div key={i} style={{ ...card, borderColor: i === 0 ? ACCENT_DIM : 'rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 17 }}>{STEP_ICON[s.kind] || '•'}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}><AutoText>{s.title}</AutoText></span>
                {i === 0 && <span style={{ fontSize: 10.5, color: ACCENT, border: `1px solid ${ACCENT}`,
                  borderRadius: 6, padding: '1px 6px' }}>{t('优先')}</span>}
              </div>
              {s.reason && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                <AutoText>{s.reason}</AutoText></div>}
              {s.action && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                <AutoText>{s.action}</AutoText></div>}
              {onNavigate && s.route && (
                <button onClick={() => { try { postFormationEvent({ source: 'next_step', event_type: 'adopted', domain: s.domain || s.kind, title: '采纳建议 · ' + (s.title || ''), severity: 'green' }, getToken()) } catch (e) {} onNavigate(s.route) }}
                  style={{ marginTop: 10, padding: '8px 14px', background: i === 0 ? ACCENT : 'rgba(255,255,255,0.08)',
                    color: i === 0 ? '#06281d' : '#fff', border: 'none', borderRadius: 9, fontSize: 13,
                    fontWeight: 600, cursor: 'pointer' }}>
                  {t('开始这一步')} →
                </button>
              )}
            </div>
          ))}

          <button onClick={onBack}
            style={{ width: '100%', marginTop: 8, padding: '11px', background: 'rgba(255,255,255,0.06)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 11, fontSize: 14,
              fontWeight: 600, cursor: 'pointer' }}>
            {t('稍后再说，先回主页')}
          </button>
        </div>
      )}
    </div>
  )
}
