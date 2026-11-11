export interface NavItem {
  label: string
  href: string
}

/** The site's destinations. One list, used by the header, its mobile sheet and the lesson drawer. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Paths', href: '/paths' },
  { label: 'Gym', href: '/gym' },
  { label: 'Practice', href: '/practice' },
  { label: 'Map', href: '/map' },
  { label: 'About', href: '/about' },
];

/** Active by pathname prefix. Lesson pages (/learn/*) belong to "Paths". */
export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/paths' && (pathname === '/learn' || pathname.startsWith('/learn/'))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
