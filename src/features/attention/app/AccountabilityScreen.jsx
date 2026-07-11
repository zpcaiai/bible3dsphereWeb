import React, { useEffect, useMemo, useState } from 'react'
import { attentionApi } from '../../../api'
import { AttentionCard } from '../components/attentionComponents'
import { PartnerStatusLabel, PrayerCategoryOptions, PrayerStatusLabel } from '../lib/accountability-types'
import { t as i18nT } from '../../../i18n/runtime'

const PERMISSION_OPTIONS = [
  ['canSeeDailyCovenantStatus', i18nT('今日立约状态')],
  ['canSeeFocusStatus', i18nT('专注状态')],
  ['canSeeReviewStatus', i18nT('复盘状态')],
  ['canSeeWeeklyReportSummary', i18nT('周报摘要')],
  ['canSeeScoreSummary', i18nT('评分摘要')],
  ['canSeeWarfarePlanProgress', i18nT('守心计划进展')],
  ['canSeePrayerRequests', i18nT('代祷请求')],
  ['canSendReminders', i18nT('发送提醒')],
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
    load().catch(() => { if (!cancelled) setMessage(i18nT('暂时无法加载同伴守望，请稍后重试。')) })
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
      setMessage(error?.message || i18nT('操作未完成，请稍后重试。'))
    } finally {
      setBusy(false)
    }
  }

  function invitePartner() {
    return run(async () => {
      await attentionApi.invitePartner({ partnerUserId, message: i18nT('愿意和我一起温柔守望守心节奏吗？') }, token)
      setPartnerUserId('')
    }, i18nT('守望邀请已发送。'))
  }

  function partnerAction(id, action) {
    return run(() => attentionApi.updatePartner(id, { action }, token), i18nT('守望关系已更新。'))
  }

  async function selectPermissions(id) {
    setSelectedRelationshipId(id)
    setPermissions(null)
    if (!id) return
    try {
      const data = await attentionApi.partnerPermissions(id, token)
      setPermissions(data.permissions)
    } catch (error) {
      setMessage(error?.message || i18nT('暂时无法加载伙伴权限。'))
    }
  }

  function savePermissions() {
    return run(async () => {
      const data = await attentionApi.updatePartnerPermissions(selectedRelationshipId, permissions, token)
      setPermissions(data.permissions)
    }, i18nT('伙伴可见边界已保存。'))
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
    }, (result) => result?.safetyNotice?.message || i18nT('代祷请求已发送。'))
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
      setSharePreview({
        ...data.preview,
        partner: partner.displayName || partner.id,
        week: i18nT('{start} 至 {end}', { start: report.weekStart, end: report.weekEnd }),
      })
    } catch (error) {
      setMessage(error?.message || i18nT('暂时无法生成分享预览。'))
    } finally {
      setBusy(false)
    }
  }

  function createShare() {
    return run(async () => {
      await attentionApi.createShare(sharePayload(), token)
      setSharePreview(null)
      setShareForm({ targetUserId: '', sourceId: '', includeTopPulls: false, includeNextPractice: true, customMessage: '' })
    }, i18nT('周报摘要已按预览边界分享。'))
  }

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>{i18nT("返回守心首页")}</button>
        <h1>{i18nT("同伴守望")}</h1>
        <p>{i18nT("在你选择的边界内，与可信任的人同行；这里没有公开动态，也没有表现排名。")}</p>
      </header>

      <div className="attn-privacy-banner" role="note">{i18nT("默认只分享完成状态；周报、评分和敏感内容不会自动公开，撤回后接收方将无法继续访问。")}</div>
      {message ? <div className="attn-alert" role="status">{message}</div> : null}
      {loading ? <div className="attn-loading">{i18nT("正在加载同伴守望…")}</div> : null}

      <section className="attn-grid">
        <AttentionCard title={i18nT("邀请守望伙伴")} actionLabel={i18nT("隐私设置")} onAction={() => openPage('privacy')}>
          <div className="attn-inline-form">
            <label className="attn-sr-only" htmlFor="attention-partner-email">{i18nT("伙伴邮箱")}</label>
            <input id="attention-partner-email" type="email" value={partnerUserId} onChange={(e) => setPartnerUserId(e.target.value)} placeholder={i18nT("伙伴邮箱")}  aria-label={i18nT("伙伴邮箱")}/>
            <button className="attn-button" type="button" disabled={busy || !partnerUserId.trim()} onClick={invitePartner}>{i18nT("发送邀请")}</button>
          </div>
        </AttentionCard>

        <AttentionCard title={i18nT("守望邀请")}>
          <div className="attn-list">
            {(invitations.received || []).map((item) => (
              <div className="attn-list-item" key={item.id}>
                <strong>{item.requesterUser?.displayName || item.requesterUser?.id}</strong>
                <span>{item.requesterMessage || i18nT('邀请你成为守望伙伴。')}</span>
                <div className="attn-row-actions">
                  <button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'accept')}>{i18nT("接受")}</button>
                  <button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'decline')}>{i18nT("拒绝")}</button>
                </div>
              </div>
            ))}
            {!(invitations.received || []).length ? <p className="attn-muted">{i18nT("暂无待处理邀请。")}</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title={i18nT("我的守望关系")}>
          <div className="attn-list">
            {partners.map((item) => (
              <div className="attn-list-item" key={item.id}>
                <strong>{peerFor(item)?.displayName || peerFor(item)?.id}</strong>
                <span>{PartnerStatusLabel[item.status] || item.status}</span>
                {item.status === 'active' ? <div className="attn-row-actions"><button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'pause')}>{i18nT("暂停")}</button><button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'end')}>{i18nT("结束")}</button></div> : null}
                {item.status === 'paused' ? <button type="button" disabled={busy} onClick={() => partnerAction(item.id, 'resume')}>{i18nT("恢复同行")}</button> : null}
              </div>
            ))}
            {!partners.length ? <p className="attn-muted">{i18nT("还没有守望伙伴。")}</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title={i18nT("伙伴可见边界")}>
          <div className="attn-form-grid">
            <label>{i18nT("选择伙伴")}<select value={selectedRelationshipId} onChange={(event) => selectPermissions(event.target.value)}><option value="">{i18nT("选择 active 伙伴")}</option>{activePartners.map((item) => <option key={item.id} value={item.id}>{peerFor(item)?.displayName || peerFor(item)?.id}</option>)}</select></label>
          </div>
          {permissions ? <div className="attn-toggle-list">{PERMISSION_OPTIONS.map(([key, label]) => <label className="attn-toggle" key={key}><input type="checkbox" checked={Boolean(permissions[key])} onChange={(event) => setPermissions((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}<button className="attn-button" type="button" disabled={busy} onClick={savePermissions}>{i18nT("保存伙伴边界")}</button></div> : <p className="attn-muted">{i18nT("选择一位同行中的伙伴后，可以逐项控制可见内容。")}</p>}
        </AttentionCard>

        <AttentionCard title={i18nT("分享周报摘要")}>
          <div className="attn-form-grid">
            <label>{i18nT("分享给")}<select value={shareForm.targetUserId} onChange={(event) => setShareForm((current) => ({ ...current, targetUserId: event.target.value }))}><option value="">{i18nT("选择 active 伙伴")}</option>{activePartners.map((item) => <option key={item.id} value={peerFor(item)?.id}>{peerFor(item)?.displayName || peerFor(item)?.id}</option>)}</select></label>
            <label>{i18nT("选择周报")}<select value={shareForm.sourceId} onChange={(event) => setShareForm((current) => ({ ...current, sourceId: event.target.value }))}><option value="">{i18nT("选择已生成周报")}</option>{reports.map((item) => <option key={item.id} value={item.id}>{item.weekStart} {i18nT("至")} {item.weekEnd}</option>)}</select></label>
            <label>{i18nT("给伙伴的一句话")}<input maxLength={1000} value={shareForm.customMessage} onChange={(event) => setShareForm((current) => ({ ...current, customMessage: event.target.value }))} /></label>
          </div>
          <div className="attn-toggle-list">
            <label className="attn-toggle"><input type="checkbox" checked={shareForm.includeTopPulls} onChange={(event) => setShareForm((current) => ({ ...current, includeTopPulls: event.target.checked }))} /><span>{i18nT("包含已脱敏的主要牵引")}</span></label>
            <label className="attn-toggle"><input type="checkbox" checked={shareForm.includeNextPractice} onChange={(event) => setShareForm((current) => ({ ...current, includeNextPractice: event.target.checked }))} /><span>{i18nT("包含下周操练")}</span></label>
            <label className="attn-toggle"><input type="checkbox" disabled={!privacy?.shareScoresWithPartners} checked={Boolean(shareForm.includeScore)} onChange={(event) => setShareForm((current) => ({ ...current, includeScore: event.target.checked }))} /><span>{i18nT("包含评分摘要")}{privacy?.shareScoresWithPartners ? '' : i18nT('（隐私设置已关闭）')}</span></label>
          </div>
          <button className="attn-button" type="button" disabled={busy || !shareForm.targetUserId || !shareForm.sourceId} onClick={previewShare}>{busy ? i18nT('正在生成预览…') : i18nT('预览分享')}</button>
          {sharePreview ? <div className="attn-share-preview" role="dialog" aria-label={i18nT("分享预览")}><h4>{i18nT("分享预览")}</h4><p>{i18nT("接收人：")}{sharePreview.partner}</p><p>{i18nT("周报：")}{sharePreview.week}</p><p>{sharePreview.summary}</p><p>{i18nT("评分：")}{sharePreview.scoreIncluded ? i18nT('包含') : i18nT('不包含')} {i18nT("· 敏感项脱敏：")}{sharePreview.sensitiveRedactions?.length ? i18nT('{count} 项', { count: sharePreview.sensitiveRedactions.length }) : i18nT('无')}</p><div className="attn-row-actions"><button className="attn-button" type="button" disabled={busy} onClick={createShare}>{i18nT("确认分享")}</button><button type="button" onClick={() => setSharePreview(null)}>{i18nT("返回修改")}</button></div></div> : null}
        </AttentionCard>

        <AttentionCard title={i18nT("发送代祷请求")}>
          <div className="attn-form-grid">
            <label>{i18nT("发送给")}<select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}><option value="">{i18nT("选择 active 伙伴")}</option>{activePartners.map((item) => <option key={item.id} value={peerFor(item)?.id}>{peerFor(item)?.displayName || peerFor(item)?.id}</option>)}</select></label>
            <label>{i18nT("分类")}<select value={prayerCategory} onChange={(event) => setPrayerCategory(event.target.value)}>{PrayerCategoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>{i18nT("代祷标题")}<input value={prayerTitle} onChange={(e) => setPrayerTitle(e.target.value)} placeholder={i18nT("请为我今天的守心节奏祷告")}  aria-label={i18nT("请为我今天的守心节奏祷告")}/></label>
            <label>{i18nT("可选说明")}<textarea rows={3} maxLength={2000} value={prayerBody} onChange={(event) => setPrayerBody(event.target.value)} /></label>
          </div>
          <button className="attn-button" type="button" disabled={busy || !targetUserId || !prayerTitle.trim()} onClick={createPrayer}>{i18nT("发送代祷")}</button>
        </AttentionCard>

        <AttentionCard title={i18nT("代祷请求")}>
          <div className="attn-list">{prayers.map((item) => <div className="attn-list-item" key={item.id}><strong>{item.isSensitive ? i18nT('一项敏感代祷需要') : item.title}</strong><span>{PrayerStatusLabel[item.status] || item.status} {i18nT("· 已代祷")} {item.prayedCount || 0}</span>{!item.hasCurrentUserPrayed ? <button type="button" disabled={busy} onClick={() => run(() => attentionApi.markPrayerRequestPrayed(item.id, {}, token), i18nT('已记录这次代祷。'))}>{i18nT("我已代祷")}</button> : <span>{i18nT("你已代祷")}</span>}</div>)}{!prayers.length ? <p className="attn-muted">{i18nT("暂无开放代祷请求。")}</p> : null}</div>
        </AttentionCard>

        <AttentionCard title={i18nT("收到的分享")}>
          <div className="attn-list">{receivedShares.map((item) => <div className="attn-list-item" key={item.id}><strong>{item.title}</strong><span>{item.summary || i18nT('只包含对方选择公开的守心摘要。')}</span></div>)}{!receivedShares.length ? <p className="attn-muted">{i18nT("还没有收到守心摘要。")}</p> : null}</div>
        </AttentionCard>

        <AttentionCard title={i18nT("已发送分享")}>
          <div className="attn-list">{sentShares.map((item) => <div className="attn-list-item" key={item.id}><strong>{item.title}</strong><span>{item.revokedAt ? i18nT('已撤回') : i18nT('分享中')}</span>{!item.revokedAt ? <button type="button" disabled={busy} onClick={() => run(() => attentionApi.revokeShare(item.id, token), i18nT('分享已撤回。'))}>{i18nT("撤回")}</button> : null}</div>)}{!sentShares.length ? <p className="attn-muted">{i18nT("还没有手动分享的守心摘要。")}</p> : null}</div>
        </AttentionCard>
      </section>
    </main>
  )
}
