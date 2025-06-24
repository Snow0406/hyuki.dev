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

export function calculateWordCountFromHtml(
  html: string | null | undefined,
): number {
  if (!html) return 0
  const textOnly = html.replace(/<[^>]+>/g, '')
  return textOnly.split(/\s+/).filter(Boolean).length
}

export function readingTime(wordCount: number): string {
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200))
  return `${readingTimeMinutes} min read`
}

export function getHeadingMargin(depth: number): string {
  const margins: Record<number, string> = {
    3: 'ml-4',
    4: 'ml-8',
    5: 'ml-12',
    6: 'ml-16',
  }
  return margins[depth] || ''
}
