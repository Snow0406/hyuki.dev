import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'hyuki.dev',
  description: "hy's Personal Blog",
  href: 'https://hyuki.dev',
  author: 'hy',
  locale: 'ko_KR',
  featuredPostCount: 1,
  postsPerPage: 3,
}

export const NAV_LINKS: SocialLink[] = [
  { href: '/', label: 'home' },
  { href: '/blog', label: 'blog' },
  { href: '/project', label: 'project' },
  { href: '/tags', label: 'tags' },
]

export const SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://github.com/snow0406', label: 'GitHub' },
  { href: 'https://x.com/hyuki_dev', label: 'Twitter' },
  { href: 'mailto:snow@hyuki.dev', label: 'Email' },
  { href: '/rss.xml', label: 'RSS' },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
