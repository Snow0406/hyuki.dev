'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { type FunctionComponent, useCallback, useEffect, useState } from 'react'
import Calendar, {
  type Props as ActivityCalendarProps,
} from 'react-activity-calendar'

// Adopted from https://github.com/grubersjoe/react-github-calendar
// Copyright (c) 2019 Jonathan Gruber, MIT License

interface Props extends Omit<ActivityCalendarProps, 'data' | 'theme'> {
  username?: string
}

interface Day {
  date: string
  total: number
  categories: Array<{
    name: string
    total: number
  }>
}

interface ApiResponse {
  days: Array<Day>
  status: string
  is_up_to_date: boolean
  is_up_to_date_pending_future: boolean
  is_stuck: boolean
  is_already_updating: boolean
  range: string
  percent_calculated: number
  writes_only: boolean
  user_id: string
  is_including_today: boolean
  human_readable_range: string
}

interface Activity {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

async function fetchCalendarData(): Promise<ApiResponse> {
  const response = await fetch(
    'https://wakatime.com/share/@Hy/df946edc-3066-4748-bf37-849b26161e78.json',
  )

  if (!response.ok) {
    throw new Error('데이터를 불러오는데 실패했습니다')
  }

  return await response.json()
}

const WakatimeCalendar: FunctionComponent<Props> = ({ ...props }) => {
  const [data, setData] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 다크 모드 감지
  useEffect(() => {
    // 초기 테마 상태 감지
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark'
    setIsDarkMode(isDark)

    // MutationObserver를 사용하여 테마 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          const isDark =
            document.documentElement.getAttribute('data-theme') === 'dark'
          setIsDarkMode(isDark)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)

    fetchCalendarData()
      .then((apiData) => {
        if (!apiData.days || !Array.isArray(apiData.days)) {
          console.error('예상치 못한 API 응답 형식:', apiData)
          setError(new Error('예상치 못한 API 응답 형식'))
          setLoading(false)
          return
        }

        // Wakatime API에서 받은 데이터를 Calendar 컴포넌트에 맞게 변환
        const transformedData = apiData.days.map((day) => {
          // 코딩 시간을 초 단위로 변환 (total은 초 단위)
          const totalSeconds = day.total

          // 레벨 계산 (0-4 사이의 값)
          // 여기서는 간단히 시간에 따라 레벨 설정 (예: 4시간 이상이면 레벨 4)
          // 필요에 따라 조정 가능
          let level: 0 | 1 | 2 | 3 | 4 = 0
          if (totalSeconds > 0) {
            if (totalSeconds < 1800)
              level = 1 // 30분 미만
            else if (totalSeconds < 7200)
              level = 2 // 2시간 미만
            else if (totalSeconds < 14400)
              level = 3 // 4시간 미만
            else level = 4 // 4시간 이상
          }

          return {
            date: day.date,
            count: Math.round(totalSeconds / 60), // 분 단위로 변환
            level: level,
          }
        })

        setData(transformedData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Wakatime 데이터 불러오기 실패:', err)
        setError(err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const selectLastNDays = (activities: Activity[], days: number) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)

    return activities.filter((activity) => {
      const activityDate = new Date(activity.date)
      return activityDate >= startDate && activityDate <= today
    })
  }

  const themeColors = {
    light: [
      'var(--background)',
      'var(--chart-1)',
      'var(--chart-3)',
      'var(--chart-5)',
      'var(--chart-6)',
    ],
    dark: [
      'var(--background)',
      'var(--chart-7)',
      'var(--chart-5)',
      'var(--chart-3)',
      'var(--chart-1)',
    ],
  }

  return (
    <>
      {/* 모바일 화면 (sm 미만): 60일 데이터 */}
      <div className="m-4 scale-110 sm:hidden">
        <Calendar
          data={selectLastNDays(data, 60)}
          theme={{
            light: themeColors.light,
            dark: themeColors.dark,
          }}
          colorScheme={isDarkMode ? 'dark' : 'light'}
          blockSize={20}
          blockMargin={6}
          blockRadius={7}
          {...props}
          maxLevel={4}
          hideTotalCount
          hideColorLegend
        />
      </div>

      {/* 중간 화면 (sm 이상, xl 미만): 133일 데이터 */}
      <div className="m-4 hidden sm:block xl:hidden">
        <Calendar
          data={selectLastNDays(data, 133)}
          theme={{
            light: themeColors.light,
            dark: themeColors.dark,
          }}
          colorScheme={isDarkMode ? 'dark' : 'light'}
          blockSize={20}
          blockMargin={6}
          blockRadius={7}
          {...props}
          maxLevel={4}
          hideTotalCount
        />
      </div>

      {/* 대형 화면 (xl 이상): 180일 데이터 */}
      <div className="m-4 hidden xl:block">
        <Calendar
          data={selectLastNDays(data, 161)}
          theme={{
            light: themeColors.light,
            dark: themeColors.dark,
          }}
          colorScheme={isDarkMode ? 'dark' : 'light'}
          blockSize={20}
          blockMargin={6}
          blockRadius={7}
          {...props}
          maxLevel={4}
          hideTotalCount
        />
      </div>
    </>
  )
}

export default WakatimeCalendar
