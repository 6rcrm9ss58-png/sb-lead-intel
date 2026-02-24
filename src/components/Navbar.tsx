'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 h-[52px] backdrop-blur border-b border-sb-border" style={{ backgroundColor: 'rgba(250, 250, 250, 0.72)' }}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-sb-orange">
            <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-sb-orange">SB</span><span className="text-sb-text">Lead Intel</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-sb-text hover:text-sb-orange transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-sb-text-secondary hover:text-sb-orange transition-colors"
          >
            Pipeline
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-sb-text-secondary hover:text-sb-orange transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
