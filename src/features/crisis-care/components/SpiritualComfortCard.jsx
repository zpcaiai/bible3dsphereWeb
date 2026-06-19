import { useEffect, useState } from 'react'
import { COMFORT_SCRIPTURES, CONVICTION_VS_CONDEMNATION } from '../data/crisisContent'
import { crisisApi } from '../lib/api'

/**
 * SpiritualComfortCard — 低压属灵安慰。先安慰、不控告、不用经文压人。
 * 帮助分辨：圣灵的责备 vs 撒但的控告。后端不可用时用本地内容兜底。
 */
const DEFAULT_BODY =
  '你现在听到的，可能不是从神来的责备，而是一种把你推向绝望的控告。\n' +
  '从神来的责备会带人回到基督；控告却让人觉得没有出路。\n' +
  '此刻我们先不审判你的一生，只做一件事：让你安全地度过今天。'

export default function SpiritualComfortCard({ detectedType, message }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    crisisApi.comfort(detectedType, message)
      .then((res) => { if (!cancelled) setData(res) })
      .catch(() => { if (!cancelled) setData(null) })
    return () => { cancelled = true }
  }, [detectedType, message])

  const body = data?.body || DEFAULT_BODY
  const scripture = data?.scripture || COMFORT_SCRIPTURES[0]
  const table = data?.convictionVsCondemnation || CONVICTION_VS_CONDEMNATION

  return (
    <div className="cc-card">
      <p>{body}</p>
      <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', margin: '10px 0' }}>
        <div style={{ fontSize: 13.5 }}>「{scripture.text}」</div>
        <div className="cc-muted" style={{ marginTop: 4 }}>—— {scripture.ref}</div>
      </div>
      <p className="cc-muted">我不会用经文压你。这里只给你一句可以抓住的话。你现在不需要表现得刚强。</p>

      <h3 style={{ marginTop: 14 }}>分辨：是责备，还是控告？</h3>
      <table className="cc-cvc">
        <thead>
          <tr><th></th><th className="conviction">圣灵的责备</th><th className="condemnation">撒但的控告</th></tr>
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
