import { useEffect, useRef, useState } from 'react'
import { t } from './i18n/runtime'
import {
  fetchGiftMeta, fetchGiftProfile, assessGift, fetchGiftHistory, fetchGiftAssessment,
  submitGiftFeedback, fetchGiftFeedback, submitGiftReview, fetchGiftReviews,
} from './api'

// 恩赐与呼召识别系统 · Gift & Calling OS (GCOS v1.0)
// 闭环：问卷 → 优势/恩赐/果子/使命 → 风险 → 服事匹配 → 30/90/180 计划 → 共同体反馈 → 复盘
// 神学边界：辅助辨识，不宣告最终呼召；身份根基在基督里，不在恩赐表现。

const ACCENT = '#f5b53f'                       // 恩赐 · 暖金
const ACCENT_DIM = 'rgba(245,181,63,0.16)'

function scoreColor(v) {
  v = Math.round(v || 0)
  if (v >= 75) return '#34c759'
  if (v >= 55) return ACCENT
  if (v >= 35) return '#ffd60a'
  return '#ff9f0a'
}
function riskColor(v) {
  v = Math.round(v || 0)
  if (v >= 70) return '#ff453a'
  if (v >= 50) return '#ff9f0a'
  if (v >= 30) return '#ffd60a'
  return '#34c759'
}
const LEVEL_COLOR = { A: '#34c759', B: ACCENT, C: '#ffd60a', D: 'rgba(255,255,255,0.4)' }
const CONF_ZH = { low: '低', medium: '中', high: '高' }

const card = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, padding: 16, marginBottom: 14,
}
const sectionTitle = { fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 10, letterSpacing: 0.3 }
const primaryBtn = {
  background: ACCENT, border: 'none', borderRadius: 9, color: '#1a1a2e',
  fontSize: 13.5, fontWeight: 700, padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit',
}
const lbl = { display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '10px 0 5px' }
const inp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px', marginBottom: 4,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
}
const ta = { ...inp, resize: 'vertical', lineHeight: 1.6 }

function ScoreBar({ label, value, color }) {
  const v = Math.round(value || 0)
  const c = color || scoreColor(v)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: c, fontWeight: 600 }}>{v}</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', borderRadius: 4, background: c, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function Chip({ children, tone }) {
  const map = {
    accent: { bg: ACCENT_DIM, fg: ACCENT, bd: 'rgba(245,181,63,0.4)' },
    warn: { bg: 'rgba(255,159,10,0.14)', fg: '#ff9f0a', bd: 'rgba(255,159,10,0.4)' },
    ok: { bg: 'rgba(52,199,89,0.14)', fg: '#34c759', bd: 'rgba(52,199,89,0.4)' },
    mute: { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.7)', bd: 'rgba(255,255,255,0.14)' },
  }
  const s = map[tone || 'mute']
  return (
    <span style={{
      display: 'inline-block', fontSize: 11.5, padding: '3px 9px', margin: '0 6px 6px 0',
      borderRadius: 12, background: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
    }}>{children}</span>
  )
}

