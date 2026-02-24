'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 h-[52px] backdrop-blur border-b border-sb-border" style={{ backgroundColor: 'rgba(250, 250, 250, 0.72)' }}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <svg width="31" height="20" viewBox="0 0 31 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.7488 0L26.3369 4.5H4.6633L7.2514 0H23.7488Z" fill="#0A0A0A"/>
            <path d="M19.2175 15.5C21.3921 11.9466 24.0831 8.7437 27.2137 6.0247L29.5 10C26.3837 12.842 23.7716 16.2261 21.8054 20H9.1946C7.2284 16.2261 4.6163 12.842 1.5 10L3.7864 6.0247C6.9171 8.7437 9.608 11.9465 11.7826 15.5H19.2175Z" fill="#0A0A0A"/>
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
