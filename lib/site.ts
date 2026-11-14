/** The site's public origin, with no trailing slash. Used for metadata, robots.txt and the sitemap. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dsakarle.ayushchougula.in').replace(/\/+$/, '')
