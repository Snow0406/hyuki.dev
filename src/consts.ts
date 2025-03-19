export type Site = {
  TITLE: string
  DESCRIPTION: string
  EMAIL: string
  NUM_POSTS_ON_HOMEPAGE: number
  POSTS_PER_PAGE: number
  SITEURL: string
}

export type Link = {
  href: string
  label: string
}

export const SITE: Site = {
  TITLE: 'hyuki.dev',
  DESCRIPTION: 'Game Developer and Incheon National University Student',
  EMAIL: 'snow@hyuki.dev',
  NUM_POSTS_ON_HOMEPAGE: 2,
  POSTS_PER_PAGE: 4,
  SITEURL: 'https://hyuki.dev',
}

export const NAV_LINKS: Link[] = [
  { href: '/', label: 'home' },
  { href: '/blog', label: 'blog' },
  { href: '/project', label: 'project' },
  { href: '/tags', label: 'tags' },
]

export const SOCIAL_LINKS: Link[] = [
  { href: 'https://github.com/snow0406', label: 'GitHub' },
  { href: 'https://twitter.com/snowflake597', label: 'Twitter' },
  { href: 'snowland.dev@gmail.com', label: 'Email' },
  { href: '/rss.xml', label: 'RSS' },
]
