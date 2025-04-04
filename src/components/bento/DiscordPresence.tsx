import { useMemo, useState, useEffect } from 'react'
import { useLanyard } from 'react-use-lanyard'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getElapsedTime } from '@/lib/utils'
import AvatarComponent from '@/components/ui/avatar'

// 타입 정의
type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline'

interface Activity {
  type: number
  application_id?: string
  name?: string
  details?: string
  state?: string
  timestamps?: {
    start?: number
    end?: number
  }
  assets?: {
    large_image?: string
    small_image?: string
  }
}

// 스켈레톤 로딩 컴포넌트
const DiscordSkeleton = () => (
  <div className="relative overflow-hidden sm:aspect-square">
    <div className="grid size-full grid-rows-4">
      <Skeleton className="bg-secondary/50" />
      <div className="row-span-3 flex flex-col gap-3 p-3 xl:gap-2 xl:p-2">
        <div className="flex justify-between gap-x-1">
          <Skeleton className="-mt-[3rem] aspect-square size-20 rounded-full" />
          <Skeleton className="h-6 w-[118px] rounded-xl xl:h-5 xl:w-[100px]" />
        </div>
        <Skeleton className="flex h-[62px] flex-col gap-y-1 rounded-xl p-3 xl:h-[54px] xl:gap-y-0.5 xl:p-2" />
        <Skeleton className="flex grow rounded-xl p-2 xl:p-1.5" />
      </div>
    </div>
  </div>
)

// 상태 표시 아이콘 컴포넌트
const StatusIndicator = ({ status }: { status: DiscordStatus }) => {
  const statusClasses = {
    online: 'bg-primary flex items-center justify-center',
    idle: 'bg-primary',
    dnd: 'bg-destructive flex items-center justify-center',
    offline: 'bg-muted-foreground flex items-center justify-center',
  }

  return (
    <div
      className={cn(
        'border-background absolute right-0 bottom-0 size-6 rounded-full border-4 xl:size-5 xl:border-3',
        statusClasses[status],
      )}
    >
      {status === 'idle' && (
        <div className="bg-background size-[10px] rounded-full xl:size-[8px]" />
      )}
      {status === 'dnd' && (
        <div className="bg-background h-[4px] w-[11px] rounded-full xl:h-[3px] xl:w-[9px]" />
      )}
      {status === 'offline' && (
        <div className="bg-background size-2 rounded-full xl:size-[6px]" />
      )}
    </div>
  )
}

// 활동 표시 컴포넌트
const ActivityDisplay = ({ activity }: { activity: Activity }) => {
  const [elapsedTime, setElapsedTime] = useState('')

  useEffect(() => {
    if (!activity?.timestamps?.start) return

    const updateElapsedTime = () => {
      if (activity.timestamps?.start) {
        setElapsedTime(getElapsedTime(activity.timestamps.start))
      }
    }

    updateElapsedTime()
    const intervalId = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(intervalId)
  }, [activity])

  return (
    <div className="flex w-full items-center gap-x-3 xl:gap-x-2">
      <div
        className="relative aspect-square h-full w-auto flex-shrink-0 rounded-md bg-contain"
        style={{
          backgroundImage: `url('https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets?.large_image}.png')`,
        }}
      >
        {activity.assets?.small_image && (
          <img
            src={`https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`}
            alt="Now Playing"
            width={20}
            height={20}
            className="xl:width-[16px] xl:height-[16px] absolute -right-1 -bottom-1 rounded-full border-2 xl:-right-[2px] xl:-bottom-[2px] xl:border-[1.5px]"
          />
        )}
      </div>
      <div className="my-2 flex min-w-0 flex-1 flex-col gap-y-1 overflow-hidden xl:my-1.5 xl:gap-y-0.5">
        {activity.name && (
          <div className="mb-0.5 truncate text-xs leading-none xl:mb-0 xl:text-[10px]">
            {activity.name}
          </div>
        )}
        {activity.details && (
          <div className="text-muted-foreground truncate text-[10px] leading-none xl:text-[9px]">
            {activity.details}
          </div>
        )}
        {activity.state && (
          <div className="text-muted-foreground truncate text-[10px] leading-none xl:text-[9px]">
            {activity.state}
          </div>
        )}
        {elapsedTime && (
          <div className="text-muted-foreground text-[11px] leading-none xl:text-[9px]">
            {elapsedTime}
          </div>
        )}
      </div>
    </div>
  )
}

// 메인 컴포넌트
const DiscordPresence = () => {
  const { data: lanyard, isLoading } = useLanyard({
    userId: '453729488191094809',
  })

  const mainActivity = useMemo(() => {
    if (!lanyard?.data?.activities) return null
    return lanyard.data.activities.find(
      (activity) => activity.type === 0 && activity.assets,
    )
  }, [lanyard?.data?.activities])

  if (isLoading) {
    return <DiscordSkeleton />
  }

  if (!lanyard || !lanyard.data) {
    return null
  }

  const status = lanyard.data.discord_status as DiscordStatus

  return (
    <div className="relative overflow-hidden sm:aspect-square">
      <div className="grid size-full grid-rows-4">
        <div className="bg-secondary/50"></div>
        <div className="row-span-3 flex flex-col gap-3 p-3 xl:gap-2 xl:p-2">
          {/* 프로필 정보 */}
          <div className="flex justify-between gap-x-1">
            <div className="relative">
              <AvatarComponent
                src="/static/avatar.webp"
                alt="Avatar"
                fallback="e"
                className="-mt-[3rem] aspect-square size-20 rounded-full"
              />
              <StatusIndicator status={status} />
              <div className="pointer-events-none absolute -inset-4">
                <img
                  src="/static/discord_avatar_decoration.gif"
                  alt="Avatar Decoration"
                  className="absolute -top-11 left-1 size-28"
                />
              </div>
            </div>
            <div className="bg-secondary/50 flex items-center rounded-xl px-2 xl:px-1.5">
              <img
                src="/static/discord_badge.svg"
                alt="Discord Badges"
                width={104}
                height={24}
                className="xl:h-[20px] xl:w-[90px]"
              />
            </div>
          </div>

          {/* 사용자 정보 */}
          <div className="bg-secondary/50 flex flex-col gap-y-1 rounded-xl p-3 xl:gap-y-0.5 xl:p-2">
            <span className="text-base leading-none xl:text-sm">hy</span>
            <span className="text-muted-foreground text-xs leading-none xl:text-[10px]">
              @snowdev._.
            </span>
          </div>

          {/* 활동 정보 */}
          <div className="bg-secondary/50 flex grow rounded-xl px-3 py-2 xl:px-2 xl:py-1.5">
            {mainActivity ? (
              <ActivityDisplay activity={mainActivity as Activity} />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 xl:gap-0.5">
                <div className="text-muted-foreground text-[10px] xl:text-[8px]">
                  No status!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscordPresence
