import { t as i18nT } from '../../../i18n/runtime'
'use client'
import type { BibleMapSelection } from '../domain/types'
import { formatYear } from '../lib/format'
import { STATUS_COLORS } from '../lib/colors'

interface Props {
  selection: BibleMapSelection | null
}

const STATUS_LABEL: Record<string, string> = {
  stable: '稳固', disputed: '争夺中', oppressed: '受压制', lost: '失守', empire: '帝国',
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
          {i18nT('点击地图上的支派 / 帝国疆域，或左侧事件、图层中的预言与战役，查看详情。')}
        </div>
      </div>
    )
  }

  if (selection.kind === 'territory' && selection.territory) {
    const t = selection.territory
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_COLORS[t.status] }} />
          <h3 className="text-lg font-bold text-white">{t.nameZh}</h3>
          <span className="text-xs text-gray-400">{t.name}</span>
        </div>
        <Row label={i18nT('类型')} value={t.ownerType === 'tribe' ? '支派' : '帝国'} />
        <Row label={i18nT('时期')} value={`${formatYear(t.startYear)} – ${t.endYear === null ? '今' : formatYear(t.endYear)}`} />
        <Row label={i18nT('控制指数')} value={`${t.controlScore} / 100`} />
        <Row label={i18nT('状态')} value={STATUS_LABEL[t.status] ?? t.status} />
        {t.description && <p className="mt-2 text-sm leading-relaxed text-gray-300">{t.description}</p>}
      </div>
    )
  }

  if (selection.kind === 'prophecy' && selection.prophecy) {
    const p = selection.prophecy
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-lg font-bold text-white">{p.book} {p.chapterStart}{p.chapterEnd ? `-${p.chapterEnd}` : ''} {i18nT('· 论')}{p.targetNationZh}</h3>
        <Row label={i18nT('对象')} value={`${p.targetNationZh} (${p.targetNation})`} />
        <Row label={i18nT('类型')} value={p.prophecyType} />
        <Row label={i18nT('发出')} value={p.sourceLocation} />
        {p.fulfillmentYear !== null && <Row label={i18nT('应验')} value={formatYear(p.fulfillmentYear)} />}
        <p className="mt-2 text-sm leading-relaxed text-gray-300">{p.description}</p>
        {p.fulfillmentDescription && (
          <p className="mt-2 rounded-lg bg-emerald-500/10 p-2 text-sm leading-relaxed text-emerald-300">
            {i18nT('应验：')}{p.fulfillmentDescription}
          </p>
        )}
      </div>
    )
  }

  if (selection.kind === 'campaign' && selection.campaign) {
    const c = selection.campaign
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-lg font-bold text-white">{c.nameZh}</h3>
        <Row label={i18nT('名称')} value={c.name} />
        {c.commanderZh && <Row label={i18nT('统帅')} value={c.commanderZh} />}
        <Row label={i18nT('年代')} value={formatYear(c.startYear)} />
        {c.book && <Row label={i18nT('经文')} value={`${c.book} ${c.chapter ?? ''}`} />}
        {c.description && <p className="mt-2 text-sm leading-relaxed text-gray-300">{c.description}</p>}
      </div>
    )
  }

  if (selection.kind === 'event' && selection.event) {
    const e = selection.event
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-lg font-bold text-white">{e.titleZh}</h3>
        <Row label={i18nT('年代')} value={formatYear(e.startYear)} />
        {e.locationName && <Row label={i18nT('地点')} value={e.locationName} />}
        {e.book && <Row label={i18nT('经文')} value={`${e.book} ${e.chapter ?? ''}`} />}
        {e.description && <p className="mt-2 text-sm leading-relaxed text-gray-300">{e.description}</p>}
        {e.spiritualMeaning && (
          <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-sm leading-relaxed text-amber-200">
            {i18nT('属灵意义：')}{e.spiritualMeaning}
          </p>
        )}
      </div>
    )
  }

  if (selection.kind === 'person' && selection.person) {
    const p = selection.person
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="bible-map-person-detail">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
          <h3 className="text-lg font-bold text-white">{p.personZh}</h3>
          <span className="text-xs text-gray-400">{p.person}</span>
        </div>
        <Row label={i18nT('时期')} value={p.era} />
        <Row label={i18nT('职分')} value={p.role} />
        <Row label={i18nT('经文范围')} value={p.scriptureRange} />
        <p className="mt-2 text-sm leading-relaxed text-gray-300">{p.description}</p>
        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="mb-1.5 text-xs font-semibold text-amber-300">{i18nT('行程站点')}（{p.stops.length}）</div>
          <ol className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-xs">
            {p.stops.map((s) => (
              <li key={s.id} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                <div className="flex items-center justify-between font-medium text-gray-100">
                  <span>{s.sequence}. {s.nameZh} ({s.name})</span>
                  <span className="text-[11px] text-amber-300">{s.ref}</span>
                </div>
                <div className="mt-0.5 text-gray-400">{s.summary}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  return null
}
