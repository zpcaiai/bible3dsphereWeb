import React, { useEffect, useMemo, useState } from 'react'
import { attentionApi } from '../../../api'
import { AttentionCard } from '../components/attentionComponents'
import { ChallengePrivacyLabel } from '../lib/challenge-types'
import { GroupRoleLabel, GroupTypeLabel } from '../lib/group-types'

function todayIso(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export default function GroupsScreen({ token, onBack, openPage }) {
  const [groups, setGroups] = useState([])
  const [templates, setTemplates] = useState([])
  const [myChallenges, setMyChallenges] = useState([])
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [message, setMessage] = useState('')
  const firstGroup = useMemo(() => groups[0], [groups])

  async function load() {
    const [groupData, templateData, challengeData] = await Promise.all([
      attentionApi.groups(token),
      attentionApi.challengeTemplates(token),
      attentionApi.myChallenges(token),
    ])
    setGroups(groupData.groups || [])
    setTemplates(templateData.templates || [])
    setMyChallenges(challengeData.challenges || [])
  }

  useEffect(() => {
    let cancelled = false
    load().catch(() => { if (!cancelled) setMessage('暂时无法加载守心小组。') })
    return () => { cancelled = true }
  }, [token])

  async function createGroup() {
    await attentionApi.createGroup({
      name,
      groupType: 'private',
      defaultMemberVisibility: 'status_only',
      guidelines: '彼此提醒，不比较，不公开软弱。',
    }, token)
    setName('')
    await load()
    setMessage('守心小组已创建。')
  }

  async function joinGroup() {
    await attentionApi.joinGroup({ inviteCode }, token)
    setInviteCode('')
    await load()
    setMessage('已加入守心小组。')
  }

  async function createTemplateChallenge(template) {
    if (!firstGroup) return
    await attentionApi.createGroupChallenge(firstGroup.id, {
      templateKey: template.key,
      title: template.title,
      description: template.description,
      challengeType: template.challengeType,
      startDate: todayIso(0),
      endDate: todayIso((template.suggestedDurationDays || 7) - 1),
      targetDays: template.defaultTargetDays,
      targetMinutes: template.defaultTargetMinutes,
      checkinPrompt: template.checkinPrompt,
      privacyMode: template.privacyMode || 'status_only',
    }, token)
    await load()
    setMessage('小组挑战已创建。')
  }

  async function checkin(challenge) {
    await attentionApi.saveChallengeCheckin(challenge.groupId, challenge.id, {
      completed: true,
      visibilityLevel: challenge.privacyMode === 'summary' ? 'summary' : 'status_only',
    }, token)
    await load()
  }

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>返回守心首页</button>
        <h1>守心小组</h1>
        <p>小组挑战只显示整体节奏和非排名进展。它不是排行榜，也不是公开动态。</p>
      </header>

      {message ? <div className="attn-alert">{message}</div> : null}

      <section className="attn-grid">
        <AttentionCard title="创建小组" actionLabel="隐私设置" onAction={() => openPage('privacy')}>
          <div className="attn-inline-form">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：周三守心同行" />
            <button className="attn-button" type="button" disabled={!name.trim()} onClick={createGroup}>创建</button>
          </div>
        </AttentionCard>

        <AttentionCard title="加入小组">
          <div className="attn-inline-form">
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="邀请码" />
            <button className="attn-button" type="button" disabled={!inviteCode.trim()} onClick={joinGroup}>加入</button>
          </div>
        </AttentionCard>

        <AttentionCard title="我的小组">
          <div className="attn-list">
            {groups.map((group) => (
              <div className="attn-list-item" key={group.id}>
                <strong>{group.name}</strong>
                <span>{GroupTypeLabel[group.groupType] || group.groupType} · {GroupRoleLabel[group.currentUserRole] || group.currentUserRole}</span>
                <span>{group.membersCount || 0} 位成员 · {group.activeChallengesCount || 0} 个挑战</span>
                {group.inviteCode ? <code>邀请码：{group.inviteCode}</code> : null}
              </div>
            ))}
            {!groups.length ? <p className="attn-muted">还没有守心小组。</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title="我的挑战">
          <div className="attn-list">
            {myChallenges.map((challenge) => (
              <div className="attn-list-item" key={challenge.id}>
                <strong>{challenge.title}</strong>
                <span>{ChallengePrivacyLabel[challenge.privacyMode] || challenge.privacyMode} · 完成 {challenge.progress?.completedCheckins || 0} 次</span>
                <span>{challenge.progress?.encouragementText}</span>
                <button type="button" onClick={() => checkin(challenge)}>今日 Check-in</button>
              </div>
            ))}
            {!myChallenges.length ? <p className="attn-muted">还没有参与中的挑战。</p> : null}
          </div>
        </AttentionCard>
      </section>

      <section className="attn-section">
        <h2>温柔挑战模板</h2>
        <div className="attn-grid compact">
          {templates.map((template) => (
            <AttentionCard key={template.key} title={template.title} actionLabel={firstGroup ? '创建挑战' : ''} onAction={() => createTemplateChallenge(template)}>
              <p>{template.description}</p>
              <p className="attn-muted">{template.gentleGuideline}</p>
            </AttentionCard>
          ))}
        </div>
      </section>
    </main>
  )
}
