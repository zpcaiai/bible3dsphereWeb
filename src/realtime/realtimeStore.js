// 圣徒相通 — 全局实时 store（单例）。
// 一条 WebSocket 连接为整个 App 服务：在线状态、1对1聊天消息分发、以及**全局来电**
// （无论用户当前在哪个页面都能收到来电弹窗）。组件通过 subscribe/subscribeState 订阅。
import { buildWsUrl, fetchDirectVoiceToken, fetchVoiceEnabled } from './realtimeApi'
import { getToken } from '../auth'

const toast = (m, t = 'info') => window.showToast?.(m, t)
function shortName(email, nickname) {
  return nickname || (email ? email.split('@')[0] : '弟兄姐妹')
}

class RealtimeStore {
  constructor() {
    this.ws = null
    this.user = null
    this.enabled = false
    this.reconnectTimer = null
    this.attempts = 0
    this.closedByUs = false

    // shared state
    this.connected = false
    this.onlineFriends = new Set()
    this.incomingCall = null   // { from, room, name }
    this.activeCall = null     // { creds, title, outgoing, peer }
    this.missedPeer = null     // { email, name } 未接来电留言入口

    this.msgListeners = new Set()
    this.stateListeners = new Set()
  }

  // ---- lifecycle ----
  start(user) {
    this.user = user || null
    const wantEnabled = !!(user && getToken())
    if (wantEnabled && this.enabled && this.ws) return // already running
    this.enabled = wantEnabled
    if (!wantEnabled) { this.stop(); return }
    this.closedByUs = false
    this.attempts = 0
    this._connect()
  }

  stop() {
    this.enabled = false
    this.closedByUs = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) { try { this.ws.close() } catch (e) { /* noop */ } }
    this.ws = null
    this._setState({ connected: false, onlineFriends: new Set() })
  }

  _connect() {
    if (!this.enabled || !getToken()) return
    let ws
    try { ws = new WebSocket(buildWsUrl()) }
    catch { this._scheduleReconnect(); return }
    this.ws = ws
    ws.onopen = () => { this.attempts = 0; this._setState({ connected: true }) }
    ws.onmessage = (ev) => {
      let msg
      try { msg = JSON.parse(ev.data) } catch { return }
      this._handle(msg)
    }
    ws.onclose = () => {
      this._setState({ connected: false })
      if (!this.closedByUs) this._scheduleReconnect()
    }
    ws.onerror = () => { try { ws.close() } catch (e) { /* noop */ } }
  }

  _scheduleReconnect() {
    this.attempts += 1
    // 连续失败上限：握手被拒(如token已失效,服务器403)时停止无限重连刷屏；
    // 重新登录会调用 start() 重置计数恢复连接
    if (this.attempts > 10) { this._setState({ connected: false }); return }
    const delay = Math.min(15000, 1000 * 2 ** Math.min(this.attempts, 4))
    this.reconnectTimer = setTimeout(() => this._connect(), delay)
  }

  // ---- message handling ----
  _handle(msg) {
    switch (msg.type) {
      case 'ready':
        this._setState({ onlineFriends: new Set(msg.online_friends || []) })
        break
      case 'presence': {
        const next = new Set(this.onlineFriends)
        if (msg.online) next.add(msg.email); else next.delete(msg.email)
        this._setState({ onlineFriends: next })
        break
      }
      case 'call_invite': {
        if (this.activeCall) { this.send({ type: 'call_decline', to: msg.from, room: msg.room }); break }
        const name = shortName(msg.from, this._friendNickname?.(msg.from))
        this._setState({ incomingCall: { from: msg.from, room: msg.room, name, video: !!msg.video } })
        break
      }
      case 'call_decline':
        if (this.activeCall?.outgoing) {
          toast('对方未接听')
          // 未接来电 → 提供留言入口（语音转写为文字，经聊天送达）
          this._setState({ activeCall: null, missedPeer: { email: this.activeCall.peer, name: this.activeCall.title } })
        }
        if (this.incomingCall && this.incomingCall.from === msg.from) this._setState({ incomingCall: null })
        break
      default:
        break
    }
    // forward everything to subscribers (chat/typing/friend events handled there)
    this.msgListeners.forEach((cb) => { try { cb(msg) } catch (e) { /* noop */ } })
  }

  // optional resolver set by CommunionPage to label incoming caller nicely
  setFriendNicknameResolver(fn) { this._friendNickname = fn }

  // ---- send ----
  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj)); return true
    }
    return false
  }

  // ---- call controls ----
  // opts.video=true 发起视频通话（双方进房即开摄像头；随时可关，关掉就回到纯语音）
  async startDirectCall(friend, opts = {}) {
    if (!friend) return
    if (this.activeCall) { toast('通话进行中'); return }
    const video = !!opts.video
    const enabled = await fetchVoiceEnabled()
    if (!enabled) { toast('语音通话尚未配置（需管理员设置 LiveKit）'); return }
    if (friend.online === false) { toast('对方当前不在线'); return }
    try {
      const creds = await fetchDirectVoiceToken(friend.email)
      this.send({
        type: 'call_invite', to: friend.email, room: creds.room, video,
        title: `${shortName(this.user?.email, this.user?.nickname)} 邀请你${video ? '视频' : '语音'}通话`,
      })
      this._setState({ activeCall: { creds, title: shortName(friend.email, friend.nickname), outgoing: true, peer: friend.email, video } })
    } catch (e) { toast(e.message || '发起通话失败') }
  }

  async acceptIncoming() {
    const ic = this.incomingCall
    if (!ic) return
    this._setState({ incomingCall: null })
    try {
      const creds = await fetchDirectVoiceToken(ic.from, ic.room)
      this._setState({ activeCall: { creds, title: ic.name, outgoing: false, peer: ic.from, video: !!ic.video } })
    } catch (e) { toast(e.message || '接听失败') }
  }

  declineIncoming() {
    const ic = this.incomingCall
    if (ic) this.send({ type: 'call_decline', to: ic.from, room: ic.room })
    this._setState({ incomingCall: null })
  }

  endCall() {
    const ac = this.activeCall
    if (ac?.outgoing && ac.peer) this.send({ type: 'call_decline', to: ac.peer, room: ac.creds?.room })
    this._setState({ activeCall: null })
  }

  selfName() { return shortName(this.user?.email, this.user?.nickname) }

  // ---- pub/sub ----
  subscribe(cb) { this.msgListeners.add(cb); return () => this.msgListeners.delete(cb) }
  subscribeState(cb) { this.stateListeners.add(cb); return () => this.stateListeners.delete(cb) }
  clearMissed() { this._setState({ missedPeer: null }) }

  getState() {
    return {
      connected: this.connected,
      onlineFriends: this.onlineFriends,
      incomingCall: this.incomingCall,
      activeCall: this.activeCall,
      missedPeer: this.missedPeer,
    }
  }
  _setState(patch) {
    Object.assign(this, patch)
    const snap = this.getState()
    this.stateListeners.forEach((cb) => { try { cb(snap) } catch (e) { /* noop */ } })
  }
}

const realtimeStore = new RealtimeStore()
export default realtimeStore
