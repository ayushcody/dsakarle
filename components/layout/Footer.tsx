import Link from 'next/link';

import { Logo } from '@/components/brand/Logo';
import { PATHS } from '@/lib/curriculum';

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

const REPO = 'https://github.com/ayushcody/dsakarle';

export default function Footer() {
  const columns: Array<{ title: string; links: FooterLink[] }> = [
    { title: 'Learn', links: PATHS.map((path) => ({ label: path.title, href: `/paths/${path.id}` })) },
    {
      title: 'Practice',
      links: [
        { label: 'Practice problems', href: '/practice' },
        { label: 'Pattern gym', href: '/gym' },
        { label: 'Pattern map', href: '/map' },
      ],
    },
    { title: 'Your progress', links: [{ label: 'Dashboard', href: '/dashboard' }] },
    {
      title: 'About',
      links: [
        { label: 'About DSA Karle', href: '/about' },
        { label: 'GitHub repo', href: REPO, external: true },
        { label: 'Report an issue', href: `${REPO}/issues/new`, external: true },
      ],
    },
  ];

  const linkClass =
    'inline-flex min-h-[32px] items-center rounded-cell font-sans text-[15px] text-ink-2 hover:text-coral-ink hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';

  return (
    <footer data-testid="site-footer" className="mt-auto border-t border-rule bg-paper-sunken">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:py-16 xl:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo href="/" size="md" className="-ml-1 px-1 py-1" />
            <p className="mt-3 font-sans text-[16px] font-semibold leading-6 text-ink">
              <span className="text-coral-ink">Karle</span> means &ldquo;do it.&rdquo; Don&rsquo;t just read it.
            </p>
            <p className="mt-2 max-w-[34ch] text-[15px] leading-6 text-ink-2">
              A free, open-source way to learn data structures and algorithms by watching them run.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="t-eyebrow mb-3">{column.title}</h2>
              <ul className="flex flex-col gap-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {link.label}<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-rule pt-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} DSA Karle. Open source.</p>
          <p>Your progress stays in this browser. No accounts, no tracking.</p>
        </div>
      </div>
    </footer>
  );
}
