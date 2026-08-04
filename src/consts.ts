import type { SvgComponent } from "astro/types"
import Email from "@/assets/icons/email.svg"
import GitHub from "@/assets/icons/github.svg"
import RSS from "@/assets/icons/rss.svg"
import Twitter from "@/assets/icons/twitter.svg"

export const SITE = {
  title: "hy",
  description: "hy's Personal Blog",
  locale: "ko-KR",
  dir: "ltr",
  defaultPageImage: "/static/twitter-card.png",
  defaultPostImage: "/static/twitter-card.png",
} as const

export const NAVIGATION = [
  { href: "/blog", label: "Blog" },
  { href: "/project", label: "Project" },
  { href: "/about", label: "About" },
]

export const SOCIALS: { href: string; label: string; icon: SvgComponent }[] = [
  { href: "https://github.com/snow0406", label: "GitHub", icon: GitHub },
  { href: "https://x.com/hyuki_dev", label: "Twitter", icon: Twitter },
  { href: "mailto:snow@hyuki.dev", label: "Email", icon: Email },
  { href: "/rss.xml", label: "RSS", icon: RSS },
]
