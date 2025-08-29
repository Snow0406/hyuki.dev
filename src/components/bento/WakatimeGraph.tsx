'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SiSharp,
  SiAstro,
  SiMdx,
  SiTypescript,
  SiMarkdown,
  SiC,
  SiCss3,
  SiLua,
  SiOpenai,
  SiUnity,
  SiCplusplus,
} from 'react-icons/si'
import type { IconType } from 'react-icons'

// 미디어 쿼리를 위한 훅 추가
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => {
      setMatches(media.matches)
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

interface Language {
  name: string
  percent: number
  color: string
  hours: number
  minutes: number
  text: string
  total_seconds: number
  fill?: string
  value?: number
}

// global.css에 정의된 차트 색상 사용
const colors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
]

// 언어별 아이콘 매핑
const languageIcons: { [key: string]: IconType } = {
  'c#': SiSharp,
  astro: SiAstro,
  mdx: SiMdx,
  typescript: SiTypescript,
  markdown: SiMarkdown,
  c: SiC,
  css: SiCss3,
  lua: SiLua,
  assembly: SiOpenai,
  unity: SiUnity,
  'c++': SiCplusplus,
}

const getLanguageIcon = (name: string | any) => {
  // name이 문자열인지 확인
  const nameStr = typeof name === 'string' ? name : String(name || '')
  const lowercaseName = nameStr.toLowerCase()
  const Icon = languageIcons[lowercaseName]

  if (Icon) {
    return <Icon size={15} style={{ color: 'var(--foreground)' }} />
  }

  // 아이콘이 없는 경우 첫 글자를 보여줌
  return (
    <span className="text-foreground text-xs font-medium">
      {nameStr.slice(0, 1)}
    </span>
  )
}

const WakatimeGraph = () => {
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // xl 크기 미디어 쿼리 감지
  const isXl = useMediaQuery('(min-width: 1280px)')

  useEffect(() => {
    fetch(
      'https://wakatime.com/share/@Hy/11073dd5-a7bb-40f8-a236-5bf3f7f64c33.json',
    )
      .then((response) => {
        if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다')
        return response.json()
      })
      .then((data) => {
        // 상위 7개 언어만 사용
        const processedData = data.data
          .slice(0, 7)
          .map((lang: Language, index: number) => ({
            ...lang,
            fill: colors[index % colors.length],
            value: lang.hours,
          }))
        setLanguages(processedData)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Wakatime 데이터 불러오기 실패:', err)
      })
  }, [])

  if (isLoading)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-0">
        <div
          className={`flex w-full flex-col px-8 py-10 ${isXl ? 'space-y-[12.5px] px-8' : 'space-y-[15px]'}`}
        >
          {[...Array(7)].map((_, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`flex h-4 w-4 items-center justify-center ${isXl ? 'mr-5' : 'mr-5'}`}
              >
                <Skeleton className="h-5 w-5 rounded-2xl" />
              </div>
              <Skeleton
                className="h-[18px] rounded-md"
                style={{
                  width: `${Math.max(85 - index * 12, 10)}%`,
                  opacity: 0.8,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )

  if (error) return <div className="text-destructive p-4">오류: {error}</div>

  // 커스텀 YAxis 틱 렌더러
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject width={30} height={30} x={-35} y={-7}>
          <div
            className="flex items-center justify-center"
            title={payload.value}
          >
            {getLanguageIcon(payload.value)}
          </div>
        </foreignObject>
      </g>
    )
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-0"
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <BarChart
        layout="vertical"
        width={320}
        height={240}
        data={languages}
        margin={{
          top: 5,
          right: isXl ? 100 : 55,
          bottom: 5,
          left: isXl ? 60 : 40,
        }}
        barSize={18}
        className={isXl ? 'pl-4' : ''}
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          width={40}
          tickLine={false}
          axisLine={false}
          tick={<CustomYAxisTick />}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} isAnimationActive={false}>
          {languages.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.fill || 'var(--background)'}
              fillOpacity={hoveredIndex === index ? 1 : 0.85}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                filter:
                  hoveredIndex === index
                    ? 'drop-shadow(0 0 8px rgba(120, 200, 255, 0.7))'
                    : 'none',
                transition: 'filter 0.3s ease, fill-opacity 0.3s ease',
                cursor: 'pointer',
              }}
            />
          ))}

          <LabelList
            dataKey="value"
            position="right"
            formatter={(value: any) => `${value}h`}
            fill="var(--foreground)"
            fontSize={12}
            fontWeight={500}
            offset={isXl ? 15 : 10}
          />
        </Bar>
      </BarChart>
    </div>
  )
}

export default WakatimeGraph
