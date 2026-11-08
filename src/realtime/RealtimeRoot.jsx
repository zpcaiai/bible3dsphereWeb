import { t as i18nT } from '../i18n/runtime'
// 全局实时根组件：在 App 顶层挂载一次。负责
//   1) 用单例 store 维持唯一的 WebSocket 连接（按登录状态启停）
//   2) 渲染**全局来电弹窗 + 通话面板**——无论用户在哪个页面都能接到来电。
import { useEffect, useRef, useState } from 'react'
import realtimeStore from './realtimeStore'
import { useRealtimeState } from './useRealtimeStore'
import LiveKitCall from './LiveKitCall'
import MinutesModal from './MinutesModal'
import VoicemailModal from './VoicemailModal'
import { getTranscript, stopNotes } from './callNotes'

export default function RealtimeRoot({ user }) {
  const [minutesTitle, setMinutesTitle] = useState(null)
  const [voicemailPeer, setVoicemailPeer] = useState(null)
  const lastCallRef = useRef(null)

  useEffect(() => {
    realtimeStore.start(user)
    return () => { /* keep connection across page switches; stop only when user clears */ }
  }, [user])

  // when user logs out, tear down
  useEffect(() => {
    if (!user) realtimeStore.stop()
  }, [user])

  const { incomingCall, activeCall } = useRealtimeState()

  useEffect(() => {
    if (activeCall) {
      lastCallRef.current = activeCall
      return
    }
    if (lastCallRef.current) {
      const ended = lastCallRef.current
      stopNotes()
      if (getTranscript().trim().length > 0) {
        setMinutesTitle(ended.title || '通话纪要')
      }
    }
  }, [activeCall])

  useEffect(() => {
    return realtimeStore.subscribe((msg) => {
      if (msg?.type === 'call_decline' && lastCallRef.current?.outgoing && lastCallRef.current?.peer) {
        const peer = { email: lastCallRef.current.peer, name: lastCallRef.current.title || lastCallRef.current.peer }
        lastCallRef.current = null
        setVoicemailPeer(peer)
      }
    })
  }, [])

  if (!user) return null

  const handleLeaveCall = () => {
    const ended = activeCall || lastCallRef.current
    stopNotes()
    if (getTranscript().trim().length > 0) {
      setMinutesTitle(ended?.title || '通话纪要')
    }
    lastCallRef.current = null
    realtimeStore.endCall()
  }

  return (
    <>
      {activeCall && (
        <LiveKitCall
          url={activeCall.creds.url}
          token={activeCall.creds.token}
          title={activeCall.title}
          selfName={realtimeStore.selfName()}
          outgoing={activeCall.outgoing}
          onLeave={handleLeaveCall}
        />
      )}

      {minutesTitle && !activeCall && (
        <MinutesModal
          title={minutesTitle}
          onClose={() => setMinutesTitle(null)}
        />
      )}

      {voicemailPeer && !activeCall && (
        <VoicemailModal
          peer={voicemailPeer}
          onClose={() => setVoicemailPeer(null)}
        />
      )}

      {incomingCall && !activeCall && (
        <div className="communion-invite-overlay">
          <div className="communion-invite glass">
            <div className="communion-invite-title">📞 {incomingCall.name} {i18nT('邀请你语音通话')}</div>
            <div className="communion-invite-actions">
              <button className="communion-accept" onClick={() => realtimeStore.acceptIncoming()}>{i18nT('接听')}</button>
              <button className="communion-decline" onClick={() => realtimeStore.declineIncoming()}>{i18nT('拒绝')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
