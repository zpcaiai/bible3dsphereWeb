import { t as i18nT } from '../../../i18n/runtime'
'use client'
import { Component, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { MapCanvas } from './MapCanvas'
import { TimelineSlider } from './TimelineSlider'
import { LayerSwitcher } from './LayerSwitcher'
import { EventPanel } from './EventPanel'
import { DetailPanel } from './DetailPanel'
import { AICommentaryPanel } from './AICommentaryPanel'
import { DEFAULT_YEAR, DISCLAIMER } from '../domain/constants'
import { formatYear } from '../lib/format'
import { PROPHECY_COLORS } from '../lib/colors'
import { featureCollection, feature, point } from '../lib/geojson'
import { fetchTerritories, fetchEvents, fetchProphecies, fetchCampaigns, fetchPeople } from '../lib/dataSource'
import type {
  BibleCampaignDTO,
  BibleLayer,
  BibleMapEventDTO,
  BibleMapSelection,
  BiblePersonJourneyDTO,
  BibleProphecyDTO,
  BibleTerritoryDTO,
  GeoJsonPoint,
} from '../domain/types'

class MapCanvasBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
          {i18nT('当前环境未启用 WebGL 地图画布，左侧图层/列表与右侧详情仍可正常浏览。')}
        </div>
      )
    }
    return this.props.children
  }
}

function personToCampaignProjection(p: BiblePersonJourneyDTO): BibleCampaignDTO {
  return {
    id: `person-${p.id}`,
    name: p.person,
    nameZh: `${p.personZh}（${p.era}）`,
    commander: p.person,
    commanderZh: p.personZh,
    startYear: p.startYear ?? DEFAULT_YEAR,
    endYear: p.endYear,
    book: p.scriptureRange,
    chapter: null,
    routeGeojson: p.routeGeojson,
    pointsGeojson: featureCollection<GeoJsonPoint>(
      p.stops.map((s) =>
        feature(point([s.longitude, s.latitude]), {
          kind: 'camp',
          nameZh: `${s.sequence}. ${s.nameZh}`,
        }),
      ),
    ),
    description: p.description,
  }
}

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

  // 疆域：prophecies/campaigns/people 图层时用 all 作底图
  useEffect(() => {
    const effective: BibleLayer = layer === 'tribes' || layer === 'empires' ? layer : 'all'
    void fetchTerritories(year, effective).then(setTerritories)
  }, [year, layer])

  useEffect(() => {
    setEventsLoading(true)
    void fetchEvents(year).then((d) => {
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
  const campaignForMap = useMemo(() => {
    if (selection?.kind === 'campaign') return selection.campaign ?? null
    if (selection?.kind === 'person' && selection.person) return personToCampaignProjection(selection.person)
    return null
  }, [selection])
  const activeTerritoryId = selection?.kind === 'territory' ? (selection.territory?.id ?? null) : null

  const leftList = useMemo(() => {
    if (layer === 'prophecies') {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-xs text-gray-400">{i18nT('先知预言（点击发射预言射线）')}</div>
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
                  <span className="font-semibold text-gray-100">{p.book} {p.chapterStart} {i18nT('· 论')}{p.targetNationZh}</span>
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
          <div className="mb-2 text-xs text-gray-400">{i18nT('战役（点击播放路线）')}</div>
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
                  <div className="font-semibold text-gray-100">{c.nameZh}</div>
                  <div className="text-[11px] text-gray-400">{formatYear(c.startYear)}{c.commanderZh ? ` · ${c.commanderZh}` : ''}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    if (layer === 'people') {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="bible-map-people-list">
          <div className="mb-2 text-xs text-gray-400">{i18nT('圣经人物足迹（点击展开全程站点与路线）')}</div>
          <ul className="space-y-1.5">
            {people.map((person) => {
              const isSelected = selection?.kind === 'person' && selection.person?.id === person.id
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    data-testid={`bible-map-person-${person.id}`}
                    onClick={() => setSelection({ kind: 'person', person })}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      isSelected ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-gray-100">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: person.color }} />
                      <span>{person.personZh}</span>
                      <span className="text-[11px] font-normal text-gray-400">({person.era})</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400">
                      {person.role} · {person.scriptureRange} · {person.stops.length} 站
                    </div>
                  </button>
                </li>
              )
            })}
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
  }, [layer, prophecies, campaigns, people, events, eventsLoading, selection, prophecyForMap, campaignForMap])

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
          <MapCanvasBoundary>
            <MapCanvas
              territories={territories}
              prophecy={prophecyForMap}
              campaign={campaignForMap}
              focusEvent={focusEvent}
              activeTerritoryId={activeTerritoryId}
              onTerritoryClick={onTerritoryClick}
            />
          </MapCanvasBoundary>
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
