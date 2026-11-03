import type { MetadataRoute } from 'next'

import { LESSONS } from '@/lib/curriculum'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dsakarle.vercel.app').replace(/\/+$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['/', '/learn', '/map', '/practice', '/about']
  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : 0.8,
    })),
    ...LESSONS.map((lesson) => ({
      url: `${SITE_URL}/learn/${lesson.slug}`,
      changeFrequency: 'weekly' as const,
      priority: lesson.status === 'live' ? 0.9 : 0.6,
    })),
  ]
}
