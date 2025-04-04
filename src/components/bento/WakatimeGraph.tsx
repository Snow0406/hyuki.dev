'use client'

import React, { useState, useEffect } from 'react'
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
}

const getLanguageIcon = (name: string) => {
  const lowercaseName = name.toLowerCase()
  const Icon = languageIcons[lowercaseName]

  if (Icon) {
    return <Icon size={15} style={{ color: 'var(--foreground)' }} />
  }

  // 아이콘이 없는 경우 첫 글자를 보여줌
  return (
    <span className="text-foreground text-xs font-medium">
      {name.slice(0, 1)}
    </span>
  )
}

const WakatimeGraph = () => {
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        // 오류 발생 시 샘플 데이터를 대신 사용 (두 번째 이미지에 맞는 샘플 데이터)
        const fallbackData = [
          {
            name: 'C#',
            percent: 42.37,
            color: '#178600',
            hours: 29,
            minutes: 29,
            text: '29 hrs 29 mins',
            total_seconds: 106155.4,
          },
          {
            name: 'Astro',
            percent: 23.9,
            color: '#ff5a03',
            hours: 16,
            minutes: 38,
            text: '16 hrs 38 mins',
            total_seconds: 59883.5,
          },
          {
            name: 'MDX',
            percent: 8.65,
            color: '#fcb32c',
            hours: 6,
            minutes: 1,
            text: '6 hrs 1 min',
            total_seconds: 21674.5,
          },
          {
            name: 'TypeScript',
            percent: 5.87,
            color: '#3178c6',
            hours: 4,
            minutes: 5,
            text: '4 hrs 5 mins',
            total_seconds: 14700.4,
          },
          {
            name: 'Markdown',
            percent: 5.44,
            color: '#083fa1',
            hours: 3,
            minutes: 47,
            text: '3 hrs 47 mins',
            total_seconds: 13641.3,
          },
          {
            name: 'C',
            percent: 4.51,
            color: '#555555',
            hours: 3,
            minutes: 8,
            text: '3 hrs 8 mins',
            total_seconds: 11309.9,
          },
          {
            name: 'CSS',
            percent: 3.59,
            color: '#563d7c',
            hours: 2,
            minutes: 29,
            text: '2 hrs 29 mins',
            total_seconds: 8994.2,
          },
        ].map((lang, index) => ({
          ...lang,
          fill: colors[index % colors.length],
          value: lang.hours,
        }))
        setLanguages(fallbackData)
        setIsLoading(false)
      })
  }, [])

  if (isLoading)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-0">
        <div
          className={`flex w-full flex-col px-8 py-10 ${isXl ? 'space-y-[13px] px-8' : 'space-y-[15px]'}`}
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

  // 커스텀 Bar 호버 이벤트 핸들러
  const handleBarMouseEnter = (data: any, index: number) => {
    setHoveredIndex(index)
  }

  const handleBarMouseLeave = () => {
    setHoveredIndex(null)
  }

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
    <div className="flex h-full w-full flex-col items-center justify-center p-0">
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
        <Bar
          dataKey="value"
          radius={[4, 4, 4, 4]}
          animationDuration={1200}
          onMouseEnter={handleBarMouseEnter}
          onMouseLeave={handleBarMouseLeave}
        >
          {languages.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.fill || 'var(--background)'}
              fillOpacity={hoveredIndex === index ? 1 : 0.85}
              style={{
                filter:
                  hoveredIndex === index
                    ? 'drop-shadow(0 0 8px rgba(120, 200, 255, 0.7))'
                    : 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value: number) => `${value}h`}
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
