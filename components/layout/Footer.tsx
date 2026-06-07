import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-dark)] text-white py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
             <Image src="/DSAKarle_Logo.png" alt="DSA Karle Logo" width={32} height={32} className="object-contain" />
            <span className="font-dmsans font-bold text-xl">DSA Karle</span>
          </div>
          <p className="text-[var(--text-muted)] font-dmsans text-sm mb-6 max-w-sm">Build intuition. Solve problems.<br/>Master data structures and algorithms.</p>
        </div>
        
        <div>
          <h3 className="font-dmsans font-semibold mb-4 text-[var(--border)]">Learn</h3>
          <ul className="space-y-2 font-dmsans text-sm text-[var(--text-muted)]">
            <li><Link href="/learn" className="hover:text-white transition-colors">All Topics</Link></li>
            <li><Link href="/learn" className="hover:text-white transition-colors">Learning Paths</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-dmsans font-semibold mb-4 text-[var(--border)]">Curriculum</h3>
          <ul className="space-y-2 font-dmsans text-sm text-[var(--text-muted)]">
            <li><Link href="/learn" className="hover:text-white transition-colors">Browse Topics</Link></li>
            <li><Link href="/learn" className="hover:text-white transition-colors">Roadmap</Link></li>
          </ul>
        </div>

        <div>
           <h3 className="font-dmsans font-semibold mb-4 text-[var(--border)]">Practice</h3>
          <ul className="space-y-2 font-dmsans text-sm text-[var(--text-muted)]">
            <li><Link href="/practice" className="hover:text-white transition-colors">Problem Sets</Link></li>
            <li><Link href="/practice" className="hover:text-white transition-colors">Daily Challenge</Link></li>
          </ul>
        </div>

        <div>
           <h3 className="font-dmsans font-semibold mb-4 text-[var(--border)]">Resources & About</h3>
          <ul className="space-y-2 font-dmsans text-sm text-[var(--text-muted)]">
            <li><Link href="/about" className="hover:text-white transition-colors">About DSA Karle</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Cheat Sheets</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[var(--text-secondary)] opacity-50 text-sm font-dmsans flex justify-between items-center text-[var(--text-muted)]">
        <p>&copy; {new Date().getFullYear()} DSA Karle. All rights reserved.</p>
      </div>
    </footer>
  );
}
