import Link from 'next/link';

import { Logo } from '@/components/brand/Logo';
import { liveLessons } from '@/lib/curriculum';

interface FooterLink {
  label: string
  href: string
}

export default function Footer() {
  const live = liveLessons();

  const columns: Array<{ title: string; links: FooterLink[] }> = [
    {
      title: 'Learn',
      links: [
        { label: 'Data Structures', href: '/learn#data-structures' },
        { label: 'Algorithms', href: '/learn#algorithms' },
        { label: 'Pattern map', href: '/map' },
        ...live.slice(0, 3).map((lesson) => ({ label: lesson.title, href: `/learn/${lesson.slug}` })),
      ],
    },
    { title: 'Practice', links: [{ label: 'Practice problems', href: '/practice' }] },
    { title: 'About', links: [{ label: 'About DSA Karle', href: '/about' }] },
  ];

  return (
    <footer data-testid="site-footer" className="mt-auto border-t border-rule bg-paper-sunken">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:py-16 xl:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="sm:col-span-2 md:col-span-1">
            <Logo href="/" size="md" className="-ml-1 px-1 py-1" />
            <p className="mt-3 font-serif text-[17px] font-semibold leading-6 text-ink">
              <span className="text-coral-ink">Karle</span> means &ldquo;do it.&rdquo; Don&rsquo;t just read it.
            </p>
            <p className="mt-2 max-w-[34ch] text-[15px] leading-6 text-ink-2">
              Learn data structures and algorithms by watching them run.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="t-eyebrow mb-3">{column.title}</h2>
              <ul className="flex flex-col gap-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-[32px] items-center rounded-cell font-sans text-[15px] text-ink-2 hover:text-coral-ink hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-rule pt-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} DSA Karle.</p>
          <p>Lessons are marked Live or Draft, so you always know what is finished.</p>
        </div>
      </div>
    </footer>
  );
}
