'use client'
import { useEffect, useRef, useState } from 'react'
import { YEAR_MIN, YEAR_MAX, YEAR_STEP } from '../domain/constants'
import { formatYear } from '../lib/format'
import { t } from '../../../i18n/runtime'

interface Props {
  year: number
  onYearChange: (year: number) => void
}

export function TimelineSlider({ year, onYearChange }: Props) {
  // 本地值保证拖动流畅；防抖向上传播，避免每帧都触发数据请求
  const [local, setLocal] = useState(year)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 外部 year 变化（如点击时代按钮）时同步本地值
  useEffect(() => { setLocal(year) }, [year])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const handle = (v: number) => {
    setLocal(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onYearChange(v), 180)
  }

  // 时间轴自动播放：帝国疆域随年代推进而消长
  useEffect(() => {
    if (!playing) return
    if (local >= YEAR_MAX) { setPlaying(false); return }
    const id = setTimeout(() => {
      const next = Math.min(YEAR_MAX, local + YEAR_STEP)
      setLocal(next)
      onYearChange(next)
    }, 800)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, local])

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400">{t('时间轴')}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!playing && local >= YEAR_MAX) { setLocal(YEAR_MIN); onYearChange(YEAR_MIN) }
              setPlaying((v) => !v)
            }}
            className={`rounded-md border px-2 py-0.5 text-xs font-semibold transition ${
              playing ? 'border-amber-400/60 bg-amber-400/20 text-amber-300' : 'border-white/15 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
            aria-label={playing ? t('暂停时间轴播放') : t('播放时间轴')}
          >
            {playing ? t('⏸ 暂停') : t('▶ 播放')}
          </button>
          <span className="text-lg font-bold text-amber-400">{formatYear(local)}</span>
        </div>
      </div>
      <input
        type="range"
        min={YEAR_MIN}
        max={YEAR_MAX}
        step={YEAR_STEP}
        value={local}
        onChange={(e) => handle(Number.parseInt(e.target.value, 10))}
        className="w-full accent-amber-400"
        aria-label={t('年份时间轴')}
        aria-valuetext={formatYear(local)}
      />
      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
        <span>{formatYear(YEAR_MIN)}</span>
        <span>{formatYear(YEAR_MAX)}</span>
      </div>
    </div>
  )
}
