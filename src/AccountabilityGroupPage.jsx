import { t as i18nT } from './i18n/runtime'
/** AccountabilityGroupPage — 小组监督 (B7)。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { communityApi } from './api'
import { getToken } from './auth'
import { a11yClickProps } from './lib/a11yClick';
import { BarSeries } from './components/charts'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(245,181,63,0.85), rgba(52,199,89,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

export default function AccountabilityGroupPage({ user, onBack }) {
  const [groups, setGroups] = useState([])
  const [sel, setSel] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [prayers, setPrayers] = useState([])
  const [name, setName] = useState('')
  const [grat, setGrat] = useState(''); const [strug, setStrug] = useState(''); const [pray, setPray] = useState('')
  const [crisis, setCrisis] = useState(null)
  const [error, setError] = useState('')

  function load() { const t = getToken(); if (t) communityApi.myGroups(t).then(r => setGroups(r.groups || [])).catch(e => setError(e.message)) }
  useEffect(load, [])
  function open(g) {
    const t = getToken(); setSel(g)
    communityApi.groupCheckins(g.id, t).then(r => setCheckins(r.checkins || [])).catch((err) => { console.warn('[AccountabilityGroupPage.jsx] ignored async error', err) })
    communityApi.groupPrayers(g.id, t).then(r => setPrayers(r.prayer_requests || [])).catch((err) => { console.warn('[AccountabilityGroupPage.jsx] ignored async error', err) })
  }
  async function create() { const t = getToken(); if (!name.trim()) return; try { await communityApi.createGroup({ name: name.trim() }, t); setName(''); load() } catch (e) { setError(e.message) } }
  async function checkin() {
    const t = getToken(); if (!sel) return
    try { const r = await communityApi.groupCheckin(sel.id, { gratitude: grat, struggle: strug, prayer_request: pray }, t); setCrisis(r.crisis || null); setGrat(''); setStrug(''); setPray(''); open(sel) } catch (e) { setError(e.message) }
  }
  async function addPrayer() { const t = getToken(); if (!sel || !pray.trim()) return; try { await communityApi.addGroupPrayer(sel.id, { title: pray.trim() }, t); setPray(''); open(sel) } catch (e) { setError(e.message) } }

  // 参与度只用接口确实回传的字段：代祷板每条都带 by（提交人），按人计数即可。
  // 打卡接口 /checkins 回来的记录这一页从来没有渲染过任何字段，
  // 我不去猜它的作者/时间字段名，所以打卡那半边只如实说明「画不出来」。
  const prayerByPerson = (() => {
    const counts = new Map()
    prayers.forEach((p) => {
      const who = String(p.by || '').trim()
      if (!who) return
      counts.set(who, (counts.get(who) || 0) + 1)
    })
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  })()

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('👥 小组监督')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('同意制 · 坚固爱与信，不羞辱不比较')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}
      {crisis && <div style={{ ...card, background: 'rgba(255,107,107,0.10)' }}><div style={{ fontWeight: 700 }}>💗 {crisis.message}</div><div style={{ fontSize: 12 }}>{i18nT('危机内容不该只在群里流转,请同时寻求牧养/危机陪伴。')}</div></div>}

      <div style={card}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={i18nT('新建小组名称')} style={{ ...fld, marginBottom: 0, flex: 1 }}  aria-label={i18nT('新建小组名称')}/>
          <button style={btn} onClick={create}>{i18nT('建群')}</button>
        </div>
        {groups.map(g => (
          <div key={g.id} onClick={() => open(g)} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }} {...a11yClickProps(() => open(g))}>
            <div style={{ fontSize: 14 }}>{g.name} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>· {g.my_role}</span></div>
          </div>
        ))}
      </div>

      {sel && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{sel.name} {i18nT('· 本周打卡')}</div>
          <input value={grat} onChange={e => setGrat(e.target.value)} placeholder={i18nT('本周的恩典')} style={fld}  aria-label={i18nT('本周的恩典')}/>
          <input value={strug} onChange={e => setStrug(e.target.value)} placeholder={i18nT('挣扎之处')} style={fld}  aria-label={i18nT('挣扎之处')}/>
          <input value={pray} onChange={e => setPray(e.target.value)} placeholder={i18nT('代祷请求')} style={fld}  aria-label={i18nT('代祷请求')}/>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn} onClick={checkin}>{i18nT('提交打卡')}</button>
            <button style={{ ...btn, background: 'rgba(125,211,252,0.5)' }} onClick={addPrayer}>{i18nT('加到代祷板')}</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: '#8be9c0' }}>{i18nT('代祷板')}</div>
            {prayers.map(p => <div key={p.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', padding: '3px 0' }}>· {p.title}（{p.by}）</div>)}
          </div>
        </div>
      )}

      {sel && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('参与情况')}</div>
          {prayerByPerson.length > 0 ? (
            <BarSeries
              items={prayerByPerson}
              unit={i18nT('条')}
              title={i18nT('代祷板上谁在开口')}
              subtitle={i18nT('{n} 位组员一共放上 {total} 条代祷；这是「谁在把担子说出来」，不是评分或排名。', { n: prayerByPerson.length, total: prayers.length })}
            />
          ) : (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
              {i18nT('代祷板还是空的，所以没有可画的参与数据。')}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.32)', lineHeight: 1.7 }}>
            {i18nT('本周共收到 {n} 条打卡。打卡接口没有回传可用于按人/按日统计的字段，所以这里只给条数，不画打卡图。', { n: checkins.length })}
          </div>
        </div>
      )}
    </div>
  )
}
