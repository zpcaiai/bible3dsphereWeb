// 全局实时根组件：在 App 顶层挂载一次。负责
//   1) 用单例 store 维持唯一的 WebSocket 连接（按登录状态启停）
//   2) 渲染**全局来电弹窗 + 通话面板**——无论用户在哪个页面都能接到来电。
import { useEffect, useRef, useState } from 'react'
import realtimeStore from './realtimeStore'
import { useRealtimeState } from './useRealtimeStore'
import LiveKitCall from './LiveKitCall'
import MinutesModal from './MinutesModal'
import VoicemailModal from './VoicemailModal'
import { hasNotes } from './callNotes'
import { t } from '../i18n/runtime'

export default function RealtimeRoot({ user }) {
  useEffect(() => {
    realtimeStore.start(user)
    return () => { /* keep connection across page switches; stop only when user clears */ }
  }, [user])

  // when user logs out, tear down
  useEffect(() => {
    if (!user) realtimeStore.stop()
  }, [user])

  const { incomingCall, activeCall, missedPeer } = useRealtimeState()

  // 通话结束后：若开过「记录」，弹出 AI 纪要
  const [minutesFor, setMinutesFor] = useState(null)
  const prevCallRef = useRef(null)
  useEffect(() => {
    if (prevCallRef.current && !activeCall && hasNotes()) {
      setMinutesFor(prevCallRef.current.title || '')
    }
    prevCallRef.current = activeCall
  }, [activeCall])

  if (!user) return null

  return (
    <>
      {activeCall && (
        <LiveKitCall
          url={activeCall.creds.url}
          token={activeCall.creds.token}
          e2eeKey={activeCall.creds.e2ee_key || ''}
          title={activeCall.title}
          selfName={realtimeStore.selfName()}
          outgoing={activeCall.outgoing}
          video={!!activeCall.video}
          onLeave={() => realtimeStore.endCall()}
        />
      )}

      {minutesFor !== null && !activeCall && (
        <MinutesModal title={minutesFor} onClose={() => setMinutesFor(null)} />
      )}

      {missedPeer && !activeCall && !incomingCall && (
        <VoicemailModal peer={missedPeer} onClose={() => realtimeStore.clearMissed()} />
      )}

      {incomingCall && !activeCall && (
        <div className="communion-invite-overlay">
          <div className="communion-invite glass">
            <div className="communion-invite-title">
              {incomingCall.video
                ? <>📹 {incomingCall.name} {t("邀请你视频通话")}</>
                : <>📞 {incomingCall.name} {t("邀请你语音通话")}</>}
            </div>
            <div className="communion-invite-actions">
              <button className="communion-accept" onClick={() => realtimeStore.acceptIncoming()}>{t("接听")}</button>
              <button className="communion-decline" onClick={() => realtimeStore.declineIncoming()}>{t("拒绝")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
