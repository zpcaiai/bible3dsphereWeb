import { t as i18nT } from './i18n/runtime'
/**
 * ReminderSettings — 晨更 / 晚祷 Web Push 提醒设置
 * 入口：今日心镜 (SoulDashboard) 卡片。优雅降级：服务器未配置 VAPID 时给出说明。
 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { fetchVapidKey, fetchPushPrefs, subscribePush, savePushPrefs, testPush, fetchCareConsent, saveCareConsent } from './api'
import { getToken } from './auth'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 }

export default function ReminderSettings({ onBack }) {
  const [supported] = useState('serviceWorker' in navigator && 'PushManager' in window)
  const [configured, setConfigured] = useState(null)
  const [vapid, setVapid] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [morningOn, setMorningOn] = useState(true)
  const [eveningOn, setEveningOn] = useState(true)
  const [morningTime, setMorningTime] = useState('07:00')
  const [eveningTime, setEveningTime] = useState('21:30')
  const [growthOn, setGrowthOn] = useState(true)
  const [mccheyneOn, setMccheyneOn] = useState(true)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [shareCare, setShareCare] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const t = getToken()
    fetchVapidKey().then(r => { setConfigured(r.configured); setVapid(r.public_key || '') }).catch(() => setConfigured(false))
    if (t) {
      fetchPushPrefs(t).then(r => {
        setSubscribed(!!r.subscribed)
        if (r.morning_time) setMorningTime(r.morning_time)
        if (r.evening_time) setEveningTime(r.evening_time)
        if (typeof r.morning_on === 'boolean') setMorningOn(r.morning_on)
        if (typeof r.evening_on === 'boolean') setEveningOn(r.evening_on)
        if (typeof r.growth_on === 'boolean') setGrowthOn(r.growth_on)
        if (typeof r.mccheyne_on === 'boolean') setMccheyneOn(r.mccheyne_on)
      }).catch((err) => {
        console.warn('[ReminderSettings.jsx] ignored async error', err)
      }).finally(() => setPrefsLoaded(true))
    } else {
      setPrefsLoaded(true)
    }
    if (t) fetchCareConsent(t).then(r => { if (typeof r.share_formation_flags === 'boolean') setShareCare(r.share_formation_flags) }).catch((err) => { console.warn('[ReminderSettings.jsx] ignored async error', err) })
  }, [])

  async function enable() {
    setBusy(true); setMsg('')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setMsg(i18nT('需要允许通知权限才能开启提醒')); setBusy(false); return }
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        })
      }
      const j = sub.toJSON()
      await subscribePush({
        endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth,
        morning_on: morningOn, evening_on: eveningOn,
        morning_time: morningTime, evening_time: eveningTime, growth_on: growthOn,
        mccheyne_on: mccheyneOn,
      }, getToken())
      setSubscribed(true); setMsg(i18nT('✓ 提醒已开启'))
    } catch (e) { setMsg(i18nT('开启失败：{message}', { message: e.message || '' })) }
    finally { setBusy(false) }
  }

  async function saveTimes() {
    setBusy(true); setMsg('')
    try {
      await savePushPrefs({
        morning_on: morningOn,
        evening_on: eveningOn,
        morning_time: morningTime,
        evening_time: eveningTime,
        growth_on: growthOn,
        mccheyne_on: mccheyneOn,
      }, getToken())
      setMsg(i18nT('✓ 已保存'))
    } catch (e) { setMsg(e.message || i18nT('保存失败')) }
    finally { setBusy(false) }
  }

  async function sendTest() {
    setBusy(true); setMsg('')
    const r = await testPush(getToken())
    setMsg(r.sent
      ? i18nT('✓ 已发送 {n} 条测试推送', { n: r.sent })
      : i18nT(r.reason || '发送失败（请先开启提醒）'))
    setBusy(false)
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', color: '#fff', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(28,28,30,0.92)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <BackButton onClick={onBack} />
        <div><div style={{ fontSize: 17, fontWeight: 600 }}>{i18nT('晨更 · 晚祷提醒')}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{i18nT('让灵修有节奏，不靠记性靠恩典')}</div></div>
      </div>

      <div style={{ padding: '14px 16px 100px', maxWidth: 600, margin: '0 auto' }}>
        {!supported && <div style={{ ...card, color: '#ffd43b' }}>{i18nT('当前浏览器不支持 Web 推送。建议把应用「添加到主屏」后再试，或换用 Chrome / Edge。')}</div>}
        {configured === false && supported && (
          <div style={{ ...card, color: '#ffd43b', fontSize: 13, lineHeight: 1.7 }}>
            {i18nT('服务器尚未配置推送密钥（VAPID）。配置后即可开启。你仍可在下方设置提醒时间，开启后生效。')}
          </div>
        )}

        <div style={{ ...card, background: 'linear-gradient(135deg, rgba(90,200,250,0.10), rgba(52,199,89,0.08))' }}>
          <div style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)' }}>
            {i18nT('习惯不是靠意志，而是靠节奏。开启后，你会在选定的时间收到一句温柔的提醒—— 晨更迎接新的怜悯，晚祷与神同回顾这一天。')}
          </div>
        </div>

        <div style={card}>
          <Row label={i18nT('🌅 晨更提醒')} on={morningOn} setOn={setMorningOn} time={morningTime} setTime={setMorningTime} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />
          <Row label={i18nT('🌙 晚祷提醒')} on={eveningOn} setOn={setEveningOn} time={eveningTime} setTime={setEveningTime} />
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{i18nT('📖 麦琴每日读经')}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.5 }}>{i18nT('每天 08:00 推送当天四处经文、灵修指引与逐章查经入口')}</div>
            </div>
            {prefsLoaded ? (
              <button type="button" aria-label={i18nT('麦琴每日读经推送')} aria-pressed={mccheyneOn} onClick={() => setMccheyneOn(!mccheyneOn)} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: mccheyneOn ? '#34c759' : 'rgba(255,255,255,0.18)', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: mccheyneOn ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
              </button>
            ) : (
              <span role="status" aria-label={i18nT('正在加载推送设置…')} style={{ width: 46, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
            )}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{i18nT('🌱 成长轻推')}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.5 }}>{i18nT('每天午间一条「今日该做」，据你的成长画像（逾期纪律 / 未跟进的诊断）生成')}</div>
            </div>
            <button type="button" aria-label={i18nT('成长轻推')} aria-pressed={growthOn} onClick={() => setGrowthOn(!growthOn)} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: growthOn ? '#34c759' : 'rgba(255,255,255,0.18)', position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: growthOn ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{i18nT('🔒 关怀可见性')}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.5 }}>{i18nT('允许牧者 / 小组长在关怀汇总中看到你近期的风险信号（仅类别与时间，不含日志内容）。关闭后你的数据不进入任何关怀汇总。')}</div>
            </div>
            <button type="button" aria-label={i18nT('关怀可见性')} aria-pressed={shareCare} onClick={async () => { const v = !shareCare; setShareCare(v); try { await saveCareConsent(v, getToken()); setMsg(i18nT('✓ 关怀可见性已更新')) } catch { setMsg(i18nT('保存失败')) } }} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: shareCare ? '#34c759' : 'rgba(255,255,255,0.18)', position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: shareCare ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
            </button>
          </div>
        </div>

        {!subscribed ? (
          <button type="button" onClick={enable} disabled={busy || !supported} style={primaryBtn}>{busy ? i18nT('处理中…') : i18nT('开启提醒')}</button>
        ) : (
          <>
            <button type="button" onClick={saveTimes} disabled={busy} style={primaryBtn}>{busy ? i18nT('保存中…') : i18nT('保存提醒时间')}</button>
            <button type="button" onClick={sendTest} disabled={busy} style={{ ...primaryBtn, background: 'rgba(255,255,255,0.08)', marginTop: 8 }}>{i18nT('发送一条测试推送')}</button>
          </>
        )}
        {msg && <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: msg.startsWith('✓') ? '#34c759' : '#ffd43b' }}>{msg}</div>}
      </div>
    </div>
  )
}

function Row({ label, on, setOn, time, setTime }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} disabled={!on}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '6px 8px', fontSize: 13, opacity: on ? 1 : 0.4 }} />
        <button type="button" aria-label={label} aria-pressed={on} onClick={() => setOn(!on)} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: on ? '#34c759' : 'rgba(255,255,255,0.18)', position: 'relative', transition: 'all .2s' }}>
          <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
        </button>
      </div>
    </div>
  )
}

const primaryBtn = { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #34c759, #5ac8fa)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
