import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-dark)] text-white py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H8V18H4V6Z" fill="var(--accent-coral)"/>
              <path d="M16 6H20V18H16V6Z" fill="var(--accent-coral)"/>
              <path d="M8 10H16V14H8V10Z" fill="var(--accent-coral)"/>
            </svg>
            <span className="font-lora font-bold text-xl">DSAKarle</span>
          </div>
          <p className="text-[var(--text-muted)] font-dmsans text-sm mb-6 max-w-sm">DSA? Karle. The visual-first way to master algorithms and ace your interviews.</p>
        </div>
        
        <div>
          <h3 className="font-dmsans font-semibold mb-4 text-[var(--border)]">Learn</h3>
          <ul className="space-y-2 font-dmsans text-sm text-[var(--text-muted)]">
            <li><Link href="/learn/arrays" className="hover:text-white transition-colors">Arrays</Link></li>
            <li><Link href="/learn/sliding-window" className="hover:text-white transition-colors">Sliding Window</Link></li>
            <li><Link href="/learn/trees" className="hover:text-white transition-colors">Binary Trees</Link></li>
          </ul>
        </div>

        <div>
           <h3 className="font-dmsans font-semibold mb-4 text-[var(--border)]">Resources</h3>
          <ul className="space-y-2 font-dmsans text-sm text-[var(--text-muted)]">
            <li><Link href="/practice" className="hover:text-white transition-colors">Practice</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-[var(--text-secondary)] opacity-50 text-sm font-dmsans flex justify-between items-center text-[var(--text-muted)]">
        <p>&copy; {new Date().getFullYear()} DSAKarle. Built for learning.</p>
      </div>
    </footer>
  );
}
