'use client'
import type { BibleMapSelection } from '../domain/types'
import { formatYear } from '../lib/format'
import { STATUS_COLORS } from '../lib/colors'
import { t } from '../../../i18n/runtime'
import { pick, pickVal } from '../../../i18n/pickLang'

interface Props {
  selection: BibleMapSelection | null
}

const STATUS_LABEL: Record<string, string> = {
  stable: '稳固', disputed: '争夺中', oppressed: '受压制', lost: '失守', empire: '帝国',
}

const OWNER_LABEL: Record<string, string> = {
  tribe: '支派',
  empire: '帝国',
  nation: '国家',
  kingdom: '王国',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-right text-gray-100">{value}</span>
    </div>
  )
}

export function DetailPanel({ selection }: Props) {
  if (!selection) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-gray-400">
          {t('点击地图上的支派 / 帝国疆域，或左侧事件、人物、预言与战役，查看详情。')}
        </div>
      </div>
    )
  }

  if (selection.kind === 'territory' && selection.territory) {
    const t0 = selection.territory
    const desc = pick(t0 as unknown as Record<string, unknown>, 'description')
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_COLORS[t0.status] }} />
          <h3 className="text-lg font-bold text-white">{pickVal(t0.nameZh, t0.name)}</h3>
          <span className="text-xs text-gray-400">{t0.name}</span>
        </div>
        <Row label={t('类型')} value={t(OWNER_LABEL[t0.ownerType] ?? t0.ownerType)} />
        <Row label={t('时期')} value={`${formatYear(t0.startYear)} – ${t0.endYear === null ? t('今') : formatYear(t0.endYear)}`} />
        <Row label={t('控制指数')} value={`${t0.controlScore} / 100`} />
        <Row label={t('状态')} value={t(STATUS_LABEL[t0.status] ?? t0.status)} />
        {desc && <p className="mt-2 text-sm leading-relaxed text-gray-300">{desc}</p>}
      </div>
    )
  }

  if (selection.kind === 'prophecy' && selection.prophecy) {
    const p = selection.prophecy
    const nation = pickVal(p.targetNationZh, p.targetNation)
    const desc = pick(p as unknown as Record<string, unknown>, 'description')
    const fulfill = pick(p as unknown as Record<string, unknown>, 'fulfillmentDescription')
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-lg font-bold text-white">{p.book} {p.chapterStart}{p.chapterEnd ? `-${p.chapterEnd}` : ''} · {t('论')}{nation}</h3>
        <Row label={t('对象')} value={`${nation} (${p.targetNation})`} />
        <Row label={t('类型')} value={p.prophecyType} />
        <Row label={t('发出')} value={p.sourceLocation} />
        {p.fulfillmentYear !== null && <Row label={t('应验')} value={formatYear(p.fulfillmentYear)} />}
        {desc && <p className="mt-2 text-sm leading-relaxed text-gray-300">{desc}</p>}
        {fulfill && (
          <p className="mt-2 rounded-lg bg-emerald-500/10 p-2 text-sm leading-relaxed text-emerald-300">
            {t('应验')}：{fulfill}
          </p>
        )}
      </div>
    )
  }

  if (selection.kind === 'campaign' && selection.campaign) {
    const c = selection.campaign
    const desc = pick(c as unknown as Record<string, unknown>, 'description')
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-lg font-bold text-white">{pickVal(c.nameZh, c.name)}</h3>
        <Row label={t('名称')} value={c.name} />
        {c.commanderZh && <Row label={t('统帅')} value={pickVal(c.commanderZh, c.commander)} />}
        <Row label={t('年代')} value={formatYear(c.startYear)} />
        {c.book && <Row label={t('经文')} value={`${c.book} ${c.chapter ?? ''}`} />}
        {desc && <p className="mt-2 text-sm leading-relaxed text-gray-300">{desc}</p>}
      </div>
    )
  }

  if (selection.kind === 'event' && selection.event) {
    const e = selection.event
    const desc = pick(e as unknown as Record<string, unknown>, 'description')
    const meaning = pick(e as unknown as Record<string, unknown>, 'spiritualMeaning')
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-lg font-bold text-white">{pickVal(e.titleZh, e.title)}</h3>
        <Row label={t('年代')} value={formatYear(e.startYear)} />
        {e.locationName && <Row label={t('地点')} value={e.locationName} />}
        {e.book && <Row label={t('经文')} value={`${e.book} ${e.chapter ?? ''}`} />}
        {desc && <p className="mt-2 text-sm leading-relaxed text-gray-300">{desc}</p>}
        {meaning && (
          <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-sm leading-relaxed text-amber-200">
            {t('属灵意义')}：{meaning}
          </p>
        )}
      </div>
    )
  }

  if (selection.kind === 'person' && selection.person) {
    const p = selection.person
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
          <h3 className="text-lg font-bold text-white">{pickVal(p.personZh, p.person)}</h3>
          <span className="text-xs text-gray-400">{p.person}</span>
        </div>
        <Row label={t('角色')} value={p.role} />
        <Row label={t('时期')} value={p.era} />
        <Row label={t('年代')} value={`${p.startYear === null ? '?' : formatYear(p.startYear)} – ${p.endYear === null ? '?' : formatYear(p.endYear)}`} />
        <Row label={t('经文')} value={p.scriptureRange} />
        <p className="mt-2 text-sm leading-relaxed text-gray-300">{p.description}</p>
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-2 text-xs font-semibold text-amber-300">{t('地点轨迹')}</div>
          <ol className="space-y-2">
            {p.stops.map((stop) => (
              <li key={stop.id} className="rounded-lg bg-white/[0.04] p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-gray-100">
                    {stop.sequence}. {pickVal(stop.nameZh, stop.name)}
                  </div>
                  <div className="shrink-0 text-[11px] text-amber-300">{stop.ref}</div>
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  {stop.year === null ? t('年代不详') : formatYear(stop.year)} · {stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-300">{stop.summary}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  return null
}
