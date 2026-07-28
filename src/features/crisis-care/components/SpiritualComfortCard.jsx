import { t as i18nT } from '../../../i18n/runtime'
import { useEffect, useMemo, useState } from 'react'
import { COMFORT_SCRIPTURES, CONVICTION_VS_CONDEMNATION } from '../data/crisisContent'
import { crisisApi } from '../lib/api'
import { speakOnce, stopAllAudio } from '../../../useGlobalAudio'
import { getMediaPref } from '../../../lib/media/mediaPrefs'
import { CardActions } from '../../../lib/media/CardActions'

/**
 * SpiritualComfortCard — 低压属灵安慰。先安慰、不控告、不用经文压人。
 * 帮助分辨：圣灵的责备 vs 撒但的控告。后端不可用时用本地内容兜底。
 *
 * 多模态：安慰的话可以「听」——绝望时读一段字很费力，被念给你听不费力；
 * 并可生成一张安慰卡，离线也能看见那句话。
 */
const DEFAULT_BODY =
  '你现在听到的，可能不是从神来的责备，而是一种把你推向绝望的控告。\n' +
  '从神来的责备会带人回到基督；控告却让人觉得没有出路。\n' +
  '此刻我们先不审判你的一生，只做一件事：让你安全地度过今天。'

export default function SpiritualComfortCard({ detectedType, message }) {
  const [data, setData] = useState(null)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    let cancelled = false
    crisisApi.comfort(detectedType, message)
      .then((res) => { if (!cancelled) setData(res) })
      .catch(() => { if (!cancelled) setData(null) })
    return () => { cancelled = true }
  }, [detectedType, message])

  useEffect(() => () => stopAllAudio(), [])

  const body = data?.body || DEFAULT_BODY
  const scripture = data?.scripture || COMFORT_SCRIPTURES[0]
  const table = data?.convictionVsCondemnation || CONVICTION_VS_CONDEMNATION
  const soundOn = getMediaPref('crisisAudio')

  const buildSpec = useMemo(() => () => ({
    badge: i18nT('给此刻的你'),
    title: scripture.text,
    subtitle: `—— ${scripture.ref}`,
    sections: [{ heading: i18nT('现在只做一件事'), items: [i18nT('安全地度过今天。其余的，都可以晚一点再说。')], emphasis: true }],
    footer: i18nT('你不需要表现得刚强。可以把这张卡设成锁屏，随时看一眼。'),
  }), [scripture])

  async function readAloud() {
    if (speaking) { stopAllAudio(); setSpeaking(false); return }
    setSpeaking(true)
    await speakOnce(`${body.replace(/\n/g, '。')} ${scripture.text}。${scripture.ref}。`, { rate: 0.82 })
    setSpeaking(false)
  }

  return (
    <div className="cc-card">
      <p>{body}</p>
      <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', margin: '10px 0' }}>
        <div style={{ fontSize: 13.5 }}>「{scripture.text}」</div>
        <div className="cc-muted" style={{ marginTop: 4 }}>—— {scripture.ref}</div>
      </div>

      {soundOn && (
        <button className="cc-btn secondary" type="button" onClick={readAloud} style={{ marginBottom: 8 }}>
          {speaking ? `⏹ ${i18nT('停止')}` : `🔊 ${i18nT('念给我听')}`}
        </button>
      )}

      <p className="cc-muted">{i18nT('我不会用经文压你。这里只给你一句可以抓住的话。你现在不需要表现得刚强。')}</p>

      <CardActions buildSpec={buildSpec} filename="comfort-card.png" label="做成一张卡，随时能看见" templates={['calm', 'ink', 'dawn']} />

      <h3 style={{ marginTop: 14 }}>{i18nT('分辨：是责备，还是控告？')}</h3>
      <table className="cc-cvc">
        <thead>
          <tr><th></th><th className="conviction">{i18nT('圣灵的责备')}</th><th className="condemnation">{i18nT('撒但的控告')}</th></tr>
        </thead>
        <tbody>
          {table.map((row) => (
            <tr key={row.dimension}>
              <td className="cc-muted">{row.dimension}</td>
              <td className="conviction">{row.conviction}</td>
              <td className="condemnation">{row.condemnation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
