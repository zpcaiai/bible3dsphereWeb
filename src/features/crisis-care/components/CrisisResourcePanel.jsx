import { t as i18nT } from '../../../i18n/runtime'
import { useMemo, useState } from 'react'
import { REGION_OPTIONS, getResources } from '../data/crisisResources'
import { CardActions } from '../../../lib/media/CardActions'

/**
 * CrisisResourcePanel — 按地区显示危机热线与紧急资源。
 * tel: 链接可一键拨打。数据优先用后端返回的 block，否则用本地多地区表兜底。
 */
function telHref(contact) {
  const digits = String(contact).replace(/[^0-9+]/g, '')
  return digits.length >= 3 ? `tel:${digits}` : null
}

export default function CrisisResourcePanel({ block, defaultRegion = 'TW', compact = false }) {
  const [region, setRegion] = useState(block?.regionCode || defaultRegion)
  const data = useMemo(() => {
    if (block && (block.regionCode === region || !region)) return block
    return getResources(region)
  }, [block, region])

  return (
    <div>
      {!compact && (
        <div className="cc-field">
          <label>{i18nT('选择你所在的地区（用于显示对的热线）')}</label>
          <select className="cc-select" value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGION_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
      {(data?.resources || []).map((r, i) => {
        const href = telHref(r.contact)
        const isEmergency = r.type === 'emergency' || r.type === 'suicide_prevention'
        return (
          <div className="cc-resource" key={`${r.contact}-${i}`}>
            <div>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div className="meta">{r.contact} · {r.availability}{r.note ? ` · ${r.note}` : ''}</div>
            </div>
            {href ? (
              <a className={`cc-call ${isEmergency ? 'emergency' : ''}`} href={href}>{i18nT('拨打')}</a>
            ) : (
              <span className="meta">{r.contact}</span>
            )}
          </div>
        )
      })}
      <p className="cc-muted">{i18nT('如果你此刻有立即危险，请直接拨打')}{data?.emergencyNumber ? ` ${data.emergencyNumber} ` : '当地紧急电话'}。</p>

      {/* 断网、手机没电前截图、或替不用智能机的人打印——热线必须能离开 App 存在。 */}
      {!compact && (
        <CardActions
          label="把热线做成一张卡（可离线查看）"
          filename="crisis-hotlines.png"
          templates={['ink', 'calm']}
          buildSpec={() => ({
            badge: i18nT('危机热线'),
            title: i18nT('撑不住的时候，打这些电话'),
            sections: [
              { heading: i18nT('立即危险'), items: [data?.emergencyNumber ? `${i18nT('紧急电话')} ${data.emergencyNumber}` : i18nT('当地紧急电话')], emphasis: true },
              { heading: i18nT('危机与陪伴'), items: (data?.resources || []).map((r) => `${r.name} ${r.contact}（${r.availability}）`) },
            ],
            footer: i18nT('打电话求助不是软弱。把这张图存进相册，需要时不用解锁 App 也能看见。'),
          })}
        />
      )}
    </div>
  )
}
