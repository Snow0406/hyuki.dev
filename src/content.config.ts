import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z
        .string()
        .max(
          60,
          'Title should be 60 characters or less for optimal Open Graph display.',
        ),
      description: z
        .string()
        .max(
          155,
          'Description should be 155 characters or less for optimal Open Graph display.',
        ),
      date: z.coerce.date(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      authors: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
    }),
})

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    pronouns: z.string().optional(),
    avatar: z.string().url(),
    bio: z.string().optional(),
    mail: z.string().email().optional(),
    website: z.string().url().optional(),
    twitter: z.string().url().optional(),
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    discord: z.string().url().optional(),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      image: image().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      status: z
        .enum(['Completed', 'In Progress', 'Planned', 'Paused'])
        .optional(),
      link: z
        .array(
          z.object({
            icon: z.string().optional(),
            name: z.string(),
            url: z.string().url().optional(),
          }),
        )
        .optional(),
      draft: z.boolean().optional(),
      contributions: z.array(z.string()).optional(),
      team: z
        .array(
          z.object({
            name: z.string(),
            role: z.string().optional(),
          }),
        )
        .optional(),
    }),
})

export const collections = { blog, authors, projects }
