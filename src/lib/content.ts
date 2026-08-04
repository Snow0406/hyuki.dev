import { SITE } from "@/consts"
import { getCollection, type CollectionEntry } from "astro:content"
import { isSubpost } from "@/lib/utils"

export const pageTitle = (title: string) => `${title} | ${SITE.title}`

export async function getPosts(): Promise<CollectionEntry<"blog">[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft)
  return posts
    .filter((post) => !isSubpost(post.id))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}

export async function getSubposts(): Promise<
  Map<string, CollectionEntry<"blog">[]>
> {
  const posts = await getCollection(
    "blog",
    ({ id, data }) => !data.draft && id.split("/").length === 2,
  )
  posts.sort(
    (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
      a.data.date.getTime() - b.data.date.getTime(),
  )
  return Map.groupBy(posts, (post) => post.id.split("/")[0])
}

export type TaggedContent = {
  posts: CollectionEntry<"blog">[]
  projects: CollectionEntry<"projects">[]
}

export async function getTags(): Promise<Map<string, TaggedContent>> {
  const posts = await getPosts()
  const series = await getSubposts()
  const projects = await getCollection("projects")
  const tags = new Map<string, TaggedContent>()

  const getTagged = (tag: string) => {
    const tagged = tags.get(tag)
    if (tagged) return tagged

    const created = { posts: [], projects: [] } satisfies TaggedContent
    tags.set(tag, created)
    return created
  }

  for (const post of posts) {
    const chain = [post, ...(series.get(post.id) ?? [])]
    for (const tag of new Set(
      chain.flatMap((entry) => entry.data.tags ?? []),
    )) {
      getTagged(tag).posts.push(post)
    }
  }

  for (const project of projects) {
    for (const tag of new Set(project.data.tags ?? [])) {
      getTagged(tag).projects.push(project)
    }
  }

  return new Map(
    [...tags].sort(
      ([a, contentA], [b, contentB]) =>
        contentB.posts.length +
          contentB.projects.length -
          (contentA.posts.length + contentA.projects.length) ||
        a.localeCompare(b),
    ),
  )
}
