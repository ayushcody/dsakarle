import type { MetadataRoute } from 'next'

// The manifest is read outside the page, so CSS variables are not available: hex is unavoidable.
// These mirror the light-theme tokens in docs/DESIGN_SYSTEM.md (--paper for both colours, so the
// splash screen and the browser chrome match the notebook page).
const PAPER = '#FBF5EF'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DSA Karle',
    short_name: 'DSA Karle',
    description: 'Learn data structures and algorithms by watching them run, then write them yourself.',
    start_url: '/',
    display: 'standalone',
    theme_color: PAPER,
    background_color: PAPER,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
