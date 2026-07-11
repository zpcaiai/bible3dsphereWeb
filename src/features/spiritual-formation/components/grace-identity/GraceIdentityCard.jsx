import { useMemo, useState } from 'react'
import { buildGraceIdentityResponse } from '../../lib/unionWithChristEngine'
import { formationExtApi } from '../../../../api'
import { T } from '../../lib/localize'
import '../../app/spiritual-formation.css'

export default function GraceIdentityCard({ inputText = '', compact = false, response = null, token }) {
  const [draft, setDraft] = useState(inputText)
  const [logged, setLogged] = useState(false)
  const data = useMemo(() => response || buildGraceIdentityResponse(draft || inputText || '我必须表现好才被爱'), [draft, inputText, response])
  function logGrace() {
    if (!token) return
    formationExtApi.graceLog({ input_text: draft || inputText || '', scenario: data.key || '', response: { falseIdentity: data.falseIdentity, inChristTruth: data.inChristTruth, nextStep: data.nextStep }, route: data.route }, token).then(() => setLogged(true)).catch(() => {})
  }

  if (data.route !== 'grace_identity') {
    return (
      <article className="sf-card">
        <h3>{T('需要温柔的真人陪伴', 'Gentle human care is needed')}</h3>
        <p>{data.pastoral?.message || T('请优先联系可信的人、牧者、辅导者或当地紧急资源。', 'Please prioritize contacting a trusted person, pastor, counselor, or local emergency resource.')}</p>
      </article>
    )
  }

  return (
    <article className={`sf-card ${compact ? 'sf-grace-card compact' : 'sf-grace-card'}`}>
      <h3>{T('在基督里，你的身份先于表现', 'In Christ, your identity comes before performance')}</h3>
      {!compact && (
        <label>
          {T('此刻压在你身上的身份句子', 'The identity sentence weighing on you now')}
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={T('例如：我又失败了，所以神不会接纳我。', 'For example: I failed again, so God will not receive me.')}  aria-label={T('例如：我又失败了，所以神不会接纳我。', 'For example: I failed again, so God will not receive me.')}/>
        </label>
      )}
      <div className="sf-home-grid">
        <div>
          <h4>{T('可能背负的句子', 'Possible sentence you are carrying')}</h4>
          <p>{data.falseIdentity}</p>
        </div>
        <div>
          <h4>{T('福音中的真实身份', 'True identity in the gospel')}</h4>
          <p>{data.inChristTruth}</p>
        </div>
      </div>
      <p className="sf-prayer">{data.assurance}</p>
      <div className="sf-chip-row">{data.scriptureRefs.map((ref) => <span className="sf-chip" key={ref}>{ref}</span>)}</div>
      <p><b>{T('小顺服：', 'Small obedience: ')}</b>{data.nextStep}</p>
      <p className="sf-muted">{data.prayer}</p>
      {token && (logged ? <p className="sf-success">{T('已记录到你的恩典记录。', 'Saved to your grace log.')}</p> : <button className="sf-primary" type="button" onClick={logGrace}>{T('保存到我的恩典记录', 'Save to my grace log')}</button>)}
    </article>
  )
}
