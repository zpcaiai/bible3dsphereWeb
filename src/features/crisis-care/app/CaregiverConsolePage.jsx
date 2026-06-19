import { useAuth } from '../../../hooks/useAuth'
import LoginScreen from '../../../LoginScreen'
import CaregiverInbox from '../components/CaregiverInbox'
import './crisis-care.css'

/**
 * CaregiverConsolePage — 牧者/咨询师独立登录入口（路由 /caregiver）。
 * 未登录 → 复用 LoginScreen；登录后 → 只读查看「分享给你的人」。
 * 身份按登录邮箱匹配（邮箱在 users 表唯一、注册时已验证），防止冒名查看。
 */
export default function CaregiverConsolePage() {
  const { user, authLoading, setUser, handleLogout } = useAuth()

  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: 'rgba(255,255,255,0.4)' }}>加载中…</div>
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} message="登录后查看分享给你的人（牧者 / 咨询师协作台）" />
  }

  return (
    <main className="cc-page" style={{ minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>🕊️ 牧者协作台</h2>
        <button className="cc-btn ghost" type="button" onClick={handleLogout}>退出（{user.email}）</button>
      </div>
      <p className="cc-disclaimer">
        这里只显示别人主动分享给你的、只读的危机信息，且按对方设置的范围。请用于陪伴与连接资源，而非审判。
        若对方有立即危险，请直接拨打当地紧急电话。
      </p>
      <CaregiverInbox heading="分享给你的人" />
      <div style={{ textAlign: 'center', padding: '14px 0' }}>
        <a href="/" style={{ color: 'rgba(90,200,250,0.85)', fontSize: 13, textDecoration: 'none' }}>✨ 进入情感星球 →</a>
      </div>
    </main>
  )
}
