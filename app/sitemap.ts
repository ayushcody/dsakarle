import type { MetadataRoute } from 'next'

import { LESSONS, PATHS } from '@/lib/curriculum'
import { visualEntries } from '@/lib/visualize'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dsakarle.vercel.app').replace(/\/+$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['/', '/paths', '/visualize', '/dashboard', '/gym', '/map', '/practice', '/about']
  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : 0.8,
    })),
    ...PATHS.map((path) => ({
      url: `${SITE_URL}/paths/${path.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...LESSONS.map((lesson) => ({
      url: `${SITE_URL}/learn/${lesson.slug}`,
      changeFrequency: 'weekly' as const,
      priority: lesson.status === 'live' ? 0.9 : 0.6,
    })),
    ...visualEntries().map((entry) => ({
      url: `${SITE_URL}/visualize/${entry.topic}/${entry.algo}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
