import { t as i18nT } from './i18n/runtime'
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import LanguageToggle from './i18n/LanguageToggle'
import { loginWithEmail, registerWithEmail, sendEmailCode, sendResetCode, resetPassword, fetchEmailAuthStatus } from './auth'

const cardStyle = {
  width: '100%',
  maxWidth: '360px',
  background: 'rgba(28,28,30,0.92)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderRadius: '20px',
  padding: '28px 24px',
  boxSizing: 'border-box',
}

const inputStyle = {
  width: '100%',
  minHeight: '48px',
  background: 'rgba(120,120,128,0.18)',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '16px',
  padding: '12px 14px',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  WebkitAppearance: 'none',
}

const primaryBtnStyle = (disabled) => ({
  width: '100%',
  minHeight: '50px',
  border: 'none',
  borderRadius: '12px',
  background: '#007aff',
  color: '#fff',
  fontSize: '17px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  transition: 'opacity 0.15s',
  fontFamily: 'inherit',
})

const mutedText = { fontSize: '12px', color: 'rgba(255,255,255,0.62)', textAlign: 'center', lineHeight: 1.6, margin: '16px 0 0' }
const errorText = { fontSize: '13px', color: '#ff3b30', margin: '10px 0 0', textAlign: 'center' }
const labelStyle = { fontSize: '13px', color: 'rgba(255,255,255,0.72)', marginBottom: '6px', display: 'block' }
const REMEMBERED_EMAIL_KEY = 'bs_remember_email'
const LEGACY_CREDENTIALS_KEY = 'bs_remember_creds'
const DEFAULT_LOGIN_EMAIL = 'john@biblesphere.com'
const DEFAULT_LOGIN_PASSWORD = 'John'

function loadRememberedEmail() {
  try {
    const email = localStorage.getItem(REMEMBERED_EMAIL_KEY) || DEFAULT_LOGIN_EMAIL
    localStorage.removeItem(LEGACY_CREDENTIALS_KEY)
    return email
  } catch {
    return DEFAULT_LOGIN_EMAIL
  }
}

function persistRememberedEmail(email, rememberMe) {
  try {
    if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    localStorage.removeItem(LEGACY_CREDENTIALS_KEY)
  } catch {
    // Authentication must still succeed when browser storage is unavailable.
  }
}

