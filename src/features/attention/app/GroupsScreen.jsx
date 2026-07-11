import React, { useEffect, useMemo, useState } from 'react'
import { attentionApi } from '../../../api'
import { AttentionCard } from '../components/attentionComponents'
import { ChallengePrivacyLabel } from '../lib/challenge-types'
import { GroupRoleLabel, GroupTypeLabel } from '../lib/group-types'
import { t as i18nT } from '../../../i18n/runtime'

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
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [members, setMembers] = useState([])
  const [groupChallenges, setGroupChallenges] = useState([])
  const [participantView, setParticipantView] = useState(null)
  const [busy, setBusy] = useState(false)
  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) || groups[0], [groups, selectedGroupId])

  async function load() {
    const [groupData, templateData, challengeData] = await Promise.all([
      attentionApi.groups(token),
      attentionApi.challengeTemplates(token),
      attentionApi.myChallenges(token),
    ])
    setGroups(groupData.groups || [])
    setTemplates(templateData.templates || [])
    setMyChallenges(challengeData.challenges || [])
    if (!selectedGroupId && groupData.groups?.[0]) setSelectedGroupId(groupData.groups[0].id)
  }

  useEffect(() => {
    let cancelled = false
    load().catch(() => { if (!cancelled) setMessage(i18nT('暂时无法加载守心小组。')) })
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!selectedGroup?.id) {
      setMembers([])
      setGroupChallenges([])
      return
    }
    let cancelled = false
    Promise.all([
      attentionApi.groupMembers(selectedGroup.id, token),
      attentionApi.groupChallenges(selectedGroup.id, token),
    ]).then(([memberData, challengeData]) => {
      if (cancelled) return
      setMembers(memberData.members || [])
      setGroupChallenges(challengeData.challenges || [])
    }).catch((error) => { if (!cancelled) setMessage(error?.message || i18nT('暂时无法加载小组详情。')) })
    return () => { cancelled = true }
  }, [selectedGroup?.id, token])

  async function run(action, success = '') {
    setBusy(true)
    setMessage('')
    try {
      await action()
      await load()
      if (success) setMessage(success)
    } catch (error) {
      setMessage(error?.message || i18nT('操作未完成，请稍后重试。'))
    } finally {
      setBusy(false)
    }
  }

  async function createGroup() {
    await run(async () => {
      const result = await attentionApi.createGroup({
      name,
      groupType: 'private',
      defaultMemberVisibility: 'status_only',
      guidelines: i18nT('彼此提醒，不比较，不公开软弱。'),
      }, token)
      setName('')
      if (result.group?.id) setSelectedGroupId(result.group.id)
    }, i18nT('守心小组已创建。'))
  }

  async function joinGroup() {
    await run(async () => {
      const result = await attentionApi.joinGroup({ inviteCode }, token)
      setInviteCode('')
      if (result.group?.id) setSelectedGroupId(result.group.id)
    }, i18nT('已加入守心小组。'))
  }

  async function createTemplateChallenge(template) {
    if (!selectedGroup) return
    await run(() => attentionApi.createGroupChallenge(selectedGroup.id, {
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
    }, token), i18nT('小组挑战已创建。'))
  }

  async function checkin(challenge) {
    await run(() => attentionApi.saveChallengeCheckin(challenge.groupId, challenge.id, {
      completed: true,
      visibilityLevel: challenge.privacyMode === 'summary' ? 'summary' : 'status_only',
    }, token), i18nT('今日 Check-in 已保存。'))
  }

  async function showParticipants(challenge) {
    setParticipantView({ challenge, loading: true, participants: [], progress: challenge.progress })
    try {
      const data = await attentionApi.challengeParticipants(challenge.groupId, challenge.id, token)
      setParticipantView({ challenge, loading: false, participants: data.participants || [], progress: data.progress || challenge.progress })
    } catch (error) {
      setParticipantView(null)
      setMessage(error?.message || i18nT('暂时无法加载挑战同行状态。'))
    }
  }

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>{i18nT("返回守心首页")}</button>
        <h1>{i18nT("守心小组")}</h1>
        <p>{i18nT("小组挑战只显示整体节奏和非排名进展。它不是排行榜，也不是公开动态。")}</p>
      </header>

      {message ? <div className="attn-alert" role="status">{message}</div> : null}

      <section className="attn-grid">
        <AttentionCard title={i18nT("创建小组")} actionLabel={i18nT("隐私设置")} onAction={() => openPage('privacy')}>
          <div className="attn-inline-form">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={i18nT("例如：周三守心同行")}  aria-label={i18nT("例如：周三守心同行")}/>
            <button className="attn-button" type="button" disabled={busy || !name.trim()} onClick={createGroup}>{i18nT("创建")}</button>
          </div>
        </AttentionCard>

        <AttentionCard title={i18nT("加入小组")}>
          <div className="attn-inline-form">
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder={i18nT("邀请码")}  aria-label={i18nT("邀请码")}/>
            <button className="attn-button" type="button" disabled={busy || !inviteCode.trim()} onClick={joinGroup}>{i18nT("加入")}</button>
          </div>
        </AttentionCard>

        <AttentionCard title={i18nT("我的小组")}>
          <div className="attn-list">
            {groups.map((group) => (
              <button type="button" aria-pressed={selectedGroup?.id === group.id} className={`attn-list-item attn-group-choice ${selectedGroup?.id === group.id ? 'active' : ''}`} key={group.id} onClick={() => setSelectedGroupId(group.id)}>
                <strong>{group.name}</strong>
                <span>{GroupTypeLabel[group.groupType] || group.groupType} · {GroupRoleLabel[group.currentUserRole] || group.currentUserRole}</span>
                <span>{group.membersCount || 0} {i18nT("位成员 ·")} {group.activeChallengesCount || 0} {i18nT("个挑战")}</span>
                {group.inviteCode ? <code>{i18nT("邀请码：")}{group.inviteCode}</code> : null}
              </button>
            ))}
            {!groups.length ? <p className="attn-muted">{i18nT("还没有守心小组。")}</p> : null}
          </div>
        </AttentionCard>

        <AttentionCard title={selectedGroup ? i18nT('{name} · 小组详情', { name: selectedGroup.name }) : i18nT('小组详情')}>
          {selectedGroup ? <>
            <p>{i18nT("成员按加入顺序显示，不按完成数或评分排序。")}</p>
            <div className="attn-list">{members.map((member) => <div className="attn-list-item" key={member.id}><strong>{member.user?.displayName || member.user?.id}</strong><span>{GroupRoleLabel[member.role] || member.role} · {member.status}</span></div>)}</div>
            <h4>{i18nT("小组挑战")}</h4>
            <div className="attn-list">{groupChallenges.map((challenge) => <div className="attn-list-item" key={challenge.id}><strong>{challenge.title}</strong><span>{ChallengePrivacyLabel[challenge.privacyMode] || challenge.privacyMode} {i18nT("· 小组完成率")} {challenge.progress?.groupCompletionRate || 0}%</span><button type="button" onClick={() => showParticipants(challenge)}>{i18nT("查看同行状态")}</button></div>)}{!groupChallenges.length ? <p className="attn-muted">{i18nT("这个小组还没有进行中的挑战。")}</p> : null}</div>
          </> : <p className="attn-muted">{i18nT("选择或加入一个小组后查看详情。")}</p>}
        </AttentionCard>

        <AttentionCard title={i18nT("我的挑战")}>
          <div className="attn-list">
            {myChallenges.map((challenge) => (
              <div className="attn-list-item" key={challenge.id}>
                <strong>{challenge.title}</strong>
                <span>{ChallengePrivacyLabel[challenge.privacyMode] || challenge.privacyMode} {i18nT("· 完成")} {challenge.progress?.completedCheckins || 0} {i18nT("次")}</span>
                <span>{challenge.progress?.encouragementText}</span>
                <div className="attn-row-actions"><button type="button" disabled={busy} onClick={() => checkin(challenge)}>{i18nT("今日 Check-in")}</button><button type="button" onClick={() => showParticipants(challenge)}>{i18nT("同行状态")}</button></div>
              </div>
            ))}
            {!myChallenges.length ? <p className="attn-muted">{i18nT("还没有参与中的挑战。")}</p> : null}
          </div>
        </AttentionCard>
      </section>

      {participantView ? <section className="attn-section attn-participant-panel" aria-live="polite">
        <div className="attn-card-head"><div><h2>{participantView.challenge.title} {i18nT("· 同行状态")}</h2><p>{i18nT("只显示挑战允许的状态摘要，不显示个人复盘正文，也不进行排名。")}</p></div><button type="button" className="attn-ghost" onClick={() => setParticipantView(null)}>{i18nT("关闭")}</button></div>
        {participantView.loading ? <p>{i18nT("正在加载…")}</p> : participantView.challenge.privacyMode === 'anonymous_aggregate' ? <p>{i18nT("此挑战采用匿名聚合，仅显示")} {participantView.progress?.activeParticipants || 0} {i18nT("位参与者的整体节奏。")}</p> : <div className="attn-list">{participantView.participants.map((participant) => <div className="attn-list-item" key={participant.user?.id}><strong>{participant.user?.displayName || participant.user?.id}</strong><span>{participant.encouragementText}</span><span>{i18nT("已完成")} {participant.completedDays || 0} {i18nT("天")}</span></div>)}</div>}
      </section> : null}

      <section className="attn-section">
        <h2>{i18nT("温柔挑战模板")}</h2>
        <div className="attn-grid compact">
          {templates.map((template) => (
            <AttentionCard key={template.key} title={template.title} actionLabel={selectedGroup && ['owner', 'leader'].includes(selectedGroup.currentUserRole) ? i18nT('创建到当前小组') : ''} onAction={() => createTemplateChallenge(template)}>
              <p>{template.description}</p>
              <p className="attn-muted">{template.gentleGuideline}</p>
            </AttentionCard>
          ))}
        </div>
      </section>
    </main>
  )
}
