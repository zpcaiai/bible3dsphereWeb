import React, { useEffect, useMemo, useState } from 'react'
import { attentionApi } from '../../../api'
import { AttentionCard } from '../components/attentionComponents'
import { PartnerStatusLabel, PrayerCategoryOptions, PrayerStatusLabel } from '../lib/accountability-types'

const PERMISSION_OPTIONS = [
  ['canSeeDailyCovenantStatus', '今日立约状态'],
  ['canSeeFocusStatus', '专注状态'],
  ['canSeeReviewStatus', '复盘状态'],
  ['canSeeWeeklyReportSummary', '周报摘要'],
  ['canSeeScoreSummary', '评分摘要'],
  ['canSeeWarfarePlanProgress', '守心计划进展'],
  ['canSeePrayerRequests', '代祷请求'],
  ['canSendReminders', '发送提醒'],
]

function peerFor(relationship) {
  return relationship.currentUserRole === 'requester' ? relationship.partnerUser : relationship.requesterUser
}

export default function AccountabilityScreen({ token, onBack, openPage }) {
  const [partners, setPartners] = useState([])
  const [invitations, setInvitations] = useState({ received: [], sent: [] })
  const [prayers, setPrayers] = useState([])
  const [sentShares, setSentShares] = useState([])
  const [receivedShares, setReceivedShares] = useState([])
  const [reports, setReports] = useState([])
  const [privacy, setPrivacy] = useState(null)
  const [partnerUserId, setPartnerUserId] = useState('')
  const [prayerTitle, setPrayerTitle] = useState('')
  const [prayerBody, setPrayerBody] = useState('')
  const [prayerCategory, setPrayerCategory] = useState('attention')
  const [targetUserId, setTargetUserId] = useState('')
  const [selectedRelationshipId, setSelectedRelationshipId] = useState('')
  const [permissions, setPermissions] = useState(null)
  const [shareForm, setShareForm] = useState({ targetUserId: '', sourceId: '', includeTopPulls: false, includeNextPractice: true, customMessage: '' })
  const [sharePreview, setSharePreview] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const activePartners = useMemo(() => partners.filter((item) => item.status === 'active'), [partners])

  async function load() {
    const [partnerData, inviteData, prayerData, sentData, receivedData, reportData, privacyData] = await Promise.all([
      attentionApi.partners({ status: 'all' }, token),
      attentionApi.partnerInvitations(token),
      attentionApi.prayerRequests({ status: 'open' }, token),
      attentionApi.shares({ box: 'sent' }, token),
      attentionApi.shares({ box: 'received' }, token),
      attentionApi.weeklyReportHistory({ limit: 12 }, token),
      attentionApi.privacy(token),
    ])
    setPartners(partnerData.relationships || [])
    setInvitations(inviteData || { received: [], sent: [] })
    setPrayers(prayerData.prayerRequests || [])
    setSentShares(sentData.shares || [])
    setReceivedShares(receivedData.shares || [])
    setReports(reportData.reports || [])
    setPrivacy(privacyData.settings || null)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    load().catch(() => { if (!cancelled) setMessage('暂时无法加载同伴守望，请稍后重试。') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  async function run(action, success = '') {
    setBusy(true)
    setMessage('')
    try {
      const result = await action()
      await load()
      if (success) setMessage(typeof success === 'function' ? success(result) : success)
    } catch (error) {
      setMessage(error?.message || '操作未完成，请稍后重试。')
    } finally {
      setBusy(false)
    }
  }

  function invitePartner() {
    return run(async () => {
      await attentionApi.invitePartner({ partnerUserId, message: '愿意和我一起温柔守望守心节奏吗？' }, token)
      setPartnerUserId('')
    }, '守望邀请已发送。')
  }

  function partnerAction(id, action) {
    return run(() => attentionApi.updatePartner(id, { action }, token), '守望关系已更新。')
  }

  async function selectPermissions(id) {
    setSelectedRelationshipId(id)
    setPermissions(null)
    if (!id) return
    try {
      const data = await attentionApi.partnerPermissions(id, token)
      setPermissions(data.permissions)
    } catch (error) {
      setMessage(error?.message || '暂时无法加载伙伴权限。')
    }
  }

  function savePermissions() {
    return run(async () => {
      const data = await attentionApi.updatePartnerPermissions(selectedRelationshipId, permissions, token)
      setPermissions(data.permissions)
    }, '伙伴可见边界已保存。')
  }

  function createPrayer() {
    return run(async () => {
      const result = await attentionApi.createPrayerRequest({
        targetUserId,
        title: prayerTitle,
        body: prayerBody,
        category: prayerCategory,
        visibilityLevel: 'summary',
        isSensitive: false,
      }, token)
      setPrayerTitle('')
      setPrayerBody('')
      setTargetUserId('')
      return result
    }, (result) => result?.safetyNotice?.message || '代祷请求已发送。')
  }

  function sharePayload() {
    return {
      scope: 'partner',
      targetUserId: shareForm.targetUserId,
      sourceType: 'weekly_report',
      sourceId: shareForm.sourceId,
      visibilityLevel: 'summary',
      includeScore: Boolean(privacy?.shareScoresWithPartners && shareForm.includeScore),
      includeTopPulls: shareForm.includeTopPulls,
      includeNextPractice: shareForm.includeNextPractice,
      customMessage: shareForm.customMessage,
    }
  }

  async function previewShare() {
    const report = reports.find((item) => item.id === shareForm.sourceId)
    const partner = activePartners.map(peerFor).find((item) => item?.id === shareForm.targetUserId)
    if (!report || !partner) return
    setBusy(true)
    setMessage('')
    try {
      const data = await attentionApi.previewShare(sharePayload(), token)
      setSharePreview({ ...data.preview, partner: partner.displayName || partner.id, week: `${report.weekStart} 至 ${report.weekEnd}` })
    } catch (error) {
      setMessage(error?.message || '暂时无法生成分享预览。')
    } finally {
      setBusy(false)
    }
  }

  function createShare() {
    return run(async () => {
      await attentionApi.createShare(sharePayload(), token)
      setSharePreview(null)
      setShareForm({ targetUserId: '', sourceId: '', includeTopPulls: false, includeNextPractice: true, customMessage: '' })
    }, '周报摘要已按预览边界分享。')
  }

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>返回守心首页</button>
        <h1>同伴守望</h1>
        <p>在你选择的边界内，与可信任的人同行；这里没有公开动态，也没有表现排名。</p>
      </header>

      <div className="attn-privacy-banner" role="note">默认只分享完成状态；周报、评分和敏感内容不会自动公开，撤回后接收方将无法继续访问。</div>
      {message ? <div className="attn-alert" role="status">{message}</div> : null}
      {loading ? <div className="attn-loading">正在加载同伴守望…</div> : null}

      <section className="attn-grid">
        <AttentionCard title="邀请守望伙伴" actionLabel="隐私设置" onAction={() => openPage('privacy')}>
          <div className="attn-inline-form">
            <label className="attn-sr-only" htmlFor="attention-partner-email">伙伴邮箱</label>
            <input id="attention-partner-email" type="email" value={partnerUserId} onChange={(e) => setPartnerUserId(e.target.value)} placeholder="伙伴邮箱" />
            <button className="attn-button" type="button" disabled={busy || !partnerUserId.trim()} onClick={invitePartner}>发送邀请</button>
          </div>
        </AttentionCard>

        <AttentionCard title="守望邀请">
          <div className="attn-list">
            {(invitations.received || []).map((item) => (
              <div className="attn-list-item" key={item.id}>
                <strong>{item.requesterUser?.displayName || item.requesterUser?.id}</strong>
                <span>{item.requesterMessage || '邀请你成为守望伙伴。'}</span>
                <div className="attn-row-actions">
                  <button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'accept')}>接受</button>
                  <button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'decline')}>拒绝</button>
                </div>
              </div>
            ))}
            {!(invitations.received || []).length ? <p className="attn-muted">暂无待处理邀请。</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title="我的守望关系">
          <div className="attn-list">
            {partners.map((item) => (
              <div className="attn-list-item" key={item.id}>
                <strong>{peerFor(item)?.displayName || peerFor(item)?.id}</strong>
                <span>{PartnerStatusLabel[item.status] || item.status}</span>
                {item.status === 'active' ? <div className="attn-row-actions"><button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'pause')}>暂停</button><button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'end')}>结束</button></div> : null}
                {item.status === 'paused' ? <button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'resume')}>恢复同行</button> : null}
              </div>
            ))}
            {!partners.length ? <p className="attn-muted">还没有守望伙伴。</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title="伙伴可见边界">
          <div className="attn-form-grid">
            <label>选择伙伴<select value={selectedRelationshipId} onChange={(event) => selectPermissions(event.target.value)}><option value="">选择 active 伙伴</option>{activePartners.map((item) => <option key={item.id} value={item.id}>{peerFor(item)?.displayName || peerFor(item)?.id}</option>)}</select></label>
          </div>
          {permissions ? <div className="attn-toggle-list">{PERMISSION_OPTIONS.map(([key, label]) => <label className="attn-toggle" key={key}><input type="checkbox" checked={Boolean(permissions[key])} onChange={(event) => setPermissions((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}<button className="attn-button" type="button" disabled={busy} onClick={savePermissions}>保存伙伴边界</button></div> : <p className="attn-muted">选择一位同行中的伙伴后，可以逐项控制可见内容。</p>}
        </AttentionCard>

        <AttentionCard title="分享周报摘要">
          <div className="attn-form-grid">
            <label>分享给<select value={shareForm.targetUserId} onChange={(event) => setShareForm((current) => ({ ...current, targetUserId: event.target.value }))}><option value="">选择 active 伙伴</option>{activePartners.map((item) => <option key={item.id} value={peerFor(item)?.id}>{peerFor(item)?.displayName || peerFor(item)?.id}</option>)}</select></label>
            <label>选择周报<select value={shareForm.sourceId} onChange={(event) => setShareForm((current) => ({ ...current, sourceId: event.target.value }))}><option value="">选择已生成周报</option>{reports.map((item) => <option key={item.id} value={item.id}>{item.weekStart} 至 {item.weekEnd}</option>)}</select></label>
            <label>给伙伴的一句话<input maxLength={1000} value={shareForm.customMessage} onChange={(event) => setShareForm((current) => ({ ...current, customMessage: event.target.value }))} /></label>
          </div>
          <div className="attn-toggle-list">
            <label className="attn-toggle"><input type="checkbox" checked={shareForm.includeTopPulls} onChange={(event) => setShareForm((current) => ({ ...current, includeTopPulls: event.target.checked }))} /><span>包含已脱敏的主要牵引</span></label>
            <label className="attn-toggle"><input type="checkbox" checked={shareForm.includeNextPractice} onChange={(event) => setShareForm((current) => ({ ...current, includeNextPractice: event.target.checked }))} /><span>包含下周操练</span></label>
            <label className="attn-toggle"><input type="checkbox" disabled={!privacy?.shareScoresWithPartners} checked={Boolean(shareForm.includeScore)} onChange={(event) => setShareForm((current) => ({ ...current, includeScore: event.target.checked }))} /><span>包含评分摘要{privacy?.shareScoresWithPartners ? '' : '（隐私设置已关闭）'}</span></label>
          </div>
          <button className="attn-button" type="button" disabled={busy || !shareForm.targetUserId || !shareForm.sourceId} onClick={previewShare}>{busy ? '正在生成预览…' : '预览分享'}</button>
          {sharePreview ? <div className="attn-share-preview" role="dialog" aria-label="分享预览"><h4>分享预览</h4><p>接收人：{sharePreview.partner}</p><p>周报：{sharePreview.week}</p><p>{sharePreview.summary}</p><p>评分：{sharePreview.scoreIncluded ? '包含' : '不包含'} · 敏感项脱敏：{sharePreview.sensitiveRedactions?.length ? `${sharePreview.sensitiveRedactions.length} 项` : '无'}</p><div className="attn-row-actions"><button className="attn-button" type="button" disabled={busy} onClick={createShare}>确认分享</button><button type="button" onClick={() => setSharePreview(null)}>返回修改</button></div></div> : null}
        </AttentionCard>

        <AttentionCard title="发送代祷请求">
          <div className="attn-form-grid">
            <label>发送给<select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}><option value="">选择 active 伙伴</option>{activePartners.map((item) => <option key={item.id} value={peerFor(item)?.id}>{peerFor(item)?.displayName || peerFor(item)?.id}</option>)}</select></label>
            <label>分类<select value={prayerCategory} onChange={(event) => setPrayerCategory(event.target.value)}>{PrayerCategoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>代祷标题<input value={prayerTitle} onChange={(e) => setPrayerTitle(e.target.value)} placeholder="请为我今天的守心节奏祷告" /></label>
            <label>可选说明<textarea rows={3} maxLength={2000} value={prayerBody} onChange={(event) => setPrayerBody(event.target.value)} /></label>
          </div>
          <button className="attn-button" type="button" disabled={busy || !targetUserId || !prayerTitle.trim()} onClick={createPrayer}>发送代祷</button>
        </AttentionCard>

        <AttentionCard title="代祷请求">
          <div className="attn-list">{prayers.map((item) => <div className="attn-list-item" key={item.id}><strong>{item.isSensitive ? '一项敏感代祷需要' : item.title}</strong><span>{PrayerStatusLabel[item.status] || item.status} · 已代祷 {item.prayedCount || 0}</span>{!item.hasCurrentUserPrayed ? <button type="button" disabled={busy} onClick={() => run(() => attentionApi.markPrayerRequestPrayed(item.id, {}, token), '已记录这次代祷。')}>我已代祷</button> : <span>你已代祷</span>}</div>)}{!prayers.length ? <p className="attn-muted">暂无开放代祷请求。</p> : null}</div>
        </AttentionCard>

        <AttentionCard title="收到的分享">
          <div className="attn-list">{receivedShares.map((item) => <div className="attn-list-item" key={item.id}><strong>{item.title}</strong><span>{item.summary || '只包含对方选择公开的守心摘要。'}</span></div>)}{!receivedShares.length ? <p className="attn-muted">还没有收到守心摘要。</p> : null}</div>
        </AttentionCard>

        <AttentionCard title="已发送分享">
          <div className="attn-list">{sentShares.map((item) => <div className="attn-list-item" key={item.id}><strong>{item.title}</strong><span>{item.revokedAt ? '已撤回' : '分享中'}</span>{!item.revokedAt ? <button type="button" disabled={busy} onClick={() => run(() => attentionApi.revokeShare(item.id, token), '分享已撤回。')}>撤回</button> : null}</div>)}{!sentShares.length ? <p className="attn-muted">还没有手动分享的守心摘要。</p> : null}</div>
        </AttentionCard>
      </section>
    </main>
  )
}