function Banner({ children, tone }) {
  const accent = tone === 'identity'
  return (
    <div style={{
      ...card,
      background: accent ? ACCENT_DIM : 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent ? 'rgba(245,181,63,0.45)' : 'rgba(255,255,255,0.1)'}`,
      fontSize: 12.5, lineHeight: 1.7, color: accent ? '#fff' : 'rgba(255,255,255,0.6)',
    }}>{children}</div>
  )
}

// ── 完整报告渲染 ─────────────────────────────────────────────────────────────
function Report({ r, meta }) {
  if (!r) return null
  const zhMap = (arr) => Object.fromEntries((arr || []).map(x => [x.key, x.zh]))
  const sZh = zhMap(meta?.strengths)
  const gZh = zhMap(meta?.gifts)
  const fZh = zhMap(meta?.fruits)

  const sp = r.strength_profile || {}
  const sg = r.spiritual_gifts || {}
  const fr = r.fruit_scores || {}
  const cp = r.calling_patterns || {}
  const mr = r.misuse_risks || {}
  const mm = r.ministry_matches || {}
  const gp = r.growth_plan || {}
  const cc = r.community_confirmation || {}

  return (
    <div>
      {/* 概要 */}
      <div style={{ ...card, borderColor: 'rgba(245,181,63,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16 }}>🎁</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>恩赐与呼召分析</span>
          <Chip tone="accent">置信度 {CONF_ZH[r.confidence] || r.confidence || '中'}</Chip>
          {r.source === 'heuristic'
            ? <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>确定性分析（AI 暂不可用）</span>
            : <Chip tone="ok">AI 增强</Chip>}
        </div>
        {r.summary && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>{r.summary}</div>}
      </div>

      {/* 1. 天然优势 */}
      <div style={card}>
        <div style={sectionTitle}>🌟 天然优势</div>
        {(sp.core_strengths || []).map((c, i) => (
          <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < sp.core_strengths.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <ScoreBar label={c.name} value={c.score} />
            {(c.evidence || []).length > 0 && <div style={{ marginTop: 4 }}>{c.evidence.map((e, j) => <Chip key={j}>{e}</Chip>)}</div>}
            {(c.possible_use || []).length > 0 && <div style={{ marginTop: 2 }}>{c.possible_use.map((u, j) => <Chip key={j} tone="accent">{u}</Chip>)}</div>}
          </div>
        ))}
        {sp.scores && (
          <div style={{ marginTop: 6 }}>
            {Object.entries(sp.scores).sort((a, b) => b[1] - a[1]).map(([k, v]) => <ScoreBar key={k} label={sZh[k] || k} value={v} />)}
          </div>
        )}
        {sp.summary && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginTop: 6 }}>{sp.summary}</div>}
      </div>

      {/* 2. 属灵恩赐 */}
      <div style={card}>
        <div style={sectionTitle}>🎁 属灵恩赐（需共同体确认）</div>
        {(sg.likely_gifts || []).map((g, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <ScoreBar label={g.gift} value={g.score} />
            {(g.evidence || []).length > 0 && <div>{g.evidence.map((e, j) => <Chip key={j}>{e}</Chip>)}</div>}
            {g.maturity_warning && <div style={{ fontSize: 12, color: '#ff9f0a', lineHeight: 1.5, marginTop: 2 }}>⚠️ {g.maturity_warning}</div>}
            {g.validation_task && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginTop: 2 }}>✅ {g.validation_task}</div>}
          </div>
        ))}
        {(sg.likely_gifts || []).length === 0 && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>资料尚不足以辨识明显恩赐，请在测评中提供更多经历。</div>}
        {sg.summary && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginTop: 4 }}>{sg.summary}</div>}
      </div>

      {/* 3. 属灵果子 */}
      <div style={card}>
        <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between' }}>
          <span>🍇 属灵果子</span>
          {typeof fr.average_score === 'number' && <span style={{ color: scoreColor(fr.average_score) }}>均值 {Math.round(fr.average_score)}</span>}
        </div>
        {fr.scores && Object.entries(fr.scores).map(([k, v]) => <ScoreBar key={k} label={fZh[k] || k} value={v} />)}
        {(fr.supporting_fruits || []).length > 0 && <div style={{ marginTop: 6 }}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>较成熟：</span>{fr.supporting_fruits.map((x, i) => <Chip key={i} tone="ok">{x}</Chip>)}</div>}
        {(fr.growth_fruits || []).length > 0 && <div><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>待操练：</span>{fr.growth_fruits.map((x, i) => <Chip key={i} tone="warn">{x}</Chip>)}</div>}
        {(fr.gift_fruit_alignment || []).map((a, i) => (
          <div key={i} style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{a.gift_or_strength} · 需 {(a.supporting_fruits || []).join('、')}</div>
            {a.current_risk && <div style={{ fontSize: 12, color: '#ff9f0a', lineHeight: 1.5, marginTop: 3 }}>{a.current_risk}</div>}
            {a.growth_practice && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginTop: 2 }}>🌱 {a.growth_practice}</div>}
          </div>
        ))}
      </div>

      {/* 4. 使命负担 */}
      <div style={card}>
        <div style={sectionTitle}>🧭 使命负担模式</div>
        {cp.primary_pattern
          ? <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{cp.primary_pattern}</div>
          : <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>使命主题尚不明显，建议在祷告与小范围服事中继续观察。</div>}
        {(cp.secondary_patterns || []).length > 0 && <div style={{ marginBottom: 6 }}>{cp.secondary_patterns.map((x, i) => <Chip key={i}>{x}</Chip>)}</div>}
        {cp.possible_mission_sentence && (
          <div style={{ ...card, marginBottom: 8, background: ACCENT_DIM, border: '1px solid rgba(245,181,63,0.4)' }}>
            <div style={{ fontSize: 11, color: ACCENT, marginBottom: 3 }}>可探索的使命方向</div>
            <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.7 }}>{cp.possible_mission_sentence}</div>
          </div>
        )}
        {(cp.evidence || []).length > 0 && <div>{cp.evidence.map((x, i) => <Chip key={i}>{x}</Chip>)}</div>}
        {(cp.validation_path || []).length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>如何验证：</div>
            {cp.validation_path.map((x, i) => <div key={i} style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>· {x}</div>)}
          </div>
        )}
        {(cp.warnings || []).map((w, i) => <div key={i} style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 6 }}>※ {w}</div>)}
      </div>

      {/* 5. 误用风险 */}
      <div style={card}>
        <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠️ 恩赐误用风险</span>
          <span style={{ color: riskColor(mr.overall_risk_score) }}>总体 {Math.round(mr.overall_risk_score || 0)}</span>
        </div>
        {(mr.top_risks || []).map((rk, i) => (
          <div key={i} style={{ marginBottom: 10, padding: 10, borderRadius: 10, background: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{rk.risk}</span>
              <span style={{ fontSize: 12, color: riskColor(rk.score), fontWeight: 600 }}>{Math.round(rk.score || 0)}</span>
            </div>
            {rk.gospel_reframe && <div style={{ fontSize: 12, color: ACCENT, lineHeight: 1.6, marginTop: 4 }}>✝ {rk.gospel_reframe}</div>}
            {rk.practice && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginTop: 2 }}>🛠 {rk.practice}</div>}
          </div>
        ))}
        {(mr.protective_disciplines || []).length > 0 && <div style={{ marginTop: 4 }}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>护栏：</span>{mr.protective_disciplines.map((x, i) => <Chip key={i}>{x}</Chip>)}</div>}
        {(mr.warning_signs || []).length > 0 && <div><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>预警：</span>{mr.warning_signs.map((x, i) => <Chip key={i} tone="warn">{x}</Chip>)}</div>}
      </div>

      {/* 6. 服事匹配 */}
      <div style={card}>
        <div style={sectionTitle}>🤝 服事岗位匹配</div>
        {mm.top_ministry && (
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            最匹配：{mm.top_ministry}{typeof mm.top_match_score === 'number' && <span style={{ color: ACCENT, marginLeft: 6 }}>{Math.round(mm.top_match_score)}</span>}
          </div>
        )}
        {[...(mm.recommended_ministries || []), ...(mm.experimental_ministries || [])].map((m, i) => (
          <div key={i} style={{ marginBottom: 10, padding: 11, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e', background: LEVEL_COLOR[m.level] || '#888', borderRadius: 6, padding: '1px 7px' }}>{m.level}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{m.ministry}</span>
              {typeof m.match_score === 'number' && <span style={{ fontSize: 12, color: scoreColor(m.match_score) }}>{Math.round(m.match_score)}</span>}
            </div>
            {(m.matched_gifts || []).map((x, j) => <Chip key={'g' + j} tone="accent">{x}</Chip>)}
            {(m.fruit_requirements || []).map((x, j) => <Chip key={'f' + j} tone="ok">需{x}</Chip>)}
            {(m.risks || []).map((x, j) => <Chip key={'r' + j} tone="warn">{x}</Chip>)}
            {(m.safeguards || []).length > 0 && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginTop: 3 }}>🛡 {m.safeguards.join('；')}</div>}
            {m.first_step && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginTop: 2 }}>👣 {m.first_step}</div>}
          </div>
        ))}
        {(mm.not_recommended_now || []).length > 0 && (
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            暂不建议主责：{mm.not_recommended_now.map(x => x.ministry || x).join('、')}
          </div>
        )}
      </div>

      {/* 7. 成长计划 */}
      <div style={card}>
        <div style={sectionTitle}>🌱 30 / 90 / 180 天成长计划</div>
        {['30_days', '90_days', '180_days'].map(phase => {
          const p = (gp.plan_json || {})[phase]
          if (!p) return null
          const days = phase.split('_')[0]
          return (
            <div key={phase} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>{days} 天 · {p.theme || ''}</div>
              {Object.entries(p).filter(([k]) => k !== 'theme').map(([k, arr]) => (
                Array.isArray(arr) && arr.length > 0 && (
                  <div key={k} style={{ marginBottom: 3 }}>
                    {arr.map((x, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>· {x}</div>)}
                  </div>
                )
              ))}
            </div>
          )
        })}
        {(gp.weekly_rhythm || []).length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>节奏：</div>
            {gp.weekly_rhythm.map((w, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>· {w.day}：{w.practice}</div>)}
          </div>
        )}
        {(gp.success_indicators || []).length > 0 && <div style={{ marginTop: 6 }}>{gp.success_indicators.map((x, i) => <Chip key={i} tone="ok">{x}</Chip>)}</div>}
      </div>

      {/* 8. 共同体确认 */}
      {cc && (cc.recommended_reviewers || cc.count >= 0) && (
        <div style={card}>
          <div style={sectionTitle}>👥 共同体确认</div>
          {(cc.recommended_reviewers || []).length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>建议邀请：</span>
              {cc.recommended_reviewers.map((x, i) => <Chip key={i}>{x}</Chip>)}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{cc.alignment_analysis}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>在「反馈」标签邀请牧者、同工、被服事者填写。</div>
        </div>
      )}

      {/* 身份提醒 */}
      {r.identity_reminder && <Banner tone="identity">🕊 {r.identity_reminder}</Banner>}
      {r.boundary_notice && <Banner>{r.boundary_notice}</Banner>}
    </div>
  )
}

// ── 下拉建议 + 手动输入 组合控件 ───────────────────────────────────────────────
const comboBtn = {
  position: 'absolute', top: 6, right: 6, zIndex: 2, padding: '3px 9px', fontSize: 11.5,
  fontFamily: 'inherit', cursor: 'pointer', borderRadius: 7, whiteSpace: 'nowrap',
  border: '1px solid rgba(245,181,63,0.4)', background: ACCENT_DIM, color: ACCENT,
}
const comboPanel = {
  position: 'absolute', top: 34, right: 6, zIndex: 30, maxHeight: 240, overflowY: 'auto',
  minWidth: 200, maxWidth: 340, padding: 5, borderRadius: 10,
  border: '1px solid rgba(245,181,63,0.35)', background: '#1a1c24',
  boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
}
const comboItem = { padding: '7px 10px', fontSize: 12.5, color: 'rgba(255,255,255,0.85)', borderRadius: 7, cursor: 'pointer', lineHeight: 1.5 }

// 组合输入：可从「常见选项」下拉中选取（追加到内容），也可随时手动输入
function ComboField({ label, value, onChange, placeholder, options = [], multiline = true, minHeight = 64, sep = '；', required = false }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  function pick(opt) {
    const cur = (value || '').trim()
    const parts = cur ? cur.split(/[；;，,、\n]/).map(x => x.trim()).filter(Boolean) : []
    const v = t(opt)
    if (!parts.includes(v)) onChange(cur ? cur + sep + v : v)
    setOpen(false)
  }
  return (
    <div style={{ position: 'relative' }} ref={wrapRef}>
      {label && <label style={lbl}>{t(label)}{required ? ' *' : ''}</label>}
      <div style={{ position: 'relative' }}>
        {multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={t(placeholder)} style={{ ...ta, minHeight, paddingRight: 92 }} />
          : <input value={value} onChange={e => onChange(e.target.value)} placeholder={t(placeholder)} style={{ ...inp, paddingRight: 92 }} />}
        {options.length > 0 && (
          <button type="button" onClick={() => setOpen(o => !o)} style={comboBtn}>{t('常见选项')} ▾</button>
        )}
        {open && options.length > 0 && (
          <div style={comboPanel}>
            {options.map(opt => (
              <div key={opt} style={comboItem}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(opt)}
                onMouseEnter={e => { e.currentTarget.style.background = ACCENT_DIM }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >{t(opt)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 测评字段「常见选项」（按字段标签关键字匹配，兼容服务端返回的字段）
const ASSESS_OPTION_GROUPS = [
  { match: ['长期经历', '项目', '服事记录'], opts: ['长期带领小组 / 门徒训练', '主日讲道 / 教导圣经', '敬拜带领 / 音乐事奉', '儿童 / 青少年事工', '探访关怀 / 病床探访', '短宣 / 宣教经历', '行政 / 后勤 / 财务', '接待 / 招待新朋友', '祷告 / 代祷事奉', '文字 / 翻译 / 媒体', '怜悯 / 帮助弱势'] },
  { match: ['反复关注', '主题'], opts: ['如何更深认识神', '如何向身边人传福音', '教会合一与关系', '真理与异端的分辨', '苦难中神的旨意', '圣洁与对付罪', '家庭 / 婚姻中的信仰', '职场中作见证', '下一代信仰传承', '灵命枯干与复兴'] },
  { match: ['服事经历', '果效'], opts: ['有人因此信主 / 受洗', '帮助信徒回到教会', '小组人数稳定增长', '被服事者灵命成长', '同工关系得到医治', '带出新的服事同工', '暂未见明显果效仍坚持', '服事中自己被建造'] },
  { match: ['别人常请', '他人反馈'], opts: ['请我讲解圣经 / 解答信仰', '请我代祷', '找我倾诉 / 寻求安慰', '请我协调 / 调解关系', '请我组织 / 策划活动', '请我带新人 / 教技能', '称赞我有爱心 / 有耐心', '称赞我可靠 / 负责任'] },
  { match: ['愿意付代价', '你为谁'], opts: ['为失丧的灵魂得救', '为教会被建造', '为下一代的信仰', '为受苦 / 弱势的人', '为家人信主', '为真理被持守', '为神的荣耀', '为同工 / 朋友成长'] },
  { match: ['后天技能', '专业能力'], opts: ['教学 / 培训', '写作 / 文案', '音乐 / 乐器', '设计 / 影音剪辑', '编程 / 技术', '行政 / 项目管理', '财务 / 会计', '医疗 / 护理', '外语 / 翻译', '心理 / 辅导', '领导 / 管理'] },
  { match: ['压力下', '试探', '软弱'], opts: ['容易焦虑 / 担忧', '容易发怒 / 急躁', '倾向逃避 / 拖延', '在意人的称赞', '容易灰心 / 自我怀疑', '过度承担 / 难以拒绝', '骄傲 / 爱比较', '在情欲 / 私欲上挣扎', '冷淡 / 放弃祷告'] },
  { match: ['信仰历程', '灵修', '教会生活'], opts: ['从小在基督徒家庭长大', '成年后归主', '已受洗 / 固定聚会', '有稳定灵修读经习惯', '委身于一间地方教会', '在小组中被牧养', '经历过灵命低谷', '曾离开后又回到神', '正在寻求 / 慕道中'] },
]
function optionsForLabel(zh = '') {
  const g = ASSESS_OPTION_GROUPS.find(g => g.match.some(m => zh.includes(m)))
  return g ? g.opts : []
}

// 反馈 / 复盘「常见选项」
const FB_GIFT_OPTS = ['教导', '劝勉', '怜悯', '治理（带领）', '服事（帮助）', '给予', '信心', '智慧', '知识', '分辨诸灵', '传福音', '牧养', '款待', '祷告']
const FB_CONCERN_OPTS = ['表达过于直接', '缺乏耐心', '容易独断', '不易接受意见', '过度劳累 / 不会休息', '忽略家庭', '追求果效胜于关系', '不够主动', '容易灰心']
const FB_TEXT_OPTS = ['一次带人信主的经历', '一次教导 / 分享的经历', '一次关怀 / 探访的经历', '一次带领 / 组织的经历', '一次在软弱中仍坚持的经历']
const RV_OBS_OPTS = ['有人在服事中被造就 / 鼓励', '看见自己的恩赐被使用', '服事中遇到拦阻 / 挣扎', '团队配搭顺畅', '有新朋友加入', '自己灵里有些疲乏']
const RV_GRAT_OPTS = ['感谢神使用我', '感谢同工的配搭', '感谢看见生命改变', '感谢神在软弱中的恩典', '感谢有服事的机会']
const RV_REP_OPTS = ['在骄傲上需要对付', '忽略了祷告', '对人缺乏耐心', '追求称赞而非神的喜悦', '过度倚靠自己']
const RV_PRAY_OPTS = ['求主加添爱心与能力', '求主赐下合一', '求主医治关系', '求主使我谦卑', '求主感动更多同工']
const RV_ACTION_OPTS = ['下月做一次小组分享', '邀请一位新朋友', '固定每周代祷', '找牧者 / 导师交流', '安排适当休息']

// ── 测评表单 ─────────────────────────────────────────────────────────────────
function AssessForm({ meta, token, onDone }) {
  const fields = meta?.input_fields || []
  const [vals, setVals] = useState({})
  const [useAi, setUseAi] = useState(true)
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!ack) { setErr('请先确认神学边界说明'); return }
    setBusy(true); setErr('')
    try {
      const payload = { ...vals, use_ai: useAi, theological_boundary_ack: true }
      const r = await assessGift(payload, token)
      onDone(r)
    } catch (e) { setErr(e.message || '评估失败') } finally { setBusy(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
        诚实地写下你的长期经历、负担与挣扎。系统会辅助辨识天然优势、属灵恩赐、果子成熟度、使命方向、误用风险与服事方向，并给出成长计划。资料越具体，辨识越准。
      </div>
      {fields.map(f => (
        <ComboField
          key={f.key}
          label={f.zh}
          value={vals[f.key] || ''}
          onChange={val => setVals(v => ({ ...v, [f.key]: val }))}
          placeholder={f.zh}
          options={optionsForLabel(f.zh)}
        />
      ))}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', margin: '12px 0 4px', cursor: 'pointer' }}>
        <input type="checkbox" checked={useAi} onChange={e => setUseAi(e.target.checked)} />
        启用 AI 增强分析（关闭则用确定性分析）
      </label>
      <Banner>
        {meta?.boundary_notice}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#fff', marginTop: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} style={{ marginTop: 2 }} />
          我已理解：这是辅助辨识，不是最终呼召宣告。
        </label>
      </Banner>
      {err && <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 8 }}>{err}</div>}
      <button onClick={submit} disabled={busy || !ack} style={{ ...primaryBtn, width: '100%', opacity: (busy || !ack) ? 0.55 : 1 }}>
        {busy ? '🎁 分析中…' : '🎁 提交并分析'}
      </button>
    </div>
  )
}

// ── 共同体反馈 ───────────────────────────────────────────────────────────────
const SOURCE_OPTS = [
  ['pastor', '牧者'], ['elder', '长老'], ['small_group_leader', '小组长'], ['coworker', '同工'],
  ['recipient', '被服事者'], ['mentor', '属灵导师'], ['family', '家人'], ['friend', '朋友'], ['other', '其他'],
]
const FB_DIMS = [['clarity', '清晰'], ['edification', '造就'], ['love', '爱心'], ['humility', '谦卑'], ['reliability', '可靠']]

function FeedbackForm({ token }) {
  const [src, setSrc] = useState('coworker')
  const [scores, setScores] = useState({})
  const [gifts, setGifts] = useState('')
  const [concerns, setConcerns] = useState('')
  const [text, setText] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [data, setData] = useState(null)

  const load = () => fetchGiftFeedback(token).then(setData).catch(() => {})
  useEffect(() => { if (token) load() }, [token])

  async function submit() {
    setBusy(true); setErr('')
    try {
      await submitGiftFeedback({
        source_type: src, scores,
        confirmed_gifts: gifts.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
        concern_areas: concerns.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
        free_text_feedback: text, consent_given: consent,
      }, token)
      setScores({}); setGifts(''); setConcerns(''); setText(''); setConsent(false)
      load()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
        恩赐需要在基督身体中被验证。把此页转给牧者、同工或被服事者填写（1=明显不足，5=非常成熟）。
      </div>
      <label style={lbl}>反馈来源</label>
      <select value={src} onChange={e => setSrc(e.target.value)} style={inp}>
        {SOURCE_OPTS.map(([k, z]) => <option key={k} value={k} style={{ color: '#000' }}>{z}</option>)}
      </select>
      {FB_DIMS.map(([k, z]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
          <span style={{ width: 48, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>{z}</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setScores(s => ({ ...s, [k]: n }))} style={{
              width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid ' + ((scores[k] || 0) >= n ? ACCENT : 'rgba(255,255,255,0.15)'),
              background: (scores[k] || 0) >= n ? ACCENT_DIM : 'transparent',
              color: (scores[k] || 0) >= n ? ACCENT : 'rgba(255,255,255,0.5)', fontSize: 12.5,
            }}>{n}</button>
          ))}
        </div>
      ))}
      <ComboField label="你观察到的明显恩赐（逗号分隔）" value={gifts} onChange={setGifts} placeholder="如：教导、分辨" options={FB_GIFT_OPTS} multiline={false} sep="、" />
      <ComboField label="需要成长/留意之处（逗号分隔）" value={concerns} onChange={setConcerns} placeholder="如：表达过于直接" options={FB_CONCERN_OPTS} multiline={false} sep="、" />
      <ComboField label="具体例子 / 自由反馈" value={text} onChange={setText} placeholder="一个具体的服事例子…" options={FB_TEXT_OPTS} minHeight={70} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '8px 0', cursor: 'pointer' }}>
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> 同意将此反馈用于辅助辨识
      </label>
      {err && <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 8 }}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, width: '100%', opacity: busy ? 0.6 : 1 }}>{busy ? '提交中…' : '提交反馈'}</button>

      {data && data.count > 0 && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={sectionTitle}>📊 已收到 {data.count} 份反馈</div>
          {data.aggregate?.confirmed_gifts?.length > 0 && <div style={{ marginBottom: 6 }}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>共识恩赐：</span>{data.aggregate.confirmed_gifts.map((x, i) => <Chip key={i} tone="accent">{x}</Chip>)}</div>}
          {data.aggregate?.areas_of_concern?.length > 0 && <div><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>共识关注：</span>{data.aggregate.areas_of_concern.map((x, i) => <Chip key={i} tone="warn">{x}</Chip>)}</div>}
          {data.aggregate?.alignment_analysis && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginTop: 4 }}>{data.aggregate.alignment_analysis}</div>}
        </div>
      )}
    </div>
  )
}

// ── 复盘 ─────────────────────────────────────────────────────────────────────
const REVIEW_OPTS = [['self_review', '自我复盘'], ['pastoral_review', '牧者复盘'], ['community_review', '共同体复盘'], ['monthly_review', '月度复盘'], ['milestone_review', '里程碑复盘']]

function ReviewForm({ token }) {
  const [kind, setKind] = useState('self_review')
  const [obs, setObs] = useState('')
  const [grat, setGrat] = useState('')
  const [rep, setRep] = useState('')
  const [pray, setPray] = useState('')
  const [action, setAction] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [items, setItems] = useState([])

  const load = () => fetchGiftReviews(token).then(d => setItems(d.items || [])).catch(() => {})
  useEffect(() => { if (token) load() }, [token])

  async function submit() {
    if (!obs.trim()) { setErr('请至少写下本期观察'); return }
    setBusy(true); setErr('')
    try {
      await submitGiftReview({
        review_type: kind, observations: obs, gratitude_notes: grat,
        repentance_notes: rep, prayer_notes: pray,
        action_items: action.trim() ? [{ action: action.trim(), owner: 'user' }] : [],
      }, token)
      setObs(''); setGrat(''); setRep(''); setPray(''); setAction(''); load()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
        属灵恩赐不是测完就结束，而需长期验证。每周/每月记录服事中的观察、感恩、悔改与下一步。
      </div>
      <label style={lbl}>复盘类型</label>
      <select value={kind} onChange={e => setKind(e.target.value)} style={inp}>
        {REVIEW_OPTS.map(([k, z]) => <option key={k} value={k} style={{ color: '#000' }}>{z}</option>)}
      </select>
      <ComboField label="本期观察" required value={obs} onChange={setObs} placeholder="这段时间服事中我看见什么？人是否被造就？" options={RV_OBS_OPTS} minHeight={90} />
      <ComboField label="感恩" value={grat} onChange={setGrat} placeholder="为神的工作感恩…" options={RV_GRAT_OPTS} minHeight={56} />
      <ComboField label="悔改" value={rep} onChange={setRep} placeholder="需要向神承认与转向的…" options={RV_REP_OPTS} minHeight={56} />
      <ComboField label="祷告" value={pray} onChange={setPray} placeholder="主啊…" options={RV_PRAY_OPTS} minHeight={56} />
      <ComboField label="下一步行动" value={action} onChange={setAction} placeholder="如：下月做一次小组护教学分享" options={RV_ACTION_OPTS} multiline={false} />
      {err && <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 8 }}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, width: '100%', opacity: busy ? 0.6 : 1 }}>{busy ? '保存中…' : '保存复盘'}</button>

      {items.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {items.map(it => (
            <div key={it.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>{(REVIEW_OPTS.find(o => o[0] === it.review_type) || [, it.review_type])[1]}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{(it.created_at || '').slice(0, 10)}</span>
              </div>
              {it.observations && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{it.observations}</div>}
              {(it.action_items || []).map((a, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>👣 {a.action || a}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 历史 ─────────────────────────────────────────────────────────────────────
function HistoryList({ token, onOpen }) {
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  useEffect(() => { if (token) fetchGiftHistory(token, 30).then(d => setItems(d.items || [])).catch(() => setErr('加载失败')) }, [token])
  if (err) return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 20, textAlign: 'center' }}>{err}</div>
  if (items.length === 0) return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 20, textAlign: 'center' }}>还没有测评记录</div>
  return (
    <div>
      {items.map(it => (
        <div key={it.id} onClick={() => onOpen(it.id)} style={{ ...card, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{it.title || '恩赐与呼召分析'}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{(it.completed_at || it.created_at || '').slice(0, 10)}</span>
          </div>
          {it.summary && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{it.summary}</div>}
          <div style={{ marginTop: 4 }}><Chip tone="accent">置信度 {CONF_ZH[it.confidence] || it.confidence}</Chip></div>
        </div>
      ))}
    </div>
  )
}

// ── 主组件 ───────────────────────────────────────────────────────────────────
export default function GiftCallingView({ user, token }) {
  const [meta, setMeta] = useState(null)
  const [profile, setProfile] = useState(null)
  const [report, setReport] = useState(null)   // 当前展示的报告
  const [view, setView] = useState('dash')     // dash | assess | feedback | review | history
  const [err, setErr] = useState('')

  const loadProfile = () => token && fetchGiftProfile(token)
    .then(d => { setProfile(d.profile); if (d.profile?.has_assessment) setReport(d.profile) })
    .catch(() => {})

  useEffect(() => {
    fetchGiftMeta().then(setMeta).catch(() => setErr('加载失败'))
    loadProfile()
  }, [token])

  if (!user) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
      <div style={{ fontSize: 44 }}>🎁</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>恩赐与呼召识别</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>登录后开始辨识你的恩赐、果子与使命方向</div>
    </div>
  )
  if (!meta) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>{err || '加载中…'}</div>
  )

  const NAV = [
    { key: 'dash', label: '概览', emoji: '📊' },
    { key: 'assess', label: '测评', emoji: '✍️' },
    { key: 'feedback', label: '反馈', emoji: '👥' },
    { key: 'review', label: '复盘', emoji: '📈' },
    { key: 'history', label: '历史', emoji: '🕘' },
  ]

  async function openAssessment(id) {
    try { const d = await fetchGiftAssessment(id, token); setReport(d.report); setView('dash') } catch { /* ignore */ }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px 6px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setView(n.key)} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 16, cursor: 'pointer',
            border: '1px solid ' + (view === n.key ? ACCENT : 'rgba(255,255,255,0.12)'),
            background: view === n.key ? ACCENT_DIM : 'transparent',
            color: view === n.key ? '#fff' : 'rgba(255,255,255,0.6)',
            fontSize: 12.5, fontWeight: view === n.key ? 700 : 400, fontFamily: 'inherit',
          }}>{n.emoji} {n.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', minHeight: 0 }}>
        {view === 'dash' && (
          report
            ? <Report r={report} meta={meta} />
            : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎁</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>还没有分析报告</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 16 }}>完成一次测评，辨识你的优势、恩赐、果子、使命与服事方向。</div>
                <button onClick={() => setView('assess')} style={primaryBtn}>开始测评</button>
              </div>
            )
        )}
        {view === 'assess' && <AssessForm meta={meta} token={token} onDone={(r) => { setReport(r); loadProfile(); setView('dash') }} />}
        {view === 'feedback' && <FeedbackForm token={token} />}
        {view === 'review' && <ReviewForm token={token} />}
        {view === 'history' && <HistoryList token={token} onOpen={openAssessment} />}
      </div>
    </div>
  )
}
