'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { type FunctionComponent, useEffect, useState } from 'react'

interface Day {
  date: string
  total: number
}

interface ApiResponse {
  days: Array<Day>
}

interface PricePoint {
  date: string
  value: number
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

const SHARE_URL =
  'https://wakatime.com/share/@Hy/df946edc-3066-4748-bf37-849b26161e78.json'

async function fetchCalendarData(): Promise<ApiResponse> {
  try {
    const proxied = await fetch('/api/wakatime')
    if (proxied.ok) return (await proxied.json()) as ApiResponse
  } catch {
    // ignore, fall back to share URL
  }

  const fallback = await fetch(SHARE_URL)
  if (!fallback.ok) {
    throw new Error('데이터를 불러오는데 실패했습니다')
  }
  return (await fallback.json()) as ApiResponse
}

function buildChartGeometry(
  points: PricePoint[],
  width: number,
  height: number,
  padX: number,
  padY: number,
) {
  if (points.length === 0) {
    return {
      path: '',
      baselineY: height / 2,
      xAt: (_i: number) => 0,
      yAt: (_v: number) => 0,
    }
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0

  const xAt = (i: number) => padX + i * xStep
  const yAt = (v: number) => padY + innerH - ((v - min) / range) * innerH

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)},${yAt(p.value).toFixed(2)}`,
    )
    .join(' ')

  return { path, baselineY: yAt(points[0].value), xAt, yAt }
}

// Parse "YYYY-MM-DD" as local date so timezone shifts don't change the day.
function formatHoverDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const WakatimeCalendar: FunctionComponent = () => {
  const [days, setDays] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const isSm = useMediaQuery('(min-width: 640px)')
  const isXl = useMediaQuery('(min-width: 1280px)')

  useEffect(() => {
    fetchCalendarData()
      .then((apiData) => {
        if (!apiData.days || !Array.isArray(apiData.days)) {
          console.error('예상치 못한 API 응답 형식:', apiData)
          setError(new Error('예상치 못한 API 응답 형식'))
          setLoading(false)
          return
        }

        const transformed = apiData.days.map((d) => ({
          date: d.date,
          value: Math.round(d.total / 60),
        }))

        setDays(transformed)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Wakatime 데이터 불러오기 실패:', err)
        setError(err)
        setLoading(false)
      })
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-center text-sm">
          데이터를 불러오는데 실패했습니다.
        </p>
      </div>
    )
  }

  if (loading) {
    return <Skeleton className="h-[70%] w-[85%] rounded-3xl" />
  }

  const pointCount = isXl ? 90 : isSm ? 60 : 30
  const visibleDays = days.slice(-pointCount)
  const lastIdx = visibleDays.length - 1

  // Base: today vs yesterday — determines line color, never changes on hover.
  const todayValue = visibleDays[lastIdx]?.value ?? 0
  const yesterdayValue = lastIdx > 0 ? visibleDays[lastIdx - 1].value : 0
  const baseDiff = todayValue - yesterdayValue
  const baseIsUp = baseDiff >= 0
  const lineColor = baseIsUp ? 'var(--strawberry)' : 'var(--chart-4)'

  // Active: hovered point (or today by default) — drives the header values.
  const activeIdx = hoverIndex ?? lastIdx
  const activePoint = visibleDays[activeIdx]
  const activeValue = activePoint?.value ?? 0
  const prevValue = activeIdx > 0 ? visibleDays[activeIdx - 1].value : 0
  const activeDiff = activeValue - prevValue
  const activeDiffPercent = prevValue > 0 ? (activeDiff / prevValue) * 100 : 0
  const activeIsUp = activeDiff >= 0
  const activeSign = activeIsUp ? '+' : ''
  const activeDiffColor = activeIsUp ? 'var(--strawberry)' : 'var(--chart-4)'

  const width = 400
  const height = 140
  const padX = 4
  const padY = 8
  const { path, baselineY, xAt, yAt } = buildChartGeometry(
    visibleDays,
    width,
    height,
    padX,
    padY,
  )

  const isHovering = hoverIndex !== null
  const hoverX = isHovering ? xAt(hoverIndex) : 0
  const hoverY =
    isHovering && activePoint ? yAt(activePoint.value) : 0

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (visibleDays.length < 2) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const idx = Math.round(relX * (visibleDays.length - 1))
    setHoverIndex(Math.max(0, Math.min(visibleDays.length - 1, idx)))
  }

  return (
    <div className="relative flex h-full w-full flex-col px-6 py-5">
      <div className="text-muted-foreground text-xs font-semibold tracking-wide">
        {isHovering && activePoint
          ? formatHoverDate(activePoint.date)
          : 'Strawberry Index'}
      </div>
      <div className="mt-1 text-2xl leading-none font-bold">
        {activeValue.toLocaleString('ko-KR')}
        <span className="text-muted-foreground ml-1 text-sm font-normal">
          STRAW
        </span>
      </div>
      <div
        className="mt-1 text-sm font-semibold"
        style={{ color: activeDiffColor }}
      >
        {activeSign}
        {activeDiff.toLocaleString('ko-KR')}
        {prevValue > 0 && ` (${activeSign}${activeDiffPercent.toFixed(1)}%)`}
      </div>
      <div
        className="relative mt-2 min-h-0 flex-1"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-label="Strawberry Index"
        >
          <line
            x1={padX}
            y1={baselineY}
            x2={width - padX}
            y2={baselineY}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.35}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={path}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {isHovering && (
            <line
              x1={hoverX}
              y1={padY}
              x2={hoverX}
              y2={height - padY}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              opacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {isHovering && (
          <div
            className="border-background pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              left: `${(hoverX / width) * 100}%`,
              top: `${(hoverY / height) * 100}%`,
              backgroundColor: lineColor,
            }}
          />
        )}
      </div>
      <div className="text-muted-foreground/70 mt-2 text-[10px] italic">
        * Daily WakaTime coding minutes
      </div>
    </div>
  )
}

export default WakatimeCalendar
