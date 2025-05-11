import { getCollection, type CollectionEntry } from 'astro:content'

export const PROJECT_STATUS = ['In Progress', 'Completed', 'Planned', 'Paused']

export async function getAllPosts(
  isShowHidden: boolean = false,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts
    .filter((post) => !post.data.draft && (isShowHidden || !post.data.hidden))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getRecentPost(): Promise<CollectionEntry<'blog'>> {
  const posts = await getAllPosts()
  return posts.at(0)!
}

export async function getAdjacentPosts(
  currentId: string,
  parentTitle?: string,
): Promise<{
  prev: CollectionEntry<'blog'> | null
  next: CollectionEntry<'blog'> | null
}> {
  let posts = await getAllPosts()

  let postsList
  if (parentTitle)
    postsList = posts.filter((p) => p.data.parentTitle === parentTitle)
  else postsList = posts.filter((post) => post.data.hidden !== true)

  const currentIndex = postsList.findIndex((post) => post.id === currentId)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  return {
    next: currentIndex > 0 ? postsList[currentIndex - 1] : null,
    prev:
      currentIndex < postsList.length - 1 ? postsList[currentIndex + 1] : null,
  }
}

export async function getAllAuthors(): Promise<CollectionEntry<'authors'>[]> {
  return await getCollection('authors')
}

export async function getAllProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects')
  return projects.sort((a, b) => {
    const statusA = a.data.status || 'Other'
    const statusB = b.data.status || 'Other'

    const statusComparison =
      PROJECT_STATUS.indexOf(statusA) - PROJECT_STATUS.indexOf(statusB)
    if (statusComparison !== 0) return statusComparison

    const dateA = a.data.startDate?.getTime() || 0
    const dateB = b.data.startDate?.getTime() || 0
    return dateB - dateA
  })
}

export async function getAllTags(): Promise<Map<string, number>> {
  const posts = await getAllPosts()

  return posts.reduce((acc, post) => {
    post.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getSortedTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags()

  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export function groupProjectsByStatus(
  projects: CollectionEntry<'projects'>[],
): Record<string, CollectionEntry<'projects'>[]> {
  return projects.reduce(
    (acc: Record<string, CollectionEntry<'projects'>[]>, project) => {
      const status = project.data.status || 'Other'
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(project)
      return acc
    },
    {},
  )
}

export function groupPostsByYear(
  posts: CollectionEntry<'blog'>[],
): Record<string, CollectionEntry<'blog'>[]> {
  return posts.reduce(
    (acc: Record<string, CollectionEntry<'blog'>[]>, post) => {
      const year = post.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(post)
      return acc
    },
    {},
  )
}

export async function parseAuthors(authorIds: string[] = []) {
  if (!authorIds.length) return []

  const allAuthors = await getAllAuthors()
  const authorMap = new Map(allAuthors.map((author) => [author.id, author]))

  return authorIds.map((id) => {
    const author = authorMap.get(id)

    return {
      id,
      name: author?.data?.name || id,
      avatar: author?.data?.avatar || '/static/logo.png',
      isRegistered: !!author,
    }
  })
}

export async function getPostsByAuthor(
  authorId: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.authors?.includes(authorId))
}

export async function getPostsByTag(
  tag: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.tags?.includes(tag))
}
