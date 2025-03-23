import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'hyuki.dev',
  description: 'Game Developer and Incheon National University Student',
  href: 'https://hyuki.dev',
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
  { href: 'https://twitter.com/snowflake597', label: 'Twitter' },
  { href: 'snowland.dev@gmail.com', label: 'Email' },
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
