// 圣徒相通 (Communion) — 好友 + 1对1聊天 (QQ式)。
// 实时连接与来电弹窗由全局 realtimeStore / RealtimeRoot 负责（App 顶层挂载），
// 本页只订阅消息流处理好友/聊天，并通过 store 发起 1对1 语音通话。
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchFriends, requestFriend, acceptFriend, removeFriend,
  fetchChatHistory, markRead,
  recallChat, fetchGroupList, fetchGroupChat, sendGroupChat, recallGroupChat,
} from './realtime/realtimeApi'
import realtimeStore from './realtime/realtimeStore'
import { useRealtimeState, useRealtimeMessages } from './realtime/useRealtimeStore'
import { t } from './i18n/runtime'
import Translatable from './Translatable'

const showToast = (m) => window.showToast?.(m, 'info')
function shortName(email, nickname) {
  return nickname || (email ? email.split('@')[0] : t("弟兄姐妹"))
}
function timeLabel(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}
function dedupe(arr) {
  const seen = new Set(); const out = []
  for (const m of arr) {
    const k = m.id ? `s${m.id}` : m.key
    if (seen.has(k)) continue
    seen.add(k); out.push(m)
  }
  return out
}

export default function CommunionPage({ user, onBack, onOpenVoice }) {
  const myEmail = (user?.email || '').toLowerCase()
  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([])
  const [activePeer, setActivePeer] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [typingFrom, setTypingFrom] = useState(null)
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [gMessages, setGMessages] = useState([])
  const [gDraft, setGDraft] = useState('')
  const [, setRecallTick] = useState(0) // 周期刷新「撤回」按钮可见性

  const { connected, onlineFriends } = useRealtimeState()

  const activePeerRef = useRef(null)
  activePeerRef.current = activePeer
  const activeGroupRef = useRef(null)
  activeGroupRef.current = activeGroup
  const friendsRef = useRef([])
  friendsRef.current = friends
  const messagesEndRef = useRef(null)

  const isOnline = useCallback((email) => !!onlineFriends?.has?.(email), [onlineFriends])

  function normMsg(m) {
    return {
      key: m.id ? `s${m.id}` : (m.client_id || `${m.from}-${m.created_at}-${Math.random()}`),
      id: m.id,
      body: m.body,
      mine: (m.sender || m.from) === myEmail || m.self === true,
      created_at: m.created_at,
      recalled: !!m.recalled,
    }
  }
  // 撤回时限：2 分钟
  const RECALL_MS = 2 * 60 * 1000
  const canRecall = (m) => m.mine && m.id && !m.recalled &&
    (Date.now() - (Date.parse(m.created_at) || 0) < RECALL_MS)

  // ---------------- Friends ----------------
  const loadFriends = useCallback(async () => {
    try {
      const data = await fetchFriends()
      setFriends(data.friends || [])
      setIncoming(data.incoming || [])
    } catch (e) { /* ignore */ }
  }, [])

  // ---------------- Message stream (chat/typing/friend; presence+call are global) ----------------
  useRealtimeMessages(useCallback((msg) => {
    switch (msg.type) {
      case 'friend_request':
      case 'friend_added':
        loadFriends()
        break
      case 'chat': {
        const peer = msg.self ? msg.to : msg.from
        const active = activePeerRef.current
        if (active && active.email === peer) {
          setMessages((m) => dedupe([...m, normMsg(msg)]))
          if (!msg.self) markRead(peer).catch(() => {})
        } else if (!msg.self) {
          setFriends((fs) => fs.map((f) => f.email === peer
            ? { ...f, unread: (f.unread || 0) + 1, last_message: msg.body } : f))
        }
        break
      }
      case 'typing': {
        const active = activePeerRef.current
        if (active && active.email === msg.from) {
          setTypingFrom(msg.from)
          setTimeout(() => setTypingFrom(null), 2500)
        }
        break
      }
      case 'chat_recall': {
        const active = activePeerRef.current
        if (active && active.email === msg.peer) {
          setMessages((ms) => ms.map((x) => x.id === msg.id ? { ...x, recalled: true, body: '' } : x))
        }
        break
      }
      case 'group_chat': {
        const g = activeGroupRef.current
        if (g && g.id === msg.group && msg.message) {
          setGMessages((ms) => ms.some((x) => x.id === msg.message.id) ? ms : [...ms, msg.message])
        }
        break
      }
      case 'group_chat_recall': {
        const g = activeGroupRef.current
        if (g && g.id === msg.group) {
          setGMessages((ms) => ms.map((x) => x.id === msg.id ? { ...x, recalled: true, body: '' } : x))
        }
        break
      }
      case 'error':
        if (msg.code === 'not_friends') showToast(t("仅好友之间可以聊天"))
        break
      default:
        break
    }
  }, [loadFriends]))

  useEffect(() => { if (myEmail) loadFriends() }, [myEmail, loadFriends])
  useEffect(() => {
    if (!myEmail) return
    fetchGroupList().then((d) => setGroups(d.groups || [])).catch(() => {})
  }, [myEmail])
  useEffect(() => {
    const t = setInterval(() => setRecallTick((x) => x + 1), 15000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    // let the global incoming-call modal label the caller with a nickname
    realtimeStore.setFriendNicknameResolver((email) => {
      const f = friendsRef.current.find((x) => x.email === email)
      return f?.nickname
    })
  }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, gMessages, typingFrom])

  async function onAddFriend() {
    const email = addEmail.trim().toLowerCase()
    if (!email) return
    try {
      const r = await requestFriend(email)
      showToast(r.status === 'accepted' ? t("已成为好友") : t("好友请求已发送"))
      setAddEmail(''); loadFriends()
    } catch (e) { showToast(e.message || t("添加失败")) }
  }
  async function onAccept(email) {
    try { await acceptFriend(email); showToast(t("已添加好友")); loadFriends() }
    catch (e) { showToast(e.message) }
  }
  async function onRemove(email) {
    if (!window.confirm(t("确定删除该好友？"))) return
    try { await removeFriend(email); if (activePeer?.email === email) setActivePeer(null); loadFriends() }
    catch (e) { showToast(e.message) }
  }

  // ---------------- Chat ----------------
  async function openChat(friend) {
    setActiveGroup(null)
    setActivePeer(friend); setMessages([]); setTypingFrom(null)
    try {
      const data = await fetchChatHistory(friend.email, { limit: 50 })
      setMessages((data.messages || []).map(normMsg))
      await markRead(friend.email)
      setFriends((fs) => fs.map((f) => f.email === friend.email ? { ...f, unread: 0 } : f))
    } catch (e) { /* ignore */ }
  }
  function sendChat() {
    const body = draft.trim()
    if (!body || !activePeer) return
    const ok = realtimeStore.send({ type: 'chat', to: activePeer.email, body, client_id: 'c-' + Date.now() })
    if (!ok) { showToast(t("连接断开，正在重连…")); return }
    setDraft('')
  }
  function onDraftChange(v) {
    setDraft(v)
    if (activePeer) realtimeStore.send({ type: 'typing', to: activePeer.email })
  }
  function dial(friend) {
    realtimeStore.startDirectCall({ ...friend, online: isOnline(friend.email) })
  }

  async function recallMsg(m) {
    try {
      await recallChat(m.id)
      setMessages((ms) => ms.map((x) => x.id === m.id ? { ...x, recalled: true, body: '' } : x))
    } catch (e) { showToast(e.message || t("撤回失败")) }
  }

  // ---------------- 群聊 ----------------
  async function openGroup(g) {
    setActivePeer(null); setTypingFrom(null)
    setActiveGroup(g); setGMessages([])
    try {
      const data = await fetchGroupChat(g.id, { limit: 50 })
      setGMessages(data.messages || [])
    } catch (e) { showToast(e.message || t("加载群消息失败")) }
  }
  async function sendGroupMsg() {
    const body = gDraft.trim()
    if (!body || !activeGroup) return
    setGDraft('')
    try {
      const r = await sendGroupChat(activeGroup.id, body)
      if (r.message) setGMessages((ms) => ms.some((x) => x.id === r.message.id) ? ms : [...ms, r.message])
    } catch (e) { showToast(e.message || t("发送失败")); setGDraft(body) }
  }
  async function recallGroupMsg(m) {
    try {
      await recallGroupChat(activeGroup.id, m.id)
      setGMessages((ms) => ms.map((x) => x.id === m.id ? { ...x, recalled: true, body: '' } : x))
    } catch (e) { showToast(e.message || t("撤回失败")) }
  }
  const canRecallGroup = (m) => m.sender === myEmail && !m.recalled &&
    (Date.now() - (Date.parse(m.created_at) || 0) < RECALL_MS)
  function openGroupVoice() {
    if (typeof onOpenVoice === 'function') onOpenVoice()
    else showToast(t("语音通话请前往「语音通话」页"))
  }

  // ---------------- Render ----------------
  return (
    <div className="communion-page">
      <header className="communion-header glass">
        <button className="communion-back" onClick={onBack}>{t("← 返回")}</button>
        <div className="communion-title">
          {t("圣徒相通")}
          <span className={`communion-conn ${connected ? 'on' : 'off'}`}>
            {connected ? t("● 在线") : t("○ 连接中")}
          </span>
        </div>
        <div style={{ width: 56 }} />
      </header>

      <div className="communion-body">
        <aside className={`communion-sidebar ${activePeer ? 'has-active' : ''}`}>
          <div className="communion-add">
            <input
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddFriend()}
              placeholder={t("输入好友邮箱添加")}
            />
            <button onClick={onAddFriend}>{t("添加")}</button>
          </div>

          {incoming.length > 0 && (
            <div className="communion-incoming">
              <div className="communion-section-title">{t("好友请求")}</div>
              {incoming.map((r) => (
                <div key={r.email} className="communion-req">
                  <span>{shortName(r.email, r.nickname)}</span>
                  <button onClick={() => onAccept(r.email)}>{t("接受")}</button>
                </div>
              ))}
            </div>
          )}

          <div className="communion-section-title">{t("好友 (")}{friends.length})</div>
          <div className="communion-friends">
            {friends.length === 0 && <div className="communion-empty">{t("还没有好友，添加邮箱开始相通")}</div>}
            {friends.map((f) => {
              const online = isOnline(f.email)
              return (
                <div
                  key={f.email}
                  className={`communion-friend ${activePeer?.email === f.email ? 'active' : ''}`}
                  onClick={() => openChat(f)}
                  onContextMenu={(e) => { e.preventDefault(); onRemove(f.email) }}
                >
                  <div className="communion-avatar">
                    {f.avatar ? <img src={f.avatar} alt="" /> : shortName(f.email, f.nickname)[0]}
                    <span className={`communion-dot ${online ? 'online' : ''}`} />
                  </div>
                  <div className="communion-finfo">
                    <div className="communion-fname">{shortName(f.email, f.nickname)}</div>
                    <div className="communion-flast">{f.last_message || (online ? t("在线") : t("离线"))}</div>
                  </div>
                  {f.unread > 0 && <span className="communion-badge">{f.unread}</span>}
                  <button className="communion-call-btn" title={t("语音通话")}
                    onClick={(e) => { e.stopPropagation(); dial(f) }}>📞</button>
                </div>
              )
            })}
          </div>

          <div className="communion-section-title" style={{ marginTop: 10 }}>
            {t("群聊 (")}{groups.length})
            <button title={t("创建/加入群组请到语音通话页")}
              onClick={openGroupVoice}
              style={{ float: 'right', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12 }}>＋</button>
          </div>
          <div className="communion-friends">
            {groups.length === 0 && <div className="communion-empty">{t("还没有群组，去「语音通话」页创建或加入")}</div>}
            {groups.map((g) => (
              <div key={g.id}
                className={`communion-friend ${activeGroup?.id === g.id ? 'active' : ''}`}
                onClick={() => openGroup(g)}>
                <div className="communion-avatar">👥</div>
                <div className="communion-finfo">
                  <div className="communion-fname">{g.name}</div>
                  <div className="communion-flast">{g.member_count} {t("位成员")}</div>
                </div>
                <button className="communion-call-btn" title={t("进入群语音")}
                  onClick={(e) => { e.stopPropagation(); openGroupVoice() }}>🎙</button>
              </div>
            ))}
          </div>
        </aside>

        <main className={`communion-chat ${(activePeer || activeGroup) ? 'open' : ''}`}>
          {activeGroup ? (
            <>
              <div className="communion-chat-head glass">
                <button className="communion-back-mobile" onClick={() => setActiveGroup(null)}>←</button>
                <div className="communion-chat-name">👥 {activeGroup.name}
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>{activeGroup.member_count} {t("人")}</span>
                </div>
                <button className="communion-head-call" onClick={openGroupVoice}>{t("🎙 群语音")}</button>
              </div>

              <div className="communion-messages">
                {gMessages.map((m) => {
                  const mine = m.sender === myEmail
                  return (
                    <div key={`g${m.id}`} className={`communion-msg ${mine ? 'mine' : ''}`}>
                      {!mine && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{m.sender_name}</div>}
                      {m.recalled ? (
                        <div className="communion-bubble" style={{ opacity: 0.55, fontStyle: 'italic', fontSize: 12 }}>
                          {mine ? t("你撤回了一条消息") : `${m.sender_name} 撤回了一条消息`}
                        </div>
                      ) : (
                        <Translatable className="communion-bubble" text={m.body} />
                      )}
                      <div className="communion-msg-time">
                        {timeLabel(m.created_at)}
                        {canRecallGroup(m) && (
                          <button onClick={() => recallGroupMsg(m)} title={t("撤回（2分钟内）")}
                            style={{ marginLeft: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11, padding: 0 }}>{t("撤回")}</button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="communion-compose glass">
                <textarea
                  value={gDraft}
                  onChange={(e) => setGDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGroupMsg() } }}
                  placeholder={t("发到群里，Enter 发送")}
                  rows={1}
                />
                <button onClick={sendGroupMsg} disabled={!gDraft.trim()}>{t("发送")}</button>
              </div>
            </>
          ) : !activePeer ? (
            <div className="communion-placeholder">
              <div style={{ fontSize: 40 }}>🕊️</div>
              <p>{t("选择一位弟兄姊妹开始聊天")}</p>
              <button className="communion-head-call" onClick={openGroupVoice}>{t("🎙 多人语音通话")}</button>
            </div>
          ) : (
            <>
              <div className="communion-chat-head glass">
                <button className="communion-back-mobile" onClick={() => setActivePeer(null)}>←</button>
                <div className="communion-chat-name">
                  {shortName(activePeer.email, activePeer.nickname)}
                  <span className={`communion-dot ${isOnline(activePeer.email) ? 'online' : ''}`} />
                </div>
                <button className="communion-head-call" onClick={() => dial(activePeer)}>{t("📞 语音通话")}</button>
              </div>

              <div className="communion-messages">
                {messages.map((m) => (
                  <div key={m.key} className={`communion-msg ${m.mine ? 'mine' : ''}`}>
                    {m.recalled ? (
                      <div className="communion-bubble" style={{ opacity: 0.55, fontStyle: 'italic', fontSize: 12 }}>
                        {m.mine ? t("你撤回了一条消息") : t("对方撤回了一条消息")}
                      </div>
                    ) : (
                      <Translatable className="communion-bubble" text={m.body} />
                    )}
                    <div className="communion-msg-time">
                      {timeLabel(m.created_at)}
                      {canRecall(m) && (
                        <button onClick={() => recallMsg(m)} title={t("撤回（2分钟内）")}
                          style={{ marginLeft: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11, padding: 0 }}>{t("撤回")}</button>
                      )}
                    </div>
                  </div>
                ))}
                {typingFrom && <div className="communion-typing">{t("对方正在输入…")}</div>}
                <div ref={messagesEndRef} />
              </div>

              <div className="communion-compose glass">
                <textarea
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                  placeholder={t("输入消息，Enter 发送")}
                  rows={1}
                />
                <button onClick={sendChat} disabled={!draft.trim()}>{t("发送")}</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