export default function LoginScreen({ onLogin, onBack, message }) {
  const [tab, setTab] = useState('login') // 'login' | 'register' | 'reset'
  const [sharedEmail, setSharedEmail] = useState(loadRememberedEmail)
  // 邮箱服务挂掉时，注册和重置密码都不可能成功。与其让人填完整张表
  // 才在点「获取验证码」时撞见 503，不如进页面就说清楚。
  const [authStatus, setAuthStatus] = useState({ selfRegisterEnabled: true, message: '' })
  useEffect(() => {
    let cancelled = false
    fetchEmailAuthStatus()
      .then((s) => { if (!cancelled) setAuthStatus(s) })
      // fetchEmailAuthStatus 内部已经吞了异常，这里再兜一层：
      // 可用性探测失败绝不该在登录页抛出未捕获的 rejection，
      // 更不该因此把注册入口堵死——保持「按可用处理」的默认值。
      .catch(() => { /* 保持默认的 selfRegisterEnabled: true */ })
    return () => { cancelled = true }
  }, [])
  const needsEmailService = tab === 'register' || tab === 'reset'
  const emailServiceDown = !authStatus.selfRegisterEnabled
  return (
    <div style={{
      width: '100%', minHeight: '100dvh', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '24px 20px', boxSizing: 'border-box',
      position: 'relative', overflowY: 'auto',
    }}>
      {onBack && (
        <BackButton onClick={onBack} style={{ position: 'absolute', top: 16, left: 16 }} />
      )}
      <LanguageToggle style={{ position: 'absolute', top: 16, right: 16 }} />
      <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: '32px' }}>
        <div style={{ fontSize: '64px', lineHeight: 1, marginBottom: '12px' }}>🔮</div>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{i18nT('属灵星球')}</h1>
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Spirit Emotion Sphere</p>
      </div>

      <div style={cardStyle}>
        {/* 提示信息 */}
        {message && (
          <div style={{
            background: 'rgba(0,122,255,0.15)',
            border: '1px solid rgba(0,122,255,0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            lineHeight: '1.5',
          }}>
            {message}
          </div>
        )}
        {/* Tab 切换 */}
        <div role="tablist" aria-label={i18nT('账号操作')} style={{
          display: 'flex', gap: '2px', padding: '3px',
          background: 'rgba(120,120,128,0.2)', borderRadius: '10px', marginBottom: '24px',
        }}>
          {[['login', i18nT('登录')], ['register', i18nT('注册')], ['reset', i18nT('重置密码')]].map(([key, label]) => (
            <button
              key={key}
              id={`auth-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls={`auth-panel-${key}`}
              onClick={() => setTab(key)}
              title={emailServiceDown && key !== 'login' ? authStatus.message : undefined}
              style={{
                flex: 1, minHeight: '36px', border: 'none', borderRadius: '8px', fontFamily: 'inherit',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                background: tab === key ? '#007aff' : 'transparent',
                // 服务不可用时把注册/重置标记为暗淡，但仍可点开——点进去要能看到原因，
                // 直接 disabled 会变成「按不动又不说为什么」，更让人困惑。
                color: tab === key ? '#fff'
                  : (emailServiceDown && key !== 'login') ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.5)',
                transition: 'background 0.2s, color 0.2s',
              }}
            >{label}{emailServiceDown && key !== 'login' ? ' ⚠' : ''}</button>
          ))}
        </div>

        {emailServiceDown && needsEmailService && (
          <div role="alert" style={{
            background: 'rgba(255,159,10,0.12)',
            border: '1px solid rgba(255,159,10,0.35)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#ffd8a8',
            lineHeight: 1.6,
          }}>
            {authStatus.message || i18nT('邮箱验证服务当前不可用，暂时无法自助注册或重置密码。这不是你的问题，请联系管理员。')}
          </div>
        )}

        <div role="tabpanel" id={`auth-panel-${tab}`} aria-labelledby={`auth-tab-${tab}`}>
          {tab === 'login' && <LoginForm email={sharedEmail} setEmail={setSharedEmail} onLogin={onLogin} onReset={() => setTab('reset')} />}
          {tab === 'register' && <RegisterForm email={sharedEmail} setEmail={setSharedEmail} onDone={() => setTab('login')} onLogin={onLogin} />}
          {tab === 'reset' && <ResetPasswordForm email={sharedEmail} setEmail={setSharedEmail} onDone={() => setTab('login')} />}
        </div>

        <p style={mutedText}>{i18nT('登录即表示同意服务条款与隐私政策')}</p>
      </div>

      {/* 站点声明 */}
      <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '12px',
        color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, maxWidth: 360, marginBottom: 'auto' }}>
        <div>{i18nT('本站内容为开发者 Ethan 原创，仅供个人灵修学习，不得用于商业用途，最终解释权归开发者所有')}</div>
        <a href="mailto:zpchoney@gmail.com" style={{ color: 'rgba(90,200,250,0.7)', textDecoration: 'none' }}>zpchoney@gmail.com</a>
      </div>
    </div>
  )
}

function LoginForm({ email, setEmail, onLogin, onReset }) {
  const [password, setPassword] = useState(DEFAULT_LOGIN_PASSWORD)
  const [rememberMe, setRememberMe] = useState(() => Boolean(email))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginWithEmail(email.trim(), password)
      persistRememberedEmail(email.trim(), rememberMe)
      if (data.user && onLogin) onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        aria-label={i18nT('auth.defaultCredentials')}
        style={{
          padding: '12px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(90,200,250,0.28)',
          background: 'rgba(90,200,250,0.1)',
          color: 'rgba(255,255,255,0.86)',
          fontSize: '13px',
          lineHeight: 1.65,
        }}
      >
        <div style={{ color: '#5ac8fa', fontWeight: 600, marginBottom: '4px' }}>
          {i18nT('auth.defaultCredentials')}
        </div>
        <div>
          {i18nT('auth.defaultUsername')}：{' '}
          <code style={{ color: '#fff', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            {DEFAULT_LOGIN_EMAIL}
          </code>
        </div>
        <div>
          {i18nT('auth.defaultPassword')}：{' '}
          <code style={{ color: '#fff', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            {DEFAULT_LOGIN_PASSWORD}
          </code>
        </div>
      </div>
      <div>
        <label htmlFor="login-email" style={labelStyle}>{i18nT('邮箱')}</label>
        <input
          id="login-email" className="auth-input"
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email"
          style={inputStyle}
         aria-label="you@example.com"/>
      </div>
      <div>
        <label htmlFor="login-password" style={labelStyle}>{i18nT('密码')}</label>
        <input
          id="login-password" className="auth-input"
          type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder={i18nT('输入密码')} autoComplete="current-password"
          style={inputStyle}
         aria-label={i18nT('输入密码')}/>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
        <input
          type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: '#007aff' }}
        />
        {i18nT('记住邮箱')}
      </label>
      {error && <p style={errorText}>{error}</p>}
      <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
        {loading ? i18nT('⏳ 登录中...') : i18nT('🔑 登录')}
      </button>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'none', border: 'none', padding: 0,
            fontSize: '13px', color: 'rgba(0,122,255,0.8)', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {i18nT('🔒 忘记密码？')}
        </button>
      </div>
    </form>
  )
}

function RegisterForm({ email, setEmail, onDone, onLogin }) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')  // shown when SMTP is not configured

  const handleEmailChange = (nextEmail) => {
    setEmail(nextEmail)
    if (codeSent) {
      setCodeSent(false)
      setCode('')
      setDevCode('')
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  const handleSendCode = async () => {
    setError('')
    setDevCode('')
    setSendLoading(true)
    try {
      const data = await sendEmailCode(email.trim())
      // Check if email already registered
      if (data.registered) {
        setError(data.message || i18nT('该邮箱已注册，请直接登录'))
        setSendLoading(false)
        // Auto switch to login tab after 1.5s
        setTimeout(() => onDone && onDone(), 1500)
        return
      }
      setCodeSent(true)
      startCountdown()
      if (data.dev_code) {
        setDevCode(data.dev_code)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSendLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setRegLoading(true)
    try {
      const data = await registerWithEmail(email.trim(), code.trim(), password, nickname.trim())
      if (data.user && onLogin) onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label htmlFor="register-email" style={labelStyle}>{i18nT('邮箱')}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="register-email" className="auth-input"
            type="email" required value={email} onChange={e => handleEmailChange(e.target.value)}
            placeholder="you@example.com" autoComplete="email"
            style={{ ...inputStyle, flex: 1 }}
           aria-label="you@example.com"/>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sendLoading || countdown > 0 || !email.includes('@')}
            style={{
              flexShrink: 0, minHeight: '48px', padding: '0 14px', border: 'none',
              borderRadius: '12px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit',
              background: 'rgba(0,122,255,0.2)', color: '#007aff', cursor: 'pointer',
              opacity: (sendLoading || countdown > 0 || !email.includes('@')) ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {countdown > 0 ? `${countdown}s` : sendLoading ? i18nT('发送中') : i18nT('获取验证码')}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="register-code" style={labelStyle}>{i18nT('验证码')}</label>
        <input
          id="register-code" className="auth-input"
          type="text" required value={code} onChange={e => setCode(e.target.value)}
          placeholder={i18nT('6位验证码')} maxLength={6} inputMode="numeric"
          style={inputStyle}
         aria-label={i18nT('6位验证码')}/>
        {devCode && (
          <p style={{ fontSize: '12px', color: '#34c759', margin: '6px 0 0', textAlign: 'center' }}>
            {i18nT('开发模式 — 验证码:')} <b>{devCode}</b>{i18nT('（请在上方输入）')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="register-password" style={labelStyle}>{i18nT('密码（至少6位）')}</label>
        <input
          id="register-password" className="auth-input"
          type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder={i18nT('设置登录密码')} autoComplete="new-password" minLength={6}
          style={inputStyle}
         aria-label={i18nT('设置登录密码')}/>
      </div>
      <div>
        <label htmlFor="register-nickname" style={labelStyle}>{i18nT('昵称（选填）')}</label>
        <input
          id="register-nickname" className="auth-input"
          type="text" value={nickname} onChange={e => setNickname(e.target.value)}
          placeholder={i18nT('你的名字')}
          style={inputStyle}
         aria-label={i18nT('你的名字')}/>
      </div>
      {error && <p style={errorText}>{error}</p>}
      <button type="submit" disabled={regLoading || !codeSent} style={primaryBtnStyle(regLoading || !codeSent)}>
        {regLoading ? i18nT('⏳ 注册中...') : i18nT('✅ 注册并登录')}
      </button>
    </form>
  )
}

function ResetPasswordForm({ email, setEmail, onDone }) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')
  const [success, setSuccess] = useState(false)

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  const handleSendCode = async () => {
    setError('')
    setDevCode('')
    setSendLoading(true)
    try {
      const data = await sendResetCode(email.trim())
      setCodeSent(true)
      startCountdown()
      if (data.dev_code) {
        setDevCode(data.dev_code)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSendLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(i18nT('两次输入的密码不一致'))
      return
    }
    if (password.length < 6) {
      setError(i18nT('密码至少需要6位'))
      return
    }

    setResetLoading(true)
    try {
      await resetPassword(email.trim(), code.trim(), password)
      setSuccess(true)
      setTimeout(() => onDone && onDone(), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontSize: '16px', color: '#fff', marginBottom: '8px' }}>{i18nT('密码重置成功')}</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{i18nT('请使用新密码登录')}</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label htmlFor="reset-email" style={labelStyle}>{i18nT('注册邮箱')}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="reset-email" className="auth-input"
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email"
            style={{ ...inputStyle, flex: 1 }}
           aria-label="you@example.com"/>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sendLoading || countdown > 0 || !email.includes('@')}
            style={{
              flexShrink: 0, minHeight: '48px', padding: '0 14px', border: 'none',
              borderRadius: '12px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit',
              background: 'rgba(0,122,255,0.2)', color: '#007aff', cursor: 'pointer',
              opacity: (sendLoading || countdown > 0 || !email.includes('@')) ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {countdown > 0 ? `${countdown}s` : sendLoading ? i18nT('发送中') : i18nT('获取验证码')}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="reset-code" style={labelStyle}>{i18nT('验证码')}</label>
        <input
          id="reset-code" className="auth-input"
          type="text" required value={code} onChange={e => setCode(e.target.value)}
          placeholder={i18nT('6位验证码')} maxLength={6} inputMode="numeric"
          style={inputStyle}
         aria-label={i18nT('6位验证码')}/>
        {devCode && (
          <p style={{ fontSize: '12px', color: '#34c759', margin: '6px 0 0', textAlign: 'center' }}>
            {i18nT('开发模式 — 验证码:')} <b>{devCode}</b>{i18nT('（请在上方输入）')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="reset-password" style={labelStyle}>{i18nT('新密码（至少6位）')}</label>
        <input
          id="reset-password" className="auth-input"
          type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder={i18nT('设置新密码')} autoComplete="new-password" minLength={6}
          style={inputStyle}
         aria-label={i18nT('设置新密码')}/>
      </div>
      <div>
        <label htmlFor="reset-password-confirm" style={labelStyle}>{i18nT('确认密码')}</label>
        <input
          id="reset-password-confirm" className="auth-input"
          type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          placeholder={i18nT('再次输入新密码')} autoComplete="new-password"
          style={inputStyle}
         aria-label={i18nT('再次输入新密码')}/>
      </div>
      {error && <p style={errorText}>{error}</p>}
      <button type="submit" disabled={resetLoading || !codeSent} style={primaryBtnStyle(resetLoading || !codeSent)}>
        {resetLoading ? i18nT('⏳ 重置中...') : i18nT('🔄 重置密码')}
      </button>
      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onDone}
          style={{
            background: 'none', border: 'none', padding: 0,
            fontSize: '13px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {i18nT('← 返回登录')}
        </button>
      </div>
    </form>
  )
}
