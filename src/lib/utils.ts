import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | undefined): string {
  if (!date) return '-1'
  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.')
    .replace(/\.$/, '')
}

export function getStatusInfo(status: string | undefined): {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success'
  icon: string
} {
  if (!status) return { variant: 'default', icon: 'lucide:help-circle' }

  const statusMap = {
    Completed: { variant: 'default' as const, icon: 'lucide:check-circle' },
    'In Progress': { variant: 'success' as const, icon: 'lucide:loader' },
    Planned: { variant: 'secondary' as const, icon: 'lucide:calendar' },
    Paused: { variant: 'destructive' as const, icon: 'lucide:pause-circle' },
  }

  return (
    statusMap[status as keyof typeof statusMap] || {
      variant: 'default',
      icon: 'lucide:help-circle',
    }
  )
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, '')
  const wordCount = textOnly.split(/\s+/).length
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed()
  return `${readingTimeMinutes} min read`
}

export function getElapsedTime(unixTimestamp: number): string {
  const createdAt = new Date(unixTimestamp)
  const now = new Date()
  let difference = now.getTime() - createdAt.getTime()
  const hours = Math.floor(difference / (1000 * 60 * 60))
  difference -= hours * (1000 * 60 * 60)
  const minutes = Math.floor(difference / (1000 * 60))
  difference -= minutes * (1000 * 60)
  const seconds = Math.floor(difference / 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} elapsed`
}
