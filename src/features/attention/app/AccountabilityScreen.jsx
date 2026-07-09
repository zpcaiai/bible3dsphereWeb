import React, { useEffect, useMemo, useState } from 'react'
import { attentionApi } from '../../../api'
import { AttentionCard } from '../components/attentionComponents'
import { PartnerStatusLabel, PrayerCategoryOptions, PrayerStatusLabel } from '../lib/accountability-types'

export default function AccountabilityScreen({ token, onBack, openPage }) {
  const [partners, setPartners] = useState([])
  const [invitations, setInvitations] = useState({ received: [], sent: [] })
  const [prayers, setPrayers] = useState([])
  const [shares, setShares] = useState([])
  const [partnerUserId, setPartnerUserId] = useState('')
  const [prayerTitle, setPrayerTitle] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [message, setMessage] = useState('')
  const activePartners = useMemo(() => partners.filter((item) => item.status === 'active'), [partners])

  async function load() {
    const [partnerData, inviteData, prayerData, shareData] = await Promise.all([
      attentionApi.partners({ status: 'all' }, token),
      attentionApi.partnerInvitations(token),
      attentionApi.prayerRequests({ status: 'open' }, token),
      attentionApi.shares({ box: 'sent' }, token),
    ])
    setPartners(partnerData.relationships || [])
    setInvitations(inviteData || { received: [], sent: [] })
    setPrayers(prayerData.prayerRequests || [])
    setShares(shareData.shares || [])
  }

  useEffect(() => {
    let cancelled = false
    load().catch(() => { if (!cancelled) setMessage('暂时无法加载同伴守望。') })
    return () => { cancelled = true }
  }, [token])

  async function invitePartner() {
    setMessage('')
    await attentionApi.invitePartner({ partnerUserId, message: '愿意和我一起温柔守望守心节奏吗？' }, token)
    setPartnerUserId('')
    await load()
    setMessage('守望邀请已发送。')
  }

  async function partnerAction(id, action) {
    await attentionApi.updatePartner(id, { action }, token)
    await load()
  }

  async function createPrayer() {
    setMessage('')
    await attentionApi.createPrayerRequest({
      targetUserId,
      title: prayerTitle,
      category: 'attention',
      visibilityLevel: 'summary',
      isSensitive: false,
    }, token)
    setPrayerTitle('')
    setTargetUserId('')
    await load()
    setMessage('代祷请求已发送。')
  }

  async function revokeShare(id) {
    await attentionApi.revokeShare(id, token)
    await load()
  }

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>返回守心首页</button>
        <h1>同伴守望</h1>
        <p>在你选择的边界内，与可信任的人同行；这里没有公开动态，也没有表现排名。</p>
      </header>

      {message ? <div className="attn-alert">{message}</div> : null}

      <section className="attn-grid">
        <AttentionCard title="邀请守望伙伴" actionLabel="隐私设置" onAction={() => openPage('privacy')}>
          <div className="attn-inline-form">
            <input value={partnerUserId} onChange={(e) => setPartnerUserId(e.target.value)} placeholder="伙伴邮箱" />
            <button className="attn-button" type="button" disabled={!partnerUserId.trim()} onClick={invitePartner}>发送邀请</button>
          </div>
          <p className="attn-muted">默认只分享完成状态。周报、评分和敏感内容必须手动选择后才会分享。</p>
        </AttentionCard>

        <AttentionCard title="守望邀请">
          <div className="attn-list">
            {(invitations.received || []).map((item) => (
              <div className="attn-list-item" key={item.id}>
                <strong>{item.requesterUser?.displayName || item.requesterUser?.id}</strong>
                <span>{item.requesterMessage || '邀请你成为守望伙伴。'}</span>
                <div className="attn-row-actions">
                  <button type="button" onClick={() => partnerAction(item.id, 'accept')}>接受</button>
                  <button type="button" onClick={() => partnerAction(item.id, 'decline')}>拒绝</button>
                </div>
              </div>
            ))}
            {!(invitations.received || []).length ? <p className="attn-muted">暂无待处理邀请。</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title="我的守望关系">
          <div className="attn-list">
            {partners.map((item) => {
              const peer = item.currentUserRole === 'requester' ? item.partnerUser : item.requesterUser
              return (
                <div className="attn-list-item" key={item.id}>
                  <strong>{peer?.displayName || peer?.id}</strong>
                  <span>{PartnerStatusLabel[item.status] || item.status}</span>
                  {item.status === 'active' ? (
                    <div className="attn-row-actions">
                      <button type="button" onClick={() => partnerAction(item.id, 'pause')}>暂停</button>
                      <button type="button" onClick={() => partnerAction(item.id, 'end')}>结束</button>
                    </div>
                  ) : null}
                </div>
              )
            })}
            {!partners.length ? <p className="attn-muted">还没有守望伙伴。</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title="发送代祷请求">
          <div className="attn-form-grid">
            <label>
              发送给
              <select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
                <option value="">选择 active 伙伴</option>
                {activePartners.map((item) => {
                  const peer = item.currentUserRole === 'requester' ? item.partnerUser : item.requesterUser
                  return <option key={item.id} value={peer?.id}>{peer?.displayName || peer?.id}</option>
                })}
              </select>
            </label>
            <label>
              分类
              <select disabled>
                {PrayerCategoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              代祷标题
              <input value={prayerTitle} onChange={(e) => setPrayerTitle(e.target.value)} placeholder="请为我今天的守心节奏祷告" />
            </label>
          </div>
          <button className="attn-button" type="button" disabled={!targetUserId || !prayerTitle.trim()} onClick={createPrayer}>发送代祷</button>
        </AttentionCard>

        <AttentionCard title="代祷请求">
          <div className="attn-list">
            {prayers.map((item) => (
              <div className="attn-list-item" key={item.id}>
                <strong>{item.title}</strong>
                <span>{PrayerStatusLabel[item.status] || item.status} · 已代祷 {item.prayedCount || 0}</span>
              </div>
            ))}
            {!prayers.length ? <p className="attn-muted">暂无开放代祷请求。</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title="已发送分享">
          <div className="attn-list">
            {shares.map((item) => (
              <div className="attn-list-item" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.revokedAt ? '已撤回' : item.visibilityLevel}</span>
                {!item.revokedAt ? <button type="button" onClick={() => revokeShare(item.id)}>撤回</button> : null}
              </div>
            ))}
            {!shares.length ? <p className="attn-muted">还没有手动分享的守心摘要。</p> : null}
          </div>
        </AttentionCard>
      </section>
    </main>
  )
}
