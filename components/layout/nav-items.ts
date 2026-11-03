export interface NavItem {
  label: string
  href: string
}

/** The site's four destinations. One list, used by the header, its mobile sheet and the lesson drawer. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Learn', href: '/learn' },
  { label: 'Map', href: '/map' },
  { label: 'Practice', href: '/practice' },
  { label: 'About', href: '/about' },
];

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
