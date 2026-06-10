import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapCanvas } from './MapCanvas'
import { TimelineSlider } from './TimelineSlider'
import { LayerSwitcher } from './LayerSwitcher'
import { EventPanel } from './EventPanel'
import { DetailPanel } from './DetailPanel'
import { AICommentaryPanel } from './AICommentaryPanel'
import { DEFAULT_YEAR, DISCLAIMER } from '../domain/constants'
import { formatYear } from '../lib/format'
import { t, getRuntimeLang } from '../../../i18n/runtime'
import { pickVal } from '../../../i18n/pickLang'
import { AutoText } from '../../../autoTranslate.jsx'
import { PROPHECY_COLORS } from '../lib/colors'
import { fetchTerritories, fetchEvents, fetchProphecies, fetchCampaigns, fetchPeople } from '../lib/dataSource'
import type {
  BibleCampaignDTO,
  BibleLayer,
  BibleMapEventDTO,
  BibleMapSelection,
  BiblePersonJourneyDTO,
  BibleProphecyDTO,
  BibleTerritoryDTO,
} from '../domain/types'

export function BibleMapClient() {
  const [year, setYear] = useState<number>(DEFAULT_YEAR)
  const [layer, setLayer] = useState<BibleLayer>('tribes')
  const [territories, setTerritories] = useState<BibleTerritoryDTO[]>([])
  const [events, setEvents] = useState<BibleMapEventDTO[]>([])
  const [prophecies, setProphecies] = useState<BibleProphecyDTO[]>([])
  const [campaigns, setCampaigns] = useState<BibleCampaignDTO[]>([])
  const [people, setPeople] = useState<BiblePersonJourneyDTO[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selection, setSelection] = useState<BibleMapSelection | null>(null)
  const [focusEvent, setFocusEvent] = useState<BibleMapEventDTO | null>(null)
  // 人物行程播放
  const [eraFilter, setEraFilter] = useState<string | null>(null)
  const [timeLinked, setTimeLinked] = useState(false) // 人物列表随时间轴过滤（仅显示当前年代在世者）
  const [playIdx, setPlayIdx] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  // 请求竞态守卫：时间轴快速拖动/自动播放时，慢的旧响应可能后到，
  // 用自增序号丢弃过期响应，避免旧年代数据覆盖新数据。
  const terrSeqRef = useRef(0)
  const evtSeqRef = useRef(0)

  // 疆域：people/prophecies/campaigns 图层时用 all 作底图
  useEffect(() => {
    const effective: BibleLayer = layer === 'tribes' || layer === 'empires' ? layer : 'all'
    const seq = ++terrSeqRef.current
    void fetchTerritories(year, effective).then((d) => {
      if (terrSeqRef.current === seq) setTerritories(d)
    })
  }, [year, layer])

  useEffect(() => {
    const seq = ++evtSeqRef.current
    setEventsLoading(true)
    void fetchEvents(year).then((d) => {
      if (evtSeqRef.current !== seq) return
      setEvents(d)
      setEventsLoading(false)
    })
  }, [year])

  useEffect(() => {
    void fetchProphecies().then(setProphecies)
    void fetchCampaigns().then(setCampaigns)
    void fetchPeople().then(setPeople)
  }, [])

  const onTerritoryClick = useCallback((id: string) => {
    setTerritories((cur) => {
      const t = cur.find((x) => x.id === id)
      if (t) setSelection({ kind: 'territory', territory: t })
      return cur
    })
  }, [])

  const prophecyForMap = selection?.kind === 'prophecy' ? (selection.prophecy ?? null) : null
  const campaignForMap = selection?.kind === 'campaign' ? (selection.campaign ?? null) : null
  const personForMap = selection?.kind === 'person' ? (selection.person ?? null) : null
  const activeTerritoryId = selection?.kind === 'territory' ? (selection.territory?.id ?? null) : null

  // —— 人物行程播放：换人/换图层即复位；播放时定时步进 ——
  useEffect(() => { setPlayIdx(null); setPlaying(false) }, [personForMap?.id, layer])
  useEffect(() => {
    if (!playing || !personForMap) return
    if (playIdx === null) { setPlayIdx(0); return }
    if (playIdx >= personForMap.stops.length - 1) { setPlaying(false); return }
    const timer = setTimeout(() => setPlayIdx((i) => (i === null ? 0 : i + 1)), 3000)
    return () => clearTimeout(timer)
  }, [playing, playIdx, personForMap])
  const focusStop = personForMap && playIdx !== null
    ? personForMap.stops[Math.min(playIdx, personForMap.stops.length - 1)]
    : null

  const peopleEras = useMemo(() => [...new Set(people.map((p) => p.era))], [people])
  const filteredPeople = useMemo(() => {
    let list = eraFilter ? people.filter((p) => p.era === eraFilter) : people
    if (timeLinked) {
      list = list.filter((p) =>
        p.startYear === null || (p.startYear <= year && (p.endYear === null || p.endYear >= year)),
      )
    }
    return list
  }, [people, eraFilter, timeLinked, year])

  const leftList = useMemo(() => {
    if (layer === 'people') {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-xs text-gray-400">{t('人物生平地点轨迹（点击显示路线与站点）')}</div>
          {/* 时期筛选 */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setEraFilter(null)}
              className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                eraFilter === null ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('全部')}
            </button>
            {peopleEras.map((era) => (
              <button
                key={era}
                type="button"
                onClick={() => setEraFilter(era === eraFilter ? null : era)}
                className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                  eraFilter === era ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <AutoText>{era}</AutoText>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTimeLinked((v) => !v)}
              title={t('仅显示当前年代在世的人物')}
              className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                timeLinked ? 'border-sky-400/60 bg-sky-400/15 text-sky-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('🕰 随时间轴')}
            </button>
          </div>
          {timeLinked && filteredPeople.length === 0 && (
            <p className="mb-2 rounded-lg bg-white/[0.04] p-2 text-[11px] leading-relaxed text-gray-400">
              {formatYear(year)}{t(' 无收录人物在世——拖动时间轴，或点「🕰 随时间轴」关闭过滤。')}
            </p>
          )}
          {/* 行程播放控制 */}
          {personForMap && (
            <div className="mb-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  className="rounded-md border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-400/25"
                >
                  {playing ? t('⏸ 暂停') : t('▶ 播放行程')}
                </button>
                <button
                  type="button"
                  disabled={playIdx === null || playIdx <= 0}
                  onClick={() => { setPlaying(false); setPlayIdx((i) => Math.max(0, (i ?? 0) - 1)) }}
                  className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-40"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={playIdx !== null && playIdx >= personForMap.stops.length - 1}
                  onClick={() => { setPlaying(false); setPlayIdx((i) => Math.min(personForMap.stops.length - 1, (i ?? -1) + 1)) }}
                  className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-40"
                >
                  ›
                </button>
                {focusStop && (
                  <span className="ml-auto text-[11px] text-gray-400">{focusStop.sequence}/{personForMap.stops.length}</span>
                )}
              </div>
              {focusStop && (
                <div className="mt-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-100">{pickVal(focusStop.nameZh, focusStop.name)}</span>
                    <span className="shrink-0 text-[11px] text-amber-300">{focusStop.ref}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-300"><AutoText>{focusStop.summary}</AutoText></p>
                </div>
              )}
            </div>
          )}
          <ul className="space-y-1.5">
            {filteredPeople.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'person', person: p })}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    personForMap?.id === p.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="font-semibold text-gray-100">{pickVal(p.personZh, p.person)}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-400">{p.era} · {p.stops.length} {t('站点')} · {p.scriptureRange}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    if (layer === 'prophecies') {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-xs text-gray-400">{t('先知预言（点击发射预言射线）')}</div>
          <ul className="space-y-1.5">
            {prophecies.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'prophecy', prophecy: p })}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    prophecyForMap?.id === p.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                  }`}
                >
                  <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: PROPHECY_COLORS[p.prophecyType] }} />
                  <span className="font-semibold text-gray-100">{p.book} {p.chapterStart} · {getRuntimeLang() === 'en' ? 'on ' : '论'}{pickVal(p.targetNationZh, p.targetNation)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    if (layer === 'campaigns') {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-xs text-gray-400">{t('战役（点击播放路线）')}</div>
          <ul className="space-y-1.5">
            {campaigns.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'campaign', campaign: c })}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    campaignForMap?.id === c.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold text-gray-100">{pickVal(c.nameZh, c.name)}</div>
                  <div className="text-[11px] text-gray-400">{formatYear(c.startYear)}{(c.commanderZh || c.commander) ? ` · ${pickVal(c.commanderZh, c.commander)}` : ''}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    return (
      <EventPanel
        events={events}
        loading={eventsLoading}
        selectedId={selection?.kind === 'event' ? selection.event?.id : undefined}
        onSelect={(e) => {
          setFocusEvent(e)
          setSelection({ kind: 'event', event: e })
        }}
      />
    )
  }, [layer, people, prophecies, campaigns, events, eventsLoading, selection, prophecyForMap, campaignForMap, personForMap, peopleEras, filteredPeople, eraFilter, timeLinked, year, playing, playIdx, focusStop])

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-3 p-3 lg:h-[calc(100vh-2rem)] lg:flex-row">
      {/* 左栏 */}
      <aside className="flex w-full flex-col gap-3 lg:w-80 lg:overflow-y-auto">
        <LayerSwitcher layer={layer} onLayerChange={setLayer} />
        <TimelineSlider year={year} onYearChange={setYear} />
        {leftList}
      </aside>

      {/* 中间地图 */}
      <main className="flex min-h-[360px] flex-1 flex-col">
        <div className="relative flex-1">
          <MapCanvas
            territories={territories}
            prophecy={prophecyForMap}
            campaign={campaignForMap}
            person={personForMap}
            focusStop={focusStop}
            focusEvent={focusEvent}
            activeTerritoryId={activeTerritoryId}
            onTerritoryClick={onTerritoryClick}
          />
        </div>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-500">{DISCLAIMER}</p>
      </main>

      {/* 右栏 */}
      <aside className="flex w-full flex-col gap-3 lg:w-80 lg:overflow-y-auto">
        <DetailPanel selection={selection} />
        <AICommentaryPanel selection={selection} />
      </aside>
    </div>
  )
}
